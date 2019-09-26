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
exports.isObject = function (obj) { return typeof obj === 'object' && obj !== null && !Array.isArray(obj); };
exports.merge = function () {
    var objs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objs[_i] = arguments[_i];
    }
    return objs.reduce(function (combined, obj) {
        var newObj = __assign({}, combined);
        Object.keys(obj).forEach(function (key) {
            if (exports.isObject(obj[key]) && exports.isObject(combined[key])) {
                newObj[key] = exports.merge(combined[key], obj[key]);
            }
            else {
                newObj[key] = obj[key];
            }
        });
        return newObj;
    }, {});
};
