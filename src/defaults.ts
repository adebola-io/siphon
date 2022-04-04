import { siphonOptions } from "./types";

const defaults: siphonOptions = {
  rootDir: "./src",
  outDir: "./build",
  deep: false,
  relations: [{ from: "index.html", to: "index.bundle.html" }],
  formatFiles: true,
  internalJS: false,
  internalStyles: false,
  checkImageTypes: true,
  preserveComments: false,
};

export default defaults;
