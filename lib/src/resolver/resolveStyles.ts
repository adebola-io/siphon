import { existsSync, PathLike, readFileSync } from "fs";
import Errors from "../errors";
import tagNameSearch from "../parser/html/tagNameSearch";
import { HTMLDocumentNode, siphonOptions } from "../types";
import relativePath from "../utils/relativePath";
import * as formatter from "../formatter";

/**
 * Reads through a set of HTML DOM Trees and replaces links to stylesheets with the actual stylesheet content.
 * @param nodes The tree(s) to traverse for stylesheet links.
 * @param source The source file.
 * @param options Siphon bundler options.
 * @returns Modified tree.
 */
function resolveStyles(
  nodes: HTMLDocumentNode[],
  source: PathLike,
  options?: siphonOptions
) {
  let links: HTMLDocumentNode[] = tagNameSearch(nodes, "link").filter(
    (node) => node.attributes?.rel === "stylesheet"
  );
  links.forEach((link) => {
    if (link.attributes?.href) {
      let reqFile = relativePath(source, link.attributes.href);
      if (!existsSync(reqFile)) Errors.enc("CSS_NON_EXISTENT", reqFile);
      link.type = "element";
      link.tagName = "style";
      link.isVoid = undefined;
      link.attributes = undefined;
      if (options?.formatFiles) {
        link.content = formatter.formatCSS(readFileSync(reqFile).toString());
      } else link.content = readFileSync(reqFile).toString();
    } else throw new Error();
  });
  return nodes;
}

export default resolveStyles;
