import { readFileSync, writeFileSync } from "fs";
import Errors from "../../../errors";
import {
  CallExpression,
  Comma,
  ExpressionStatment,
  Identifier,
  isValidExpression,
  JSNodes,
  JSParserOptions,
  Literal,
  MemberExpression,
  Program,
  SequenceExpression,
} from "../../../types";
import {
  isAlphabetic,
  isValidIdentifierCharacter,
  isNum,
  stringMarkers,
  isSpaceCharac,
  isAlphaNumeric,
} from "../../../utils";

class JSParser {
  options: JSParserOptions = {
    sourcefile: "",
    index: 0,
  };
  text!: string;
  program!: Program;
  parseProgram!: () => Program;
  handleComment!: (type: "line" | "block") => void;
  parseNext!: () => JSNodes | undefined;
  NumericLiteral!: () => Literal;
  StringLiteral!: () => Literal;
  Identifier!: () => Identifier;
  MemberExpression!: () => MemberExpression;
  MaybeCallExpression!: () => JSNodes | undefined;
  parseArguments!: (termination: string) => Array<JSNodes | undefined>;
  MaybeExpressionStatement!: () => ExpressionStatment | undefined;
  Comma!: () => Comma;
  /**
   * Arbitrarily read strings from the source text without advancing the token, then return the read string, the marker type and the ending index.
   * @param index The index to start reading from.
   */
  stringReader(index: number) {
    let marker = this.text[index++];
    /** The read string. */
    let value = "";
    while (this.text[index] && this.text[index] !== marker) {
      // Escaped marker.
      if (
        this.text[index] === "\\" &&
        this.text[index + 1] === marker &&
        this.text[index - 1] !== "\\"
      ) {
        value += this.text[index++];
      }
      // ERROR: Newlines in non-template strings.
      if (this.text[index] === "\n" && marker !== "`") {
        Errors.enc(
          "UNTERMINATED_STRING_LITERAL",
          this.options.sourcefile,
          index + this.options.index
        );
      }
      value += this.text[index++];
    }
    // ERROR: String is unterminated.
    if (!this.text[index]) {
      Errors.enc(
        "UNTERMINATED_STRING_LITERAL",
        this.options.sourcefile,
        this.index
      );
    }
    return { end: index, value, marker };
  }
  /** Arbitarily move over comments without advancing the token, then return the ending index.
   * @param i The index to start glossing over from.
   * @param type The type of comment to gloss over.
   */
  commentReader(i: number, type: "line" | "block") {
    i += 2;
    if (type === "line") while (this.text[i] && this.text[i] !== "\n") i++;
    else {
      while (this.text[i] && this.text.slice(i, i + 2) !== "*/") i++;
      // ERROR: Unclosed Block Comment.
      if (!this.text[i])
        Errors.enc("UNCLOSED_BLOCK_COMMENT", this.options.sourcefile, i);
      i++;
    }
    return i + 1;
  }
  /**
   * Parses through a valid block of Javascript text and returns an Abstract Syntax tree representation of the text.
   * @param input The valid Javascript text.
   * @param options Parser Options.
   */
  parse(input: string, options?: JSParserOptions) {
    if (options) this.options = { ...this.options, ...options };
    this.text = input;
    this.program = new Program(0);
    return this.parseProgram();
  }
  /** The number of the current character. */
  index: number = 0;
  /** The real index in the overall source text. Helps in tracking during recusive parsing. */
  globalIndex: number = this.options.index + this.index;
  parsing_args = 0;
  /** The current character being parsed. */
  token!: string;
  /** The next character to parse. */
  lookAhead!: string;
  /** The previously parsed character. */
  lookBehind!: string;
  /** Boolean check if tokens are still available. */
  EOF: boolean = false;
  adjacents() {
    this.lookAhead = this.text[this.index + 1];
    this.lookBehind = this.text[this.index - 1];
  }
  /**
   * Move to the next character.
   * @param i How far to advance.
   */
  advance(i = 1) {
    this.index += i;
    this.globalIndex += i;
    this.token = this.text[this.index];
    this.adjacents();
    if (!this.text[this.index]) this.EOF = true;
  }
  /**
   * Return to a previous character.
   * @param i How far to recoil.
   */
  recoil(i = 1) {
    this.index -= i;
    this.globalIndex += i;
    this.token = this.text[this.index];
    this.adjacents();
  }
  /**
   * Peek at upcoming characters.
   * @param i How far to anticipate.
   */
  foresee(i = 1) {
    return this.text[this.index + i];
  }
  /**
   * Peek at previously evaluated characters.
   * @param i How far to reflect.
   */
  reflect(i = 1) {
    return this.text[this.index - i];
  }
  /**
   * Ignore all rules and jump to a defined index in the source text.
   * @param index The index to jump to.
   */
  goto(index: number) {
    this.index = index;
    this.globalIndex = this.options.index + this.index;
    this.token = this.text[index];
    this.adjacents();
    if (!this.text[this.index]) this.EOF = true;
  }
  skipWhiteSpace(skip_new_lines = false) {
    if (skip_new_lines) while (/\s|\n|\r/.test(this.token)) this.advance();
    else while (/\s|\r/.test(this.token)) this.advance();
  }
  static parse: (input: string, options?: JSParserOptions) => Program = (
    input: string,
    options?: JSParserOptions
  ) => {
    return new JSParser().parse(input, options);
  };
}

