import {
  ArrowFunctionExpression,
  AssignmentPattern,
  ExpressionStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ObjectPattern,
  isValidParameter,
  JSNodes,
  SequenceExpression,
} from "../../../../types";
import { isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.maybeAsync = function () {
  var pos = this.j - this.belly.pop().length;
  try {
    const argument: any = this.statement();
    if (
      argument.type === "ExpressionStatement" &&
      argument.expression.type === "ArrowFunctionExpression"
    ) {
      argument.expression.async = true;
      return argument;
    }
    if (argument.type === "FunctionDeclaration") {
      argument.async = true;
      return argument;
    }
  } catch (e) {}
  this.goto(pos);
  return this.tryExpressionStatement();
};
var isAsync: any = { FunctionExpression: true, ArrowFunctionExpression: true };
ezra.maybeAsyncExpression = function () {
  var pos = this.j - this.belly.pop().length;
  try {
    const argument: any = this.expression();
    if (isAsync[argument.type] === true) {
      argument.async = true;
      return argument;
    }
  } catch {}
  this.goto(pos);
  return this.reparse(this.identifier());
};
ezra.functionDeclaration = function () {
  const func = new FunctionDeclaration(this.j - 8);
  this.contexts.push("function");
  this.outerspace();
  func.id = this.identifier();
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  func.params = this.group("parameters");
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  else func.body = this.blockStatement();
  this.contexts.pop();
  func.loc.end = this.j;
  return func;
};
ezra.parameter = function () {
  if (this.eat("...")) return this.restElement();
  if (this.eat("{")) {
    var exp = this.objectExpression();
    const objpattern = new ObjectPattern(this.j - 1);
    objpattern.properties = exp.properties;
    objpattern.loc.end = exp.loc.end;
    return objpattern;
  }
  const name = this.identifier();
  this.outerspace();
  if (this.char === "," || this.char === ")") {
    if (this.char === ",") this.next();
    return name;
  }
  if (!(this.char === "=")) this.raise("JS_PARAM_DEC_EXPECTED");
  this.next();
  const defaultValue = this.expression();
  if (this.char === ",") this.next();
  const pattern = new AssignmentPattern(name.loc.start);
  pattern.left = name;
  pattern.right = defaultValue;
  pattern.loc.end = defaultValue.loc.end;
  return pattern;
};
ezra.functionExpression = function (shouldReturn = false) {
  this.contexts.push("function");
  const func = new FunctionExpression(this.j - 8);
  this.outerspace();
  if (isValidIdentifierCharacter(this.char)) {
    func.id = this.identifier();
    this.outerspace();
  } else func.id = null;
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  else func.params = this.group("parameters");
  this.outerspace();
  if (!this.eat("{")) this.raise("EXPECTED", "{");
  else func.body = this.blockStatement(false);
  func.loc.end = this.j;
  this.contexts.pop();
  return shouldReturn ? func : this.reparse(func);
};
ezra.arrowFunctionExpression = function (params, startAt) {
  if (this.lowerPrecedence()) return params;
  const arrowfunc = new ArrowFunctionExpression(
    startAt ?? params?.loc.start ?? 0
  );
  arrowfunc.params = params ? this.parameterize(params) : [];
  this.outerspace();
  arrowfunc.id = null;
  if (this.eat("{")) {
    this.contexts.push("function");
    arrowfunc.body = this.blockStatement(false);
    this.contexts.pop();
  } else arrowfunc.body = this.expression();
  arrowfunc.loc.end = this.j;
  return this.reparse(arrowfunc);
};
ezra.parameterize = function (params) {
  const parameterArray: Array<JSNodes> = [],
    parameterNames: any = {};
  if (params === undefined) return parameterArray;
  if (params instanceof SequenceExpression) {
    var expressions: any = params.expressions;
    for (let i = 0; expressions[i]; i++) {
      if (!isValidParameter(expressions[i]))
        this.raise("JS_PARAM_DEC_EXPECTED");
      if (expressions[i] instanceof Identifier) {
        parameterNames[expressions[i].name] === true
          ? this.raise("JS_PARAM_CLASH", expressions[i].name)
          : (parameterNames[expressions[i].name] = true);
        parameterArray.push(expressions[i]);
      } else {
        parameterNames[expressions[i].left.name]
          ? this.raise("JS_PARAM_CLASH", expressions[i].name)
          : parameterNames[expressions[i].left.name] === true;
        if (expressions[i].operator !== "=")
          this.raise("JS_PARAM_DEC_EXPECTED");
        const pattern = new AssignmentPattern(expressions[i].loc.start);
        pattern.left = expressions[i].left;
        pattern.right = expressions[i].right;
        pattern.loc.end = expressions[i].loc.end;
        parameterArray.push(pattern);
      }
    }
  } else {
    if (!isValidParameter(params)) this.raise("JS_PARAM_DEC_EXPECTED");
    parameterArray.push(params);
  }
  return parameterArray;
};
