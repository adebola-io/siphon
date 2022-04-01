import fs = require("fs");
import path = require("path");
import Errors from "./errors";
import * as resolver from "./resolver";
import * as transplacer from "./transplacer";
import createDOMTree from "./parser/html/createDOMTree";
import { siphonOptions } from "./types";

export function bundle(source: fs.PathLike) {
  return {
    into(destination: fs.PathLike, options: siphonOptions) {
      if (!fs.existsSync(source)) Errors.enc("FILE_NON_EXISTENT", source);
      let fileExt = path.extname(source.toString());
      switch (fileExt) {
        case ".html":
        case ".xhtml":
        case ".mhtml":
          var htmlTree = createDOMTree(source);
          let destinationRoutes = path
            .resolve(destination.toString())
            .split(/\\|\//);
          for (let index = 1; destinationRoutes[index]; index++) {
            let resolvedPath = destinationRoutes.slice(0, index).join("/");
            if (!fs.existsSync(resolvedPath)) {
              fs.mkdirSync(resolvedPath);
            }
          }
          if (options.internalStyles)
            htmlTree = resolver.resolveStyles(htmlTree, source);
          if (options.internalJS)
            htmlTree = resolver.resolveScripts(htmlTree, source);
          fs.writeFile(
            destination,
            transplacer.transplaceHTML(htmlTree, options),
            () => {}
          );
          return true;
      }
    },
  };
}
const siphon = { bundle };
export default siphon;
