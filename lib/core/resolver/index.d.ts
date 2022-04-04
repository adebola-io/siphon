/// <reference types="node" />
import { PathLike } from "fs";
import { HTMLDocumentNode, siphonOptions } from "../../types";
declare class Resolver {
    constructor(sourceFile: PathLike, destination: PathLike, options: siphonOptions);
    outDir: PathLike;
    baseName: string;
    options: siphonOptions;
    source: PathLike;
    destination: PathLike;
    assets: any;
    resolveStyles(nodes: HTMLDocumentNode[]): HTMLDocumentNode[];
    resolve(nodes: HTMLDocumentNode[]): HTMLDocumentNode[];
}
export default Resolver;
