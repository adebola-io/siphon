import { PathLike, readFileSync } from "fs";
import Errors from "../../../errors";
import {
  declarators,
  isNum,
  operators,
  stringMarkers,
  trace,
} from "../../../utils";

export interface Token {
  type?: string;
  details?: any;
  raw?: string;
  start: number;
  end?: number;
}
/**
 * The parser takes the javscript file or text and constructs an Abstract Syntax Tree.
 */
class Parser {
  constructor(source: PathLike, type?: "file" | "text", j = 0) {
    this.parentIndex = j;
    if (type === "text") {
      this.sourceFile = "";
      this.srcText = source.toString();
    } else {
      this.sourceFile = source;
      this.srcText = readFileSync(source).toString();
    }
    this.tokens = [];
    this.createTokens();
  }
  createTokens() {
    let currentToken: Token = {
      raw: "",
      start: this.parentIndex + 1,
      end: 0,
    };
    const clear = (i: number) => {
      if (currentToken.raw !== "") {
        if (isNum(currentToken.raw)) {
          currentToken.type = "Number";
        } else if (
          currentToken.raw === "false" ||
          currentToken.raw === "true"
        ) {
          currentToken.type = "Boolean";
        } else currentToken.type = "Word";
        currentToken.end = i + this.parentIndex;
        this.tokens.push(currentToken);
      }
    };
    const startNew = (i: number) => {
      currentToken = {
        start: i + (this.srcText[i] === " " ? 2 : 0) + this.parentIndex,
        end: 0,
        raw: "",
      };
    };
    for (let i = 0; this.srcText[i]; i++) {
      switch (true) {
        // Comments.
        case this.srcText.slice(i, i + 2) === "/*":
          i += 2;
          while (this.srcText[i] && this.srcText.slice(i, i + 2) !== "*/") i++;
          startNew(i);
          break;
        case this.srcText.slice(i, i + 2) == "//":
          i += 2;
          while (this.srcText[i] && this.srcText[i] !== "\n") i++;
          startNew(i);
          break;
        // Strings.
        case stringMarkers.includes(this.srcText[i]):
          i = this.readStrings(i);
        case this.srcText[i] === "\r":
          break;
        // Operators.
        case operators._ignore4_.includes(this.srcText.slice(i, i + 4)):
          this.clearPreviousLine();
          clear(i);
          this.tokens.push({
            start: i + this.parentIndex,
            end: i + this.parentIndex + 2,
            raw: this.srcText.slice(i, i + 4),
          });
          i += 3;
          startNew(i + 5);
          break;
        case operators._ignore3_.includes(this.srcText.slice(i, i + 3)):
          this.clearPreviousLine();
        case operators._suceeding3_.includes(this.srcText.slice(i, i + 3)):
          clear(i);
          this.tokens.push({
            start: i + this.parentIndex,
            end: i + this.parentIndex + 2,
            raw: this.srcText.slice(i, i + 3),
          });
          i += 2;
          startNew(i + 4);
          break;
        case operators._ignore2_.includes(this.srcText.slice(i, i + 2)):
          this.clearPreviousLine();
        case operators._suceeding2_.includes(this.srcText.slice(i, i + 2)):
          clear(i);
          this.tokens.push({
            start: i + this.parentIndex + 1,
            end: i + this.parentIndex + 2,
            raw: this.srcText.slice(i, i + 2),
          });
          i++;
          startNew(i + 3);
          break;
        case this.srcText[i] === "/":
          if (this.tokens[this.tokens?.length - 1].type !== "Number") {
            i = this.readRegex(i);
            break;
          }
        case this.srcText[i] === "\n":
          clear(i);
          startNew(i + 1);
          if (
            ["\n", ";", undefined]
              .concat(
                operators._ignore1_,
                operators._ignore2_,
                operators._ignore3_,
                operators._ignore4_,
                operators._suceeding1_,
                operators._suceeding2_,
                operators._suceeding3_
              )
              .includes(this.tokens[this.tokens.length - 1]?.raw ?? "")
          ) {
            break;
          }
        case operators._ignore1_.includes(this.srcText[i]):
        case operators._preceeding1_.includes(this.srcText[i]):
          this.clearPreviousLine();
        case operators._suceeding1_.includes(this.srcText[i]):
          clear(i);
          this.tokens.push({
            start: i + this.parentIndex + 1,
            end: i + this.parentIndex + 1,
            raw: this.srcText[i],
          });
          startNew(i + 2);
          break;
        case this.srcText[i] === "(":
        case this.srcText[i] === "[":
          clear(i);
          i = this.readGroup(i);
          startNew(i);
          break;
        case this.srcText[i] === " ":
          clear(i);
          startNew(i + 2);
          break;
        default:
          currentToken.raw += this.srcText[i];
      }
    }
    clear(this.srcText.length);
    this.create();
  }
  clearPreviousLine() {
    if (this.tokens[this.tokens.length - 1]?.raw === "\n") {
      this.tokens.pop();
    }
  }
  create() {
    var newNode: Token;
    var previous: Token;
    var next: Token;
    // 18. Member Access.
    for (let a = 0; this.tokens[a]; a++) {
      if (this.tokens[a].raw === ".") {
        previous = this.tokens[a - 1];
        next = this.tokens[a + 1];
        newNode = {
          type: "MemberExpression",
          start: previous?.start,
          end: next?.end,
          raw: previous?.raw + "." + next?.raw,
          details: {
            object: previous,
            property: next,
          },
        };
        this.tokens.splice(a - 1, 3, newNode);
        a -= 2;
      } else if (
        this.tokens[a]?.type === "ArrScope" &&
        this.tokens[a - 1]?.type &&
        !declarators.includes(this.tokens[a - 1].raw ?? "")
      ) {
        previous = this.tokens[a - 1];
        newNode = {
          type: "MemberExpression",
          start: previous.start,
          end: this.tokens[a].end,
          raw: previous.raw + "" + this.tokens[a].raw,
          details: {
            object: previous,
            property: this.tokens[a].details.inner,
          },
        };
        this.tokens.splice(a - 1, 2, newNode);
        a--;
      }
    }
    // 18. New Operator, Function Calls & Optional Chains.
    for (let b = 0; this.tokens[b]; b++) {
      if (this.tokens[b].raw === "new" && this.tokens[b + 2].type === "Group") {
        next = this.tokens[b + 1];
        newNode = {
          type: "NewExpression",
          start: this.tokens[b].start,
          end: this.tokens[b + 2].end,
          raw: "new " + next.raw + this.tokens[b + 2].raw,
          details: {
            callee: next,
            arguments: this.tokens[b + 2].details.inner,
          },
        };
        this.tokens.splice(b, 3, newNode);
        b -= 3;
      } else if (this.tokens[b].raw === "new") {
        next = this.tokens[b + 1];
        newNode = {
          type: "NewExpression",
          start: this.tokens[b].start,
          end: next.end,
          raw: "new " + next.raw + "()",
          details: {
            callee: next,
            arguments: [],
          },
        };
        this.tokens.splice(b, 2, newNode);
        b -= 2;
      } else if (
        this.tokens[b].type === "Group" &&
        [
          "Word",
          "MemberExpression",
          "OptionalMemberExpression",
          "Group",
        ].includes(this.tokens[b - 1]?.type ?? "")
      ) {
        previous = this.tokens[b - 1];
        newNode = {
          type: "CallExpression",
          start: previous.start,
          end: this.tokens[b].end,
          raw: previous.raw + "" + this.tokens[b].raw,
          details: {
            callee: previous,
            arguments: this.tokens[b].details.inner,
          },
        };
        this.tokens.splice(b - 1, 2, newNode);
        b--;
      } else if (this.tokens[b].raw === "?.") {
        previous = this.tokens[b - 1];
        next = this.tokens[b + 1];
        newNode = {
          type: "OptionalMemberExpression",
          start: previous.start,
          end: next.end,
          raw: previous.raw + "?." + next.raw,
          details: {
            object: previous,
            property: next,
          },
        };
        this.tokens.splice(b - 1, 3, newNode);
        b -= 2;
      }
    }
    // 17. Postfix Increment and Decrement.
    for (let c = 0; this.tokens[c]; c++) {
      if (
        this.tokens[c - 1] &&
        ["++", "--"].includes(this.tokens[c].raw ?? "") &&
        ![";", "\n", "="].includes(this.tokens[c - 1].raw ?? "")
      ) {
        previous = this.tokens[c - 1];
        newNode = {
          type: "UpdateExpression",
          start: previous.start,
          end: this.tokens[c].end,
          raw: previous?.raw + "" + this.tokens[c].raw,
          details: {
            operator: this.tokens[c],
            argument: previous,
            postfix: true,
          },
        };
        this.tokens.splice(c - 1, 2, newNode);
        c--;
      }
    }
    // 16. Logical NOT.
    for (let d = 0; this.tokens[d]; d++) {
      switch (this.tokens[d].raw) {
        case "+":
        case "-":
          if (
            ["Number", "ArrType", "Group", "Word"].includes(
              this.tokens[d - 1].type ?? ""
            )
          )
            break;
        case "!":
        case "~":
          next = this.tokens[d + 1];
          newNode = {
            type: "Unary Expression",
            start: this.tokens[d].start,
            end: next.end,
            raw: this.tokens[d].raw + "" + next.raw,
            details: {
              operator: this.tokens[d],
              argument: next,
              prefix: true,
            },
          };
          this.tokens.splice(d, 2, newNode);
          d -= 2;
          break;
        case "++":
        case "--":
          next = this.tokens[d + 1];
          newNode = {
            type: "UpdateExpression",
            start: next.start,
            end: this.tokens[d].end,
            raw: this.tokens[d].raw + "" + next.raw,
            details: {
              operator: this.tokens[d],
              argument: next,
              prefix: true,
            },
          };
          this.tokens.splice(d, 2, newNode);
          d -= 2;
          break;
      }
    }
  }
  readRegex(i: number) {
    let regex: Token = {
      type: "Regex",
      start: i + this.parentIndex,
      raw: "",
    };
    i++;
    while (this.srcText[i] && this.srcText[i] !== "/") {
      if (
        this.srcText[i - 1] !== "\\" &&
        this.srcText[i] === "\\" &&
        this.srcText[i + 1] === "/"
      ) {
        regex.raw += "/";
        i += 2;
      } else if (this.srcText[i] === "\n") {
        Errors.enc(
          "UNTERMINATED_REGEX_LITERAL",
          this.sourceFile,
          regex.raw ? i - regex.raw.length - 1 : i - 1
        );
      } else regex.raw += this.srcText[i++];
    }
    if (i === this.srcText.length)
      Errors.enc("UNTERMINATED_REGEX_LITERAL", this.sourceFile, i - 1);
    regex.end = i + this.parentIndex;
    this.tokens.push(regex);
    return i + 1;
  }
  readStrings(i: number) {
    let str: Token = {
      type: "String",
      details: {
        string_type:
          this.srcText[i] === "`"
            ? "backtick"
            : this.srcText[i] === "'"
            ? "single-quote"
            : "double-quote",
      },
      start: i + this.parentIndex,
      raw: "",
      end: 0,
    };
    let marker = this.srcText[i++];
    while (this.srcText[i] && this.srcText[i] !== marker) {
      if (
        this.srcText[i - 1] !== "\\" &&
        this.srcText[i] === "\\" &&
        this.srcText[i + 1] === marker
      ) {
        str.raw += "\\" + marker;
        i += 2;
      } else if (this.srcText[i] === "\n" && marker !== "`") {
        Errors.enc("UNTERMINATED_STRING_LITERAL", this.sourceFile, i - 1);
      } else str.raw += this.srcText[i++];
    }
    if (i === this.srcText.length) {
      Errors.enc("UNTERMINATED_STRING_LITERAL", this.sourceFile, i - 2);
    }
    str.end = i + this.parentIndex;
    this.tokens.push(str);
    return i;
  }
  readGroup(i: number) {
    let group: Token = {
      type: this.srcText[i] === "(" ? "Group" : "ArrScope",
      start: i + this.parentIndex + 1,
      end: 0,
      details: {
        type: this.srcText[i],
        inner: [],
      },
      raw: "",
    };
    let level = 1;
    let markers = this.srcText[i] === "(" ? ["(", ")"] : ["[", "]"];
    i++;
    for (i; this.srcText[i] && level > 0; i++) {
      switch (true) {
        case this.srcText[i] === markers[0]:
          level++;
          group.raw += this.srcText[i];
          break;
        case this.srcText[i] === markers[1]:
          level--;
          if (level > 0) group.raw += this.srcText[i];
          break;
        default:
          group.raw += this.srcText[i];
      }
    }
    group.end = this.parentIndex + i;
    group.details.inner = new Parser(
      group.raw ? group.raw : "",
      "text",
      i - (group.raw?.length ?? 0) - 1
    ).tokens;
    group.raw = markers[0] + group.raw + markers[1];
    this.tokens.push(group);
    return i - 1;
  }
  parentIndex: number;
  sourceFile: PathLike;
  tokens: Array<Token>;
  srcText: string;
}

export default Parser;
