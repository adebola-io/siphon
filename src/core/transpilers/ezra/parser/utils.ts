import { parserOptions } from ".";
import { Stack } from "../../../structures";
import Errors from "../../../errors";
import { Context, ErrorTypes, Program } from "../../../../types";
import {
  assoc,
  isAlphabetic,
  isDigit,
  isHexDigit,
  isValidIdentifierCharacter,
  NEWLINE,
  EMPTY_SPACE,
  precedence,
  isBinaryDigit,
  isOctalDigit,
} from "../../../../utils";
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
    Errors.enc(message, this.options.sourceFile, at ?? this.i, {
      token: token ?? this.text[this.i],
    });
  }
  /**
   * Checks if the current operator being parsed has a lower precedence than the operator parsed before it.
   */
  lowerPrecedence() {
    // console.log(precedence[this.operators.top()], precedence[this.belly.top()]);
    let topOperator = this.operators.top(),
      bellyTop = this.belly.top();
    if (topOperator === undefined) return false;
    if (
      precedence[topOperator] > precedence[bellyTop] ||
      (precedence[topOperator] === precedence[bellyTop] &&
        assoc(topOperator) === "LR")
    ) {
      this.backtrack();
      return true;
    } else return false;
  }
  isNewCaseStatement() {
    return (
      this.predict("case") ||
      this.predict("default") ||
      this.text[this.i] === "}"
    );
  }
  /**
   * Checks if the next sequence of characters in the stream match a particular pattern.
   * If a match is found, it 'eats' the pattern up and advances the token to the next character.
   * @param ptn The string pattern to check for.
   */
  eat(ptn: string) {
    if (this.text.slice(this.i, this.i + ptn.length) !== ptn) return false;
    this.i += ptn.length;
    this.belly.push(ptn);
    return true;
  }
  /**
   * Cheks if the next sequence of characters in the stream match a particular pattern.
   * If a match is found, it advances to the nect character without eating the pattern.
   */
  taste(ptn: string) {
    if (this.text.slice(this.i, this.i + ptn.length) !== ptn) return false;
    this.i += ptn.length;
    return true;
  }
  peek(i = 1) {
    return this.text[this.i + i];
  }
  recede(i = 1) {
    this.i -= i;
  }
  next(i = 1) {
    this.i += i;
  }
  expect(ptn: string) {
    this.outerspace();
    if (this.text.slice(this.i, this.i + ptn.length) !== ptn)
      this.raise("JS_UNEXPECTED_TOKEN");
  }
  backtrack() {
    this.recede(this.belly.pop().length);
  }
  match(ptn: string) {
    if (
      ptn[0] === this.text[this.i] &&
      this.text.slice(this.i, this.i + ptn.length) === ptn &&
      !isValidIdentifierCharacter(this.peek(ptn.length))
    ) {
      this.i += ptn.length;
      this.belly.push(ptn);
      return true;
    } else return false;
  }
  /**
   * Check that the upcoming characters in the text stream follow a particular isolated pattern without advancing the token.
   * @param ptn The pattern to predict.
   */
  predict(ptn: string) {
    if (
      this.text.slice(this.i, this.i + ptn.length) === ptn &&
      !isValidIdentifierCharacter(this.peek(ptn.length))
    )
      return true;
    else return false;
  }
  /** Counts all the succeeding characters in the text stream that are numbers. */
  count(base = 10) {
    let num = "";
    switch (base) {
      case 8:
        while (isOctalDigit(this.text[this.i])) num += this.text[this.i++];
        break;
      case 2:
        while (isBinaryDigit(this.text[this.i])) num += this.text[this.i++];
        break;
      case 10:
        while (isDigit(this.text[this.i])) num += this.text[this.i++];
        break;
      case 16:
        while (isHexDigit(this.text[this.i])) num += this.text[this.i++];
    }
    return num;
  }
  /** Skips over suceeding comments in the text stream. */
  skip(contextual?: boolean) {
    if (this.belly.top() === "/*")
      while (!(this.eat("*/") || this.text[this.i] === undefined)) this.i++;
    else {
      while (!(this.text[this.i] === "\n" || this.text[this.i] === undefined))
        this.i++;
      contextual && this.text[this.i] === "\n" && !this.newline
        ? (this.newline = true)
        : 0,
        this.i++;
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
    while (this.text[i] !== undefined && !/\n|\//.test(this.text[i])) {
      // ESCAPE SEQUENCE
      if (this.text[i] === "\\") {
        value += `\\${this.text[++i]}`;
        i++;
      } else {
        if (this.text[i] === "[") {
          while (this.text[i] !== undefined && this.text[i] !== "]") {
            // ESCAPE SEQUENCE
            if (this.text[i] === "\\") {
              value += `\\${this.text[++i]}`;
              i++;
            } else value += this.text[i++];
          }
          if (this.text[i] === undefined) {
            this.raise("UNTERMINATED_REGEX_LITERAL");
          }
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
  glazeOverComments() {
    if (this.eat("//") || this.eat("/*")) this.skip(true);
  }
  /** Skip over new lines, space characters and comments in the global scope of the program. */
  outerspace() {
    while (EMPTY_SPACE.test(this.text[this.i])) this.i++;
    this.glazeOverComments();
    if (EMPTY_SPACE.test(this.text[this.i])) this.outerspace();
  }
}
