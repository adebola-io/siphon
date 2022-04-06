import { writeFileSync } from "fs";
import { trace } from "../../../utils";
import AST from "./ast";
import Tokenizer from "./tokenizer";

let tokens = new Tokenizer("test/src/index.js").tokens;
let js = new AST(tokens);

// console.log(trace("test/src/index.js", js.tree.end ? js.tree.end : 0))
// console.log(js.tree);
// console.log(js.tokens);
writeFileSync("result.json", JSON.stringify(js.tree));
