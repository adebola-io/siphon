const params = process.argv.slice(2);

switch (params[0]) {
  case "watch":
    require("../lib/dist/watcher/watcher").default();
    break;
}
