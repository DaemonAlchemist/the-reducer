import { PartialEntity, ChildSelector, Entity, IEntityAction, IEntityBase, IEntityContainer, IEntityDefinition, IEntityReducer, ParentSelector, IReducerContainer } from './the-reducer.types';
import { AnyAction } from 'redux';
export declare const combineReducersResursive: (obj: IReducerContainer) => import("redux").Reducer<any, AnyAction>;
export declare const getChildren: <C extends IEntityBase>(childDef: IEntityDefinition, field: string) => ChildSelector<C>;
export declare const getParent: <P extends IEntityBase, C extends IEntityBase>(parentDef: IEntityDefinition, childDef: IEntityDefinition, field: string) => ParentSelector<P, C>;
export declare const getRelated: <R extends IEntityBase, B extends IEntityBase>(rDef: IEntityDefinition, bDef: IEntityDefinition, aField: string, bField: string) => (state: IEntityContainer<R> & IEntityContainer<B>, aId: string) => PartialEntity<B>[];
export declare const entity: <T extends IEntityBase>(def: IEntityDefinition) => Entity<T>;
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
export interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
export declare const arcRedux: IArcRedux;
export interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
}
export declare const pageRedux: IPageRedux;
interface IToggle {
    id: string;
    isVisible: boolean;
}
interface IToggleRedux {
    reducer: IEntityReducer<IToggle>;
    show: (id: string) => IEntityAction;
    hide: (id: string) => IEntityAction;
    isOn: (state: IEntityContainer<IToggle>, id: string) => boolean;
}
export declare const t: Entity<IToggle>;
export declare const toggleRedux: IToggleRedux;
export {};
