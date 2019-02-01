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
var the_reducer_types_1 = require("./the-reducer.types");
var redux_1 = require("redux");
// Reducer
var initialState = {};
var entityReducer = function (def) { return function (state, action) {
    if (state === void 0) { state = initialState; }
    var _a;
    return action.entityType === def.entity && action.module === def.module
        ? atp_pointfree_1.switchOn(action.type, (_a = {},
            _a[the_reducer_types_1.EntityActionType.Add] = function () {
                var _a;
                return Object.assign({}, state, (_a = {},
                    _a[action.entity.id] = action.entity,
                    _a));
            },
            _a[the_reducer_types_1.EntityActionType.Update] = function () {
                var _a;
                return Object.assign({}, state, (_a = {},
                    _a[action.entity.id] = Object.assign({}, state[action.entity.id] || {}, action.entity),
                    _a));
            },
            _a[the_reducer_types_1.EntityActionType.Delete] = function () { return atp_pointfree_1.remove(action.id)(state); },
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
// Recursive reducer combiner
var parseItem = function (item, key) {
    var _a;
    return (_a = {},
        _a[key] = typeof item === 'function' ? item : exports.combineReducersResursive(item),
        _a);
};
var combine = function (combined, cur) { return Object.assign({}, combined, cur); };
exports.combineReducersResursive = function (obj) { return redux_1.combineReducers(Object.keys(obj)
    .map(function (key) { return parseItem(obj[key], key); })
    .reduce(combine, {})); };
// TODO:  Create entity reducer combiner that optimizes performance
// Action creators
var createEntityActions = function (def) { return ({
    add: function (entity) { return ({ type: the_reducer_types_1.EntityActionType.Add, entity: entity, entityType: def.entity, module: def.module }); },
    update: function (entity) { return ({ type: the_reducer_types_1.EntityActionType.Update, entity: entity, entityType: def.entity, module: def.module }); },
    delete: function (id) { return ({ type: the_reducer_types_1.EntityActionType.Delete, id: id, entityType: def.entity, module: def.module }); },
}); };
var getEntities = function (state, def) {
    return state[def.module] && state[def.module][def.entity]
        ? Object.keys(state[def.module][def.entity]).map(function (key) { return state[def.module][def.entity][key]; })
        : [];
};
var getEntity = function (state, def, id) {
    return state[def.module] && state[def.module][def.entity] && state[def.module][def.entity][id]
        ? state[def.module][def.entity][id]
        : undefined;
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
        return exports.entity(parentDef).get(state, atp_pointfree_1._(atp_pointfree_1.prop(field), exports.entity(childDef).get(state, childId)));
    };
};
exports.getRelated = function (rDef, bDef, aField, bField) {
    return function (state, aId) {
        var bIds = exports.entity(rDef).getMultiple(state, function (r) { return r[aField] === aId; }).map(atp_pointfree_1.prop(bField));
        return exports.entity(bDef).getMultiple(state, function (b) { return bIds.includes(b.id); });
    };
};
// Boilerplate
exports.entity = function (def) { return (__assign({}, createEntityActions(def), createEntitySelectors(def), { reducer: createEntityReducer(def) })); };
var arcDefinition = {
    module: "comic",
    entity: "arc",
    idField: "id",
};
var pageDefinition = {
    module: "comic",
    entity: "page",
    idField: "id",
};
exports.arcRedux = __assign({}, exports.entity(arcDefinition), { pages: exports.getChildren(pageDefinition, "arcId") });
exports.pageRedux = __assign({}, exports.entity(pageDefinition), { arc: exports.getParent(arcDefinition, pageDefinition, "arcId") });
var toggleDefinition = {
    module: "ui",
    entity: "toggle",
    idField: "id"
};
exports.t = exports.entity(toggleDefinition);
exports.toggleRedux = {
    reducer: exports.t.reducer,
    show: function (id) { return exports.t.update({ id: id, isVisible: true }); },
    hide: function (id) { return exports.t.update({ id: id, isVisible: false }); },
    isOn: function (state, id) { return (exports.t.get(state, id) || { isVisible: false }).isVisible || false; }
};
