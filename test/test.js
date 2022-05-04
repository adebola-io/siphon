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
  case task.inputs.length === 2 && task.inputs[0] === "bundle":
    siphon.core
      .bundler(task.inputs[1])
      .into(
        options.outDir + "/" + getFileName(task.inputs[1]) + ".html",
        options
      );
    console.log();
    console.log(bold(green("Bundled " + task.inputs[1] + " successfully.")));
    break;
  case task.inputs.includes("bundle"):
    options.relations.forEach((relation) => {
      var source = `${options.rootDir}/${relation.from}`;
      var destination = "".concat(options.outDir, "/").concat(relation.to);
      siphon.core.bundler(source).into(destination, options);
      console.log();
      console.log(
        bold(green(" Bundling successful. Siphon found zero errors."))
      );
    });
    break;
}
