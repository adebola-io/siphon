import { isDigit, isValidIdentifierCharacter } from "../utils";

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
export type JSNodes = Statement | Expression | Declaration;
export class Program extends JSNode {
  type = "Program";
  sourceType!: "module" | "script";
  /** Add a node to the global scope of the program. */
  push(node?: JSNodes) {
    if (node) this.body.push(node);
    // if (node instanceof ImportDeclaration) {
    //   this.imports?.push(node);
    // } else if (
    //   node instanceof ExportAllDeclaration ||
    //   node instanceof ExportNamedDeclaration ||
    //   node instanceof ExportDefaultDeclaration
    // ) {
    //   this.exports?.push(node);
    // }
  }
  // imports?: ImportDeclaration[] = [];
  // exports?: Array<
  //   ExportAllDeclaration | ExportNamedDeclaration | ExportDefaultDeclaration
  // > = [];
  /** Remove a node from the global scope of the program.*/
  pop() {
    // this.last = this.body[this.body.length - 2];
    return this.body.pop();
  }
  body: Array<JSNodes> = [];
  /** The last node appended to the body of the program. */
  // last?: JSNodes;
}
export class EmptyNode extends JSNode {
  type = "EmptyNode";
}
export class Literal extends JSNode {
  type = "Literal";
  kind?: "number" | "string" | "regex" | "boolean" | "bigint" | "null";
  value?: number | string | RegExp | boolean | null;
  raw = "";
  regex?: {
    pattern: string;
    flags: string;
  };
  bigint?: string;
}
export class TemplateLiteral extends JSNode {
  type = "TemplateLiteral";
  expressions!: Array<Expression>;
  quasis!: Array<TemplateElement>;
  body!: Array<JSNode>;
}
export class TemplateElement extends JSNode {
  type = "TemplateElement";
  value!: {
    raw: string;
    cooked: string;
  };
  tail!: boolean;
}
export class Identifier extends JSNode {
  type = "Identifier";
  name = "";
}
export class PrivateIdentifier extends JSNode {
  type = "PrivateIdentifier";
  name = "";
}
// Declarations.
export type Declaration =
  | FunctionDeclaration
  | VariableDeclaration
  | ImportDeclaration
  | ExportAllDeclaration
  | ExportDefaultDeclaration
  | ExportNamedDeclaration;
export class VariableDeclaration extends JSNode {
  type = "VariableDeclaration";
  kind?: string = "";
  declarations: any[] = [];
}
export class VariableDeclarator extends JSNode {
  type = "VariableDeclarator";
  id?: any;
  init?: Expression | null;
  in?: boolean;
}
export class FunctionDeclaration extends JSNode {
  type = "FunctionDeclaration";
  id!: Identifier;
  expression!: boolean;
  generator!: boolean;
  async!: boolean;
  params: Array<JSNode | undefined> = [];
  body!: BlockStatement;
}
export class ClassDeclaration extends JSNode {
  type = "ClassDeclaration";
  id!: Identifier;
  superClass: Expression | null = null;
  body!: ClassBody;
}
export class ClassBody extends JSNode {
  type = "ClassBody";
  body: Array<MethodDefinition | PropertyDefinition> = [];
}
export class MethodDefinition extends JSNode {
  type = "MethodDefinition";
  key!: Expression;
  value!: any;
  kind!: "constructor" | "method" | "get" | "set";
  computed!: boolean;
  static!: boolean;
}
export class PropertyDefinition extends JSNode {
  type = "PropertyDefinition";
  key!: Expression | PrivateIdentifier;
  value!: any;
  computed!: boolean;
  static!: boolean;
}
export class Super extends JSNode {
  type = "Super";
}
export class ImportDeclaration extends JSNode {
  type = "ImportDeclaration";
  specifiers: Array<
    ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
  > = [];
  source!: Literal;
}
export class ImportSpecifier extends JSNode {
  type = "ImportSpecifier";
  imported!: Identifier;
  local!: Identifier;
}
export class ImportDefaultSpecifier extends JSNode {
  type = "ImportDefaultSpecifier";
  local!: Identifier;
}
export class ImportNamespaceSpecifier extends JSNode {
  type = "ImportNamespaceSpecifier";
  local!: Identifier;
}
export class ExportNamedDeclaration extends JSNode {
  type = "ExportNamedDeclaration";
  declaration: Statement | undefined | null = null;
  specifiers: Array<ExportSpecifier> = [];
  source!: Literal | null;
}
export class ExportSpecifier extends JSNode {
  type = "ExportSpecifier";
  exported!: Identifier;
  local!: Identifier;
}
export class ExportDefaultDeclaration extends JSNode {
  type = "ExportDefaultDeclaration";
  declaration!: Expression;
}
export class ExportAllDeclaration extends JSNode {
  type = "ExportAllDeclaration";
  exported!: Identifier | null;
  source!: Literal;
}
export type Context =
  | "global"
  | "object"
  | "if"
  | "function"
  | "parameters"
  | "expression"
  | "for"
  | "for_params"
  | "new"
  | "block"
  | "property"
  | "call"
  | "case"
  | "while"
  | "switch"
  | "array"
  | "switch_block"
  | "class_body"
  | "import"
  | "export"
  | "JSX_attribute";
