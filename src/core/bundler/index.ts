import * as fs from "fs";
import * as path from "path";
import Errors from "../../errors";
import Generator from "../generator";
import Resolver from "../resolver";
import createDOMTree from "../parser/html/createDOMTree";
import { siphonOptions } from "../../types";
import { forceCreatePath } from "../../utils";

function bundler(source: fs.PathLike) {
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
          let resolver = new Resolver(source, destination, options);
          htmlTree = resolver.resolve(htmlTree);
          fs.writeFile(
            destination,
            new Generator().generate(htmlTree, options),
            () => {}
          );
          return true;
      }
    },
  };
}

export default bundler;
