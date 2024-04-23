"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionInput = void 0;
const argument_map_1 = require("../map/argument-map");
class ActionInput {
  constructor(event) {
    this.input = new argument_map_1.ArgumentMap("--input");
    this.event = event;
  }

  get map() {
    return this.input.map;
  }

  toActArguments() {
    if (Object.keys(this.event.event).length > 0) {
      const eventCopy = { ...this.event.event };
      eventCopy.inputs = Object.fromEntries(this.input.map);
      this.event.event = eventCopy;
      return [];
    } else {
      return this.input.toActArguments();
    }
  }
}
exports.ActionInput = ActionInput;
