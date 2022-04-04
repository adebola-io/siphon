import { PathLike } from "fs";
import path = require("path");

/**
 * Returns the filename of a file without its extension.
 */
function getFileName(source: PathLike) {
  return path.basename(source.toString()).split(".").slice(0, -1).join(".");
}

export default getFileName;
