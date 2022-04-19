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
