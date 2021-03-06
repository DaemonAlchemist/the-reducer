# The Reducer

> `the-reducer` is a fully typed generic Typescript Redux reducer generator designed to work on any normalized relational data.

## Features

- Simple - Creating a new entity (which includes the reducer, action creators, and selectors) is as easy as defining a type, and an entity definition object.
- Fully typed - Providing complete type hinting in IDEs.
- Flexible - works with any kind of entity type, including singleton entities.
- Composable - The standard entity functions can be composed into custom entity APIs.
- Optimized - Entity actions are processed only by the associated reducer.  Third-party actions are ignored entirely.

## Installing

`npm install --save the-reducer`

## Basic Usage Example

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
    theReducerEntities: theReducer.entity(myEntity, anotherEntity, aThirdEntity);
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

## Custom Entity Api Example

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

// Fetching data in mapStateToProps
toggle.isOn(state, "toggleId"); // => boolean

// Dispatching changes in mapDispatchToProps
dispatch(toggle.show("toggleId"));
dispatch(toggle.hide("toggleId"));
```

## Parent/Child Relationship Example

```javascript

import { entity, getChildren, getParent } from 'the-reducer';

interface IComicArc {
    id:string;
    name:string;
    url:string;
}

const arcDefinition = {
    module: "comic",
    entity: "arc",
    default: {id: "", name: "", url: ""}
}

interface IComicPage {
    id:string;
    name:string;
    description:string;
    arcId:string;
    sequence:number;
}

const pageDefinition = {
    module: "comic",
    entity: "page",
    default: {id: "", name: "", description: "", arcId: "", sequence: 0}
}

interface IArcRedux extends Entity<IComicArc> {
    pages: ChildSelector<IComicPage>;
}
const arc:IArcRedux = {
    ...entity<IComicArc>(arcDefinition),
    pages: getChildren<IComicPage>(pageDefinition, "arcId"),
};

interface IPageRedux extends Entity<IComicPage> {
    arc: ParentSelector<IComicArc, IComicPage>;
}
const page:IPageRedux = {
    ...entity<IComicPage>(pageDefinition),
    arc: getParent<IComicArc, IComicPage>(arcDefinition, pageDefinition, "arcId"),
};

// Fetching parents and children in mapStateToProps
arc.pages(state, props.arcId); // => IComicPage[]
page.arc(state, props.pageId); // => IComicArc
```

## Many to Many Relationship Example

```javascript
interface IComicPage {
    id:string;
    name:string;
    description:string;
    arcId:string;
    sequence:number;
}

const pageDefinition = {
    module: "comic",
    entity: "page",
    default: {id: "", name: "", description: "", arcId: "", sequence: 0}
}

interface IMedia {
    id:string;
    fileName:string;
}

const mediaDefinition = {
    module: "media",
    entity: "file",
    default: {id: "", fileName: ""},
}

interface IPageMedia {
    id:string;
    pageId:string;
    mediaId:string;
}
const pageMediaDefinition = {
    module: "media",
    entity: "pageMedia",
    default: {id: "", pageId: "", mediaId: ""}
}

interface IPageRedux extends Entity<IComicPage> {
    files: RelatedSelector<IPageMedia, IMedia>;
}
const page:IPageRedux = {
    ...entity<IComicPage>(pageDefinition),
    files: getRelated<IPageMedia, IMedia>(pageMediaDefinition, mediaDefinition, "pageId", "mediaId")
};

interface IMediaRedux extends Entity<IMedia> {
    pages: RelatedSelector<IPageMedia, IComicPage>;
}
const media:IMediaRedux = {
    ...entity<IMedia>(mediaDefinition),
    pages: getRelated<IPageMedia, IComicPage>(pageMediaDefinition, pageDefinition, "mediaId", "pageId")
}

interface IPageMediaRedux extends Entity<IPageMedia> {}
const pageMedia:IPageMediaRedux = entity<IPageMedia>(pageMediaDefinition);

