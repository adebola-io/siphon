/*
 * Ezra is a simple Typescript-based JavaScript parser, and is one of the parsing engines that power Siphon.
 * Ezra was written by Adebola Akomolafe and is available for use in Siphon under an MIT license.
 */
import Parser, { parserOptions } from "./parser";
import Generator, { generatorOptions } from "./generator";
import Bundler from "./bundler";
import { JSNode, Program } from "../../types";
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
  traverse(node: JSNode, config: Config) {
    const traverser = new Traverser();
    return traverser.traverse(node, config);
  },
  bundle(entry: PathLike, options?: bundlerOptions) {
    const bundler = new Bundler();
    return bundler.bundle(entry, options);
  },
};

export default Ezra;
