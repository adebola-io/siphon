import Errors from "../../../errors";
import { siphonOptions } from "../../../types";
import { operators, stringMarkers, isNum } from "../../../utils";
export interface Token {
  token_type?: string;
  start: number;
  end: number;
  value: string;
}
/**
 * Splits a block of javascript text into an array of keywords, identifiers, literals, operators and space characters.
 * `NOTE` The tokenizer is trained to ignore all space characters that have no consequence on code syntax, so formatting is not a requirement for tokenizing.
 * @param text The source text.
 * @returns An array of tokens, with each token containing the start and end of the token in the text, the token value and optionally the type of token.
 */
function tokenize(text: string, options?: siphonOptions) {
  const tokens: Token[] = [];
  var token: Token = {
    start: 0,
    end: 0,
    value: "",
  };
  const precedents = [";"].concat(
    operators._ignore1_,
    operators._ignore2_,
    operators._ignore3_,
    operators._ignore4_,
    operators._suceeding1_,
    operators._suceeding2_,
    operators._suceeding3_,
    ["typeof", "delete", "await", "void"]
  );
  const pushToken = (t: number) => {
    if (token?.value.length > 0) {
      switch (true) {
        case isNum(token.value):
          token.token_type = "NumericLiteral";
          break;
      }
      token.end = t + token.value.length - 1;
      tokens.push(token);
      token = { start: t + 2, end: 0, value: "" };
    }
  };
  const clearPreviousLine = () => {
    if (tokens.slice(-1)[0]?.value === "\n") tokens.pop();
  };
  for (let a = 0; text[a]; a++) {
    switch (true) {
      case a === 0 && text.slice(a, a + 2) === "#!":
        options?.internalJS ? Errors.enc("SHEBANG_NOT_ALLOWED", "") : "";
        // Shebang comments.
        while (text[a] && text[a] !== "\n") {
          token.value += text[a++];
        }
        token.value += "\n";
        pushToken(a);
        break;
      case text.slice(a, a + 2) === "/*":
        // Block Comments.
        pushToken(a);
        a += 2;
        while (text[a] && text.slice(a, a + 2) !== "*/") a++;
        a += 2;
        while (text[a] && text[a + 1] === " ") a++;
        token.start = a + 2;
        break;
      case text.slice(a, a + 2) === "//":
        // Line Comments.
        pushToken(a);
        a += 2;
        while (text[a] && text[a] !== "\n") a++;
        token.start = a + 2;
        break;
      case stringMarkers.includes(text[a]):
        // Strings.
        pushToken(a);
        token.start = a;
        let marker = text[a++];
        token.value += marker;
        while (text[a] && text[a] !== marker) {
          if (
            text[a - 1] !== "\\" &&
            text[a] === "\\" &&
            text[a + 1] === marker
          ) {
            token.value += "\\" + marker;
            a += 2;
          } else if (text[a] === "\n" && marker !== "`") {
            Errors.enc("UNTERMINATED_STRING_LITERAL", "");
          } else token.value += text[a++];
        }
        if (!text[a]) throw new Error();
        token.value += marker;
        token.token_type = "StringLiteral";
        pushToken(a);
        break;
      case text[a] === "\r":
        break;
      case operators._ignore4_.includes(text.slice(a, a + 4)):
        pushToken(a);
        clearPreviousLine();
        tokens.push({
          start: a + 1,
          end: a + 4,
          value: text.slice(a, a + 4),
        });
        a += 4;
        token.start = a + 5;
        break;
      case operators._ignore3_.includes(text.slice(a, a + 3)):
        pushToken(a);
        clearPreviousLine();
        tokens.push({
          start: a + 1,
          end: a + 3,
          value: text.slice(a, a + 3),
        });
        a += 3;
        break;
      case operators._ignore2_.includes(text.slice(a, a + 2)):
        pushToken(a);
        clearPreviousLine();
        tokens.push({
          start: a + 1,
          end: a + 2,
          value: text.slice(a, a + 2),
        });
        a += 2;
        break;
      case operators._ignore1_.includes(text[a]):
      case operators._preceeding1_.includes(text[a]):
        pushToken(a);
        clearPreviousLine();
      case operators._suceeding1_.includes(text[a]):
        pushToken(a);
        tokens.push({
          start: a + 1,
          end: a + 2,
          value: text[a],
        });
        break;
      case text[a] === "/":
        // Regex.
        pushToken(a);
        if (!isNum(tokens.slice(-1)[0]?.value)) {
          token.start = a;
          token.value += text[a++];
          while (text[a] && text[a] !== "/") {
            if (
              text[a - 1] !== "\\" &&
              text[a] === "\\" &&
              text[a + 1] === "/"
            ) {
              token.value += "\\" + "/";
              a += 2;
            } else token.value += text[a++];
          }
          token.value += "/";
          pushToken(a);
        } else {
          tokens.push({ start: a + 1, end: a + 1, value: "/" });
          token.start = a + 2;
        }
        break;
      case text[a] === "\n":
        clearPreviousLine();
        if (!precedents.includes(tokens.slice(-1)[0]?.value)) {
          tokens.push({ start: a + 1, end: a + 1, value: "\n" });
          token.start = a + 2;
        }
        break;
      case text[a] === " ":
        pushToken(a);
        break;
      default:
        token.value += text[a];
    }
  }
  pushToken(text.length);
  return tokens;
}
export default tokenize;
