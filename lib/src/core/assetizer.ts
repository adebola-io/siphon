import { link, PathLike, writeFileSync } from "fs";
import path = require("path");
import { HTMLDocumentNode, siphonOptions } from "../types";
import fileName from "../utils/fileName";
import forceCreatePath from "../utils/forceMkDir";
import relativePath from "../utils/relativePath";
import formatter from "./formatter";
import minifier from "./minifier";
import parser from "./parser";
import tagNameSearch from "./parser/html/tagNameSearch";
function assessCSS(
  nodes: HTMLDocumentNode[],
  source: PathLike,
  options: siphonOptions,
  destination: PathLike
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
  let cssContent: string = "";
  styleLinks.forEach((styleLink) => {
    let truePath = relativePath(source, styleLink.attributes?.href);
    let resource = parser.css.textify(truePath);
    if (options.internalStyles) {
      styleLink.tagName = "style";
      styleLink.content = resource;
      delete styleLink.attributes.rel;
    } else {
      delete styleLink.attributes;
      delete styleLink.content;
      delete styleLink.type;
      delete styleLink.parent;
      cssContent += resource;
    }
  });
  if (!options.internalStyles) {
    let outputFolder = relativePath(destination, "./");
    if (options.formatFiles) {
      cssContent = formatter.formatCSS(cssContent, "", "  ", true).trim();
    } else {
      cssContent = minifier.minifyCSS(cssContent);
    }
    let cssBundle = `${fileName(destination)}.bundle.css`;
    writeFileSync(`${outputFolder}/${cssBundle}`, cssContent);
    let head: HTMLDocumentNode = tagNameSearch(nodes, "head")[0];
    head.children?.push({
      type: "element",
      tagName: "link",
      isVoid: true,
      attributeList: `rel="stylesheet" href="./${cssBundle}"`,
      attributes: {
        rel: `stylesheet`,
        href: `./${cssBundle}`,
      },
    });
  }
  return nodes;
}

const assetizer = {
  assessCSS,
};

export default assetizer;
