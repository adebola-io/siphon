/// <reference types="node" />
import { PathLike } from "fs";
export declare function isSpaceCharac(character: string): boolean;
export declare function illegalCSSIdentifierCharacter(character: string): boolean;
export declare function checkForEnd(character: string, source: PathLike): void;
export declare function isForeignTag(tagName: string | undefined): boolean;
export declare function isVoid(tagName: string | undefined): boolean;
export declare const stringMarkers: Array<string>;
