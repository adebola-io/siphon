import {
  ArrayExpression,
  ArrowFunctionExpression,
  AssignmentExpression,
  AssignmentPattern,
  AwaitExpression,
  BinaryExpression,
  CallExpression,
  ChainExpression,
  ClassExpression,
  ConditionalExpression,
  FunctionExpression,
  Identifier,
  ImportExpression,
  isValidReference,
  Literal,
  LogicalExpression,
  MemberExpression,
  NewExpression,
  ObjectExpression,
  PrivateIdentifier,
  Property,
  RestElement,
  SequenceExpression,
  TemplateElement,
  TemplateLiteral,
  ThisExpression,
  UnaryExpression,
  UpdateExpression,
  YieldExpression,
} from "../../../../types";
import { isAlphabetic, precedence } from "../../../../utils";
import { ezra } from "./base";
function requiresBrackets(node: any, checker: string) {
  return precedence[node[checker]?.operator] < precedence[node.operator];
}
ezra.EmptyNode = function () {};
ezra.Identifier = function (node: Identifier) {
  this.write(node.name);
};
ezra.PrivateIdentifier = function (node: PrivateIdentifier) {
  this.write("#" + node.name);
};
ezra.Literal = function (node: Literal) {
  this.write(node.raw);
};
ezra.TemplateLiteral = function (node: TemplateLiteral) {
  this.write("`");
  var ordered = node.expressions
    .concat(node.quasis)
    .sort((a, b) => a.loc.start - b.loc.start);
  for (let i = 0; ordered[i]; i++) {
    var element = ordered[i];
    if (element instanceof TemplateElement) {
      this.write(element.value.raw);
    } else {
      this.write("${");
      this.render(element);
      this.write("}");
    }
  }
  this.write("`");
};
ezra.BinaryExpression = function (node: BinaryExpression) {
  var condition =
    requiresBrackets(node, "left") ||
    (node.left && /Sequence|Conditional/.test(node.left.type));
  this.writeIf("(", condition);
  this.render(node.left);
  this.writeIf(")", condition);
  if (isAlphabetic(node.operator)) this.write(" " + node.operator + " ");
  else this.space(node.operator);
  condition =
    requiresBrackets(node, "right") ||
    (node.right && /Sequence|Conditional/.test(node.right.type));
  this.writeIf("(", condition);
  this.render(node.right);
  this.writeIf(")", condition);
};
ezra.AssignmentExpression = function (node: AssignmentExpression) {
  this.render(node.left);
  this.space(node.operator);
  var condition =
    requiresBrackets(node, "right") || /Sequence/.test(node.right?.type ?? "");
  this.writeIf("(", condition);
  this.render(node.right);
  this.writeIf(")", condition);
};
ezra.CallExpression = function (node: CallExpression) {
  var condition = !(
    isValidReference(node.callee) ||
    /CallExpression/.test(node.callee?.type ?? "")
  );
  this.writeIf("(", condition);
  this.render(node.callee);
  this.writeIf(")", condition);
  this.write("(");
  this.sequence(node.arguments);
  this.write(")");
};
ezra.MemberExpression = function (node: MemberExpression) {
  var condition = !(
    isValidReference(node.object) || /This|Call/.test(node.object?.type ?? "")
  );
  this.writeIf("(", condition);
  this.render(node.object);
  this.writeIf(")", condition);
  if (node.computed) this.write("[");
  else if (node.optional) this.write("?.");
  else this.write(".");
  this.render(node.property);
  if (node.computed) this.write("]");
};
ezra.NewExpression = function (node: NewExpression) {
  this.write("new ");
  this.render(node.callee);
  this.write("(");
  this.sequence(node.arguments);
  this.write(")");
};
ezra.ImportExpression = function (node: ImportExpression) {
  this.write("import(");
  this.render(node.source);
  this.write(")");
};
ezra.ThisExpression = function (node: ThisExpression) {
  this.write("this");
};
ezra.ClassExpression = function (node: ClassExpression) {
  this.write("class");
  if (node.id !== null) {
    this.write(" " + node.id.name);
  }
  if (node.superClass !== null) {
    this.write(" extends ");
    this.render(node.superClass);
  }
  this.space();
  this.render(node.body);
};
ezra.UnaryExpression = function (node: UnaryExpression) {
  var condition = requiresBrackets(node, "argument");
  this.write(node.operator);
  if (isAlphabetic(node.operator)) this.write(" ");
  this.writeIf("(", condition);
  this.render(node.argument);
  this.writeIf(")", condition);
};
ezra.ArrayExpression = function (node: ArrayExpression) {
  this.write("[");
  this.sequence(node.elements);
  this.write("]");
};
ezra.ObjectExpression = function (node: ObjectExpression) {
  this.write("{");
  if (node.properties.length) this.space();
  this.sequence(node.properties);
  if (node.properties.length) this.space();
  this.write("}");
};
ezra.Property = function (node: Property) {
  if (node.computed) this.write("]");
  this.render(node.key);
  if (node.computed) this.write("[");
  if (node.method && node.value instanceof FunctionExpression) {
    this.write("(");
    this.sequence(node.value.params);
    this.write(")");
    this.space();
    this.render(node.value.body);
  } else if (node.shorthand) return;
  else {
    this.write(":");
    this.space();
    this.render(node.value);
  }
};
ezra.UpdateExpression = function (node: UpdateExpression) {
  var condition = requiresBrackets(node, "argument");
  if (node.prefix) this.write(node.operator);
  this.writeIf("(", condition);
  this.render(node.argument);
  this.writeIf(")", condition);
  if (!node.prefix) this.write(node.operator);
};
ezra.AwaitExpression = function (node: AwaitExpression) {
  this.write("await ");
  this.render(node.argument);
};
ezra.ChainExpression = function (node: ChainExpression) {
  this.render(node.expression);
};
ezra.ConditionalExpression = function (node: ConditionalExpression) {
  this.render(node.test);
  this.space();
  if (this.lineLength >= 28) {
    this.indentLevel++;
    this.newline();
    this.write("?");
    this.space();
    this.render(node.consequent);
    this.newline();
    this.write(":");
    this.space();
    this.render(node.alternate);
    this.indentLevel--;
  } else {
    this.write("?");
    this.space();
    this.render(node.consequent);
    this.space();
    this.write(":");
    this.space();
    this.render(node.alternate);
  }
};
ezra.FunctionExpression = function (node: FunctionExpression) {
  if (node.async) this.write("async ");
  this.write("function");
  if (node.generator) this.write("*");
  if (node.id !== null) {
    this.write(" " + node.id.name);
  }
  this.space();
  this.write("(");
  this.sequence(node.params);
  this.write(")");
  this.space();
  this.render(node.body);
};
ezra.LogicalExpression = function (node: LogicalExpression) {
  var condition = requiresBrackets(node, "left");
  this.writeIf("(", condition);
  this.render(node.left);
  this.writeIf(")", condition);
  condition =
    requiresBrackets(node, "right") ||
    /Assign|Sequence|Conditional/.test(node.right?.type ?? "");
  this.space();
  this.write(node.operator);
  this.space();
  this.writeIf("(", condition);
  this.render(node.right);
  this.writeIf(")", condition);
};
ezra.SequenceExpression = function (node: SequenceExpression) {
  this.sequence(node.expressions, node.type);
};
ezra.ArrowFunctionExpression = function (node: ArrowFunctionExpression) {
  if (node.async) this.write("async ");
  this.write("(");
  this.sequence(node.params);
  this.write(")");
  this.space();
  this.write("=>");
  this.space();
  this.render(node.body);
};
ezra.YieldExpression = function (node: YieldExpression) {
  this.write("yield");
  if (node.delegate) {
    this.write("*");
    this.space();
  } else this.write(" ");
  this.render(node.argument);
};
ezra.AssignmentPattern = function (node: AssignmentPattern) {
  this.render(node.left);
  this.space("=");
  this.render(node.right);
};
ezra.ArrayPattern = ezra.ArrayExpression;
ezra.ObjectPattern = ezra.ObjectExpression;
ezra.RestElement = function (node: RestElement) {
  var condition = !isValidReference(node.argument);
  this.write("...");
  this.writeIf("(", condition);
  this.render(node.argument);
  this.writeIf(")", condition);
};
ezra.SpreadElement = ezra.RestElement;
