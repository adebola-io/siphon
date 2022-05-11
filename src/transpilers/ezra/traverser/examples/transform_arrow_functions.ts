import Ezra from "../..";
import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassBody,
  FunctionExpression,
  Program,
  ReturnStatement,
} from "../../../../types";
import { TraversalPath } from "../config";

/**
 * Replace all instances of arrow functions with function expressions.
 */
function transform_arrow_functions(
  node: ArrowFunctionExpression,
  path: TraversalPath
) {
  if (path.route.find((node) => node instanceof ClassBody)) return;
  var func = new FunctionExpression(0);
  func.async = node.async;
  func.expression = node.expression;
  func.generator = node.generator;
  func.params = node.params;
  func.id = node.id;
  if (node.body instanceof BlockStatement) func.body = node.body;
  else {
    func.body = new BlockStatement(0);
    let return_ = new ReturnStatement(0);
    return_.argument = node.body;
    func.body.body.push(return_);
  }
  return func;
}

export default transform_arrow_functions;
