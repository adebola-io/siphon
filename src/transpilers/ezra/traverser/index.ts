import { BlockStatement, JSNode, VariableDeclaration } from "../../../types";
import { Config, TraversalPath } from "./config";

class Traverser {
  traverse(node: any, config: Config) {
    return this.visit(node, { ...config }, { parent: node, scope: node });
  }
  visit(node: any, config: any, path: TraversalPath) {
    path.scope = /Block|Object|Class/.test(node.type) ? node : path.scope;
    Object.keys(node).forEach((key) => {
      if (node[key] instanceof Array) {
        for (let i = 0; node[key][i]; i++) {
          if (node[key][i] instanceof JSNode) {
            node[key][i] = this.visit(node[key][i], config, {
              parent: node,
              scope: path.scope,
            });
          }
        }
      } else if (node[key] instanceof JSNode) {
        node[key] = this.visit(node[key], config, {
          parent: node,
          scope: path.scope,
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
