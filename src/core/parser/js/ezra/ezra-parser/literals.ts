import { Literal } from "../../../../../types";
import { isAlphabetic } from "../../../../../utils";
import { ezra } from "./base";

// Literals.
ezra.numberLiteral = function () {
  const numlit = new Literal(this.j);
  numlit.kind = "number";
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
  numlit.loc.end = this.j;
  numlit.value = parseFloat(numlit.raw ?? "");
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
ezra.booleanLiteral = function () {
  const boollit = new Literal(this.j - this.belly.top().length);
  boollit.kind = "boolean";
  boollit.raw = this.belly.top();
  boollit.value = eval(this.belly.top());
  boollit.loc.end = this.j;
  return boollit;
};
ezra.regexLiteral = function () {
  const regexlit = new Literal(this.j);
  regexlit.kind = "regex";
  let reg = this.regex(this.i);
  regexlit.raw = eval("/" + reg.value + "/").toString();
  regexlit.value = new RegExp(
    regexlit.raw.slice(1, -1),
    reg.flags.length > 0 ? reg.flags : undefined
  );
  this.goto(reg.end);
  return regexlit;
};
ezra.nullLiteral = function () {
  const nulllit = new Literal(this.j - 4);
  nulllit.kind = nulllit.raw = "null";
  nulllit.value = null;
  nulllit.loc.end = this.j;
  return nulllit;
};
