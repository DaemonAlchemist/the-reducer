import { Reducer as ReduxReducer } from "redux";
export declare type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
export interface ICustomEntityReducer<T, C> {
    [customType: string]: (state: IEntityState<T>, data: C) => IEntityState<T>;
}
export interface IEntityDefinition<T, C> {
    module: string;
    entity: string;
    default: T;
    customReducer?: ICustomEntityReducer<T, C>;
}
export interface IEntityBase {
    id: string;
}
export declare type PartialEntity<T> = RecursivePartial<T> & IEntityBase;
export declare enum EntityActionType {
    Add = 0,
    Delete = 1,
    Update = 2,
    AddMultiple = 3,
    DeleteMultiple = 4,
    UpdateMultiple = 5,
    Clear = 6,
    Custom = 7
}
export interface IEntityAction<T extends IEntityBase> {
    namespace: "theReducerEntityAction";
    type: EntityActionType;
    module: string;
    entityType: string;
}
export interface IEntityAddAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Add;
    entity: PartialEntity<T>;
}
export interface IEntityAddMultipleAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.AddMultiple;
    entities: PartialEntity<T>[];
}
export interface IEntityDeleteAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Delete;
    id: string;
}
export interface IEntityDeleteMultipleAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.DeleteMultiple;
    ids: string[];
}
export interface IEntityUpdateAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Update;
    entity: PartialEntity<T>;
}
export interface IEntityUpdateMultipleAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.UpdateMultiple;
    entities: PartialEntity<T>[];
}
export interface IEntityClearAction<T extends IEntityBase> extends IEntityAction<T> {
    type: EntityActionType.Clear;
}
export interface IEntityCustomAction<T extends IEntityBase, C> extends IEntityAction<T> {
    type: EntityActionType.Custom;
    customType: string;
    data: C;
}
export declare type EntityAction<T extends IEntityBase, C> = IEntityAddAction<T> | IEntityDeleteAction<T> | IEntityUpdateAction<T> | IEntityAddMultipleAction<T> | IEntityDeleteMultipleAction<T> | IEntityUpdateMultipleAction<T> | IEntityClearAction<T> | IEntityCustomAction<T, C>;
export declare type EntityReducer<T extends IEntityBase, C> = ReduxReducer<IEntityState<T>, EntityAction<T, C>>;
export interface IEntityReducer<T extends IEntityBase, C = {}> {
    [module: string]: IModuleReducer<T, C>;
}
export interface IModuleReducer<T extends IEntityBase, C> {
    [entity: string]: EntityReducer<T, C>;
}
export declare type IReducerItem<T extends IEntityBase, C> = IReducerContainer<T, C> | EntityReducer<T, C>;
export interface IReducerContainer<T extends IEntityBase, C> {
    [id: string]: IReducerItem<T, C>;
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
    theReducerEntities: {
        [module: string]: {
            [entity: string]: IEntityState<T>;
        };
    };
}
export interface IEntityActions<T extends IEntityBase, C> {
    add: (entity: PartialEntity<T>) => IEntityAddAction<T>;
    addMultiple: (entities: PartialEntity<T>[]) => IEntityAddMultipleAction<T>;
    update: (entity: PartialEntity<T>) => IEntityUpdateAction<T>;
    updateMultiple: (entities: PartialEntity<T>[]) => IEntityUpdateMultipleAction<T>;
    delete: (id: string) => IEntityDeleteAction<T>;
    deleteMultiple: (ids: string[]) => IEntityDeleteMultipleAction<T>;
    clear: () => IEntityClearAction<T>;
    custom: (type: string, data: C) => IEntityCustomAction<T, C>;
}
export declare type Filter<T> = (entity: T) => boolean;
export declare type PartialFilter<T> = (entity: PartialEntity<T>) => boolean;
export interface IEntitySelectors<T> {
    exists: (state: IEntityContainer<T>, id: string) => boolean;
    get: (state: IEntityContainer<T>, id: string) => T;
    getMultiple: (state: IEntityContainer<T>, filter: Filter<T>) => T[];
}
export interface IEntityReducerContainer<T extends IEntityBase, C> {
    reducer: IEntityReducer<T, C>;
}
export declare type Entity<T extends IEntityBase, C = {}> = IEntityActions<T, C> & IEntitySelectors<T> & IEntityReducerContainer<T, C>;
export declare type ChildSelector<C extends IEntityBase> = (state: IEntityContainer<C>, parentId: string) => C[];
export declare type ParentSelector<P extends IEntityBase, C extends IEntityBase> = (state: IEntityContainer<P> & IEntityContainer<C>, childId: string) => P;
export declare type RelatedSelector<R extends IEntityBase, B extends IEntityBase> = (state: IEntityContainer<R> & IEntityContainer<B>, aId: string) => B[];
