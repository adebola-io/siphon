import { PathLike } from "fs";
import { bundler_internals } from "./base";
import { bundlerOptions } from "./utils";

class Bundler {
  bundle(entry: PathLike, options?: bundlerOptions) {
    return new bundler_internals().bundle(entry, options);
  }
}

export default Bundler;
