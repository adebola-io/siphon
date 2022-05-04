import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import * as Esprima from "esprima";
import Ezra from ".";

const text = readFileSync("test/test.js").toString();

console.time();
const program = Ezra.parse(text, { sourceFile: "test/test.js" });
console.timeEnd();

// console.time();
// Esprima.parseScript(text, { loc: true,  });
// console.timeEnd();

// console.time();
// const program = Acorn.parse(text, { ecmaVersion: 2022, locations: false });
// console.timeEnd();

// writeFileSync("test/ezra.json", JSON.stringify(program));
