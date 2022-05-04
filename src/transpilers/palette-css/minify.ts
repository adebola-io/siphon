import {
  FontFaceRule,
  ImportRule,
  KeyframeRule,
  MediaRule,
  StyleRule,
  Stylesheet,
  SupportRule,
} from "../../types";

function minify(ast: Stylesheet) {
  let minified = "";
  ast.rules.forEach((rule) => {
    if (rule instanceof StyleRule) {
      let selectors = rule.selectors.join(",");
      if (!/'|"/.test(selectors))
        selectors = selectors.replace(/([\s]*)\>([\s]*)/g, ">");
      minified += `${selectors}{`;
      const entries = Object.entries(rule.notation);
      entries.forEach((entry: any[], index: number) => {
        minified +=
          `${entry[0]}:${entry[1].replace(/(\n|\r)+[\s]*/g, "")}` +
          (index === entries.length - 1 ? "" : ";");
      });
      minified += "}";
    } else if (rule instanceof MediaRule) {
      minified +=
        "@media" +
        (rule.params.startsWith("(") ? rule.params : " " + rule.params) +
        "{";
      minified += minify(rule) + "}";
    } else if (rule instanceof FontFaceRule) {
      minified += `@font-face{font-family:${rule.family};src:${rule.source}}`;
    } else if (rule instanceof ImportRule) {
      minified += `@import"${rule.href}";`;
    } else if (rule instanceof KeyframeRule) {
      minified += `@keyframes ${rule.identifier}{`;
      rule.frames.forEach((frame) => {
        minified += `${frame.mark.replace(/(\n|\r)+[\s]*/g, "")}{`;
        const entries = Object.entries(frame.notation);
        entries.forEach((entry, index) => {
          minified +=
            `${entry[0]}:${entry[1]}` +
            (index === entries.length - 1 ? "" : ";");
        });
        minified += "}";
      });
      minified += "}";
    } else if (rule instanceof SupportRule) {
      minified += `@supports${rule.inverseQuery ? " not" : ""}(${rule.query}){`;
      minified += `${minify(rule)}}`;
    }
  });
  return minified;
}

export default minify;
