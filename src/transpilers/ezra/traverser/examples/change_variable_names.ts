import Ezra from "../..";
import {
  AssignmentExpression,
  AssignmentPattern,
  ClassBody,
  Identifier,
  MemberExpression,
  Program,
  Property,
  PropertyDefinition,
} from "../../../../types";
import { TraversalPath } from "../config";
import { clone, newIdentifier } from "../helpers/creator";
import uniqueify from "./uniqueify";

function isNotRenamable(node: Identifier, path: TraversalPath) {
  if (node.name === "proc") console.log(path.parent);
  if (path.parent instanceof Property && path.parent.shorthand) {
    path.parent.shorthand = false;
  }
  return (
    (path.parent instanceof MemberExpression &&
      path.parent.property === node &&
      !path.parent.computed) ||
    (!/Block|Program/.test(path.scope.type) &&
      !(
        (path.parent instanceof PropertyDefinition &&
          path.parent.value === node) ||
        (path.parent instanceof Property && path.parent.value === node)
      ))
  );
}
function mangle_variables(ast: Program) {
  var i = -1;
  uniqueify(ast);
  Ezra.traverse(ast, {
    enter(node: any, path) {
      if (node.id === undefined) return;
      var oldname: string;
      if (node.id === null || node.id.type === "Identifier") {
        var parameterMap = new Map();
        if (/Function/.test(node.type) && node.params.length) {
          node.params.forEach((parameter: any) => {
            let oldParamName = parameter.name;
            if (parameter instanceof Identifier) {
              oldParamName = parameter.name;
              parameter.name = Letter(++i);
              parameterMap.set(oldParamName, parameter.name);
            } else if (parameter instanceof AssignmentPattern) {
              oldParamName = parameter.left.name;
              parameter.left.name = Letter(++i);
              parameterMap.set(oldParamName, parameter.left.name);
            }
          });
          Ezra.traverse(node.body, {
            Identifier(funcNode, p1a) {
              if (isNotRenamable(funcNode, p1a)) return;
              else if (parameterMap.has(funcNode.name)) {
                funcNode.name = parameterMap.get(funcNode.name);
              }
            },
          });
        }
        oldname = node.id?.name;
        if (node.id) node.id.name = Letter(++i);
        Ezra.traverse(path.scope, {
          Identifier(subnode, p2) {
            if (isNotRenamable(subnode, p2)) return;
            else if (node.id && subnode.name === oldname) {
              subnode.name = node.id.name;
            }
          },
        });
      } else if (node.id.type === "ObjectPattern") {
        node.id.properties.forEach((prop: any) => {
          if (prop.shorthand && prop.key.type === "Identifier") {
            prop.value = newIdentifier(Letter(++i));
            prop.shorthand = false;
            Ezra.traverse(path.scope, {
              Identifier(subnode, p2) {
                if (isNotRenamable(subnode, p2)) return;
                if (subnode.name === prop.key.name) {
                  subnode.name = prop.value.name;
                }
              },
            });
          }
        });
      } else return;
      return node;
    },
  });
}
var letters: any = "abcdefghijklmnopqrstuvwxyz";
function Letter(i: number) {
  return letters[i % 25] + (i > 25 ? i.toString() : "");
}

export default mangle_variables;
