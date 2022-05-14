import {
  BlockStatement,
  BreakStatement,
  ClassBody,
  ClassDeclaration,
  ContinueStatement,
  DoWhileStatement,
  EmptyStatement,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  IfStatement,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  LabeledStatement,
  MethodDefinition,
  PropertyDefinition,
  ReturnStatement,
  SwitchCase,
  SwitchStatement,
  ThrowStatement,
  TryStatement,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
} from "../../../../types";
import { ezra } from "./base";

ezra.FunctionDeclaration = function (node: FunctionDeclaration) {
  if (node.async) this.write("async ");
  this.write("function ");
  this.write(node.id.name);
  this.space();
  this.write("(");
  this.sequence(node.params);
  this.write(")");
  this.space();
  this.render(node.body);
};
ezra.VariableDeclaration = function (node: VariableDeclaration) {
  this.write(node.kind + " ");
  this.sequence(node.declarations);
  this.write(";");
};
ezra.VariableDeclarator = function (node: VariableDeclarator) {
  this.render(node.id);
  if (node.init !== null) {
    this.space("=");
    if (node.init?.type.startsWith("Sequence")) this.write("(");
    this.render(node.init);
    if (node.init?.type.startsWith("Sequence")) this.write(")");
  }
};
ezra.ExpressionStatement = function (node: ExpressionStatement) {
  this.render(node.expression);
  this.write(";");
};
ezra.ClassDeclaration = function (node: ClassDeclaration) {
  this.write("class ");
  this.render(node.id);
  if (node.superClass !== null) {
    this.write(" extends ");
    this.render(node.superClass);
  }
  this.space();
  this.render(node.body);
};
ezra.ClassBody = function (node: ClassBody) {
  this.write("{");
  if (node.body.length === 0) {
    this.write("}");
    return;
  }
  this.indentLevel++;
  this.newline();
  for (let i = 0; node.body[i]; i++) {
    this.render(node.body[i]);
    this.write(";");
    if (i !== node.body.length - 1) this.newline();
  }
  this.indentLevel--;
  this.newline();
  this.write("}");
};
ezra.MethodDefinition = function (node: MethodDefinition) {
  if (node.static) this.write("static ");
  if (node.computed) this.write("[");
  if (/get|set/.test(node.kind)) this.write(node.kind + " ");
  this.render(node.key);
  if (node.computed) this.write("]");
  this.space();
  this.write("(");
  this.sequence(node.value.params);
  this.write(")");
  this.space();
  this.render(node.value.body);
};
ezra.PropertyDefinition = function (node: PropertyDefinition) {
  if (node.static) this.write("static ");
  if (node.computed) this.write("[");
  this.render(node.key);
  if (node.computed) this.write("]");
  if (node.value !== null) {
    this.space("=");
    this.render(node.value);
  }
};
ezra.Super = function () {
  this.write("super");
};
ezra.BlockStatement = function (node: BlockStatement) {
  this.write(`{`);
  if (node.body.length === 0) {
    this.write("}");
    return;
  }
  this.indentLevel++;
  this.newline();
  this.generate(node, this.options);
  this.indentLevel--;
  this.newline();
  this.write("}");
};

