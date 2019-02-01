export interface IEntityDefinition {
    module:string;
    entity:string;
}

export interface IEntityBase {
    id:string;
}

export type PartialEntity<T> = Partial<T> & IEntityBase;

export enum EntityActionType {Add, Delete, Update};
export interface IEntityAction {type: EntityActionType;}
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

export interface IEntityState<T> {
    [id:string]:T;
}

export interface IEntityContainer<T> {
    [module:string]: {
        [entity:string]: IEntityState<T>;
    }
}

export interface IEntityActions<T extends IEntityBase> {
    add:(entity:T) => IEntityAddAction<T>;
    update:(entity:Partial<T>) => IEntityUpdateAction<T>;
    delete:(id:string) => IEntityDeleteAction;
};

export type EntityFilter<T> = (entity:T) => boolean;

export interface IEntitySelectors<T> {
    get:(state:IEntityContainer<T>, id:string) => PartialEntity<T> | undefined;
    getMultiple:(state:IEntityContainer<T>, filter:EntityFilter<PartialEntity<T>>) => PartialEntity<T>[];
}

export type Entity<T extends IEntityBase> = IEntityActions<T> & IEntitySelectors<T>;
export type ChildSelector<C extends IEntityBase> = (state:IEntityContainer<C>, parentId:string) =>PartialEntity<C>[];
export type ParentSelector<P extends IEntityBase, C extends IEntityBase> = (state:IEntityContainer<P> & IEntityContainer<C>, childId:string) => PartialEntity<P> | undefined;
