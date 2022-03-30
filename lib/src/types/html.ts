export interface HTMLTokenTree {
  tagName?: any;
  attributes?: any;
  children?: Array<HTMLTokenTree>;
}
export interface HTMLDocumentNode {
  id?: number;
  type?: string;
  tagName?: string;
  parent?: string | null;
  attributeList?: string;
  attributes?: any;
  content?: string;
  children?: Array<HTMLDocumentNode>;
}
