import { PathLike, readFileSync } from "fs";
import { extname } from "path";
import Ezra from "..";
import {
  ClassDeclaration,
  EmptyNode,
  Expression,
  FunctionDeclaration,
  Identifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  JSNode,
  Program,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../../types";
import { JSFiles, stringifytoBase64 } from "../../../../utils";
import {
  assignmentExpression,
  callExpression,
  expressionStatement,
  memberExpression,
  newIdentifier,
  newString,
} from "../traverser/helpers/creator";
import { Dependency } from "./types";
import { bundler_utils } from "./utils";

var ezra = bundler_utils.prototype;

ezra.createJSAsset = function (filename: PathLike) {
  let content = readFileSync(filename, "utf-8");
  const ast = Ezra.parse(content, {
    sourceFile: filename,
    parseJSX: this.options.allowJSX,
  });
  const dependencies: Dependency[] = [];
  /** Build a map of all identifiers used in the file to prevent name clashes. */
  Ezra.traverse(ast, {
    Identifier: (node) => {
      //   if (this.options.sourceMaps) {
      //   }
      if (!this.globalIdentifierMap.has(node.name))
        this.globalIdentifierMap.set(node.name, true);
    },
    JSXElement: () => {
      if (!this.hasJSX) this.hasJSX = true;
    },
  });
  var ezraModule = this.ModuleIdentifierNode(filename.toString());
  var fullSourceExports: JSNode[] = [];
  var redefinitions: JSNode[] = [];
  var moduleImports: Map<string, Identifier> = new Map();
  var moduleExports: Map<Expression, any> = new Map();
  Ezra.traverse(ast, {
    ImportDeclaration: (node) => {
      let dependencyPath = this.getDependencyPath(node, filename);
      let imported = this.ModuleIdentifierNode(dependencyPath);
      let dependency: Dependency = {
        id: imported.name,
        path: dependencyPath,
        extension: extname(dependencyPath),
      };
      // Create two declarations, one for the original initialization of the import, another to hold the imported values.
      const assignDec = new VariableDeclaration(node.loc.start);
      assignDec.kind = "const";
      const assignDeclarator = new VariableDeclarator(0);
      const placeholder = this.uniqueIdentifier("module");
      const importedInit = callExpression(imported, []);
      assignDeclarator.id = placeholder;
      assignDeclarator.init = importedInit;
      assignDec.declarations.push(assignDeclarator);
      const declaration2 = new VariableDeclaration(0);
      declaration2.kind = "const";
      // Full source imports. e.g. import './utils.js'
      if (node.specifiers.length === 0) {
        if (JSFiles[extname(dependencyPath).slice(1)] === true)
          Ezra.parse(readFileSync(dependencyPath, "utf-8"), {
            sourceFile: dependencyPath,
            parseJSX: this.options.allowJSX,
          }).body.forEach((child) => {
            child.loc.start = node.loc.start;
            fullSourceExports.push(child);
          });
        else dependencies.push(dependency);
        return new EmptyNode(0);
      } else
        for (const specifier of node.specifiers) {
          const declarator = new VariableDeclarator(0);
          declarator.id = newIdentifier(specifier.local.name);
          if (specifier instanceof ImportDefaultSpecifier) {
            declarator.init = memberExpression(
              placeholder,
              newIdentifier("default")
            );
          } else if (specifier instanceof ImportSpecifier) {
            declarator.init = memberExpression(
              placeholder,
              newIdentifier(specifier.imported.name)
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
      if (path.scope.level === 0) return newIdentifier("globalThis");
    },
  });
  ast.body.splice(
    0,
    0,
    ...redefinitions
      .concat(fullSourceExports)
      .sort((a, b) => a.loc.start - b.loc.start)
  );
  // Push all exports.
  moduleExports.forEach((value, key) => {
    ast.push(
      expressionStatement(
        assignmentExpression(
          memberExpression(ezraModule, newIdentifier(value.name)),
          "=",
          key
        )
      )
    );
  });
  return {
    id: ezraModule.name,
    dependencies,
    filename,
    module: this.prepareModule(ast, newIdentifier(ezraModule.name)),
  };
};
ezra.createCSSAsset = function (filename: PathLike) {
  const ezraModule = this.ModuleIdentifierNode(filename.toString());
  this.stylesheets.push(filename);
  return {
    dependencies: [],
    filename,
    id: ezraModule.name,
    module: this.prepareModule(new Program(0), ezraModule),
  };
};
ezra.createImageAsset = function (filename: PathLike) {
  let ezraModule = this.ModuleIdentifierNode(filename.toString());
  let address = this.generateNewImage(filename);
  if (this.options.storeImagesSeparately) address = `./img/${address}`;
  else address = `./${address}`;
  let defaultExport = `${ezraModule.name}.default = "${address}"`;
  return {
    id: ezraModule.name,
    filename,
    module: this.prepareModule(Ezra.parse(defaultExport), ezraModule),
    dependencies: [],
  };
};
ezra.createUnknownAsset = function (filename) {
  filename = filename.toString();
  var ezraModule = this.ModuleIdentifierNode(filename);
  let defaultExport: string;
  if (extname(filename) === ".json") {
    defaultExport = `${ezraModule.name}.default = ${readFileSync(
      filename,
      "utf-8"
    )}`;
  } else {
    defaultExport = `${ezraModule.name}.default = "${stringifytoBase64(
      filename
    )}"`;
  }
  return {
    id: ezraModule.name,
    filename,
    dependencies: [],
    module: this.prepareModule(Ezra.parse(defaultExport), ezraModule),
  };
};
