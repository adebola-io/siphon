import { PathLike, readFileSync } from "fs";
import Errors from "../../../errors";
import { declarators, isNum, operators, stringMarkers } from "../../../utils";

export interface Token {
  type?: string;
  details?: any;
  raw: string;
  start: number;
  end?: number;
}
/**
 * The parser takes the javscript file or text and arranges its tokens based on standard precedence.
 */
class Parser {
  constructor(
    source: PathLike,
    type?: "file" | "text",
    j = 0,
    parent?: Token,
    sourceFile?: PathLike
  ) {
    if (!sourceFile) {
      sourceFile = source;
    }
    this.sourceFile = sourceFile;
    this.parentIndex = j;
    if (!parent) {
      parent = {
        type: "Program",
        start: 0,
        end: 0,
        raw: "",
      };
    }
    this.parent = parent;
    if (type === "text") {
      this.srcText = source.toString();
    } else {
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
        if (currentToken.raw && isNum(currentToken.raw)) {
          currentToken.type = "Number";
          currentToken.details = {};
          currentToken.details.value = parseFloat(currentToken.raw);
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
          clear(i);
          if (
            !["Number", "Group"].includes(
              this.tokens[this.tokens?.length - 1].type ?? ""
            )
          ) {
            i = this.readRegex(i);
            startNew(i + 1);
            break;
          }
          startNew(i + 1);
        case this.srcText[i] === "\n":
          clear(i);
          startNew(i + 1);
          if (
            ["\n", ";", "typeof", "delete", "await", "void", undefined]
              .concat(
                operators._ignore1_,
                operators._ignore2_,
                operators._ignore3_,
                operators._ignore4_,
                operators._suceeding1_,
                operators._suceeding2_,
                operators._suceeding3_
              )
              .includes(this.tokens[this.tokens.length - 1]?.raw)
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
        case this.srcText[i] === "{":
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
    this.setPrecedence();
  }
  clearPreviousLine() {
    if (this.tokens[this.tokens.length - 1]?.raw === "\n") {
      this.tokens.pop();
    }
  }
  setPrecedence() {
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
        !declarators.includes(this.tokens[a - 1].raw)
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

    // 18/17. New Operator, Function Calls & Optional Chains.
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
    for (let y = 0; this.tokens[y]; y++) {
      if (
        this.tokens[y].type === "CallExpression" &&
        this.tokens[y].details.callee.raw === "function"
      ) {
        console.log(9);
        if (this.tokens[y + 1].type !== "Block") {
          Errors.enc(
            "OPEN_CURLY_EXPECTED",
            this.sourceFile,
            this.tokens[y + 1].end
          );
        }
        previous = this.tokens[y - 1];
        next = this.tokens[y + 1];
        newNode = {
          type: "FunctionExpression",
          start: this.tokens[y].start,
          raw: this.tokens[y].raw + next.raw,
          end: next.end,
          details: {
            expression: true,
            async: previous?.raw === "async",
            params: this.tokens[y].details.arguments,
            body: next,
          },
        };
        this.tokens.splice(
          previous?.raw === "async" ? y - 1 : y,
          previous.raw === "async" ? 3 : 2,
          newNode
        );
        y -= 2;
      }
    }
    // 16. Postfix Increment and Decrement.
    for (let c = 0; this.tokens[c]; c++) {
      if (
        this.tokens[c - 1] &&
        ["++", "--"].includes(this.tokens[c].raw) &&
        ![";", "\n", "="].includes(this.tokens[c - 1].raw)
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
    // 15. Unary Expressions.
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
        case "typeof":
        case "void":
        case "delete":
          next = this.tokens[d + 1];
          newNode = {
            type: "UnaryExpression",
            start: this.tokens[d].start,
            end: next.end,
            raw:
              this.tokens[d].raw +
              ((this.tokens[d].raw?.length ?? 0) > 0 ? " " : "") +
              next.raw,
            details: {
              operator: this.tokens[d].raw,
              argument: next,
              prefix: true,
            },
          };
          this.tokens.splice(d, 2, newNode);
          d -= 2;
          break;
        case "await":
          next = this.tokens[d + 1];
          newNode = {
            type: "AwaitExpression",
            start: this.tokens[d].start,
            end: next.end,
            raw: this.tokens[d].raw + " " + next.raw,
            details: {
              argument: next,
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
    //  14. Exponentiation.
    for (let e = this.tokens.length - 1; this.tokens[e]; e--) {
      if (this.tokens[e].raw === "**") {
        previous = this.tokens[e - 1];
        next = this.tokens[e + 1];
        newNode = {
          type: "BinaryExpression",
          start: previous.start,
          end: next.end,
          raw: previous.raw + "**" + next.raw,
          details: {
            operator: "**",
            left: previous,
            right: next,
          },
        };
        this.tokens.splice(e - 1, 3, newNode);
      }
    }
    // 13.Multiplication, Division & Remainders.
    for (let f = 0; this.tokens[f]; f++) {
      switch (this.tokens[f].raw) {
        case "*":
          if (["function", "yield"].includes(this.tokens[f - 1].raw)) break;
        case "/":
        case "%":
          previous = this.tokens[f - 1];
          next = this.tokens[f + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[f].raw + " " + next.raw,
            details: {
              operator: this.tokens[f].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(f - 1, 3, newNode);
          f -= 2;
          break;
      }
    }
    // 12. Addition & Subtraction.
    for (let g = 0; this.tokens[g]; g++) {
      switch (this.tokens[g].raw) {
        case "+":
        case "-":
          previous = this.tokens[g - 1];
          next = this.tokens[g + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[g].raw + " " + next.raw,
            details: {
              operator: this.tokens[g].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(g - 1, 3, newNode);
          g -= 2;
          break;
      }
    }
    // 11. Bitwise Shift Left & Right.
    for (let h = 0; this.tokens[h]; h++) {
      switch (this.tokens[h].raw) {
        case ">>":
        case "<<":
        case ">>>":
          previous = this.tokens[h - 1];
          next = this.tokens[h + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[h].raw + " " + next.raw,
            details: {
              operator: this.tokens[h].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(h - 1, 3, newNode);
          h -= 2;
      }
    }
    // 10. Less than & Greater than.
    for (let i = 0; this.tokens[i]; i++) {
      switch (this.tokens[i].raw) {
        case ">":
        case ">=":
        case "<":
        case ">=":
        case "in":
        case "instanceof":
          previous = this.tokens[i - 1];
          next = this.tokens[i + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[i].raw + " " + next.raw,
            details: {
              operator: this.tokens[i].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(i - 1, 3, newNode);
          i -= 2;
          break;
      }
    }
    // 9. Equality & Inequality.
    for (let j = 0; this.tokens[j]; j++) {
      switch (this.tokens[j].raw) {
        case "==":
        case "===":
        case "!=":
        case "!==":
          previous = this.tokens[j - 1];
          next = this.tokens[j + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[j].raw + " " + next.raw,
            details: {
              operator: this.tokens[j].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(j - 1, 3, newNode);
          j -= 2;
          break;
      }
    }
    // 8. Bitwise AND.
    for (let k = 0; this.tokens[k]; k++) {
      switch (this.tokens[k].raw) {
        case "&":
          previous = this.tokens[k - 1];
          next = this.tokens[k + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[k].raw + " " + next.raw,
            details: {
              operator: this.tokens[k].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(k - 1, 3, newNode);
          k -= 2;
          break;
      }
    }
    // 7. Bitwise XOR.
    for (let l = 0; this.tokens[l]; l++) {
      switch (this.tokens[l].raw) {
        case "^":
          previous = this.tokens[l - 1];
          next = this.tokens[l + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[l].raw + " " + next.raw,
            details: {
              operator: this.tokens[l].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(l - 1, 3, newNode);
          l -= 2;
          break;
      }
    }
    // 6. Bitwise OR.
    for (let m = 0; this.tokens[m]; m++) {
      switch (this.tokens[m].raw) {
        case "|":
          previous = this.tokens[m - 1];
          next = this.tokens[m + 1];
          newNode = {
            type: "BinaryExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[m].raw + " " + next.raw,
            details: {
              operator: this.tokens[m].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(m - 1, 3, newNode);
          m -= 2;
          break;
      }
    }
    // Logical AND.
    for (let n = 0; this.tokens[n]; n++) {
      switch (this.tokens[n].raw) {
        case "&&":
          previous = this.tokens[n - 1];
          next = this.tokens[n + 1];
          newNode = {
            type: "LogicalExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[n].raw + " " + next.raw,
            details: {
              operator: this.tokens[n].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(n - 1, 3, newNode);
          n -= 2;
          break;
      }
    }
    // Logical OR & Nullish Coalescing.
    for (let o = 0; this.tokens[o]; o++) {
      switch (this.tokens[o].raw) {
        case "||":
        case "??":
          previous = this.tokens[o - 1];
          next = this.tokens[o + 1];
          newNode = {
            type: "LogicalExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[o].raw + " " + next.raw,
            details: {
              operator: this.tokens[o].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(o - 1, 3, newNode);
          o -= 2;
          break;
      }
    }
    // 3. Ternary Operations.
    for (let p = this.tokens.length - 1; this.tokens[p]; p--) {
      if (this.tokens[p].raw === "?" && this.tokens[p + 2].raw === ":") {
        previous = this.tokens[p - 1];
        next = this.tokens[p + 1];
        let next2 = this.tokens[p + 3];
        newNode = {
          type: "ConditionalExpression",
          start: previous.start,
          end: next2.end,
          raw: previous.raw + " ? " + next.raw + " : " + next2.raw,
          details: {
            test: previous,
            consequent: next,
            alternate: next2,
          },
        };
        this.tokens.splice(p - 1, 5, newNode);
      }
    }
    // 2. Assignment.
    for (let q = this.tokens.length - 1; this.tokens[q]; q--) {
      switch (this.tokens[q].raw) {
        case "=>":
          previous = this.tokens[q - 1];
          next = this.tokens[q + 1];
          newNode = {
            type: "ArrowFunctionExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[q].raw + " " + next.raw,
            details: {
              operator: this.tokens[q].raw,
              id: null,
              generator: false,
              async: previous.details?.callee?.raw === "async",
              params:
                previous.type === "Group" ? previous.details.inner : previous,
              body: next,
            },
          };
          this.tokens.splice(q - 1, 3, newNode);
          break;
        case "=":
        case "+=":
        case "-=":
        case "*=":
        case "**=":
        case "/=":
        case "%=":
        case "<<=":
        case ">>=":
        case ">>>=":
        case "&=":
        case "^=":
        case "|=":
        case "&&=":
        case "||=":
        case "??=":
          previous = this.tokens[q - 1];
          next = this.tokens[q + 1];
          newNode = {
            type: "AssignmentExpression",
            start: previous.start,
            end: next.end,
            raw: previous.raw + " " + this.tokens[q].raw + " " + next.raw,
            details: {
              operator: this.tokens[q].raw,
              left: previous,
              right: next,
            },
          };
          this.tokens.splice(q - 1, 3, newNode);
          break;
        case "yield":
          next = this.tokens[q + 1];
          if (this.tokens[q + 1].raw === "*") next = this.tokens[q + 2];
          newNode = {
            type: "YieldExpression",
            start: this.tokens[q].start,
            end: next.end,
            raw:
              this.tokens[q].raw +
              (this.tokens[q + 1].raw === "*" ? "*" : "") +
              " " +
              next.raw,
            details: {
              argument: next,
              delegate: this.tokens[q + 1].raw === "*",
            },
          };
          this.tokens.splice(
            q,
            this.tokens[q + 1].raw === "*" ? 3 : 2,
            newNode
          );
          break;
      }
    }
    // 1. Comma Sequence.
    for (let r = 0; this.tokens[r]; r++) {
      if (this.tokens[r].raw === ",") {
        previous = this.tokens[r - 1];
        next = this.tokens[r + 1];
        newNode = {
          type: "SequenceExpression",
          start: previous.start,
          end: next.end,
          raw: previous.raw + " , " + next.raw,
          details: {
            expressions:
              previous.type === "SequenceExpression"
                ? previous.details.expressions.concat([next])
                : [previous, next],
          },
        };
        this.tokens.splice(r - 1, 3, newNode);
        r -= 2;
      }
    }
    this.constructASTTree();
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
    str.raw = marker + str.raw + marker;
    str.end = i + this.parentIndex;
    this.tokens.push(str);
    return i;
  }
  readGroup(i: number) {
    let group: Token = {
      type:
        this.srcText[i] === "("
          ? "Group"
          : this.srcText[i] === "{"
          ? "Block"
          : "ArrScope",
      start: i + this.parentIndex + 1,
      end: 0,
      details: {
        type: this.srcText[i],
        inner: [],
      },
      raw: "",
    };
    let level = 1;
    let markers =
      this.srcText[i] === "("
        ? ["(", ")"]
        : this.srcText[i] === "{"
        ? ["{", "}"]
        : ["[", "]"];
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
      i - (group.raw?.length ?? 0) - 1,
      group,
      this.sourceFile
    ).tokens;
    group.raw = markers[0] + group.raw + markers[1];
    this.tokens.push(group);
    return i - 1;
  }
  constructASTTree() {
    var next: Token;
    var newNode: Token;
    var previous: Token;
    // Variable Declarations.
    for (let t = 0; this.tokens[t]; t++) {
      if (declarators.includes(this.tokens[t].raw)) {
        next = this.tokens[t + 1];
        if (this.parent.type === "ArrScope")
          Errors.enc(
            "EXPRESSION_EXPECTED",
            this.sourceFile,
            this.tokens[t].start
          );
        newNode = {
          type: "VariableDeclaration",
          start: this.tokens[t].start,
          end: next.end,
          raw: "",
          details: {
            kind: this.tokens[t].raw,
            declarations: [],
          },
        };
        if (next.type === "SequenceExpression") {
          next.details.expressions.forEach((exp: Token) => {
            if (exp.type === "AssignmentExpression") {
              if (exp.details.operator !== "=")
                Errors.enc("COMMA_EXPECTED", this.sourceFile, exp.start);
              else
                newNode.details.declarations.push({
                  type: "VariableDeclarator",
                  start: exp.start,
                  end: exp.end,
                  raw: exp.raw,
                  details: {
                    id: exp.details.left,
                    init: exp.details.right,
                  },
                });
            } else if (exp.type === "Word") {
              if (newNode.details.kind === "const")
                Errors.enc("EMPTY_CONST_DECLARATION", this.sourceFile, exp.end);
              else
                newNode.details.declarations.push({
                  type: "VariableDeclarator",
                  start: exp.start,
                  end: exp.end,
                  raw: exp.raw,
                  details: {
                    id: exp,
                    init: null,
                  },
                });
            }
          });
        } else if (next.type === "Word") {
          if (isNum(next.raw[0]))
            Errors.enc(
              "VARIABLE_DECLARATION_EXPECTED",
              this.sourceFile,
              next.start
            );
          else
            newNode.details.declarations.push({
              type: "VariableDeclarator",
              start: next.start,
              end: next.end,
              raw: next.raw,
              details: {
                id: next,
                init: null,
              },
            });
        } else if (next.type === "AssignmentExpression") {
          if (next.details.operator !== "=")
            Errors.enc("COMMA_EXPECTED", this.sourceFile, next.start);
          else
            newNode.details.declarations.push({
              type: "VariableDeclarator",
              start: next.start,
              end: next.end,
              raw: next.raw,
              details: {
                id: next.details.left,
                init: next.details.right,
              },
            });
        }
        this.tokens.splice(t, 2, newNode);
        t -= 2;
      }
    }
  }
  parent: Token;
  parentIndex: number;
  sourceFile: PathLike;
  tokens: Array<Token>;
  srcText: string;
}

export default Parser;