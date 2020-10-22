import { prop, remove, switchOn } from 'atp-pointfree';
import { Reducer } from 'redux';
import { memoize } from 'ts-functional';
import { merge } from "../util";
import { ChildSelector, Entity, EntityAction, EntityActionType, Filter, IEntityAction, IEntityActions, IEntityAddAction, IEntityAddMultipleAction, IEntityBase, IEntityContainer, IEntityCustomAction, IEntityDefinition, IEntityDeleteAction, IEntityDeleteMultipleAction, IEntityReducer, IEntityReducerContainer, IEntitySelectors, IEntityState, IEntityUpdateAction, IEntityUpdateMultipleAction, IModuleReducer, IModuleState, ITheReducerState, ParentSelector, PartialEntity, RelatedSelector } from './entity.types';

const namespace = "theReducerEntityAction";

// Reducer
const initialState = {};
const entityReducer = <T extends IEntityBase, C>(def:IEntityDefinition<T, C>) => (state:IEntityState<T> = initialState, action:EntityAction<T, C>):IEntityState<T> =>
    action.namespace === namespace && action.entityType === def.entity && action.module === def.module
        ? switchOn(action.type, {
            [EntityActionType.Add]: () => ({
                ...state,
                [(action as IEntityAddAction<T>).entity.id]: {
                    ...def.default,
                    ...(!!state[(action as IEntityAddAction<T>).entity.id] ? state[(action as IEntityAddAction<T>).entity.id] : {}),
                    ...(action as IEntityAddAction<T>).entity
                }
            }),
            [EntityActionType.AddMultiple]: () => ({
                ...state,
                ...merge(...(action as IEntityAddMultipleAction<T>).entities.map((entity:PartialEntity<T>) => ({
                    [entity.id]: entity
                })))
            }),
            [EntityActionType.Update]: () => ({
                ...state, 
                [(action as IEntityUpdateAction<T>).entity.id]: merge(
                    def.default,
                    state[(action as IEntityUpdateAction<T>).entity.id] || {},
                    (action as IEntityUpdateAction<T>).entity
                )
            }),
            [EntityActionType.UpdateMultiple]: () => ({
                ...state,
                ...merge(...(action as IEntityUpdateMultipleAction<T>).entities.map((entity:PartialEntity<T>) => ({
                    [entity.id]: merge(
                        state[entity.id] || {},
                        entity
                    )
                })))
            }),
            [EntityActionType.Delete]: () => remove((action as IEntityDeleteAction<T>).id)(state),
            [EntityActionType.DeleteMultiple]: () => remove((action as IEntityDeleteMultipleAction<T>).ids)(state),
            [EntityActionType.Clear]: () => ({}),
            [EntityActionType.Custom]: () => def.customReducer
                ? ((a:IEntityCustomAction<T, C>) =>
                    (def.customReducer[a.customType] || (() => state))(state, a.data)
                )(action as IEntityCustomAction<T, C>)
                : state,
            default: () => state,
          })
        : state;

const createEntityReducer = <T extends IEntityBase, C>(def:IEntityDefinition<T, C>):IEntityReducer<T, C> => ({
    [def.module]: {
        [def.entity]: entityReducer<T, C>(def)
    }
});

// Entity reducer combiner that optimizes performance
export const theEntityReducer = (...reducers:IEntityReducerContainer<any, any>[]):Reducer<ITheReducerState, IEntityAction<any>> => {
    const mergedReducers = mergeEntityReducers(...reducers);
    return (state:ITheReducerState = {}, action:IEntityAction<any>) => switchOn(action.namespace, {
        [namespace]: () => ({
            ...state,
            [action.module]: moduleReducer(mergedReducers.reducer[action.module])(state[action.module], action as EntityAction<any, any>)
        }),
        default: () => state
    })
};

export const mergeEntityReducers = (...reducers:IEntityReducerContainer<any, any>[]):IEntityReducerContainer<any, any> => ({
    reducer: merge(...reducers.map(prop("reducer")))
});

const moduleReducer = (reducers:IModuleReducer<any, any>) => (state:IModuleState = {}, action:EntityAction<any, any>) => Object.assign({}, state, {
    [action.entityType]: reducers[action.entityType](state[action.entityType], action)
});

// Action creators
const createEntityActions = <T extends IEntityBase, C>(def:IEntityDefinition<T, C>):IEntityActions<T, C> => ({
    add:(entity:PartialEntity<T>) => ({namespace, type:EntityActionType.Add, entity, entityType: def.entity, module: def.module}),
    addMultiple:(entities:PartialEntity<T>[]) => ({namespace, type: EntityActionType.AddMultiple, entities, entityType: def.entity, module: def.module}),
    delete:(id:string) => ({namespace, type: EntityActionType.Delete, id, entityType: def.entity, module: def.module}),
    deleteMultiple:(ids:string[]) => ({namespace, type: EntityActionType.DeleteMultiple, ids, entityType: def.entity, module: def.module}),
    update:(entity:PartialEntity<T>) => ({namespace, type: EntityActionType.Update, entity, entityType: def.entity, module: def.module}),
    updateMultiple:(entities:PartialEntity<T>[]) => ({namespace, type: EntityActionType.UpdateMultiple, entities, entityType: def.entity, module: def.module}),
    clear: () => ({namespace, type: EntityActionType.Clear, entityType: def.entity, module: def.module}),
    custom: (type:string, data:C) => ({namespace, type: EntityActionType.Custom, entityType: def.entity, module: def.module, customType: type, data})
});

