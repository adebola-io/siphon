import { existsSync, mkdirSync, PathLike } from "fs";
import path = require("path");
function forceCreatePath(source: PathLike) {
  let routes = path.resolve(source.toString()).split(/\\|\//);
  for (let index = 1; routes[index]; index++) {
    let resolvedPath = routes.slice(0, index).join("/");
    if (!existsSync(resolvedPath)) {
      mkdirSync(resolvedPath);
    }
  }
}

export default forceCreatePath;
