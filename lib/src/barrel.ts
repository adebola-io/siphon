import fs = require("fs");
import path = require("path");

import Errors from "./errors";
import createDOMTree from "./html_parser/createDOMTree";
import idSearch from "./html_parser/idSearch";
import tagNameSearch from "./html_parser/tagNameSearch";
function barrel(startFile: fs.PathLike) {
  if (!fs.existsSync(startFile))
    Errors.enc("FILE_NON_EXISTENT", path.resolve(startFile.toString()));
  let fileExt = path.extname(startFile.toString());
  switch (fileExt) {
    case ".html":
    case ".xhtml":
    case ".mhtml":
      let tree = createDOMTree(startFile);
      return {
        getElementById(elementId: string) {
          return idSearch(tree, elementId);
        },
        getElementsByTagName(
          qualifiedName: keyof HTMLElementTagNameMap | string
        ) {
          return tagNameSearch(tree, qualifiedName);
        },
      };
  }
}

export default barrel;
