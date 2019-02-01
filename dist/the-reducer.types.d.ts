export interface IEntityDefinition {
    module: string;
    entity: string;
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
export interface IEntityAction {
    type: EntityActionType;
}
export interface IEntityAddAction<T extends IEntityBase> extends IEntityAction {
    type: EntityActionType.Add;
    entity: PartialEntity<T>;
}
export interface IEntityDeleteAction extends IEntityAction {
    type: EntityActionType.Delete;
    id: string;
}
export interface IEntityUpdateAction<T extends IEntityBase> extends IEntityAction {
    type: EntityActionType.Update;
    entity: PartialEntity<T>;
}
export declare type EntityAction<T extends IEntityBase> = IEntityAddAction<T> | IEntityDeleteAction | IEntityUpdateAction<T>;
export declare type EntityReducer<T extends IEntityBase> = (state: IEntityState<T>, action: EntityAction<T>) => IEntityState<T>;
export interface IEntityReducer<T extends IEntityBase> {
    [module: string]: {
        [entity: string]: EntityReducer<T>;
    };
}
export interface IEntityState<T> {
    [id: string]: T;
}
export interface IEntityContainer<T> {
    [module: string]: {
        [entity: string]: IEntityState<T>;
    };
}
export interface IEntityActions<T extends IEntityBase> {
    add: (entity: T) => IEntityAddAction<T>;
    update: (entity: PartialEntity<T>) => IEntityUpdateAction<T>;
    delete: (id: string) => IEntityDeleteAction;
}
export declare type Filter<T> = (entity: T) => boolean;
export declare type PartialFilter<T> = (entity: PartialEntity<T>) => boolean;
export interface IEntitySelectors<T> {
    get: (state: IEntityContainer<T>, id: string) => PartialEntity<T> | undefined;
    getMultiple: (state: IEntityContainer<T>, filter: Filter<PartialEntity<T>>) => PartialEntity<T>[];
}
export declare type Entity<T extends IEntityBase> = IEntityActions<T> & IEntitySelectors<T>;
export declare type ChildSelector<C extends IEntityBase> = (state: IEntityContainer<C>, parentId: string) => PartialEntity<C>[];
export declare type ParentSelector<P extends IEntityBase, C extends IEntityBase> = (state: IEntityContainer<P> & IEntityContainer<C>, childId: string) => PartialEntity<P> | undefined;
