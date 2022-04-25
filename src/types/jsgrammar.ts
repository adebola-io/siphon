export class JSNode {
  constructor(start: number) {
    this.loc = { start };
  }
  type = "Node";
  loc: {
    start: number;
    end?: number;
  };
}
export type JSNodes = Statement | Expression | Declaration | Literal;
export class Program extends JSNode {
  type = "Program";
  /** Add a node to the global scope of the program. */
  push(node?: JSNodes, options?: any) {
    if (node) {
      this.body.push(node);
      this.last = node;
    }
  }
  /** Remove a node from the global scope of the program.*/
  pop() {
    this.last = this.body[this.body.length - 2];
    return this.body.pop();
  }
  body: Array<JSNodes> = [];
  /** The last node appended to the body of the program. */
  last?: JSNodes;
}
export type Declaration = FunctionDeclaration | VariableDeclaration;

export type StatementContext =
  | "global"
  | "if"
  | "function"
  | "expression"
  | "for"
  | "while"
  | "switch";
// Statements.
export type Statement =
  | ExpressionStatment
  | IfStatement
  | WhileStatement
  | DoWhileStatement
  | SwitchStatement
  | EmptyStatement
  | ForStatement
  | BlockStatement;
export class ExpressionStatment extends JSNode {
  type = "ExpressionStatement";
  expression?: Expression | Identifier | Literal;
}
export class EmptyStatement extends JSNode {
  type = "EmptyStatement";
}
export class IfStatement extends JSNode {
  type = "IfStatement";
  test?: Expression | Literal | Identifier;
  consequent?: Statement | Expression | Declaration;
  alternate?: null | JSNodes = null;
}
export class WhileStatement extends JSNode {
  type = "WhileStatement";
  test?: Expression | Literal | Identifier;
  body?: Statement | Expression | Declaration;
}
export class Comma extends JSNode {
  type = "Comma";
  validNode = false;
}
export class DoWhileStatement extends JSNode {}
export class SwitchStatement extends JSNode {}
export class ForStatement extends JSNode {
  type = "ForStatement";
  init!: Expression;
  test!: Expression;
  update!: Expression;
  body?: Statement;
}
export class BlockStatement extends JSNode {
  type = "BlockStatement";
  body: Array<JSNodes> = [];
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
  | NewExpression
  | UnaryExpression
  | Literal;
export class NewExpression extends JSNode {
  type = "NewExpression";
  callee?: JSNodes;
  arguments: Array<JSNodes | undefined> = [];
}
export class UnaryExpression extends JSNode {
  type = "UnaryExpression";
  operator!: string;
  argument: JSNode | undefined;
  prefix: boolean = true;
}
export class AssignmentExpression extends JSNode {
  type = "AssignmentExpression";
  operator = "";
  left?: Expression | Literal | Identifier;
  right?: Expression | Literal | Identifier;
}
export class UpdateExpression extends JSNode {
  type = "UpdateExpression";
  operator!: string;
  prefix!: boolean;
  argument?: JSNodes;
}
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
  optional = false;
  computed = false;
}
export class ChainExpression extends JSNode {
  type = "ChainExpression";
  expression!: MemberExpression;
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
  arguments: Array<JSNode | undefined> = [];
}
export class VariableDeclaration extends JSNode {}
export class FunctionDeclaration extends JSNode {}
export class FunctionExpression extends JSNode {}
export class BinaryExpression extends JSNode {
  type = "BinaryExpression";
  operator = "";
  left?: Expression | Literal | Identifier;
  right?: Expression | Literal | Identifier;
}
export class LogicalExpression extends JSNode {
  type = "LogicalExpression";
  operator = "";
  left?: Expression | Literal | Identifier;
  right?: Expression | Literal | Identifier;
}
export class SequenceExpression extends JSNode {
  type = "SequenceExpression";
  expressions: Array<JSNodes | undefined> = [];
}
export class ArrowFunctionExpression extends JSNode {}
export class Literal extends JSNode {
  type = "Literal";
  kind?: "number" | "string" | "regex" | "boolean";
  value?: number | string | RegExp | boolean;
  raw = "";
  regex?: {
    pattern: string;
    flags: string;
  };
}
export class Identifier extends JSNode {
  type = "Identifier";
  name = "";
}
export function isValidExpression(node?: JSNodes) {
  return node
    ? node.type.endsWith("Expression") ||
        node.type.endsWith("Literal") ||
        node.type.endsWith("Identifier")
    : false;
}
export function isIdentifier(node?: JSNodes) {
  return node ? node instanceof Identifier : false;
}

export function isValidReference(node?: JSNodes) {
  return node
    ? node instanceof Identifier ||
        (node instanceof MemberExpression && !isOptional(node))
    : false;
}

export function isOptional(node?: MemberExpression) {
  if (node === undefined) return false;
  if (node.optional) return true;
  else if (node.object instanceof MemberExpression) {
    let obj: any = node;
    while (obj instanceof MemberExpression) {
      obj = obj.object;
      if (obj.optional) return true;
    }
    return false;
  } else return false;
}
