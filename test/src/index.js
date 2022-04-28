import { Context, ExpressionStatment, Statement } from "../../../../types";
import { counterpart } from "../../../../utils";
import { ezra, ezra_internals } from "./base";

ezra.group = function (context = "expression") {
  let chunk = "",
    level = 1,
    closure = this.belly.top();
  while (!this.end && level > 0) {
    if (this.eat("//") || this.eat("/*")) this.skip();
    else if (/"|'|`/.test(this.char)) {
      let str = this.read(this.i);
      chunk += str.value;
      this.goto(str.end + 1);
    }
    if (this.char === closure) level++;
    else if (this.char === counterpart[closure]) level--;
    if (level === 0) {
      this.next();
      this.belly.pop();
      break;
    }
    chunk += this.char;
    this.next();
  }
  if (this.end && level > 0) {
    switch (closure) {
      case "(":
        this.raise("CLOSING_BRAC_EXPECTED");
      case "{":
        this.raise("CLOSING_CURL_EXPECTED");
      case "[":
        this.raise("CLOSING_SQUARE_BRAC_EXPECTED");
    }
  }
  var group_context = context;
  switch (context) {
    case "case":
    case "expression":
    case "if":
    case "switch":
    case "while":
    case "function":
      group_context = "expression";
  }
  var sub_program = new ezra_internals().parse(
    chunk,
    this.j - chunk.length,
    group_context
  );
  switch (context) {
    case "for":
    case "import":
    case "block":
    case "switch_block":
    case "object":
      return sub_program.body;
    case "call":
      return sub_program.body[0]?.expression;
    case "while":
    case "if":
    case "switch":
    case "expression":
    default:
      if (sub_program.body.length > 1) this.raise("EXPRESSION_EXPECTED");
      return sub_program.body[0]?.expression;
  }
};
