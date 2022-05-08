import { PathLike, readFileSync, writeFileSync } from "fs";
import {
  HTMLDocumentNode,
  Program,
  JSNode,
  Identifier,
  Literal,
  ObjectPattern,
  ArrayPattern,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportAllDeclaration,
  ClassDeclaration,
  FunctionDeclaration,
  VariableDeclaration,
  ExportSpecifier,
  siphonOptions,
  VariableDeclarator,
} from "../../types";
import Errors from "../../errors";
import { relativePath, fileExists, getFileName } from "../../utils";
import tagNameSearch from "../parser/html/tagNameSearch";
import Ezra from "../../transpilers/ezra";
import { resolve } from "path";

/**
 * Perform required transformations on the relationship between Javascript and HTML
 */
class JavascriptResolve {
  resolveJS(
    nodes: HTMLDocumentNode[],
    source: PathLike,
    options: siphonOptions,
    destination: PathLike
  ) {
    this.nodes = nodes;
    this.source = source;
    this.destination = destination;
    this.options = options;
    this.start();
    return nodes;
  }
  start() {
    this.scripts = tagNameSearch(this.nodes, "script").filter(
      (s) => s.attributes?.src?.length
    );
    var body: HTMLDocumentNode = tagNameSearch(this.nodes, "body")[0];
    var script,
      outputAst = new Program(0);
    for (let i = 0; this.scripts[i]; i++) {
      script = this.scripts[i];
      let pathToFile = relativePath(this.source, script.attributes.src);
      if (script.attributes.type === "module") this.isModule = true;
      else this.isModule = false;
      if (!fileExists(pathToFile)) Errors.enc("FILE_NON_EXISTENT", pathToFile);
      outputAst.body = outputAst.body.concat(
        this.buildDependencyGraph(pathToFile).body
      );
      delete script.type;
    }
    if (this.options.internalJS || this.options.wickedMode) {
      // INTERNAL SCRIPT
      let script: HTMLDocumentNode = {
        tagName: "script",
        type: "element",
        childID: body.children?.length,
        parent: body,
        attributes: {
          type: "module",
        },
        content:
          Ezra.generate(outputAst, {
            format: this.options.formatFiles && !this.options.wickedMode,
            indent: 3,
          }) + (outputAst.body.length ? "\n" : ""),
      };
      body.children?.push(script);
    } else {
      // External scripts.
      let bundle = getFileName(this.destination) + ".bundle.js";
      let outputFolder = resolve(this.options.outDir.toString());
      writeFileSync(
        `${outputFolder}/${bundle}`,
        Ezra.generate(outputAst, {
          format: this.options.formatFiles && !this.options.wickedMode,
          indent: 0,
        })
      );
      let script: HTMLDocumentNode = {
        tagName: "script",
        type: "element",
        childID: body.children?.length,
        parent: body,
        attributes: {
          type: "module",
          src: `./${bundle}`,
        },
      };
      body.children?.push(script);
    }
  }
  scripts!: HTMLDocumentNode[];
  source!: PathLike;
  options!: siphonOptions;
  outputText: string = "";
  isModule = false;
  destination!: PathLike;
  nodes!: HTMLDocumentNode[];
  trail: string[] = [];
  /**
   * Read through a Javascript file and determine its imports.
   * @param mainFile The file to start checking from.
   */
  buildDependencyGraph!: (mainFile: string) => Program;
  settleImports!: (program: Program, programPath: PathLike) => Program;
}

JavascriptResolve.prototype.buildDependencyGraph = function (mainFile) {
  if (this.trail.includes(mainFile)) return new Program(0);
  else this.trail.push(mainFile);
  let fileText = readFileSync(mainFile).toString();
  let mainProgram = Ezra.parse(fileText, { sourceFile: mainFile });
  mainProgram = this.settleImports(mainProgram, mainFile);
  delete mainProgram.imports;
  delete mainProgram.exports;
  return mainProgram;
};
JavascriptResolve.prototype.settleImports = function (program, programPath) {
  if (program.imports?.length && !this.isModule)
    Errors.enc("SOMETHING_WENT_WRONG", programPath);
  program.imports?.forEach((imprt) => {
    let index = program.body.indexOf(imprt);
    // 1. Confirm that the file being imported exists.
    if (typeof imprt.source.value === "string") {
      let importPath = relativePath(programPath, imprt.source.value);
      if (!fileExists(importPath)) {
        // Automatically add the .js or /index.js or mode_modules/ extension to an import if not already present.
        switch (true) {
          case fileExists(importPath + ".js"):
            importPath += ".js";
            break;
          case fileExists(importPath + "/index.js"):
            importPath += "/index.js";
            break;
          case fileExists("node_modules/" + imprt.source.value + "/index.js"):
            importPath = resolve("node_modules/" + imprt.source.value);
            break;
          default:
            Errors.enc("FILE_NON_EXISTENT", importPath);
        }
      }
      if (this.trail.includes(importPath)) {
        program.body.splice(index, 1);
        return;
      } else this.trail.push(importPath);
      //  2. Confirm that the specified imports are being exported from the file.
      const importText = readFileSync(importPath).toString();
      const subProgram = Ezra.parse(importText, { sourceFile: importPath });
      //   Build an export map from all named exports in the imported file.
      //   var exportMap: any = {};
      //   subProgram.exports?.forEach((e: any) => {
      //     if (e.type === "ExportNamedDeclaration") {
      //       if (/Class|Function/.test(e.declaration.type)) {
      //         exportMap[e.declaration.id.name] = e.declaration;
      //       } else if (/Variable/.test(e.declaration.type)) {
      //         e.declaration.declarations.forEach((declaration: any) => {
      //           exportMap[declaration.id.name] = declaration;
      //         });
      //       }
      //     }
      //   });
      imprt.specifiers.forEach((specifier) => {
        if (
          specifier instanceof ImportSpecifier &&
          specifier.imported.name !== specifier.local.name
        ) {
          var newNode = createRenameDec(
            "var",
            specifier.local.name,
            specifier.imported.name
          );
          subProgram.body.push(newNode);
        }
      });
      program.body.splice(index, 1, ...subProgram.body);
    }
  });
  return program;
};
/**
 * Create a new node that reassigns the content of a previous node name to another node.
 * @param kind The type of variable to declare.
 */
function createRenameDec(
  kind: "var" | "const" | "let",
  oldName: string,
  newName: string
) {
  var rename = new VariableDeclaration(0);
  rename.kind = kind;
  var renamedec = new VariableDeclarator(0);
  renamedec.id = new Identifier(0);
  renamedec.id.name = newName;
  var init = new Identifier(0);
  init.name = oldName;
  renamedec.init = init;
  rename.declarations.push(renamedec);
  return rename;
}
export default JavascriptResolve;
