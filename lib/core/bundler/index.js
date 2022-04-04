"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var errors_1 = require("../../errors");
var generator_1 = require("../generator");
var resolver_1 = require("../resolver");
var createDOMTree_1 = require("../parser/html/createDOMTree");
var forceCreatePath_1 = require("../../utils/forceCreatePath");
function bundler(source) {
    return {
        into: function (destination, options) {
            if (!fs.existsSync(source))
                errors_1.default.enc("FILE_NON_EXISTENT", source);
            var fileExt = path.extname(source.toString());
            switch (fileExt) {
                case ".html":
                case ".xhtml":
                case ".mhtml":
                    var htmlTree = (0, createDOMTree_1.default)(source);
                    (0, forceCreatePath_1.default)(destination);
                    var resolver = new resolver_1.default(source, destination, options);
                    htmlTree = resolver.resolve(htmlTree);
                    fs.writeFile(destination, new generator_1.default().generate(htmlTree, options), function () { });
                    return true;
            }
        },
    };
}
exports.default = bundler;
