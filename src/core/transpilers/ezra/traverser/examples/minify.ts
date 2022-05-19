import Ezra from "../..";
import {
  ConditionalExpression,
  EmptyNode,
  ExpressionStatement,
  Identifier,
  JSNode,
  LogicalExpression,
  Program,
  ReturnStatement,
  SequenceExpression,
} from "../../../../../types";
import { keywords } from "../../parser/identifiers";
import { TraversalPath } from "../config";
import {
  expressionStatement,
  newIdentifier,
  numberLiteral,
  unaryExpression,
} from "../helpers/creator";
export function isNotRenamable(node: Identifier, path: any) {
  // Properties of member expressions.
  if (
    path.parent.type === "MemberExpression" &&
    path.parent.property === node
  ) {
    return true;
  }
  // Left hand sides of properties.
  if (/Property/.test(path.parent.type) && path.parent.key === node) {
    if (path.parent.shorthand) path.parent.shorthand = false;
    return true;
  }
  return false;
}
var declarer: any = {
  VariableDeclarator: true,
  FunctionDeclaration: true,
  ClassDeclaration: true,
};
var letters = "abcdefghijklmnopqrstuvwxyz$_";
/**
 * Traverse an AST and cut corners where possible, shortening variable names, removing dead code, concatenating consecutive expressions, etc.
 * @param ast The ast of the file to minify.
 */
