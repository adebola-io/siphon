import fs = require("fs");
import path = require("path");
import Errors from "./errors";
import * as resolver from "./resolver";
import createDOMTree from "./parser/createDOMTree";
import idSearch from "./parser/idSearch";
import tagNameSearch from "./parser/tagNameSearch";

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
          fs.writeFile("test/result.json", JSON.stringify(htmlTree), () => {});
          return true;
      }
    },
  };
}

export default barrel;
