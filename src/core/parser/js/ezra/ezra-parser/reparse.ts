import {
  isOptional,
  isValidExpression,
  MemberExpression,
  NewExpression,
  CallExpression,
  isChainExpression,
} from "../../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../../utils";
import { ezra } from "./base";

ezra.reparse = function (node, context) {
  if (isValidExpression(node)) {
    var onnewLine = "";
    while (/\s|\n|\r/.test(this.char)) {
      onnewLine += this.char;
      this.next();
    }
    switch (true) {
      case this.eat("/*"):
      case this.eat("//"):
        this.skip();
        break;
      case this.eat(","):
        if (this.requireComma()) {
          this.backtrack();
          return node;
        } else return this.sequenceExpression(node);
      case this.eat("."):
      case this.eat("?."):
        if (context === "number") this.raise("ID_FOLLOWS_LITERAL");
      case this.eat("["):
        return this.memberExpression(node);
      case this.eat("("):
        if (this.contexts.top() === "new") {
          this.backtrack();
          return node;
        } else return this.callExpression(node);
      case this.eat("++"):
      case this.eat("--"):
        if (onnewLine.includes("\n")) {
          this.recede();
          return node;
        } else {
          return this.updateExpression(node, false);
        }
      case this.eat("=>"):
        return this.arrowFunctionExpression(node);
      case this.eat(">>="):
      case this.eat(">>>="):
      case this.eat("**="):
      case this.eat("<<="):
      case this.eat("&&="):
      case this.eat("||="):
      case this.eat("??="):
      case this.eat("*="):
      case this.eat("+="):
      case this.eat("-="):
      case this.eat("/="):
      case this.eat("%="):
      case this.eat("&="):
      case this.eat("^="):
      case this.eat("|="):
        return this.assignmentExpression(node);
      case this.eat("&&"):
      case this.eat("||"):
      case this.eat("??"):
        return this.logicalExpression(node);
      case this.eat("**"):
      case this.eat("*"):
      case this.eat("/"):
      case this.eat("%"):
      case this.eat("+"):
      case this.eat("-"):
      case this.eat(">>>"):
      case this.eat("<<"):
      case this.eat(">>"):
      case this.eat("<="):
      case this.eat(">="):
      case this.eat(">"):
      case this.eat("<"):
      case this.match("instanceof"):
      case this.match("in"):
      case this.eat("==="):
      case this.eat("!=="):
      case this.eat("=="):
      case this.eat("!="):
      case this.eat("&"):
      case this.eat("|"):
        return this.binaryExpression(node);
      case this.eat("?"):
        return this.conditionalExpression(node);
      case this.eat("="):
        return this.assignmentExpression(node);
      case this.eat("{"):
        if (this.contexts.top() === "super_class") {
          this.backtrack();
          return node;
        }
      case isValidIdentifierCharacter(this.char):
      case /'|`|"/.test(this.char):
      case isDigit(this.char):
        if (onnewLine.includes("\n")) {
          this.recede();
          return node;
        } else this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");
    }
    // Chain Expressions.
    if (
      isChainExpression(node) ||
      (node instanceof CallExpression && isChainExpression(node.callee))
    ) {
      return this.chainExpression(node);
    }
    // Terminated statements.
    if (this.char === ";") return node;
  }
  if (node === undefined) this.raise("EXPRESSION_EXPECTED");
  return node;
};
