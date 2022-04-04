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
  case task.args.watch || task.inputs.length === 0:
    siphon.watcher(options);
    break;
}
