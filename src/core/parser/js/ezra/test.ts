import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import * as Esprima from "esprima";
import Ezra from ".";

const text = readFileSync("test/test.js").toString();

console.time();
const program = Ezra.parse(text, { sourceFile: "test/test.js" });
console.timeEnd();
writeFileSync("test/ezra.json", JSON.stringify(program));

console.time();
const program2 = Esprima.parseScript(text, { loc: true });
console.timeEnd();
writeFileSync("test/esprima.json", JSON.stringify(program2));

console.time();
const program3 = Acorn.parse(text, { ecmaVersion: 2022, locations: false });
console.timeEnd();
writeFileSync("test/acorn.json", JSON.stringify(program3));