// Statements.
export type Statement =
  | ExpressionStatement
  | IfStatement
  | WhileStatement
  | DoWhileStatement
  | SwitchStatement
  | EmptyStatement
  | ForStatement
  | ForInStatement
  | BlockStatement
  | ReturnStatement
  | TryStatement
  | LabeledStatement
  | ThrowStatement;
export class ExpressionStatement extends JSNode {
  type = "ExpressionStatement";
  expression?: Expression | Identifier | Literal;
}
export class LabeledStatement extends JSNode {
  type = "LabeledStatement";
  label!: Identifier;
  body?: Statement;
}
export class EmptyStatement extends JSNode {
  type = "EmptyStatement";
}
export class IfStatement extends JSNode {
  type = "IfStatement";
  test?: Expression | Literal | Identifier;
  consequent?: Statement | Expression | Declaration;
  alternate?: null | JSNodes;
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
export class DoWhileStatement extends JSNode {
  type = "DoWhileStatement";
  test?: JSNodes;
  body?: ExpressionStatement | BlockStatement;
}
export class SwitchStatement extends JSNode {
  type = "SwitchStatement";
  discriminant?: Expression;
  cases!: Array<SwitchCase>;
}
export class SwitchCase extends JSNode {
  type = "SwitchCase";
  test?: Expression | null = null;
  consequent: Array<Statement | undefined> = [];
}
export class ForStatement extends JSNode {
  type = "ForStatement";
  init!: Expression;
  test!: Expression;
  update!: Expression;
  body?: Statement;
}
export class ForInStatement extends JSNode {
  type = "ForInStatement";
  left!: any;
  right!: any;
  body?: Statement;
}
export class ForOfStatement extends JSNode {
  type = "ForOfStatement";
  await = false;
  left: any;
  right: any;
  body?: Statement;
}
export class BreakStatement extends JSNode {
  type = "BreakStatement";
}
export class ContinueStatement extends JSNode {
  type = "ContinueStatement";
  label!: Identifier | null;
}
export class ReturnStatement extends JSNode {
  type = "ReturnStatement";
  argument?: Expression | null;
}
export class ThrowStatement extends JSNode {
  type = "ThrowStatement";
  argument?: Expression;
}
export class TryStatement extends JSNode {
  type = "TryStatement";
  block!: BlockStatement;
  handler!: CatchClause | null;
  finalizer!: BlockStatement | null;
}
export class CatchClause extends JSNode {
  type = "CatchClause";
  param!: any;
  body!: BlockStatement;
}
export class BlockStatement extends JSNode {
  type = "BlockStatement";
  body: Array<JSNodes> = [];
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
  | FunctionExpression
  | ArrayExpression
  | AwaitExpression
  | NewExpression
  | ImportExpression
  | UnaryExpression
  | ThisExpression
  | ClassExpression
  | JSXElement
  | Literal;
export class NewExpression extends JSNode {
  type = "NewExpression";
  callee!: JSNodes;
  arguments!: Array<JSNodes | undefined>;
}
export class ThisExpression extends JSNode {
  type = "ThisExpression";
}
export class ImportExpression extends JSNode {
  type = "ImportExpression";
  source!: any;
}
export class ClassExpression extends JSNode {
  type = "ClassExpression";
  id: Identifier | null = null;
  superClass: Expression | null = null;
  body!: ClassBody;
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
export class ArrayExpression extends JSNode {
  type = "ArrayExpression";
  elements!: Expression[];
}
export class ObjectExpression extends JSNode {
  type = "ObjectExpression";
  properties!: Property[];
}
export class Property extends JSNode {
  type = "Property";
  kind = "init";
  key!: Identifier | Literal;
  value!: Expression;
  method = false;
  shorthand = false;
  computed = false;
}
export class UpdateExpression extends JSNode {
  type = "UpdateExpression";
  operator!: string;
  prefix!: boolean;
  argument?: JSNodes;
}
export class AwaitExpression extends JSNode {
  type = "AwaitExpression";
  argument?: Expression;
}
export class MemberExpression extends JSNode {
  type = "MemberExpression";
  object?:
    | ExpressionStatement
    | Identifier
    | Literal
    | MemberExpression
    | FunctionExpression
    | CallExpression;
  property?: ExpressionStatement | Identifier | CallExpression;
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
  arguments!: Array<JSNode | undefined>;
}
export class FunctionExpression extends JSNode {
  type = "FunctionExpression";
  id!: Identifier | null;
  expression!: boolean;
  generator!: boolean;
  async!: boolean;
  params!: Array<JSNode | undefined>;
  body!: BlockStatement;
}
export class YieldExpression extends JSNode {
  type = 'YieldExpression';
  delegate!: boolean;
  argument!: Expression;
}
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
export class ArrowFunctionExpression extends JSNode {
  type = "ArrowFunctionExpression";
  id: Identifier | null = null;
  expression: boolean = false;
  params: Array<JSNode | undefined> = [];
  generator: boolean = false;
  async: boolean = false;
  body!: Expression | BlockStatement;
}
export class AssignmentPattern extends JSNode {
  type = "AssignmentPattern";
  left!: Identifier;
  right!: Expression;
}
export class ArrayPattern extends JSNode {
  type = "ArrayPattern";
  elements: Array<Expression> = [];
}
export class ObjectPattern extends JSNode {
  type = "ObjectPattern";
  properties: Array<Property> = [];
}
export class SpreadElement extends JSNode {
  type = "SpreadElement";
  argument!: Expression;
}
export class RestElement extends JSNode {
  type = "RestElement";
  argument!: Expression;
}

// JSX
export class JSXElement extends JSNode {
  type = "JSXElement";
  openingElement!: JSXOpeningElement;
  children!: Array<JSXElement | JSXText | JSXExpressionContainer>;
  closingElement!: JSXClosingElement | null;
}
export class JSXOpeningElement extends JSNode {
  type = "JSXOpeningElement";
  name!: JSXIdentifier | JSXNamespacedName | JSXMemberExpression;
  attributes!: JSXAttribute[];
  tagName!: string;
  selfClosing!: boolean;
}
export class JSXClosingElement extends JSNode {
  type = "JSXClosingElement";
  name!: JSXIdentifier | JSXNamespacedName | JSXMemberExpression;
  tagName!: string;
}
export class JSXIdentifier extends JSNode {
  type = "JSXIdentifier";
  name!: string;
}
export class JSXAttribute extends JSNode {
  type = "JSXAttribute";
  name!: JSXIdentifier;
  value!: JSXExpressionContainer | Literal | null;
}
export class JSXExpressionContainer extends JSNode {
  type = "JSXExpressionContainer";
  expression!: Expression;
}
export class JSXText extends JSNode {
  type = "JSXText";
  value!: string;
  raw!: string;
}
export class JSXMemberExpression extends JSNode {
  type = "JSXMemberExpression";
  object!: JSXIdentifier;
  property!: JSXIdentifier;
}
export class JSXNamespacedName extends JSNode {
  type = "JSXNamespacedName";
  namespace!: JSXIdentifier;
  name!: JSXIdentifier;
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
export function isChainExpression(node?: JSNode) {
  return node instanceof MemberExpression && isOptional(node);
}
export function isValidParameter(node?: JSNode) {
  return node
    ? node instanceof AssignmentExpression || node instanceof Identifier
    : false;
}
export function isValidForInParam(paramBody?: JSNode[]) {
  return paramBody
    ? (paramBody.length === 1 &&
        paramBody[0] instanceof ExpressionStatement &&
        paramBody[0].expression instanceof BinaryExpression &&
        paramBody[0].expression.operator === "in") ||
        (paramBody[0] instanceof VariableDeclaration &&
          paramBody[0].declarations.length === 1 &&
          paramBody[0].declarations[0].in)
    : false;
}
export function isValidForParam(paramBody?: JSNode[]) {
  return paramBody
    ? (paramBody.length === 3 || paramBody.length === 2) &&
        paramBody.find(
          (param) =>
            !/ExpressionStatement|VariableDeclaration|EmptyStatement/.test(
              param.type
            )
        ) === undefined &&
        /ExpressionStatement|EmptyStatement/.test(paramBody[1].type) &&
        /ExpressionStatement|EmptyStatement/.test(
          paramBody[2]?.type ?? "EmptyStatement"
        )
    : false;
}
export function isValidPropertyKeyStart(char: string) {
  return (
    isDigit(char) || isValidIdentifierCharacter(char) || /"|'|\[/.test(char)
  );
}
