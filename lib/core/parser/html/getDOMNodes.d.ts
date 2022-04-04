/// <reference types="node" />
import * as fs from "fs";
import { HTMLDocumentNode } from "../../../types";
/**
 * Go through an HTML file and return its content as an array of nodes.
 */
declare function getDOMNodes(source: fs.PathLike): Array<HTMLDocumentNode>;
export default getDOMNodes;
