import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import * as Esprima from "esprima";
import Ezra from ".";

const text = readFileSync("src/test/index.js").toString();

console.time();
Ezra.parse(text, { sourceFile: "src/test/index.js" });
console.timeEnd();

console.time();
Esprima.parseScript(text, { loc: true });
console.timeEnd();

console.time();
Acorn.parse(text, { ecmaVersion: 2022, locations: false });
console.timeEnd();

// writeFileSync("test/ezra.json", JSON.stringify(program));
