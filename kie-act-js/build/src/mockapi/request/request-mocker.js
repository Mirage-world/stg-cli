"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockapiRequestMocker = void 0;
const mock_github_1 = require("@kie/mock-github");
const response_mocker_1 = require("../../mockapi/response/response-mocker");
class MockapiRequestMocker extends mock_github_1.RequestMocker {
  constructor(baseUrl, endpointDetails, allowUnmocked = false) {
    super(baseUrl, endpointDetails, allowUnmocked);
    // need to bind the instance context to the function. otherwise it is lost during method generation
    this.request = this.request.bind(this);
  }

  request(params) {
    const { path, query, requestBody } = this.parseParams(params);
    return new response_mocker_1.MockapiResponseMocker(
      this.baseUrl,
      path,
      this.endpointDetails.method,
      query,
      requestBody,
      this.allowUnmocked,
    );
  }
}
exports.MockapiRequestMocker = MockapiRequestMocker;
