import { PathLike } from "fs";
export type ErrorTypes =
  | "FILE_NON_EXISTENT"
  | "NO_ROOTDIR"
  | "CSS_NON_EXISTENT"
  | "CSS_SELF_IMPORT"
  | "HTML_CIRCULAR_INJECT"
  | "CSS_CIRCULAR_IMPORT"
  | "HTML_SELF_INJECT"
  | "NOT_A_DIRECTORY"
  | "UNSUPPORTED_IMAGE_FORMAT"
  | "COMMENT_UNCLOSED"
  | "CSS_STRING_OR_URI_EXPECTED"
  | "CSS_CLOSING_BRAC_EXPECTED"
  | "CSS_SEMI_COLON_EXPECTED"
  | "CSS_OPEN_BRAC_EXPECTED"
  | "CSS_COLON_EXPECTED"
  | "CSS_OPEN_CURL_EXPECTED"
  | "CSS_INVALID_IDENTIFIER"
  | "TAG_UNCLOSED"
  | "HTML_FRAGMENT"
  | "INVALID_TAG"
  | "INJECT_REQUIRES_SRC"
  | "UNTERMINATED_STRING_LITERAL"
  | "UNTERMINATED_REGEX_LITERAL"
  | "MISSING_DESC_INITIALIZER"
  | "SHEBANG_NOT_ALLOWED"
  | "COMMA_EXPECTED"
  | "EXPRESSION_EXPECTED"
  | "VARIABLE_DECLARATION_EXPECTED"
  | "IDENTIFIER_EXPECTED"
  | "INVALID_ASSIGNMENT_LEFT"
  | "EMPTY_CONST_DECLARATION"
  | "ID_FOLLOWS_LITERAL"
  | "INVALID_VOID_TAG"
  | "ABRUPT"
  | "CLOSING_TAG_ATTR"
  | "UNEXPECTED_CLOSE"
  | "OPEN_CURLY_EXPECTED";
export interface HTMLDocumentNode {
  identifier?: number;
  childID?: number;
  type?: string;
  isVoid?: boolean;
  start?: number;
  stop?: number;
  tagName?: string;
  parent?: string | null | HTMLDocumentNode | any;
  attributeList?: string;
  attributes?: any;
  content?: string;
  children?: Array<HTMLDocumentNode>;
}
export interface Relation {
  from: PathLike;
  to: PathLike;
}
export interface siphonOptions {
  rootDir: PathLike;
  outDir: PathLike;
  deep: boolean;
  relations: Relation[];
  htmlInjects: boolean;
  formatFiles: boolean;
  storeImagesSeparately: boolean;
  internalJS: boolean;
  internalStyles: boolean;
  checkImageTypes: boolean;
  preserveComments: boolean;
}
export interface fileGetterOptions {
  ext?: string;
  exclude?: Array<PathLike>;
}
