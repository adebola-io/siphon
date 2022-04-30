import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import Ezra from ".";

const text = readFileSync("test/test.js").toString();

const program = Ezra.parse(text, { sourceFile: "test/test.js" });
writeFileSync("test/ezra.json", JSON.stringify(program));

// const program = Acorn.parse(text, { ecmaVersion: 2022 });
// writeFileSync("test/acorn.json", JSON.stringify(program));

console.log(program);
