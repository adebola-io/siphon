import { operators } from "../../utils";
import { Token } from "../parser/js/tokenizer";
import { OPERATORS } from "../../utils";

/**
 * Minifies Javascript text.
 * @param tokens The array of tokens from the file to be minified.
 * @returns Minified text without new lines and unecessary formatting.
 */
function minifyJS(tokens: Token[]): string {
  let minified = "";
  for (let i = 0; tokens[i]; i++) {
    minified +=
      tokens[i].value +
      (OPERATORS.includes(tokens[i + 1]?.value) ||
      OPERATORS.includes(tokens[i].value)
        ? ""
        : " ");
  }
  return minified.trim();
}

export default minifyJS;
