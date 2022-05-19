import {
  ArrowFunctionExpression,
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  ChainExpression,
  ClassDeclaration,
  ConditionalExpression,
  DoWhileStatement,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  ExpressionStatement,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  JSNode,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXText,
  Literal,
  LogicalExpression,
  MemberExpression,
  ObjectExpression,
  PrivateIdentifier,
  Program,
  Property,
  ReturnStatement,
  Super,
  SwitchStatement,
  TemplateLiteral,
  ThisExpression,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
} from "../../../../types";
import { Visitor } from "../../../structures";

export class Scope {
  constructor(node: BlockStatement | Program, previousScope?: Scope) {
    this.node = node;
    this.variables = new Map();
    this.functions = new Map();
    this.undeclared = new Map();
    this.ancestors = previousScope?.ancestors ?? [];
    this.descendants = [];
    if (previousScope) {
      this.ancestors.push(previousScope);
      previousScope?.descendants.push(this);
    }
  }
  level = 0;
  ancestors: Array<Scope>;
  descendants: Array<Scope>;
  functions: Map<string, Identifier>;
  node: BlockStatement | Program;
  variables: Map<string, Identifier>;
  undeclared: Map<string, { node: Identifier; hoisted?: Identifier }>;
}

export interface TraversalPath {
  parent: JSNode;
  scope: Scope;
  route: JSNode[];
}
export interface Config {
  enter?: (node: JSNode, path: TraversalPath) => void;
  Program?: (node: Program, path: TraversalPath) => void;
  FunctionDeclaration?: (
    node: FunctionDeclaration,
    path: TraversalPath
  ) => void;
  ArrowFunctionExpression?: (
    node: ArrowFunctionExpression,
    path: TraversalPath
  ) => void;
  VariableDeclaration?: (
    node: VariableDeclaration,
    path: TraversalPath
  ) => void;
  Identifier?: (node: Identifier, path: TraversalPath) => void;
  Literal?: (node: Literal, path: TraversalPath) => void;
  VariableDeclarator?: (node: VariableDeclarator, path: TraversalPath) => void;
  ClassDeclaration?: (node: ClassDeclaration, path: TraversalPath) => void;
  IfStatement?: (node: IfStatement, path: TraversalPath) => void;
  SwitchStatement?: (node: SwitchStatement, path: TraversalPath) => void;
  BlockStatement?: (node: BlockStatement, path: TraversalPath) => void;
  ExpressionStatement?: (
    node: ExpressionStatement,
    path: TraversalPath
  ) => void;
  ReturnStatement?: (node: ReturnStatement, path: TraversalPath) => void;
  ForStatement?: (node: ForStatement, path: TraversalPath) => void;
  WhileStatement?: (node: WhileStatement, path: TraversalPath) => void;
  DoWhileStatement?: (node: DoWhileStatement, path: TraversalPath) => void;
  TemplateLiteral?: (node: TemplateLiteral, path: TraversalPath) => void;
  PrivateIdentifier?: (node: PrivateIdentifier, path: TraversalPath) => void;
  ImportDeclaration?: (node: ImportDeclaration, path: TraversalPath) => void;
  ImportSpecifier?: (node: ImportSpecifier, path: TraversalPath) => void;
  ImportNamespaceSpecifier?: (
    node: ImportNamespaceSpecifier,
    path: TraversalPath
  ) => void;
  ImportDefaultSpecifier?: (
    node: ImportDefaultSpecifier,
    path: TraversalPath
  ) => void;
  ExportAllDeclaration?: (
    node: ExportAllDeclaration,
    path: TraversalPath
  ) => void;
  ExportNamedDeclaration?: (
    node: ExportNamedDeclaration,
    path: TraversalPath
  ) => void;
  ExportDefaultDeclaration?: (
    node: ExportDefaultDeclaration,
    path: TraversalPath
  ) => void;
  ExportSpecifier?: (node: ExportSpecifier, path: TraversalPath) => void;
  LogicalExpression?: (node: LogicalExpression, path: TraversalPath) => void;
  BinaryExpression?: (node: BinaryExpression, path: TraversalPath) => void;
  ThisExpression?: (node: ThisExpression, path: TraversalPath) => void;
  Super?: (node: Super, path: TraversalPath) => void;
  ConditionalExpression?: (
    node: ConditionalExpression,
    path: TraversalPath
  ) => void;
  MemberExpression?: (node: MemberExpression, path: TraversalPath) => void;
  ChainExpression?: (node: ChainExpression, path: TraversalPath) => void;
  Property?: (node: Property, path: TraversalPath) => void;
  CallExpression?: (node: CallExpression, path: TraversalPath) => void;
  AssignmentExpression?: (
    node: AssignmentExpression,
    path: TraversalPath
  ) => void;
  JSXElement?: (node: JSXElement, path: TraversalPath) => void;
  JSXText?: (node: JSXText, path: TraversalPath) => void;
  JSXFragment?: (node: JSXFragment, path: TraversalPath) => void;
  JSXExpressionContainer?: (
    node: JSXExpressionContainer,
    path: TraversalPath
  ) => void;
}
