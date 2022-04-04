"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
function forceCreatePath(source) {
    var routes = (0, path_1.resolve)(source.toString()).split(/\\|\//);
    for (var index = 1; routes[index]; index++) {
        var resolvedPath = routes.slice(0, index).join("/");
        if (!(0, fs_1.existsSync)(resolvedPath)) {
            (0, fs_1.mkdirSync)(resolvedPath);
        }
    }
}
exports.default = forceCreatePath;
