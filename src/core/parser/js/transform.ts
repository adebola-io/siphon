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
    if (tokens[i].token_type === "String" && tokens[i].value[0] === "`") {
      tokens[i].value =
        '"' +
        tokens[i].value
          .slice(1, -1)
          .replace(/"/g, '\\"')
          .replace(/\n/g, '"+"\\n"+"')
          .replace(/\r/g, "") +
        '"';
    }
  }
  return tokens;
}

export default transform;
