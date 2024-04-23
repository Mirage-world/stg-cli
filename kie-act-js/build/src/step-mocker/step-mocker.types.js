"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStepIdentifierUsingRun =
  exports.isStepIdentifierUsingUses =
  exports.isStepIdentifierUsingId =
  exports.isStepIdentifierUsingName =
    void 0;
function isStepIdentifierUsingName(step) {
  return Object.prototype.hasOwnProperty.call(step, "name");
}
exports.isStepIdentifierUsingName = isStepIdentifierUsingName;
function isStepIdentifierUsingId(step) {
  return Object.prototype.hasOwnProperty.call(step, "id");
}
exports.isStepIdentifierUsingId = isStepIdentifierUsingId;
function isStepIdentifierUsingUses(step) {
  return Object.prototype.hasOwnProperty.call(step, "uses");
}
exports.isStepIdentifierUsingUses = isStepIdentifierUsingUses;
function isStepIdentifierUsingRun(step) {
  return Object.prototype.hasOwnProperty.call(step, "run");
}
exports.isStepIdentifierUsingRun = isStepIdentifierUsingRun;
