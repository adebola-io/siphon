import { PathLike, readFileSync, writeFileSync } from "fs";
import Errors from "../../../errors";
import { Parser as Acorn } from "acorn";
import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  ChainExpression,
  ConditionalExpression,
  EmptyStatement,
  ErrorTypes,
  Expression,
  ExpressionStatment,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  isOptional,
  isValidExpression,
  isValidReference,
  JSNode,
  Literal,
  LogicalExpression,
  MemberExpression,
  NewExpression,
  Program,
  SequenceExpression,
  Statement,
  StatementContext,
  UnaryExpression,
  UpdateExpression,
} from "../../../types";
import {
  assoc,
  counterpart,
  isAlphabetic,
  isNum,
  isValidIdentifierCharacter,
  precedence,
} from "../../../utils";
import { Stack } from "../../../../structures";

interface options {
  sourceFile: PathLike;
}
var defaults: options = {
  sourceFile: "",
};

class Ezra {
  parse(input: string, options?: options) {
    options = { ...defaults, ...options };
    try {
      return new ezra_internal().parse(input);
    } catch (e: any) {
      // throw new Error(e.message);
      Errors.enc(e.message, options.sourceFile, e.index, { token: e.char });
    }
  }
  static parse = function (input: string, options?: options) {
    return new Ezra().parse(input, options);
  };
}
class parse_utils {
  text!: string;
  /** The program node output. */
  scope!: Program;
  /** The current character being parsed. */
  char!: string;
  statement_context!: StatementContext;
  /** The index of the current character being evaluated. */
  i = 0;
  /** The original index of the character in the source text.
   * Useful for tracking characters during recursion. */
  j = 0;
  from = 0;
  end = false;
  newline = false;
  operators = new Stack();
  belly = new Stack();
  brackets = 0;
  /**
   * Throws an error.
   * @param message The error type to raise.
   */
  raise(message: ErrorTypes, token?: string) {
    throw { message, index: this.j, char: token ?? this.char };
  }
  /**
   * Checks if the current operator being parsed has a lower precedence than the operator parsed before it.
   */
  lowerPrecedence() {
    if (
      precedence[this.operators.top()] > precedence[this.belly.top()] ||
      (precedence[this.operators.top()] === precedence[this.belly.top()] &&
        assoc(this.operators.top()) === "LR")
    ) {
      this.spew();
      return true;
    } else return false;
  }
  /**
   * Checks if the next sequence of characters in the stream match a particular pattern.
   * If
   * @param ptn The string pattern to check for.
   */
  eat(ptn: string) {
    return this.text.slice(this.i, this.i + ptn.length) === ptn
      ? (this.next(ptn.length), this.belly.push(ptn), true)
      : false;
  }
  remains() {
    if (this.char === undefined) this.end = true;
  }
  peek(i: number) {
    return this.text[this.i + i];
  }
  recede(i = 1) {
    this.j = this.from + this.i - i;
    this.i -= i;
    this.char = this.text[this.i];
    this.remains();
  }
  next(i = 1) {
    this.j = this.from + this.i + i;
    this.i += i;
    this.char = this.text[this.i];
    this.remains();
  }
  goto(i: number) {
    this.j = this.from + i;
    this.i = i;
    this.char = this.text[this.i];
    this.remains();
  }
  expect(ptn: string) {
    this.space(true);
    if (this.text.slice(this.i, this.i + ptn.length) !== ptn)
      this.raise("JS_UNEXPECTED_TOKEN");
  }
  spew() {
    this.recede(this.belly.pop().length);
  }
  match(ptn: string) {
    return this.text.slice(this.i, this.i + ptn.length) === ptn &&
      !isValidIdentifierCharacter(this.peek(ptn.length))
      ? (this.next(ptn.length), this.belly.push(ptn), true)
      : false;
  }
  predict(ptn: string) {
    return this.text.slice(this.i, this.i + ptn.length) === ptn ? true : false;
  }
  count() {
    let num = "";
    while (isNum(this.char)) (num += this.char), this.next();
    if (isAlphabetic(this.char)) this.raise("ID_FOLLOWS_LITERAL");
    return num;
  }
  skip() {
    if (this.belly.top() === "/*") while (!this.eat("*/")) this.next();
    else while (this.char !== "\n") this.next();
  }
  read(i: number) {
    let marker = this.text[i++],
      value = "";
    while (this.text[i] && this.text[i] !== marker) {
      if (this.text[i] === "\\") (value += `\\${this.text[++i]}`), i++;
      else {
        if (this.text[i] === "\n" && marker !== "`")
          this.raise("UNTERMINATED_STRING_LITERAL");
        value += this.text[i++];
      }
    }
    if (!this.text[i]) this.raise("UNTERMINATED_STRING_LITERAL");
    return { end: i, value: marker + value + marker, marker };
  }
  /**
   * Arbitrarily read Regex expressions without advancing the token, then return the read regex string and its ending index.
   * @param i The index to start reading from.
   */
  regex(i: number) {
    /** The raw value of the regex expression. */
    let value = "";
    let flags = "";
    while (this.text[i] && !/\n|\//.test(this.text[i])) {
      // ESCAPE SEQUENCE
      if (this.text[i] === "\\") {
        value += `\\${this.text[++i]}`;
        i++;
      } else value += this.text[i++];
    }
    if (!this.text[i] || this.text[i] == "\n")
      // ERROR: Regex expression is not closed.
      this.raise("UNTERMINATED_REGEX_LITERAL");
    i++; // close regex expression.
    while (isAlphabetic(this.text[i])) flags += this.text[i++]; // Read flags.
    // ERROR: Regex flag is invalid.
    if (isNum(this.text[i]) || /\_|\$|\!|\#|\¬|\~|\@/.test(this.text[i]))
      this.raise("JS_INVALID_REGEX_FLAG");
    return {
      end: i,
      value,
      flags,
    };
  }
  space(skip_new_line = false) {
    if (skip_new_line)
      while (/\s|\r|\n/.test(this.char))
        this.char === "\n" && !this.newline ? (this.newline = true) : 0,
          this.next();
    else while (/\s|\r/.test(this.char) && this.char !== "\n") this.next();
  }
}
class ezra_internal extends parse_utils {
  parse!: (input: string, from?: number) => Program;
  group!: (context?: StatementContext) => any;
  statement!: (context: StatementContext) => Statement | undefined;
  expression!: (type?: string) => JSNode;
  reparse!: (node: JSNode, context?: string) => any;
  identifier!: () => Identifier;
  numberLiteral!: () => Literal;
  stringLiteral!: () => Literal;
  booleanLiteral!: () => Literal;
  regexLiteral!: () => Literal;
  memberExpression!: (object: JSNode) => JSNode;
  chainExpression!: (exp: MemberExpression) => ChainExpression;
  callExpression!: (callee: JSNode) => JSNode;
  newExpression!: () => JSNode;
  updateExpression!: (argument: JSNode, prefix?: boolean) => JSNode;
  unaryExpression!: () => JSNode;
  logicalExpression!: (left: JSNode) => JSNode;
  binaryExpression!: (left: JSNode) => JSNode;
  conditionalExpression!: (test: JSNode) => JSNode;
  assignmentExpression!: (left: JSNode) => JSNode;
  sequenceExpression!: (left: JSNode) => JSNode;
  emptyStatement!: () => EmptyStatement;
  functionStatement!: () => FunctionDeclaration;
  tryExpressionStatement!: () => ExpressionStatment | undefined;
  ifStatement!: () => IfStatement;
  forStatement!: () => ForStatement;
}
var ezra = ezra_internal.prototype;

ezra.parse = function (input, from = 0) {
  this.scope = new Program(0);
  this.text = input;
  this.next(0);
  this.j = this.from = from;
  this.operators.push("none");
  while (!this.end) this.scope.push(this.statement("global"));
  this.scope.loc.end = this.text.length;
  delete this.scope.last;
  return this.scope;
};
ezra.group = function (context = "expression") {
  let chunk = "",
    level = 1,
    closure = this.belly.top();
  while (!this.end && level > 0) {
    if (this.eat("//") || this.eat("/*")) this.skip();
    else if (/"|'|`/.test(this.char)) {
      let str = this.read(this.i);
      chunk += str.value;
      this.goto(str.end + 1);
    }
    if (this.char === closure) level++;
    else if (this.char === counterpart[closure]) level--;
    if (level === 0) {
      this.next();
      this.belly.pop();
      break;
    }
    chunk += this.char;
    this.next();
  }
  if (this.end && level > 0) this.raise("CLOSING_BRAC_EXPECTED");
  var sub_program: any = new ezra_internal().parse(
    chunk,
    this.j - chunk.length
  );
  if (context === "for") {
    if (
      sub_program.body.find(
        (statement: Statement) => statement.type !== "ExpressionStatment"
      )
    )
      this.raise("EXPRESSION_EXPECTED");
    else return sub_program.body;
  }
  if (sub_program.body.length > 1) this.raise("EXPRESSION_EXPECTED");
  return sub_program.body[0]?.expression;
};
ezra.statement = function (context) {
  this.space(true);
  this.statement_context = context;
  switch (true) {
    case this.eat("/*"):
    case this.eat("//"):
      this.skip();
    case this.eat(";"):
      return this.emptyStatement();
    case this.match("function"):
      return this.functionStatement();
    case this.match("if"):
      return this.ifStatement();
    case this.match("else"):
      if (context !== "if") this.raise("JS_ILLEGAL_ELSE");
    default:
      return this.tryExpressionStatement();
  }
};
ezra.expression = function (type) {
  var exp: Expression | undefined;
  this.space(true);
  switch (true) {
    case this.eat("/*"):
    case this.eat("//"):
      this.skip();
      break;
    case /`|"|'/.test(this.char):
      return this.reparse(this.stringLiteral());
    case this.eat("/"):
      return this.reparse(this.regexLiteral());
    case this.eat("("):
      return this.reparse(this.group());
    case this.match("true"):
    case this.match("false"):
      return this.reparse(this.booleanLiteral());
    case isNum(this.char):
      return this.reparse(this.numberLiteral(), "number");
    case this.match("new"):
      return this.reparse(this.newExpression());
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
    case isValidIdentifierCharacter(this.char):
      return this.reparse(this.identifier(), "none");
    case this.char === ":":
      if (type !== "ternary") this.raise("JS_UNEXPECTED_TOKEN");
    case this.char === undefined:
      return;
    case this.char === ";":
      this.next();
      return;
    default:
      this.raise("JS_UNEXPECTED_TOKEN");
  }
  return exp;
};
ezra.reparse = function (node, context) {
  if (isValidExpression(node)) {
    this.space(true);
    switch (true) {
      case this.eat("/*"):
      case this.eat("//"):
        this.skip();
        break;
      case this.char === ";":
        this.next();
        return node;
      case this.eat(","):
        return this.sequenceExpression(node);
      case this.eat("."):
      case this.eat("?."):
        if (context === "number") this.raise("ID_FOLLOWS_LITERAL");
      case this.eat("["):
        return this.memberExpression(node);
      case this.eat("("):
        if (context === "new") return node;
        return this.callExpression(node);
      case this.eat("++"):
      case this.eat("--"):
        if (this.newline) {
          this.recede(2);
          this.newline = false;
          return node;
        } else return this.updateExpression(node, false);
      case this.eat(">>="):
      case this.eat(">>>="):
      case this.eat("**="):
      case this.eat("<<="):
      case this.eat("&&="):
      case this.eat("||="):
      case this.eat("??="):
      case this.eat("*="):
      case this.eat("+="):
      case this.eat("-="):
      case this.eat("/="):
      case this.eat("%="):
      case this.eat("&="):
      case this.eat("^="):
      case this.eat("|="):
        return this.assignmentExpression(node);
      case this.eat("&&"):
      case this.eat("||"):
      case this.eat("??"):
        return this.logicalExpression(node);
      case this.eat("**"):
      case this.eat("*"):
      case this.eat("/"):
      case this.eat("%"):
      case this.eat("+"):
      case this.eat("-"):
      case this.eat(">>>"):
      case this.eat("<<"):
      case this.eat(">>"):
      case this.eat("<="):
      case this.eat(">="):
      case this.eat(">"):
      case this.eat("<"):
      case this.match("instanceof"):
      case this.match("in"):
      case this.eat("==="):
      case this.eat("!=="):
      case this.eat("=="):
      case this.eat("!="):
      case this.eat("&"):
        return this.binaryExpression(node);
      case this.eat("?"):
        return this.conditionalExpression(node);
      case this.eat("="):
        return this.assignmentExpression(node);
      case isValidIdentifierCharacter(this.char):
      case /'|`|"/.test(this.char):
      case isNum(this.char):
        if (this.newline) {
          this.newline = false;
          this.recede();
          return node;
        } else this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");
    }
    if (node instanceof MemberExpression && isOptional(node))
      return this.chainExpression(node);
    else return node;
  } else return node;
};
// Identifiers.
ezra.identifier = function () {
  const id = new Identifier(this.j);
  if (!isValidIdentifierCharacter(this.char)) this.raise("IDENTIFIER_EXPECTED");
  while (isValidIdentifierCharacter(this.char))
    (id.name += this.char), this.next();
  id.loc.end = this.j;
  this.space(true);
  return id;
};
// Literals.
ezra.numberLiteral = function () {
  const numlit = new Literal(this.j);
  numlit.kind = "number";
  numlit.raw += this.count();
  if (this.eat(".")) numlit.raw += "." + this.count();
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
  strlit.loc.end = str.end;
  this.goto(str.end + 1);
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
// Expressions.
ezra.memberExpression = function (object) {
  var memexp = new MemberExpression(this.j);
  memexp.object = object;
  if (this.belly.top() === "[") {
    memexp.property = this.group();
    if (memexp.property === undefined) this.raise("EXPRESSION_EXPECTED");
    memexp.computed = true;
  } else memexp.property = this.identifier();
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
ezra.callExpression = function (callee) {
  const callexp = new CallExpression(callee.loc.start);
  callexp.callee = callee;
  let args = this.group();
  if (args instanceof SequenceExpression)
    args.expressions.forEach((expression) => {
      callexp.arguments.push(expression);
    });
  else if (args !== undefined) callexp.arguments.push(args);
  callexp.loc.end = this.j;
  return this.reparse(callexp);
};
ezra.newExpression = function () {
  this.space(true);
  if (this.eat(".")) {
    this.space(true);
    let metaprop = this.identifier();
    if (metaprop.name !== "target")
      this.raise("INVALID_NEW_META_PROPERTY", metaprop.name);
  }
  const newexp = new NewExpression(this.j);
  newexp.callee = this.reparse(this.identifier(), "new");
  if (this.belly.top() === "(") {
    const args = this.group();
    args ? newexp.arguments.push(args) : 0;
    this.belly.pop();
  }
  newexp.loc.end = this.j;
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
  return this.reparse(upexp, prefix ? "prefix" : "postfix");
};
ezra.unaryExpression = function () {
  const unexp = new UnaryExpression(this.j);
  unexp.operator = this.belly.top();
  this.operators.push("prefix");
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
  logexp.right = this.expression();
  logexp.loc.end = this.j;
  this.operators.pop();
  return this.reparse(logexp);
};
ezra.conditionalExpression = function (test) {
  if (this.lowerPrecedence()) return test;
  const condexp = new ConditionalExpression(test.loc.start);
  condexp.test = test;
  this.operators.push("?");
  condexp.consequent = this.expression("ternary");
  if (this.char === ":") this.eat(":");
  else this.raise("COLON_EXPECTED");
  condexp.alternate = this.expression();
  this.operators.pop();
  condexp.loc.end = this.j;
  return this.reparse(condexp);
};
ezra.assignmentExpression = function (left) {
  if (this.lowerPrecedence()) return left;
  if (!isValidReference(left)) this.raise("JS_INVALID_LHS_ASSIGN");
  const assignexp = new AssignmentExpression(left.loc.start);
  assignexp.left = left;
  assignexp.operator = this.belly.top();
  this.operators.push(this.belly.top());
  assignexp.right = this.expression();
  this.operators.pop();
  assignexp.loc.end = this.j;
  return this.reparse(assignexp);
};
ezra.sequenceExpression = function (left) {
  if (this.lowerPrecedence()) return left;
  const seqexp = new SequenceExpression(left.loc.start);
  this.operators.push(",");
  if (left instanceof SequenceExpression) {
    left.expressions.forEach((prev_exps) => {
      seqexp.expressions.push(prev_exps);
    });
  } else seqexp.expressions.push(left);
  seqexp.expressions.push(this.expression());
  this.operators.pop();
  seqexp.loc.end = this.j;
  return this.reparse(seqexp);
};
// Statements.
ezra.tryExpressionStatement = function () {
  let expstat = new ExpressionStatment(this.j);
  expstat.expression = this.expression();
  if (expstat.expression === undefined) return;
  expstat.loc.start = expstat.expression.loc.start;
  expstat.loc.end = expstat.expression.loc.end;
  return expstat;
};
ezra.ifStatement = function () {
  this.space(true);
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  const ifstat = new IfStatement(this.j - 2);
  ifstat.test = this.group();
  if (ifstat.test === undefined) this.raise("EXPRESSION_EXPECTED");
  this.space(true);
  ifstat.consequent = this.statement("if");
  this.space(true);
  if (this.match("else")) ifstat.alternate = this.statement("if");
  return ifstat;
};
ezra.forStatement = function () {
  const forstat = new ForStatement(this.j - 3);
  if (!this.eat("(")) this.raise("OPEN_BRAC_EXPECTED");
  const params = this.group("for");
  if (params.body.length === 0) this.raise("EXPRESSION_EXPECTED");
  forstat.init = params[0];
  forstat.test = params[1];
  forstat.update = params[2];
  forstat.body = this.statement("for");
  return forstat;
};
ezra.emptyStatement = function () {
  const empty = new EmptyStatement(this.j - 1);
  empty.loc.end = this.j;
  return empty;
};
const text = readFileSync("test/src/index.js").toString();

const program = Ezra.parse(text, { sourceFile: "test/src/index.js" });
writeFileSync("test/src/rive.json", JSON.stringify(program));

// const program = Acorn.parse(text, { ecmaVersion: 2020 });
// writeFileSync("test/src/acorn.json", JSON.stringify(program));

console.log(program);
