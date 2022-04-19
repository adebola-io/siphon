import { PathLike, readFileSync } from "fs";
import Errors from "../../errors";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import { fileExists, relativePath } from "../../utils";
import Formatter from "../formatter/formatJS";
import classSearch from "../parser/html/classSearch";
import tagNameSearch from "../parser/html/tagNameSearch";
import tokenize from "../parser/js/tokenizer";

/**
 * Perform required transformations on the relationship between Javascript and HTML.
 * @param nodes The DOM tree of the HTML.
 * @param source The source file.
 * @param destination The destination folder.
 * @param assets A mapping of all required assets e.g. images, fonts, etc.
 * @param options Bundling options.
 */
function resolveJS(
  nodes: HTMLDocumentNode[],
  source: PathLike,
  destination: PathLike,
  assets: any,
  options: siphonOptions
) {
  const trail: string[] = [];
  let outputScript = "";
  const scripts: HTMLDocumentNode[] = tagNameSearch(nodes, "script");
  scripts.forEach((script) => {
    let src = script.attributes?.src;
    if (src) {
      delete script.content;
      src = relativePath(source, src);
      if (fileExists(src)) {
        trail.push(src);
        const tokens = tokenize(readFileSync(src).toString());
        if (options.internalJS || options.wickedMode) {
          if (options.formatFiles) {
            script.content = Formatter.format(tokens, "     ", "  ");
          }
        }
        delete script.attributes.src;
      } else Errors.enc("FILE_NON_EXISTENT", src);
    }
  });

  return nodes;
}
export default resolveJS;
