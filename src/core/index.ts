import * as fs from "fs";
import * as path from "path";
import Errors from "./errors";
import Generator from "./transpilers/mimo/generator";
import Runtime from "./runtime";
import createDOMTree from "./transpilers/mimo/createDOMTree";
import { siphonOptions } from "../types";
import { forceCreateDir } from "../utils";

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
          forceCreateDir(destination);
          let runtime = new Runtime(source, destination, options);
          let generator = new Generator();
          htmlTree = runtime.resolve(htmlTree);
          let result = generator.generate(htmlTree, options);
          fs.writeFileSync(destination, result);
          return true;
      }
    },
  };
}

export default bundler;
