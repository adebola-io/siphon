import Ezra from "../../..";

/**
 * Creates the node notation for a helper function that will handle the conversion of CSSStyleDeclaration objects to style strings.
 * The function will have the generated format:
 * ```js
 * function CSSify(o) {
 *  let str = "";
 *  Object.entries(o).forEach((e) => {
 *    if (e[1].length && !(e[0].slice(0, 2) === "--")) {
 *      let i = 0;
 *      while (i < e[0].length) {
 *        if (e[0][i].toUpperCase() === e[0][i])
 *          str += `-${e[0][i++].toLowerCase()}`;
 *        else str += e[0][i++];
 *      }
 *      str += `:${e[1]};`;
 *    } else if (e[0].startsWith("--"))
 *      str += `${e[0]}:${e[1]};`;
 *  });
 *  return str;
 * }
 * ```
 * @param functionName The name of the style function.
 */
function object_to_style(functionName: string) {
  const text = `function ${functionName}(object) {
    let styleString = "";
    Object.entries(object).forEach((entry) => {
      if (entry[1]?.length && !(entry[0].slice(0,2) === "--")) {
        let i = 0;
        while (i < entry[0].length) {
          if (entry[0][i].toUpperCase() === entry[0][i])
            styleString += '-' + entry[0][i++].toLowerCase();
          else styleString += entry[0][i++];
        }
        styleString += ':'+entry[1]+'; ';
      } else if (entry[0].slice(0, 2) === "--")
        styleString += entry[0]+':'+entry[1]+'; ';
    });
    return styleString;
  }`;
  return Ezra.parse(text).body[0];
}

export default object_to_style;
