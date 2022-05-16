import {
  isValidExpression,
  CallExpression,
  isChainExpression,
} from "../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.reparse = function (node, context) {
  if (isValidExpression(node)) {
    var pos = this.i;
    this.outerspace();
    switch (true) {
      case this.eat("//"):
      case this.eat("/*"):
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
        if (/\n/.test(this.text.slice(pos, this.i))) {
          this.belly.pop();
          this.i = pos;
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
      case this.match("of"):
        const { arr }: any = { ...this.contexts };
        if (!arr.includes("for_params"))
          this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");
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
      case this.eat("^"):
        return this.binaryExpression(node);
      case this.eat("?"):
        return this.conditionalExpression(node);
      case this.eat("="):
        return this.assignmentExpression(node);
      case this.text[this.i] === "{":
        if (this.contexts.top() === "super_class") {
          this.recede();
          return node;
        }
      case isValidIdentifierCharacter(this.text[this.i]):
      case /'|`|"/.test(this.text[this.i]):
      case isDigit(this.text[this.i]):
        // Check if the next expression is on a new line.
        if (/\n/.test(this.text.slice(pos, this.i))) {
          this.i = pos;
          return node;
        } else {
          this.raise("JS_UNEXP_KEYWORD_OR_IDENTIFIER");
        }
    }
    // Chain Expressions.
    if (
      isChainExpression(node) ||
      (node instanceof CallExpression && isChainExpression(node.callee))
    ) {
      return this.chainExpression(node);
    }
    // Terminated statements.
    if (this.text[this.i] === ";") return node;
  }
  if (node === undefined) this.raise("EXPRESSION_EXPECTED");
  return node;
};
