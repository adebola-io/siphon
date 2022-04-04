/// <reference types="node" />
import * as fs from "fs";
import { HTMLDocumentNode } from "../../../types";
declare function createDOMTree(source: fs.PathLike): HTMLDocumentNode[];
export default createDOMTree;
