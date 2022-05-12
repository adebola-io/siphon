import {
  ArrayExpression,
  EmptyNode,
  Identifier,
  JSXElement,
  JSXIdentifier,
  Literal,
  ObjectExpression,
  Property,
} from "../../../../../types";
import { HTMLTags, isSentenceCase } from "../../../../../utils";
import { TraversalPath } from "../../config";
import {
  callExpression,
  memberExpression,
  newIdentifier,
  newString,
} from "../../helpers/creator";

/**
 * Takes a JSXElement node and returns an equivalent DOM function call.
 * @param node The element to transpile.
 * @param path The traversal path.
 * @param handlerName The name of the function that handles JSX conversion.
 */
function transpileJSX(
  node: JSXElement,
  path: TraversalPath,
  handlerName: string
) {
  var nodeIdentifier: any;
  if (node.openingElement.name instanceof JSXIdentifier) {
    nodeIdentifier = newIdentifier(node.openingElement.tagName);
  }
  // Transform JSXAttributes to object properties.
  let attributesObject = new ObjectExpression(0);
  attributesObject.properties = [];
  node.openingElement.attributes.forEach((jsxAttribute) => {
    let attributeProp = new Property(0);
    attributeProp.key = newIdentifier(jsxAttribute.name.name);
    if (jsxAttribute.value instanceof Literal) {
      attributeProp.value = jsxAttribute.value;
    } else if (jsxAttribute.value) {
      attributeProp.value = jsxAttribute.value.expression;
    } else attributeProp.value = newString("''");
    attributesObject.properties.push(attributeProp);
  });
  // Transform child elements to array of expressions.
  let children = new ArrayExpression(0);
  children.elements = [];
  node.children?.forEach((child: any) => {
    switch (child.type) {
      case "CallExpression": // A former JSX Element.
        children.elements.push(child);
        break;
      case "JSXText": // An element's inner text.
        children.elements.push(
          newString(`"${child.value.replace(/"/g, '"')}"`)
        );
        break;
      case "JSXExpressionContainer": // A nested expression.
        children.elements.push(child.expression);
    }
  });
  if (
    isSentenceCase(node.openingElement.tagName) ||
    HTMLTags[node.openingElement.tagName] !== true
  ) {
    return callExpression(nodeIdentifier, [attributesObject]);
  } else {
    let handler = newIdentifier(handlerName);
    let call = callExpression(handler, [
      newString(`"${node.openingElement.tagName}"`),
      attributesObject,
      children,
    ]);
    return call;
  }
}

export default transpileJSX;
