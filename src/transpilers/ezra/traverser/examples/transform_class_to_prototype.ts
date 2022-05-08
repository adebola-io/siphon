import Ezra from "../..";
import {
  CallExpression,
  ExpressionStatement,
  Identifier,
  JSNode,
  Literal,
  MethodDefinition,
  ObjectExpression,
  Program,
  PropertyDefinition,
  ReturnStatement,
  ThisExpression,
  VariableDeclaration,
  VariableDeclarator,
} from "../../../../types";
import {
  false_,
  newAssignmentExp,
  newCallExp,
  newFunctionExp,
  newIdentifier,
  newMemberExp,
  newProp,
  newString,
  true_,
} from "../helpers/creator";

/**
 * Changes all instances of an ES6 class to an Object prototype.
 * NOTE: This does not handle private properties (yet).
 */
function transform_class_to_prototype(ast: Program) {
  Ezra.traverse(ast, {
    ClassDeclaration(node, path) {
      // Create outer declaration.
      let a = new VariableDeclaration(0);
      a.kind = "var";
      let dec = new VariableDeclarator(0);
      dec.id = node.id;
      let call = new CallExpression(0);
      let class_ = newFunctionExp();
      let constructor_: MethodDefinition | undefined;
      let properties: JSNode[] = [];
      let methods: JSNode[] = [];
      let prototype = newIdentifier("prototype");
      //   Set property definitions as inner values.
      node.body.body.forEach((def) => {
        if (
          def instanceof PropertyDefinition &&
          !def.static &&
          def.value !== null
        ) {
          let this_ = new ThisExpression(0);
          let dot = newMemberExp(this_, def.key);
          dot.computed = def.computed || !(def.key instanceof Identifier);
          let assign = newAssignmentExp(dot, "=", def.value);
          let exp = new ExpressionStatement(0);
          exp.expression = assign;
          properties.push(exp);
        } else if (def instanceof MethodDefinition) {
          switch (def.kind) {
            case "constructor":
              constructor_ = def;
              break;
            case "method":
              let mem1 = newMemberExp(node.id, newIdentifier("prototype"));
              let mem2 = def.static
                ? newMemberExp(node.id, def.key)
                : newMemberExp(mem1, def.key);
              mem2.computed = def.computed || !(def.key instanceof Identifier);
              let assign = newAssignmentExp(mem2, "=", def.value);
              let exp = new ExpressionStatement(0);
              exp.expression = assign;
              methods.push(exp);
              break;
            case "get":
            case "set":
              let ob = newMemberExp(
                newIdentifier("Object"),
                newIdentifier("defineProperty")
              );
              let object = new ObjectExpression(0);
              object.properties = [];
              let get = newProp(newIdentifier(def.kind), def.value);
              let enumerable = newProp(newIdentifier("enumerable"), false_);
              let configurable = newProp(newIdentifier("configurable"), true_);
              object.properties.push(get, enumerable, configurable);
              let key: any;
              if (def.key instanceof Literal) key = newString(def.key.raw);
              else if (def.computed) key = def.key;
              else if (def.key instanceof Identifier)
                key = newString('"' + def.key.name + '"');
              let getcall = newCallExp(ob, [
                def.static ? node.id : newMemberExp(node.id, prototype),
                key,
                object,
              ]);
              methods.push(getcall);
              break;
          }
        } else if (def.static && def.value !== null) {
          let ob = newMemberExp(node.id, def.key);
          ob.computed = def.computed || !(def.key instanceof Identifier);
          let assign = newAssignmentExp(ob, "=", def.value);
          let exp = new ExpressionStatement(0);
          exp.expression = assign;
          methods.push(exp);
        }
      });
      let function_ = newFunctionExp(node.id, constructor_?.value.params);
      let i = 0;
      while (properties[i]) function_.body.body.push(properties[i++]);
      i = 0;
      while (constructor_?.value.body.body[i]) {
        function_.body.body.push(constructor_?.value.body.body[i++]);
      }
      class_.body.body.push(function_);
      i = 0;
      while (methods[i]) class_.body.body.push(methods[i++]);
      let return_ = new ReturnStatement(0);
      return_.argument = node.id;
      class_.body.body.push(return_);
      call.callee = class_;
      call.arguments = node.superClass ? [node.superClass] : [];
      dec.init = call;
      a.declarations.push(dec);
      return a;
    },
  });
}

export default transform_class_to_prototype;
