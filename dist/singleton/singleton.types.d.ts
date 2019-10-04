import { Reducer as ReduxReducer } from "redux";
import { RecursivePartial } from "../entity/entity.types";
export declare type PartialSingleton<T> = RecursivePartial<T>;
export interface ICustomSingletonReducer<T, C> {
    [customType: string]: (state: T, data: C) => T;
}
export interface ISingletonDefinition<T, C> {
    module: string;
    entity: string;
    default: T;
    customReducer?: ICustomSingletonReducer<T, C>;
}
export declare enum SingletonActionType {
    Update = 0,
    Custom = 1
}
export interface ISingletonAction {
    namespace: "theReducerSingletonAction";
    type: SingletonActionType;
    module: string;
    entityType: string;
}
export interface ISingletonUpdateAction<T> extends ISingletonAction {
    type: SingletonActionType.Update;
    entity: PartialSingleton<T>;
}
export interface ISingletonCustomAction<T, C> extends ISingletonAction {
    type: SingletonActionType.Custom;
    customType: string;
    data: C;
}
export declare type SingletonAction<T, C> = ISingletonUpdateAction<T> | ISingletonCustomAction<T, C>;
export declare type SingletonReducer<T, C> = ReduxReducer<T, SingletonAction<T, C>>;
export interface ISingletonReducer<T, C> {
    [module: string]: ISingletonModuleReducer<T, C>;
}
export interface ISingletonModuleReducer<T, C> {
    [entity: string]: SingletonReducer<T, C>;
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
export interface ISingletonActions<T, C> {
    update: (entity: PartialSingleton<T>) => ISingletonUpdateAction<T>;
    custom: (customType: string, data: C) => ISingletonCustomAction<T, C>;
}
export interface ISingletonSelectors<T> {
    get: (state: ISingletonContainer<T>) => T;
}
export interface ISingletonReducerContainer<T, C> {
    reducer: ISingletonReducer<T, C>;
}
export declare type Singleton<T, C> = ISingletonActions<T, C> & ISingletonSelectors<T> & ISingletonReducerContainer<T, C>;
