import fs = require("fs");
import path = require("path");
import Errors from "../errors";
import transplacer from "./transplacer";
import assetizer from "./assetizer";
import createDOMTree from "./parser/html/createDOMTree";
import { siphonOptions } from "../types";
import forceCreatePath from "../utils/forceCreatePath";

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
          forceCreatePath(destination);
          htmlTree = assetizer.assessCSS(
            htmlTree,
            source,
            options,
            destination
          );

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
