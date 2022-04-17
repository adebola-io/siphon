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
  wickedMode: boolean;
}
export interface fileGetterOptions {
  ext?: string;
  exclude?: Array<PathLike>;
}

export class StyleRule {
  type: string = "StyleRule";
  loc = {
    start: 0,
    end: 0,
  };
  selectors: string[] = [];
  notation: any = {};
  content: Style[] = [];
}
export class Style {
  constructor(property: string, value: string) {
    this.property = property;
    this.value = value;
  }
  type: string = "Style";
  loc = {
    start: 0,
    end: 0,
  };
  property: string;
  value: string;
}
export class AtRule {
  constructor(start: number, end: number) {
    this.loc = {
      start,
      end,
    };
  }
  type: string = "AtRule";
  loc: {
    start: number;
    end: number;
  };
}
export class ImportRule extends AtRule {
  constructor(
    start: number,
    end: number,
    resourceType: "local" | "cross-site"
  ) {
    super(start, end);
    this.resourceType = resourceType;
  }
  type: string = "ImportRule";
  href: string = "";
  resourceType: "local" | "cross-site";
}
export class MediaRule extends AtRule {
  constructor(start: number, end: number, params: string) {
    super(start, end);
    this.params = params;
  }
  type: string = "MediaRule";
  rules: Array<
    | ImportRule
    | MediaRule
    | SupportRule
    | KeyframeRule
    | CharsetRule
    | FontFaceRule
    | NamespaceRule
    | AtRule
    | StyleRule
  > = [];
  params: string;
}
export class SupportRule extends AtRule {
  constructor(
    start: number,
    end: number,
    query: string,
    inverseQuery: boolean
  ) {
    super(start, end);
    this.query = query;
    this.inverseQuery = inverseQuery;
  }
  type = "StyleRule";
  inverseQuery = true;
  query: string;
  rules: Array<
    | ImportRule
    | MediaRule
    | SupportRule
    | KeyframeRule
    | CharsetRule
    | FontFaceRule
    | NamespaceRule
    | AtRule
    | CSSStyleRule
  > = [];
}
export interface Keyframe {
  mark: string;
  notation: any;
  styles: Style[];
}
export class KeyframeRule extends AtRule {
  type = "KeyframesRule";
  identifier = "";
  frames: Array<Keyframe> = [];
}
export class CharsetRule extends AtRule {}
export class FontFaceRule extends AtRule {
  type: string = "FontFaceRule";
  family: string = "";
  source: string = "";
}
export class NamespaceRule extends AtRule {}
export class Stylesheet {
  constructor(start: number, end: number) {
    this.loc = {
      start,
      end,
    };
  }
  type: string = "Stylesheet";
  loc: {
    start: number;
    end: number;
  };
  rules: Array<
    | ImportRule
    | MediaRule
    | SupportRule
    | KeyframeRule
    | CharsetRule
    | FontFaceRule
    | NamespaceRule
    | AtRule
    | CSSStyleRule
  > = [];
}