export default function (ast: Program) {
  var i = 0;
  var globalVarTracker = new Map();
  function rename_vars(closure: JSNode, path: TraversalPath) {
    // Rename declared variables.
    path.scope.variables.forEach((variable) => {
      do {
        let a = Math.random().toString(16);
        variable.name =
          letters[i++ % 27] +
          (i > 27 ? (i > 150 ? a.slice(12) : a.slice(13)) : "");
      } while (
        globalVarTracker.has(variable.name) ||
        keywords[variable.name] === true
      );
      // Rename hoisted variables in scope.
      path.scope.undeclared.forEach((variable) => {
        if (variable.hoisted) {
          variable.node.name = variable.hoisted.name;
        }
      });
      // Rename hoisted variables in nested scopes.
      path.scope.descendants.forEach((desc) => {
        desc.undeclared.forEach((variable) => {
          if (variable.hoisted) {
            variable.node.name = variable.hoisted.name;
          }
        });
      });
      globalVarTracker.set(variable.name, true);
    });
  }
  Ezra.traverse(ast, {
    Program: rename_vars,
    // Remove unnecesary block statements.
    BlockStatement(node, path) {
      if (path.scope.variables.size > 0) {
        rename_vars(node, path);
        return;
      }
      if (node.body.length > 1 || node.body.length === 0) return;
      if (/Statement/.test(path.parent.type)) return node.body[0];
    },
    Identifier(node, path) {
      if (isNotRenamable(node, path)) return;
      // Bind all defined identifiers to the variable definitions.
      // Check if the identifier is defined in scope.
      if (path.scope.variables.has(node.name))
        return path.scope.variables.get(node.name);
      // Check if the identifier is defined in the outer scopes.
      else {
        for (const ancestor of path.scope.ancestors)
          if (ancestor.variables?.has(node.name)) {
            return ancestor.variables.get(node.name);
          }
      }
      // Track variable even if it is undeclared to detect hoisting.
      if (path.scope.undeclared.has(node.name))
        return path.scope.undeclared.get(node.name)?.node;
      else if (!/Function/.test(path.parent.type))
        path.scope.undeclared.set(node.name, { node });
      globalVarTracker.set(node.name, true);
    },
    // Hoist previously undeclared variables.
    enter(node: any, path) {
      if (declarer[node.type] !== true) return;
      if (path.scope.undeclared.has(node.id.name)) {
        const replacer = path.scope.undeclared.get(node.id.name);
        if (replacer) replacer.hoisted = node.id;
      }
      for (const desc of path.scope.descendants) {
        if (desc.undeclared.has(node.id.name)) {
          const replacer = desc.undeclared.get(node.id.name);
          if (replacer) replacer.hoisted = node.id;
        }
      }
    },
    // Join all consecutive variable declarations with the same keyword.
    VariableDeclaration(node, path: any) {
      if (!/Block|Program/.test(path.parent.type)) return;
      let body: any = path.parent.body,
        index = body.indexOf(node) - 1;
      while (
        body[index]?.type === "VariableDeclaration" &&
        body[index].kind === node.kind
      ) {
        node.declarations = body[index].declarations.concat(node.declarations);
        body[index--] = new EmptyNode(0);
      }
    },
    // Join all consecutive expression statements into one sequence.
    ExpressionStatement(node, path: any) {
      if (!/Block|Program/.test(path.parent.type)) return;
      let newseq = new SequenceExpression(node.loc.start);
      newseq.expressions = [];
      newseq.expressions.push(node.expression);
      let body = path.parent.body,
        index = body.indexOf(node) - 1;
      while (/ExpressionStat/.test(body[index]?.type)) {
        let expression = body[index].expression;
        if (/Sequence/.test(expression.type)) {
          newseq.expressions.splice(0, 0, ...expression.expressions);
        } else newseq.expressions.splice(0, 0, expression);
        newseq.loc.start = expression.loc.start;
        body[index--] = new EmptyNode(0);
      }
      return expressionStatement(newseq);
    },
    // Fuse return statements with the previous expression statements.
    ReturnStatement(node, path: any) {
      if (!/Block|Program/.test(path.parent.type)) return;
      if (!node.argument) return;
      let body = path.parent.body,
        index = body.indexOf(node) - 1;
      if (body[index] && /ExpressionStat/.test(body[index].type)) {
        let previousExp = body[index].expression;
        let seq = new SequenceExpression(node.argument?.loc.start ?? 0);
        seq.expressions = [];
        if (previousExp instanceof SequenceExpression) {
          seq.expressions = previousExp.expressions;
        } else seq.expressions.push(previousExp);
        if (node.argument instanceof SequenceExpression) {
          seq.expressions.push(...node.argument.expressions);
        } else seq.expressions.push(node.argument);
        body[index] = new EmptyNode(0);
        node.argument = seq;
      }
      return node;
    },
    // Replace expressional If statements with logical expressions.
    IfStatement(node, path) {
      if (node.consequent instanceof ExpressionStatement) {
        if (node.alternate === null) {
          let and = new LogicalExpression(node.loc.start);
          and.left = node.test;
          and.operator = "&&";
          and.right = node.consequent.expression;
          and.loc.end = node.loc.end;
          return expressionStatement(and);
        } else if (node.alternate instanceof ExpressionStatement) {
          let ternary = new ConditionalExpression(node.loc.start);
          ternary.test = node.test;
          ternary.consequent = node.consequent.expression;
          ternary.alternate = node.alternate.expression;
          ternary.loc.end = node.loc.end;
          return expressionStatement(ternary);
        }
        // Conjoin returns. e.g.
        // from if (x==1) {return true} else {return false}
        // to return x==1 ? true : false;
      } else if (
        node.consequent instanceof ReturnStatement &&
        node.alternate instanceof ReturnStatement
      ) {
        let ret = new ReturnStatement(node.loc.start);
        let argument = new ConditionalExpression(node.loc.start);
        argument.test = node.test;
        argument.consequent =
          node.consequent.argument || newIdentifier("undefined");
        argument.alternate =
          node.alternate.argument || newIdentifier("undefined");
        ret.argument = argument;
        return ret;
      }
    },
    // Change all boolean literals to implicit conversions.
    Literal(node, path) {
      if (typeof node.value !== "boolean") return;
      let y: any = node;
      if (y.value) {
        y.raw = "!0";
        y.value = unaryExpression("!", numberLiteral(0));
      } else {
        y.raw = "!1";
        y.value = unaryExpression("!", numberLiteral(1));
      }
      return y;
    },
  });
  return ast;
}
