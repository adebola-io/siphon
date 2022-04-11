import { PathLike, readFile, readFileSync, writeFileSync } from "fs";
import { basename, extname, resolve } from "path";
import Errors from "../../errors";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import {
  fileExists,
  copy,
  relativePath,
  tryMkingDir,
  getFileName,
  imageExts,
} from "../../utils";
import formatter from "../formatter";
import minifier from "../minifier";
import parser from "../parser";
import createDOMTree from "../parser/html/createDOMTree";
import tagNameSearch from "../parser/html/tagNameSearch";

class Resolver {
  constructor(
    sourceFile: PathLike,
    destination: PathLike,
    options: siphonOptions,
    assets = {},
    injectMode?: boolean
  ) {
    this.assets = assets;
    this.options = options;
    this.source = sourceFile;
    this.injectMode = injectMode;
    this.srcName = basename(this.source.toString());
    this.destination = destination;
    this.outDir = relativePath(destination, "./");
    this.destBaseName = getFileName(destination);
    this.assets[this.srcName] = resolve(this.source.toString());
  }
  outDir: PathLike;
  destBaseName: string;
  srcName: string;
  options: siphonOptions;
  source: PathLike;
  destination: PathLike;
  assets: any;
  injectMode?: boolean;
  resolveInjects(nodes: HTMLDocumentNode[], assets?: {}) {
    const injects: HTMLDocumentNode[] = tagNameSearch(nodes, "inject");
    injects.forEach((inject) => {
      if (!inject.attributes?.src)
        Errors.enc("INJECT_REQUIRES_SRC", this.source);
      let truePath = relativePath(this.source, inject.attributes.src);
      if (basename(truePath) === this.srcName)
        Errors.enc("HTML_SELF_INJECT", this.source);
      if (!fileExists(truePath)) Errors.enc("FILE_NON_EXISTENT", truePath);
      let injectNodes = createDOMTree(truePath);
      new Resolver(
        truePath,
        this.destination,
        this.options,
        this.assets,
        true
      ).resolve(injectNodes);
      inject.parent?.children.splice(inject.childID, 1, ...injectNodes);
    });
  }
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
      let resource = parser.css.textify(
        truePath,
        { ...this.assets },
        this.options
      );
      this.assets = resource.assets;
      resource.links.forEach((resourceLink) => {
        if (fileExists(resourceLink.srcpath)) {
          let outputpath = `${this.outDir}/${resourceLink.name}`;
          if (
            imageExts.includes(extname(resourceLink.name)) &&
            this.options.storeImagesSeparately
          ) {
            tryMkingDir(`${this.outDir}/img`);
            outputpath = `${this.outDir}/img/${resourceLink.name}`;
          }
          copy(resourceLink.srcpath, outputpath);
        } else Errors.enc("FILE_NON_EXISTENT", resourceLink.srcpath);
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
    if (!this.options.internalStyles && !this.injectMode) {
      if (this.options.formatFiles) {
        cssContent = formatter.formatCSS(cssContent, "", "  ", true).trim();
      } else {
        cssContent = minifier.minifyCSS(cssContent);
      }
      let cssBundle = `${this.destBaseName}.bundle.css`;
      writeFileSync(`${this.outDir}/${cssBundle}`, cssContent);
      let head: HTMLDocumentNode = tagNameSearch(nodes, "head")[0];
      head?.children?.push({
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
  resolveImages(nodes: HTMLDocumentNode[]) {
    const images: HTMLDocumentNode[] = tagNameSearch(nodes, "img").filter(
      (images) => {
        return !(
          images.attributes?.src.startsWith("http://") ||
          images.attributes?.src.startsWith("http://")
        );
      }
    );
    images.forEach((image) => {
      let src = image.attributes?.src;
      if (!imageExts.includes(extname(src))) {
        if (this.options.checkImageTypes)
          Errors.enc("UNSUPPORTED_IMAGE_FORMAT", this.source, image.start, {
            src,
          });
      } else {
        let truePath = relativePath(this.source, src);
        if (!fileExists(truePath)) {
          Errors.enc("FILE_NON_EXISTENT", truePath);
        }

        let fileMarker = basename(src);
        if (this.options.storeImagesSeparately)
          tryMkingDir(`${this.outDir}/img`);
        if (this.assets[fileMarker] && this.assets[fileMarker] === truePath) {
          image.attributes.src = this.injectMode
            ? truePath
            : `./${this.options.storeImagesSeparately ? "img/" : ""}${basename(
                src
              )}`;
        } else if (
          this.assets[fileMarker] &&
          this.assets[fileMarker] !== truePath
        ) {
          let a = 1;
          while (
            this.assets[`${getFileName(truePath)}-${a}${extname(truePath)}`]
          ) {
            a++;
          }
          let newname = `${getFileName(truePath)}-${a}${extname(truePath)}`;
          image.attributes.src = this.injectMode
            ? truePath
            : `./${this.options.storeImagesSeparately ? "img/" : ""}${newname}`;
          copy(
            truePath,
            `${this.outDir}/${
              this.options.storeImagesSeparately ? "img/" : ""
            }${newname}`
          );
        } else if (this.assets[fileMarker] === undefined) {
          copy(
            truePath,
            `${this.outDir}/${
              this.options.storeImagesSeparately ? "img/" : ""
            }${fileMarker}`
          );
          image.attributes.src = this.injectMode
            ? truePath
            : `./${this.options.storeImagesSeparately ? "img/" : ""}${basename(
                src
              )}`;
          this.assets[fileMarker] = truePath;
        }
      }
    });
    return nodes;
  }
  resolveScripts(nodes: HTMLDocumentNode[]) {
    const scripts: HTMLDocumentNode[] = tagNameSearch(nodes, "script").filter(
      (script) => script.attributes?.src
    );
    if (this.options.internalJS) {
      scripts.forEach((script) => {
        let truePath = relativePath(this.source, script.attributes.src);
        if (!fileExists(truePath)) Errors.enc("FILE_NON_EXISTENT", truePath);
        script.content = readFileSync(truePath).toString();
        delete script.attributes.src;
      });
    }
  }
  resolve(nodes: HTMLDocumentNode[]) {
    if (this.options.htmlInjects) this.resolveInjects(nodes);
    this.resolveImages(nodes);
    this.resolveStyles(nodes);
    this.resolveScripts(nodes);
    return nodes;
  }
}

export default Resolver;
