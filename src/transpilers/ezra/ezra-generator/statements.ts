import { ezra } from "./base";

ezra.writeStatement = function (node: any) {
  switch (node.type) {
    case "ExpressionStatement":
      this.writeExpression(node.expression);
      this.write(";");
      break;
    case "ReturnStatement":
      this.write("return");
      if (node.argument !== null) {
        this.space();
        this.writeExpression(node.argument);
      }
      this.write(";");
      break;
    case "BlockStatement":
      this.write("{");
      if (node.body.length === 0) this.write("}");
      else {
        // ---Open block.---
        this.indentLevel++;
        this.newline();
        this.generate(node, this.options);
        // ---Close block.---
        this.indentLevel--;
        this.newline();
        this.write("}");
      }
      break;
    case "IfStatement":
      this.write("if");
      this.space();
      this.write("(");
      this.writeExpression(node.test);
      this.write(")");
      this.writeStatement(node.consequent);
      if (node.alternate !== null) {
        this.newline();
        this.write("else ");
        this.writeStatement(node.alternate);
      }
      break;
    case "FunctionDeclaration":
      this.write("function ");
      this.write(node.id.name);
      this.write("(");
      node.params.forEach((param: any, index: number) => {
        this.writeExpression(param);
        if (index !== node.params.length - 1) this.write(", ");
      });
      this.write(")");
      this.space();
      this.writeStatement(node.body);
      break;
    case "ClassDeclaration":
      this.write("class ");
      this.writeExpression(node.id);
      if (node.superClass !== undefined) {
        this.write(" extends ");
        this.writeExpression(node.superClass);
      }
      this.space();
      this.writeClassBody(node.body);
      break;
    case "VariableDeclaration":
      this.write(node.kind + " ");
      node.declarations.forEach((dec: any, index: number) => {
        this.writeExpression(dec.id);
        if (dec.init !== null) {
          this.space();
          this.write("=");
          this.space();
          this.writeExpression(dec.init);
        }
        this.comma(node.declarations, index);
      });
      this.write(";");
      break;
    case "EmptyStatement":
      this.write(";");
      break;
    case "ImportDeclaration":
      this.write("import");
      let hasDefault = false,
        hasSpec = node.specifiers.find(
          (spec: any) => spec.type === "ImportSpecifier"
        );
      if (node.specifiers[0].type === "ImportNamespaceSpecifier") {
        this.write("*");
        this.space();
        this.write("as ");
        this.writeExpression(node.specifiers[0].local);
        this.write(" ");
      } else
        node.specifiers.find((spec: any) => {
          if (spec.type === "ImportDefaultSpecifier") {
            this.write(" ");
            this.writeExpression(spec.local);
            hasDefault = true;
            this.write(" ");
            return true;
          }
        });
      if (hasSpec) {
        if (hasDefault) this.write(",");
        this.space();
        this.write("{");
        this.space();
        node.specifiers.forEach((spec: any, index: number) => {
          if (spec.type === "ImportSpecifier") {
            this.writeExpression(spec.imported);
            if (spec.imported.name !== spec.local.name) {
              this.write(" as ");
              this.writeExpression(spec.local);
            }
            this.comma(node.specifiers, index);
          }
        });
        this.space();
        this.write("}");
        this.space();
      }
      if (node.specifiers.length > 0) {
        this.write("from");
        this.space();
      }
      this.writeExpression(node.source);
      this.write(";");
      break;
  }
};
