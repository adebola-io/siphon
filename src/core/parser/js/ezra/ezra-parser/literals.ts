import {
  Literal,
  TemplateElement,
  TemplateLiteral,
} from "../../../../../types";
import { isAlphabetic } from "../../../../../utils";
import { ezra } from "./base";

// Literals.
ezra.numberLiteral = function () {
  const numlit = new Literal(this.j);
  numlit.kind = "number";
  if (this.eat("0x")) {
    this.belly.pop();
    numlit.raw = "Ox" + this.count();
    if (isAlphabetic(this.char)) this.raise("ID_FOLLOWS_LITERAL");
    numlit.value = parseInt(numlit.raw.slice(2), 16);
  } else {
    numlit.raw += this.count();
    if (this.char === "n") {
      numlit.kind = "bigint";
      numlit.bigint = numlit.raw;
      numlit.raw += "n";
      this.next();
    } else if (this.char === ".") {
      this.next();
      numlit.raw += "." + this.count();
    }
    if (this.char === "n") this.raise("BIGINT_DECIMAL");
    else if (isAlphabetic(this.char)) this.raise("ID_FOLLOWS_LITERAL");
    numlit.value = parseFloat(numlit.raw ?? "");
  }
  numlit.loc.end = this.j;
  return numlit;
};
ezra.stringLiteral = function () {
  const strlit = new Literal(this.j);
  let str = this.read(this.i);
  strlit.kind = "string";
  strlit.raw = str.value;
  strlit.value = eval(str.value);
  this.goto(str.end + 1);
  strlit.loc.end = this.j;
  return strlit;
};
ezra.templateLiteral = function () {
  this.next();
  const template = new TemplateLiteral(this.j);
  template.expressions = [];
  template.quasis = [];
  var raw = "";
  var start = this.j,
    end = start;
  while (!this.end && !/`/.test(this.char)) {
    // Read escape sequences.
    if (this.char === "\\")
      (raw += `\\${(this.next(), this.char)}`), this.next();
    // Read an expression that is nested within the literal.
    if (this.eat("${")) {
      end = this.j - 2;
      this.belly.pop();
      this.belly.push("{");
      var expression = this.group("expression");
      if (expression === undefined)
        this.raise("EXPRESSION_EXPECTED", undefined, this.j - 1);
      template.expressions.push(expression);
      if (raw !== "") {
        var element = new TemplateElement(start);
        element.value = { raw, cooked: raw };
        element.tail = false;
        element.loc.end = end;
        template.quasis.push(element);
        (raw = ""), (start = this.j);
      }
    } else {
      raw += this.char;
      this.next();
    }
  }
  // Push the tail quasis, i.e. the last string part of the template.
  if (raw !== "") {
    var element = new TemplateElement(start);
    element.value = { raw, cooked: raw };
    element.tail = true;
    element.loc.end = this.j;
    template.quasis.push(element);
  }
  template.loc.end = this.j;
  this.next();
  return template;
};
ezra.booleanLiteral = function () {
  const boollit = new Literal(this.j - this.belly.top().length);
  boollit.kind = "boolean";
  boollit.raw = this.belly.top();
  boollit.value = eval(this.belly.top());
  boollit.loc.end = this.j;
  return boollit;
};
ezra.regexLiteral = function () {
  const regexlit = new Literal(this.j - 1);
  regexlit.kind = "regex";
  let reg = this.regex(this.i);
  regexlit.raw = eval("/" + reg.value + "/").toString();
  regexlit.regex = { pattern: regexlit.raw.slice(1, -1), flags: reg.flags };
  regexlit.value = new RegExp(
    regexlit.raw.slice(1, -1),
    reg.flags.length > 0 ? reg.flags : undefined
  );
  this.goto(reg.end);
  regexlit.loc.end = this.j;
  return regexlit;
};
ezra.nullLiteral = function () {
  const nulllit = new Literal(this.j - 4);
  nulllit.kind = nulllit.raw = "null";
  nulllit.value = null;
  nulllit.loc.end = this.j;
  return nulllit;
};
