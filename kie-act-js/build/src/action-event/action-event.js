"use strict";
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionEvent = void 0;
const os_1 = require("os");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
class ActionEvent {
  constructor() {
    this._event = {};
  }

  get event() {
    return this._event;
  }

  set event(event) {
    this._event = event;
  }

  async toActArguments() {
    if (Object.keys(this.event).length > 0) {
      const tmpPath = await (0, promises_1.mkdtemp)(
        `${(0, os_1.tmpdir)()}${path_1.default.sep}`,
      );
      this.tmpPath = tmpPath;
      const eventPath = path_1.default.join(tmpPath, "event.json");
      await (0, promises_1.writeFile)(eventPath, JSON.stringify(this.event));
      return ["-e", eventPath];
    }
    return [];
  }

  async removeEvent() {
    if (this.tmpPath) {
      await (0, promises_1.rm)(this.tmpPath, { recursive: true });
      this.tmpPath = undefined;
    }
  }
}
exports.ActionEvent = ActionEvent;
