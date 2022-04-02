import minifier from "../minifier";
import { checkForEnd } from "../../core/parser/html/parseUtils";
/**
 * Formats CSS text.
 * @param srcText Source CSS text.
 * @param spacers The parent indent.
 * @param tab The specified indenting width.
 * @returns Formatted CSS text.
 */
function formatCSS(
  srcText: string,
  spacers: string = "",
  tab: string = "",
  isExternalSheet = false
): string {
  srcText = minifier.minifyCSS(srcText);
  let formattedText: string = "";
  let level = 0;
  let store = "";
  // starting on a newline.
  for (let i = 0; srcText[i]; i++) {
    if (srcText[i] === "(") {
      i++;
      while (srcText[i] && srcText[i] !== ")") {
        store += srcText[i++];
      }
      checkForEnd(srcText[i], "./");
      formattedText += "(" + store + ")";
      store = "";
    } else if (srcText[i] === ">") {
      formattedText += " > ";
    } else if (srcText[i + 1] === "{") {
      // entry of new class.
      level++;
      formattedText += srcText[i++];
      formattedText += " {" + "\n" + spacers;
      if (!isExternalSheet) formattedText += tab;
      for (let x = 0; x < level; x++) {
        formattedText += tab;
      }
    } else if (srcText[i] === "}") {
      // Add semicolons if not present.
      if (
        srcText[i - 1] !== ";" &&
        srcText[i - 1] !== "{" &&
        srcText[i - 1] !== "}"
      ) {
        formattedText += ";";
      }
      formattedText += "\n" + spacers;
      let x = 0;
      if (isExternalSheet) x = 1;
      for (x; x < level; x++) {
        formattedText += tab;
      }
      level--;
      formattedText += "}";
    } else if (srcText[i - 1] === "}" || srcText[i - 1] === undefined) {
      formattedText += "\n" + spacers;
      if (!isExternalSheet) formattedText += tab;
      for (let x = 0; x < level; x++) {
        formattedText += tab;
      }
      formattedText += srcText[i];
    } else if (srcText[i] === ";" && srcText[i + 1] !== "}") {
      if (srcText[i - 1] !== ";") {
        formattedText += ";" + "\n" + spacers;
        if (!isExternalSheet) formattedText += tab;
        for (let x = 0; x < level; x++) {
          formattedText += tab;
        }
      }
    } else formattedText += srcText[i];
  }
  // ending with a newline.
  formattedText += "\n";
  return formattedText;
  // return text
}

export default formatCSS;
