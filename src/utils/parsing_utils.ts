import { PathLike, readFileSync } from "fs";
import { relative } from "path";
import Errors from "../core/errors";
import { SiphonError } from "../types";
import { relativePath } from "./fs_utils";

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
/**
 * Checks if an HTML tag name is either a script or a style.
 * @param tagName The tagname to check.
 */
export function isForeignTag(tagName: string | undefined): boolean {
  return tagName ? ["script", "style"].includes(tagName) : false;
}
var voidTags: any = {
  "!DOCTYPE": true,
  area: true,
  base: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
  module: true,
};
export var deprecatedTags: any = {
  acronym: true,
  applet: true,
  basefont: true,
  big: true,
  dir: true,
  font: true,
  frame: true,
  frameset: true,
  noframes: true,
  tt: true,
  center: true,
  strike: true,
};
/**
 * A list of all HTML tags.
 */
export var HTMLTags: any = {
  ...voidTags,
  ...deprecatedTags,
  a: true,
  abbr: true,
  address: true,
  article: true,
  aside: true,
  audio: true,
  b: true,
  bdi: true,
  bdo: true,
  blockquote: true,
  body: true,
  button: true,
  canvas: true,
  caption: true,
  cite: true,
  code: true,
  colgroup: true,
  data: true,
  datalist: true,
  dd: true,
  del: true,
  details: true,
  dfn: true,
  dialog: true,
  div: true,
  dl: true,
  dt: true,
  em: true,
  fieldset: true,
  figcaption: true,
  figure: true,
  footer: true,
  form: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  head: true,
  header: true,
  html: true,
  i: true,
  iframe: true,
  ins: true,
  kbd: true,
  label: true,
  legend: true,
  li: true,
  main: true,
  mark: true,
  menu: true,
  meter: true,
  nav: true,
  noscript: true,
  object: true,
  ol: true,
  optgroup: true,
  option: true,
  output: true,
  p: true,
  picture: true,
  pre: true,
  progress: true,
  q: true,
  rp: true,
  rt: true,
  ruby: true,
  s: true,
  samp: true,
  script: true,
  section: true,
  select: true,
  small: true,
  source: true,
  span: true,
  strong: true,
  style: true,
  sub: true,
  summary: true,
  sup: true,
  svg: true,
  table: true,
  tbody: true,
  td: true,
  template: true,
  textarea: true,
  tfoot: true,
  th: true,
  thead: true,
  title: true,
  time: true,
  tr: true,
  u: true,
  ul: true,
  var: true,
  video: true,
};
/**
 * Checks if an HTML tag name can be void according to the W3C HTML5 specification (and Siphon's internal configs).
 * @param tagName The tagname to check.
 */
export function isVoid(tagName: string | undefined): boolean {
  return tagName ? voidTags[tagName] === true : false;
}
export const stringMarkers: Array<string> = ["'", "`", '"'];
export const imageExts: Array<string> = [
  ".png",
  ".jpeg",
  ".jpg",
  ".bmp",
  ".svg",
  ".gif",
  ".tiff",
  ".webp",
];
/**
 * Confirm if a character is a numeric digit.
 * @param char The character to evaluate.
 */
export function isDigit(char?: string) {
  return char ? char.charCodeAt(0) >= 48 && char.charCodeAt(0) <= 57 : false;
}
/**
 * Check if a string is a number.
 * @param char The character or string to evaluate.
 */
export function isNum(char: string | undefined) {
  return char
    ? char.replace(/[0-9]/g, "").replace(/\./, "") === "" &&
        !Number.isNaN(Number(char))
    : false;
}
/**
 * Check if a string or character is alphabetic.
 * @param char The string to evaluate.
 * @returns
 */
export function isAlphabetic(char: string | undefined) {
  return char ? char.toLowerCase() !== char.toUpperCase() : false;
}
/**
 * Checks if the first letter in a string is uppercase.
 * @param char The string to evaluate
 */
export function isSentenceCase(char: string) {
  return char[0].toUpperCase() === char[0];
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
/**
 * Returns the last item in an array.
 * @param array
 */
export function last(array: Array<any>) {
  return array[array.length - 1];
}

/**Javascript Keywords */
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
export function isHexDigit(character: string) {
  return isDigit(character) || /[A-F]|[a-f]/.test(character);
}
export function isAlphaNumeric(character: string | undefined) {
  return isAlphabetic(character) || isDigit(character);
}
export function isValidIdentifierCharacter(char: string) {
  return isAlphabetic(char) || isDigit(char) || /\$|\_/.test(char);
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

const MIME_TYPES: any = {
  aac: "audio/aac",
  abw: "application/x-abiword",
  arc: "audio/x-freearc",
  avif: "image/avif",
  avi: "video/x-msvideo",
  azw: "application/vnd.amazon.ebook",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  bz: "application/x-bzip",
  bz2: "application/x-bzip2",
  cda: "application/x-cdf",
  csh: "application/x-csh",
  css: "text/css",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gz: "application/gzip",
  gif: "image/gif",
  html: "text/html",
  htm: "text/html",
  ico: "image/vnd.microsoft.icon",
  ics: "text/calendar",
  jar: "application/java-archive",
  jpg: "image/jpg",
  jpeg: "image/jpg",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  jsonld: "application/ld+json",
  mid: "audio/midi",
  midi: "audio/x-midi",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  mpkg: "application/vnd.apple.installer+xml",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odt: "application/vnd.oasis.opendocument.text",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  png: "image/png",
  pdf: "application/pdf",
  php: "application/x-httpd-php",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  rar: "application/vnd.rar",
  rtf: "application/rtf",
  sh: "application/x-sh",
  svg: "image/svg+xml",
  swf: "application/x-shockwave-flash",
  tar: "application/x-tar",
  tiff: "image/tiff",
  tif: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain",
  vsd: "application/vnd.visio",
  wav: "audio/wav",
  weba: "audio/webm",
  webm: "video/webm",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xml: "application/xml",
  xul: "application/vnd.mozilla.xul+xml",
  zip: "application/zip",
  "3gp": "video/3gpp2",
  "7z": "application/x-7z-compressed",
};
export function getMIMEType(ext: string) {
  return MIME_TYPES[ext] ?? `application/octet-stream`;
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
  call: 17,
  postfix: 16,
  prefix: 15,
  "!": 15,
  "~": 15,
  typeof: 15,
  void: 15,
  delete: 15,
  await: 15,
  "++": 15,
  "--": 15,
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
  of: 10,
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
  "??": 3.5,
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
  "<": ">",
};
export function removeInvalidChars(str: string) {
  return str.replace(/(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]/g, " ");
}

export function HTMLError(e: SiphonError) {
  if (e.root && e.location) {
    e.location = relative(relativePath(e.root, "./"), e.location);
  }
  e.heading = e.heading.replace(/\\/g, "\\\\");
  e.location = e.location?.replace(/\\/g, "/");
  return `<html style='background: #151515'>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
  </head>
  <body style='
   font-family: sans-serif;
   height: fit-content;
   padding: 0 5%;
   padding-top: 60px;
   margin: 0'>
    <h1 style='color: #d62929;'>Siphon Compile Error.</h1>
    <hr />
    <h3 style='color:white'></h3>
    <p style='color: gray; margin-top: 0'></p>
    <script>
      document.querySelector('h3').innerText = "${e.heading}"
      document.querySelector('p').innerText = 
      "${
        e.position ? `${e.location}:${e.position.line}:${e.position.col}` : ""
      }"
      var error = new Error(\`${e.heading}\`);
      throw error;
    </script>
  </body>
</html>`;
}
