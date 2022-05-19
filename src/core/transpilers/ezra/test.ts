import { readFileSync, writeFileSync } from "fs";
// import { Parser as Acorn } from "acorn";
// const Esprima: any = require("esprima");
import Ezra from ".";
import {
  BinaryExpression,
  BlockStatement,
  FunctionExpression,
  Identifier,
  JSNode,
  Literal,
  VariableDeclaration,
} from "../../../types";
import { TraversalPath } from "./traverser/config";
import minify from "./traverser/examples/minify";
// import remove_unused_vars from "./traverser/examples/remove_unused_vars";

const text = readFileSync("src/test/source/main.js").toString();
// console.time();
// console.timeEnd();
// console.log(program);
// Ezra.bundle("src/test/source/main.js");
// console.time();
// writeFileSync(
//   "result.json",
//   JSON.stringify(Esprima.parseScript(text, { loc: true }))
// );
// console.timeEnd();

// console.time();
// Acorn.parse(text, { ecmaVersion: 2022 });
// console.timeEnd();

// console.time();
const program = Ezra.parse(text, {
  sourceFile: "src/test/source/main.js",
});
// const string = Ezra.generate(program, { format: true, indent: 0 });
// console.timeEnd();
// console.log(string);
// eval(string);
// console.log(program);
// writeFileSync("src/test/result.json", JSON.stringify(program));
// writeFileSync("src/test/result.js", string);
minify(program);
writeFileSync(
  "src/test/source/result.js",
  Ezra.generate(program, { format: false })
);
