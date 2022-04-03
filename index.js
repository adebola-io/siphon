const { existsSync } = require("fs");
const path = require("path");
const params = process.argv.slice(2);
const colors = require("colors");
const defaults = require("./lib/dist/defaults").default;
const siphon = require("./lib/dist").default;
const watcher = require("./lib/dist/watcher/watcher").default;

colors.setTheme({
  green: "green",
});
switch (params[0]) {
  case "watch":
    watcher();
    break;
  case "bundle":
    let options = {};
    if (!existsSync("spnconfig.json")) {
      options = defaults;
    } else {
      options = {
        ...defaults,
        ...require(path.resolve("spnconfig.json")).bundlerOptions,
      };
    }
    let rootPath = `${options.rootDir}/${options.relations[0].from}`;
    let destPath = `${options.outDir}/${options.relations[0].to}`;
    siphon
      .bundler(params[1] ? params[1] : rootPath)
      .into(params[2] ? params[2] : destPath, options);
    console.log(`Bundled ${rootPath} into ${destPath} successfully.`.green);
    break;
}
