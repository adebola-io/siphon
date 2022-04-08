import { writeFileSync } from "fs";
import { trace } from "../../../utils";
import Parser from "./tokenizer";

let js = new Parser("test/src/index.js");
// console.log(trace("test/src/index.js", js.tree.end ? js.tree.end : 0))
// console.log(js.tree);
// console.log(js.tokens);
writeFileSync("result.json", JSON.stringify(js.tokens));
