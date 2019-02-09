"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var atp_pointfree_1 = require("atp-pointfree");
var merge = require("merge-deep");
var the_reducer_types_1 = require("./the-reducer.types");
// Reducer
var initialState = {};
var entityReducer = function (def) { return function (state, action) {
    if (state === void 0) { state = initialState; }
    var _a;
    return action.namespace === "theReducerAction" && action.entityType === def.entity && action.module === def.module
        ? atp_pointfree_1.switchOn(action.type, (_a = {},
            _a[the_reducer_types_1.EntityActionType.Add] = function () {
                var _a;
                return (__assign({}, state, (_a = {}, _a[action.entity.id] = action.entity, _a)));
            },
            _a[the_reducer_types_1.EntityActionType.AddMultiple] = function () { return (__assign({}, state, merge.apply(void 0, action.entities.map(function (entity) {
                var _a;
                return (_a = {},
                    _a[entity.id] = entity,
                    _a);
            })))); },
            _a[the_reducer_types_1.EntityActionType.Update] = function () {
                var _a;
                return (__assign({}, state, (_a = {}, _a[action.entity.id] = Object.assign({}, state[action.entity.id] || {}, action.entity), _a)));
            },
            _a[the_reducer_types_1.EntityActionType.UpdateMultiple] = function () { return (__assign({}, state, merge.apply(void 0, action.entities.map(function (entity) {
                var _a;
                return (_a = {},
                    _a[entity.id] = Object.assign({}, state[entity.id] || {}, entity),
                    _a);
            })))); },
            _a[the_reducer_types_1.EntityActionType.Delete] = function () { return atp_pointfree_1.remove(action.id)(state); },
            _a[the_reducer_types_1.EntityActionType.DeleteMultiple] = function () { return atp_pointfree_1.remove(action.ids)(state); },
            _a.default = function () { return state; },
            _a))
        : state;
}; };
var createEntityReducer = function (def) {
    var _a, _b;
    return (_a = {},
        _a[def.module] = (_b = {},
            _b[def.entity] = entityReducer(def),
            _b),
        _a);
};
// Entity reducer combiner that optimizes performance
exports.theReducer = function () {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    var mergedReducers = exports.mergeEntityReducers.apply(void 0, reducers);
    return function (state, action) {
        if (state === void 0) { state = {}; }
        return atp_pointfree_1.switchOn(action.namespace, {
            theReducerAction: function () {
                var _a;
                return (__assign({}, state, (_a = {}, _a[action.module] = moduleReducer(mergedReducers.reducer[action.module])(state[action.module], action), _a)));
            },
            default: function () { return state; }
        });
    };
};
exports.mergeEntityReducers = function () {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    return ({
        reducer: merge.apply(void 0, reducers.map(atp_pointfree_1.prop("reducer")))
    });
};
var moduleReducer = function (reducers) { return function (state, action) {
    if (state === void 0) { state = {}; }
    var _a;
    return Object.assign({}, state, (_a = {},
        _a[action.entityType] = reducers[action.entityType](state[action.entityType], action),
        _a));
}; };
// Action creators
var namespace = "theReducerAction";
var createEntityActions = function (def) { return ({
    add: function (entity) { return ({ namespace: namespace, type: the_reducer_types_1.EntityActionType.Add, entity: entity, entityType: def.entity, module: def.module }); },
    addMultiple: function (entities) { return ({ namespace: namespace, type: the_reducer_types_1.EntityActionType.AddMultiple, entities: entities, entityType: def.entity, module: def.module }); },
    delete: function (id) { return ({ namespace: namespace, type: the_reducer_types_1.EntityActionType.Delete, id: id, entityType: def.entity, module: def.module }); },
    deleteMultiple: function (ids) { return ({ namespace: namespace, type: the_reducer_types_1.EntityActionType.DeleteMultiple, ids: ids, entityType: def.entity, module: def.module }); },
    update: function (entity) { return ({ namespace: namespace, type: the_reducer_types_1.EntityActionType.Update, entity: entity, entityType: def.entity, module: def.module }); },
    updateMultiple: function (entities) { return ({ namespace: namespace, type: the_reducer_types_1.EntityActionType.UpdateMultiple, entities: entities, entityType: def.entity, module: def.module }); },
}); };
var getEntities = function (state, def) {
    return state.theReducer[def.module] && state.theReducer[def.module][def.entity]
        ? Object.keys(state.theReducer[def.module][def.entity]).map(function (key) { return Object.assign({}, def.default, state.theReducer[def.module][def.entity][key]); })
        : [];
};
var getEntity = function (state, def, id) {
    return state.theReducer[def.module] && state.theReducer[def.module][def.entity] && state.theReducer[def.module][def.entity][id]
        ? state.theReducer[def.module][def.entity][id]
        : def.default;
};
// Selectors
var selectAll = function () { return function (obj) { return true; }; };
var createEntitySelectors = function (def) { return ({
    get: function (state, id) { return getEntity(state, def, id); },
    getMultiple: function (state, f) {
        if (f === void 0) { f = selectAll(); }
        return getEntities(state, def).filter(f);
    },
}); };
exports.getChildren = function (childDef, field) {
    return function (state, parentId) {
        return exports.entity(childDef).getMultiple(state, function (child) { return child[field] === parentId; });
    };
};
exports.getParent = function (parentDef, childDef, field) {
    return function (state, childId) {
        return exports.entity(parentDef).get(state, atp_pointfree_1.prop(field)(exports.entity(childDef).get(state, childId)));
    };
};
exports.getRelated = function (rDef, bDef, aField, bField) {
    return function (state, aId) {
        var bIds = exports.entity(rDef)
            .getMultiple(state, function (r) { return r[aField] === aId; })
            .map(atp_pointfree_1.prop(bField));
        return exports.entity(bDef).getMultiple(state, function (b) { return bIds.includes(b.id); });
    };
};
// Boilerplate
exports.entity = function (def) { return (__assign({}, createEntityActions(def), createEntitySelectors(def), { reducer: createEntityReducer(def) })); };
