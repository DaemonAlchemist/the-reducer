import { Reducer } from 'redux';
import { ISingletonAction, ISingletonDefinition, ISingletonReducerContainer, ISingletonTheReducerState, Singleton } from './singleton.types';
export declare const theSingletonReducer: (...reducers: ISingletonReducerContainer<any, any>[]) => Reducer<ISingletonTheReducerState, ISingletonAction>;
export declare const mergeSingletonReducers: (...reducers: ISingletonReducerContainer<any, any>[]) => ISingletonReducerContainer<any, any>;
export declare const singleton: <T, C = {}>(def: ISingletonDefinition<T, C>) => Singleton<T, C>;
