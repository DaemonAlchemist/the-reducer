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
var util_1 = require("../util");
var singleton_types_1 = require("./singleton.types");
var namespace = "theReducerSingletonAction";
// Reducer
var singletonReducer = function (def) { return function (state, action) {
    if (state === void 0) { state = def.default; }
    var _a;
    return action.namespace === namespace && action.entityType === def.entity && action.module === def.module
        ? atp_pointfree_1.switchOn(action.type, (_a = {},
            _a[singleton_types_1.SingletonActionType.Update] = function () { return util_1.merge(state, action.entity); },
            _a.default = function () { return state; },
            _a))
        : state;
}; };
var createSingletonReducer = function (def) {
    var _a, _b;
    return (_a = {},
        _a[def.module] = (_b = {},
            _b[def.entity] = singletonReducer(def),
            _b),
        _a);
};
// Entity reducer combiner that optimizes performance
exports.theSingletonReducer = function () {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    var mergedReducers = exports.mergeSingletonReducers.apply(void 0, reducers);
    return function (state, action) {
        if (state === void 0) { state = {}; }
        var _a;
        return atp_pointfree_1.switchOn(action.namespace, (_a = {},
            _a[namespace] = function () {
                var _a;
                return (__assign({}, state, (_a = {}, _a[action.module] = moduleReducer(mergedReducers.reducer[action.module])(state[action.module], action), _a)));
            },
            _a.default = function () { return state; },
            _a));
    };
};
exports.mergeSingletonReducers = function () {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    return ({
        reducer: util_1.merge.apply(void 0, reducers.map(atp_pointfree_1.prop("reducer")))
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
var createSingletonActions = function (def) { return ({
    update: function (entity) { return ({ namespace: namespace, type: singleton_types_1.SingletonActionType.Update, entity: entity, entityType: def.entity, module: def.module }); },
}); };
var getSingleton = function (state, def) {
    return state.theReducerSingletons[def.module] && state.theReducerSingletons[def.module][def.entity]
        ? state.theReducerSingletons[def.module][def.entity]
        : def.default;
};
// Selectors
var createSingletonSelectors = function (def) { return ({
    get: function (state) { return getSingleton(state, def); },
}); };
// Boilerplate
exports.singleton = function (def) { return (__assign({}, createSingletonActions(def), createSingletonSelectors(def), { reducer: createSingletonReducer(def) })); };
