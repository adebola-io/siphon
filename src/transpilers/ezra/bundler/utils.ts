import { existsSync, PathLike, readFileSync } from "fs";
import { resolve } from "path";
import Ezra from "..";
import Errors from "../../../errors";
import {
  ClassDeclaration,
  EmptyNode,
  Expression,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  JSNode,
  Program,
  ReturnStatement,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../types";
import { fileExists, relativePath as pathFrom } from "../../../utils";
import rewrite_destructured_variables from "../traverser/examples/rewrite_destructured_variables";
import {
  assignmentExpression,
  blockStatement,
  callExpression,
  expressionStatement,
  newIdentifier,
  memberExpression,
  numberLiteral,
  updateExpression,
} from "../traverser/helpers/creator";
import { Dependency, Asset } from "./types";

export interface bundlerOptions {
  format: boolean;
  indent: number;
}
export const defaults: bundlerOptions = {
  format: false,
  indent: 0,
};
var ID = 0;
export class bundler_utils {
  options!: bundlerOptions;
  entry!: PathLike;
  tree = new Program(0);
  /** Recursively read a file and build its dependencies. */
  start(file: PathLike) {
    file = resolve(file.toString());
    let asset = this.createAsset(file);
    this.assets.set(file, asset);
    this.tree.body.push(...asset.module);
    asset.dependencies.forEach((dependency) => {
      if (!this.assets.has(dependency.path.toString()))
        this.start(dependency.path);
    });
  }
  assets: Map<string, Asset> = new Map();
  createAsset(filename: PathLike) {
    let content = readFileSync(filename, "utf-8");
    const ast = Ezra.parse(content, {
      sourceFile: filename,
    });
    const dependencies: Dependency[] = [];
    /** Build a map of all identifiers used in the file to prevent name clashes. */
    Ezra.traverse(ast, {
      Identifier: (node) => {
        if (!this.globalIdentifierMap.has(node.name))
          this.globalIdentifierMap.set(node.name, true);
      },
    });
    var ezraModule = this.ModuleIdentifierNode(filename.toString());
    var fullSourceExports: string[] = [];
    var redefinitions: JSNode[] = [];
    var moduleImports: Map<string, Identifier> = new Map();
    var moduleExports: Map<Expression, Expression> = new Map();
    rewrite_destructured_variables(ast);
    Ezra.traverse(ast, {
      ImportDeclaration: (node) => {
        let dependencyPath = this.getDependencyPath(node, filename);
        let imported = this.ModuleIdentifierNode(dependencyPath);
        let dependency: Dependency = {
          id: imported.name,
          path: dependencyPath,
        };
        // Create two declarations, one for the original initialization of the import, another to hold the imported values.
        const assignDec = new VariableDeclaration(0);
        assignDec.kind = "const";
        const assignDeclarator = new VariableDeclarator(0);
        const placeholder = this.uniqueIdentifier("module");
        const importedInit = callExpression(imported, []);
        assignDeclarator.id = placeholder;
        assignDeclarator.init = importedInit;
        assignDec.declarations.push(assignDeclarator);
        const declaration2 = new VariableDeclaration(0);
        declaration2.kind = "const";
        if (node.specifiers.length === 0) {
          fullSourceExports.push(dependencyPath);
          return new EmptyNode(0);
        } else
          for (const specifier of node.specifiers) {
            const declarator = new VariableDeclarator(0);
            declarator.id = specifier.local;
            if (specifier instanceof ImportDefaultSpecifier) {
              declarator.init = memberExpression(
                placeholder,
                newIdentifier("default")
              );
            } else if (specifier instanceof ImportSpecifier) {
              declarator.init = memberExpression(
                placeholder,
                specifier.imported
              );
            } else if (specifier instanceof ImportNamespaceSpecifier) {
              declarator.init = placeholder;
            }
            declaration2.declarations.push(declarator);
          }
        redefinitions.push(assignDec);
        dependencies.push(dependency);
        return declaration2;
      },
      ExportNamedDeclaration: (node, path) => {
        if (node.declaration) {
          if (
            node.declaration instanceof FunctionDeclaration ||
            node.declaration instanceof ClassDeclaration
          ) {
            moduleExports.set(node.declaration.id, node.declaration.id);
          } else if (node.declaration instanceof VariableDeclaration) {
            node.declaration.declarations.forEach((declaration) => {
              moduleExports.set(declaration.id, declaration.id);
            });
          }
          return node.declaration;
        } else if (node.specifiers) {
          for (const specifier of node.specifiers) {
            moduleExports.set(specifier.local, specifier.exported);
          }
          return new EmptyNode(0);
        }
      },
      ExportDefaultDeclaration(node, path) {
        moduleExports.set(node.declaration, newIdentifier("default"));
        return new EmptyNode(0);
      },
      ThisExpression(node, path) {
        if (path.scope.type === "Program") return newIdentifier("globalThis");
      },
    });
    ast.body.splice(0, 0, ...redefinitions);
    // Push all exports.
    moduleExports.forEach((value, key) => {
      ast.push(
        expressionStatement(
          assignmentExpression(memberExpression(ezraModule, value), "=", key)
        )
      );
    });
    return {
      id: ezraModule.name,
      dependencies,
      filename,
      module: this.prepareModule(ast, ezraModule),
    };
  }
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
   * A tracking of all identifiers being used in the bundle, to prevent name clashes.
   */
  globalIdentifierMap: Map<string, boolean> = new Map();
  globalAssetMap: Map<string, string> = new Map();
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
