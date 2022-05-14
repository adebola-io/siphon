import { parserOptions } from ".";
import {
  ArrayExpression,
  AssignmentPattern,
  BlockStatement,
  BreakStatement,
  CallExpression,
  ChainExpression,
  ClassDeclaration,
  ClassExpression,
  Context,
  ContinueStatement,
  DoWhileStatement,
  EmptyStatement,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  Expression,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  ImportDeclaration,
  ImportExpression,
  ImportSpecifier,
  JSNode,
  JSXAttribute,
  JSXClosingElement,
  JSXElement,
  JSXExpressionContainer,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXOpeningElement,
  JSXText,
  LabeledStatement,
  Literal,
  MemberExpression,
  MethodDefinition,
  ObjectExpression,
  ObjectPattern,
  PrivateIdentifier,
  Program,
  Property,
  PropertyDefinition,
  RestElement,
  ReturnStatement,
  SpreadElement,
  Statement,
  Super,
  SwitchCase,
  SwitchStatement,
  TemplateLiteral,
  ThisExpression,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  WhileStatement,
} from "../../../../types";
import { parse_utils } from "./utils";

export class ezra_parse_internals extends parse_utils {
  parse!: (input: string, options: parserOptions, from?: number) => Program;
  group!: (context?: Context) => any;
  statement!: (context?: Context) => Statement | undefined;
  expression!: (type?: string) => JSNode;
  reparse!: (node: JSNode, context?: string) => any;
  identifier!: (allowKeyword?: boolean, allowHyphen?: boolean) => Identifier;
  numberLiteral!: () => Literal;
  stringLiteral!: () => Literal;
  booleanLiteral!: () => Literal;
  regexLiteral!: () => Literal;
  nullLiteral!: () => Literal;
  templateLiteral!: () => TemplateLiteral;
  memberExpression!: (object: JSNode) => JSNode;
  chainExpression!: (
    exp: MemberExpression | CallExpression | any
  ) => ChainExpression;
  thisExpression!: () => ThisExpression;
  callExpression!: (callee: JSNode) => JSNode;
  arguments!: () => any;
  newExpression!: () => JSNode;
  updateExpression!: (argument: JSNode, prefix?: boolean) => JSNode;
  unaryExpression!: () => JSNode;
  awaitExpression!: () => JSNode;
  logicalExpression!: (left: JSNode) => JSNode;
  binaryExpression!: (left: JSNode) => JSNode;
  conditionalExpression!: (test: JSNode) => JSNode;
  assignmentExpression!: (left: JSNode) => JSNode;
  sequenceExpression!: (left: JSNode) => JSNode;
  functionExpression!: (isAsync?: boolean) => JSNode;
  classExpression!: () => ClassExpression;
  maybeAsync!: () => Statement | undefined;
  maybeAsyncExpression!: () => Expression;
  super!: () => Super;
  importExpression!: () => ImportExpression;
  parameter!: () =>
    | Identifier
    | AssignmentPattern
    | RestElement
    | ObjectPattern;
  arrowFunctionExpression!: (params?: JSNode, startAt?: number) => JSNode;
  arrayExpression!: () => ArrayExpression;
  elements!: () => any;
  objectExpression!: () => ObjectExpression;
  property!: () => Property | SpreadElement;
  parameterize!: (params: any) => Array<JSNode>;
  emptyStatement!: () => EmptyStatement;
  blockStatement!: (eatComma?: boolean) => BlockStatement;
  tryExpressionStatement!: () => ExpressionStatement | undefined;
  ifStatement!: () => IfStatement;
  forStatement!: () => ForStatement | ForInStatement | ForOfStatement;
  forInStatement!: (start: number, params: any) => ForInStatement;
  whileStatement!: () => WhileStatement;
  doWhileStatement!: () => DoWhileStatement;
  switchStatement!: () => SwitchStatement;
  caseStatement!: (isDefault: boolean) => SwitchCase;
  returnStatement!: () => ReturnStatement;
  labeledStatement!: (label: Identifier) => LabeledStatement;
  breakStatement!: () => BreakStatement;
  throwStatement!: () => ThrowStatement;
  continueStatement!: () => ContinueStatement;
  tryStatement!: () => TryStatement;
  functionDeclaration!: () => FunctionDeclaration;
  variableDeclaration!: () => VariableDeclaration;
  declarator!: (kind: string) => any;
  classDeclaration!: () => ClassDeclaration;
  privateIdentifier!: () => PrivateIdentifier;
  definitionKey!: () => { key: any; isComputed: boolean };
  definition!: () => PropertyDefinition | MethodDefinition;
  importDeclaration!: () => ImportDeclaration;
  importSpecifier!: () => ImportSpecifier;
  exportDeclaration!: () =>
    | ExportNamedDeclaration
    | ExportDefaultDeclaration
    | ExportAllDeclaration;
  exportSpecifier!: () => ExportSpecifier;
  spreadElement!: () => SpreadElement;
  restElement!: () => RestElement;
  switchCases!: () => SwitchCase[];
  jsxElement!: (start: number) => JSXElement;
  jsxText!: () => JSXText;
  JSXReparse!: (node: any) => any;
  jsxOpeningElement!: (start: number) => JSXOpeningElement;
  jsxClosingElement!: (start: number) => JSXClosingElement;
  jsxIdentifier!: () => JSXMemberExpression | JSXNamespacedName | JSXIdentifier;
  jsxAttribute!: () => JSXAttribute | undefined;
  JSXMemberExpression!: (object: Identifier) => any;
  JSXNamespacedName!: (namespace: Identifier) => any;
  jsxExpressionContainer!: () => JSXExpressionContainer;
}
export var ezra = ezra_parse_internals.prototype;
ezra.parse = function (input, options, from = 0) {
  this.scope = new Program(0);
  this.text = input;
  this.next(0);
  this.contexts.push("global");
  this.options = options;
  this.j = this.from = from;
  while (!this.end) this.scope.push(this.statement());
  this.scope.loc.end = this.text.length;
  this.scope.sourceType = this.options.sourceType ?? "module";
  return this.scope;
};
