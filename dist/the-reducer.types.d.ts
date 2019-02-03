import { Reducer as ReduxReducer } from "redux";
export interface IEntityDefinition<T> {
    module: string;
    entity: string;
    default: T;
}
export interface IEntityBase {
    id: string;
}
export declare type PartialEntity<T> = Partial<T> & IEntityBase;
export declare enum EntityActionType {
    Add = 0,
    Delete = 1,
    Update = 2
}
export interface IEntityAction<T extends IEntityBase> {
    namespace: "theReducerAction";
    type: EntityActionType;
    module: string;
    entityType: string;
    entity?: PartialEntity<T>;
}
export interface IEntityAddAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Add;
    entity: PartialEntity<T>;
}
export interface IEntityDeleteAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Delete;
    id: string;
}
export interface IEntityUpdateAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Update;
    entity: PartialEntity<T>;
}
export declare type EntityAction<T extends IEntityBase> = IEntityAddAction<T> | IEntityDeleteAction<T> | IEntityUpdateAction<T>;
export declare type EntityReducer<T extends IEntityBase> = ReduxReducer<IEntityState<T>, EntityAction<T>>;
export interface IEntityReducer<T extends IEntityBase> {
    [module: string]: IModuleReducer<T>;
}
export interface IModuleReducer<T extends IEntityBase> {
    [entity: string]: EntityReducer<T>;
}
export declare type IReducerItem<T extends IEntityBase> = IReducerContainer<T> | EntityReducer<T>;
export interface IReducerContainer<T extends IEntityBase> {
    [id: string]: IReducerItem<T>;
}
export interface IEntityState<T> {
    [id: string]: T;
}
export interface ITheReducerState {
    [module: string]: IModuleState;
}
export interface IModuleState {
    [entity: string]: {
        [id: string]: any;
    };
}
export interface IEntityContainer<T> {
    theReducer: {
        [module: string]: {
            [entity: string]: IEntityState<T>;
        };
    };
}
export interface IEntityActions<T extends IEntityBase> {
    add: (entity: PartialEntity<T>) => IEntityAddAction<T>;
    update: (entity: PartialEntity<T>) => IEntityUpdateAction<T>;
    delete: (id: string) => IEntityDeleteAction<T>;
}
export declare type Filter<T> = (entity: T) => boolean;
export declare type PartialFilter<T> = (entity: PartialEntity<T>) => boolean;
export interface IEntitySelectors<T> {
    get: (state: IEntityContainer<T>, id: string) => PartialEntity<T>;
    getMultiple: (state: IEntityContainer<T>, filter: Filter<PartialEntity<T>>) => PartialEntity<T>[];
}
export interface IEntityReducerContainer<T extends IEntityBase> {
    reducer: IEntityReducer<T>;
}
export declare type Entity<T extends IEntityBase> = IEntityActions<T> & IEntitySelectors<T> & IEntityReducerContainer<T>;
export declare type ChildSelector<C extends IEntityBase> = (state: IEntityContainer<C>, parentId: string) => PartialEntity<C>[];
export declare type ParentSelector<P extends IEntityBase, C extends IEntityBase> = (state: IEntityContainer<P> & IEntityContainer<C>, childId: string) => PartialEntity<P>;
export declare type RelatedSelector<R extends IEntityBase, B extends IEntityBase> = (state: IEntityContainer<R> & IEntityContainer<B>, aId: string) => PartialEntity<B>[];
