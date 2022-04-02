import { PathLike } from "fs";
import path = require("path");

/**
 * Returns the filename of a fil without its extension.
 */
function fileName(source: PathLike) {
  return path.basename(source.toString()).split(".").slice(0, -1).join(".");
}

export default fileName;
