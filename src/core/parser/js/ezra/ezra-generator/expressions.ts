import {
  ArrayPattern,
  ArrowFunctionExpression,
  AssignmentExpression,
  AssignmentPattern,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  ChainExpression,
  ClassExpression,
  Expression,
  FunctionExpression,
  Identifier,
  isValidReference,
  Literal,
  MemberExpression,
  NewExpression,
  ObjectPattern,
  PrivateIdentifier,
  Property,
  SequenceExpression,
  ThisExpression,
} from "../../../../../types";
import { precedence } from "../../../../../utils";
import { ezra } from "./base";

ezra.writeExpression = function (node: Expression) {
  if (node instanceof Identifier) {
    this.writeIdentifier(node);
  } else if (node instanceof PrivateIdentifier) {
    this.write("#");
    this.write(node.name);
  } else if (node instanceof Literal) {
    //   LITERALS
    this.write(node.raw);
  } else if (node instanceof BinaryExpression) {
    //   BINARY EXPRESSIONS
    const brac =
      node.left instanceof BinaryExpression &&
      precedence[node.left.operator] < precedence[node.operator];
    if (brac) this.write("(");
    this.writeExpression(node.left);
    if (brac) this.write(")");
    this.space();
    this.write(node.operator);
    this.space();
    this.writeExpression(node.right);
  } else if (node instanceof MemberExpression) {
    const brac = !(
      isValidReference(node.object) || !/Call|This/.test(node.type)
    );
    // MEMBER EXPRESSIONS
    if (brac) this.write("(");
    this.writeExpression(node.object);
    if (brac) this.write(")");
    // Optional Chaining.
    if (node.optional) {
      this.write("?.");
      this.writeExpression(node.property);
    } else if (node.computed) {
      // Computed Properties.
      this.write("[");
      this.writeExpression(node.property);
      this.write("]");
    } else {
      this.write(".");
      this.writeExpression(node.property);
    }
  } else if (node instanceof CallExpression) {
    //   CALL EXPRESSIONS.
    const brac =
      node.callee &&
      /FunctionExpression|ClassExpression|AssignmentExpression/.test(
        node.callee.type
      );
    if (brac) this.write("(");
    this.writeExpression(node.callee);
    this.write("(");
    node.arguments.forEach((arg, index) => {
      this.writeExpression(arg);
      this.comma(node.arguments, index);
    });
    this.write(")");
  } else if (node instanceof NewExpression) {
    //   NEW EXPRESSIONS.
    this.write("new ");
    this.writeExpression(node.callee);
    this.write("(");
    node.arguments.forEach((arg, index) => {
      this.writeExpression(arg);
      this.comma(node.arguments, index);
    });
    this.write(")");
  } else if (node instanceof ThisExpression) {
    this.write("this");
  } else if (node instanceof ChainExpression) {
    this.writeExpression(node.expression);
  } else if (node instanceof SequenceExpression) {
    node.expressions.forEach((expression, index) => {
      this.writeExpression(expression);
      this.comma(node.expressions, index);
    });
  } else if (node instanceof ArrowFunctionExpression) {
    this.write("(");
    node.params.forEach((param, index) => {
      this.writeExpression(param);
      this.comma(node.params, index);
    });
    this.write(")");
    this.space();
    this.write("=>");
    this.space();
    if (node.body instanceof BlockStatement) {
      this.writeStatement(node.body);
    } else this.writeExpression(node.body);
  } else if (node instanceof ArrayPattern) {
    this.write("[");
    this.space();
    node.elements.forEach((element, index) => {
      this.writeExpression(element);
      this.comma(node.elements, index);
    });
    this.space();
    this.write("]");
  } else if (node instanceof ObjectPattern) {
    this.write("{");
    this.space();
    node.properties.forEach((property, index) => {
      this.writeExpression(property);
      this.comma(node.properties, index);
    });
    this.space();
    this.write("}");
  } else if (node instanceof AssignmentPattern) {
    this.writeExpression(node.left);
    this.space();
    this.write("=");
    this.space();
    this.writeExpression(node.right);
  } else if (node instanceof Property) {
    if (node.shorthand) this.writeExpression(node.key);
  } else if (node instanceof AssignmentExpression) {
    this.writeExpression(node.left);
    this.space();
    this.write(node.operator);
    this.space();
    this.writeExpression(node.right);
  } else if (node instanceof FunctionExpression) {
    this.write("function ");
    if (node.id !== null) this.writeIdentifier(node.id);
    this.write("(");
    node.params.forEach((param, index) => {
      this.writeExpression(param);
      this.comma(node.params, index);
    });
    this.write(")");
    this.space();
    this.writeStatement(node.body);
  } else if (node instanceof ClassExpression) {
    this.write("class ");
    if (node.id !== null) this.writeExpression(node.id);
    if (node.superClass !== null) {
      this.write(" extends ");
      this.writeExpression(node.superClass);
      this.space();
    }
    this.writeClassBody(node.body);
  }
};
