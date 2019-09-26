import { Reducer } from 'redux';
import { IEntityDefinition } from '../entity';
import { ISingletonAction, ISingletonReducerContainer, Singleton, ISingletonTheReducerState } from './singleton.types';
export declare const theSingletonReducer: (...reducers: ISingletonReducerContainer<any>[]) => Reducer<ISingletonTheReducerState, ISingletonAction<any>>;
export declare const mergeSingletonReducers: (...reducers: ISingletonReducerContainer<any>[]) => ISingletonReducerContainer<any>;
export declare const singleton: <T>(def: IEntityDefinition<T>) => Singleton<T>;
