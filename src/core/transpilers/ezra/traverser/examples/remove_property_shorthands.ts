import Ezra from "../..";
import { Program } from "../../../../../types";

/**
 * Removes all shorthand notations for object properties. e.g.
 * ```js
 * //from
 * const property = 90;
 * const object = { property };
 * //to
 * const property = 90;
 * const object = { property: property };
 * ```
 * @param ast The node to traverse.
 */
function remove_property_shorthands(ast: Program) {
  Ezra.traverse(ast, {
    Property(node) {
      if (node.shorthand) node.shorthand = false;
    },
  });
  return ast;
}
export default remove_property_shorthands;
