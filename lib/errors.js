"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var parseUtils_1 = require("./core/parser/html/parseUtils");
function err(message, source, charac) {
    var sourceText;
    var i = 1, j = 1, k = 0;
    if (source && charac) {
        sourceText = fs.readFileSync(source).toString();
        while (i < charac) {
            if (sourceText[i] === "\n") {
                j++;
                k = 0;
            }
            if (!(0, parseUtils_1.isSpaceCharac)(sourceText[i]))
                k++;
            i++;
        }
    }
    message = "".concat(message, " ").concat(source
        ? "\n    at ".concat(path.resolve(source.toString())).concat(charac ? ":".concat(j, ":").concat(k) : "")
        : "");
    throw new Error(message);
}
var Errors = {
    enc: function (type, source, charac, options) {
        switch (type) {
            case "FILE_NON_EXISTENT":
                err("Siphon could not find ".concat(source.toString(), "."));
                break;
            case "NO_ROOTDIR":
                err("The rootDir '".concat(source, "' does not exist."));
                break;
            case "CSS_NON_EXISTENT":
                err("The stylesheet '".concat(source.toString(), "' cannot be found."));
                break;
            case "CSS_SELF_IMPORT":
                err("recursion_hell: The stylesheet ".concat(source.toString(), " has an import to itself."));
                break;
            case "CSS_CIRCULAR_IMPORT":
                err("The stylesheet ".concat(source.toString(), " has already been imported into this project."));
                break;
            case "NOT_A_DIRECTORY":
                err("The path ".concat(source.toString(), " does not lead to a directory."));
                break;
            case "COMMENT_UNCLOSED":
                err("Siphon encountered an unclosed comment.", source, charac);
                break;
            case "TAG_UNCLOSED":
                err("Expected a start tag.", source, charac);
                break;
            case "HTML_FRAGMENT":
                err("Siphon does not support HTML fragments.", source, charac);
                break;
            case "INVALID_TAG":
                err("Invalid tag Name '".concat(options.name, "'"), source, charac);
                break;
            case "INVALID_VOID_TAG":
                err("'".concat(options.name, "' cannot be used as a void tag."), source, charac);
                break;
            case "ABRUPT":
                err("Unexpected end of file.", source);
                break;
            case "CLOSING_TAG_ATTR":
                err("Attributes are not allowed in the closing tag.", source, charac);
                break;
            case "UNEXPECTED_CLOSE":
                err("Encountered unexpected closing tag.", source, charac);
                break;
            case "OPEN_CURLY_EXPECTED":
                err("Siphon expected a {", source, charac);
                break;
        }
    },
};
exports.default = Errors;
