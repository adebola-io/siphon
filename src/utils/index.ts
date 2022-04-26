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
import { fileGetterOptions } from "../types";
import Errors from "../errors";

/**
 * Copy a file from one path to another in base 64.
 */
export function copy(src: PathLike, dest: PathLike) {
  writeFile(dest, readFileSync(src), "base64", () => {});
}
export function tryMkingDir(src: PathLike) {
  if (!existsSync(src)) mkdirSync(src);
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
/**
 * Checks if a character belongs to a list of space characters. e.g. spaces and new lines.
 * @param character Character to check.
 * @returns true | false.
 */
export function isSpaceCharac(character: string): boolean {
  return /\u0020|\u0009|\u000A|\u000C|\u000D/.test(character);
}
/**
 * Checks if a character exists in the text of a source file and throws an error if it is undefined.
 * @param character The character to check.
 * @param source The source file text to throw an error from.
 */
export function checkForEnd(character: string, source: PathLike): void {
  if (!character) Errors.enc("ABRUPT", source);
}

export function isForeignTag(tagName: string | undefined): boolean {
  return tagName ? ["script", "style"].includes(tagName) : false;
}

export function isVoid(tagName: string | undefined): boolean {
  return tagName
    ? [
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
        "module",
      ].includes(tagName)
    : false;
}
export const stringMarkers: Array<string> = ["'", "`", '"'];
export const imageExts: Array<string> = [
  ".png",
  ".jpeg",
  ".jpg",
  ".bmp",
  ".svg",
  ".gif",
  ".webp",
];
/**
 * COnfirm if a character is a numeric digit.
 * @param char The character to evaluate.
 */
export function isDigit(char?: string) {
  return char ? char.charCodeAt(0) >= 48 && char.charCodeAt(0) <= 57 : false;
}
export function isNum(char: string | undefined) {
  return char
    ? char.replace(/[0-9]/g, "").replace(/\./, "") === "" &&
        !Number.isNaN(Number(char))
    : false;
}
export function isAlphabetic(char: string | undefined) {
  return char ? char.replace(/[a-z]|[A-Z]/g, "") === "" : false;
}
export function isNewLine(char: string | undefined) {
  return char ? char === "\n" : false;
}
export function isBracket(char: string) {
  return char.length === 1 && /\(|\)|\[|\]/.test(char);
}
export function lastRealChar(str: string) {
  let i = str.length - 1;
  while (str[i] && /\n|\r|\s/.test(str[i])) i--;
  return { character: str[i], index: i };
}
export function last(array: Array<any>) {
  return array[array.length - 1];
}
export function splice(str: string) {
  return {
    at: function (index: number, input?: string) {
      return (
        str.slice(0, index + 1) + (input ?? "") + (str.slice(index + 1) ?? "")
      );
    },
  };
}
/**Javascript Keywords */
export const keywords = [
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
export const JSkeywords = {
  ES1: [
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
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
  ],
  ES3: [
    "abstract",
    "boolean",
    "byte",
    "char",
    "class",
    "double",
    "enum",
    "export",
    "extends",
    "final",
    "float",
    "goto",
    "implements",
    "import",
    "int",
    "interface",
    "long",
    "native",
    "package",
    "private",
    "protected",
    "public",
    "short",
    "static",
    "super",
    "synchronized",
    "throws",
    "transient",
    "volatile",
  ],
  ES5: [
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
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "implements",
    "import",
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
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
  ],
};
export const declarators = ["const", "var", "let"];
export const operators = {
  /** Single character operators that ignore space charaters before and after. */
  _ignore1_: [
    "+",
    "-",
    "*",
    "/",
    "%",
    "|",
    ":",
    "&",
    "^",
    "=",
    ".",
    "^",
    ">",
    "<",
    ",",
    ";",
  ],
  /** Single character operators that only ignore the succeeding space characters. */
  _suceeding1_: ["!", "~", "(", "{", "["],
  /** Single character operators that only ignore the preceeding space characters. */
  _preceeding1_: ["}", "]", ")"],
  /** Double character operators that ignore space characters before and after. */
  _ignore2_: [
    "&&",
    "||",
    "??",
    "~~",
    "**",
    "+=",
    "=>",
    "-=",
    "?.",
    "|=",
    "!=",
    "*=",
    "%=",
    "&=",
    "^=",
    ">=",
    "<=",
    "==",
    ">>",
    "<<",
  ],
  /**Double character operators that only ignore the succeeding space characters. */
  _suceeding2_: ["++", "--"],
  /** Triple character operators that ignore space characters before and after */
  _ignore3_: ["===", "!==", "<<=", ">>=", "**=", ">>>", "||=", "&&=", "??="],
  /** Triple character operators that ignore the succeeding space characters */
  _suceeding3_: ["..."],
  /** Quadruple character operators that ignore space characters before and after */
  _ignore4_: [">>>="],
};

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
    col = 1;
  let sourceText = readFileSync(source).toString();
  while (i < character) {
    if (sourceText[i] === "\n") {
      line++;
      col = 0;
    }
    i++;
    col++;
  }
  return { line, col: col + 1 };
}
export function isAlphaNumeric(character: string | undefined) {
  return isAlphabetic(character) || isNum(character);
}
export function isValidIdentifierCharacter(char: string) {
  return isAlphabetic(char) || isNum(char) || /\$|\_/.test(char);
}
/**
 * Confirm validity of CSS identifiers.
 * @param identifier
 * @returns
 */
export function isIllegalCSSIdentifier(identifier: string) {
  return (
    /[0-9]/.test(identifier[0]) ||
    /\?|#|\$|`|'|"|&|\(|\)|@|;|,|\[|\]|\%|\+|\*|\=/.test(identifier)
  );
}
export function getMIMEType(ext: string) {
  switch (ext) {
    case "aac":
      return "audio/aac";
    case "abw":
      return "application/x-abiword";
    case "arc":
      return "audio/x-freearc";
    case "avif":
      return "image/avif";
    case "avi":
      return "video/x-msvideo";
    case "azw":
      return "application/vnd.amazon.ebook";
    case "bin":
      return "application/octet-stream";
    case "bmp":
      return "image/bmp";
    case "bz":
      return "application/x-bzip";
    case "bz2":
      return "application/x-bzip2";
    case "cda":
      return "application/x-cdf";
    case "csh":
      return "application/x-csh";
    case "css":
      return "text/css";
    case "csv":
      return "text/csv";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "eot":
      return "application/vnd.ms-fontobject";
    case "epub":
      return "application/epub+zip";
    case "gz":
      return "application/gzip";
    case "gif":
      return "image/gif";
    case "htm":
      return "text/html";
    case "ico":
      return "image/vnd.microsoft.icon";
    case "ics":
      return "text/calendar";
    case "jar":
      return "application/java-archive";
    case "jpg":
    case "jpeg":
      return "image/jpg";
    case "js":
    case "mjs":
      return "text/javascript";
    case "json":
      return "application/json";
    case "jsonld":
      return "application/ld+json";
    case "mid":
      return "audio/midi";
    case "midi":
      return "audio/x-midi";
    case "json":
      return "application/json";
    case "mp3":
      return "audio/mpeg";
    case "mp4":
      return "video/mp4";
    case "mpeg":
      return "video/mpeg";
    case "mpkg":
      return "application/vnd.apple.installer+xml";
    case "odp":
      return "application/vnd.oasis.opendocument.presentation";
    case "ods":
      return "application/vnd.oasis.opendocument.spreadsheet";
    case "odt":
      return "application/vnd.oasis.opendocument.text";
    case "oga":
      return "audio/ogg";
    case "ogv":
      return "video/ogg";
    case "ogx":
      return "application/ogg";
    case "opus":
      return "audio/opus";
    case "otf":
      return "font/otf";
    case "png":
      return "image/png";
    case "pdf":
      return "application/pdf";
    case "php":
      return "application/x-httpd-php";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "rar":
      return "application/vnd.rar";
    case "rtf":
      return "application/rtf";
    case "sh":
      return "application/x-sh";
    case "svg":
      return "image/svg+xml";
    case "swf":
      return "application/x-shockwave-flash";
    case "tar":
      return "application/x-tar";
    case "tiff":
    case "tif":
      return "image/tiff";
    case "ts":
      return "video/mp2t";
    case "ttf":
      return "font/ttf";
    case "txt":
      return "text/plain";
    case "vsd":
      return "application/vnd.visio";
    case "wav":
      return "audio/wav";
    case "weba":
      return "audio/webm";
    case "webm":
      return "video/webm";
    case "webp":
      return "image/webp";
    case "woff":
      return "font/woff";
    case "woff2":
      return "font/woff2";
    case "xhtml":
      return "application/xhtml+xml";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xml":
      return "application/xml";
    case "xul":
      return "application/vnd.mozilla.xul+xml";
    case "zip":
      return "application/zip";
    case "3gp":
      return "video/3gpp2";
    case "7z":
      return "application/x-7z-compressed";
    default:
      return `application/octet-stream`;
  }
}

export function stringifytoBase64(file: PathLike) {
  return `data:${getMIMEType(
    extname(file.toString()).slice(1).toLowerCase()
  )};base64,${readFileSync(file, { encoding: "base64" })}`;
}
export const OPERATORS = operators._ignore1_.concat(
  operators._ignore2_,
  operators._ignore3_,
  operators._ignore4_,
  operators._preceeding1_,
  operators._suceeding1_,
  operators._suceeding2_,
  operators._suceeding3_
);
export const precedence: any = {
  "(": 19,
  ")": 19,
  ".": 18,
  "[": 18,
  new: 18,
  "?.": 18,
  postfix: 16,
  prefix: 15,
  "**": 14,
  "*": 13,
  "/": 13,
  "%": 13,
  "+": 12,
  "-": 12,
  "<<": 11,
  ">>": 11,
  ">>>": 11,
  "<": 10,
  ">": 10,
  "<=": 10,
  ">=": 10,
  in: 10,
  instanceof: 10,
  "===": 9,
  "==": 9,
  "!==": 9,
  "!=": 9,
  "&": 8,
  "^": 7,
  "|": 6,
  "&&": 5,
  "||": 4,
  "??": 4,
  "?": 3,
  "=": 2,
  "=>": 2,
  ",": 1,
  none: 0,
};
export function assoc(operator: string) {
  return /\*\*|\?|\=/.test(operator) ? "RL" : "LR";
}
export const counterpart: any = {
  "[": "]",
  "(": ")",
  "{": "}",
};
