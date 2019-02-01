import { prop, remove, switchOn, _ } from 'atp-pointfree';
import { PartialEntity, ChildSelector, Entity, EntityAction, EntityActionType, EntityFilter, IEntityAction, IEntityActions, IEntityAddAction, IEntityBase, IEntityContainer, IEntityDefinition, IEntityDeleteAction, IEntityReducer, IEntitySelectors, IEntityState, IEntityUpdateAction, ParentSelector } from './the-reducer.types';

// Reducer
const initialState = {};
// TODO:  Validate that T's id field is a string
const entityReducer = <T extends IEntityBase>(def:IEntityDefinition) => (state:IEntityState<T> = initialState, action:EntityAction<T>):IEntityState<T> => switchOn(action.type, {
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
});

export const createEntityReducer = <T extends IEntityBase>(def:IEntityDefinition):IEntityReducer<T> => ({
    [def.module]: {
        [def.entity]: entityReducer<T>(def)
    }
});

// Action creators
export const createEntityActions = <T extends IEntityBase>(def:IEntityDefinition):IEntityActions<T> => ({
    add:(entity:T) => ({type:EntityActionType.Add, entity}),
    update:(entity:PartialEntity<T>) => ({type: EntityActionType.Update, entity}),
    delete:(id:string) => ({type: EntityActionType.Delete, id}),
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
export const createEntitySelectors = <T extends IEntityBase>(def:IEntityDefinition):IEntitySelectors<T> => ({
    get:(state:IEntityContainer<T>, id:string):PartialEntity<T> | undefined => getEntity<T>(state, def, id),
    getMultiple: (state:IEntityContainer<T>, f:EntityFilter<T> = selectAll<T>()):PartialEntity<T>[] => getEntities(state, def).filter(f),
});

export const getChildren = <C extends IEntityBase>(childDef:IEntityDefinition, field:string):ChildSelector<C> =>
    (state:IEntityContainer<C>, parentId:string):PartialEntity<C>[] => entityRedux<C>(childDef).getMultiple(state, (child:C) => child[field] === parentId)

export const getParent = <P extends IEntityBase, C extends IEntityBase>(parentDef:IEntityDefinition, childDef:IEntityDefinition, field:string):ParentSelector<P, C> =>
    (state:IEntityContainer<P> & IEntityContainer<C>, childId:string):PartialEntity<P> | undefined =>
        entityRedux<P>(parentDef).get(state, _(prop(field), entityRedux<C>(childDef).get(state, childId)));

export const getRelated = <R extends IEntityBase, B extends IEntityBase>(rDef:IEntityDefinition, bDef:IEntityDefinition, aField:string, bField:string) =>
    (state:IEntityContainer<R> & IEntityContainer<B>, aId:number) => {
        const bIds:number[] = entityRedux<R>(rDef).getMultiple(state, (r:R) => r[aField] === aId).map(prop(bField));
        return entityRedux<B>(bDef).getMultiple(state, (b:B):boolean => bIds.includes(b.id));
    };

// Boilerplate
export const entityRedux = <T extends IEntityBase>(def:IEntityDefinition):Entity<T> => ({
    ...createEntityActions<T>(def),
    ...createEntitySelectors<T>(def)
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

export const arcReducer = entityReducer<IComicArc>(arcDefinition);
export interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
export const arcRedux:IArcRedux = {
    ...entityRedux<IComicArc>(arcDefinition),
    pages: getChildren<IComicPage>(pageDefinition, "arcId"),
};

export const pageReducer = entityReducer<IComicPage>(pageDefinition);
export interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
}
export const pageRedux:IPageRedux = {
    ...entityRedux<IComicPage>(pageDefinition),
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
    show: (id:string) => IEntityAction;
    hide: (id:string) => IEntityAction;
    isOn: (state:IEntityContainer<IToggle>, id:number) => boolean;
}

export const toggleReducer = entityReducer<IToggle>(toggleDefinition);
export const t = entityRedux<IToggle>(toggleDefinition);
export const toggleRedux:IToggleRedux = {
    show: (id:string) => t.update({id, isVisible: true}),
    hide: (id:string) => t.update({id, isVisible: false}),
    isOn: (state:IEntityContainer<IToggle>, id:number) => t.get(state, id).isVisible || false
};
