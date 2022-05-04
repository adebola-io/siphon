import {
  isValidPropertyKeyStart,
  Property,
  RestElement,
  SpreadElement,
} from "../../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../../utils";
import { ezra } from "./base";

ezra.spreadElement = function () {
  const spread = new SpreadElement(this.j - 3);
  spread.argument = this.expression();
  spread.loc.end = spread.argument.loc.end;
  this.eat(",");
  return spread;
};
ezra.restElement = function () {
  const rest = new RestElement(this.j - 3);
  rest.argument = this.expression();
  rest.loc.end = rest.argument.loc.end;
  // Rest elements must end a paramter lineup.
  if (this.contexts.top() === "parameters" && this.char !== ")") {
    this.raise("JS_REST_MUST_END");
  }
  return rest;
};
ezra.property = function () {
  if (this.eat("...")) return this.spreadElement();
  const prop = new Property(this.j);
  if (isDigit(this.char) || !isValidIdentifierCharacter(this.char)) {
    //   Invalid property keys.
    if (!isValidPropertyKeyStart(this.char))
      this.raise("JS_PROPERTY_DEC_EXPECTED");
    //  Properties with Computed keys.
    if (this.eat("[")) {
      prop.key = this.group("property");
      prop.computed = true;
    }
    // Number-indexed properties.
    if (isDigit(this.char)) {
      prop.key = this.numberLiteral();
    }
    // String-indexed properties.
    if (/'|"/.test(this.char)) {
      prop.key = this.stringLiteral();
    }
    this.outerspace();
    if (this.eat(":")) prop.value = this.expression();
    else if (this.eat("(")) {
      prop.method = true;
      this.backtrack();
      prop.value = this.functionExpression();
    } else this.raise("EXPECTED", ":");
  } else {
    // Normal Identifier keys.
    prop.key = this.identifier(true);
    this.outerspace();
    if (this.eat(":")) prop.value = this.expression();
    else if (this.eat("(")) {
      prop.method = true;
      this.backtrack();
      prop.value = this.functionExpression();
    } else if (this.char === "," || this.char === "}") {
      prop.shorthand = true;
      prop.value = prop.key;
    }
  }
  this.eat(",");
  prop.loc.end = prop.value?.loc.end;
  return prop;
};

ezra.elements = function () {
  const args = [];
  while (!this.end && this.char !== "]") {
    args.push(this.expression());
    if (this.char === ",") this.next();
    this.outerspace();
  }
  return args;
};
