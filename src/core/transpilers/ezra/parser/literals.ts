import { Literal, TemplateElement, TemplateLiteral } from "../../../../types";
import { isAlphabetic, isAlphaNumeric } from "../../../../utils";
import { ezra } from "./base";

// Literals.
ezra.numberLiteral = function () {
  const numlit = new Literal(this.i);
  numlit.kind = "number";
  if (this.belly.pop() === ".") {
    numlit.raw += "." + this.count();
    if (isAlphabetic(this.text[this.i]) || /\./.test(this.text[this.i])) {
      this.raise("ID_FOLLOWS_LITERAL");
    }
    numlit.value = parseFloat(numlit.raw);
  } /** Hexadecimal numbers. */ else if (this.taste("0x")) {
    numlit.raw = "Ox" + this.count(16);
    if (isAlphabetic(this.text[this.i])) this.raise("ID_FOLLOWS_LITERAL");
    numlit.value = parseInt(numlit.raw.slice(2), 16);
  } /** Binary numbers */ else if (this.taste("0b")) {
    numlit.raw = "Ob" + this.count(2);
    if (isAlphaNumeric(this.text[this.i]))
      this.raise("JS_UNEXPECTED_TOKEN", this.text[this.i]);
    numlit.value = parseInt(numlit.raw.slice(2), 2);
  } /** Octal numbers */ else if (this.eat("0o")) {
    numlit.raw = "Oo" + this.count(8);
    if (isAlphaNumeric(this.text[this.i]))
      this.raise("JS_UNEXPECTED_TOKEN", this.text[this.i]);
    numlit.value = parseInt(numlit.raw.slice(2), 8);
  } else {
    numlit.raw += this.count();
    if (this.text[this.i] === "n") {
      numlit.kind = "bigint";
      numlit.bigint = numlit.raw;
      numlit.raw += "n";
      this.i++;
    } else if (this.text[this.i] === ".") {
      this.i++;
      numlit.raw += "." + this.count();
    }
    if (this.eat("e") || this.eat("E")) {
      numlit.raw += this.belly.pop();
      if (this.taste("-")) numlit.raw += "-";
      numlit.raw += this.count();
    }
    if (this.text[this.i] === "n") this.raise("BIGINT_DECIMAL");
    else if (isAlphabetic(this.text[this.i])) this.raise("ID_FOLLOWS_LITERAL");
    numlit.value = parseFloat(numlit.raw ?? "");
  }
  numlit.loc.end = this.i;
  return numlit;
};
ezra.stringLiteral = function () {
  const strlit = new Literal(this.i);
  let str = this.read(this.i);
  strlit.kind = "string";
  strlit.raw = str.value;
  strlit.value = eval(str.value);
  this.i = str.end + 1;
  strlit.loc.end = this.i;
  return strlit;
};
ezra.templateLiteral = function () {
  this.i++;
  const template = new TemplateLiteral(this.i);
  template.expressions = [];
  template.quasis = [];
  var raw = "";
  var start = this.i,
    end = start;
  while (!(this.text[this.i] === undefined) && !/`/.test(this.text[this.i])) {
    // Read escape sequences.
    if (this.text[this.i] === "\\")
      (raw += `\\${(this.i++, this.text[this.i])}`), this.i++;
    // Read an expression that is nested within the literal.
    else if (this.taste("${")) {
      end = this.i - 2;
      this.belly.push("{");
      var expression = this.group("expression");
      if (expression === undefined)
        this.raise("EXPRESSION_EXPECTED", undefined, this.i - 1);
      template.expressions.push(expression);
      if (raw !== "") {
        var element = new TemplateElement(start);
        element.value = { raw, cooked: raw };
        element.tail = false;
        element.loc.end = end;
        template.quasis.push(element);
        raw = "";
      }
      start = this.i;
    } else {
      raw += this.text[this.i];
      this.i++;
    }
  }
  if (this.text[this.i] === undefined)
    this.raise("UNTERMINATED_STRING_LITERAL");
  // Push the tail quasis, i.e. the last string part of the template.
  if (raw !== "") {
    var element = new TemplateElement(start);
    element.value = { raw, cooked: raw };
    element.tail = true;
    element.loc.end = this.i;
    template.quasis.push(element);
  }
  template.loc.end = this.i;
  this.i++;
  return template;
};
ezra.booleanLiteral = function () {
  const boollit = new Literal(this.i - this.belly.top().length);
  boollit.kind = "boolean";
  boollit.raw = this.belly.top();
  boollit.value = eval(this.belly.top());
  boollit.loc.end = this.i;
  return boollit;
};
ezra.regexLiteral = function () {
  const regexlit = new Literal(this.i - 1);
  regexlit.kind = "regex";
  let reg = this.regex(this.i);
  regexlit.raw = eval("/" + reg.value + "/").toString();
  regexlit.regex = { pattern: regexlit.raw.slice(1, -1), flags: reg.flags };
  regexlit.value = new RegExp(
    regexlit.raw.slice(1, -1),
    reg.flags.length > 0 ? reg.flags : undefined
  );
  this.i = reg.end;
  regexlit.loc.end = this.i;
  return regexlit;
};
ezra.nullLiteral = function () {
  const nulllit = new Literal(this.i - 4);
  nulllit.kind = nulllit.raw = "null";
  nulllit.value = null;
  nulllit.loc.end = this.i;
  return nulllit;
};
