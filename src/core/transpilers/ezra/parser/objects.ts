import {
  Identifier,
  isValidPropertyKeyStart,
  Property,
  RestElement,
  SpreadElement,
} from "../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.spreadElement = function () {
  const spread = new SpreadElement(this.i - 3);
  spread.argument = this.expression();
  spread.loc.end = spread.argument.loc.end;
  this.eat(",");
  return spread;
};
ezra.restElement = function () {
  const rest = new RestElement(this.i - 3);
  rest.argument = this.expression();
  rest.loc.end = rest.argument.loc.end;
  // Rest elements must end a paramter lineup.
  if (this.contexts.top() === "parameters" && this.text[this.i] !== ")") {
    this.raise("JS_REST_MUST_END");
  }
  return rest;
};
ezra.property = function () {
  if (this.eat("...")) return this.spreadElement();
  const prop = new Property(this.i);
  if (
    isDigit(this.text[this.i]) ||
    !isValidIdentifierCharacter(this.text[this.i])
  ) {
    //   Invalid property keys.
    if (!isValidPropertyKeyStart(this.text[this.i]))
      this.raise("JS_PROPERTY_DEC_EXPECTED");
    //  Properties with Computed keys.
    if (this.eat("[")) {
      prop.key = this.group("property");
      prop.computed = true;
    }
    // Number-indexed properties.
    if (isDigit(this.text[this.i])) {
      prop.key = this.numberLiteral();
    }
    // String-indexed properties.
    if (/'|"/.test(this.text[this.i])) {
      prop.key = this.stringLiteral();
    }
    this.outerspace();
    if (this.eat(":")) prop.value = this.expression();
    else if (this.text[this.i] === "(") {
      prop.method = true;
      prop.value = this.functionExpression();
    } else this.raise("EXPECTED", ":");
  } else {
    // Normal Identifier keys.
    prop.key = this.identifier(true);
    this.outerspace();
    if (this.eat(":")) prop.value = this.expression();
    else if (this.text[this.i] === "(") {
      prop.method = true;
      prop.value = this.functionExpression();
    } else if (this.text[this.i] === "," || this.text[this.i] === "}") {
      prop.shorthand = true;
      let clone = new Identifier(prop.key.loc.start);
      clone.name = prop.key.name;
      clone.loc.end = prop.loc.end;
      prop.value = clone;
    }
  }
  this.eat(",");
  prop.loc.end = prop.value?.loc.end;
  return prop;
};

ezra.elements = function () {
  const args = [];
  while (!(this.text[this.i] === undefined) && this.text[this.i] !== "]") {
    while (this.text[this.i] === ",") {
      this.i++;
      args.push(null);
      this.outerspace();
    }
    if (this.text[this.i] === "]") break;
    args.push(this.expression());
    if (this.text[this.i] === ",") this.i++;
    this.outerspace();
  }
  return args;
};
