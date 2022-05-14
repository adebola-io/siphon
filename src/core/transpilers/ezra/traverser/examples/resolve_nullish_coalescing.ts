import Ezra from "../..";
import {
  BinaryExpression,
  ConditionalExpression,
  Literal,
  LogicalExpression,
  Program,
  UnaryExpression,
} from "../../../../../types";
import { TraversalPath } from "../config";
import { newIdentifier, null_, undefined_ } from "../helpers/creator";

/**
 * A nullish coalesce operation is a dual logical expression that returns the right-hand value if the left is null or undefined, and the left hand value otherwise. e.g
 * ```js
 * console.log(null ?? 'adebola') // will output 'adebola'.
 * console.log(0 ?? 'foo') // will output 0.
 * ```
 */
function resolve_nullish_coalescing(
  node: LogicalExpression,
  path: TraversalPath
) {
  if (node.operator !== "??") return;
  //   The test. !(x === null || x === undefined)
  let condition = new ConditionalExpression(node.loc.start);
  let test = new UnaryExpression(node.loc.start);
  let testInner = new LogicalExpression(0);
  let innerL = new BinaryExpression(0);
  let innerR = new BinaryExpression(0);
  innerL.left = innerR.left = node.left;
  innerL.operator = innerR.operator = "===";
  innerL.right = null_;
  innerR.right = undefined_;
  testInner.left = innerL;
  testInner.right = innerR;
  testInner.operator = "||";
  test.operator = "!";
  test.prefix = true;
  test.argument = testInner;
  condition.test = test;
  //   The consequent, x.
  condition.consequent = node.left;
  //   The alternate, y
  condition.alternate = node.right;
  return condition;
}
export default resolve_nullish_coalescing;
