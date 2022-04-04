import { PathLike } from "fs";
import { basename } from "path";

/**
 * Returns the filename of a file without its extension.
 */
function getFileName(source: PathLike) {
  return basename(source.toString()).split(".").slice(0, -1).join(".");
}

export default getFileName;
