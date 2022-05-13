import { PathLike, readFileSync } from "fs";
import { basename, extname, resolve } from "path";
import Errors from "../../errors";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import {
  fileExists,
  copyInBase64,
  relativePath,
  tryMkingDir,
  getFileName,
  stringifytoBase64,
} from "../../utils";
import createDOMTree from "../parser/html/createDOMTree";
import tagNameSearch from "../parser/html/tagNameSearch";
import resolveCSS from "./CSS";
import JavascriptResolve from "./Javascript";

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
  resolveModules(nodes: HTMLDocumentNode[]) {
    const mods: HTMLDocumentNode[] = tagNameSearch(nodes, "module");
    mods.forEach((mod) => {
      if (!mod.attributes?.src) Errors.enc("MODULE_REQUIRES_SRC", this.source);
      let truePath = relativePath(this.source, mod.attributes.src);
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
      mod.parent?.children.splice(mod.childID, 1, ...injectNodes);
    });
  }
  resolveImages(nodes: HTMLDocumentNode[]) {
    const images: HTMLDocumentNode[] = tagNameSearch(nodes, "img").filter(
      (images) => {
        return !(
          images.attributes?.src?.startsWith("http://") ||
          images.attributes?.src?.startsWith("http://") ||
          images.attributes?.src?.startsWith("data:")
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
          copyInBase64(
            truePath,
            `${this.outDir}/${
              this.options.storeImagesSeparately ? "img/" : ""
            }${newname}`
          );
        } else if (this.assets[fileMarker] === undefined) {
          copyInBase64(
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
  resolveCSS = resolveCSS;
  resolve(nodes: HTMLDocumentNode[]) {
    if (this.options.htmlModules) this.resolveModules(nodes);
    nodes = this.resolveImages(nodes);
    nodes = new JavascriptResolve().resolveJS(
      nodes,
      this.source,
      this.options,
      this.destination
    );
    nodes = this.resolveCSS(
      nodes,
      this.source,
      this.destination,
      this.options,
      this.assets
    );
    // nodes = this.resolveJS(
    //   nodes,
    //   this.source,
    //   this.destination,
    //   this.assets,
    //   this.options
    // );
    return nodes;
  }
}

export default Resolver;
