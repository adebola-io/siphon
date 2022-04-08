import { PathLike } from "fs";
import Errors from "../../../errors";
import { Token } from "./tokenizer";

const addons = ["--", "++"];
const wait = ["===", "!==", "--", ")", "++"];
const continues = (value?: string) => {
  return value ? wait.includes(value) : false;
};

class SyntaxTree {
  constructor(tokens: Token[], sourceFile: PathLike) {
    this.sourceFile = sourceFile;
    this.input = tokens;
    this.value = tokens.map((token) => token.raw);
    this.result = new Program();
    this.currentScope = this.result.content;
    for (let i = 0; this.input[i]; i++) {
      switch (true) {
        case this.input[i].type === "LineComment":
        case this.input[i].type === "BlockComment":
          this.currentScope.body.push(this.input[i]);
          break;
        case this.value[i] === "const":
        case this.value[i] === "let":
        case this.value[i] === "var":
          i = this.declareVariables(i);
          break;
      }
    }
    this.result.end = this.input.slice(-1)[0].end;
  }
  skipSpaces(i: number) {
    do i++;
    while (this.value[i] === "\n");
    return i;
  }
  declareVariables(i: number) {
    let decList = new DeclarationList();
    const readID = (dec: Declaration) => {
      dec.start = this.input[i].start;
      switch (this.value[i]) {
        case "{":
        case "[":
          dec.destrutured = true;
          dec.start++;
          let marker = this.value[i] === "{" ? "}" : "]";
          dec.identifier += this.value[i++];
          while (this.value[i] && this.value[i] !== marker) {
            dec.identifier += this.value[i++];
          }
          dec.identifier += this.value[i++];
          i = this.skipSpaces(i);
          if (this.value[i] !== "=") {
            Errors.enc(
              "MISSING_DESC_INITIALIZER",
              this.sourceFile,
              this.input[i - 1].end
            );
          }
          break;
        default:
          dec.identifier += this.value[i];
          break;
      }
      i = this.skipSpaces(i);
      switch (this.value[i]) {
        case "=":
          readVariable(dec);
          break;
        case ",":
          decList.declarations.push(dec);
          declarer();
          break;
        case "\n":
          decList.declarations.push(dec);
          break;
      }
    };
    const readExp = () => {
      while (this.value[i] && this.value[i] !== ")") {
        if (this.value[i] === "(") readExp();
      }
    };
    const readVariable = (dec: Declaration) => {
      i = this.skipSpaces(i);
      switch (this.value[i]) {
        case "(":
          break;
      }
    };
    const declarer = () => {
      i = this.skipSpaces(i);
      let dec = new Declaration();
      readID(dec);
    };
    declarer();
    this.currentScope.body.push(decList);
    return i;
  }
  sourceFile: PathLike;
  currentScope: Block;
  value: Array<string | undefined>;
  input: Token[];
  result: Program;
}
class SyntaxNode {
  id = "SyntaxNode";
  start?: number;
  end?: number;
}
class Program extends SyntaxNode {
  constructor() {
    super();
    this.content = new Block();
  }
  id = "Program";
  start = 0;
  end? = 0;
  content: Block;
}
class Block extends SyntaxNode {
  id = "Block";
  body: Array<any> = [];
}
class DeclarationList extends SyntaxNode {
  id = "DeclarationList";
  declarations: Declaration[] = [];
}
class Declaration extends SyntaxNode {
  id = "Declaration";
  identifier: string = "";
  type?: "array" | "string" | "number" | "boolean" | "object" | "function";
  value?: string | FunctionInitializer | _Array;
  destrutured?: boolean;
}
class FunctionInitializer {
  id = "FunctionInitializer";
  type?: string;
}
class _Array {
  id = "Array";
}
export default SyntaxTree;