const objIdMap=new WeakMap<object>();
let objectCount = 0;

export const objectId = (object:object):number => {
    if (!objIdMap.has(object)) {
        objIdMap.set(object,++objectCount);
    }
    return objIdMap.get(object);
}

const __getEntities = memoize(
    <T extends IEntityBase>(state:IEntityState<T>, defaultVal:T, entity:string, objId:number) =>
        Object.keys(state).map((key:string) => Object.assign({}, defaultVal, state[key])),
    {keyGen: (args:any[]) => {
        const entity = args[2];
        const objId = args[3];
        const key = `${entity}:${objId}`;
        return key;
    }}
);

const getEntities = <T extends IEntityBase, C>(state:IEntityContainer<T>, def:IEntityDefinition<T, C>):T[] =>
    state.theReducerEntities[def.module] && state.theReducerEntities[def.module][def.entity]
        ? __getEntities(state.theReducerEntities[def.module][def.entity], def.default, def.entity, objectId(state.theReducerEntities[def.module][def.entity]))
        : [];

const getEntity = <T extends IEntityBase, C>(state:IEntityContainer<T>, def:IEntityDefinition<T, C>, id:string):T =>
    state.theReducerEntities[def.module] && state.theReducerEntities[def.module][def.entity] && state.theReducerEntities[def.module][def.entity][id]
        ? state.theReducerEntities[def.module][def.entity][id]
        : def.default;

const entityExists = <T extends IEntityBase, C>(state:IEntityContainer<T>, def:IEntityDefinition<T, C>, id:string):boolean =>
    !!state.theReducerEntities[def.module] && !!state.theReducerEntities[def.module][def.entity] && !!state.theReducerEntities[def.module][def.entity][id];

// Selectors
const selectAll = <T>() => (obj:T):boolean => true;
const createEntitySelectors = <T extends IEntityBase, C>(def:IEntityDefinition<T, C>):IEntitySelectors<T> => ({
    exists:(state:IEntityContainer<T>, id:string):boolean => entityExists(state, def, id),
    get:(state:IEntityContainer<T>, id:string):T => getEntity<T, C>(state, def, id),
    getMultiple: memoize(
        (state:IEntityContainer<T>, f:Filter<T> = selectAll<T>()):T[] => getEntities(state, def).filter(f),
        {keyGen: (args:any[]) => args.map(objectId).join(":")}
    ),
});

const childFilter = memoize(<T>(parentId:string, field:string) => (child:T) => ((<any>child)[field] as string) === parentId, {});
export const getChildren = <T extends IEntityBase, C = {}>(childDef:IEntityDefinition<T, C>, field:string):ChildSelector<T> =>
    (state:IEntityContainer<T>, parentId:string):T[] =>
        entity<T, C>(childDef).getMultiple(state, childFilter(parentId, field));

export const getParent = <P extends IEntityBase, C extends IEntityBase, PC = {}, CC = {}>(parentDef:IEntityDefinition<P, PC>, childDef:IEntityDefinition<C, CC>, field:string):ParentSelector<P, C> =>
    (state:IEntityContainer<P> & IEntityContainer<C>, childId:string):P =>
        entity<P, PC>(parentDef).get(state, prop(field)(entity<C, CC>(childDef).get(state, childId)));

const relatedFilter = memoize(<R>(aId:string, aField:string) => (r:R) => ((<any>r)[aField] as string) === aId, {});
export const getRelated = <R extends IEntityBase, B extends IEntityBase, RC = {}, BC = {}>(rDef:IEntityDefinition<R, RC>, bDef:IEntityDefinition<B, BC>, aField:string, bField:string):RelatedSelector<R, B> =>
    (state:IEntityContainer<R> & IEntityContainer<B>, aId:string) => {
        const bIds:string[] = entity<R, RC>(rDef)
            .getMultiple(state, relatedFilter(aId, aField))
            .map(prop(bField));
        return entity<B, BC>(bDef).getMultiple(state, (b:B):boolean => bIds.includes(b.id));
    };

// Boilerplate
export const entity = <T extends IEntityBase, C = {}>(def:IEntityDefinition<T, C>):Entity<T, C> => ({
    ...createEntityActions<T, C>(def),
    ...createEntitySelectors<T, C>(def),
    reducer: createEntityReducer<T, C>(def),
});
