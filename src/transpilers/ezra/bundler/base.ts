import { bundlerOptions, bundler_utils, defaults } from "./utils";
import { PathLike } from "fs";
import { FunctionDeclaration, Program } from "../../../types";
import { callExpression } from "../traverser/helpers/creator";
import Ezra from "..";
// import change_variable_names from "../traverser/examples/change_variable_names";
import transform_class_to_prototype from "../traverser/examples/transform_class_to_prototype";
import transform_template_literals from "../traverser/examples/transform_template_literals";
import resolve_optional_chaining from "../traverser/examples/resolve_optional_chaining";
import resolve_nullish_coalescing from "../traverser/examples/resolve_nullish_coalescing";

export class bundler_internals extends bundler_utils {
  bundle(entry: PathLike, options?: bundlerOptions) {
    this.options = { ...defaults, ...options };
    this.tree = new Program(0);
    this.entry = entry;
    this.start(entry);
    // Add a function call to the entry module.
    if (this.tree.body[1] instanceof FunctionDeclaration) {
      this.tree.push(callExpression(this.tree.body[1].id, []));
    }
    // change_variable_names(this.tree);
    // Preset transformations.
    Ezra.traverse(this.tree, {
      ClassDeclaration: transform_class_to_prototype,
      TemplateLiteral: transform_template_literals,
      MemberExpression: resolve_optional_chaining,
      LogicalExpression: resolve_nullish_coalescing,
    });
    return this.tree;
  }
}
