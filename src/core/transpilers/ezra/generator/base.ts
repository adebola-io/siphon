import { defaults, generatorOptions } from ".";
import {
  BlockStatement,
  Program,
  ExpressionStatement,
  JSNode,
} from "../../../../types";
import { gen_utils } from "./utils";

export class ezra_gen_internals extends gen_utils {
  generate!: (
    node: Program | BlockStatement,
    options?: generatorOptions
  ) => string;
  FunctionDeclaration!: Function;
  VariableDeclaration!: Function;
  ClassDeclaration!: Function;
  ClassBody!: Function;
  MethodDefinition!: Function;
  PropertyDefinition!: Function;
  Super!: Function;
  ImportDeclaration!: Function;
  ImportSpecifier!: Function;
  ImportDefaultSpecifier!: Function;
  ImportNamespaceSpecifier!: Function;
  ExportNamedDeclaration!: Function;
  ExportSpecifier!: Function;
  ExportDefaultDeclaration!: Function;
  ExportAllDeclaration!: Function;
  VariableDeclarator!: Function;
  BlockStatement!: Function;
  ExpressionStatement!: Function;
  LabeledStatement!: Function;
  EmptyStatement!: Function;
  IfStatement!: Function;
  WhileStatement!: Function;
  DoWhileStatement!: Function;
  SwitchStatement!: Function;
  SwitchCase!: Function;
  ForStatement!: Function;
  ForOfStatement!: Function;
  ForInStatement!: Function;
  BreakStatement!: Function;
  ContinueStatement!: Function;
  ReturnStatement!: Function;
  ThrowStatement!: Function;
  TryStatement!: Function;
  CatchClause!: Function;
  Identifier!: Function;
  PrivateIdentifier!: Function;
  Literal!: Function;
  TemplateLiteral!: Function;
  BinaryExpression!: Function;
  AssignmentExpression!: Function;
  NewExpression!: Function;
  ImportExpression!: Function;
  ClassExpression!: Function;
  UnaryExpression!: Function;
  ThisExpression!: Function;
  CallExpression!: Function;
  MemberExpression!: Function;
  ObjectExpression!: Function;
  ArrayExpression!: Function;
  Property!: Function;
  UpdateExpression!: Function;
  AwaitExpression!: Function;
  ChainExpression!: Function;
  ConditionalExpression!: Function;
  FunctionExpression!: Function;
  LogicalExpression!: Function;
  SequenceExpression!: Function;
  ArrowFunctionExpression!: Function;
  YieldExpression!: Function;
  AssignmentPattern!: Function;
  ArrayPattern!: Function;
  ObjectPattern!: Function;
  SpreadElement!: Function;
  RestElement!: Function;
  EmptyNode!: Function;
}
export var ezra = ezra_gen_internals.prototype;
ezra.generate = function (node, options) {
  this.options = { ...defaults, ...options };
  if (node.type === "Program") {
    this.indentLevel = this.options.indent ?? 0;
    for (let x = 0; x < this.indentLevel; x++) {
      this.write("  ");
      this.lineLength += 2;
    }
  }
  for (let i = 0; node.body[i]; i++) {
    this.renderTopLevel(node.body[i]);
    if (i !== node.body.length - 1 && node.body[i].type !== "EmptyNode")
      this.newline();
  }
  return this.state;
};
