export * from "./entity";
export * from "./singleton";
export declare const theReducer: {
    entity: (...reducers: import("./entity").IEntityReducerContainer<any, any>[]) => import("redux").Reducer<import("./entity").ITheReducerState, import("./entity").IEntityAction<any>>;
    singleton: (...reducers: import("./singleton").ISingletonReducerContainer<any, any>[]) => import("redux").Reducer<import("./singleton").ISingletonTheReducerState, import("./singleton").ISingletonAction>;
};