// Fetching related entities in mapStateToProps
page.files(state, props.pageId); // => IMedia[]
media.pages(state, props.mediaId); // => IComicPage[]
```

## API Reference

### `entity:<T, C = {}>(def:IEntityDefinition<T, C>) => Entity<T, C>`
### `singleton:<T, C = {}>(def:IEntityDefinition<T>) => Singleton<T, C>`

The `entity` and `singleton` functions provide everything needed to setup a new Redux reducer for your entities or singletons.  The only requirement of the entity type `T` is that it has a `string` id field (this is not needed for singletons).  `C` is optional and is the type of data needed for any custom reducers.  The definition `def` has four fields:

- `module:string` - The name of the module containing your entity.
- `entity:string` - The name of the type of your entity.
- `default:T` - A default value for your entity.  This should contain default values for all fields.
- `customReducer?:ICustom[Entity|Singleton]Reducer<T, C>` - An object containing custom reducers for this entity or singleton.  The object keys are the custom reducer names, and the values are reducer functions in the form of `(state:IEntityState<T>, data:C) => IEntityState<T>` for entities and `(state:T, data:C) => T` for singletons.

The `entity` function returns an object with several fields:

- `reducer:IEntityReducer<T, C>` - The reducer object for your entity.  You will mostly ignore this field, since it's only purpose is to be extracted from the entity object when it is passed to the `theReducer` reducer creator function.
- `add:(entity:PartialEntity<T>) => IEntityAddAction<T>` - An action creator which adds a single entity to the store.
- `addMultiple:(entities:PartialEntity<T>[]) => IEntityAddMultipleAction<T>` - An action creator which adds multiple entities to the store.
- `update:(entity:PartialEntity<T>) => IEntityUpdateAction<T>` - An action creator which updates a single entity in the store.
- `updateMultiple:(entities:PartialEntity<T>[]) => IEntityUpdateAction<T>` - An action creator which updates multiple entities in the store.
- `delete:(id:string) => IEntityDeleteAction<T>` - An action creator which deletes a single entity from the store.
- `deleteMultiple:(ids:string[]) => IEntityDeleteAction<T>` - An action creator which deletes multiple entities from the store.
- `clear:() => IEntityClearAction<T>` - An action to remove all entities of a given type.
- `custom:(type:string, data:C) => IEntityCustomAction<T, C>` - Apply a custom action to the entities.
- `get:(state:IEntityContainer<T>, id:string) => Entity<T>` - A selector which fetchs a single entity.
- `getMultiple:(state:IEntityContainer<T>, filter:Filter<PartialEntity<T>>) => Entity<T>[]` - A selector which fetches multiple entities with an optional filter.
- `exists:(state:IEntityContainer<T>, id:string) => boolean` - A selector which determines whether a given entity exists.

The `singleton` function returns an object with several fields:

- `reducer:ISingletonReducer<T>` - same as from the `entity` function.
- `update:(entity:PartialSingleton<T>) => ISingltonUpdateAction<T>` - An action creator which updates the singleton in the store.
- `get:(state:ISingletonContainer<T>) => T` - A selector which fetchs the singleton.

### `theReducer.entity:(...reducers:IEntityReducerContainer<any, any>[]) => Reducer<ITheReducerState, IEntityAction<any>>`

### `theReducer.singleton:(...reducers:ISingletonReducerContainer<any, any>[]) => Reducer<ISingletonTheReducerState, ISingletonAction<any>>`

The `theReducer` functions combines separate `[Entity|Singleton]Reducer` objects into a single optimized reducer for the `theReducer[Entities|Singletons]` state slices.  It is meant to be used in your main Redux file:

```javascript
const reducer = combineReducers({
    ...,
    theReducerEntities: theReducer.entity(myEntity, anotherEntity, ...),
    theReducerSingletons: theReducer.singleton(mySingleton, anotherSingleton, ...),
    ...
});
```

### `mergeEntityReducers:(...reducers:IEntityReducerContainer<any, any>[]) => IEntityReducerContainer<any, any>`

### `mergeSingletonReducers:(...reducers:ISingletonReducerContainer<any, any>[]) => ISingletonReducerContainer<any, any>`

For large applications, you may want to handle related entities and/or singletons within a single module to avoid polluting your main Redux file with every entity in the application:

```javascript
import { myEntity } from './myEntity.ts';
... 100 other entity imports

const reducer = combineReducers({
    theReducerEntities: theReducer.entity(myEntity, ...100 other entities)
});
```

With the `merge[Entity|Singleton]Reducers` functions, you can combine related entities and/or singletons within a module to keep implementation details hidden:

```javascript
// myModule.redux.ts
import { myEntity } from './myEntity.ts';
import { anotherEntity } from './anotherEntity.ts';
import { mergeEntityReducers } from 'the-reducer';

export const myModule = mergeEntityReducers(myEntity, anotherEntity);

// reduxMain.ts
import { myModule } from './myModule';
import { anotherModuleEntities, anotherModuleSingletons } from './anotherModule';

const reducer = combineReducers({
    theReducerEntities: theReducer.entity(myModule, anotherModuleEntities),
    theReducerSingletons: theReducer.singleton(anotherModuleSingletons)
});
```

### `getChildren:<T, C = {}>(childDef:IEntityDefinition<T, C>, field:string) => ChildSelector<T>`

The `getChildren` function returns a `ChildSelector<T>` function where `T` is the type of the children entities.  This selector function can be merged into the parent's entity to provide access to children entities:

```javascript
const parent = {
    ...entity<IParent>(parentDef),
    children: getChildren<IChild>(childDef, "parentId")
}
```

The child selector can then be called from the mapStateToProps function to fetch an entity's children:

```javascript
    ...
    (state:any, props:any) => ({
        ...
        children: parent.children(state, props.parentId),
        ...
    }),
    ...
```

### `getParent:<P, C, PC = {}, CC = {}>(parentDef:IEntityDefinition<P, PC>, childDef:IEntityDefinition<C, CC>, field:string) => ParentSelector<P, C>`

The `getParent` function returns a `ParentSelector<P>` function where `P` is the type of the parent entity.  This selector function can be merged into the child's entity to provide access to the parent entity:

```javascript
const child = {
    ...entity<IChild>(childDef),
    parent: getParent<IParent, IChild>(parentDef, childDef, "parentId")
}
```

The parent selector can then be called from the mapStateToProps function to fetch an entity's parent:

```javascript
    ...
    (state:any, props:any) => ({
        ...
        parent: child.parent(state, props.childId),
        ...
    }),
    ...
```

### `getRelated:<R, B, RC = {}, RB = {}>(rDef:IEntityDefinition<R, RC>, bDef:IEntityDefinition<B, BC>, aField:string, bField:string) => RelatedSelector<R, B>`

The `getRelated` function returns a `RelatedSelector<R, B>` function where `B` is the type of the related entity, and `R` is the type of the relation entity (the mapping table).  This selector function can be merged into an entity to provide access to related entities:

```javascript
const myEntity = {
    ...entity<IMyEntity>(myEntityDef),
    otherEntities: getRelated<IMyEntityOtherEntity, IOtherEntity>(myEntityOtherEntityDef, otherEntityDef, "myEntityId", "otherEntityId")
}
```

The related selector can then be called from the mapStateToProps function to fetch an entity's related objects:

```javascript
    ...
    (state:any, props:any) => ({
        ...
        otherEntities: myEntity.otherEntities(state, props.myEntityId),
        ...
    })
    ...
```
