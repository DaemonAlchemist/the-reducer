# The Reducer

> `the-reducer` is a fully typed generic Typescript Redux reducer generator designed to work on any normalized relational data.

## Installing

`npm install --save the-reducer`

## Basic Usage

```javascript
// myEntity.redux.ts`

import { entity } from 'the-reducer';

interface MyEntity {
    id:string; // <--Required
    name:string;
    count:number;
    isActive:boolean;
};

const myEntityDef = {
    module: "myModule",
    entity: "myEntity",
    default: {id: "", name: "", count: "", isActive: ""}
};

export const myEntity = entity<MyEntity>(myEntityDef);

// reduxMain.js

import { myEntity } from './myEntity.redux.ts';
import { anotherEntity } from './anotherEntity.redux.ts';
import { aThirdEntity } from './aThirdEntity.redux.ts';
import { theReducer } from 'the-reducer';
import { combineReducers } from 'redux';

const reducer = combineReducers({
    theReducer: theReducer(myEntity, anotherEntity, aThirdEntity);
});

const store = createStore(reducer, ...);

// someReduxContainer.ts

import { myEntity } from './myEntity.redux.ts';
import { connect } from 'react-redux';

const Component = connect<...>(
    (state:any, props:any) => ({
        entity: myEntity.get(state, props.id),
        otherEntities: myEntity.getMultiple(state, someFilter);
    }),
    (dispatch:any, props:any) => ({
        fetchEntityHandler:() => {
            someApi.getEntity(props.id).then((response:any) => {
                dispatch(myEntity.add(response.body.entity));
            });
        },
        deleteEntityHandler() => {
            dispatch(myEntity.delete(props.id));
        }
    })
)(SomeComponent);

```

## Custom Entity Api

```javascript
// toggle.redux.ts

import { entity } from 'the-reducer';

interface IToggle {
    id:string;
    isVisible:boolean;
}

const toggleDefinition = {
    module: "ui",
    entity: "toggle",
    default: {id: "", isVisible: false}
}

interface IToggleRedux {
    reducer: IEntityReducer<IToggle>,
    show: (id:string) => IEntityAction<IToggle>;
    hide: (id:string) => IEntityAction<IToggle>;
    isOn: (state:IEntityContainer<IToggle>, id:string) => boolean;
}

const t = entity<IToggle>(toggleDefinition);
const toggle:IToggleRedux = {
    reducer: t.reducer,
    show: (id:string) => t.update({id, isVisible: true}),
    hide: (id:string) => t.update({id, isVisible: false}),
    isOn: (state:IEntityContainer<IToggle>, id:string) => t.get(state, id).isVisible || false
};

// Fetching from state
toggle.isOn(state, "toggleId"); // boolean

// Dispatching changes
dispatch(toggle.show("toggleId"));
dispatch(toggle.hide("toggleId"));
```

## Parent/Child Relationships

```javascript
// TODO
```

## Many to Many Relationship

```javascript
// TODO
```

## API Reference

### `entity:<T>(def:IEntityDefinition<T>) => Entity<T>`

The `entity` function provides everything needed to setup a new Redux reducer for your entities.  The only requirement of the entity type `T` is that it has a `string` id field.  The definition `def` has three fields:

- `module:string` - The name of the module containing your entity.
- `entity:string` - The name of the type of your entity.
- `default:T` - A default value for your entity.  This should contain default values for all fields.

The `entity` function returns an object with several fields:

- `reducer:IEntityReducer<T>` - The reducer object for your entity.  You will mostly ignore this field, since it's only purpose is to be extracted from the entity object when it is passed to the `theReducer` reducer creator function.
- `add:(entity:PartialEntity<T>) => IEntityAddAction<T>` - An action creator which returns an add action for your entity.
- `update:(entity:PartialEntity<T>) => IEntityUpdateAction<T>` - An action creator which returns an update action for your entity.
- `delete:(id:string) => IEntityDeleteAction<T>` - An action creator which returns a delete action for your entity.
- `get:(state:IEntityContainer<T>, id:string) => PartialEntity<T>` - A selector which fetchs a single entity.
- `getMultiple:(state:IEntityContainer<T>, filter:Filter<PartialEntity<T>>) => PartialEntity<T>[]` - A selector which fetches multiple entities with an optional filter.

### `theReducer:(...reducers:IEntityReducerContainer<any>[]) => Reducer<ITheReducerState, IEntityAction<any>>`

The `theReducer` function combines separate `EntityReducer` objects into a single optimized reducer for the `theReducer` state slice.  It is meant to be used in your main Redux file:

```javascript
const reducer = combineReducers({
    ...,
    theReducer: theReducer(myEntity, anotherEntity, ...),
    ...
});
```

### `mergeEntityReducers:(...reducers:IEntityReducerContainer<any>[]) => IEntityReducerContainer<any>`

For large applications, you may want to handle related entities within a single module to avoid polluting your main Redux file with every entity in the application:

```javascript
import { myEntity } from './myEntity.ts';
... 100 other entity imports

const reducer = combineReducers({
    theReducer: theReducer(myEntity, ...100 other entities)
});
```

With the `mergeEntityReducers` function, you can combine related entities within a module to keep implementation details hidden:

```javascript
// myModule.redux.ts
import { myEntity } from './myEntity.ts';
import { anotherEntity } from './anotherEntity.ts';
import { mergeEntityReducers } from 'the-reducer';

export const myModuleReducers = mergeEntityReducers(myEntity, anotherEntity);

// reduxMain.ts
import { myModuleReducers } from './myModule';
import { anotherModule } from './anotherModule';

const reducer = combineReducers({
    theReducer: theReducer(myModule, anotherModule)
});
```

### `getChildren:<C>(childDef:IEntityDefinition<C>, field:string) => ChildSelector<C>`

```javascript
// TODO
```

### `getParent:<P, C>(parentDef:IEntityDefinition<P>, childDef:IEntityDefinition<C>, field:string) => ParentSelector<P, C>`

```javascript
// TODO
```

### `getRelated:<R, B>(rDef:IEntityDefinition<R>, bDef:IEntityDefinition<B>, aField:string, bField:string) => RelatedSelector<R, B>`

```javascript
// TODO
```
