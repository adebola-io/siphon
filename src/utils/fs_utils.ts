import {
  existsSync,
  lstatSync,
  mkdirSync,
  PathLike,
  readdirSync,
  readFileSync,
  writeFile,
} from "fs";
import { basename, extname, resolve } from "path";
import Errors from "../errors";
import { fileGetterOptions } from "../types";
import { getMIMEType } from "./parsing_utils";

/**
 * Copy a file from one path to another in base 64.
 */
export function copyInBase64(src: PathLike, dest: PathLike) {
  writeFile(dest, readFileSync(src), "base64", () => {});
}
/**
 * Transform a file to a base 64 string
 * @param file The file to transform.
 */
export function stringifytoBase64(file: PathLike) {
  return `data:${getMIMEType(
    extname(file.toString()).slice(1).toLowerCase()
  )};base64,${readFileSync(file, { encoding: "base64" })}`;
}
/**
 * Make a directory if it doesn't exist.
 */
export function tryMkingDir(src: PathLike) {
  if (!(existsSync(src) && lstatSync(src).isDirectory())) mkdirSync(src);
}
/**
 * Returns true if a specified path exists and leads to a file.
 */
export function fileExists(srcpath: PathLike) {
  return existsSync(srcpath) && !lstatSync(srcpath).isDirectory();
}
/**
 * Forcefully create a directory that may or may not exist.
 * @param source The path to create.
 */
export function forceCreateDir(source: PathLike) {
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

/**
 * Resolves a relative path between two files.
 * @param from The source where the path is specified from.
 * @param to The path specified.
 * @returns The absolute path.
 */
export function relativePath(from: PathLike, to: string): string {
  let rootPaths: string[] = resolve(from.toString())
    .split("\\")
    .filter((route) => route !== "");
  switch (true) {
    case to.includes(":"):
      return to;
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
      return resolve(to.slice(1));
    case to.startsWith("./"):
      return rootPaths.slice(0, -1).join("\\") + "\\" + to.slice(2);
    case to.replace(" ", "") === "":
      Errors.enc("FILE_NON_EXISTENT", "");
    default:
      return rootPaths.slice(0, -1).join("\\") + "\\" + to;
  }
}
