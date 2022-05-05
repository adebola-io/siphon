import { defaults, generatorOptions } from ".";
import {
  BlockStatement,
  ClassBody,
  Identifier,
  MethodDefinition,
  Program,
} from "../../../types";
import { gen_utils } from "./utils";

export class ezra_gen_internals extends gen_utils {
  generate!: (
    node: Program | BlockStatement,
    options?: generatorOptions
  ) => string;
  writeIdentifier!: Function;
  writeExpression!: Function;
  writeStatement!: Function;
  writeClassBody!: Function;
}
export var ezra = ezra_gen_internals.prototype;
ezra.generate = function (node, options) {
  this.options = { ...defaults, ...options };
  node.body.forEach((subnode, index) => {
    this.writeStatement(subnode);
    if (index !== node.body.length - 1) this.newline();
  });
  return this.output;
};

ezra.writeIdentifier = function (node: Identifier) {
  this.write(node.name);
};
ezra.writeClassBody = function (node: ClassBody) {
  this.write("{");
  if (node.body.length === 0) this.write("}");
  else {
    this.indentLevel++;
    this.newline();
    node.body.forEach((def, index) => {
      this.writeExpression(def.key);
      //   Write Class methods.
      if (def instanceof MethodDefinition) {
        this.space();
        this.write("(");
        // Write Method Parameters.
        if (def.value.params) {
          def.value.params.forEach((param: any, index: number) => {
            this.writeExpression(param);
            this.comma(def.value.params, index);
          });
        }
        this.write(")");
        this.space();
        this.writeStatement(def.value.body);
      } else {
        // Write class properties.
        if (def.value !== null) {
          this.space();
          this.write("=");
          this.space();
          this.writeExpression(def.value);
        }
        this.write(";");
      }
      if (index !== node.body.length - 1) this.newline();
    });
    this.indentLevel--;
    this.newline();
    this.write("}");
  }
};
