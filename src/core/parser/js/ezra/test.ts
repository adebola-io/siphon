import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import Ezra from ".";

const text = readFileSync("test/test.js").toString();

console.time();
Ezra.parse(text, { sourceFile: "test/test.js" });
console.timeEnd();
// writeFileSync("test/ezra.json", JSON.stringify(program));
// const string = Ezra.generate(program, { format: false });

console.time();
Acorn.parse(text, { ecmaVersion: 2022 });
console.timeEnd();
// const program = Acorn.parse(text, { ecmaVersion: 2022 });
// writeFileSync("test/acorn.json", JSON.stringify(program))
// console.log(string);
