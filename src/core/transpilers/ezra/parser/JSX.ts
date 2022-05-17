import {
  JSXAttribute,
  JSXClosingElement,
  JSXClosingFragment,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXOpeningElement,
  JSXOpeningFragment,
  JSXText,
} from "../../../../types";
import { isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.jsxElement = function (start) {
  const elem = new JSXElement(start);
  this.outerspace();
  if (!isValidIdentifierCharacter(this.text[this.i])) {
    this.raise("JS_UNEXPECTED_TOKEN", this.text[this.i]);
  }
  elem.openingElement = this.jsxOpeningElement(start);
  if (elem.openingElement.selfClosing) {
    elem.closingElement = null;
    return elem;
  }
  elem.children = [];
  while (!(this.text[this.i] === undefined)) {
    this.outerspace();
    if (this.eat("<")) {
      start = this.i - 1;
      this.outerspace();
      if (this.text[this.i] === "/") {
        this.i++;
        elem.closingElement = this.jsxClosingElement(start);
        if (elem.closingElement.tagName !== elem.openingElement.tagName)
          this.raise(
            "JSX_NO_CLOSE",
            elem.openingElement.tagName,
            elem.openingElement.loc.end
          );
        break;
      } else if (this.eat(">")) elem.children.push(this.jsxFragment(start));
      else elem.children.push(this.jsxElement(start));
    } else if (this.text[this.i] === "{") {
      elem.children.push(this.jsxExpressionContainer());
    } else elem.children.push(this.jsxText());
  }
  if (this.text[this.i] === undefined && elem.closingElement === undefined)
    this.raise(
      "JSX_NO_CLOSE",
      elem.openingElement.tagName,
      elem.openingElement.loc.end
    );
  elem.loc.end = elem.closingElement?.loc.end;
  return elem;
};
ezra.jsxText = function () {
  const text = new JSXText(this.i);
  text.raw = "";
  while (
    !(this.text[this.i] === undefined || /\<|\{/.test(this.text[this.i]))
  ) {
    text.raw += this.text[this.i];
    this.i++;
  }
  text.value = text.raw.replace(/\r|\n/g, "");
  text.loc.end = this.i;
  return text;
};
ezra.jsxAttribute = function () {
  if (/\//.test(this.text[this.i])) return;
  const attrib = new JSXAttribute(this.i);
  let attribName = this.identifier(true, true);
  attrib.name = new JSXIdentifier(this.i);
  attrib.name.name = attribName.name;
  attrib.name.loc = attribName.loc;
  this.outerspace();
  if (this.taste("=")) {
    switch (this.text[this.i]) {
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
  attrib.loc.end = attrib.value?.loc.end ?? this.i;
  return attrib;
};
ezra.jsxIdentifier = function () {
  const jsxident = new JSXIdentifier(this.i);
  const identifier = this.identifier(true, true);
  if (this.text[this.i] === ":") return this.JSXNamespacedName(identifier);
  else if (this.text[this.i] === ".")
    return this.JSXMemberExpression(identifier);
  jsxident.loc = identifier.loc;
  jsxident.name = identifier.name;
  return jsxident;
};
ezra.JSXReparse = function (node) {
  this.outerspace();
  switch (this.text[this.i]) {
    case ":":
      return this.JSXNamespacedName(node);
    case ".":
      return this.JSXMemberExpression(node);
    default:
      return node;
  }
};
ezra.JSXMemberExpression = function (object) {
  this.i++;
  const prop = this.identifier(true, true);
  const jsxmem = new JSXMemberExpression(object.loc.start);
  jsxmem.object = object;
  jsxmem.property = new JSXIdentifier(prop.loc.start);
  jsxmem.property.name = prop.name;
  jsxmem.property.loc.end = prop.loc.end;
  return this.JSXReparse(jsxmem);
};
ezra.JSXNamespacedName = function (namespace) {
  this.i++;
  const ident = this.jsxIdentifier();
  const namsp = new JSXNamespacedName(namespace.loc.start);
  namsp.namespace = namespace;
  if (ident instanceof JSXIdentifier) namsp.name = ident;
  else this.raise("EXPECTED", ">", ident.loc.start);
  return namsp;
};
ezra.jsxOpeningElement = function () {
  const open = new JSXOpeningElement(this.i - 1);
  open.name = this.jsxIdentifier();
  open.attributes = this.group("JSX_attribute");
  if (this.text[this.i] === ">") open.selfClosing = false;
  else if (this.taste("/")) {
    this.outerspace();
    if (this.text[this.i] === ">") {
      open.selfClosing = true;
    }
  }
  this.i++;
  if (open.name instanceof JSXIdentifier) {
    open.tagName = open.name.name;
  } else if (open.name instanceof JSXMemberExpression) {
    open.tagName = `${open.name.object.name}.${open.name.property.name}`;
  } else if (open.name instanceof JSXNamespacedName) {
    open.tagName = `${open.name.namespace.name}:${open.name.name.name}`;
  }
  open.loc.end = this.i;
  return open;
};
ezra.jsxClosingElement = function (start) {
  this.belly.pop();
  const close = new JSXClosingElement(start);
  close.name = this.jsxIdentifier();
  this.outerspace();
  if (!this.taste(">")) this.raise("JS_UNEXPECTED_TOKEN", this.text[this.i]);
  this.outerspace();
  if (close.name instanceof JSXIdentifier) {
    close.tagName = close.name.name;
  } else if (close.name instanceof JSXMemberExpression) {
    close.tagName = `${close.name.object.name}.${close.name.property.name}`;
  } else if (close.name instanceof JSXNamespacedName) {
    close.tagName = `${close.name.namespace.name}:${close.name.name.name}`;
  }
  close.loc.end = this.i;
  return close;
};
ezra.jsxExpressionContainer = function () {
  const container = new JSXExpressionContainer(this.i);
  this.eat("{");
  container.expression = this.group("expression");
  container.loc.end = this.i;
  return container;
};
ezra.jsxFragment = function (start) {
  const fragment = new JSXFragment(start);
  fragment.openingFragment = new JSXOpeningFragment(start);
  fragment.openingFragment.loc.end = this.i;
  fragment.children = [];
  while (!(this.text[this.i] === undefined)) {
    this.outerspace();
    if (this.eat("<")) {
      start = this.i - 1;
      this.outerspace();
      if (this.eat("/")) {
        this.outerspace();
        if (this.eat(">")) {
          fragment.closingFragment = new JSXClosingFragment(start);
          fragment.closingFragment.loc.end = this.i;
        } else
          this.raise(
            "JSX_FRAGMENT_NO_CLOSE",
            undefined,
            fragment.openingFragment.loc.end
          );
        break;
      } else if (this.eat(">")) fragment.children.push(this.jsxFragment(start));
      else fragment.children.push(this.jsxElement(start));
    } else if (this.text[this.i] === "{") {
      fragment.children.push(this.jsxExpressionContainer());
    } else fragment.children.push(this.jsxText());
  }
  if (this.text[this.i] === undefined && fragment.closingFragment === undefined)
    this.raise(
      "JSX_FRAGMENT_NO_CLOSE",
      undefined,
      fragment.openingFragment.loc.end
    );
  return fragment;
};
