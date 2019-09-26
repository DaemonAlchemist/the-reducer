import { Reducer as ReduxReducer } from "redux";

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface IEntityDefinition<T> {
    module:string;
    entity:string;
    default:T;
}

export interface IEntityBase {
    id:string;
}

export type PartialEntity<T> = RecursivePartial<T> & IEntityBase;

export enum EntityActionType {Add, Delete, Update, AddMultiple, DeleteMultiple, UpdateMultiple};
export interface IEntityAction<T extends IEntityBase> {namespace: "theReducerEntityAction", type: EntityActionType; module: string; entityType:string;}
export interface IEntityAddAction<T extends IEntityBase> extends IEntityAction<T> {type: EntityActionType.Add; entity:PartialEntity<T>;};
export interface IEntityAddMultipleAction<T extends IEntityBase> extends IEntityAction<T> {type: EntityActionType.AddMultiple; entities:PartialEntity<T>[];};
export interface IEntityDeleteAction<T extends IEntityBase> extends IEntityAction<T> {type:EntityActionType.Delete, id:string;};
export interface IEntityDeleteMultipleAction<T extends IEntityBase> extends IEntityAction<T> {type:EntityActionType.DeleteMultiple, ids:string[];};
export interface IEntityUpdateAction<T extends IEntityBase> extends IEntityAction<T> {type:EntityActionType.Update, entity:PartialEntity<T>};
export interface IEntityUpdateMultipleAction<T extends IEntityBase> extends IEntityAction<T> {type:EntityActionType.UpdateMultiple, entities:PartialEntity<T>[]};
export type EntityAction<T extends IEntityBase> =
    IEntityAddAction<T> | IEntityDeleteAction<T> | IEntityUpdateAction<T> |
    IEntityAddMultipleAction<T> | IEntityDeleteMultipleAction<T> | IEntityUpdateMultipleAction<T>;

export type EntityReducer<T extends IEntityBase> = ReduxReducer<IEntityState<T>,EntityAction<T>>;

export interface IEntityReducer<T extends IEntityBase> {
    [module:string]: IModuleReducer<T>;
};

export interface IModuleReducer<T extends IEntityBase> {
    [entity:string]:EntityReducer<T>;
};

export type IReducerItem<T extends IEntityBase> = IReducerContainer<T> | EntityReducer<T>;
export interface IReducerContainer<T extends IEntityBase> {
    [id:string]: IReducerItem<T>;
}

export interface IEntityState<T> {
    [id:string]:T;
}

export interface ITheReducerState {
    [module:string] : IModuleState;
}

export interface IModuleState {
    [entity:string]: {
        [id:string]:any;
    }
}

export interface IEntityContainer<T> {
    theReducerEntities: {
        [module:string]: {
            [entity:string]: IEntityState<T>;
        }
    }
}

export interface IEntityActions<T extends IEntityBase> {
    add:(entity:PartialEntity<T>) => IEntityAddAction<T>;
    addMultiple:(entities:PartialEntity<T>[]) => IEntityAddMultipleAction<T>;
    update:(entity:PartialEntity<T>) => IEntityUpdateAction<T>;
    updateMultiple:(entities:PartialEntity<T>[]) => IEntityUpdateMultipleAction<T>;
    delete:(id:string) => IEntityDeleteAction<T>;
    deleteMultiple:(ids:string[]) => IEntityDeleteMultipleAction<T>;
};

export type Filter<T> = (entity:T) => boolean;
export type PartialFilter<T> = (entity:PartialEntity<T>) => boolean;

export interface IEntitySelectors<T> {
    get:(state:IEntityContainer<T>, id:string) => T;
    getMultiple:(state:IEntityContainer<T>, filter:Filter<T>) => T[];
}

export interface IEntityReducerContainer<T extends IEntityBase> {
    reducer: IEntityReducer<T>;
}

export type Entity<T extends IEntityBase> = IEntityActions<T> & IEntitySelectors<T> & IEntityReducerContainer<T>;

export type ChildSelector<C extends IEntityBase> = (state:IEntityContainer<C>, parentId:string) => C[];
export type ParentSelector<P extends IEntityBase, C extends IEntityBase> = (state:IEntityContainer<P> & IEntityContainer<C>, childId:string) => P;
export type RelatedSelector<R extends IEntityBase, B extends IEntityBase> = (state:IEntityContainer<R> & IEntityContainer<B>, aId:string) => B[];