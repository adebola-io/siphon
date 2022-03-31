import { PathLike } from "fs";
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
export interface Relation {
  from: PathLike;
  to: PathLike;
}
export interface siphonOptions {
  rootDir: PathLike;
  outDir: PathLike;
  deep: boolean;
  relations: Relation[];
  formatFiles: boolean;
  internalJS: boolean;
  internalStyles: boolean;
  preserveComments: boolean;
}
