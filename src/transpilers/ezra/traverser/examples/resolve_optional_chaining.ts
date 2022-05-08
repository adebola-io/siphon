import Ezra from "../..";
import {
  BinaryExpression,
  ConditionalExpression,
  LogicalExpression,
  Program,
  UnaryExpression,
} from "../../../../types";
import { newNumber, null_ } from "../helpers/creator";
/**
 * An optional member expression is a way to read nested onject properties if they exist withoue throwing errors.
 * @param ast The node to traverse.
 */
function resolve_optional_chaining(ast: Program) {
  Ezra.traverse(ast, {
    MemberExpression(node, path) {
      if (!node.optional) return;
      let condition = new ConditionalExpression(0);
      //   The test, x === null || x === void 0
      let test = new LogicalExpression(0);
      let left = new BinaryExpression(0);
      let right = new BinaryExpression(0);
      let void0 = new UnaryExpression(0);
      void0.operator = "void";
      void0.argument = newNumber(0);
      left.operator = right.operator = "===";
      left.left = right.left = node.object;
      left.right = null_;
      right.right = void0;
      test.operator = "||";
      test.left = left;
      test.right = right;
      condition.test = test;
      //   consequent
      condition.consequent = void0;
      condition.alternate = node;
      node.optional = false;
      return condition;
    },
  });
}
resolve_optional_chaining?.apply;
export default resolve_optional_chaining;
