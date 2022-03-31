import { existsSync, PathLike, watchFile } from "fs";
import colors = require("colors");
import path = require("path");
import siphon, { bundle } from "..";
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
  const defaults: siphonOptions = {
    rootDir: "./src",
    outDir: "./build",
    deep: false,
    relations: [{ from: "index.html", to: "index.bundle.html" }],
    formatFiles: true,
    internalJS: false,
    internalStyles: false,
    preserveComments: false,
  };
  let options: siphonOptions = defaults;
  if (existsSync("spnconfig.json")) {
    options = {
      ...defaults,
      ...require(path.resolve("spnconfig.json")).config,
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
        siphon.bundle(source).into(destination, options);
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
