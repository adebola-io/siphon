import {
  JSXAttribute,
  JSXClosingElement,
  JSXElement,
  JSXExpressionContainer,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXOpeningElement,
  JSXText,
} from "../../../../types";
import { isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.jsxElement = function (start) {
  start = start - 1;
  const elem = new JSXElement(start);
  this.outerspace();
  if (!isValidIdentifierCharacter(this.char)) {
    this.raise("JS_UNEXPECTED_TOKEN", this.char);
  }
  elem.openingElement = this.jsxOpeningElement(start);
  if (elem.openingElement.selfClosing) {
    elem.closingElement = null;
    return elem;
  }
  elem.children = [];
  while (!this.end) {
    this.outerspace();
    if (this.eat("<")) {
      start = this.j - 1;
      this.outerspace();
      if (this.char === "/") {
        this.next();
        elem.closingElement = this.jsxClosingElement(start);
        if (elem.closingElement.tagName !== elem.openingElement.tagName)
          this.raise(
            "JSX_NO_CLOSE",
            elem.openingElement.tagName,
            elem.openingElement.loc.end
          );
        break;
      } else elem.children.push(this.jsxElement(start));
    } else if (this.char === "{") {
      elem.children.push(this.jsxExpressionContainer());
    } else elem.children.push(this.jsxText());
  }
  if (this.end && elem.closingElement === undefined)
    this.raise(
      "JSX_NO_CLOSE",
      elem.openingElement.tagName,
      elem.openingElement.loc.end
    );
  elem.loc.end = elem.closingElement?.loc.end;
  return elem;
};
ezra.jsxText = function () {
  const text = new JSXText(this.j);
  text.raw = "";
  while (!(this.end || /\<|\{/.test(this.char))) {
    text.raw += this.char;
    this.next();
  }
  text.value = text.raw.replace(/\r|\n/g, "");
  text.loc.end = this.j;
  return text;
};
ezra.jsxAttribute = function () {
  if (/\//.test(this.char)) return;
  const attrib = new JSXAttribute(this.j);
  let attribName = this.identifier(true, true);
  attrib.name = new JSXIdentifier(this.j);
  attrib.name.name = attribName.name;
  attrib.name.loc = attribName.loc;
  this.outerspace();
  if (this.eat("=")) {
    this.belly.pop();
    switch (this.char) {
      case '"':
      case "'":
        attrib.value = this.stringLiteral();
        break;
      case "{":
        attrib.value = this.jsxExpressionContainer();
        break;
      default:
        this.raise("EXPECTED", "{");
    }
  } else attrib.value = null;
  attrib.loc.end = attrib.value?.loc.end ?? this.j;
  return attrib;
};
ezra.jsxIdentifier = function () {
  const jsxident = new JSXIdentifier(this.j);
  const identifier = this.identifier(true, true);
  if (this.char === ":") return this.JSXNamespacedName(identifier);
  else if (this.char === ".") return this.JSXMemberExpression(identifier);
  jsxident.loc = identifier.loc;
  jsxident.name = identifier.name;
  return jsxident;
};
ezra.JSXReparse = function (node) {
  this.outerspace();
  switch (this.char) {
    case ":":
      return this.JSXNamespacedName(node);
    case ".":
      return this.JSXMemberExpression(node);
    default:
      return node;
  }
};
ezra.JSXMemberExpression = function (object) {
  this.next();
  const prop = this.identifier(true, true);
  const jsxmem = new JSXMemberExpression(object.loc.start);
  jsxmem.object = object;
  jsxmem.property = new JSXIdentifier(prop.loc.start);
  jsxmem.property.name = prop.name;
  jsxmem.property.loc.end = prop.loc.end;
  return this.JSXReparse(jsxmem);
};
ezra.JSXNamespacedName = function (namespace) {
  this.next();
  const ident = this.jsxIdentifier();
  const namsp = new JSXNamespacedName(namespace.loc.start);
  namsp.namespace = namespace;
  if (ident instanceof JSXIdentifier) namsp.name = ident;
  else this.raise("EXPECTED", ">", ident.loc.start);
  return namsp;
};
ezra.jsxOpeningElement = function () {
  const open = new JSXOpeningElement(this.j - 1);
  open.name = this.jsxIdentifier();
  open.attributes = this.group("JSX_attribute");
  if (this.char === ">") open.selfClosing = false;
  else if (this.eat("/")) {
    this.belly.pop(), this.outerspace();
    if (this.char === ">") {
      open.selfClosing = true;
    }
  }
  this.next();
  if (open.name instanceof JSXIdentifier) {
    open.tagName = open.name.name;
  } else if (open.name instanceof JSXMemberExpression) {
    open.tagName = `${open.name.object.name}.${open.name.property.name}`;
  } else if (open.name instanceof JSXNamespacedName) {
    open.tagName = `${open.name.namespace.name}:${open.name.name.name}`;
  }
  open.loc.end = this.j;
  return open;
};
ezra.jsxClosingElement = function (start) {
  this.belly.pop();
  const close = new JSXClosingElement(start);
  close.name = this.jsxIdentifier();
  this.outerspace();
  if (!this.eat(">")) this.raise("JS_UNEXPECTED_TOKEN", this.char);
  else this.belly.pop();
  this.outerspace();
  if (close.name instanceof JSXIdentifier) {
    close.tagName = close.name.name;
  } else if (close.name instanceof JSXMemberExpression) {
    close.tagName = `${close.name.object.name}.${close.name.property.name}`;
  } else if (close.name instanceof JSXNamespacedName) {
    close.tagName = `${close.name.namespace.name}:${close.name.name.name}`;
  }
  close.loc.end = this.j;
  return close;
};
ezra.jsxExpressionContainer = function () {
  const container = new JSXExpressionContainer(this.j);
  this.eat("{");
  container.expression = this.group("expression");
  container.loc.end = this.j;
  return container;
};
