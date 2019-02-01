import { AnyAction, Reducer as ReduxReducer, ReducersMapObject } from "redux";

export interface IEntityDefinition<T> {
    module:string;
    entity:string;
    default:T;
}

export interface IEntityBase {
    id:string;
}

export type PartialEntity<T> = Partial<T> & IEntityBase;

export enum EntityActionType {Add, Delete, Update};
export interface IEntityAction {type: EntityActionType; module: string; entityType:string;}
export interface IEntityAddAction<T extends IEntityBase> extends IEntityAction {type: EntityActionType.Add; entity:PartialEntity<T>;};
export interface IEntityDeleteAction extends IEntityAction {type:EntityActionType.Delete, id:string;};
export interface IEntityUpdateAction<T extends IEntityBase> extends IEntityAction {type:EntityActionType.Update, entity:PartialEntity<T>};
export type EntityAction<T extends IEntityBase> = IEntityAddAction<T> | IEntityDeleteAction | IEntityUpdateAction<T>;

export type EntityReducer<T extends IEntityBase> = (state:IEntityState<T>, action:EntityAction<T>) => IEntityState<T>;

export interface IEntityReducer<T extends IEntityBase> {
    [module:string]: {
        [entity:string]:EntityReducer<T>
    }
};

export type IReducerItem = IReducerContainer | Reducer;
export interface IReducerContainer {
    [id:string]: IReducerItem;
}
export type Reducer = ReduxReducer<any, AnyAction>;
export type ReducerMap = ReducersMapObject<any, AnyAction>;

export interface IEntityState<T> {
    [id:string]:T;
}

export interface IEntityContainer<T> {
    [module:string]: {
        [entity:string]: IEntityState<T>;
    }
}

export interface IEntityActions<T extends IEntityBase> {
    add:(entity:PartialEntity<T>) => IEntityAddAction<T>;
    update:(entity:PartialEntity<T>) => IEntityUpdateAction<T>;
    delete:(id:string) => IEntityDeleteAction;
};

export type Filter<T> = (entity:T) => boolean;
export type PartialFilter<T> = (entity:PartialEntity<T>) => boolean;

export interface IEntitySelectors<T> {
    get:(state:IEntityContainer<T>, id:string) => PartialEntity<T>;
    getMultiple:(state:IEntityContainer<T>, filter:Filter<PartialEntity<T>>) => PartialEntity<T>[];
}

export type Entity<T extends IEntityBase> = IEntityActions<T> & IEntitySelectors<T> & {
    reducer: IEntityReducer<T>
};
export type ChildSelector<C extends IEntityBase> = (state:IEntityContainer<C>, parentId:string) =>PartialEntity<C>[];
export type ParentSelector<P extends IEntityBase, C extends IEntityBase> = (state:IEntityContainer<P> & IEntityContainer<C>, childId:string) => PartialEntity<P>;
