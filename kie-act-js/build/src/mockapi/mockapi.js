"use strict";
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mockapi = void 0;
const fs_1 = require("fs");
const ajv_1 = __importDefault(require("ajv"));
const api_schema_1 = require("../mockapi/schema/api-schema");
const request_mocker_1 = require("../mockapi/request/request-mocker");
class Mockapi {
  constructor(apiSchema, allowUnmocked = false) {
    this.apiSchema = this.validateAPISchema(apiSchema);
    this._mock = this.apiSchemaToMethod();
    this.allowUnmocked = allowUnmocked;
  }

  /**
   * Returns the request mocker functions generated from api schema
   */
  get mock() {
    return this._mock;
  }

  /**
   * For each endpoint for each api it generates a request mocker function just like moctokit
   * @returns
   */
  apiSchemaToMethod() {
    const methods = {};
    for (const apiName in this.apiSchema) {
      if (!methods[apiName]) {
        methods[apiName] = {};
      }
      for (const scope in this.apiSchema[apiName].endpoints) {
        if (!methods[apiName][scope]) {
          methods[apiName][scope] = {};
        }
        for (const methodName in this.apiSchema[apiName].endpoints[scope]) {
          methods[apiName][scope][methodName] =
            new request_mocker_1.MockapiRequestMocker(
              this.apiSchema[apiName].baseUrl,
              this.apiSchema[apiName].endpoints[scope][methodName],
              this.allowUnmocked,
            ).request;
        }
      }
    }
    return methods;
  }

  validateAPISchema(apiSchema) {
    const rawJSON =
      typeof apiSchema === "string"
        ? JSON.parse((0, fs_1.readFileSync)(apiSchema, "utf8"))
        : apiSchema;
    const ajv = new ajv_1.default({ allowUnionTypes: true });
    const validate = ajv.compile(api_schema_1.APISchema);
    if (validate(rawJSON)) {
      return rawJSON;
    } else {
      throw new Error(JSON.stringify(validate.errors));
    }
  }
}
exports.Mockapi = Mockapi;
