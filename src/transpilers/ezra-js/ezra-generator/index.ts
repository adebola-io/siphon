import { Program } from "../../../types";
import { ezra_gen_internals } from "./base";
import "./declarations";
import "./expressions";
import "./statements";
export interface generatorOptions {
  format: boolean;
}
export const defaults: generatorOptions = {
  format: true,
};
class Generator {
  generate(node: Program, options?: generatorOptions) {
    return new ezra_gen_internals().generate(node, options);
  }
}

export default Generator;
