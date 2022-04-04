/// <reference types="node" />
import { PathLike } from "fs";
export declare type ErrorTypes = "FILE_NON_EXISTENT" | "NO_ROOTDIR" | "CSS_NON_EXISTENT" | "CSS_SELF_IMPORT" | "CSS_CIRCULAR_IMPORT" | "NOT_A_DIRECTORY" | "COMMENT_UNCLOSED" | "TAG_UNCLOSED" | "HTML_FRAGMENT" | "INVALID_TAG" | "INVALID_VOID_TAG" | "ABRUPT" | "CLOSING_TAG_ATTR" | "UNEXPECTED_CLOSE" | "OPEN_CURLY_EXPECTED";
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
