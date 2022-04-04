import {
  existsSync,
  lstatSync,
  PathLike,
  readFileSync,
  writeFile,
  writeFileSync,
} from "fs";
import Errors from "../../errors";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import getFileName from "../../utils/getFileName";
import relativePath from "../../utils/relativePath";
import formatter from "../formatter";
import minifier from "../minifier";
import parser from "../parser";
import tagNameSearch from "../parser/html/tagNameSearch";

class Resolver {
  constructor(
    sourceFile: PathLike,
    destination: PathLike,
    options: siphonOptions
  ) {
    this.options = options;
    this.source = sourceFile;
    this.destination = destination;
    this.outDir = relativePath(destination, "./");
    this.baseName = getFileName(destination);
  }
  outDir: PathLike;
  baseName: string;
  options: siphonOptions;
  source: PathLike;
  destination: PathLike;
  assets: any = {};
  resolveStyles(nodes: HTMLDocumentNode[]) {
    let styleLinks: HTMLDocumentNode[] = tagNameSearch(nodes, "link").filter(
      (link) => {
        let attributes = link.attributes;
        return (
          attributes?.rel === "stylesheet" &&
          !(
            attributes?.href.startsWith("http://") ||
            attributes?.href.startsWith("https://")
          )
        );
      }
    );
    let cssContent: string = "";
    styleLinks.forEach((link) => {
      let truePath = relativePath(this.source, link.attributes?.href);
      let resource = parser.css.textify(truePath);
      resource.links.forEach((resourceLink) => {
        if (!this.assets[resourceLink.name]) {
          if (
            existsSync(resourceLink.srcpath) &&
            !lstatSync(resourceLink.srcpath).isDirectory()
          ) {
            writeFile(
              `${this.outDir}/${resourceLink.name}`,
              readFileSync(resourceLink.srcpath),
              "base64",
              () => {}
            );
            this.assets[resourceLink.name] = resourceLink.srcpath;
          } else Errors.enc("FILE_NON_EXISTENT", resourceLink.srcpath);
        }
      });
      if (this.options.internalStyles) {
        link.tagName = "style";
        link.content = resource.text;
        delete link.attributes.rel;
        delete link.attributes.href;
      } else {
        delete link.attributes;
        delete link.content;
        delete link.type;
        delete link.parent;
        cssContent += resource.text;
      }
    });
    if (!this.options.internalStyles) {
      if (this.options.formatFiles) {
        cssContent = formatter.formatCSS(cssContent, "", "  ", true).trim();
      } else {
        cssContent = minifier.minifyCSS(cssContent);
      }
      let cssBundle = `${this.baseName}.bundle.css`;
      writeFileSync(`${this.outDir}/${cssBundle}`, cssContent);
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
  resolve(nodes: HTMLDocumentNode[]) {
    nodes = this.resolveStyles(nodes);
    return nodes;
  }
}

export default Resolver;
