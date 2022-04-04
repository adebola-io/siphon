import { PathLike } from "fs";
import Errors from "../../../errors";

export function isSpaceCharac(character: string): boolean {
  return /\u0020|\u0009|\u000A|\u000C|\u000D/.test(character);
}

export function illegalCSSIdentifierCharacter(character: string) {
  return /\u0020|\u0009|\u000A|\u000C|\u000D|"/.test(character);
}

export function checkForEnd(character: string, source: PathLike): void {
  if (!character) Errors.enc("ABRUPT", source);
}

export function isForeignTag(tagName: string | undefined): boolean {
  return tagName ? ["script", "style"].includes(tagName) : false;
}

export function isVoid(tagName: string | undefined): boolean {
  if (tagName)
    return [
      "!DOCTYPE",
      "area",
      "base",
      "br",
      "col",
      "command",
      "embed",
      "hr",
      "img",
      "input",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ].includes(tagName);
  else return false;
}
export const stringMarkers: Array<string> = ["'", "`", '"'];
export const imageExts: Array<string> = [".png", ".jpeg", ".jpg", ".bmp"];
