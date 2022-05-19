import Ezra from "../..";
import {
  BlockStatement,
  ClassDeclaration,
  FunctionDeclaration,
  Program,
  VariableDeclaration,
} from "../../../../../types";
import { Scope, TraversalPath } from "../config";
import { isNotRenamable } from "./minify";

/**
 *
 * @param node The node to evaluate
 * @param path The traversal path.
 */
export default function (ast: Program) {
  var isUsed = new Map();
  function remove_unused(node: Program | BlockStatement, path: any) {
    path.scope.variables.forEach((variable: any) => {
      if (isUsed.get(variable) === undefined) variable.__unused = false;
    });
  }
  Ezra.traverse(ast, {
    Program: remove_unused,
    BlockStatement: remove_unused,
    Identifier(node, path: any) {
      if (isNotRenamable(node, path)) return;
      if (/Declar/.test(path.parent.type) && path.parent.id === node) return;
      if (path.scope.variables.has(node.name)) {
        isUsed.set(path.scope.variables.get(node.name), true);
      } else
        path.scope.ancestors.forEach((ancestor: Scope) => {
          if (ancestor.variables.has(node.name))
            isUsed.set(ancestor.variables.get(node.name), true);
        });
    },
    ExportNamedDeclaration(node, path) {
      if (
        node.declaration instanceof FunctionDeclaration ||
        node.declaration instanceof ClassDeclaration
      ) {
        isUsed.set(node.declaration.id, true);
      } else if (node.declaration instanceof VariableDeclaration)
        node.declaration.declarations.forEach((decs) => {
          isUsed.set(decs, true);
        });
    },
  });
}
