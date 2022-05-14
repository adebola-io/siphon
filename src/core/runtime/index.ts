import { PathLike } from "fs";
import { basename, extname, resolve } from "path";
import Errors from "../errors";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import {
  fileExists,
  copyInBase64,
  relativePath,
  tryMkingDir,
  getFileName,
  stringifytoBase64,
} from "../../utils";
import tagNameSearch from "../transpilers/mimo/tagNameSearch";
import resolveCSS from "./CSS";
import JavascriptResolve from "./Javascript";
import resolveModules from "./HTMLModules";

class Runtime {
  constructor(
    sourceFile: PathLike,
    destination: PathLike,
    options: siphonOptions,
    assets = {},
    injectMode?: boolean
  ) {
    this.assets = assets;
    this.options = options;
    this.source = sourceFile.toString();
    this.injectMode = injectMode;
    this.destination = destination;
    this.outDir = relativePath(destination, "./");
    this.assets[basename(this.source)] = resolve(this.source);
  }
  outDir: PathLike;
  options: siphonOptions;
  source: PathLike;
  destination: PathLike;
  assets: any;
  injectMode?: boolean;
  resolveModules = resolveModules;
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
    if (this.options.htmlModules) {
      nodes = this.resolveModules(
        nodes,
        this.source,
        this.destination,
        this.options,
        this.assets
      );
    }
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
    return nodes;
  }
}

export default Runtime;
