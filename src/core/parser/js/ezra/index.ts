import { PathLike } from "fs";
import Errors from "../../../../errors";
import { ezra_internals } from "./base";
import "./expressions.js";
import "./group.js";
import "./reparse.js";
import "./statements.js";
import "./literals.js";
import "./utils.js";
import "./identifiers.js";

interface options {
  sourceFile: PathLike;
}
var defaults: options = {
  sourceFile: "",
};
class Ezra {
  parse(input: string, options?: options) {
    options = { ...defaults, ...options };
    try {
      return new ezra_internals().parse(input);
    } catch (e: any) {
      // throw new Error(e.message);
      Errors.enc(e.message, options.sourceFile, e.index, { token: e.char });
    }
  }
  static parse = function (input: string, options?: options) {
    return new Ezra().parse(input, options);
  };
}

export default Ezra;
