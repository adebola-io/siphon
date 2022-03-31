import { existsSync, PathLike, watchFile } from "fs";
import colors = require("colors");
import path = require("path");
import siphon from "..";
import getAllFiles from "../utils/getAllFiles";
import { newTimeStamp } from "../utils/dating";
colors.setTheme({
  red: "red",
  green: "green",
  yellow: "yellow",
});
export interface siphonOptions {
  watch: PathLike;
  root: PathLike;
  output: PathLike;
}
function startWatcher() {
  const defaults: siphonOptions = {
    watch: "src",
    root: "public/index.html",
    output: "dist/bundle.html",
  };
  let options: siphonOptions = defaults;
  if (existsSync("siphon.config.js"))
    options = {
      ...defaults,
      ...require(path.resolve("siphon.config.js")),
    };
  console.clear();
  console.log("Watching Files for changes...");
  try {
    siphon.bundle(options.root).into(options.output);
    console.log();
    console.log();
    console.log("Bundling successful. siphon found 0 errors.".green);
  } catch (e: any | { message: string }) {
    console.log(e.message.red);
  }
  getAllFiles(options.watch).forEach((file) => {
    watchFile(file, { interval: 200 }, () => {
      console.clear();
      console.log(
        newTimeStamp({ noDate: true }) +
          ": " +
          "File change detected. Compiling dependencies...".yellow
      );
      try {
        siphon.bundle(options.root).into(options.output);
        console.log();
        console.log();
        console.log(
          newTimeStamp({ noDate: true }) +
            ": " +
            "Bundling successful. siphon found 0 errors.".green
        );
      } catch (e: any | { message: string }) {
        console.log(e.message.red);
      }
    });
  });
}

export default startWatcher;
