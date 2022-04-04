/// <reference types="node" />
import * as fs from "fs";
import { siphonOptions } from "../../types";
declare function bundler(source: fs.PathLike): {
    into(destination: fs.PathLike, options: siphonOptions): true | undefined;
};
export default bundler;
