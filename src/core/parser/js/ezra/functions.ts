import {
  ArrowFunctionExpression,
  AssignmentPattern,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  isValidParameter,
  JSNodes,
  SequenceExpression,
} from "../../../../types";
import { isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.functionDeclaration = function () {
  const func = new FunctionDeclaration(this.j - 8);
  this.outerspace();
  func.id = this.identifier();
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  func.params = this.group("parameters");
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  else func.body = this.blockStatement();
  func.loc.end = this.j;
  return func;
};
ezra.parameter = function () {
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
ezra.functionExpression = function (isAsync = false) {
  this.contexts.push("function");
  const func = new FunctionExpression(this.j - 8);
  this.outerspace();
  if (isValidIdentifierCharacter(this.char)) {
    func.id = this.identifier();
    this.outerspace();
  } else func.id = null;
  func.async = isAsync;
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  else func.params = this.group("parameters");
  this.outerspace();
  if (!this.eat("{")) this.raise("EXPECTED", "{");
  else func.body = this.blockStatement(false);
  func.loc.end = this.j;
  this.contexts.pop();
  return this.reparse(func);
};
ezra.arrowFunctionExpression = function (params, startAt) {
  if (this.lowerPrecedence()) return params;
  const arrowfunc = new ArrowFunctionExpression(
    startAt ?? params?.loc.start ?? 0
  );
  arrowfunc.params = params ? this.parameterize(params) : [];
  this.outerspace();
  arrowfunc.id = null;
  if (this.eat("{")) arrowfunc.body = this.blockStatement(false);
  else arrowfunc.body = this.expression();
  arrowfunc.loc.end = this.j;
  return this.reparse(arrowfunc);
};
ezra.parameterize = function (params) {
  const parameterArray: Array<JSNodes> = [],
    parameterNames: string[] = [];
  if (params === undefined) return parameterArray;
  if (params instanceof SequenceExpression) {
    params.expressions.forEach((param: any) => {
      if (!isValidParameter(param)) this.raise("JS_PARAM_DEC_EXPECTED");
      if (param instanceof Identifier) {
        parameterNames.includes(param.name)
          ? this.raise("JS_PARAM_CLASH", param.name)
          : parameterNames.push(param.name);
        parameterArray.push(param);
      } else {
        parameterNames.includes(param.left.name)
          ? this.raise("JS_PARAM_CLASH", param.name)
          : parameterNames.push(param.left.name);
        if (param.operator !== "=") this.raise("JS_PARAM_DEC_EXPECTED");
        const pattern = new AssignmentPattern(param.loc.start);
        pattern.left = param.left;
        pattern.right = param.right;
        pattern.loc.end = param.loc.end;
        parameterArray.push(pattern);
      }
    });
  } else {
    if (!isValidParameter(params)) this.raise("JS_PARAM_DEC_EXPECTED");
    parameterArray.push(params);
  }
  return parameterArray;
};
