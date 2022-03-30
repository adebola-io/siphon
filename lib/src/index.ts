import fs = require("fs");
import path = require("path");
import Errors from "./errors";
import * as resolver from "./resolver";
import * as transplacer from "./transplacer";
import createDOMTree from "./parser/createDOMTree";

export function bundle(source: fs.PathLike) {
  return {
    into(destination: fs.PathLike) {
      if (!fs.existsSync(source)) Errors.enc("FILE_NON_EXISTENT", source);
      let fileExt = path.extname(source.toString());
      switch (fileExt) {
        case ".html":
        case ".xhtml":
        case ".mhtml":
          var htmlTree = createDOMTree(source);
          htmlTree = resolver.resolveStyles(htmlTree, source);
          htmlTree = resolver.resolveScripts(htmlTree, source);
          fs.writeFile(
            destination,
            transplacer.transplaceHTML(htmlTree),
            () => {}
          );
          return true;
      }
    },
  };
}
const barrel = { bundle };
export default barrel;
