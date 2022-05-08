import { existsSync, PathLike, readFileSync } from "fs";
import { resolve } from "path";
import Ezra from "../../..";
import Errors from "../../../../../errors";
import { Stack } from "../../../../../structures";
import { fileExists, relativePath as pathFrom } from "../../../../../utils";

export interface Asset {
  id: number;
  filename: PathLike;
  dependencies: string[];
}
export function createGraph(entry: PathLike) {
  let assets: Map<string, Asset> = new Map();
  function recurse(entry: PathLike) {
    entry = resolve(entry.toString());
    let asset = createAsset(entry);
    assets.set(entry, asset);
    asset.dependencies.forEach((dependency) => {
      if (!assets.has(dependency)) recurse(dependency);
    });
  }
  recurse(entry);
  return assets;
}
let ID = 0;
export function getDependency(node: any, filename: PathLike) {
  let dependency = pathFrom(filename, node.source.value);
  if (!fileExists(dependency)) {
    switch (true) {
      case fileExists(dependency + ".js"):
        dependency += ".js";
        break;
      case fileExists(dependency + "/index.js"):
        dependency += "/index.js";
        break;
      case existsSync(`node_modules/${node.source.value}`):
        let node_module = `node_modules/${node.source.value}`;
        if (fileExists(`${node_module}/package.json`)) {
          let pkgJSON = `${node_module}/package.json`;
          let pkg = require(resolve(pkgJSON));
          dependency = pkg.main
            ? pathFrom(pkgJSON, pkg.main)
            : resolve(`${node_module}/index.js`);
        } else dependency = resolve(`${node_module}/index.js`);
        if (fileExists(dependency)) break;
      default:
        Errors.enc("FILE_NON_EXISTENT", dependency);
    }
  }
  return dependency;
}
export function createAsset(filename: PathLike): Asset {
  let content = readFileSync(filename, "utf-8");
  const ast = Ezra.parse(content, {
    sourceFile: filename,
  });
  const dependencies: string[] = [];
  Ezra.traverse(ast, {
    ImportDeclaration(node: any, path) {
      let dependency = getDependency(node, filename);
      dependencies.push(dependency);
    },
    ExportAllDeclaration(node, path) {
      let dependency = getDependency(node, filename);
      dependencies.push(dependency);
    },
  });
  return {
    id: ID++,
    dependencies,
    filename,
  };
}

const assets = createGraph("src/test/source/main.js");
console.log(assets.size);
