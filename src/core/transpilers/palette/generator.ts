import format from "./format";
import minify from "./minify";
import { Stylesheet } from "../../../types";

export interface generateOptions {
  format: boolean;
  indent: string;
}

function generate(node: Stylesheet, options: generateOptions) {
  if (options.format) {
    return format(node, options.indent, "  ");
  } else return minify(node);
}

export default generate;
