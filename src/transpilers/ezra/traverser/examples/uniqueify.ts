import Ezra from "../..";
import { Visitor } from "../../../../structures";
import { Program } from "../../../../types";
import { clone } from "../helpers/creator";

/**
 * When parsing the AST tree, some nodes can end up being references to existing nodes due to Javascript passing by reference.
 * The uniqueify function takes all double references and replaces them with proper node clones that can be treated uniquely during traversals.
 */
function uniqueify(ast: Program) {
  const visitor = new Visitor();
  Ezra.traverse(ast, {
    enter(node, path) {
      if (visitor.visited(node)) return clone(node);
      else visitor.visit(node);
    },
  });
}
export default uniqueify;
