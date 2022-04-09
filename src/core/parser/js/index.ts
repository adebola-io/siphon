import { writeFileSync } from "fs";
import { trace } from "../../../utils";
import Parser from "./parser";

let js = new Parser("test/src/index.js");
writeFileSync("result.json", JSON.stringify(js.tokens));
