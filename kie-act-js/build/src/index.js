"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mockapi = exports.Act = void 0;
const act_1 = require("./act/act");
Object.defineProperty(exports, "Act", {
  enumerable: true,
  get: function () {
    return act_1.Act;
  },
});
const mockapi_1 = require("./mockapi/mockapi");
Object.defineProperty(exports, "Mockapi", {
  enumerable: true,
  get: function () {
    return mockapi_1.Mockapi;
  },
});
