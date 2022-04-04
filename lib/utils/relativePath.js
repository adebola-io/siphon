"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
function relativePath(from, to) {
    var rootPaths = (0, path_1.resolve)(from.toString())
        .split("\\")
        .filter(function (route) { return route !== ""; });
    switch (true) {
        case to.startsWith("http://"):
        case to.startsWith("https://"):
            return to;
        case to.startsWith("../"):
            do {
                rootPaths.pop();
                to = to.slice(3);
            } while (to.startsWith("../"));
            return rootPaths.slice(0, -1).join("\\") + "\\" + to;
        case to.startsWith("/"):
            return to.slice(1);
        case to.startsWith("./"):
            return rootPaths.slice(0, -1).join("\\") + "\\" + to.slice(2);
        default:
            return rootPaths.slice(0, -1).join("\\") + "\\" + to;
    }
}
exports.default = relativePath;
