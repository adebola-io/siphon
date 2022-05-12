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
} from "../../../types";
import { stringifytoBase64 } from "../../../utils";
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
  var fullSourceExports: string[] = [];
  var redefinitions: JSNode[] = [];
  var moduleImports: Map<string, Identifier> = new Map();
  var moduleExports: Map<Expression, Expression> = new Map();
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
            declarator.init = memberExpression(placeholder, specifier.imported);
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
};
ezra.createUnknownAsset = function (filename: PathLike) {
  var ezraModule = this.ModuleIdentifierNode(filename.toString());
  let dependencies: Dependency[] = [];
  let simulate = new Program(0);
  let defaultExport = assignmentExpression(
    memberExpression(ezraModule, newIdentifier("default")),
    "=",
    newString(`"${stringifytoBase64(filename)}"`)
  );
  simulate.push(expressionStatement(defaultExport));
  return {
    id: ezraModule.name,
    dependencies,
    filename,
    module: this.prepareModule(simulate, ezraModule),
  };
};
