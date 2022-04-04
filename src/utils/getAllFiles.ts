import * as fs from "fs";
import Errors from "../errors";
export interface fileGetterOptions {
  ext?: string;
  exclude?: Array<fs.PathLike>;
}
/**
 * Returns a list of all the files in all the subdirectories in a given directory.
 * @param {fs.PathLike} path Path to the folder to get files from.
 * @param {fileGetterOptions} options Optional arguments, such as file extensions to get exclusively.
 */
function getAllFiles(path: fs.PathLike, options?: fileGetterOptions): string[] {
  let fileList: Array<string | string[]> = [];
  if (!fs.lstatSync(path).isDirectory()) Errors.enc("NOT_A_DIRECTORY", path);
  fs.readdirSync(path).forEach((pathChild) => {
    if (!options?.exclude?.includes(`${path}/${pathChild}`)) {
      if (fs.lstatSync(`${path}/${pathChild}`).isDirectory()) {
        fileList.push(getAllFiles(`${path}/${pathChild}/`));
      } else {
        fileList.push(`${path}/${pathChild}/`);
      }
    } else return [];
  });
  return fileList.flat(1);
}
export default getAllFiles;
