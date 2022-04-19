import { PathLike, readFileSync } from "fs";
import { basename, extname, resolve } from "path";
import Errors from "../../errors";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import {
  fileExists,
  copy,
  relativePath,
  tryMkingDir,
  getFileName,
  stringifytoBase64,
} from "../../utils";
import createDOMTree from "../parser/html/createDOMTree";
import tagNameSearch from "../parser/html/tagNameSearch";
import resolveCSS from "./resolveCSS";
import resolveJS from "./resolveJS";

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
  resolveInjects(nodes: HTMLDocumentNode[]) {
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
      let truePath = relativePath(this.source, src);
      if (!fileExists(truePath)) {
        Errors.enc("FILE_NON_EXISTENT", truePath);
      }
      if (this.options.wickedMode) {
        image.attributes.src = stringifytoBase64(truePath);
      } else {
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
  resolveJS = resolveJS;
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
  resolveCSS = resolveCSS;
  resolve(nodes: HTMLDocumentNode[]) {
    nodes = this.resolveImages(nodes);
    nodes = this.resolveCSS(
      nodes,
      this.source,
      this.destination,
      this.options,
      this.assets
    );
    nodes = this.resolveJS(
      nodes,
      this.source,
      this.destination,
      this.assets,
      this.options
    );
    return nodes;
  }
}

export default Resolver;
