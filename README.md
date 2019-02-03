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
import { combineReducersRecursive } from 'the-reducer';
import merge from 'merge-deep';

const reducer = combineReducersRecursive(merge(myEntity.reducer, anotherEntity.reducer, aThirdEntity.reducer));

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