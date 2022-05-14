import {
  FontFaceRule,
  ImportRule,
  KeyframeRule,
  MediaRule,
  StyleRule,
  Stylesheet,
  SupportRule,
} from "../../../types";
/**
 * Returns formatted CSS text.
 * @param ast The Abstract Syntax tree generated for the CSS text.
 * @param indent The primary indentation.
 * @param subIndent The amount of space to indent for sub-levels in code.
 * @returns Fomatted CSS text.
 */
export function format(ast: Stylesheet, indent = "", subIndent = "  ") {
  let formatted = "";
  ast.rules.forEach((rule) => {
    if (rule instanceof StyleRule) {
      //   Style Rules.
      if (rule.selectors.length > 1)
        formatted += indent + rule.selectors.join(`,\n${indent}`);
      else formatted += indent + rule.selectors.join(", ");
      formatted += " {\n";
      Object.entries(rule.notation).forEach((entry) => {
        formatted += `${indent}${subIndent}${entry[0]}: ${entry[1]};\n`;
      });
      formatted += indent + "}\n";
    } else if (rule instanceof MediaRule) {
      // Media Rules.
      formatted +=
        indent +
        "@media " +
        (rule.params !== "" ? `${rule.params} ` : "") +
        "{\n";
      formatted += format(rule, indent + subIndent, subIndent);
      formatted += indent + "}\n";
    } else if (rule instanceof KeyframeRule) {
      // Keyframe Rules.
      formatted += indent + "@keyframes " + rule.identifier + " {\n";
      rule.frames.forEach((frame) => {
        formatted += `${indent + subIndent + frame.mark} {\n`;
        Object.entries(frame.notation).forEach((entry) => {
          formatted +=
            `${indent + subIndent + subIndent}` + `${entry[0]}: ${entry[1]};\n`;
        });
        formatted += indent + subIndent + "}\n";
      });
      formatted += indent + "}\n";
    } else if (rule instanceof SupportRule) {
      // Support Rules.
      formatted +=
        `${indent}@supports${rule.inverseQuery ? " not" : ""}` +
        `(${rule.query}) {\n`;
      formatted += format(rule, indent + subIndent, subIndent);
      formatted += indent + "}\n";
    } else if (rule instanceof FontFaceRule) {
      // Font face Rules.
      formatted += `${indent}@font-face {\n`;
      formatted += `${indent}${subIndent}font-family: ${rule.family};\n`;
      formatted += `${indent}${subIndent}src: ${rule.source};\n`;
      formatted += `${indent}}\n`;
    } else if (rule instanceof ImportRule) {
      // Import Rules.
      formatted += `${indent}@import url(${rule.href});\n`;
    }
  });
  return formatted;
}

export default format;
