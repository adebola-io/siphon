import { bundlerOptions, bundler_utils, defaults } from "./utils";
import { PathLike } from "fs";
import { FunctionDeclaration, Program } from "../../../../types";
import { callExpression } from "../traverser/helpers/creator";
import Ezra from "..";
import transform_class_to_prototype from "../traverser/examples/transform_class_to_prototype";
import transform_template_literals from "../traverser/examples/transform_template_literals";
import resolve_optional_chaining from "../traverser/examples/resolve_optional_chaining";
import resolve_nullish_coalescing from "../traverser/examples/resolve_nullish_coalescing";
import rewrite_destructured_variables from "../traverser/examples/rewrite_destructured_variables";
import transpileJSX from "../traverser/examples/JSX_transpiling/transpile_jsx";
import transform_arrow_functions from "../traverser/examples/transform_arrow_functions";
import default_handler from "../traverser/examples/JSX_transpiling/default_handler";
import default_parameters from "../traverser/examples/default_parameters";

export class bundler_internals extends bundler_utils {
  bundle(entry: PathLike, options?: bundlerOptions) {
    this.options = { ...defaults, ...options };
    this.tree = new Program(0);
    this.entry = entry;
    this.start(entry);
    // Add JSX Handler.
    var defaultJSXFunctionName = this.uniqueIdentifier("").name;
    if (this.hasJSX) this.tree.push(default_handler(defaultJSXFunctionName));
    // Add a function call to the entry module.
    if (this.tree.body[1] instanceof FunctionDeclaration) {
      this.tree.push(callExpression(this.tree.body[1].id, []));
    }
    // Preset transformations.
    Ezra.traverse(this.tree, {
      enter: default_parameters,
      ClassDeclaration: transform_class_to_prototype,
      TemplateLiteral: transform_template_literals,
      MemberExpression: resolve_optional_chaining,
      ArrowFunctionExpression: transform_arrow_functions,
      LogicalExpression: resolve_nullish_coalescing,
      VariableDeclaration: rewrite_destructured_variables,
      ChainExpression: (node) => node.expression,
      JSXElement: (node, path) =>
        transpileJSX(node, path, defaultJSXFunctionName),
    });
    // mangle_variables(this.tree);
    return this.tree;
  }
}
