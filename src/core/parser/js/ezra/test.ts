import { readFileSync, writeFileSync } from "fs";
import { Parser as Acorn } from "acorn";
import Ezra from ".";

const text = readFileSync("test/src/index.js").toString();

const program = Ezra.parse(text, { sourceFile: "test/src/index.js" });
writeFileSync("test/src/rive.json", JSON.stringify(program));

// const program = Acorn.parse(text, { ecmaVersion: 2020 });
// writeFileSync("test/src/acorn.json", JSON.stringify(program));

console.log(program);
