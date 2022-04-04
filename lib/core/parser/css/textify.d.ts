/// <reference types="node" />
import { PathLike } from "fs";
/**
 * Runs through a CSS file, resolves its imports and removes comments.
 * @param source The CSS file to parse through.
 * @returns compiled css text.
 */
declare function textify(source: PathLike): {
    text: string;
    links: {
        srcpath: string;
        name: string;
    }[];
};
export default textify;
