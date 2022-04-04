"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var colors = require("colors");
var core_1 = require("../core");
var dating_1 = require("../utils/dating");
var errors_1 = require("../errors");
colors.setTheme({
    red: "red",
    gray: "gray",
    green: "green",
    yellow: "yellow",
});
function watcher(options) {
    /**
     * Core bundler.
     */
    function runBundler() {
        options.relations.forEach(function (relation) {
            var _a;
            console.clear();
            console.log("".concat("".concat((0, dating_1.newTimeStamp)({
                noDate: true,
            }), ":").gray).concat(" File change detected. Starting bundler...".yellow));
            try {
                var source = "".concat(options.rootDir, "/").concat(relation.from), destination = "".concat(options.outDir, "/").concat(relation.to);
                core_1.default.bundler(source).into(destination, options);
                console.log();
                console.log("".concat("".concat((0, dating_1.newTimeStamp)({
                    noDate: true,
                }), ":").gray).concat(" Bundling successful. Siphon found zero errors.".green));
            }
            catch (e) {
                console.log();
                console.log((_a = e.message) === null || _a === void 0 ? void 0 : _a.red);
            }
        });
    }
    if (!(0, fs_1.existsSync)(options.rootDir))
        errors_1.default.enc("NO_ROOTDIR", options.rootDir);
    var ready = true;
    function throttle() {
        if (ready)
            runBundler();
        ready = false;
        setTimeout(function () {
            ready = true;
        }, 300);
    }
    // File Watcher.
    (0, fs_1.watch)(options.rootDir, { recursive: true }, throttle);
    console.clear();
    console.log("".concat("".concat((0, dating_1.newTimeStamp)({
        noDate: true,
    }), ":").gray).concat(" Staging Files and starting Siphon in watch mode...".yellow));
}
exports.default = watcher;
