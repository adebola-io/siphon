import { PathLike, readFileSync, writeFileSync } from "fs";
import {
  isAlphabetic,
  isAlphaNumeric,
  isNewLine,
  isNum,
  isSpaceCharac,
  OPERATORS,
  stringMarkers,
} from "../../../utils";
import tokenize, { Token } from "./tokenizer";
import {
  Program,
  ExpressionStatment,
  Expression,
  Statement,
  Declaration,
  Literal,
  JSNodes,
  JSParserOptions,
  BlockStatement,
  MemberExpression,
  Identifier,
  CallExpression,
  SequenceExpression,
  JSNode,
} from "../../../types";
import Errors from "../../../errors";

class Parser {
  constructor(mode: "file" | "text", options?: JSParserOptions) {
    this.mode = mode;
  }
  mode: "file" | "text";
  text = "";
  i = 0;
  token = "";
  EOS = false;
  countingSequence = false;
  globalSeqExp = new SequenceExpression(0);
  source: PathLike = "";
  scope: Program | BlockStatement = new Program(0);
  parse(input: string | PathLike) {
    if (this.mode === "file") {
      this.text = readFileSync(input).toString();
      this.source = input;
    } else this.text = input.toString();
    this.token = this.text[0];
    return this.parseGlobalScope();
  }
  /**
   * Check the value of the next token.
   * @param at How far to peek.
   * @returns the next token.
   */
  next(at: number = 1) {
    return this.text[this.i + at];
  }
  /**
   * Check the value of previous tokens.
   * @param at How far to reverse.
   * @returns The preious token.
   */
  previous(at: number = 1) {
    return this.text[this.i - at];
  }
  /**
   * Shift the token to the next raw value.
   * @param to How far to shift.
   */
  move(to: number = 1) {
    this.i += to;
    this.token = this.text[this.i];
  }
  /** Read Numbers. */
  readNumericLiteral() {
    const literal = new Literal(this.i);
    while (isNum(this.token)) {
      literal.raw += this.token;
      if (this.next() === "." && isNum(this.next(2))) {
        literal.raw += "." + this.next(2);
        this.move(3);
      } else this.move();
    }
    literal.kind = "number";
    literal.value = parseFloat(literal.raw);
    literal.loc.end = this.i;
    return literal;
  }
  /** Read Strings. */
  readStringLiteral() {
    const literal = new Literal(this.i);
    let marker = this.token;
    literal.raw += marker;
    this.move();
    while (this.token && this.token !== marker) {
      if (
        this.token === "\\" &&
        this.next() === marker &&
        this.previous() !== "\\"
      ) {
        literal.raw += "\\" + marker;
        this.move();
      } else literal.raw += this.token;
      this.move();
    }
    literal.raw += marker;
    literal.kind = "string";
    return literal;
  }
  /** Read Identifiers. */
  readIdentifier() {
    const identifier = new Identifier(this.i);
    while (isAlphaNumeric(this.token)) {
      identifier.raw += this.token;
      this.move();
    }
    identifier.name = identifier.raw;
    identifier.loc.end = this.i;
    return identifier;
  }
  /** Read Member Expressions. */
  readMemberExpression() {
    var object = this.scope.pop();
    if (!object)
      Errors.enc("VARIABLE_DECLARATION_EXPECTED", this.source, this.i);
    const memexp = new MemberExpression(this.i);
    if (object instanceof Literal && object.kind === "number")
      Errors.enc("ID_FOLLOWS_LITERAL", this.source, this.i);
    memexp.object = object;
    this.move();
    if (isAlphabetic(this.token)) memexp.property = this.readIdentifier();
    else Errors.enc("JS_UNEXP_KEYWORD_OR_IDENTIFIER", this.source, this.i);
    memexp.raw = memexp.object?.raw + "." + memexp.property?.raw;
    memexp.loc.end = memexp.property?.loc.end;
    return memexp;
  }
  readArrMemberExpression() {
    var object = this.scope.pop();
    const memexp = new MemberExpression(this.i);
    memexp.object = object;
    let level = 1;
    return memexp;
  }
  /** Read Call Expressions. */
  readCallExpression() {
    const callexp = new CallExpression(this.i);
    callexp.callee = this.scope.pop();
    callexp.arguments = [];
    this.move();
    let level = 1;
    let args = "";
    while (this.token && level) {
      if (this.token === "(") level++;
      if (this.token === ")") level--;
      if (!level) break;
      args += this.token;
      this.move();
    }
    callexp.loc.end = this.i;
    callexp.raw =
      callexp.callee?.raw +
      "(" +
      callexp.arguments.map((arg) => arg.raw).join(", ") +
      ")";
    return callexp;
  }
  /**Skip over spaces. */
  space(ignoreNewlines = true) {
    if (ignoreNewlines) while (isSpaceCharac(this.token)) this.move();
    else
      while (isSpaceCharac(this.token) && !isNewLine(this.token)) this.move();
  }
  parseScope() {
    this.space(false);
    if (this.token)
      switch (true) {
        case this.token + this.next() === "/*":
          this.move(2);
          while (this.token + this.next() !== "*/") this.move();
          this.move(2);
          break;
        case stringMarkers.includes(this.token):
          this.scope.add(this.readStringLiteral());
          break;
        case isNum(this.token):
          this.scope.add(this.readNumericLiteral());
          break;
        case this.token === ".":
          this.scope.add(this.readMemberExpression());
          break;
        case this.token === "(" && this.scope.last !== undefined:
          this.scope.add(this.readCallExpression());
          break;
        case this.token === "[" && this.scope.last !== undefined:
          this.scope.add(this.readArrMemberExpression());
          break;
        case isAlphabetic(this.token):
          this.scope.add(this.readIdentifier());
          break;
        default:
          this.move();
          break;
      }
    this.space();
    if (this.next()) this.parseScope();
    else this.scope.loc.end = this.i;
  }
  parseGlobalScope() {
    this.parseScope();
    delete this.scope.last;
    return this.scope;
  }
}

export default Parser;

const parser = new Parser("file");
const program = parser.parse("test/src/index.js");
console.log(program);
writeFileSync(
  "test/src/result.js",
  "module.exports = " + JSON.stringify(program)
);
