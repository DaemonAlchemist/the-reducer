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
var ts_functional_1 = require("ts-functional");
var util_1 = require("../util");
var entity_types_1 = require("./entity.types");
var namespace = "theReducerEntityAction";
// Reducer
var initialState = {};
var entityReducer = function (def) { return function (state, action) {
    if (state === void 0) { state = initialState; }
    var _a;
    return action.namespace === namespace && action.entityType === def.entity && action.module === def.module
        ? atp_pointfree_1.switchOn(action.type, (_a = {},
            _a[entity_types_1.EntityActionType.Add] = function () {
                var _a;
                return (__assign({}, state, (_a = {}, _a[action.entity.id] = __assign({}, def.default, (!!state[action.entity.id] ? state[action.entity.id] : {}), action.entity), _a)));
            },
            _a[entity_types_1.EntityActionType.AddMultiple] = function () { return (__assign({}, state, util_1.merge.apply(void 0, action.entities.map(function (entity) {
                var _a;
                return (_a = {},
                    _a[entity.id] = entity,
                    _a);
            })))); },
            _a[entity_types_1.EntityActionType.Update] = function () {
                var _a;
                return (__assign({}, state, (_a = {}, _a[action.entity.id] = util_1.merge(def.default, state[action.entity.id] || {}, action.entity), _a)));
            },
            _a[entity_types_1.EntityActionType.UpdateMultiple] = function () { return (__assign({}, state, util_1.merge.apply(void 0, action.entities.map(function (entity) {
                var _a;
                return (_a = {},
                    _a[entity.id] = util_1.merge(state[entity.id] || {}, entity),
                    _a);
            })))); },
            _a[entity_types_1.EntityActionType.Delete] = function () { return atp_pointfree_1.remove(action.id)(state); },
            _a[entity_types_1.EntityActionType.DeleteMultiple] = function () { return atp_pointfree_1.remove(action.ids)(state); },
            _a[entity_types_1.EntityActionType.Clear] = function () { return ({}); },
            _a[entity_types_1.EntityActionType.Custom] = function () { return def.customReducer
                ? (function (a) {
                    return (def.customReducer[a.customType] || (function () { return state; }))(state, a.data);
                })(action)
                : state; },
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
exports.theEntityReducer = function () {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    var mergedReducers = exports.mergeEntityReducers.apply(void 0, reducers);
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
exports.mergeEntityReducers = function () {
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
var createEntityActions = function (def) { return ({
    add: function (entity) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.Add, entity: entity, entityType: def.entity, module: def.module }); },
    addMultiple: function (entities) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.AddMultiple, entities: entities, entityType: def.entity, module: def.module }); },
    delete: function (id) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.Delete, id: id, entityType: def.entity, module: def.module }); },
    deleteMultiple: function (ids) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.DeleteMultiple, ids: ids, entityType: def.entity, module: def.module }); },
    update: function (entity) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.Update, entity: entity, entityType: def.entity, module: def.module }); },
    updateMultiple: function (entities) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.UpdateMultiple, entities: entities, entityType: def.entity, module: def.module }); },
    clear: function () { return ({ namespace: namespace, type: entity_types_1.EntityActionType.Clear, entityType: def.entity, module: def.module }); },
    custom: function (type, data) { return ({ namespace: namespace, type: entity_types_1.EntityActionType.Custom, entityType: def.entity, module: def.module, customType: type, data: data }); }
}); };
var objIdMap = new WeakMap();
var objectCount = 0;
exports.objectId = function (object) {
    if (!objIdMap.has(object)) {
        objIdMap.set(object, ++objectCount);
    }
    return objIdMap.get(object);
};
var __getEntities = ts_functional_1.memoize(function (state, defaultVal, entity, objId) {
    return Object.keys(state).map(function (key) { return Object.assign({}, defaultVal, state[key]); });
}, { keyGen: function (args) {
        var entity = args[2];
        var objId = args[3];
        var key = entity + ":" + objId;
        return key;
    } });
var getEntities = function (state, def) {
    return state.theReducerEntities[def.module] && state.theReducerEntities[def.module][def.entity]
        ? __getEntities(state.theReducerEntities[def.module][def.entity], def.default, def.entity, exports.objectId(state.theReducerEntities[def.module][def.entity]))
        : [];
};
var getEntity = function (state, def, id) {
    return state.theReducerEntities[def.module] && state.theReducerEntities[def.module][def.entity] && state.theReducerEntities[def.module][def.entity][id]
        ? state.theReducerEntities[def.module][def.entity][id]
        : def.default;
};
var entityExists = function (state, def, id) {
    return !!state.theReducerEntities[def.module] && !!state.theReducerEntities[def.module][def.entity] && !!state.theReducerEntities[def.module][def.entity][id];
};
// Selectors
var selectAll = function () { return function (obj) { return true; }; };
var createEntitySelectors = function (def) { return ({
    exists: function (state, id) { return entityExists(state, def, id); },
    get: function (state, id) { return getEntity(state, def, id); },
    getMultiple: ts_functional_1.memoize(function (state, f) {
        if (f === void 0) { f = selectAll(); }
        return getEntities(state, def).filter(f);
    }, { keyGen: function (args) { return args.map(exports.objectId).join(":"); } }),
}); };
var childFilter = ts_functional_1.memoize(function (parentId, field) { return function (child) { return child[field] === parentId; }; }, {});
exports.getChildren = function (childDef, field) {
    return function (state, parentId) {
        return exports.entity(childDef).getMultiple(state, childFilter(parentId, field));
    };
};
exports.getParent = function (parentDef, childDef, field) {
    return function (state, childId) {
        return exports.entity(parentDef).get(state, atp_pointfree_1.prop(field)(exports.entity(childDef).get(state, childId)));
    };
};
var relatedFilter = ts_functional_1.memoize(function (aId, aField) { return function (r) { return r[aField] === aId; }; }, {});
exports.getRelated = function (rDef, bDef, aField, bField) {
    return function (state, aId) {
        var bIds = exports.entity(rDef)
            .getMultiple(state, relatedFilter(aId, aField))
            .map(atp_pointfree_1.prop(bField));
        return exports.entity(bDef).getMultiple(state, function (b) { return bIds.includes(b.id); });
    };
};
// Boilerplate
exports.entity = function (def) { return (__assign({}, createEntityActions(def), createEntitySelectors(def), { reducer: createEntityReducer(def) })); };
