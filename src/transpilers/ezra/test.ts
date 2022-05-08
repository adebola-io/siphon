import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import * as Esprima from "esprima";
import Ezra from ".";
import {
  BinaryExpression,
  BlockStatement,
  FunctionExpression,
  Identifier,
  Literal,
  VariableDeclaration,
} from "../../types";
import change_variable_names from "./traverser/examples/change_variable_names";
import transform_arrow_functions from "./traverser/examples/transform_arrow_functions";
import transform_class_to_prototype from "./traverser/examples/transform_class_to_prototype";
import transform_template_literals from "./traverser/examples/transform_template_literals";
import resolve_nullish_coalescing from "./traverser/examples/resolve_nullish_coalescing";
import resolve_optional_chaining from "./traverser/examples/resolve_optional_chaining";
import rewrite_destructured_variables from "./traverser/examples/rewrite_destructured_variables";
import default_parameters from "./traverser/examples/default_parameters";
import string_polyfill from "./traverser/examples/string_polyfills";

const text = readFileSync("src/test/source/main.js").toString();

// console.time();
// Esprima.parseScript(text, { loc: true });
// console.timeEnd();

// console.time();
// const program = Acorn.parse(text, { ecmaVersion: 2022, locations: false });
// console.timeEnd();

// console.time();
const program = Ezra.parse(text, {
  sourceFile: "src/test/source/main.js",
  sourceType: "module",
});

// transform_class_to_prototype(program);
// transform_arrow_functions(program);
// transform_template_literals(program);
// resolve_nullish_coalescing(program);
// resolve_optional_chaining(program);
// rewrite_destructured_variables(program);
// default_parameters(program);
// string_polyfill(program);
// change_variable_names(program);

// console.log(buildDependencyGraph("src/test/source/main.js"));
// const string = Ezra.generate(program, { format: true, indent: 0 });
// console.timeEnd();
// console.log(string);
// eval(string);
// writeFileSync("src/test/result.json", JSON.stringify(program));
// writeFileSync("src/test/result.js", string);
