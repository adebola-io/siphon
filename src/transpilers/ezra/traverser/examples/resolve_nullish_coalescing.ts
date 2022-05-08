import Ezra from "../..";
import {
  BinaryExpression,
  ConditionalExpression,
  Literal,
  LogicalExpression,
  Program,
  UnaryExpression,
} from "../../../../types";
import { newIdentifier, null_, undefined_ } from "../helpers/creator";

/**
 * A nullish coalesce operation is a dual logical expression that returns the right-hand value if the left is null or undefined, and the left hand value otherwise. e.g
 * ```js
 * console.log(null ?? 'adebola') // will output 'adebola'.
 * console.log(0 ?? 'foo') // will output 0.
 * ```
 * @param ast The node to traverse.
 */
function resolve_nullish_coalescing(ast: Program) {
  Ezra.traverse(ast, {
    LogicalExpression(node, path) {
      if (node.operator !== "??") return;
      //   The test. !(x === null || x === undefined)
      let condition = new ConditionalExpression(0);
      let test = new UnaryExpression(0);
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
    },
  });
}
export default resolve_nullish_coalescing;
