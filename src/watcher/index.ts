import { existsSync, watch } from "fs";
import * as colors from "colors";
import bundler from "../core";
import { newTimeStamp } from "../utils";
import { siphonOptions } from "../types";
import Errors from "../errors";
colors.setTheme({
  red: "red",
  gray: "gray",
  green: "green",
  yellow: "yellow",
});
function watcher(options: siphonOptions) {
  var encounteredError = false;
  /**
   * Core bundler.
   */
  function runBundler() {
    options.relations.forEach((relation) => {
      try {
        let source = `${options.rootDir}/${relation.from}`,
          destination = `${options.outDir}/${relation.to}`;
        bundler(source).into(destination, options);
        encounteredError = false;
      } catch (e: any) {
        console.log();
        console.log(e.message?.red);
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
          }${` Bundling successful. Siphon found zero errors.`.green}`
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

export default watcher;
