import {
  existsSync,
  lstatSync,
  mkdirSync,
  PathLike,
  readdirSync,
  readFileSync,
  writeFile,
} from "fs";
import { basename, resolve } from "path";
import Errors from "../errors";

/**
 * Copy a file from one path to another in base 64.
 */
export function copy(src: PathLike, dest: PathLike) {
  writeFile(dest, readFileSync(src), "base64", () => {});
}

/**
 * Returns true if a specified path exists and leads to a file.
 */
export function fileExists(srcpath: PathLike) {
  return existsSync(srcpath) && !lstatSync(srcpath).isDirectory();
}

export interface datingOptions {
  noDate?: boolean;
}
export function newTimeStamp(options?: datingOptions) {
  function nte(unit: number) {
    return `${unit.toString().length === 1 ? `0${unit}` : unit}`;
  }
  let d = new Date();
  return `${nte(d.getHours())}:${nte(d.getMinutes())}:${nte(d.getSeconds())}${
    options?.noDate ? "" : `|${d.getDay()}-${d.getMonth()}-${d.getFullYear()}`
  }`;
}
export function forceCreatePath(source: PathLike) {
  let routes = resolve(source.toString()).split(/\\|\//);
  for (let index = 1; routes[index]; index++) {
    let resolvedPath = routes.slice(0, index).join("/");
    if (!existsSync(resolvedPath)) {
      mkdirSync(resolvedPath);
    }
  }
}

/**
 * Returns the filename of a file without its extension.
 */
export function getFileName(source: PathLike) {
  return basename(source.toString()).split(".").slice(0, -1).join(".");
}

export interface fileGetterOptions {
  ext?: string;
  exclude?: Array<PathLike>;
}
/**
 * Returns a list of all the files in all the subdirectories in a given directory.
 * @param {PathLike} path Path to the folder to get files from.
 * @param {fileGetterOptions} options Optional arguments, such as file extensions to get exclusively.
 */
export function getAllFiles(
  path: PathLike,
  options?: fileGetterOptions
): string[] {
  let fileList: Array<string | string[]> = [];
  if (!lstatSync(path).isDirectory()) Errors.enc("NOT_A_DIRECTORY", path);
  readdirSync(path).forEach((pathChild) => {
    if (!options?.exclude?.includes(`${path}/${pathChild}`)) {
      if (lstatSync(`${path}/${pathChild}`).isDirectory()) {
        fileList.push(getAllFiles(`${path}/${pathChild}/`));
      } else {
        fileList.push(`${path}/${pathChild}/`);
      }
    } else return [];
  });
  return fileList.flat(1);
}

export function relativePath(from: PathLike, to: string): string {
  let rootPaths: string[] = resolve(from.toString())
    .split("\\")
    .filter((route) => route !== "");
  switch (true) {
    case to.startsWith("http://"):
    case to.startsWith("https://"):
      return to;
    case to.startsWith("../"):
      do {
        rootPaths.pop();
        to = to.slice(3);
      } while (to.startsWith("../"));
      return rootPaths.slice(0, -1).join("\\") + "\\" + to;
    case to.startsWith("/"):
      return to.slice(1);
    case to.startsWith("./"):
      return rootPaths.slice(0, -1).join("\\") + "\\" + to.slice(2);
    default:
      return rootPaths.slice(0, -1).join("\\") + "\\" + to;
  }
}
