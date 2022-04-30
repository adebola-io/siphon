import {
  ArrayExpression,
  ArrayPattern,
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  BreakStatement,
  CatchClause,
  DoWhileStatement,
  EmptyStatement,
  ExpressionStatment,
  ForInStatement,
  ForStatement,
  Identifier,
  IfStatement,
  isValidForInParam,
  isValidForParam,
  JSNode,
  ObjectExpression,
  ObjectPattern,
  ReturnStatement,
  SequenceExpression,
  SwitchCase,
  SwitchStatement,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
} from "../../../../types";
import { ezra } from "./base";

ezra.statement = function () {
  this.outerspace();
  switch (true) {
    case this.end:
      return;
    case this.eat("/*"):
    case this.eat("//"):
      this.skip();
      break;
    case this.contexts.top() === "object":
      return this.property();
    case this.contexts.top() === "parameters":
      return this.parameter();
    case this.contexts.top() === "array":
      return this.elements();
    case this.contexts.top() === "import":
      return this.importSpecifier();
    case this.contexts.top() === "export":
      return this.exportSpecifier();
    case this.contexts.top() === "call":
      return this.arguments();
      break;
    case this.contexts.top() === "switch_block":
      if (!(this.match("case") || this.match("default")) && !this.end) {
        this.raise("JS_CASE_EXPECTED");
      } else if (this.char === "}") {
        return;
      } else {
        let isDefault = this.belly.top() === "default" ?? false;
        return this.caseStatement(isDefault);
      }
    case this.eat("{"):
      if (!["block", "global"].includes(this.contexts.top())) {
        this.backtrack();
        return this.tryExpressionStatement();
      } else return this.blockStatement();
    case this.match("do"):
      return this.doWhileStatement();
    case this.eat(";"):
      return this.emptyStatement();
    case this.match("if"):
      return this.ifStatement();
    case this.match("for"):
      return this.forStatement();
    case this.match("try"):
      return this.tryStatement();
    case this.match("else"):
      this.raise("JS_ILLEGAL_ELSE");
    case this.match("case"):
      this.raise("JS_ILLEGAL_CASE");
    case this.match("while"):
      return this.whileStatement();
    case this.match("break"):
      return this.breakStatement();
    case this.match("const"):
    case this.match("var"):
    case this.match("let"):
      if (this.contexts.top() === "expression")
        this.raise("EXPRESSION_EXPECTED");
      else return this.variableDeclaration();
    case this.match("throw"):
      return this.throwStatement();
    case this.match("switch"):
      return this.switchStatement();
    case this.match("function"):
      if (["array", "expression", "call"].includes(this.contexts.top())) {
        this.backtrack();
        return this.tryExpressionStatement();
      } else return this.functionDeclaration();
    case this.match("return"):
      return this.returnStatement();
    case this.match("import"):
      this.outerspace();
      if (this.char === "(") {
        this.backtrack();
        return this.tryExpressionStatement();
      } else if (
        this.contexts.top() !== "global" ||
        this.scope.body.find((node) => node.type !== "ImportDeclaration")
      ) {
        this.raise("JS_ILLEGAL_IMPORT");
      } else return this.importDeclaration();
    case this.match("export"):
      return this.exportDeclaration();
    case this.match("default"):
      this.raise("JS_EXPORT_EXPECTED");
    default:
      return this.tryExpressionStatement();
  }
};
ezra.tryExpressionStatement = function () {
  let expstat = new ExpressionStatment(this.j);
  this.operators.push("none");
  expstat.expression = this.expression();
  if (expstat.expression === undefined) return;
  expstat.loc.start = expstat.expression.loc.start;
  expstat.loc.end = expstat.expression.loc.end;
  this.operators.pop();
  this.eat(";");
  return expstat;
};
ezra.blockStatement = function (eatComma) {
  const blockstat = new BlockStatement(this.j - 1);
  blockstat.body = this.group("block");
  blockstat.loc.end = this.j;
  if (eatComma) {
    this.outerspace();
    this.eat(";");
  }
  return blockstat;
};
ezra.ifStatement = function () {
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  const ifstat = new IfStatement(this.j - 2);
  ifstat.test = this.group("if");
  if (ifstat.test === undefined) this.raise("EXPRESSION_EXPECTED");
  this.outerspace();
  ifstat.consequent = this.statement();
  if (ifstat.consequent === undefined) this.raise("EXPRESSION_EXPECTED");
  this.outerspace();
  if (this.match("else")) ifstat.alternate = this.statement();
  return ifstat;
};
ezra.forStatement = function () {
  const start = this.j - 3;
  const forstat = new ForStatement(start);
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  const paramBody = this.group("for");
  if (isValidForInParam(paramBody)) {
    return this.forInStatement(start, paramBody[0]);
  } else if (!isValidForParam(paramBody)) this.raise("EXPRESSION_EXPECTED");
  else if (paramBody[0].expression?.operator === "in") {
    this.raise("CLOSING_BRAC_EXPECTED");
  }
  if (paramBody.body?.length === 0) this.raise("EXPRESSION_EXPECTED");
  if (paramBody[0] instanceof VariableDeclaration) forstat.init = paramBody[0];
  else forstat.init = paramBody[0].expression ?? null;
  forstat.test = paramBody[1].expression ?? null;
  forstat.update = paramBody[2]?.expression ?? null;
  this.outerspace();
  forstat.body = this.statement();
  if (forstat.body === undefined) this.raise("EXPRESSION_EXPECTED");
  return forstat;
};
ezra.forInStatement = function (start, param) {
  const forin = new ForInStatement(start);
  if (param instanceof VariableDeclaration) {
    forin.right = param.declarations[0].init;
    forin.left = param.declarations[0];
    forin.left.init = null;
    forin.left.loc.end = forin.left.id.loc.end;
  } else {
    forin.left = param.left;
    forin.right = param.right;
  }
  this.outerspace();
  forin.body = this.statement();
  return forin;
};
ezra.emptyStatement = function () {
  const empty = new EmptyStatement(this.j - 1);
  empty.loc.end = this.j;
  return empty;
};
ezra.whileStatement = function () {
  const whilestat = new WhileStatement(this.j - 5);
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  whilestat.test = this.group("while");
  this.outerspace();
  whilestat.body = this.statement();
  if (whilestat.body === undefined) this.raise("EXPRESSION_EXPECTED");
  whilestat.loc.end = this.j;
  return whilestat;
};
ezra.doWhileStatement = function () {
  const dwstat = new DoWhileStatement(this.j - 2);
  this.outerspace();
  dwstat.body = this.statement();
  this.outerspace();
  if (!this.eat("while")) this.raise("JS_WHILE_EXPECTED");
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  dwstat.test = this.group();
  dwstat.loc.end = this.j;
  this.outerspace();
  this.eat(";");
  return dwstat;
};
ezra.switchStatement = function () {
  const switchstat = new SwitchStatement(this.j - 6);
  this.outerspace();
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  switchstat.discriminant = this.group("switch");
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  switchstat.cases = this.group("switch_block");
  switchstat.loc.end = this.j;
  return switchstat;
};
ezra.caseStatement = function (isDefault) {
  const switchcase = new SwitchCase(this.j - 4);
  switchcase.test = this.expression("case");
  if (isDefault) switchcase.test = null;
  else if (switchcase.test === undefined) this.raise("EXPRESSION_EXPECTED");
  if (!this.eat(":")) this.raise("COLON_EXPECTED");
  this.outerspace();
  this.contexts.push("case");
  while (!this.end && this.char !== "}" && !this.isNewCaseStatement()) {
    let statement = this.statement();
    switchcase.consequent.push(statement);
    this.outerspace();
  }
  this.contexts.pop();
  switchcase.loc.end =
    switchcase.consequent[switchcase.consequent.length - 1]?.loc.end;
  return switchcase;
};
ezra.breakStatement = function () {
  const breakstat = new BreakStatement(this.j - 5);
  this.outerspace();
  this.eat(";");
  breakstat.loc.end = this.j;
  return breakstat;
};
ezra.throwStatement = function () {
  const throwstat = new ThrowStatement(this.j - 5);
  this.innerspace();
  if (/\n|;/.test(this.char)) this.raise("EXPRESSION_EXPECTED");
  else throwstat.argument = this.expression();
  this.eat(";");
  throwstat.loc.end = throwstat.argument?.loc.end;
  return throwstat;
};
ezra.tryStatement = function () {
  const trystat = new TryStatement(this.j - 3);
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  trystat.block = this.blockStatement();
  this.outerspace();
  if (!this.match("catch")) this.raise("EXPECTED", "catch");
  trystat.handler = new CatchClause(this.j - 5);
  this.outerspace();
  if (this.eat("(")) {
    const param = this.group("parameters");
    if (param.length > 1) this.raise("CATCH_NEW_PARAM");
    if (param[0] === undefined) this.raise("IDENTIFIER_EXPECTED");
    if (!(param[0] instanceof Identifier)) {
      this.raise("CATCH_ASSIGN");
    }
    trystat.handler.param = param[0];
  } else trystat.handler.param = null;
  this.outerspace();
  if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
  trystat.handler.body = this.blockStatement();
  trystat.handler.loc.end = trystat.handler.body.loc.end;
  this.outerspace();
  if (this.match("finally")) {
    this.outerspace();
    if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
    trystat.finalizer = this.blockStatement();
  } else trystat.finalizer = null;
  trystat.loc.end = this.j - 1;
  return trystat;
};
ezra.returnStatement = function () {
  const retstat = new ReturnStatement(this.j - 6);
  this.innerspace();
  if (/\n/.test(this.char)) {
    retstat.argument = null;
    this.next();
  } else retstat.argument = this.expression() ?? null;
  this.eat(";");
  retstat.loc.end = this.j;
  return retstat;
};
ezra.variableDeclaration = function () {
  let kind = this.belly.pop();
  const vardec = new VariableDeclaration(this.j - kind.length);
  vardec.kind = kind;
  this.outerspace();
  vardec.declarations = this.declarators(this.expression(), kind);
  vardec.loc.end = this.j;
  this.outerspace();
  this.eat(";");
  return vardec;
};
ezra.declarators = function (expressionList, kind) {
  const declarations: VariableDeclarator[] = [];
  const confirmDec = (expression: JSNode) => {
    var declarator = new VariableDeclarator(expression.loc.start);
    if (expression instanceof AssignmentExpression) {
      if (expression.operator !== "=") {
        this.raise("JS_UNEXPECTED_TOKEN", expression.operator);
      }
      if (expression.left instanceof Identifier) {
        declarator.id = expression.left;
        declarator.loc.end = declarator.init?.loc.end;
      } else if (expression.left instanceof ObjectExpression) {
        declarator.id = new ObjectPattern(expression.left.loc.start);
        declarator.id.properties = expression.left.properties;
        declarator.id.loc.end = expression.left.loc.end;
      } else if (expression.left instanceof ArrayExpression) {
        declarator.id = new ArrayPattern(expression.left.loc.start);
        declarator.id.elements = expression.left.elements;
        declarator.id.loc.end = expression.left.loc.end;
      } else this.raise("IDENTIFIER_EXPECTED");
      declarator.init = expression.right;
    } else if (expression instanceof Identifier) {
      if (kind === "const") this.raise("CONST_INIT");
      else declarator.id = expression;
    } else if (/ObjectExpression|ArrayExpression/.test(expression.type)) {
      this.raise("DESTRUCTURING_ERROR");
    } else if (
      expression instanceof BinaryExpression &&
      expression.operator === "in" &&
      this.contexts.top() === "for"
    ) {
      declarator.id = expression.left;
      declarator.init = expression.right;
      declarator.in = true;
    } else this.raise("IDENTIFIER_EXPECTED");
    declarator.loc.end = expression.loc.end;
    return declarator;
  };
  if (expressionList instanceof SequenceExpression) {
    expressionList.expressions.forEach((expression: any) => {
      declarations.push(confirmDec(expression));
    });
  } else declarations.push(confirmDec(expressionList));
  return declarations;
};
