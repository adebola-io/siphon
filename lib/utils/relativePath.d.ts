/// <reference types="node" />
import { PathLike } from "fs";
declare function relativePath(from: PathLike, to: string): string;
export default relativePath;
