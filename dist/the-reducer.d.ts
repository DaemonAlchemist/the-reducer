import { PartialEntity, ChildSelector, Entity, EntityAction, IEntityAction, IEntityActions, IEntityBase, IEntityContainer, IEntityDefinition, IEntityReducer, IEntitySelectors, IEntityState, ParentSelector } from './the-reducer.types';
export declare const createEntityReducer: <T extends IEntityBase>(def: IEntityDefinition) => IEntityReducer<T>;
export declare const createEntityActions: <T extends IEntityBase>(def: IEntityDefinition) => IEntityActions<T>;
export declare const createEntitySelectors: <T extends IEntityBase>(def: IEntityDefinition) => IEntitySelectors<T>;
export declare const getChildren: <C extends IEntityBase>(childDef: IEntityDefinition, field: string) => ChildSelector<C>;
export declare const getParent: <P extends IEntityBase, C extends IEntityBase>(parentDef: IEntityDefinition, childDef: IEntityDefinition, field: string) => ParentSelector<P, C>;
export declare const getRelated: <R extends IEntityBase, B extends IEntityBase>(rDef: IEntityDefinition, bDef: IEntityDefinition, aField: string, bField: string) => (state: IEntityContainer<R> & IEntityContainer<B>, aId: string) => PartialEntity<B>[];
export declare const entityRedux: <T extends IEntityBase>(def: IEntityDefinition) => Entity<T>;
interface IComicArc {
    id: string;
    name: string;
    url: string;
}
interface IComicPage {
    id: string;
    name: string;
    description: string;
    arcId: number;
    sequence: number;
}
export declare const arcReducer: (state: IEntityState<IComicArc> | undefined, action: EntityAction<IComicArc>) => IEntityState<IComicArc>;
export interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
export declare const arcRedux: IArcRedux;
export declare const pageReducer: (state: IEntityState<IComicPage> | undefined, action: EntityAction<IComicPage>) => IEntityState<IComicPage>;
export interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
}
export declare const pageRedux: IPageRedux;
interface IToggle {
    id: string;
    isVisible: boolean;
}
interface IToggleRedux {
    show: (id: string) => IEntityAction;
    hide: (id: string) => IEntityAction;
    isOn: (state: IEntityContainer<IToggle>, id: string) => boolean;
}
export declare const toggleReducer: (state: IEntityState<IToggle> | undefined, action: EntityAction<IToggle>) => IEntityState<IToggle>;
export declare const t: Entity<IToggle>;
export declare const toggleRedux: IToggleRedux;
export {};
