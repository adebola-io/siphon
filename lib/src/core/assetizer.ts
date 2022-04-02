import { PathLike } from "fs";
import { HTMLDocumentNode, siphonOptions } from "../types";
import relativePath from "../utils/relativePath";
import formatter from "./formatter";
import parser from "./parser";
import tagNameSearch from "./parser/html/tagNameSearch";
function assessCSS(
  nodes: HTMLDocumentNode[],
  source: PathLike,
  options: siphonOptions
) {
  let styleLinks: HTMLDocumentNode[] = tagNameSearch(nodes, "link").filter(
    (link) => {
      return (
        link.attributes?.rel === "stylesheet" &&
        !(
          link.attributes?.href.startsWith("http://") ||
          link.attributes?.href.startsWith("https://")
        )
      );
    }
  );
  styleLinks.forEach((styleLink) => {
    let truePath = relativePath(source, styleLink.attributes?.href);
    let resource = parser.css.textify(truePath);
    if (options.internalStyles) {
      styleLink.tagName = "style";
      styleLink.content = resource;
      delete styleLink.attributes.rel;
    }
  });
  return nodes;
}

const assetizer = {
  assessCSS,
};

export default assetizer;
