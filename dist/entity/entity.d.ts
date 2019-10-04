import { Reducer } from 'redux';
import { ChildSelector, Entity, IEntityAction, IEntityBase, IEntityDefinition, IEntityReducerContainer, ITheReducerState, ParentSelector, RelatedSelector } from './entity.types';
export declare const theEntityReducer: (...reducers: IEntityReducerContainer<any, any>[]) => Reducer<ITheReducerState, IEntityAction<any>>;
export declare const mergeEntityReducers: (...reducers: IEntityReducerContainer<any, any>[]) => IEntityReducerContainer<any, any>;
export declare const getChildren: <T extends IEntityBase, C = {}>(childDef: IEntityDefinition<T, C>, field: string) => ChildSelector<T>;
export declare const getParent: <P extends IEntityBase, C extends IEntityBase, PC = {}, CC = {}>(parentDef: IEntityDefinition<P, PC>, childDef: IEntityDefinition<C, CC>, field: string) => ParentSelector<P, C>;
export declare const getRelated: <R extends IEntityBase, B extends IEntityBase, RC = {}, BC = {}>(rDef: IEntityDefinition<R, RC>, bDef: IEntityDefinition<B, BC>, aField: string, bField: string) => RelatedSelector<R, B>;
export declare const entity: <T extends IEntityBase, C = {}>(def: IEntityDefinition<T, C>) => Entity<T, C>;
