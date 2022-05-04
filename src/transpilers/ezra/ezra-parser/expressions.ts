import {
  ArrayExpression,
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  ChainExpression,
  ConditionalExpression,
  Expression,
  ImportExpression,
  isValidReference,
  LogicalExpression,
  MemberExpression,
  NewExpression,
  ObjectExpression,
  SequenceExpression,
  ThisExpression,
  UnaryExpression,
  UpdateExpression,
} from "../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../utils";
import { ezra } from "./base";

ezra.expression = function (type) {
  var exp: Expression | undefined;
  this.outerspace();
  switch (true) {
    case this.eat("/*"):
    case this.eat("//"):
      this.skip();
      break;
    case /"|'/.test(this.char):
      return this.reparse(this.stringLiteral());
    case /`/.test(this.char):
      return this.reparse(this.templateLiteral());
    case this.char === ":":
      if (!(type === "ternary" || type === "case"))
        this.raise("JS_UNEXPECTED_TOKEN");
    case this.char === undefined:
    case this.char === ";":
      return;
    case this.eat("/"):
      return this.reparse(this.regexLiteral());
    case this.eat("("):
      return this.reparse(this.group());
    case this.eat("["):
      return this.reparse(this.arrayExpression());
    case this.eat("{"):
      return this.reparse(this.objectExpression());
    case this.eat("++"):
    case this.eat("--"):
    case this.eat("!"):
    case this.eat("~"):
    case this.eat("+"):
    case this.eat("-"):
    case this.match("typeof"):
    case this.match("void"):
    case this.match("delete"):
    case this.match("await"):
      return this.reparse(this.unaryExpression());
    case this.eat("..."):
      if (this.allowSpread()) return this.spreadElement();
      else this.raise("EXPRESSION_EXPECTED");
    case this.eat("."):
      this.belly.pop();
      this.belly.push("decim");
      return this.reparse(this.numberLiteral());
    case this.match("new"):
      return this.reparse(this.newExpression());
    case this.match("null"):
      return this.reparse(this.nullLiteral());
    case this.match("this"):
      return this.reparse(this.thisExpression());
    case this.match("true"):
    case this.match("false"):
      return this.reparse(this.booleanLiteral());
    case isDigit(this.char):
      return this.reparse(this.numberLiteral(), "number");
    case this.match("class"):
      return this.reparse(this.classExpression());
    case this.match("super"):
      return this.reparse(this.super());
    case this.match("import"):
      return this.reparse(this.importExpression());
    case this.match("function"):
      return this.reparse(this.functionExpression());
    case isValidIdentifierCharacter(this.char):
      return this.reparse(this.identifier());
    default:
      this.raise("JS_UNEXPECTED_TOKEN");
  }
  return exp;
};
ezra.memberExpression = function (object) {
  var memexp = new MemberExpression(this.j);
  this.outerspace();
  memexp.object = object;
  if (this.belly.top() === "[") {
    memexp.property = this.group();
    if (memexp.property === undefined) this.raise("EXPRESSION_EXPECTED");
    memexp.computed = true;
  } else if (this.char === "#") {
    let { arr }: any = { ...this.contexts };
    if (arr.includes("class_body")) {
      this.next();
      memexp.property = this.privateIdentifier();
    } else this.raise("JS_ILLEGAL_PRIV_IDENT");
  } else memexp.property = this.identifier(true);
  memexp.loc.start = memexp.object.loc.start;
  memexp.loc.end = memexp.property?.loc.end;
  if (this.belly.top() === "?.") memexp.optional = true;
  this.belly.pop();
  return this.reparse(memexp, ".");
};
ezra.chainExpression = function (exp) {
  const chainexp = new ChainExpression(exp.loc.start);
  chainexp.expression = exp;
  chainexp.loc.end = exp.loc.end;
  return chainexp;
};
ezra.thisExpression = function () {
  const thisexp = new ThisExpression(this.j - 4);
  thisexp.loc.end = this.j;
  return thisexp;
};
ezra.callExpression = function (callee) {
  const callexp = new CallExpression(callee.loc.start);
  callexp.callee = callee;
  callexp.arguments = this.group("call") ?? [];
  callexp.loc.end = this.j;
  return this.reparse(callexp);
};
ezra.importExpression = function () {
  const importexp = new ImportExpression(this.j - 6);
  this.outerspace();
  if (!this.eat("(")) this.raise("EXPECTED", "(");
  var source = this.group("call") ?? [];
  if (source.length !== 1) this.raise("JS_ILLEGAL_IMPORT_EXP");
  importexp.source = source[0];
  importexp.loc.end = this.j;
  return this.reparse(importexp);
};
ezra.arguments = function () {
  const args = [];
  while (!this.end && this.char !== ")") {
    args.push(this.expression());
    if (this.char === ",") this.next();
  }
  return args;
};
ezra.newExpression = function () {
  // if (this.eat(".")) {
  //   this.innerspace(true);
  //   let metaprop = this.identifier();
  //   if (metaprop.name !== "target")
  //     this.raise("INVALID_NEW_META_PROPERTY", metaprop.name);
  // }
  this.outerspace();
  const newexp = new NewExpression(this.j);
  this.contexts.push("new");
  this.operators.push("new");
  newexp.callee = this.expression();
  if (this.eat("(")) newexp.arguments = this.group("call") ?? [];
  else newexp.arguments = [];
  this.operators.pop();
  this.contexts.pop();
  newexp.loc.end = newexp.callee?.loc.end;
  return this.reparse(newexp);
};
ezra.updateExpression = function (argument, prefix) {
  if (!isValidReference(argument))
    this.raise(prefix ? "JS_INVALID_LHS_PREFIX" : "JS_INVALID_LHS_POFTIX");
  const upexp = new UpdateExpression(argument.loc.start);
  upexp.operator = this.belly.top();
  upexp.argument = argument;
  upexp.loc.end = this.j;
  upexp.prefix = prefix ? true : false;
  if (prefix) upexp.loc.start = upexp.loc.start - 2;
  return this.reparse(upexp, prefix ? "prefix" : "postfix");
};
ezra.unaryExpression = function () {
  const unexp = new UnaryExpression(this.j - this.belly.top().length);
  unexp.operator = this.belly.top();
  this.operators.push(unexp.operator);
  unexp.argument = this.expression();
  unexp.loc.end = this.j;
  this.operators.pop();
  if (/\-\-|\+\+/.test(unexp.operator))
    return this.updateExpression(unexp.argument, true);
  return this.reparse(unexp);
};
ezra.binaryExpression = function (left) {
  if (this.lowerPrecedence()) return left;
  const binexp = new BinaryExpression(left.loc.start);
  binexp.left = left;
  binexp.operator = this.belly.top();
  this.operators.push(binexp.operator);
  binexp.right = this.expression();
  binexp.loc.end = this.j;
  this.operators.pop();
  return this.reparse(binexp);
};
ezra.logicalExpression = function (left) {
  if (this.lowerPrecedence()) return left;
  const logexp = new LogicalExpression(left.loc.start);
  logexp.left = left;
  logexp.operator = this.belly.top();
  this.operators.push(logexp.operator);
  this.outerspace();
  logexp.right = this.expression();
  logexp.loc.end = this.j;
  this.operators.pop();
  return this.reparse(logexp);
};
ezra.conditionalExpression = function (test) {
  if (this.lowerPrecedence()) return test;
  const condexp = new ConditionalExpression(test.loc.start);
  condexp.test = test;
  condexp.consequent = this.expression("ternary");
  if (!this.eat(":")) this.raise("COLON_EXPECTED");
  condexp.alternate = this.expression();
  this.operators.pop();
  condexp.loc.end = this.j;
  return this.reparse(condexp);
};
ezra.assignmentExpression = function (left) {
  if (this.lowerPrecedence()) return left;
  if (
    !isValidReference(left) &&
    !/ArrayExpression|ObjectExpression/.test(left.type)
  )
    this.raise("JS_INVALID_LHS_ASSIGN");
  const assignexp = new AssignmentExpression(left.loc.start);
  assignexp.left = left;
  assignexp.operator = this.belly.top();
  this.operators.push(this.belly.top());
  assignexp.right = this.expression();
  this.operators.pop();
  assignexp.loc.end = this.j;
  return this.reparse(assignexp);
};
ezra.sequenceExpression = function (left: any) {
  if (this.lowerPrecedence()) return left;
  const seqexp = new SequenceExpression(left.loc.start);
  this.operators.push(",");
  if (left.type === "SequenceExpression") {
    var expressions: any = left.expressions;
    for (let i = 0; expressions[i]; i++) {
      seqexp.expressions.push(expressions[i]);
    }
  } else seqexp.expressions.push(left);
  seqexp.expressions.push(this.expression());
  this.operators.pop();
  seqexp.loc.end = this.j;
  return this.reparse(seqexp);
};
ezra.arrayExpression = function () {
  const array = new ArrayExpression(this.j - 1);
  array.elements = this.group("array");
  array.loc.end = this.j;
  return array;
};
ezra.objectExpression = function () {
  const object = new ObjectExpression(this.j - 1);
  object.properties = this.group("object") ?? [];
  object.loc.end = this.j;
  return object;
};
