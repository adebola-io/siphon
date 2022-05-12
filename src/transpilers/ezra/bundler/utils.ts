import { existsSync, PathLike } from "fs";
import { extname, resolve } from "path";
import Errors from "../../../errors";
import {
  FunctionDeclaration,
  Identifier,
  IfStatement,
  Program,
  ReturnStatement,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../types";
import { fileExists, relativePath as pathFrom } from "../../../utils";
import {
  blockStatement,
  expressionStatement,
  newIdentifier,
  numberLiteral,
  updateExpression,
} from "../traverser/helpers/creator";
import { Asset } from "./types";

export interface bundlerOptions {
  format: boolean;
  sourceMaps: boolean;
  indent: number;
}
export const defaults: bundlerOptions = {
  format: false,
  sourceMaps: true,
  indent: 0,
};
var ID = 0;
export class bundler_utils {
  options!: bundlerOptions;
  entry!: PathLike;
  tree = new Program(0);
  sourceMappings: Map<string, Array<string>> = new Map();
  createJSAsset!: (filename: PathLike) => Asset;
  createUnknownAsset!: (filename: PathLike) => Asset;
  /**
   * A tracking of all identifiers being used in the bundle, to prevent name clashes.
   */
  globalIdentifierMap: Map<string, boolean> = new Map();
  globalAssetMap: Map<string, string> = new Map();
  /** Recursively read a file and build its dependencies. */
  start(file: PathLike) {
    file = resolve(file.toString());
    var asset: Asset;
    if (extname(file) === ".js") {
      asset = this.createJSAsset(file);
    } else asset = this.createUnknownAsset(file);
    this.assets.set(file, asset);
    this.tree.body.push(...asset.module);
    asset.dependencies.forEach((dependency) => {
      if (!this.assets.has(dependency.path.toString()))
        this.start(dependency.path);
    });
  }
  assets: Map<string, Asset> = new Map();
  /**
   * Takes a relative import in a file and returns the absolute path name to the imported file.
   * @param node The string literal node.
   * @param filename The filename into which it is imported.
   * @returns The resolved path to the import.
   */
  getDependencyPath(node: any, filename: PathLike) {
    let dependencyPath = pathFrom(filename, node.source.value);
    if (!fileExists(dependencyPath)) {
      switch (true) {
        case fileExists(dependencyPath + ".js"):
          dependencyPath += ".js";
          break;
        case fileExists(dependencyPath + "/index.js"):
          dependencyPath += "/index.js";
          break;
        case existsSync(`node_modules/${node.source.value}`):
          let node_module = `node_modules/${node.source.value}`;
          if (fileExists(`${node_module}/package.json`)) {
            let pkgJSON = `${node_module}/package.json`;
            let pkg = require(resolve(pkgJSON));
            dependencyPath = pkg.main
              ? pathFrom(pkgJSON, pkg.main)
              : resolve(`${node_module}/index.js`);
          } else dependencyPath = resolve(`${node_module}/index.js`);
          if (fileExists(dependencyPath)) break;
        default:
          Errors.enc("FILE_NON_EXISTENT", dependencyPath);
      }
    }

    return dependencyPath;
  }
  /**
   * Creates a new Identifier.
   */
  uniqueIdentifier(type: "module" | "init" | "" = "init") {
    let identifier = new Identifier(0);
    do
      identifier.name = `_e${type}${Math.random().toString(16).slice(12)}${
        type === "module" ? `$${ID++}` : ""
      }_`;
    while (this.globalIdentifierMap.has(identifier.name));
    this.globalIdentifierMap.set(identifier.name, true);
    return identifier;
  }
  /**
   * Checks if the file has already been indexed by the global asset map and returns its identifier if true.
   * Otherwise, it returns a new identifier already indexed the global asset map.
   * @param filePath The file to look at.
   */
  ModuleIdentifierNode(filePath: string) {
    filePath = resolve(filePath);
    let assetId = this.globalAssetMap.get(filePath);
    var identifierNode: Identifier;
    if (assetId) identifierNode = newIdentifier(assetId);
    else {
      identifierNode = this.uniqueIdentifier();
      this.globalAssetMap.set(filePath, identifierNode.name);
    }
    return identifierNode;
  }
  /**
   * The prepareModule() function prepares a final version of the module by wrapping it in a function call that can be accessed by other files.
   * @param ast The AST of the module to prepare
   * @param moduleIDNode The Identifier node of the module.
   * @returns A functional module and an initializer.
   */
  prepareModule(ast: Program, moduleIDNode: Identifier) {
    // Set module initializer to 0. i.e "var xxxx  = 0"
    let Initializer = new VariableDeclaration(0);
    Initializer.kind = "var";
    let InitializerDec = new VariableDeclarator(0);
    InitializerDec.id = this.uniqueIdentifier("");
    InitializerDec.init = numberLiteral(0);
    Initializer.declarations.push(InitializerDec);

    // Create initializer prompt. i.e.
    // "if (xxxx) return module;
    // else xxxx = true;"
    let InitPrompt = new IfStatement(0);
    InitPrompt.test = InitializerDec.id;
    let InitReturn = new ReturnStatement(0);
    InitReturn.argument = moduleIDNode;
    InitPrompt.consequent = InitReturn;
    InitPrompt.alternate = expressionStatement(
      updateExpression("++", false, InitializerDec.id)
    );

    // Final Return i.e "return module;"
    let ModuleReturn = new ReturnStatement(0);
    ModuleReturn.argument = moduleIDNode;

    let ModuleFuntion = new FunctionDeclaration(0);
    ModuleFuntion.id = moduleIDNode;
    ModuleFuntion.async = false;
    ModuleFuntion.expression = false;
    ModuleFuntion.generator = false;
    ModuleFuntion.params = [];
    ModuleFuntion.body = blockStatement([
      InitPrompt,
      ...ast.body,
      ModuleReturn,
    ]);
    return [Initializer, ModuleFuntion];
  }
}
