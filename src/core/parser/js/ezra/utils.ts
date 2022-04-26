import { Stack } from "../../../../../structures";
import { Context, ErrorTypes, Program } from "../../../../types";
import {
  assoc,
  isAlphabetic,
  isDigit,
  isValidIdentifierCharacter,
  precedence,
} from "../../../../utils";

export class parse_utils {
  text!: string;
  /** The program node output. */
  scope!: Program;
  /** The current character being parsed. */
  char!: string;
  parseContext!: Context;
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
    // throw new Error();
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
      this.backtrack();
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
    return this.text.slice(this.i, this.i + ptn.length) === ptn &&
      !isValidIdentifierCharacter(this.peek(ptn.length))
      ? (this.next(ptn.length), this.belly.push(ptn), true)
      : false;
  }
  predict(ptn: string) {
    return this.text.slice(this.i, this.i + ptn.length) === ptn ? true : false;
  }
  /** Counts all the succeeding characters in the text stream that are numbers. */
  count() {
    let num = "";
    while (isDigit(this.char)) (num += this.char), this.next();
    return num;
  }
  /** Skips over suceeding comments in the text stream. */
  skip() {
    if (this.belly.top() === "/*") while (!this.eat("*/")) this.next();
    else {
      while (this.char !== "\n") this.next();
      this.next();
    }
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
      } else value += this.text[i++];
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
  /** Skip over new lines and/or character spaces in a local expression, declaration or scope. */
  innerspace(skip_new_line = false) {
    if (skip_new_line)
      while (/\s|\r|\n/.test(this.char))
        this.char === "\n" && !this.newline ? (this.newline = true) : 0,
          this.next();
    else while (/\s|\r/.test(this.char) && this.char !== "\n") this.next();
  }
  /** Skip over new lines and space characters in the global scope of the program. */
  outerspace() {
    while (/\s|\r|\n/.test(this.char)) this.next();
  }
}
