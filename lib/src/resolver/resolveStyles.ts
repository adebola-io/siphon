import { existsSync, PathLike, readFileSync } from "fs";
import Errors from "../errors";
import tagNameSearch from "../parser/html/tagNameSearch";
import { HTMLDocumentNode } from "../types/html";
import relativePath from "../utils/relativePath";

function resolveStyles(nodes: HTMLDocumentNode[], source: PathLike) {
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
      link.content = readFileSync(reqFile)
        .toString()
        .replace(/\n|\t|\r/g, "");
    } else throw new Error();
  });
  return nodes;
}

export default resolveStyles;
