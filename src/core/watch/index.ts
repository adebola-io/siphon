import { existsSync, watch, writeFileSync } from "fs";
import * as colors from "colors";
import bundler from "..";
import { newTimeStamp, HTMLError } from "../../utils";
import { siphonOptions } from "../../types";
import Errors from "../errors";
import { resolve } from "path";
colors.setTheme({
  red: "red",
  gray: "gray",
  green: "green",
  yellow: "yellow",
});
function watchSrc(options: siphonOptions) {
  var encounteredError = false;
  /**
   * Core bundler.
   */
  function runBundler() {
    options.relations.forEach((relation) => {
      let source = `${options.rootDir}/${relation.from}`,
        destination = `${options.outDir}/${relation.to}`;
      try {
        bundler(source).into(destination, options);
        encounteredError = false;
      } catch (e: any) {
        console.log();
        console.log(
          colors.bold("ERROR:".black.bgRed + colors.red(" Failed to compile."))
        );
        console.log();
        console.log(e.message);
        if (existsSync(destination) && existsSync(source)) {
          e.root = resolve(options.rootDir.toString());
          writeFileSync(destination, HTMLError(e));
        }
        encounteredError = true;
      }
    });
  }

  if (!existsSync(options.rootDir)) Errors.enc("NO_ROOTDIR", options.rootDir);
  let ready = true;
  function throttle() {
    if (ready) {
      console.clear();
      console.log(
        `${
          `${newTimeStamp({
            noDate: true,
          })}:`.gray
        }${` File change detected. Starting bundler...`.yellow}`
      );
      runBundler();
      if (!encounteredError) {
        console.log();
        console.log(
          `${
            `${newTimeStamp({
              noDate: true,
            })}:`.gray
          }${colors.bold(
            ` Bundling successful. Siphon found zero errors.`.green
          )}`
        );
      }
    }
    ready = false;
    setTimeout(() => {
      ready = true;
    }, 300);
  }

  // File Watcher.
  watch(options.rootDir, { recursive: true }, throttle);
  console.clear();
  console.log(
    `${
      `${newTimeStamp({
        noDate: true,
      })}:`.gray
    }${` Staging Files and starting Siphon in watch mode...`.yellow}`
  );
}

export default watchSrc;
