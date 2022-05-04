import { PathLike } from "fs";
import { ezra_parse_internals } from "./base.js";
import "./expressions.js";
import "./modules.js";
import "./group.js";
import "./reparse.js";
import "./statements.js";
import "./literals.js";
import "./utils.js";
import "./functions.js";
import "./classes.js";
import "./objects.js";
import "./identifiers.js";
import "./for.js";

export interface parserOptions {
  sourceFile: PathLike;
}
var defaults: parserOptions = {
  sourceFile: "",
};
class Parser {
  parse(input: string, options?: parserOptions) {
    options = { ...defaults, ...options };
    return new ezra_parse_internals().parse(input, options);
  }
}

export default Parser;
