import { isSpaceCharac } from "../../../utils";

class AST {
  constructor(tokens: Array<string>) {
    this.tokens = tokens;
    this.tree = new Program(this.character);
    this.currentScope = this.tree;
    for (let i = 0; tokens[i]; i++) {
      if (tokens[i].startsWith("//") || tokens[i].startsWith("/*")) {
        let kind: "line" | "block" = tokens[i].startsWith("//")
          ? "line"
          : "block";
        let comment = new Comment(this.character, kind, tokens[i]);
        comment.end = this.character + tokens[i].length;
        this.tree.body.push(comment);
      } else if (
        tokens[i] === "var" ||
        tokens[i] === "const" ||
        tokens[i] === "let"
      ) {
        i = this.declareVariables(i, tokens[i]);
      }
      this.character += tokens[i].length;
      this.tree.end = this.character;
    }
  }
  tokens: Array<string>;
  character = 0;
  getExpression(i: number) {
    i++;
    let s = "";
    const expressionParser = () => {
      while (this.tokens[i] && this.tokens[i] !== ")") {
        this.character += this.tokens[i].length;
        s += this.tokens[i];
      }
    };

    return i;
  }
  declareVariables(i: number, type: string) {
    let decList = new DeclarationList(this.character, this.tokens[i]);
    decList.declarations = [];
    this.character += this.tokens[i].length;
    i++;
    const coreDeclarator = () => {
      let dec = new Declaration(this.character);
      dec.id = new Identifier(this.character, this.tokens[i]);
      do {
        this.character += this.tokens[i].length;
        i++;
      } while (isSpaceCharac(this.tokens[i]));
      if (this.tokens[i] === "=") {
        do {
          this.character += this.tokens[i].length;
          i++;
        } while (isSpaceCharac(this.tokens[i]));
        if (this.tokens[i] === "(") {
          i = this.getExpression(i);
        } else dec.init = new Literal(this.character, this.tokens[i]);
        decList.declarations?.push(dec);
        do {
          this.character += this.tokens[i].length;
          i++;
        } while (isSpaceCharac(this.tokens[i]));
        if (this.tokens[i] === ",") {
          do {
            this.character += this.tokens[i].length;
            i++;
          } while (isSpaceCharac(this.tokens[i]));
          coreDeclarator();
        }
      } else if (this.tokens[i] === ",") {
        decList.declarations?.push(dec);
        do {
          this.character += this.tokens[i].length;
          i++;
        } while (isSpaceCharac(this.tokens[i]));
        coreDeclarator();
      } else if (this.tokens[i] === ";") {
        decList.declarations?.push(dec);
        i++;
      }
    };
    coreDeclarator();
    this.currentScope.body.push(decList);
    return i;
  }
  tree: Program;
  currentScope: Program | BlockStatement;
}
class SyntaxTreeNode {
  constructor(start: number) {
    this.start = start;
  }
  start: number;
  end?: number;
}
class Program extends SyntaxTreeNode {
  type = "Program";
  body: Array<any> = [];
}
class Comment extends SyntaxTreeNode {
  constructor(start: number, commentType: "line" | "block", content: string) {
    super(start);
    this.kind = commentType;
    this.content = content;
  }
  type = "Comment";
  kind: "line" | "block";
  content: string;
}
class DeclarationList extends SyntaxTreeNode {
  constructor(start: number, kind: string) {
    super(start);
    this.kind = kind;
  }
  type = "DeclarationList";
  kind: string;
  declarations?: Declaration[];
}
class Declaration extends SyntaxTreeNode {
  type = "Declaration";
  id?: Identifier;
  init?: Literal | FunctionInit | ArrowFunctionInit;
}
class Identifier extends SyntaxTreeNode {
  constructor(start: number, value: string) {
    super(start);
    this.value = value;
  }
  type = "VariableIdentifier";
  value: string;
}
class Literal extends SyntaxTreeNode {
  constructor(start: number, value: string) {
    super(start);
    this.value = value;
  }
  value: string;
}
class FunctionInit extends SyntaxTreeNode {
  constructor(start: number, isAsync: boolean) {
    super(start);
    this.isAsync = isAsync;
  }
  params: DeclarationList | null = null;
  isAsync: boolean;
  body?: BlockStatement;
}
class ArrowFunctionInit extends SyntaxTreeNode {
  constructor(start: number, isAsync: boolean) {
    super(start);
    this.isAsync = isAsync;
  }
  params: DeclarationList | null = null;
  isAsync: boolean;
  body?: BlockStatement;
}
class ExpressionInit extends SyntaxTreeNode {}
class BlockStatement extends SyntaxTreeNode {
  body: Array<any> = [];
}
export default AST;
