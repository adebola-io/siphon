import {
  Context,
  ExpressionStatment,
  JSNode,
  Program,
  SequenceExpression,
  Statement,
} from "../../../../types";
import { counterpart } from "../../../../utils";
import { ezra, ezra_internals } from "./base";

ezra.group = function (context = "expression") {
  let closure = this.belly.top(),
    scope2 = new Program(this.j);
  this.outerspace();
  if (this.char !== counterpart[closure])
    while (!this.end && this.char !== counterpart[closure]) {
      const statement = this.statement(context);
      scope2.push(statement);
      this.outerspace();
    }
  if (this.end) this.raise("EXPECTED", counterpart[closure]);
  else this.eat(counterpart[closure]);
  switch (context) {
    case "import":
    case "block":
    case "switch_block":
    case "for":
    case "object":
      return scope2.body;
    case "call":
      let args: Array<JSNode | undefined> = [];
      if (scope2.body.length > 1) this.raise("EXPRESSION_EXPECTED");
      if (scope2.body[0] instanceof ExpressionStatment) {
        var expression = scope2.body[0].expression;
        if (expression instanceof SequenceExpression) {
          expression.expressions.forEach((childexp) => {
            args.push(childexp);
          });
        } else args.push(expression);
      } else if (scope2.body[0] !== undefined)
        this.raise("EXPRESSION_EXPECTED");
      return args;
    default:
      if (
        scope2.body.length > 1 ||
        !(scope2.body[0] instanceof ExpressionStatment)
      ) {
        this.raise("EXPRESSION_EXPECTED");
      } else return scope2.body[0].expression;
  }
  return scope2.body;
};
