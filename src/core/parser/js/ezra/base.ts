import {
  ArrayExpression,
  BlockStatement,
  BreakStatement,
  ChainExpression,
  Context,
  DoWhileStatement,
  EmptyStatement,
  ExpressionStatment,
  ForInStatement,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  JSNode,
  Literal,
  MemberExpression,
  ObjectExpression,
  Program,
  Property,
  ReturnStatement,
  SpreadElement,
  Statement,
  SwitchCase,
  SwitchStatement,
  ThisExpression,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  WhileStatement,
} from "../../../../types";
import { parse_utils } from "./utils";

export class ezra_internals extends parse_utils {
  parse!: (input: string, from?: number, context?: Context) => Program;
  group!: (context?: Context) => any;
  statement!: (context?: Context) => Statement | undefined;
  expression!: (type?: string) => JSNode;
  reparse!: (node: JSNode, context?: string) => any;
  identifier!: () => Identifier;
  numberLiteral!: () => Literal;
  stringLiteral!: () => Literal;
  booleanLiteral!: () => Literal;
  regexLiteral!: () => Literal;
  nullLiteral!: () => Literal;
  memberExpression!: (object: JSNode) => JSNode;
  chainExpression!: (exp: MemberExpression) => ChainExpression;
  thisExpression!: () => ThisExpression;
  callExpression!: (callee: JSNode) => JSNode;
  newExpression!: () => JSNode;
  updateExpression!: (argument: JSNode, prefix?: boolean) => JSNode;
  unaryExpression!: () => JSNode;
  logicalExpression!: (left: JSNode) => JSNode;
  binaryExpression!: (left: JSNode) => JSNode;
  conditionalExpression!: (test: JSNode) => JSNode;
  assignmentExpression!: (left: JSNode) => JSNode;
  sequenceExpression!: (left: JSNode) => JSNode;
  functionExpression!: (isAsync?: boolean) => JSNode;
  arrowFunctionExpression!: (params?: JSNode) => JSNode;
  arrayExpression!: () => ArrayExpression;
  objectExpression!: () => ObjectExpression;
  property!: () => Property;
  parameterize!: (params: any) => Array<JSNode>;
  emptyStatement!: () => EmptyStatement;
  blockStatement!: () => BlockStatement;
  tryExpressionStatement!: () => ExpressionStatment | undefined;
  ifStatement!: () => IfStatement;
  forStatement!: () => ForStatement | ForInStatement;
  forInStatement!: (start: number, params: any) => ForInStatement;
  whileStatement!: () => WhileStatement;
  doWhileStatement!: () => DoWhileStatement;
  switchStatement!: () => SwitchStatement;
  caseStatement!: (isDefault: boolean) => SwitchCase;
  returnStatement!: () => ReturnStatement;
  breakStatement!: () => BreakStatement;
  throwStatement!: () => ThrowStatement;
  tryStatement!: () => TryStatement;
  functionDeclaration!: () => FunctionDeclaration;
  variableDeclaration!: () => VariableDeclaration;
  declarators!: (expression: any, kind: string) => any;
  spreadElement!: () => SpreadElement;
  switchCases!: () => SwitchCase[];
}
export var ezra = ezra_internals.prototype;
ezra.parse = function (input, from = 0, context = "global") {
  this.parseContext = context;
  this.scope = new Program(0);
  this.text = input;
  this.next(0);
  this.j = this.from = from;
  while (!this.end) this.scope.push(this.statement(context));
  this.scope.loc.end = this.text.length;
  delete this.scope.last;
  return this.scope;
};
