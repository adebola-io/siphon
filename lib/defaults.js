"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defaults = {
    rootDir: "./src",
    outDir: "./build",
    deep: false,
    relations: [{ from: "index.html", to: "index.bundle.html" }],
    formatFiles: true,
    internalJS: false,
    internalStyles: false,
    preserveComments: false,
};
exports.default = defaults;
