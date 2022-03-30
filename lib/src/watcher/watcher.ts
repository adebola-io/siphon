import { existsSync, PathLike, watchFile } from "fs";
import colors = require("colors");
import path = require("path");
import barrel from "..";
import getAllFiles from "../utils/getAllFiles";
colors.setTheme({
  red: "red",
  green: "green",
  yellow: "yellow",
});
export interface BarrelOptions {
  watch: PathLike;
  root: PathLike;
  output: PathLike;
}
function startWatcher() {
  const defaults: BarrelOptions = {
    watch: "src",
    root: "public/index.html",
    output: "dist/bundle.html",
  };
  let options: BarrelOptions = defaults;
  if (existsSync("barrel.config.js"))
    options = {
      ...defaults,
      ...require(path.resolve("barrel.config.js")),
    };
  console.clear();
  console.log("Watching Files for changes...");
  try {
    barrel.bundle(options.root).into(options.output);
    console.log();
    console.log();
    console.log("Bundling successful. Barrel found 0 errors.".green);
  } catch (e: any | { message: string }) {
    console.log(e.message.red);
  }
  getAllFiles(options.watch).forEach((file) => {
    watchFile(file, { interval: 200 }, () => {
      console.clear();
      console.log("File change detected. Compiling dependencies...".yellow);
      try {
        barrel.bundle(options.root).into(options.output);
        console.log();
        console.log();
        console.log("Bundling successful. Barrel found 0 errors.".green);
      } catch (e: any | { message: string }) {
        console.log(e.message.red);
      }
    });
  });
}

export default startWatcher;
