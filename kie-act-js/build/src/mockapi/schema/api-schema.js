"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APISchema = void 0;
const endpoints_1 = require("../../mockapi/schema/endpoints");
exports.APISchema = {
  type: "object",
  additionalProperties: {
    type: "object",
    properties: {
      baseUrl: {
        type: "string",
      },
      endpoints: endpoints_1.EndpointSchema,
    },
    required: ["baseUrl", "endpoints"],
  },
  required: [],
};
