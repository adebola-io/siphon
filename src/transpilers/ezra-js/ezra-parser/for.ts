import {
  ArrayExpression,
  ArrayPattern,
  BinaryExpression,
  EmptyStatement,
  Expression,
  ExpressionStatment,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  isValidForInParam,
  isValidForParam,
  ObjectExpression,
  ObjectPattern,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../types";
import { ezra } from "./base";

// ezra.forStatement = function () {
//   const start = this.j - 3;
//   const forstat = new ForStatement(start);
//   this.outerspace();
//   if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
//   const paramBody = this.group("for");
//   if (isValidForInParam(paramBody)) {
//     return this.forInStatement(start, paramBody[0]);
//   } else if (!isValidForParam(paramBody)) this.raise("EXPRESSION_EXPECTED");
//   else if (paramBody[0].expression?.operator === "in") {
//     this.raise("CLOSING_BRAC_EXPECTED");
//   }
//   if (paramBody.body?.length === 0) this.raise("EXPRESSION_EXPECTED");
//   if (paramBody[0] instanceof VariableDeclaration) forstat.init = paramBody[0];
//   else forstat.init = paramBody[0].expression ?? null;
//   forstat.test = paramBody[1].expression ?? null;
//   forstat.update = paramBody[2]?.expression ?? null;
//   this.outerspace();
//   forstat.body = this.statement();
//   if (forstat.body === undefined) this.raise("EXPRESSION_EXPECTED");
//   return forstat;
// };
// ezra.forInStatement = function (start, param) {
//   const forin = new ForInStatement(start);
//   if (param instanceof VariableDeclaration) {
//     forin.right = param.declarations[0].init;
//     forin.left = param.declarations[0];
//     forin.left.init = null;
//     forin.left.loc.end = forin.left.id.loc.end;
//   } else {
//     forin.left = param.left;
//     forin.right = param.right;
//   }
//   this.outerspace();
//   forin.body = this.statement();
//   return forin;
// };
export const transformtoPattern = function (expression: Expression) {
  var transform: any;
  if (expression instanceof ArrayExpression) {
    transform = new ArrayPattern(expression.loc.start);
    transform.elements = expression.elements;
  } else if (expression instanceof ObjectExpression) {
    transform = new ObjectPattern(expression.loc.start);
    transform.properties = expression.properties;
  } else transform = expression;
  transform.loc.end = expression.loc.end;
  return transform;
};
ezra.forStatement = function () {
  var start = this.j - 3,
    hasAwait = false,
    forstatement: any;
  this.outerspace();
  if (this.match("await")) hasAwait = true;
  this.outerspace();
  if (!this.eat("(")) this.raise("EXPECTED", "(");
  var parameters = this.group("for_params");
  // Special For statements.
  // FOR-OF & FOR-IN VARIABLE DECLARATIONS.
  if (
    parameters[0].type === "VariableDeclaration" &&
    (parameters[0].declarations[0].of || parameters[0].declarations[0].in)
  ) {
    forstatement = parameters[0].declarations[0].of
      ? new ForOfStatement(start)
      : new ForInStatement(start);
    // 'await; can only be used in for-of statements.
    if (hasAwait) {
      if (parameters[0].declarations[0].of) forstatement.await = true;
      else this.raise("EXPECTED", "of", parameters[0].declarations[0].loc.end);
    }
    forstatement.left = parameters[0];
    forstatement.right = parameters[0].declarations[0].right_val;
    delete parameters[0].declarations[0].right_val;
    delete parameters[0].declarations[0].of;
    delete parameters[0].declarations[0].in;
    if (parameters.length > 1)
      this.raise("EXPECTED", ")", parameters[0].loc.end);
  } else if (
    // FOR-OF & FOR-IN BINARIES.
    parameters[0].expression?.type === "BinaryExpression" &&
    ["of", "in"].includes(parameters[0].expression.operator)
  ) {
    let operator = parameters[0].expression.operator;
    forstatement =
      operator === "of" ? new ForOfStatement(start) : new ForInStatement(start);
    // 'await; can only be used in for-of statements.
    if (hasAwait) {
      if (operator === "of") forstatement.await = true;
      else this.raise("EXPECTED", "of", parameters[0].expression.left.loc.end);
    }
    forstatement.left = transformtoPattern(parameters[0].expression.left);
    forstatement.right = parameters[0].expression.right;
    if (parameters.length > 1)
      this.raise("EXPECTED", ")", parameters[0].loc.end);
  } else {
    if (hasAwait) {
      this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER", undefined, start + 3);
    } else if (parameters.length < 2 || parameters.length > 3) {
      this.raise("EXPRESSION_EXPECTED");
    }
    forstatement = new ForStatement(start);
    forstatement.init =
      parameters[0] instanceof VariableDeclaration
        ? parameters[0]
        : parameters[0] instanceof ExpressionStatment
        ? parameters[0].expression
        : parameters[0] instanceof EmptyStatement
        ? null
        : this.raise("EXPRESSION_EXPECTED");
    forstatement.test =
      parameters[1] instanceof ExpressionStatment
        ? parameters[1].expression
        : parameters[1] instanceof EmptyStatement
        ? null
        : this.raise("EXPRESSION_EXPECTED");
    forstatement.update =
      parameters[2] instanceof ExpressionStatment
        ? parameters[2].expression
        : parameters[2] === undefined
        ? null
        : this.raise("EXPRESSION_EXPECTED");
  }
  this.outerspace();
  forstatement.body = this.statement();
  forstatement.loc.end = forstatement.body.loc.end;
  return forstatement;
};
