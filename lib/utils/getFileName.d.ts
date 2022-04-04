/// <reference types="node" />
import { PathLike } from "fs";
/**
 * Returns the filename of a file without its extension.
 */
declare function getFileName(source: PathLike): string;
export default getFileName;
