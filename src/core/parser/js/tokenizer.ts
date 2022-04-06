import { PathLike, readFileSync } from "fs";
import Errors from "../../../errors";
import { checkForEnd, reservedKeyWord, stringMarkers } from "../../../utils";

var variable = "";
/**
 * Resolves a javascript file into different tokens.
 */
class Tokenizer {
  constructor(source: PathLike) {
    this.src = readFileSync(source).toString();
    this.source = source;
    let token: string = "";
    const release = () => {
      if (token !== "") {
        this.tokens.push(token);
        token = "";
      }
    };
    for (let i = 0; this.src[i]; i++) {
      if (this.src.slice(i, i + 2) === "/*") i = this.readComments(i, "dbln");
      else if (this.src.slice(i, i + 2) === "//") {
        release();
        i = this.readComments(i, "sngln");
      } else if (stringMarkers.includes(this.src[i])) {
        release();
        i = this.readString(i);
      } else if (this.src[i] === "/") {
        release();
        i = this.readRegex(i);
      } else if (this.src[i] === "\n") {
        release();
        this.tokens.push("\n");
      } else if (this.src.slice(i, i + 2) === "||") {
        release();
        this.tokens.push("||");
        i++;
      } else if (this.src[i] === "|") {
        release();
        this.tokens.push("|");
      } else if (this.src.slice(i, i + 2) === "&&") {
        release();
        this.tokens.push("&&");
        i++;
      } else if (this.src[i] === "&") {
        release();
        this.tokens.push("&");
      } else if (this.src[i] === "^") {
        release();
        this.tokens.push("^");
      } else if (this.src.slice(i, i + 2) === "=>") {
        release();
        this.tokens.push("=>");
        i++;
      } else if (this.src[i] === "\r") {
      } else if (
        this.src[i] === " " ||
        this.src[i] === ";" ||
        this.src[i] === "." ||
        this.src[i] === "," ||
        this.src[i] === "(" ||
        this.src[i] === ")" ||
        this.src[i] === ":" ||
        this.src[i] === "{" ||
        this.src[i] === "}"
      ) {
        if (reservedKeyWord.includes(token.trim()))
          this.tokens.push(token.trim());
        else if (token !== "") this.tokens.push(token);

        token = "";
        switch (this.src[i]) {
          case ";":
          case ".":
          case ",":
          case "(":
          case ")":
          case "}":
          case "{":
          case ":":
            this.tokens.push(this.src[i]);
            break;
        }
      } else token += this.src[i];
    }
  }
  tokens: Array<string> = [];
  src = "";
  source: PathLike;
  readComments(indx: number, type: "dbln" | "sngln") {
    let count = indx;
    count += 2;
    if (type === "dbln") {
      variable += "/*";
      while (this.src[count] && this.src.slice(count, count + 2) !== "*/") {
        variable += this.src[count++];
      }
      variable += "*/";
    } else if (type === "sngln") {
      variable += "//";
      while (this.src[count] && this.src[count] !== "\n") {
        variable += this.src[count++];
      }
    }
    type === "dbln" ? (count += 2) : "";
    checkForEnd(this.src[count], this.source);
    this.tokens.push(variable);
    variable = "";
    return count;
  }
  readString(indx: number) {
    let count = indx;
    let marker = this.src[count++];
    while (this.src[count] && this.src[count] !== marker) {
      if (this.src[count] === "\n" && marker !== "`") {
        Errors.enc("UNTERMINATED_STRING_LITERAL", this.source, count);
      }
      if (
        this.src[count] === "\\" &&
        this.src[count + 1] === marker &&
        this.src[count - 1] !== "\\"
      ) {
        variable += "\\" + marker;
        count += 2;
      } else variable += this.src[count++];
    }
    checkForEnd(this.src[count], this.source);
    this.tokens.push(marker + variable + marker);
    variable = "";
    return count;
  }
  readRegex(indx: number) {
    let c = indx + 1;
    while (
      this.src[c] &&
      (this.src[c] !== "/" || (this.src[c] === "/" && this.src[c - 1] === "\\"))
    )
      variable += this.src[c++];
    checkForEnd(this.src[c], this.source);
    this.tokens.push("/" + variable + "/");
    variable = "";
    return c;
  }
}

export default Tokenizer;
