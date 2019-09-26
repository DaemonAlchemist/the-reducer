import { theEntityReducer } from "./entity";
import { theSingletonReducer } from "./singleton";

export * from "./entity";
export * from "./singleton";

export const theReducer = {
    entity: theEntityReducer,
    singleton: theSingletonReducer,
}
