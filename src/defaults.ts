import { siphonOptions } from "./types";

const defaults: siphonOptions = {
  rootDir: "./src",
  outDir: "./build",
  storeImagesSeparately: false,
  deep: false,
  relations: [{ from: "index.html", to: "index.html" }],
  htmlInjects: false,
  formatFiles: true,
  internalJS: false,
  internalStyles: false,
  checkImageTypes: true,
  preserveComments: false,
  wickedMode: false,
};
export default defaults;
