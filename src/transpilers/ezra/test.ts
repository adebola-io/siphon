import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import * as Esprima from "esprima";
import Ezra from ".";

const text = readFileSync("src/test/index.js").toString();

// console.time();
// Esprima.parseScript(text, { loc: true });
// console.timeEnd();

// console.time();
// const program = Acorn.parse(text, { ecmaVersion: 2022, locations: false });
// console.timeEnd();

// console.time();
const program = Ezra.parse(text, { sourceFile: "src/test/index.js" });
const string = Ezra.generate(program);
// console.timeEnd();
// console.log(string);
// writeFileSync("src/test/result.json", JSON.stringify(program));
writeFileSync("src/test/result.js", string);
