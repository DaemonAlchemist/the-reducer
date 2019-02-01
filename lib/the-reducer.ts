import { prop, remove, switchOn, _ } from 'atp-pointfree';
import { Reducer, ReducerMap, PartialEntity, ChildSelector, Entity, EntityAction, EntityActionType, PartialFilter, IEntityAction, IEntityActions, IEntityAddAction, IEntityBase, IEntityContainer, IEntityDefinition, IEntityDeleteAction, IEntityReducer, IEntitySelectors, IEntityState, IEntityUpdateAction, ParentSelector, IReducerContainer, IReducerItem} from './the-reducer.types';
import {combineReducers, ReducersMapObject, AnyAction} from 'redux';

// Reducer
const initialState = {};
const entityReducer = <T extends IEntityBase>(def:IEntityDefinition) => (state:IEntityState<T> = initialState, action:EntityAction<T>):IEntityState<T> =>
    action.entityType === def.entity && action.module === def.module
        ? switchOn(action.type, {
            [EntityActionType.Add]: () => Object.assign({}, state, {
                [(action as IEntityAddAction<T>).entity.id]: (action as IEntityAddAction<T>).entity
            }),
            [EntityActionType.Update]: () => Object.assign({}, state, {
                [(action as IEntityUpdateAction<T>).entity.id]: Object.assign(
                    {},
                    state[(action as IEntityUpdateAction<T>).entity.id] || {},
                    (action as IEntityUpdateAction<T>).entity)
            }),
            [EntityActionType.Delete]: () => remove((action as IEntityDeleteAction).id)(state),
            default: () => state,
          })
        : state;

const createEntityReducer = <T extends IEntityBase>(def:IEntityDefinition):IEntityReducer<T> => ({
    [def.module]: {
        [def.entity]: entityReducer<T>(def)
    }
});

// Recursive reducer combiner
const parseItem = (item:IReducerItem, key:string):ReducerMap => ({
    [key]: typeof item === 'function' ? item : combineReducersResursive(item)
});
const combine = (combined:ReducerMap, cur:ReducerMap):ReducerMap => Object.assign({}, combined, cur);
export const combineReducersResursive = (obj:IReducerContainer):Reducer => combineReducers<any, AnyAction>(
    Object.keys(obj)
        .map((key:string):ReducerMap => parseItem(obj[key], key))
        .reduce(combine, {})
);

// TODO:  Create entity reducer combiner that optimizes performance

// Action creators
const createEntityActions = <T extends IEntityBase>(def:IEntityDefinition):IEntityActions<T> => ({
    add:(entity:T) => ({type:EntityActionType.Add, entity, entityType: def.entity, module: def.module}),
    update:(entity:PartialEntity<T>) => ({type: EntityActionType.Update, entity, entityType: def.entity, module: def.module}),
    delete:(id:string) => ({type: EntityActionType.Delete, id, entityType: def.entity, module: def.module}),
});

const getEntities = <T extends IEntityBase>(state:IEntityContainer<T>, def:IEntityDefinition):PartialEntity<T>[] =>
    state[def.module] && state[def.module][def.entity]
        ? Object.keys(state[def.module][def.entity]).map((key:string) => state[def.module][def.entity][key])
        : [];

const getEntity = <T extends IEntityBase>(state:IEntityContainer<T>, def:IEntityDefinition, id:string):PartialEntity<T> | undefined =>
    state[def.module] && state[def.module][def.entity] && state[def.module][def.entity][id]
        ? state[def.module][def.entity][id]
        : undefined;

// Selectors
const selectAll = <T>() => (obj:T):boolean => true;
const createEntitySelectors = <T extends IEntityBase>(def:IEntityDefinition):IEntitySelectors<T> => ({
    get:(state:IEntityContainer<T>, id:string):PartialEntity<T> | undefined => getEntity<T>(state, def, id),
    getMultiple: (state:IEntityContainer<T>, f:PartialFilter<T> = selectAll<PartialEntity<T>>()):PartialEntity<T>[] =>
        getEntities(state, def).filter(f),
});

export const getChildren = <C extends IEntityBase>(childDef:IEntityDefinition, field:string):ChildSelector<C> =>
    (state:IEntityContainer<C>, parentId:string):PartialEntity<C>[] =>
        entity<C>(childDef).getMultiple(state, (child:PartialEntity<C>) => ((<any>child)[field] as string) === parentId)

export const getParent = <P extends IEntityBase, C extends IEntityBase>(parentDef:IEntityDefinition, childDef:IEntityDefinition, field:string):ParentSelector<P, C> =>
    (state:IEntityContainer<P> & IEntityContainer<C>, childId:string):PartialEntity<P> | undefined =>
        entity<P>(parentDef).get(state, _(prop(field), entity<C>(childDef).get(state, childId)));

export const getRelated = <R extends IEntityBase, B extends IEntityBase>(rDef:IEntityDefinition, bDef:IEntityDefinition, aField:string, bField:string) =>
    (state:IEntityContainer<R> & IEntityContainer<B>, aId:string) => {
        const bIds:string[] = entity<R>(rDef).getMultiple(state, (r:PartialEntity<R>) => ((<any>r)[aField] as string) === aId).map(prop(bField));
        return entity<B>(bDef).getMultiple(state, (b:PartialEntity<B>):boolean => bIds.includes(b.id));
    };

// Boilerplate
export const entity = <T extends IEntityBase>(def:IEntityDefinition):Entity<T> => ({
    ...createEntityActions<T>(def),
    ...createEntitySelectors<T>(def),
    reducer: createEntityReducer<T>(def),
});

// ----------------------------------------------
interface IComicArc {
    id:string;
    name:string;
    url:string;
}

const arcDefinition = {
    module: "comic",
    entity: "arc",
    idField: "id",
}

interface IComicPage {
    id:string;
    name:string;
    description:string;
    arcId:number;
    sequence:number;
}

const pageDefinition = {
    module: "comic",
    entity: "page",
    idField: "id",
}

export interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
export const arcRedux:IArcRedux = {
    ...entity<IComicArc>(arcDefinition),
    pages: getChildren<IComicPage>(pageDefinition, "arcId"),
};

export interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
}
export const pageRedux:IPageRedux = {
    ...entity<IComicPage>(pageDefinition),
    arc: getParent<IComicArc, IComicPage>(arcDefinition, pageDefinition, "arcId")
};

// ----------------------------------------------

interface IToggle {
    id:string;
    isVisible:boolean;
}

const toggleDefinition = {
    module: "ui",
    entity: "toggle",
    idField: "id"
}

interface IToggleRedux {
    reducer: IEntityReducer<IToggle>,
    show: (id:string) => IEntityAction;
    hide: (id:string) => IEntityAction;
    isOn: (state:IEntityContainer<IToggle>, id:string) => boolean;
}

export const t = entity<IToggle>(toggleDefinition);
export const toggleRedux:IToggleRedux = {
    reducer: t.reducer,
    show: (id:string) => t.update({id, isVisible: true}),
    hide: (id:string) => t.update({id, isVisible: false}),
    isOn: (state:IEntityContainer<IToggle>, id:string) => (t.get(state, id) || {isVisible: false}).isVisible || false
};
