import Ezra from "../..";
import {
  ArrayPattern,
  Identifier,
  ObjectPattern,
  Program,
  Property,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../../../types";
import { TraversalPath } from "../config";
import {
  newIdentifier,
  memberExpression,
  numberLiteral,
} from "../helpers/creator";
/**
 * Change destructured variable(s) to regular member access. e.g.
 * ```js
 * //from
 * var {name, age} = person;
 * //to
 * var name = person.name, age = person.age;
 * ```
 */
function rewrite_destructured_variables(
  node: VariableDeclaration,
  path: TraversalPath
) {
  for (let i = 0; node.declarations[i]; i++) {
    let dec = node.declarations[i];
    if (dec.id instanceof ObjectPattern) {
      var settlerObject = newIdentifier(
        "_s" +
          (Math.random() * 10).toPrecision(1) +
          Math.random().toString(16).slice(11) +
          "$$_"
      );
      for (let j = 0; dec.id.properties[j]; j++) {
        let property = dec.id.properties[j];
        if (!property.computed && property.value instanceof Identifier) {
          let newDec = new VariableDeclarator(0);
          newDec.id = newIdentifier(property.value.name);
          newDec.init = memberExpression(settlerObject, property.key);
          node.declarations.push(newDec);
        }
      }
      dec.id = settlerObject;
    } else if (dec.id instanceof ArrayPattern) {
      let k = 0;
      var settlerObject = newIdentifier(
        "_si" +
          (Math.random() * 10).toPrecision(1) +
          Math.random().toString(16).slice(8) +
          "$$_"
      );
      for (let j = 0; dec.id.elements[j]; j++) {
        let element = dec.id.elements[j];
        if (element instanceof Identifier) {
          let newDec = new VariableDeclarator(0);
          newDec.id = newIdentifier(element.name);
          newDec.init = memberExpression(
            settlerObject,
            numberLiteral(k++),
            true
          );
          node.declarations.push(newDec);
        }
      }
      dec.id = settlerObject;
    }
  }
  return node;
}

export default rewrite_destructured_variables;
