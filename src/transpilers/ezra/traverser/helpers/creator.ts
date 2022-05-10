import {
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionExpression,
  Identifier,
  JSNode,
  Literal,
  MemberExpression,
  Property,
  Statement,
  ThisExpression,
  UnaryExpression,
  UpdateExpression,
} from "../../../../types";

export function newFunctionExp(
  id: Identifier | null = null,
  params: Array<JSNode> = [],
  body = new BlockStatement(0),
  isAsync = false,
  isGenerator = false
) {
  let func = new FunctionExpression(0);
  func.id = id;
  func.params = params;
  func.expression = false;
  func.generator = isGenerator;
  func.async = isAsync;
  func.body = body;
  return func;
}

export function assignmentExpression(
  left: JSNode,
  operator: string,
  right: JSNode
) {
  let assign = new AssignmentExpression(0);
  assign.left = left;
  assign.operator = operator;
  assign.right = right;
  return assign;
}
export function expressionStatement(expression: Expression) {
  let statement = new ExpressionStatement(0);
  statement.expression = expression;
  return statement;
}
export function unaryExpression(operator: string, argument: Expression) {
  const n = new UnaryExpression(0);
  n.prefix = true;
  n.operator = operator;
  n.argument = argument;
  return n;
}
export function updateExpression(
  operator: string,
  prefix: boolean,
  argument: Expression
) {
  const u = new UpdateExpression(0);
  u.prefix = prefix;
  u.operator = operator;
  u.argument = argument;
  return u;
}
export function newBinaryExp(
  left: Expression,
  operator: string,
  right: Expression
) {
  const binexp = new BinaryExpression(0);
  binexp.left = left;
  binexp.operator = operator;
  binexp.right = right;
  return binexp;
}
export const use_strict = expressionStatement(newString('"use strict"'));
export function blockStatement(body: Array<Statement>) {
  const b = new BlockStatement(0);
  b.body.push(...body);
  return b;
}
export function memberExpression(
  object: JSNode,
  property: JSNode,
  computed = false,
  optional = false
) {
  let mem = new MemberExpression(0);
  mem.object = object;
  mem.property = property;
  mem.computed = computed;
  mem.optional = optional;
  return mem;
}
export function newIdentifier(name: string) {
  const id = new Identifier(0);
  id.name = name;
  return id;
}
export function callExpression(callee: JSNode, args: JSNode[] = []) {
  const call = new CallExpression(0);
  call.callee = callee;
  call.arguments = args;
  return call;
}
export function newString(raw: string) {
  const string = new Literal(0);
  string.kind = "string";
  string.raw = raw;
  string.value = eval(raw);
  return string;
}
export function numberLiteral(value: number) {
  const num = new Literal(0);
  num.kind = typeof value === "bigint" ? "bigint" : "number";
  num.value = value;
  num.raw = value.toString();
  return num;
}
export function newProp(key: Literal | Identifier, value?: JSNode) {
  const prop = new Property(0);
  prop.key = key;
  if (value === undefined) {
    prop.shorthand = true;
    prop.value = prop.key;
  } else prop.value = value;
  return prop;
}
export var false_ = new Literal(0);
false_.kind = "boolean";
false_.raw = "false";
false_.value = false;
export var true_ = new Literal(0);
true_.kind = "boolean";
true_.raw = "true";
true_.value = true;
export var null_ = new Literal(0);
null_.value = null;
null_.raw = "null";
null_.kind = "null";
export var this_ = new ThisExpression(0);
export var undefined_ = newIdentifier("undefined");
export function clone(node: JSNode) {
  return Object.assign(Object.create(Object.getPrototypeOf(node)), node);
}
