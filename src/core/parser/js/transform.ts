// DEMO.
import { Token } from "./tokenizer";

/**
 * Perform a set of code transformations on Javascript tokens.
 * @param tokens The tokens to transform.
 * @param mode The mode of transformation.
 */
function transform(tokens: Token[], mode: "minification" | "compatibility") {
  // String Transformations.
  for (let i = 0; tokens[i]; i++) {
    switch (true) {
      case tokens[i].token_type === "StringLiteral" &&
        tokens[i].value[0] === "`":
        tokens[i].value =
          '"' +
          tokens[i].value
            .slice(1, -1)
            .replace(/"/g, '\\"')
            .replace(/\n/g, '"+"\\n"+"')
            .replace(/\r/g, "") +
          '"';
        break;
      // 'let' to more supported var.
      case tokens[i].value === "let" &&
        !(tokens[i - 1]?.value === ".") &&
        !(tokens[i + 1]?.value === ":"):
        tokens[i].value = "var";
        break;
    }
  }
  return tokens;
}

export default transform;
