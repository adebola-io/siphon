/*
 * Ezra is a simple Typescript-based JavaScript parser, and is one of the parsing engines that power Siphon.
 * Ezra was written by Adebola Akomolafe and is available for use in Siphon under an MIT license.
 */
import Parser, { parserOptions } from "./parser";
import Generator, { generatorOptions } from "./generator";
import Bundler from "./bundler";
import { JSNode, Program } from "../../../types";
import Traverser from "./traverser";
import { Config } from "./traverser/config";
import { bundlerOptions } from "./bundler/utils";
import { PathLike } from "fs";

const Ezra = {
  /**
   * Ezra's `parse()` function takes in a string of valid Javasript text and attempts to generate an Abstract Syntax Tree from its content.
   * If the content is syntactically inaccurate, it throws an error using Siphon's Error handling system.
   */
  parse(text: string, options?: parserOptions) {
    const parser = new Parser();
    return parser.parse(text, options);
  },
  /**
   * The `generate()` function does the reverse of parsing.
   * It receives the AST created by the `parse()` function and generates valid Javascript text from its nodes and their relationships.
   */
  generate(node: Program, options?: generatorOptions) {
    const generator = new Generator();
    return generator.generate(node, options);
  },
  /**
   * The `traverse()` function takes in a Javascript AST node and recursively visits all its attached nodes and all their own attached nodes, performing a defined operation based on the type of node visited.
   * @param node The node to traverse, e.g. a Program node, Function Declaration node, etc.
   * @param config The configuration is an object of methods with names that match defined node types. When the node with the matching type is visited, the method will be run.
   * For example:
   * ```js
   * var ast = Ezra.parse('2+3+4');
   * Ezra.traverse(ast, {
   *    Literal: (node, path)=> console.log(node.value) // will log 2, 3, and 4.
   * })
   * ```
   */
  traverse(node: JSNode, config: Config): void {
    const traverser = new Traverser();
    return traverser.traverse(node, config);
  },
  /**
   * The `bundle()` function reads through a Javascript file and recursively determines all its dependencies. It then concatenates all these files together, creating a single Abstract Syntax Tree of the combined dependencies.
   * @param entry The starting Javascript file.
   * @param options The bundling options.
   * @returns The AST of the generated bundle
   */
  bundle(entry: PathLike, options?: bundlerOptions) {
    const bundler = new Bundler();
    return bundler.bundle(entry, options);
  },
};

export default Ezra;
