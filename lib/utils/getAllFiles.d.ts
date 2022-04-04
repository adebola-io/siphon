/// <reference types="node" />
import * as fs from "fs";
export interface fileGetterOptions {
    ext?: string;
    exclude?: Array<fs.PathLike>;
}
/**
 * Returns a list of all the files in all the subdirectories in a given directory.
 * @param {fs.PathLike} path Path to the folder to get files from.
 * @param {fileGetterOptions} options Optional arguments, such as file extensions to get exclusively.
 */
declare function getAllFiles(path: fs.PathLike, options?: fileGetterOptions): string[];
export default getAllFiles;
