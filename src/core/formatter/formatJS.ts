import {
  declarators,
  isBracket,
  lastRealChar as lastSolidChar,
  splice,
} from "../../utils";
import { Token } from "../parser/js/tokenizer";

class Formatter {
  static format: (tokens: Token[], indent: string, tab: string) => string;
  format = Formatter.format;
}
/**
 * Formats Javascript text.
 * @param tokens Tokenized version of the file/text.
 * @param indent The beginning indent.
 * @param tab The sub-level indents.
 * @returns Formatted Text.
 */
Formatter.format = function (
  tokens: Token[],
  indent: string = "",
  tab: string = "  "
) {
  if (tokens.length === 0) return "";
  let formatted = indent;
  let level = 0;
  var previous: Token;
  var next: Token;
  var _vari: boolean;
  var _for: boolean;
  var _case: boolean;
  var _switch: boolean;
  tokens.forEach((token, index) => {
    previous = tokens[index - 1];
    next = tokens[index + 1];
    switch (true) {
      case token.value === "switch":
        _switch = true;
        formatted += "switch ";
        break;
      case token.value === "default":
        if (_switch && next?.value === ":") {
          formatted += "default";
          _case = true;
        } else formatted += "default ";
        break;
      case token.value === "case":
        formatted += "case ";
        _case = true;
        break;
      case token.value === "break":
        if (_case) {
          level--;
          formatted += "break";
          _case = false;
        } else formatted += "break";
        break;
      case token.token_type === "Keyword":
        formatted += token.value + " ";
        break;
      case token.value === ":":
        if (_case) {
          formatted += ":\n" + indent;
          level++;
          for (let a = 0; a < level; a++) formatted += tab;
        } else if (formatted[formatted.length - 1] === " ")
          formatted = formatted.slice(0, -1) + ": ";
        else formatted += ": ";
        break;
      case ["=", "===", "=>", "-", "/", "?"].includes(token.value):
        if (formatted[formatted.length - 1] !== " ") formatted += " ";
        formatted += token.value + " ";
        break;
      case token.value === "(":
        if (previous.value === "for") _for = true;
        formatted += "(";
        break;
      case token.value === ")":
        if (previous?.value !== ")" && !["(", ";"].includes(next?.value))
          formatted += ") ";
        else formatted += ")";
        break;
      case token.value === ";":
      case token.value === "\n":
        if (index === tokens.length - 1) break;
        if (tokens[index + 1]?.value !== "}" && !_for) {
          formatted += ";\n";
          formatted += indent;
          for (let a = 0; a < level; a++) formatted += tab;
        } else formatted += "; ";
        break;
      case token.value === "{":
        if (next?.value === "}") {
          console.log(9);
          formatted += "{";
          break;
        }
        if (!isBracket(previous.value) && previous.token_type !== "Keyword")
          formatted += " ";
        if (!declarators.includes(previous.value)) {
          formatted += "{\n";
          formatted += indent;
          level++;
          for (let a = 0; a < level; a++) formatted += tab;
        } else {
          _vari = true;
          formatted += "{ ";
        }
        break;
      case token.value === "}":
        if (previous?.value !== "{" && !_vari) {
          formatted += "\n" + indent;
          level--;
          for (let a = 0; a < level; a++) formatted += tab;
          formatted += "}";
        } else if (_vari) formatted += " }";
        else formatted += "}";
        break;
      default:
        formatted += token.value;
    }
  });
  var last = lastSolidChar(formatted);
  if (last.character !== ";") formatted = splice(formatted).at(last.index, ";");
  if (formatted.charAt(formatted.length - 1)) formatted += "\n";
  return formatted;
};
export default Formatter;
