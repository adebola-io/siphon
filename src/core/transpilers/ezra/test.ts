import { readFileSync, writeFileSync } from "fs";
// import { Parser as Acorn } from "acorn";
// import * as Esprima from "esprima";
import Ezra from ".";
import {
  BinaryExpression,
  BlockStatement,
  FunctionExpression,
  Identifier,
  Literal,
  VariableDeclaration,
} from "../../../types";

// const text = readFileSync("src/test/source/main.js").toString();

// Ezra.bundle("src/test/source/main.js", { allowJSX: true, sourceMaps: false });
// console.time();
// const program = Esprima.parseScript(text, { loc: true, jsx: true });
// console.timeEnd();

// console.time();
// const program = Acorn.parse(text, { ecmaVersion: 2022, locations: false });
// console.timeEnd();

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