JSParser.prototype.parseProgram = function () {
  this.advance(0);
  while (!this.EOF) this.program.push(this.parseNext());
  if (isValidExpression(this.program.last)) {
    this.program.push(this.MaybeExpressionStatement());
  }
  // ERROR: Brackets are not balanced.
  if (this.program.brackets > 0) {
    Errors.enc(
      "CLOSING_BRAC_EXPECTED",
      this.options.sourcefile,
      this.globalIndex
    );
  }
  this.program.loc.end = this.program.last?.loc.end ?? this.text.length;
  delete this.program.last;
  return this.program;
};
JSParser.prototype.parseNext = function () {
  this.skipWhiteSpace();
  if (this.token)
    switch (true) {
      case this.token + this.lookAhead === "//":
        this.handleComment("line");
        return;
      case this.token + this.lookAhead === "/*":
        this.handleComment("block");
        return;
      case stringMarkers.includes(this.token):
        return this.StringLiteral();
      case isNum(this.token):
        return this.NumericLiteral();
      case isValidIdentifierCharacter(this.token):
        return this.Identifier();
      case this.token === ".":
        return this.MemberExpression();
      case this.token === "(":
        return this.MaybeCallExpression();
      case this.token === ")":
        this.program.brackets--;
        this.advance();
        return;
      case this.token === ",":
        return this.Comma();
      case /\;|\n/.test(this.token):
        return this.MaybeExpressionStatement();
      default:
        Errors.enc(
          "JS_UNEXPECTED_TOKEN",
          this.options.sourcefile,
          this.globalIndex,
          {
            token: this.token,
          }
        );
    }
};
JSParser.prototype.handleComment = function (type: "block" | "line") {
  this.goto(this.commentReader(this.index, type));
};
JSParser.prototype.NumericLiteral = function () {
  let literal = new Literal(this.index);
  const count = () => {
    while (!this.EOF && isNum(this.token)) {
      literal.raw += this.token;
      this.advance();
    }
  };
  count();
  // Decimal numbers.
  if (this.token === ".") {
    if (isNum(this.lookAhead)) literal.raw += this.token;
    this.advance();
    count();
  }
  // ERROR: Identifier follows literal.
  if (isAlphabetic(this.token) || /"|'|`/.test(this.token))
    Errors.enc("ID_FOLLOWS_LITERAL", this.options.sourcefile, this.globalIndex);

  literal.value = parseFloat(literal.raw);
  literal.loc.end = this.index;
  return literal;
};
JSParser.prototype.StringLiteral = function () {
  let literal = new Literal(this.index);
  let str = this.stringReader(this.index);
  literal.raw += str.marker + str.value + str.marker;
  literal.value = literal.raw.slice(1, -1);
  literal.loc.end = str.end;
  this.goto(str.end + 1);
  return literal;
};
JSParser.prototype.Identifier = function () {
  let id = new Identifier(this.index);
  while (!this.EOF && isValidIdentifierCharacter(this.token)) {
    id.raw += this.token;
    this.advance();
  }
  id.name = id.raw;
  id.loc.end = this.index;
  if (id.name.length === 0)
    // ERROR: An identifier was expected but not found.
    Errors.enc(
      "IDENTIFIER_EXPECTED",
      this.options.sourcefile,
      this.globalIndex
    );
  this.skipWhiteSpace();
  if (isAlphaNumeric(this.token))
    // ERROR: An identifer or literal immediately follows another identifier.
    Errors.enc(
      "JS_UNEXP_KEYWORD_OR_IDENTIFIER",
      this.options.sourcefile,
      this.globalIndex
    );
  return id;
};
JSParser.prototype.MemberExpression = function () {
  const object = this.program.pop();
  // ERROR: Member Expression has no preceeding object.
  if (!object)
    Errors.enc(
      "JS_DEC_OR_STATEMENT_EXPECTED",
      this.options.sourcefile,
      this.globalIndex
    );
  this.advance();
  this.skipWhiteSpace(true);
  const memexp = new MemberExpression(object?.loc.start ?? 0);
  memexp.object = object;
  memexp.property = this.Identifier();
  if (
    memexp.object instanceof Literal &&
    !Number.isNaN(Number(memexp.object.value))
  )
    memexp.object.raw = `(${memexp.object.raw})`;
  memexp.raw = `${memexp.object?.raw}.${memexp.property.raw}`;
  memexp.loc.end = memexp.property.loc.end;
  return memexp;
};
JSParser.prototype.MaybeCallExpression = function () {
  let callee = this.program.last;
  if (!callee || !isValidExpression(callee)) {
    this.advance();
    this.program.brackets++;
    return this.parseNext();
  } else this.program.pop();
  let callexp = new CallExpression(callee.loc.start);
  callexp.callee = callee;
  const argStatement = this.parseArguments(")")[0];
  // ERROR: Argument is not a valid expression statement.
  if (argStatement && !(argStatement instanceof ExpressionStatment)) {
    Errors.enc(
      "JS_ARGUMENT_EXPRESSION_EXPECTED",
      this.options.sourcefile,
      argStatement.loc.start ?? this.globalIndex
    );
  } else {
    if (argStatement?.expression instanceof SequenceExpression) {
      argStatement.expression.expressions.forEach((expression) => {
        callexp.arguments.push(expression);
      });
    } else callexp.arguments.push(argStatement?.expression);
  }
  callexp.raw = `${callee.raw}(${callexp.arguments
    .map((args?: JSNodes) => args?.raw)
    .join(", ")})`;
  callexp.loc.end = this.index;
  // ERROR: Literal or identifier immediately follows function call.
  if (isAlphaNumeric(this.token) || stringMarkers.includes(this.token))
    Errors.enc("COMMA_EXPECTED", this.options.sourcefile, this.globalIndex);
  return callexp;
};
JSParser.prototype.parseArguments = function () {
  /** The raw text of the arguments. */
  var chunk = "";
  /** The stack of nested brackets. */
  var level = 1;
  this.advance(); // open argument list.
  while (!this.EOF && level) {
    if (this.token + this.lookAhead == "/*")
      this.goto(this.commentReader(this.index, "block"));
    if (this.token + this.lookAhead == "//")
      this.goto(this.commentReader(this.index, "line"));
    if (stringMarkers.includes(this.token)) {
      let str = this.stringReader(this.index);
      chunk += str.marker + str.value + str.marker;
      this.goto(str.end + 1);
    }
    if (this.token === "(") level++;
    if (this.token === ")") level--;
    if (level === 0) break;
    chunk += this.token;
    this.advance();
  }
  this.advance(); // close argument list.
  return JSParser.parse(chunk, {
    sourcefile: this.options.sourcefile,
    index: this.globalIndex,
  }).body;
};
JSParser.prototype.Comma = function () {
  // ERROR: Illegal comma.
  if (!(this.program.last && isValidExpression(this.program.last)))
    Errors.enc(
      "JS_DEC_OR_STATEMENT_EXPECTED",
      this.options.sourcefile,
      this.globalIndex
    );
  this.advance();
  this.skipWhiteSpace(true);
  return new Comma(this.index);
};
JSParser.prototype.MaybeExpressionStatement = function () {
  this.advance();
  if (this.program.last && isValidExpression(this.program.last)) {
    const expression = this.program.last;
    this.program.pop(); // Remove last expression from global scope.
    const expstat = new ExpressionStatment(expression.loc.start);
    expstat.loc.end = expression.loc.end;
    if (this.program.last instanceof Comma) {
      const expressions = [];
      while (this.program.last instanceof Comma) {
        this.program.pop(); // Remove comma.
        expressions.push(this.program.pop()); // Remove and store expression before comma.
      }
      // Create new sequence expression and return it as an expression statement.
      const start = expressions[expressions.length - 1]?.loc.start ?? 0;
      const seqexp = new SequenceExpression(start);
      seqexp.expressions = expressions.reverse().concat(expression);
      seqexp.raw = seqexp.expressions
        .map((exp?: JSNodes) => exp?.raw)
        .join(", ");
      seqexp.loc.end = expression.loc.end;
      expstat.expression = seqexp;
      expstat.loc.start = start;
      expstat.raw = seqexp.raw;
      expstat.loc.end = seqexp.loc.end;
    } else {
      expstat.expression = expression;
      expstat.raw = expression.raw;
    }
    return expstat;
  } else if (this.program.last instanceof Comma)
    // ERROR: Line ends with an illegal comma.
    Errors.enc(
      "JS_DEC_OR_STATEMENT_EXPECTED",
      this.options.sourcefile,
      this.globalIndex
    );
  else return;
};
const parser = new JSParser();
const text = readFileSync("test/src/index.js").toString();
const program = parser.parse(text, {
  sourcefile: "test/src/index.js",
  index: 0,
});
console.log(program);
writeFileSync("test/result.json", JSON.stringify(program));
