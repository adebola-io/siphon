import { Program } from "../../../../types";
import { ezra_gen_internals } from "./base";
import "./statement";
import "./expression";
export interface generatorOptions {
  format?: boolean;
  indent?: number;
  skipUnusedVars?: boolean;
}
export const defaults: generatorOptions = {
  format: true,
  indent: 0,
  skipUnusedVars: false,
};
class Generator {
  generate(node: Program, options?: generatorOptions) {
    return new ezra_gen_internals().generate(node, options);
  }
}

export default Generator;
