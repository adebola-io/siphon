import {
  BlockStatement,
  ClassDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  JSNode,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../../types";
import { Config, Scope, TraversalPath } from "./config";

class Traverser {
  traverse(node: any, config: Config) {
    return this.visit(
      node,
      { ...config },
      { parent: node, scope: new Scope(node), route: [node] }
    );
  }
  visit(node: any, config: any, path: TraversalPath) {
    if (/Block/.test(node.type)) {
      path.scope = new Scope(node, path.scope);
    }
    // Bind variable declarations to the scope in which they are created.
    switch (true) {
      case node instanceof FunctionDeclaration:
      case node instanceof VariableDeclarator && !/For/.test(path.parent.type):
      case node instanceof ClassDeclaration:
        path.scope.variables.set(node.id.name, node.id);
        break;
      case node instanceof BlockStatement && /Function/.test(path.parent.type):
        const parent: any = path.parent;
        for (const param of parent.params) {
          switch (param.type) {
            case "Identifier":
              path.scope.variables.set(param.name, param);
              break;
            case "AssignmentPattern":
              path.scope.variables.set(param.left.name, param.left);
              break;
            case "RestElement":
              path.scope.variables.set(param.argument.name, param.argument);
          }
        }
        break;
    }
    Object.keys(node).forEach((key) => {
      if (node[key] instanceof Array) {
        for (let i = 0; node[key][i]; i++) {
          if (node[key][i] instanceof JSNode) {
            node[key][i] = this.visit(node[key][i], config, {
              parent: node,
              scope: path.scope,
              route: path.route,
            });
          }
        }
      } else if (node[key] instanceof JSNode) {
        node[key] = this.visit(node[key], config, {
          parent: node,
          scope: path.scope,
          route: path.route,
        });
      }
    });
    return (
      (config["enter"] ?? (() => {}))(node, path) ??
      (config[node.type] ?? (() => {}))(node, path) ??
      node
    );
  }
}
export default Traverser;
