import { PathLike } from "fs";
import { basename } from "path";
import Runtime from ".";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import { fileExists, relativePath } from "../../utils";
import Errors from "../errors";
import createDOMTree from "../transpilers/mimo/createDOMTree";
import tagNameSearch from "../transpilers/mimo/tagNameSearch";

function resolveModules(
  nodes: HTMLDocumentNode[],
  source: PathLike,
  destination: PathLike,
  options: siphonOptions,
  assets: any
) {
  const mods: HTMLDocumentNode[] = tagNameSearch(nodes, "module");
  var srcName = basename(source.toString());
  mods.forEach((mod) => {
    if (!mod.attributes?.src) Errors.enc("MODULE_REQUIRES_SRC", source);
    let truePath = relativePath(source, mod.attributes.src);
    if (basename(truePath) === srcName) Errors.enc("HTML_SELF_INJECT", source);
    if (!fileExists(truePath)) Errors.enc("FILE_NON_EXISTENT", truePath);
    let injectNodes = createDOMTree(truePath);
    var runtime = new Runtime(truePath, destination, options, assets, true);
    runtime.resolve(injectNodes);
    mod.parent?.children.splice(mod.childID, 1, ...injectNodes);
  });
  return nodes;
}

export default resolveModules;
