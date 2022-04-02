import fs = require("fs");
import path = require("path");
import Errors from "../errors";
import resolver from "./resolver";
import transplacer from "./transplacer";
import assetizer from "./assetizer";
import createDOMTree from "./parser/html/createDOMTree";
import { siphonOptions } from "../types";

export function bundler(source: fs.PathLike) {
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

          htmlTree = assetizer.assessCSS(htmlTree, source, options);

          // if (options.internalStyles)
          //   htmlTree = resolver.resolveStyles(htmlTree, source);
          // if (options.internalJS)
          //   htmlTree = resolver.resolveScripts(htmlTree, source);
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
