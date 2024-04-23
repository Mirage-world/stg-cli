"use strict";
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACT_BINARY = exports.DEFAULT_JOB = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));

exports.DEFAULT_JOB = {
  name: "",
  status: -1,
  output: "",
};

let platformBinary;
switch (os_1.default.platform()) {
  case "win32":
    platformBinary = "windows";
    break;
  case "win64":
    platformBinary = "windows";
    break;
  case "linux":
    platformBinary = "linux";
    break;
  case "darwin":
    platformBinary = "macos";
    break;
  default:
    throw new Error("Unsupported platform");
}
console.log(platformBinary);
exports.ACT_BINARY =
  process.env.ACT_BINARY ??
  path_1.default.resolve(__dirname, "..", "..", "bin", "act");
