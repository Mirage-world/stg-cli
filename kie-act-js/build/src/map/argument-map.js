"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentMap = void 0;
class ArgumentMap {
  constructor(prefix, delimiter = "=") {
    this._map = new Map();
    this.prefix = prefix;
    this.delimiter = delimiter;
  }

  get map() {
    return this._map;
  }

  /**
   * Appends prefix to each key,value to produce a string of arguments to be passed to act
   * @returns
   */
  toActArguments() {
    const args = [];
    for (const [key, val] of this._map.entries()) {
      if (Array.isArray(val)) {
        val.forEach((v) =>
          args.push(this.prefix, `${key}${this.delimiter}${v}`),
        );
      } else {
        args.push(this.prefix, `${key}${this.delimiter}${val}`);
      }
    }
    return args;
  }
}
exports.ArgumentMap = ArgumentMap;
