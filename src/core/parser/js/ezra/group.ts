import { Stack } from "../../../../../structures";
import {
  ExpressionStatment,
  JSNode,
  Program,
  SequenceExpression,
} from "../../../../types";
import { counterpart } from "../../../../utils";
import { ezra } from "./base";

ezra.group = function (context = "expression") {
  let closure = this.belly.top(),
    scope2 = new Program(this.j),
    parentOps = this.operators,
    parentBelly = this.belly;
  this.contexts.push(context);
  this.outerspace();
  this.operators = new Stack();
  this.belly = new Stack();
  while (!this.end && this.char !== counterpart[closure]) {
    const statement = this.statement(context);
    scope2.push(statement);
    this.outerspace();
  }
  if (this.end) this.raise("EXPECTED", counterpart[closure]);
  else this.eat(counterpart[closure]);
  this.operators = parentOps;
  this.belly = parentBelly;
  this.contexts.pop();
  switch (context) {
    case "import":
    case "block":
    case "switch_block":
    case "for":
    case "object":
    case "parameters":
    case "call":
    case "array":
      return scope2.body;
    case "property":
      if (scope2.body.length > 1) this.raise("JS_COMMA_IN_COMPUTED_PROP");
      if (scope2.body.find((node) => node.type !== "ExpressionStatement")) {
        this.raise("EXPRESSION_EXPECTED");
      } else return scope2.body.map((expstat: any) => expstat.expression);
    case "function":
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
    case "expression":
      if (scope2.body[0] === undefined) {
        var mark = this.j - 2;
        this.outerspace();
        if (this.eat("=>"))
          return this.arrowFunctionExpression(undefined, mark);
      }
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
