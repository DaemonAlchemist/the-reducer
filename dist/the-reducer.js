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
// Reducer
var initialState = {};
// TODO:  Validate that T's id field is a string
var entityReducer = function (def) { return function (state, action) {
    if (state === void 0) { state = initialState; }
    var _a;
    return atp_pointfree_1.switchOn(action.type, (_a = {},
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
        _a));
}; };
exports.createEntityReducer = function (def) {
    var _a, _b;
    return (_a = {},
        _a[def.module] = (_b = {},
            _b[def.entity] = entityReducer(def),
            _b),
        _a);
};
// Action creators
exports.createEntityActions = function (def) { return ({
    add: function (entity) { return ({ type: the_reducer_types_1.EntityActionType.Add, entity: entity }); },
    update: function (entity) { return ({ type: the_reducer_types_1.EntityActionType.Update, entity: entity }); },
    delete: function (id) { return ({ type: the_reducer_types_1.EntityActionType.Delete, id: id }); },
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
exports.createEntitySelectors = function (def) { return ({
    get: function (state, id) { return getEntity(state, def, id); },
    getMultiple: function (state, f) {
        if (f === void 0) { f = selectAll(); }
        return getEntities(state, def).filter(f);
    },
}); };
exports.getChildren = function (childDef, field) {
    return function (state, parentId) {
        return exports.entityRedux(childDef).getMultiple(state, function (child) { return child[field] === parentId; });
    };
};
exports.getParent = function (parentDef, childDef, field) {
    return function (state, childId) {
        return exports.entityRedux(parentDef).get(state, atp_pointfree_1._(atp_pointfree_1.prop(field), exports.entityRedux(childDef).get(state, childId)));
    };
};
exports.getRelated = function (rDef, bDef, aField, bField) {
    return function (state, aId) {
        var bIds = exports.entityRedux(rDef).getMultiple(state, function (r) { return r[aField] === aId; }).map(atp_pointfree_1.prop(bField));
        return exports.entityRedux(bDef).getMultiple(state, function (b) { return bIds.includes(b.id); });
    };
};
// Boilerplate
exports.entityRedux = function (def) { return (__assign({}, exports.createEntityActions(def), exports.createEntitySelectors(def))); };
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
exports.arcReducer = entityReducer(arcDefinition);
exports.arcRedux = __assign({}, exports.entityRedux(arcDefinition), { pages: exports.getChildren(pageDefinition, "arcId") });
exports.pageReducer = entityReducer(pageDefinition);
exports.pageRedux = __assign({}, exports.entityRedux(pageDefinition), { arc: exports.getParent(arcDefinition, pageDefinition, "arcId") });
var toggleDefinition = {
    module: "ui",
    entity: "toggle",
    idField: "id"
};
exports.toggleReducer = entityReducer(toggleDefinition);
exports.t = exports.entityRedux(toggleDefinition);
exports.toggleRedux = {
    show: function (id) { return exports.t.update({ id: id, isVisible: true }); },
    hide: function (id) { return exports.t.update({ id: id, isVisible: false }); },
    isOn: function (state, id) { return (exports.t.get(state, id) || { isVisible: false }).isVisible || false; }
};
