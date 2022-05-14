import Ezra from "../../..";
import { Program } from "../../../../../../types";
import includes from "./includes";

/**
 * This function transforms all the necessary ES6 String.prototype features to ES5 or lower.
 */
function string_polyfill(ast: Program) {
  const features: any = {
    includes: true,
    startsWith: true,
    endWith: true,
  };
  const added: any = {};
  Ezra.traverse(ast, {
    enter(node, path) {
      if (!/Call/.test(node.type)) return;
      if (added.include !== true) added.include = true;
    },
  });
  ast.body.splice(0, 0, includes);
}
export default string_polyfill;
