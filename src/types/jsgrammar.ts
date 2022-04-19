export class JSNode {
  constructor(start: number) {
    this.loc = { start };
  }
  type = "Node";
  loc: {
    start: number;
    end?: number;
  };
  raw: string = "";
}
export type JSNodes = Statement | Expression | Declaration | Literal;
export class Program extends JSNode {
  type = "Program";
  add(node: JSNodes) {
    this.raw += node.raw;
    this.body.push(node);
    this.last = node;
  }
  pop() {
    this.raw = this.raw.slice(0, -(this.last?.raw.length ?? 0));
    this.last = this.body[this.body.length - 2];
    return this.body.pop();
  }
  body: Array<JSNodes> = [];
  last?: JSNodes;
}
export type Declaration = FunctionDeclaration | VariableDeclaration;

// Statements.
export type Statement =
  | ExpressionStatment
  | IfStatement
  | WhileStatement
  | DoWhileStatement
  | SwitchStatement
  | ForStatement
  | BlockStatement;
export class ExpressionStatment extends JSNode {
  type = "ExpressionStatement";
  expression?: Expression | Identifier | Literal;
}
export class IfStatement extends JSNode {
  type = "IfStatement";
  test?: Expression | Literal | Identifier;
  subsequent?: Statement | Expression | Declaration;
}
export class WhileStatement extends JSNode {
  type = "WhileStatement";
  test?: Expression | Literal | Identifier;
  body?: Statement | Expression | Declaration;
}
export class DoWhileStatement extends JSNode {}
export class SwitchStatement extends JSNode {}
export class ForStatement extends JSNode {}
export class BlockStatement extends JSNode {
  type = "BlockStatement";
  body: Array<JSNodes> = [];
  add(node: JSNodes) {
    this.raw += node.raw;
    this.body.push(node);
    this.last = node;
  }
  pop() {
    this.raw = this.raw.slice(0, -(this.last?.raw.length ?? 0));
    this.last = this.body[this.body.length - 2];
    return this.body.pop();
  }
  last?: JSNode;
}

// Expressions.
export type Expression =
  | FunctionExpression
  | AssignmentExpression
  | BinaryExpression
  | UpdateExpression
  | ConditionalExpression
  | LogicalExpression
  | SequenceExpression
  | MemberExpression
  | CallExpression
  | ArrowFunctionExpression
  | NewExpression;
export class NewExpression extends JSNode {
  type = "NewExpression";
  callee?: JSNodes;
  arguments?: Expression[];
}
export class AssignmentExpression extends JSNode {}
export class UpdateExpression extends JSNode {}
export class MemberExpression extends JSNode {
  type = "MemberExpression";
  object?:
    | ExpressionStatment
    | Identifier
    | Literal
    | MemberExpression
    | FunctionExpression
    | CallExpression;
  property?: ExpressionStatment | Identifier | CallExpression;
}
export class ConditionalExpression extends JSNode {
  type = "ConditionalExpression";
  test?: Expression | Literal | Identifier;
  consequent?: Expression | Literal | Identifier;
  alternate?: Expression | Literal | Identifier;
}
export class CallExpression extends JSNode {
  type = "CallExpression";
  callee?: Expression | Identifier;
  arguments?: Array<Expression | Literal>;
}
export class VariableDeclaration extends JSNode {}
export class FunctionDeclaration extends JSNode {}
export class FunctionExpression extends JSNode {}
export class BinaryExpression extends JSNode {
  type = "BinaryExpression";
  operator? = "";
  left?: Expression | Literal | Identifier;
  right?: Expression | Literal | Identifier;
}
export class LogicalExpression extends JSNode {}
export class SequenceExpression extends JSNode {
  type = "SequenceExpression";
  expressions: Expression[] = [];
}
export class ArrowFunctionExpression extends JSNode {}
export class Literal extends JSNode {
  type = "Literal";
  kind?: "number" | "string";
  value?: number;
}
export class Identifier extends JSNode {
  type = "Identifier";
  name = "";
}
