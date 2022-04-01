import { existsSync, watchFile } from "fs";
import colors = require("colors");
import path = require("path");
import defaults from "../defaults";
import siphon from "..";
import getAllFiles from "../utils/getAllFiles";
import { newTimeStamp } from "../utils/dating";
import { siphonOptions } from "../types";
import Errors from "../errors";
colors.setTheme({
  red: "red",
  gray: "gray",
  green: "green",
  yellow: "yellow",
});
function startWatcher() {
  let options: siphonOptions = defaults;
  if (existsSync("spnconfig.json")) {
    options = {
      ...defaults,
      ...require(path.resolve("spnconfig.json")).bundlerOptions,
    };
  }
  /**
   * Core bundler.
   */
  function runBundler() {
    options.relations.forEach((relation) => {
      try {
        let source = `${options.rootDir}/${relation.from}`,
          destination = `${options.outDir}/${relation.to}`;
        siphon.bundler(source).into(destination, options);
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
  getAllFiles(options.rootDir).forEach((file) => {
    watchFile(file, { interval: 200 }, () => {
      console.clear();
      console.log(
        `${
          `${newTimeStamp({
            noDate: true,
          })}:`.gray
        }${` File change detected. Running bundler...`.yellow}`
      );
      console.log();
      runBundler();
    });
  });

  console.clear();
  console.log(
    `${
      `${newTimeStamp({
        noDate: true,
      })}:`.gray
    }${` Staging Files and starting bundler...`.yellow}`
  );
}

export default startWatcher;
