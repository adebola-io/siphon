"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var minifier_1 = require("../minifier");
var parseUtils_1 = require("../../core/parser/html/parseUtils");
/**
 * Formats CSS text.
 * @param srcText Source CSS text.
 * @param spacers The parent indent.
 * @param tab The specified indenting width.
 * @returns Formatted CSS text.
 */
function formatCSS(srcText, spacers, tab, isExternalSheet) {
    if (spacers === void 0) { spacers = ""; }
    if (tab === void 0) { tab = ""; }
    if (isExternalSheet === void 0) { isExternalSheet = false; }
    srcText = minifier_1.default.minifyCSS(srcText);
    var formattedText = "";
    var level = 0;
    var store = "";
    // starting on a newline.
    for (var i = 0; srcText[i]; i++) {
        if (srcText[i] === "(") {
            i++;
            while (srcText[i] && srcText[i] !== ")") {
                store += srcText[i++];
            }
            (0, parseUtils_1.checkForEnd)(srcText[i], "./");
            formattedText += "(" + store + ")";
            store = "";
        }
        else if (srcText[i] === ">") {
            formattedText += " > ";
        }
        else if (srcText[i + 1] === "{") {
            // entry of new class.
            level++;
            formattedText += srcText[i++];
            formattedText += " {" + "\n" + spacers;
            if (!isExternalSheet)
                formattedText += tab;
            for (var x = 0; x < level; x++) {
                formattedText += tab;
            }
        }
        else if (srcText[i] === "}") {
            // Add semicolons if not present.
            if (srcText[i - 1] !== ";" &&
                srcText[i - 1] !== "{" &&
                srcText[i - 1] !== "}") {
                formattedText += ";";
            }
            formattedText += "\n" + spacers;
            var x = 0;
            if (isExternalSheet)
                x = 1;
            for (x; x < level; x++) {
                formattedText += tab;
            }
            level--;
            formattedText += "}";
        }
        else if (srcText[i - 1] === "}" || srcText[i - 1] === undefined) {
            formattedText += "\n" + spacers;
            if (!isExternalSheet)
                formattedText += tab;
            for (var x = 0; x < level; x++) {
                formattedText += tab;
            }
            formattedText += srcText[i];
        }
        else if (srcText[i] === ";" && srcText[i + 1] !== "}") {
            if (srcText[i - 1] !== ";") {
                formattedText += ";" + "\n" + spacers;
                if (!isExternalSheet)
                    formattedText += tab;
                for (var x = 0; x < level; x++) {
                    formattedText += tab;
                }
            }
        }
        else
            formattedText += srcText[i];
    }
    // ending with a newline.
    formattedText += "\n";
    return formattedText;
    // return text
}
exports.default = formatCSS;
