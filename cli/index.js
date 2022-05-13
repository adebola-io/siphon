const { Task } = require("../lib/structures");
const siphon = require("../lib");
const { siphonOptions } = require("../lib/types");
const { existsSync } = require("fs");
const { getFileName } = require("../lib/utils");
const { resolve } = require("path");
const { green, bold } = require("colors");
const task = new Task(process.argv);
const start = require("./start");
const path = require("path");
/** @type {siphonOptions} */
var options;

if (existsSync("siphon.config.js")) {
  options = {
    ...siphon.defaults,
    ...require(resolve("siphon.config.js")),
  };
} else options = siphon.defaults;

switch (true) {
  // Watch mode.
  case (task.args.watch || task.args.w) &&
    (task.inputs.includes("-bundle") || task.inputs.includes("-b")) &&
    task.inputs.length === 1:
    siphon.watcher(options);
    break;
  // Bundle single file.
  case task.inputs.length === 2 &&
    (task.inputs[0] === "-bundle" || task.inputs[0] === "-b"):
    siphon
      .bundler(task.inputs[1])
      .into(
        options.outDir + "/" + getFileName(task.inputs[1]) + ".html",
        options
      );
    console.log();
    console.log(bold(green("Bundled " + task.inputs[1] + " successfully.")));
    break;
  case task.inputs.length === 3 &&
    (task.inputs[0] === "-bundle" || task.inputs[0] === "-b"):
    // Bundle single file into destination.
    options.outDir = task.inputs[2].split(/\//).slice(0, -1).join("/");
    siphon.bundler(task.inputs[1]).into(task.inputs[2], options);
    console.log();
    console.log(bold(green("Bundled " + task.inputs[1] + " successfully.")));
    break;
  // Default/config bundling.
  case task.inputs.includes("-bundle") || task.inputs.includes("-b"):
    options.relations.forEach((relation) => {
      var source = `${options.rootDir}/${relation.from}`;
      var destination = "".concat(options.outDir, "/").concat(relation.to);
      siphon.bundler(source).into(destination, options);
      console.log();
      console.log(
        bold(
          green(
            "Bundled " + source + " successfully. Siphon found zero errors."
          )
        )
      );
    });
    break;
  default:
    console.log(start);
    break;
}
