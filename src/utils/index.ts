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
import { fileGetterOptions } from "../types";
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

export function isSpaceCharac(character: string): boolean {
  return /\u0020|\u0009|\u000A|\u000C|\u000D/.test(character);
}

export function illegalCSSIdentifierCharacter(character: string) {
  return /\u0020|\u0009|\u000A|\u000C|\u000D|"/.test(character);
}

export function checkForEnd(character: string, source: PathLike): void {
  if (!character) Errors.enc("ABRUPT", source);
}

export function isForeignTag(tagName: string | undefined): boolean {
  return tagName ? ["script", "style"].includes(tagName) : false;
}

export function isVoid(tagName: string | undefined): boolean {
  if (tagName)
    return [
      "!DOCTYPE",
      "area",
      "base",
      "br",
      "col",
      "command",
      "embed",
      "hr",
      "img",
      "input",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ].includes(tagName);
  else return false;
}
export const stringMarkers: Array<string> = ["'", "`", '"'];
export const imageExts: Array<string> = [".png", ".jpeg", ".jpg", ".bmp"];

export function isNum(char: string) {
  return char.replace(/[0-9]/g, "").replace(/./, "") === "";
}

export const reservedKeyWord = [
  "arguments",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "eval",
  "extends",
  "import",
  "export",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "return",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "synchronized",
  "this",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
];
export const statementTerminators = [",", ";"];
export const operands = ["+", "-", "*", "/"];
export function isValidStart(character: string) {
  return !/\*|^|\%/.test(character);
}
/**
 * Find the column number and line number of a character in a file.
 * @param source The file to search through
 * @param character The number to find.
 */
export function trace(source: PathLike, character: number) {
  let i = 1,
    line = 1,
    col = 2;
  let sourceText = readFileSync(source).toString();
  while (i < character) {
    if (sourceText[i] === "\n") {
      line++;
      col = 0;
    }
    i++;
    col++;
  }
  return { line, col };
}

export function isAlphaNumeric(character: string) {
  return /[A-Za-z0-9]/.test(character);
}
