import {
  isOptional,
  isValidExpression,
  MemberExpression,
} from "../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.reparse = function (node, context) {
  if (isValidExpression(node)) {
    this.innerspace(true);
    switch (true) {
      case this.eat("/*"):
      case this.eat("//"):
        this.skip();
        break;
      case this.char === ";":
        return node;
      case this.eat(","):
        return this.sequenceExpression(node);
      case this.eat("."):
      case this.eat("?."):
        if (context === "number") this.raise("ID_FOLLOWS_LITERAL");
      case this.eat("["):
        return this.memberExpression(node);
      case this.eat("("):
        if (context === "new") return node;
        return this.callExpression(node);
      case this.eat("++"):
      case this.eat("--"):
        if (this.newline) {
          this.recede();
          this.newline = false;
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
        return this.binaryExpression(node);
      case this.eat("?"):
        return this.conditionalExpression(node);
      case this.eat("="):
        return this.assignmentExpression(node);
      case isValidIdentifierCharacter(this.char):
      case /'|`|"/.test(this.char):
      case isDigit(this.char):
      case this.eat("{"):
        if (this.newline) {
          this.newline = false;
          this.recede();
          return node;
        } else this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");
    }
    if (node instanceof MemberExpression && isOptional(node)) {
      return this.chainExpression(node);
    }
  }
  if (node === undefined) {
    this.outerspace();
    if (this.eat("=>")) return this.arrowFunctionExpression();
    this.raise("EXPRESSION_EXPECTED");
  }
  return node;
};
