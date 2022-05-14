import { siphonOptions } from ".";

const defaults: siphonOptions = {
  rootDir: "./src",
  outDir: "./build",
  storeImagesSeparately: false,
  relations: [{ from: "index.html", to: "index.html" }],
  htmlModules: false,
  formatFiles: true,
  internalJS: false,
  allowJSX: false,
  internalStyles: false,
  checkImageTypes: true,
  preserveComments: false,
  wickedMode: false,
};
export default defaults;
