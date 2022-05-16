import {
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  FunctionDeclaration,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  VariableDeclaration,
} from "../../../../types";
import { ezra } from "./base";

ezra.importDeclaration = function () {
  if (
    this.contexts.top() !== "global" ||
    this.scope.body.find((node) => node.type !== "ImportDeclaration")
  ) {
    this.raise("JS_ILLEGAL_IMPORT");
  }
  const importdec = new ImportDeclaration(this.j - 6);
  if (this.eat("{")) {
    const importspecs = this.group("import");
    if (importspecs === undefined) this.raise("IDENTIFIER_EXPECTED");
    else importdec.specifiers.push(...importspecs);
  } else if (this.text[this.i] === "*") {
    const namespce = new ImportNamespaceSpecifier(this.j);
    this.next();
    this.outerspace();
    if (!this.match("as")) this.raise("EXPECTED", "as");
    this.outerspace();
    namespce.local = this.identifier();
    namespce.loc.end = namespce.local.loc.end;
    importdec.specifiers.push(namespce);
  } else if (/'|"/.test(this.text[this.i])) {
    importdec.source = this.stringLiteral();
    importdec.loc.end = this.j;
    this.outerspace();
    this.eat(";");
    return importdec;
  } else {
    const defaultdec = new ImportDefaultSpecifier(this.j);
    defaultdec.local = this.identifier();
    defaultdec.loc.end = defaultdec.local.loc.end;
    importdec.specifiers.push(defaultdec);
    this.outerspace();
    if (this.eat(",")) {
      this.outerspace();
      if (!this.eat("{")) this.raise("OPEN_CURLY_EXPECTED");
      else {
        const importspecs = this.group("import");
        if (importspecs === undefined) this.raise("IDENTIFIER_EXPECTED");
        else importdec.specifiers.push(...importspecs);
      }
    }
  }
  this.outerspace();
  if (this.match("from")) {
    this.outerspace();
    if (!/'|"/.test(this.text[this.i])) this.raise("JS_UNEXPECTED_TOKEN");
    importdec.source = this.stringLiteral();
  } else this.raise("EXPECTED", "from");
  importdec.loc.end = this.j;
  this.outerspace();
  this.eat(";");
  return importdec;
};
ezra.importSpecifier = function () {
  const importspec = new ImportSpecifier(this.j - 1);
  this.outerspace();
  importspec.imported = this.identifier();
  this.outerspace();
  switch (true) {
    case this.text[this.i] === ",":
    default:
      importspec.local = importspec.imported;
      break;
    case this.match("as"):
      this.outerspace();
      importspec.local = this.identifier();
      this.outerspace();
      break;
  }
  importspec.loc.end = this.j;
  if (this.text[this.i] !== "}") this.next();
  return importspec;
};
ezra.exportDeclaration = function () {
  const start = this.j - 6;
  this.outerspace();
  if (this.match("default")) {
    //   Default exports.
    const exportDefDec = new ExportDefaultDeclaration(start);
    this.outerspace();
    exportDefDec.declaration = this.expression();
    exportDefDec.loc.end = exportDefDec.declaration.loc.end;
    this.outerspace();
    this.eat(";");
    return exportDefDec;
  } else if (this.text[this.i] === "*") {
    //   export *
    this.next();
    this.outerspace();
    const expAll = new ExportAllDeclaration(start);
    // export * as
    if (this.match("as")) {
      this.outerspace();
      expAll.exported = this.identifier();
      this.outerspace();
    } else expAll.exported = null;
    // export * as xxxx from '', export * from ''
    if (this.match("from")) {
      this.outerspace();
      expAll.source = this.stringLiteral();
      expAll.loc.end = expAll.source.loc.end;
    } else this.raise("EXPECTED", "from");
    this.outerspace();
    this.eat(";");
    return expAll;
  } else {
    //   export {} from, export declarations.
    const exportDec = new ExportNamedDeclaration(start);
    if (this.eat("{")) {
      exportDec.specifiers = this.group("export");
      exportDec.loc.end = this.j;
      this.outerspace();
      if (this.match("from")) {
        this.outerspace();
        exportDec.source = this.stringLiteral();
        exportDec.loc.end = this.j;
      } else exportDec.source = null;
    } else {
      exportDec.declaration = this.statement();
      if (
        !(exportDec.declaration instanceof FunctionDeclaration) &&
        !(exportDec.declaration instanceof VariableDeclaration)
      ) {
        this.raise(
          "JS_DEC_OR_STATEMENT_EXPECTED",
          this.text[this.i],
          exportDec.declaration?.loc.start
        );
      }
      exportDec.source = null;
      exportDec.loc.end = exportDec.declaration?.loc.end;
    }
    this.outerspace();
    this.eat(";");
    return exportDec;
  }
};
ezra.exportSpecifier = function () {
  const expSpec = new ExportSpecifier(this.j);
  const mirror = this.importSpecifier();
  expSpec.local = mirror.imported;
  expSpec.exported = mirror.local;
  expSpec.loc.end = mirror.loc.end;
  return expSpec;
};
