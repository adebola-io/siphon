import { existsSync, watch } from "fs";
import * as colors from "colors";
import core from "../core";
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
  /**
   * Core bundler.
   */
  function runBundler() {
    options.relations.forEach((relation) => {
      console.clear();
      console.log(
        `${
          `${newTimeStamp({
            noDate: true,
          })}:`.gray
        }${` File change detected. Starting bundler...`.yellow}`
      );
      try {
        let source = `${options.rootDir}/${relation.from}`,
          destination = `${options.outDir}/${relation.to}`;
        core.bundler(source).into(destination, options);
        console.log();
        console.log(
          `${
            `${newTimeStamp({
              noDate: true,
            })}:`.gray
          }${` Bundling successful. Siphon found zero errors.`.green}`
        );
      } catch (e: any) {
        console.log();
        console.log(e.message?.red);
      }
    });
  }

  if (!existsSync(options.rootDir)) Errors.enc("NO_ROOTDIR", options.rootDir);
  let ready = true;
  function throttle() {
    if (ready) runBundler();
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
