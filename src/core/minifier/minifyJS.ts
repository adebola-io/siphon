import { operators } from "../../utils";
import { Token } from "../parser/js/tokenizer";

const OPERATORS = operators._ignore1_.concat(
  operators._ignore2_,
  operators._ignore3_,
  operators._ignore4_,
  operators._preceeding1_,
  operators._suceeding1_,
  operators._suceeding2_,
  operators._suceeding3_
);

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
