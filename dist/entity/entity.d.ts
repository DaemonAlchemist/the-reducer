import { Reducer } from 'redux';
import { ChildSelector, Entity, IEntityAction, IEntityBase, IEntityDefinition, IEntityReducerContainer, ITheReducerState, ParentSelector, RelatedSelector } from './entity.types';
export declare const theEntityReducer: (...reducers: IEntityReducerContainer<any>[]) => Reducer<ITheReducerState, IEntityAction<any>>;
export declare const mergeEntityReducers: (...reducers: IEntityReducerContainer<any>[]) => IEntityReducerContainer<any>;
export declare const getChildren: <C extends IEntityBase>(childDef: IEntityDefinition<C>, field: string) => ChildSelector<C>;
export declare const getParent: <P extends IEntityBase, C extends IEntityBase>(parentDef: IEntityDefinition<P>, childDef: IEntityDefinition<C>, field: string) => ParentSelector<P, C>;
export declare const getRelated: <R extends IEntityBase, B extends IEntityBase>(rDef: IEntityDefinition<R>, bDef: IEntityDefinition<B>, aField: string, bField: string) => RelatedSelector<R, B>;
export declare const entity: <T extends IEntityBase>(def: IEntityDefinition<T>) => Entity<T>;
