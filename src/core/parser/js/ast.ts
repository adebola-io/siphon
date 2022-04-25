import { readFileSync, writeFileSync } from "fs";
import { Parser as AcornParser } from "acorn";
import Errors from "../../../errors";
import {
  BinaryExpression,
  CallExpression,
  Comma,
  ErrorTypes,
  ExpressionStatment,
  Identifier,
  isValidExpression,
  isValidReference,
  JSNodes,
  JSParserOptions,
  js_parser_defaults,
  Literal,
  MemberExpression,
  NewExpression,
  Program,
  SequenceExpression,
  UnaryExpression,
  UpdateExpression,
} from "../../../types";
import {
  isAlphabetic,
  isValidIdentifierCharacter,
  isNum,
  stringMarkers,
  isAlphaNumeric,
} from "../../../utils";

class JSParser {
  options!: JSParserOptions;
  text!: string;
  program!: Program;
  parseProgram!: () => Program;
  handleComment!: (type: "line" | "block") => void;
  parseNextToken!: () => JSNodes | undefined;
  NumericLiteral!: () => Literal;
  StringLiteral!: () => Literal;
  MaybeRegexLiteral!: () => Literal | undefined;
  BooleanLiteral!: (value: boolean) => Literal;
  Identifier!: () => Identifier;
  MemberExpression!: (is_optional?: boolean) => MemberExpression;
  MaybeComputedMemberExpression!: () => JSNodes | undefined;
  MaybeCallExpression!: () => JSNodes | undefined;
  NewExpression!: () => NewExpression;
  parseExpression!: (enclosure: string) => JSNodes | undefined;
  parseRight!: (pattern: RegExp) => JSNodes | undefined;
  MaybeExpressionStatement!: () => ExpressionStatment | undefined;
  MaybeBinaryExpression!: (
    operator: string
  ) => BinaryExpression | UnaryExpression;
  UpdateExpression!: (
    operator: string,
    fix?: "post" | "pre"
  ) => UpdateExpression;
  UnaryExpression!: (operator: string) => UnaryExpression;
  Comma!: () => Comma;
  /**
   * Arbitrarily read strings from the source text without advancing the token, then return the read string, the marker type and the ending index.
   * @param i The index to start reading from.
   */
  stringReader(i: number) {
    let marker = this.text[i++];
    /** The read string. */
    let value = "";
    while (this.text[i] && this.text[i] !== marker) {
      // ESCAPE SEQUENCE
      if (this.text[i] === "\\") {
        value += `\\${this.text[++i]}`;
        i++;
      } else {
        // ERROR: Newlines in non-template strings.
        if (this.text[i] === "\n" && marker !== "`") {
          Errors.enc(
            "UNTERMINATED_STRING_LITERAL",
            this.options.sourceFile,
            i + this.options.index
          );
        }
        value += this.text[i++];
      }
    }
    // ERROR: String is unterminated.
    if (!this.text[i]) {
      Errors.enc(
        "UNTERMINATED_STRING_LITERAL",
        this.options.sourceFile,
        this.options.index + i
      );
    }
    return { end: i, value: eval(marker + value + marker), marker };
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
        Errors.enc("UNCLOSED_BLOCK_COMMENT", this.options.sourceFile, i);
      i++;
    }
    return i + 1;
  }
  /**
   * Arbitrarily read Regex expressions without advancing the token, then return the read regex string and its ending index.
   * @param i The index to start reading from.
   */
  regexReader(i: number) {
    /** The raw value of the regex expression. */
    let value = "";
    let flags = "";
    i++;
    while (this.text[i] && !/\n|\//.test(this.text[i])) {
      // ESCAPE SEQUENCE
      if (this.text[i] === "\\") {
        value += `\\${this.text[++i]}`;
        i++;
      } else value += this.text[i++];
    }
    if (!this.text[i] || this.text[i] == "\n")
      // ERROR: Regex expression is not closed.
      Errors.enc(
        "UNTERMINATED_REGEX_LITERAL",
        this.options.sourceFile,
        i + this.options.index
      );
    i++; // close regex expression.
    while (isAlphabetic(this.text[i])) flags += this.text[i++]; // Read flags.
    // ERROR: Regex flag is invalid.
    if (
      isNum(this.text[i]) ||
      stringMarkers.concat("$", "_").includes(this.text[i])
    )
      Errors.enc(
        "JS_INVALID_REGEX_FLAG",
        this.options.sourceFile,
        i + this.options.index
      );
    return {
      end: i,
      value: eval("/" + value + "/")
        .toString()
        .slice(1, -1),
      flags,
    };
  }
  /**
   * Parses through a valid block of Javascript text and returns an Abstract Syntax tree representation of the text.
   * @param input The valid Javascript text.
   * @param options Parser Options.
   */
  parse(input: string, options?: JSParserOptions) {
    this.options = { ...this.options, ...options };
    this.globalIndex = this.options.index;
    this.text = input;
    this.program = new Program(0);
    return this.parseProgram();
  }
  /** The number of the current character. */
  index: number = 0;
  /** The real index in the overall source text. Helps in tracking during recusive parsing. */
  globalIndex: number = 0;
  /** The current character being parsed. */
  token!: string;
  /** The last eaten character. */
  eaten!: string;
  /** The next character to parse. */
  lookAhead!: string;
  /** The previously parsed character. */
  lookBehind!: string;
  /** Boolean check if tokens are still available. */
  EOF: boolean = false;
  /** Raise an error. */
  raise(error: ErrorTypes, options?: any) {
    Errors.enc(error, this.options.sourceFile, this.globalIndex, options);
  }
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
    if (!this.text[this.index]) this.EOF = true;
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
   * Checks if the next tokens in the stream match a particular string pattern, and consumes them in advance if true. It will match only if the pattern exists on its own and is not part of an identifier name.
   * ```js
   *  JSParser.predict('new');
   *
   *  JSParser.text = 'new'; // true
   *  JSParser.text = 'new('; // true
   *  JSParser.text = 'new_'; // false
   *  JSParser.text = 'newMethod' // false;
   * ```
   * @param pattern The pattern to predict.
   */
  predict(pattern: string) {
    if (
      this.text.slice(this.index, this.index + pattern.length) === pattern &&
      !isValidIdentifierCharacter(this.foresee(pattern.length))
    ) {
      this.advance(pattern.length);
      return true;
    } else return false;
  }
  /** Works relatively the same way as the `JSParser.predict()` function, but matches string patterns whether or not they are part of identifiers.
   * @param pattern The pattern to eat.
   */
  eat(pattern: string) {
    if (this.text.slice(this.index, this.index + pattern.length) === pattern) {
      this.advance(pattern.length);
      this.eaten = pattern;
      return true;
    } else return false;
  }
  /**
   * Ignore all rules and jump to a defined index in the source text.
   * @param index The index to jump to.
   */
  goto(index: number) {
    this.index = index;
    this.globalIndex = this.options.index + index;
    this.token = this.text[index];
    this.adjacents();
    if (!this.text[this.index]) this.EOF = true;
  }
  skipWhiteSpace(skip_new_lines = false) {
    if (skip_new_lines) while (/\s|\n|\r/.test(this.token)) this.advance();
    else while (/\s|\r/.test(this.token) && this.token !== "\n") this.advance();
  }
  static parse: (input: string, options?: JSParserOptions) => Program = (
    input: string,
    options?: JSParserOptions
  ) => {
    return new JSParser().parse(input, options);
  };
}
var jspp = JSParser.prototype;
jspp.parseProgram = function () {
  this.advance(0);
  const code = this.options.useCode;
  while (!this.EOF) this.program.push(this.parseNextToken(), { code });
  if (isValidExpression(this.program.last)) {
    this.program.push(this.MaybeExpressionStatement(), {
      code,
    });
  }
  // ERROR: Brackets are not balanced.
  if (this.program.brackets !== undefined && this.program.brackets > 0) {
    this.raise("CLOSING_BRAC_EXPECTED");
  }
  this.program.loc.end = this.text.length;
  if (!code) delete this.program.code;
  delete this.program.last;
  delete this.program.brackets;
  delete this.program.parenthesis;
  delete this.program.squareBracs;
  return this.program;
};
jspp.parseNextToken = function () {
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
      case this.token === "/":
        return this.MaybeRegexLiteral();
      case this.predict("true"):
        return this.BooleanLiteral(true);
      case this.predict("false"):
        return this.BooleanLiteral(false);
      case this.predict("new"):
        return this.NewExpression();
      case isValidIdentifierCharacter(this.token):
        return this.Identifier();
      case this.eat("?."):
        return this.MemberExpression(true);
      case this.eat("."):
        return this.MemberExpression();
      case this.token === "[":
        return this.MaybeComputedMemberExpression();
      case this.token === "]":
        this.advance();
        return;
      case this.token === "(":
        return this.MaybeCallExpression();
      case this.token === ")":
        this.program.brackets !== undefined ? this.program.brackets-- : 0;
        this.advance();
        return;
      case this.token === ",":
        return this.Comma();
      case /\;|\n/.test(this.token):
        return this.MaybeExpressionStatement();
      case this.eat("--"):
      case this.eat("++"):
        return this.UpdateExpression(this.eaten);
      case this.eat("!"):
      case this.eat("~"):
        return this.UnaryExpression(this.eaten);
      case this.eat("+"):
        return this.MaybeBinaryExpression(this.eaten);
      default:
        this.raise("JS_UNEXPECTED_TOKEN", {
          token: this.token,
        });
    }
};
jspp.handleComment = function (type: "block" | "line") {
  this.goto(this.commentReader(this.index, type));
};
jspp.NumericLiteral = function () {
  let literal = new Literal(this.globalIndex);
  literal.kind = "number";
  const count = () => {
    while (!this.EOF && isNum(this.token)) {
      literal.code += this.token;
      this.advance();
    }
  };
  count();
  // Decimal numbers.
  if (this.token === ".") {
    if (isNum(this.lookAhead)) literal.code += this.token;
    this.advance();
    count();
  }
  // ERROR: Identifier follows literal.
  if (isAlphabetic(this.token) || /"|'|`/.test(this.token))
    this.raise("ID_FOLLOWS_LITERAL");

  literal.value = parseFloat(literal.code ?? "");
  literal.loc.end = this.globalIndex;
  return literal;
};
jspp.StringLiteral = function () {
  let literal = new Literal(this.globalIndex);
  literal.kind = "string";
  let str = this.stringReader(this.index);
  literal.code += str.marker + str.value + str.marker;
  literal.value = literal.code?.slice(1, -1);
  literal.loc.end = str.end;
  this.goto(str.end + 1);
  return literal;
};
jspp.MaybeRegexLiteral = function () {
  if (isValidExpression(this.program.last)) {
    this.advance();
    return;
  }
  const regexp = new Literal(this.globalIndex);
  regexp.kind = "regex";
  let stream = this.regexReader(this.index);
  regexp.regex = { pattern: stream.value, flags: stream.flags };
  try {
    regexp.value = new RegExp(
      stream.value,
      stream.flags.length > 0 ? stream.flags : undefined
    );
  } catch (e: any) {
    // ERROR: Invalid Regex expression.
    Errors.custom(e.message, this.options.sourceFile, this.index);
  }
  regexp.loc.end = stream.end;
  regexp.code = `/${regexp.value}/`;
  this.goto(stream.end);
  return regexp;
};
jspp.BooleanLiteral = function (value: boolean) {
  let literal = new Literal(this.globalIndex);
  literal.kind = "boolean";
  literal.value = value;
  literal.code = value + "";
  return literal;
};
jspp.Identifier = function () {
  let id = new Identifier(this.globalIndex);
  // ERROR: Identifier name starts with a number.
  if (isNum(this.token)) this.raise("JS_INVALID_IDENTIFIER");
  while (!this.EOF && isValidIdentifierCharacter(this.token)) {
    id.name += this.token;
    this.advance();
  }
  id.code = id.name;
  id.loc.end = this.globalIndex;
  // ERROR: An identifier was expected but not found.
  if (id.name.length === 0) this.raise("IDENTIFIER_EXPECTED");
  this.skipWhiteSpace();
  if (this.token === "\n") console.log(true);
  // ERROR: An identifer or literal immediately follows another identifier.
  if (isAlphaNumeric(this.token)) this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");

  return id;
};
jspp.NewExpression = function () {
  const newexp = new NewExpression(this.globalIndex);
  this.skipWhiteSpace(true);
  newexp.callee = this.Identifier();
  this.skipWhiteSpace(true);
  if (this.token === "(") {
    const argStatement = this.parseExpression("()");
    if (argStatement && !(argStatement instanceof ExpressionStatment))
      this.raise("JS_ARGUMENT_EXPRESSION_EXPECTED");
    else {
      if (argStatement?.expression instanceof SequenceExpression)
        newexp.arguments = argStatement.expression.expressions;
      else newexp.arguments?.push(argStatement?.expression);
    }
  }
  newexp.code =
    `new ${newexp.callee?.code}` +
    `(${newexp.arguments?.map((args) => args?.code).join(", ")})`;
  newexp.loc.end = this.globalIndex;
  return newexp;
};
jspp.MemberExpression = function (is_optional = false) {
  const object = this.program.pop();
  // ERROR: Member Expression has no preceeding object.
  if (!object) this.raise("JS_DEC_OR_STATEMENT_EXPECTED");
  this.skipWhiteSpace(true);
  const memexp = new MemberExpression(object?.loc.start ?? 0);
  memexp.object = object;
  memexp.property = this.Identifier();
  if (memexp.object instanceof Literal && memexp.object.kind === "number")
    memexp.object.code = `(${memexp.object.code})`;
  if (is_optional) memexp.optional = true;
  memexp.code =
    `${memexp.object?.code}` +
    `${is_optional ? "?" : ""}` +
    `.${memexp.property?.code}`;
  memexp.loc.end = memexp.property?.loc.end;
  this.skipWhiteSpace();
  return memexp;
};
jspp.MaybeComputedMemberExpression = function () {
  let object = this.program.last;
  if (!object || !isValidExpression(object)) {
    this.advance();
    this.program.squareBracs !== undefined ? this.program.squareBracs++ : 0;
    return this.parseNextToken();
  } else this.program.pop();
  let arraymemexp = new MemberExpression(object.loc.start);
  arraymemexp.object = object;
  const propStatement = this.parseExpression("[]");
  // ERROR: Property is not a valid expression statement.
  if (propStatement && !(propStatement instanceof ExpressionStatment)) {
    this.raise("JS_ARGUMENT_EXPRESSION_EXPECTED");
  } else arraymemexp.property = propStatement?.expression;
  arraymemexp.code = `${object.code}[${arraymemexp.property?.code}]`;
  arraymemexp.loc.end = this.globalIndex;
  // ERROR: Literal or identifier immediately follows function call.
  if (isAlphaNumeric(this.token) || stringMarkers.includes(this.token))
    this.raise("SEMI_COLON_EXPECTED");
  arraymemexp.computed = true;
  return arraymemexp;
};
jspp.MaybeCallExpression = function () {
  let callee = this.program.last;
  if (!callee || !isValidExpression(callee)) {
    this.advance();
    this.program.brackets !== undefined ? this.program.brackets++ : 0;
    return this.parseNextToken();
  } else this.program.pop();
  let callexp = new CallExpression(callee.loc.start);
  callexp.callee = callee;
  const argStatement = this.parseExpression("()");
  // ERROR: Argument is not a valid expression statement.
  if (argStatement && !(argStatement instanceof ExpressionStatment)) {
    this.raise("JS_ARGUMENT_EXPRESSION_EXPECTED");
  } else {
    if (argStatement?.expression instanceof SequenceExpression) {
      argStatement.expression.expressions.forEach((expression) => {
        callexp.arguments.push(expression);
      });
    } else callexp.arguments.push(argStatement?.expression);
  }
  callexp.code = `${callee.code}(${callexp.arguments
    .map((args?: JSNodes) => args?.code)
    .join(", ")})`;
  callexp.loc.end = this.globalIndex;
  // ERROR: Literal or identifier immediately follows function call.
  if (isAlphaNumeric(this.token) || stringMarkers.includes(this.token))
    this.raise("COMMA_EXPECTED");
  return callexp;
};
jspp.parseExpression = function (enclosure: string) {
  /** The raw text to parse. */
  var chunk = "";
  /** The stack of nested brackets. */
  var level = 1;
  this.advance(); // open argument list.
  /** sub-index to keep counting during recursion */
  let index = this.index;
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
    if (this.token === enclosure[0]) level++;
    if (this.token === enclosure[1]) level--;
    if (level === 0) break;
    chunk += this.token;
    this.advance();
  }
  this.advance(); // close argument list.
  return JSParser.parse(chunk, { ...this.options, index }).body[0];
};
jspp.Comma = function () {
  // ERROR: Illegal comma.
  if (!(this.program.last && isValidExpression(this.program.last)))
    this.raise("JS_DEC_OR_STATEMENT_EXPECTED");
  this.advance();
  this.skipWhiteSpace(true);
  return new Comma(this.globalIndex);
};
jspp.MaybeExpressionStatement = function () {
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
      seqexp.code = seqexp.expressions
        .map((exp?: JSNodes) => exp?.code)
        .join(", ");
      seqexp.loc.end = expression.loc.end;
      expstat.expression = seqexp;
      expstat.loc.start = start;
      expstat.code = seqexp.code;
      expstat.loc.end = seqexp.loc.end;
    } else {
      expstat.expression = expression;
      expstat.code = expression.code;
    }
    return expstat;
  } else if (this.program.last instanceof Comma)
    // ERROR: Line ends with an illegal comma.
    this.raise("JS_DEC_OR_STATEMENT_EXPECTED");
  else return;
};
jspp.UpdateExpression = function (
  operator: string,
  fix: "post" | "pre" = "post"
) {
  const updexp = new UpdateExpression(this.globalIndex - 2);
  updexp.operator = operator;
  if (fix === "post") {
    if (!isValidExpression(this.program.last))
      return this.UpdateExpression(operator, "pre");
    // ERROR: Update argument is not valid.
    if (!isValidReference(this.program.last))
      this.raise("JS_INVALID_LHS_POFTIX");
    else {
      updexp.prefix = false;
      updexp.argument = this.program.last;
      updexp.code = updexp.argument?.code + operator;
      updexp.loc.start = updexp.argument?.loc.start ?? 0;
      updexp.loc.end = this.globalIndex;
      this.program.pop();
    }
  } else {
    this.skipWhiteSpace();
    updexp.prefix = true;
    updexp.argument = this.parseRight(/\(|\.|\[/);
    if (!isValidReference(updexp.argument)) this.raise("JS_INVALID_LHS_PREFIX");
    updexp.code = operator + updexp.argument?.code;
    updexp.loc.end = updexp.argument?.loc.end;
  }
  return updexp;
};
jspp.UnaryExpression = function (operator: string) {
  const unexp = new UnaryExpression(this.globalIndex - 1);
  this.skipWhiteSpace(true);
  if (/\(|\[/.test(this.token)) {
    var argument;
    if (this.token === "(") argument = this.parseExpression("()");
    else if (this.token === "[") argument = this.parseExpression("[]");
    if (argument instanceof ExpressionStatment)
      unexp.argument = argument.expression;
    else this.raise("EXPRESSION_EXPECTED");
  } else {
    unexp.argument = this.parseRight(/\(|\.|\[/);
    if (!isValidExpression(unexp.argument)) this.raise("EXPRESSION_EXPECTED");
  }
  unexp.code = operator + unexp.argument?.code;
  unexp.operator = operator;
  unexp.loc.end = unexp.argument?.loc.end;
  return unexp;
};
jspp.parseRight = function (pattern: RegExp) {
  // Right to left parse.
  var node = this.parseNextToken();
  if (node instanceof Identifier) {
    this.program.push(node);
    while (pattern.test(this.token)) this.program.push(this.parseNextToken());
    return this.program.pop();
  } else if (node instanceof Literal) {
    if (!this.options.useCode) delete node.code;
    return node;
  } else this.raise("IDENTIFIER_EXPECTED");
};
jspp.MaybeBinaryExpression = function (operator: string) {
  if (!isValidExpression(this.program.last)) {
    if (/\+|\-/.test(operator)) return this.UnaryExpression(operator);
    else this.raise("EXPRESSION_EXPECTED");
  }
  const binexp = new BinaryExpression(this.globalIndex);
  binexp.operator = operator;
  binexp.left = this.program.pop();
  this.skipWhiteSpace(true);
  if (!/\(|\[/.test(this.token)) binexp.right = this.Identifier(true);
  if (this.token === "(") binexp.right = this.parseExpression("()");
  else if (this.token === "[") binexp.right = this.parseExpression("[]");
  binexp.loc.end = binexp.right?.loc.end;
  return binexp;
};
const text = readFileSync("test/src/index.js").toString();

// const test = JSParser.parse(text, js_parser_defaults);
// console.log(test);
// writeFileSync("test/result.json", JSON.stringify(test));

const benchmark = AcornParser.parse(text, { ecmaVersion: 2020 });
console.log(benchmark);
writeFileSync("test/result.json", JSON.stringify(benchmark));
