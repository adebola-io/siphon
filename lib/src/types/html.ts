export interface HTMLTokenTree {
  tagName?: any;
  attributes?: any;
  children?: Array<HTMLTokenTree>;
}
export interface HTMLDocumentNode {
  identifier?: number;
  type?: string;
  isVoid?: boolean;
  lookupInFile?: number;
  tagName?: string;
  parent?: string | null;
  attributeList?: string;
  attributes?: any;
  content?: string;
  children?: Array<HTMLDocumentNode>;
}
