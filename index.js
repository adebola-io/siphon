const { Task } = require("./structures");
const siphon = require("./lib");
const { siphonOptions } = require("./lib/types");
const { existsSync } = require("fs");
const { resolve } = require("path");
const task = new Task(process.argv);
/** @type {siphonOptions} */
var options;

if (existsSync("siphon.config.js")) {
  options = {
    ...siphon.defaults,
    ...require(resolve("siphon.config.js")),
  };
} else options = siphon.defaults;

switch (true) {
  case task.args.watch &&
    task.inputs.includes("bundle") &&
    task.inputs.length === 1:
    siphon.watcher(options);
    break;
  case task.inputs.includes("bundle"):
    options.relations.forEach((relation) => {
      var source = `${options.rootDir}/${relation.from}`;
      var destination = "".concat(options.outDir, "/").concat(relation.to);
      siphon.core.bundler(source).into(destination, options);
      console.log();
      console.log(" Bundling successful. Siphon found zero errors.".green);
    });
    break;
}
