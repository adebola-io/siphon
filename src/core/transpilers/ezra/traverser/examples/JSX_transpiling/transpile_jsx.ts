import {
  ArrayExpression,
  EmptyNode,
  Identifier,
  JSXElement,
  JSXIdentifier,
  JSXText,
  Literal,
  ObjectExpression,
  Property,
} from "../../../../../../types";
import { HTMLTags, isSentenceCase } from "../../../../../../utils";
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
  let attributesObject = new ObjectExpression(
    node.openingElement.attributes[0]?.loc.start ??
      node.openingElement.loc.start
  );
  attributesObject.properties = [];
  node.openingElement.attributes.forEach((jsxAttribute) => {
    let attributeProp = new Property(jsxAttribute.loc.start);
    attributeProp.key = newString(`"${jsxAttribute.name.name}"`);
    if (jsxAttribute.value) {
      attributeProp.value = jsxAttribute.value;
    } else attributeProp.value = newString("''");
    attributesObject.properties.push(attributeProp);
  });
  // Transform child elements to array of expressions.
  let children = new ArrayExpression(0);
  children.elements = [];
  node.children?.forEach((child: any) => {
    children.elements.push(child);
  });
  if (
    isSentenceCase(node.openingElement.tagName) ||
    HTMLTags[node.openingElement.tagName] !== true
  ) {
    // Set the prop.children property.
    let childrenProp = new Property(node.openingElement?.loc.start ?? 0);
    childrenProp.key = newIdentifier("children");
    let childrenArray = new ArrayExpression(node.openingElement?.loc.end ?? 0);
    childrenArray.elements = node.children ?? [];
    childrenProp.value = childrenArray;
    // Prevent clash with already defined property.
    if (
      !attributesObject.properties.find(
        (a) => a.key instanceof Literal && a.key.value === "children"
      )
    ) {
      attributesObject.properties.push(childrenProp);
    }
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
