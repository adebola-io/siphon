import { parserOptions } from ".";
import { Stack } from "../../../../../../structures";
import Errors from "../../../../../errors";
import { Context, ErrorTypes, Program } from "../../../../../types";
import {
  assoc,
  isAlphabetic,
  isDigit,
  isHexDigit,
  isValidIdentifierCharacter,
  precedence,
} from "../../../../../utils";
var spreadcontexts: any = { array: true, expression: true, object: true },
  commacontexts: any = {
    array: true,
    object: true,
    property: true,
    parameters: true,
    call: true,
    declaration: true,
  };
export class parse_utils {
  text!: string;
  options!: parserOptions;
  /** The program node output. */
  scope!: Program;
  /** The current character being parsed. */
  char!: string;
  context!: Context;
  contexts = new Stack();
  allowSpread() {
    return spreadcontexts[this.contexts.top()];
  }
  requireComma() {
    return commacontexts[this.contexts.top()];
  }
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
  isNew = false;
  /**
   * Throws an error.
   * @param message The error type to raise.
   */
  raise(message: ErrorTypes, token?: string, at?: number) {
    Errors.enc(message, this.options.sourceFile, at ?? this.j, {
      token: token ?? this.char,
    });
  }
  /**
   * Checks if the current operator being parsed has a lower precedence than the operator parsed before it.
   */
  lowerPrecedence() {
    if (this.operators.top() === undefined) return false;
    if (
      precedence[this.operators.top()] > precedence[this.belly.top()] ||
      (precedence[this.operators.top()] === precedence[this.belly.top()] &&
        assoc(this.operators.top()) === "LR")
    ) {
      this.backtrack();
      return true;
    } else return false;
  }
  isNewCaseStatement() {
    return this.predict("case") || this.predict("default") || this.char === "}";
  }
  /**
   * Checks if the next sequence of characters in the stream match a particular pattern.
   * If a match is found, it 'eats' the pattern up and advances the token to the next character.
   * @param ptn The string pattern to check for.
   */
  eat(ptn: string) {
    return this.text.slice(this.i, this.i + ptn.length) === ptn
      ? (this.next(ptn.length), this.belly.push(ptn), true)
      : false;
  }
  remains() {
    this.end = this.char === undefined;
  }
  peek(i = 1) {
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
    this.innerspace(true);
    if (this.text.slice(this.i, this.i + ptn.length) !== ptn)
      this.raise("JS_UNEXPECTED_TOKEN");
  }
  backtrack() {
    this.recede(this.belly.pop().length);
  }
  match(ptn: string) {
    return ptn[0] === this.char &&
      this.text.slice(this.i, this.i + ptn.length) === ptn &&
      !isValidIdentifierCharacter(this.peek(ptn.length))
      ? (this.next(ptn.length), this.belly.push(ptn), true)
      : false;
  }
  /**
   * Check that the upcoming characters in the text stream follow a particular isolated pattern without advancing the token.
   * @param ptn The pattern to predict.
   */
  predict(ptn: string) {
    return this.text.slice(this.i, this.i + ptn.length) === ptn &&
      !isValidIdentifierCharacter(this.peek(ptn.length))
      ? true
      : false;
  }
  /** Counts all the succeeding characters in the text stream that are numbers. */
  count(base = 10) {
    let num = "";
    switch (base) {
      case 10:
        while (isDigit(this.char)) (num += this.char), this.next();
        break;
      case 16:
        while (isHexDigit(this.char)) (num += this.char), this.next();
    }
    return num;
  }
  /** Skips over suceeding comments in the text stream. */
  skip(contextual?: boolean) {
    if (this.belly.top() === "/*")
      while (!this.eat("*/")) {
        contextual && this.char === "\n" && !this.newline
          ? (this.newline = true)
          : 0,
          this.next();
      }
    else {
      while (this.char !== "\n") this.next();
      contextual && this.char === "\n" && !this.newline
        ? (this.newline = true)
        : 0,
        this.next();
    }
    this.belly.pop();
  }
  /**
   * Arbitrarily reads strings from the text stream without advancing the token character,
   * then returns the string, the quotation type and the ending index of the string in the text.
   * @param i The index to start reading from.
   */
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
      } else {
        if (this.text[i] === "[") {
          while (this.text[i] && this.text[i] !== "]") {
            // ESCAPE SEQUENCE
            if (this.text[i] === "\\") {
              value += `\\${this.text[++i]}`;
              i++;
            } else value += this.text[i++];
          }
          if (!this.text[i]) this.raise("UNTERMINATED_REGEX_LITERAL");
        }
        value += this.text[i++];
      }
    }
    if (!this.text[i] || this.text[i] == "\n")
      // ERROR: Regex expression is not closed.
      this.raise("UNTERMINATED_REGEX_LITERAL");
    i++; // close regex expression.
    while (isAlphabetic(this.text[i])) flags += this.text[i++]; // Read flags.
    // ERROR: Regex flag is invalid.
    if (isDigit(this.text[i]) || /\_|\$|\!|\#|\¬|\~|\@/.test(this.text[i]))
      this.raise("JS_INVALID_REGEX_FLAG");
    return {
      end: i,
      value,
      flags,
    };
  }
  glazeOverComments(contextual?: boolean) {
    if (this.eat("//") || this.eat("/*")) this.skip(true);
  }
  /** Skip over new lines and/or character spaces in a local expression, declaration or scope, where the position of the new line can affect the interpretation of expressions. */
  innerspace(skip_new_line = false) {
    if (skip_new_line)
      while (/\s|\r|\n/.test(this.char))
        this.char === "\n" && !this.newline ? (this.newline = true) : 0,
          this.next();
    else while (/\s|\r/.test(this.char) && this.char !== "\n") this.next();
    this.glazeOverComments(skip_new_line);
    if (/\s|\r|\n/.test(this.char)) this.innerspace(skip_new_line);
  }
  /** Skip over new lines, space characters and comments in the global scope of the program. */
  outerspace() {
    while (/\s|\r|\n/.test(this.char)) this.next();
    this.glazeOverComments();
    if (/\s|\r|\n/.test(this.char)) this.outerspace();
  }
}
