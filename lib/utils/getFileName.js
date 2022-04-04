"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
/**
 * Returns the filename of a file without its extension.
 */
function getFileName(source) {
    return (0, path_1.basename)(source.toString()).split(".").slice(0, -1).join(".");
}
exports.default = getFileName;
