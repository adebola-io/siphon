import {
  ClassDeclaration,
  Super,
  ClassBody,
  MethodDefinition,
  Identifier,
  PropertyDefinition,
  PrivateIdentifier,
  ClassExpression,
} from "../../../../../types";
import { isDigit } from "../../../../../utils";
import { ezra } from "./base";

ezra.super = function () {
  const sup = new Super(this.j - 5);
  sup.loc.end = this.j;
  this.outerspace();
  if (this.char !== "(") this.raise("EXPECTED", "(");
  return this.reparse(sup);
};
ezra.classDeclaration = function () {
  const cl = new ClassDeclaration(this.j - 5);
  this.outerspace();
  cl.id = this.identifier();
  this.outerspace();
  // Class is a sub-class;
  if (this.match("extends")) {
    this.contexts.push("super_class");
    cl.superClass = this.expression();
    this.contexts.pop();
  }
  if (!this.match("{")) this.raise("EXPECTED", "{");
  cl.body = new ClassBody(this.j);
  cl.body.body = this.group("class_body");
  // Block duplicate constructors.
  if (
    cl.body.body.filter((def: any) => def.kind === "constructor").length > 1
  ) {
    this.raise("JS_DUPLICATE_CONSTRUCTORS");
  }
  cl.loc.end = cl.body.loc.end = this.j;
  this.outerspace();
  this.eat(";");
  return cl;
};
ezra.definition = function () {
  if (this.eat(";")) return;
  var start = this.j,
    key: any,
    definition: any,
    isComputed = false,
    isStatic = false;
  if (this.match("static")) {
    isStatic = true;
    this.outerspace();
  }
  switch (true) {
    case this.eat("["):
      key = this.group("property");
      isComputed = true;
      break;
    case isDigit(this.char):
      key = this.numberLiteral();
      break;
    case this.eat("#"):
      key = this.privateIdentifier();
      break;
    case /'|"/.test(this.char):
      key = this.stringLiteral();
    default:
      key = this.identifier(true);
  }
  this.outerspace();
  // Block constructor identifier.
  if (
    key instanceof Identifier &&
    key.name === "constructor" &&
    this.char !== "("
  ) {
    this.raise("EXPECTED", "(");
  }
  if (this.eat("(")) {
    // METHOD DEFINITIONS.
    this.backtrack();
    definition = new MethodDefinition(start);
    definition.computed = isComputed;
    definition.static = isStatic;
    if (key instanceof Identifier) {
      switch (key.name) {
        case "constructor":
          if (isStatic)
            this.raise("JS_STATIC_CONSTRUCTOR", undefined, key.loc.start - 1);
          else definition.kind = "constructor";
          break;
        case "get":
          definition.kind = "get";
          break;
        case "set":
          definition.kind = "set";
          break;
        default:
          definition.kind = "method";
      }
      definition.key = key;
    } else definition.kind = "method";
    definition.value = this.functionExpression();
    definition.loc.end = this.j;
  } else {
    // PROPERTY DEFINITIONS.
    definition = new PropertyDefinition(start);
    definition.computed = isComputed;
    definition.static = isStatic;
    definition.key = key;
    if (this.char === "=") {
      this.next();
      definition.value = this.expression();
      if (definition.value === undefined) this.raise("EXPRESSION_EXPECTED");
    } else if (!/}|;/.test(this.char)) {
      this.recede();
      // Check that next definition begins on a new line.
      var onNewLine = false;
      while (/\s|\n|\r/.test(this.char)) {
        if (this.char === "\n") {
          onNewLine = true;
          break;
        } else this.recede();
      }
      if (!onNewLine) this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");
      else definition.value = null;
    } else definition.value = null;
    definition.loc.end = this.j;
  }
  this.outerspace();
  this.eat(";");
  return definition;
};
ezra.privateIdentifier = function () {
  const priv = new PrivateIdentifier(this.j);
  const identifier = this.identifier(true);
  if (identifier.name === "constructor") this.raise("RESERVED", "constructor");
  priv.name = identifier.name;
  priv.loc.end = identifier.loc.end;
  return priv;
};
ezra.classExpression = function () {
  const classexp = new ClassExpression(this.j - 5);
  this.outerspace();
  if (this.char !== "{") {
    classexp.id = this.identifier();
    this.outerspace();
    if (this.match("extends")) {
      this.contexts.push("super_class");
      classexp.superClass = this.expression();
      this.contexts.pop();
    }
    this.outerspace();
  }
  if (!this.eat("{")) this.raise("EXPECTED", "{");
  classexp.body = new ClassBody(this.j);
  classexp.body.body = this.group("class_body");
  // Block duplicate constructors.
  if (
    classexp.body.body.filter((def: any) => def.kind === "constructor").length >
    1
  ) {
    this.raise("JS_DUPLICATE_CONSTRUCTORS");
  }
  classexp.loc.end = classexp.body.loc.end = this.j;
  return this.reparse(classexp);
};
