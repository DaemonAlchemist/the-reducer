"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var entity_1 = require("./entity");
var singleton_1 = require("./singleton");
__export(require("./entity"));
__export(require("./singleton"));
exports.theReducer = {
    entity: entity_1.theEntityReducer,
    singleton: singleton_1.theSingletonReducer,
};
