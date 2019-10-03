import { prop, switchOn } from 'atp-pointfree';
import { Reducer } from 'redux';
import { merge } from "../util";
import { ISingletonAction, ISingletonActions, ISingletonContainer, ISingletonCustomAction, ISingletonDefinition, ISingletonModuleReducer, ISingletonModuleState, ISingletonReducer, ISingletonReducerContainer, ISingletonSelectors, ISingletonTheReducerState, ISingletonUpdateAction, PartialSingleton, Singleton, SingletonAction, SingletonActionType } from './singleton.types';

const namespace = "theReducerSingletonAction";

// Reducer
const singletonReducer = <T, C>(def:ISingletonDefinition<T, C>) => (state:T = def.default, action:SingletonAction<T, C>):T =>
    action.namespace === namespace && action.entityType === def.entity && action.module === def.module
        ? switchOn(action.type, {
            [SingletonActionType.Update]: () => merge(state, (action as ISingletonUpdateAction<T>).entity),
            [SingletonActionType.Custom]: () => def.customReducer
                ? ((a:ISingletonCustomAction<T, C>) =>
                    (def.customReducer[a.customType] || (() => state))(state, a.data)
                )(action as ISingletonCustomAction<T, C>)
                : state,
            default: () => state,
          })
        : state;

const createSingletonReducer = <T, C>(def:ISingletonDefinition<T, C>):ISingletonReducer<T, C> => ({
    [def.module]: {
        [def.entity]: singletonReducer<T, C>(def)
    }
});

// Entity reducer combiner that optimizes performance
export const theSingletonReducer = (...reducers:ISingletonReducerContainer<any, any>[]):Reducer<ISingletonTheReducerState, ISingletonAction> => {
    const mergedReducers = mergeSingletonReducers(...reducers);
    return (state:ISingletonTheReducerState = {}, action:ISingletonAction) => switchOn(action.namespace, {
        [namespace]: () => ({
            ...state,
            [action.module]: moduleReducer(mergedReducers.reducer[action.module])(state[action.module], action as SingletonAction<any, any>)
        }),
        default: () => state
    })
};

export const mergeSingletonReducers = (...reducers:ISingletonReducerContainer<any, any>[]):ISingletonReducerContainer<any, any> => ({
    reducer: merge(...reducers.map(prop("reducer")))
});

const moduleReducer = (reducers:ISingletonModuleReducer<any, any>) => (state:ISingletonModuleState = {}, action:SingletonAction<any, any>) => Object.assign({}, state, {
    [action.entityType]: reducers[action.entityType](state[action.entityType], action)
});

// Action creators
const createSingletonActions = <T, C>(def:ISingletonDefinition<T, C>):ISingletonActions<T, C> => ({
    update:(entity:PartialSingleton<T>) => ({namespace, type: SingletonActionType.Update, entity, entityType: def.entity, module: def.module}),
    custom:(customType:string, data:C) => ({namespace, type: SingletonActionType.Custom, customType, entityType: def.entity, module: def.module, data}),
});

const getSingleton = <T, C>(state:ISingletonContainer<T>, def:ISingletonDefinition<T, C>):T =>
    state.theReducerSingletons[def.module] && state.theReducerSingletons[def.module][def.entity]
        ? state.theReducerSingletons[def.module][def.entity]
        : def.default;

// Selectors
const createSingletonSelectors = <T, C>(def:ISingletonDefinition<T, C>):ISingletonSelectors<T> => ({
    get:(state:ISingletonContainer<T>):T => getSingleton<T, C>(state, def),
});

// Boilerplate
export const singleton = <T, C>(def:ISingletonDefinition<T, C>):Singleton<T, C> => ({
    ...createSingletonActions<T, C>(def),
    ...createSingletonSelectors<T, C>(def),
    reducer: createSingletonReducer<T, C>(def),
});