ezra.ImportDeclaration = function (node: ImportDeclaration) {
  var _default = false;
  this.write("import ");
  if (node.specifiers?.length) {
    switch (node.specifiers[0].type) {
      case "ImportDefaultSpecifier":
        _default = true;
        this.render(node.specifiers[0]);
        if (node.specifiers.length > 1) {
          this.write(", { ");
          this.sequence(node.specifiers.slice(1));
          this.write(" }");
        }
        break;
      case "ImportNamespaceSpecifier":
        this.write("* as ");
        this.render(node.specifiers[0]);
        break;
      default:
        this.write("{ ");
        this.sequence(node.specifiers);
        this.write(" }");
    }
    this.write(" from ");
  }
  this.render(node.source);
  this.write(";");
};
ezra.ImportDefaultSpecifier = function (node: ImportDefaultSpecifier) {
  this.write(node.local.name);
};
ezra.ImportNamespaceSpecifier = function (node: ImportDefaultSpecifier) {
  this.write(node.local.name);
};
ezra.ImportSpecifier = function (node: ImportSpecifier) {
  this.write(node.imported.name);
  if (node.local.name !== node.imported.name) {
    this.write(" as ");
    this.write(node.local.name);
  }
};
ezra.ExportNamedDeclaration = function (node: ExportNamedDeclaration) {
  this.write("export ");
  if (node.declaration === null) {
    this.write("{ ");
    this.sequence(node.specifiers);
    this.write(" }");
  } else {
    this.render(node.declaration);
    return;
  }
  if (node.source !== null) {
    this.write(" from ");
    this.render(node.source);
  }
  this.write(";");
};
ezra.ExportDefaultDeclaration = function (node: ExportDefaultDeclaration) {
  this.write("export default ");
  this.render(node.declaration);
  this.write(";");
};
ezra.ExportSpecifier = function (node: ExportSpecifier) {
  this.write(node.local.name);
  if (node.local.name !== node.exported.name) {
    this.write(" as ");
    this.write(node.exported.name);
  }
};
ezra.ExportAllDeclaration = function (node: ExportAllDeclaration) {
  this.write("export *");
  if (node.exported !== null) {
    this.write(" as ");
    this.render(node.exported);
  }
  this.write(" from ");
  this.render(node.source);
};
ezra.LabeledStatement = function (node: LabeledStatement) {
  this.write(node.label.name + ":");
  this.space();
  this.renderTopLevel(node.body);
};
ezra.EmptyStatement = function (node: EmptyStatement) {
  this.write(";");
};
ezra.IfStatement = function (node: IfStatement) {
  this.write("if");
  this.space();
  this.write("(");
  this.render(node.test);
  this.write(")");
  this.space();
  if (
    (this.lineLength >= 25 && node.consequent?.type !== "BlockStatement") ||
    !["ExpressionStatement", "BlockStatement"].includes(
      node.consequent?.type ?? ""
    )
  ) {
    this.indentLevel++;
    this.newline();
    this.renderTopLevel(node.consequent);
    this.indentLevel--;
  } else this.renderTopLevel(node.consequent);
  if (node.alternate !== null) {
    if (node.consequent?.type !== "BlockStatement") this.newline();
    else this.space();
    this.write("else ");
    this.renderTopLevel(node.alternate);
  }
};
ezra.WhileStatement = function (node: WhileStatement) {
  this.write("while");
  this.space();
  this.write("(");
  this.render(node.test);
  this.write(")");
  this.space();
  this.renderTopLevel(node.body);
};
ezra.DoWhileStatement = function (node: DoWhileStatement) {
  this.write("do ");
  this.renderTopLevel(node.body);
  if (node.body?.type !== "BlockStatement") this.newline();
  else this.space();
  this.write("while");
  this.space();
  this.write("(");
  this.render(node.test);
  this.write(");");
};
ezra.SwitchStatement = function (node: SwitchStatement) {
  this.write("switch");
  this.space();
  this.write("(");
  this.render(node.discriminant);
  this.write(")");
  this.space();
  this.write("{");
  if (node.cases.length) {
    this.indentLevel++;
    this.newline();
    for (let i = 0; node.cases[i]; i++) {
      this.render(node.cases[i]);
      if (i !== node.cases.length - 1) this.newline();
    }
    this.indentLevel--;
    this.newline();
  }
  this.write("}");
};
ezra.SwitchCase = function (node: SwitchCase) {
  if (node.test !== null) {
    this.write("case ");
    this.render(node.test);
    this.write(":");
  } else this.write("default:");
  if (node.consequent.length) {
    this.indentLevel++;
    this.newline();
    for (let i = 0; node.consequent[i]; i++) {
      this.renderTopLevel(node.consequent[i]);
      if (i !== node.consequent.length - 1) this.newline();
    }
    this.indentLevel--;
  }
};
ezra.ForStatement = function (node: ForStatement) {
  this.write("for");
  this.space();
  this.write("(");
  if (node.init !== null) {
    this.render(node.init);
    if (node.init.type.endsWith("Expression")) this.write(";");
  } else this.write(";");
  this.space();
  if (node.test !== null) this.render(node.test);
  this.write(";");
  this.space();
  if (node.update !== null) this.render(node.update);
  this.write(")");
  this.space();
  this.renderTopLevel(node.body);
};
ezra.ForOfStatement = function (node: ForOfStatement) {
  this.write("for");
  if (node.await) this.write(" await");
  this.space();
  this.write("(");
  this.render(node.left);
  // Erase semicolon.
  if (node.left.type === "VariableDeclaration") this.erase();
  this.write(" of ");
  this.render(node.right);
  this.write(")");
  this.space();
  this.renderTopLevel(node.body);
};
ezra.ForInStatement = function (node: ForInStatement) {
  this.write("for");
  this.space();
  this.write("(");
  this.render(node.left);
  // Erase semicolon.
  if (node.left.type === "VariableDeclaration") this.erase();
  this.write(" in ");
  this.render(node.right);
  this.write(")");
  this.space();
  this.renderTopLevel(node.body);
};
ezra.BreakStatement = function (node: BreakStatement) {
  this.write("break;");
};
ezra.ContinueStatement = function (node: ContinueStatement) {
  this.write("continue");
  if (node.label !== null) this.write(" " + node.label.name);
  this.write(";");
};
ezra.ReturnStatement = function (node: ReturnStatement) {
  this.write("return");
  if (node.argument !== null) {
    this.write(" ");
    this.render(node.argument);
  }
  this.write(";");
};
ezra.ThrowStatement = function (node: ThrowStatement) {
  this.write("throw ");
  this.render(node.argument);
  this.write(";");
};
ezra.TryStatement = function (node: TryStatement) {
  this.write("try ");
  this.render(node.block);
  if (node.handler !== null) {
    this.space();
    this.write("catch");
    this.space();
    if (node.handler.param !== null) {
      this.write("(");
      this.write(node.handler.param.name);
      this.write(")");
      this.space();
    }
    this.render(node.handler.body);
  }
  if (node.finalizer !== null) {
    this.space();
    this.write("finally");
    this.space();
    this.render(node.finalizer);
  }
};
