import Ezra from "../..";
import {
  Identifier,
  MemberExpression,
  Program,
  Property,
} from "../../../../types";
import { newIdentifier } from "../helpers/creator";

function change_variable_names(ast: Program) {
  var i = -1;
  Ezra.traverse(ast, {
    VariableDeclarator(node, p) {
      var oldname: string;
      if (node.id.type === "Identifier") {
        oldname = node.id.name;
        node.id.name = Letter(++i);
        Ezra.traverse(p.scope, {
          Identifier(subnode, p2) {
            if (
              !/Block|Program/.test(p2.scope.type) ||
              (p2.parent instanceof MemberExpression &&
                p2.parent.property === subnode)
            ) {
              return;
            }
            if (subnode.name === oldname) subnode.name = node.id.name;
          },
        });
      } else if (node.id.type === "ObjectPattern") {
        node.id.properties.forEach((prop: any) => {
          if (prop.shorthand && prop.key.type === "Identifier") {
            prop.value = newIdentifier(Letter(++i));
            prop.shorthand = false;
            Ezra.traverse(p.scope, {
              Identifier(subnode, p2) {
                if (!/Block|Program/.test(p2.scope.type)) return;
                if (
                  p2.parent instanceof MemberExpression &&
                  p2.parent.property === subnode
                )
                  return;
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
const letters = "abcdefghijklmnopqrstuvwxyz";
function Letter(i: number) {
  return i < 25
    ? letters[i]
    : i < 50
    ? letters[50 - i] + letters[50 - i + 1]
    : i < 100
    ? letters[100 - 1] + letters.split("").reverse()[100 - i]
    : letters.slice(0, 120 / i);
}

export default change_variable_names;
