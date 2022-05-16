import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
const Esprima: any = require("esprima");
import Ezra from ".";
import {
  BinaryExpression,
  BlockStatement,
  FunctionExpression,
  Identifier,
  Literal,
  VariableDeclaration,
} from "../../../types";

const text = readFileSync("src/test/source/main.js").toString();
console.time();
Ezra.parse(text, { sourceFile: "src/test/source/main.js" });
console.timeEnd();
// console.log(program);
// Ezra.bundle("src/test/source/main.js");
console.time();
Esprima.parseScript(text, { loc: true });
console.timeEnd();

console.time();
Acorn.parse(text, { ecmaVersion: 2022 });
console.timeEnd();

// console.time();
// const program = Ezra.parse(text, {
//   sourceFile: "src/test/source/main.js",
//   parseJSX: true,
// });
// const string = Ezra.generate(program, { format: true, indent: 0 });
// console.timeEnd();
// console.log(string);
// eval(string);
// console.log(program);
// writeFileSync("src/test/result.json", JSON.stringify(program));
// writeFileSync("src/test/result.js", string);
