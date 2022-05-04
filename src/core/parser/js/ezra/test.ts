import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import * as Esprima from "esprima";
import Ezra from ".";

const text = readFileSync("test/test.js").toString();

console.time();
const program = Ezra.parse(text, { sourceFile: "test/test.js" });
console.timeEnd();
// writeFileSync("test/ezra.json", JSON.stringify(program));
console.log(program);

// console.time();
// Esprima.parseScript(text, { loc: true });
// console.timeEnd();

// console.time();
// const program = Acorn.parse(text, { ecmaVersion: 2022, locations: false });
// writeFileSync("test/acorn.json", JSON.stringify(program));
// console.timeEnd();
