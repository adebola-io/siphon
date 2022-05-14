/*
function create(tag, attributes = {}, children = []) {
  var element = document.createElement(tag);
  Object.entries(attributes).forEach((attribute) => {
    element.setAttribute(attribute[0], attribute[1]);
  });
  children.flat().forEach((child) => {
    if (typeof child === 'string') element.append(
      document.createTextNode(
        child.replace(/\&amp\;/g, '&')
      )
    );
    else element.append(child);
  });
  return element;
}
*/

import Ezra from "../../..";
import {
  ArrayExpression,
  AssignmentPattern,
  FunctionDeclaration,
  ObjectExpression,
  ReturnStatement,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../../../../types";
import {
  blockStatement,
  callExpression,
  memberExpression,
  newIdentifier as i,
} from "../../helpers/creator";
import object_to_style from "./object_to_style";
/**
 * The default_handler function is Ezra's native DOM element creator creator. It collects a function name and returns the node specification for a function that can create DOM elements with children and attributes.
 * @param functionName The name that the default handler function should be given.
 */
function default_handler(functionName: string): FunctionDeclaration {
  const create = i(functionName),
    element = i("element"),
    tag = i("tag"),
    children = i("children"),
    document = i("document"),
    createElement = i("createElement"),
    attributes = i("attributes"),
    emptyObject = new ObjectExpression(0),
    emptyArray = new ArrayExpression(0),
    func = new FunctionDeclaration(0),
    attributesDefault = new AssignmentPattern(0),
    childrenDefault = new AssignmentPattern(0),
    _return = new ReturnStatement(0);

  // Element declaration, i.e. var element = document.createElement('tag');
  const declaration = new VariableDeclaration(0);
  declaration.kind = "var";
  const declarator = new VariableDeclarator(0);
  declarator.id = element;
  declarator.init = callExpression(memberExpression(document, createElement), [
    tag,
  ]);
  declaration.declarations.push(declarator);

  //   Function params, i.e. tag, attributes = {}, children = []
  emptyObject.properties = [];
  emptyArray.elements = [];
  attributesDefault.left = attributes;
  attributesDefault.right = emptyObject;
  childrenDefault.left = children;
  childrenDefault.right = emptyArray;

  //  Attribute setter, i.e.
  const attributeSetter = Ezra.parse(`
    Object.entries(attributes).forEach(function (attribute) {
      switch (true) {
        case attribute[0] === 'style' && typeof attribute[1] === 'object':
          element.setAttribute(attribute[0], stylize(attribute[1]));
          break;
        case attribute[0] === 'className':
          element.setAttribute('class', attribute[1]);
          break;
        case attribute[0].slice(0, 2) === 'on':
          element.addEventListener(attribute[0].slice(2).toLowerCase(), attribute[1]);
          break;
        default: 
          element.setAttribute(attribute[0], attribute[1])
      }
    })`).body[0];

  // Child setter/
  const childSetter = Ezra.parse(`
  children.flat().forEach((child) => {
    if (typeof child === 'string') element.append(
      document.createTextNode(
        child.replace(/\\&amp\\;/g, '&')
             .replace(/\\&copy\\;/g, '©')
      ) 
    );
    else element.append(child);
  });`).body[0];

  //   Return.
  _return.argument = element;

  func.async = false;
  func.expression = false;
  func.generator = false;
  func.id = create;
  func.params = [tag, attributesDefault, childrenDefault];
  func.body = blockStatement([
    declaration,
    object_to_style("stylize"),
    attributeSetter,
    childSetter,
    _return,
  ]);
  return func;
}

export default default_handler;
