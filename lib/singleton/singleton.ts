import { prop, switchOn } from 'atp-pointfree';
import { Reducer } from 'redux';
import { merge } from "../util";
import { EntityActionType, IEntityAction, IEntityDefinition, IEntityReducerContainer, ITheReducerState } from '../entity';
import { ISingletonAction, ISingletonActions, ISingletonContainer, ISingletonModuleReducer, ISingletonModuleState, ISingletonReducer, ISingletonReducerContainer, ISingletonSelectors, PartialSingleton, Singleton, SingletonAction, SingletonActionType, ISingletonTheReducerState } from './singleton.types';

const namespace = "theReducerSingletonAction";

// Reducer
const singletonReducer = <T>(def:IEntityDefinition<T>) => (state:T = def.default, action:SingletonAction<T>):T =>
    action.namespace === namespace && action.entityType === def.entity && action.module === def.module
        ? switchOn(action.type, {
            [SingletonActionType.Update]: () => merge(state, action.entity),
            default: () => state,
          })
        : state;

const createSingletonReducer = <T>(def:IEntityDefinition<T>):ISingletonReducer<T> => ({
    [def.module]: {
        [def.entity]: singletonReducer<T>(def)
    }
});

// Entity reducer combiner that optimizes performance
export const theSingletonReducer = (...reducers:ISingletonReducerContainer<any>[]):Reducer<ISingletonTheReducerState, ISingletonAction<any>> => {
    const mergedReducers = mergeSingletonReducers(...reducers);
    return (state:ISingletonTheReducerState = {}, action:ISingletonAction<any>) => switchOn(action.namespace, {
        [namespace]: () => ({
            ...state,
            [action.module]: moduleReducer(mergedReducers.reducer[action.module])(state[action.module], action as SingletonAction<any>)
        }),
        default: () => state
    })
};

export const mergeSingletonReducers = (...reducers:ISingletonReducerContainer<any>[]):ISingletonReducerContainer<any> => ({
    reducer: merge(...reducers.map(prop("reducer")))
});

const moduleReducer = (reducers:ISingletonModuleReducer<any>) => (state:ISingletonModuleState = {}, action:SingletonAction<any>) => Object.assign({}, state, {
    [action.entityType]: reducers[action.entityType](state[action.entityType], action)
});

// Action creators
const createSingletonActions = <T>(def:IEntityDefinition<T>):ISingletonActions<T> => ({
    update:(entity:PartialSingleton<T>) => ({namespace, type: SingletonActionType.Update, entity, entityType: def.entity, module: def.module}),
});

const getSingleton = <T>(state:ISingletonContainer<T>, def:IEntityDefinition<T>):T =>
    state.theReducerSingletons[def.module] && state.theReducerSingletons[def.module][def.entity]
        ? state.theReducerSingletons[def.module][def.entity]
        : def.default;

// Selectors
const createSingletonSelectors = <T>(def:IEntityDefinition<T>):ISingletonSelectors<T> => ({
    get:(state:ISingletonContainer<T>):T => getSingleton<T>(state, def),
});

// Boilerplate
export const singleton = <T>(def:IEntityDefinition<T>):Singleton<T> => ({
    ...createSingletonActions<T>(def),
    ...createSingletonSelectors<T>(def),
    reducer: createSingletonReducer<T>(def),
});
