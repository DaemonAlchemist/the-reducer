import { Reducer as ReduxReducer } from "redux";
import { RecursivePartial } from "../entity/entity.types";
export declare type PartialSingleton<T> = RecursivePartial<T>;
export declare enum SingletonActionType {
    Update = 0
}
export interface ISingletonAction<T> {
    namespace: "theReducerSingletonAction";
    type: SingletonActionType;
    module: string;
    entityType: string;
}
export interface ISingletonUpdateAction<T> extends ISingletonAction<T> {
    type: SingletonActionType.Update;
    entity: PartialSingleton<T>;
}
export declare type SingletonAction<T> = ISingletonUpdateAction<T>;
export declare type SingletonReducer<T> = ReduxReducer<T, SingletonAction<T>>;
export interface ISingletonReducer<T> {
    [module: string]: ISingletonModuleReducer<T>;
}
export interface ISingletonModuleReducer<T> {
    [entity: string]: SingletonReducer<T>;
}
export interface ISingletonTheReducerState {
    [module: string]: ISingletonModuleState;
}
export interface ISingletonModuleState {
    [entity: string]: any;
}
export interface ISingletonContainer<T> {
    theReducerSingletons: {
        [module: string]: {
            [entity: string]: T;
        };
    };
}
export interface ISingletonActions<T> {
    update: (entity: PartialSingleton<T>) => ISingletonUpdateAction<T>;
}
export interface ISingletonSelectors<T> {
    get: (state: ISingletonContainer<T>) => T;
}
export interface ISingletonReducerContainer<T> {
    reducer: ISingletonReducer<T>;
}
export declare type Singleton<T> = ISingletonActions<T> & ISingletonSelectors<T> & ISingletonReducerContainer<T>;
