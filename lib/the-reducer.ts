import { prop, remove, switchOn } from 'atp-pointfree';
import { Reducer } from 'redux';
import { ChildSelector, Entity, EntityAction, EntityActionType, IEntityAction, IEntityActions, IEntityAddAction, IEntityAddMultipleAction, IEntityBase, IEntityContainer, IEntityDefinition, IEntityDeleteAction, IEntityDeleteMultipleAction, IEntityReducer, IEntityReducerContainer, IEntitySelectors, IEntityState, IEntityUpdateAction, IEntityUpdateMultipleAction, IModuleReducer, IModuleState, ITheReducerState, ParentSelector, PartialEntity, PartialFilter, RelatedSelector } from './the-reducer.types';

const isObject = (obj:any) => typeof obj === 'object' && obj !== null;

const merge = (...objs:any) => objs.reduce((combined:any, obj:any) => {
    let newObj = {...combined};
    Object.keys(obj).forEach((key:string) => {
        if(isObject(obj[key]) && isObject(combined[key])) {
            newObj[key] = merge(combined[key], obj[key]);
        } else {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}, {});

// Reducer
const initialState = {};
const entityReducer = <T extends IEntityBase>(def:IEntityDefinition<T>) => (state:IEntityState<T> = initialState, action:EntityAction<T>):IEntityState<T> =>
    action.namespace === "theReducerAction" && action.entityType === def.entity && action.module === def.module
        ? switchOn(action.type, {
            [EntityActionType.Add]: () => ({
                ...state,
                [(action as IEntityAddAction<T>).entity.id]: (action as IEntityAddAction<T>).entity
            }),
            [EntityActionType.AddMultiple]: () => ({
                ...state,
                ...merge(...(action as IEntityAddMultipleAction<T>).entities.map((entity:PartialEntity<T>) => ({
                    [entity.id]: entity
                })))
            }),
            [EntityActionType.Update]: () => ({
                ...state, 
                [(action as IEntityUpdateAction<T>).entity.id]: Object.assign(
                    {},
                    def.default,
                    state[(action as IEntityUpdateAction<T>).entity.id] || {},
                    (action as IEntityUpdateAction<T>).entity)
            }),
            [EntityActionType.UpdateMultiple]: () => ({
                ...state,
                ...merge(...(action as IEntityUpdateMultipleAction<T>).entities.map((entity:PartialEntity<T>) => ({
                    [entity.id]: Object.assign(
                        {},
                        state[entity.id] || {},
                        entity
                    )
                })))
            }),
            [EntityActionType.Delete]: () => remove((action as IEntityDeleteAction<T>).id)(state),
            [EntityActionType.DeleteMultiple]: () => remove((action as IEntityDeleteMultipleAction<T>).ids)(state),
            default: () => state,
          })
        : state;

const createEntityReducer = <T extends IEntityBase>(def:IEntityDefinition<T>):IEntityReducer<T> => ({
    [def.module]: {
        [def.entity]: entityReducer<T>(def)
    }
});

// Entity reducer combiner that optimizes performance
export const theReducer = (...reducers:IEntityReducerContainer<any>[]):Reducer<ITheReducerState, IEntityAction<any>> => {
    const mergedReducers = mergeEntityReducers(...reducers);
    return (state:ITheReducerState = {}, action:IEntityAction<any>) => switchOn(action.namespace, {
        theReducerAction: () => ({
            ...state,
            [action.module]: moduleReducer(mergedReducers.reducer[action.module])(state[action.module], action as EntityAction<any>)
        }),
        default: () => state
    })
};

export const mergeEntityReducers = (...reducers:IEntityReducerContainer<any>[]):IEntityReducerContainer<any> => ({
    reducer: merge(...reducers.map(prop("reducer")))
});

const moduleReducer = (reducers:IModuleReducer<any>) => (state:IModuleState = {}, action:EntityAction<any>) => Object.assign({}, state, {
    [action.entityType]: reducers[action.entityType](state[action.entityType], action)
});

// Action creators
const namespace = "theReducerAction";
const createEntityActions = <T extends IEntityBase>(def:IEntityDefinition<T>):IEntityActions<T> => ({
    add:(entity:PartialEntity<T>) => ({namespace, type:EntityActionType.Add, entity, entityType: def.entity, module: def.module}),
    addMultiple:(entities:PartialEntity<T>[]) => ({namespace, type: EntityActionType.AddMultiple, entities, entityType: def.entity, module: def.module}),
    delete:(id:string) => ({namespace, type: EntityActionType.Delete, id, entityType: def.entity, module: def.module}),
    deleteMultiple:(ids:string[]) => ({namespace, type: EntityActionType.DeleteMultiple, ids, entityType: def.entity, module: def.module}),
    update:(entity:PartialEntity<T>) => ({namespace, type: EntityActionType.Update, entity, entityType: def.entity, module: def.module}),
    updateMultiple:(entities:PartialEntity<T>[]) => ({namespace, type: EntityActionType.UpdateMultiple, entities, entityType: def.entity, module: def.module}),
});

const getEntities = <T extends IEntityBase>(state:IEntityContainer<T>, def:IEntityDefinition<T>):PartialEntity<T>[] =>
    state.theReducer[def.module] && state.theReducer[def.module][def.entity]
        ? Object.keys(state.theReducer[def.module][def.entity]).map((key:string) => Object.assign({}, def.default, state.theReducer[def.module][def.entity][key]))
        : [];

const getEntity = <T extends IEntityBase>(state:IEntityContainer<T>, def:IEntityDefinition<T>, id:string):PartialEntity<T> =>
    state.theReducer[def.module] && state.theReducer[def.module][def.entity] && state.theReducer[def.module][def.entity][id]
        ? state.theReducer[def.module][def.entity][id]
        : def.default;

// Selectors
const selectAll = <T>() => (obj:T):boolean => true;
const createEntitySelectors = <T extends IEntityBase>(def:IEntityDefinition<T>):IEntitySelectors<T> => ({
    get:(state:IEntityContainer<T>, id:string):PartialEntity<T> => getEntity<T>(state, def, id),
    getMultiple: (state:IEntityContainer<T>, f:PartialFilter<T> = selectAll<PartialEntity<T>>()):PartialEntity<T>[] =>
        getEntities(state, def).filter(f),
});

export const getChildren = <C extends IEntityBase>(childDef:IEntityDefinition<C>, field:string):ChildSelector<C> =>
    (state:IEntityContainer<C>, parentId:string):PartialEntity<C>[] =>
        entity<C>(childDef).getMultiple(state, (child:PartialEntity<C>) => ((<any>child)[field] as string) === parentId)

export const getParent = <P extends IEntityBase, C extends IEntityBase>(parentDef:IEntityDefinition<P>, childDef:IEntityDefinition<C>, field:string):ParentSelector<P, C> =>
    (state:IEntityContainer<P> & IEntityContainer<C>, childId:string):PartialEntity<P> =>
        entity<P>(parentDef).get(state, prop(field)(entity<C>(childDef).get(state, childId)));

export const getRelated = <R extends IEntityBase, B extends IEntityBase>(rDef:IEntityDefinition<R>, bDef:IEntityDefinition<B>, aField:string, bField:string):RelatedSelector<R, B> =>
    (state:IEntityContainer<R> & IEntityContainer<B>, aId:string) => {
        const bIds:string[] = entity<R>(rDef)
            .getMultiple(state, (r:PartialEntity<R>) => ((<any>r)[aField] as string) === aId)
            .map(prop(bField));
        return entity<B>(bDef).getMultiple(state, (b:PartialEntity<B>):boolean => bIds.includes(b.id));
    };

// Boilerplate
export const entity = <T extends IEntityBase>(def:IEntityDefinition<T>):Entity<T> => ({
    ...createEntityActions<T>(def),
    ...createEntitySelectors<T>(def),
    reducer: createEntityReducer<T>(def),
});
