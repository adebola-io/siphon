import * as fs from "fs";
import { ErrorTypes } from "./types";
declare const Errors: {
    enc(type: ErrorTypes, source: fs.PathLike, charac?: number | undefined, options?: any): void;
};
export default Errors;
