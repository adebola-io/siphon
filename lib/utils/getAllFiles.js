"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var errors_1 = require("../errors");
/**
 * Returns a list of all the files in all the subdirectories in a given directory.
 * @param {fs.PathLike} path Path to the folder to get files from.
 * @param {fileGetterOptions} options Optional arguments, such as file extensions to get exclusively.
 */
function getAllFiles(path, options) {
    var fileList = [];
    if (!fs.lstatSync(path).isDirectory())
        errors_1.default.enc("NOT_A_DIRECTORY", path);
    fs.readdirSync(path).forEach(function (pathChild) {
        var _a;
        if (!((_a = options === null || options === void 0 ? void 0 : options.exclude) === null || _a === void 0 ? void 0 : _a.includes("".concat(path, "/").concat(pathChild)))) {
            if (fs.lstatSync("".concat(path, "/").concat(pathChild)).isDirectory()) {
                fileList.push(getAllFiles("".concat(path, "/").concat(pathChild, "/")));
            }
            else {
                fileList.push("".concat(path, "/").concat(pathChild, "/"));
            }
        }
        else
            return [];
    });
    return fileList.flat(1);
}
exports.default = getAllFiles;
