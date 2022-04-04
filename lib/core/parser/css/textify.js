"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path = require("path");
var errors_1 = require("../../../errors");
var relativePath_1 = require("../../../utils/relativePath");
var parseUtils_1 = require("../html/parseUtils");
/**
 * Runs through a CSS file, resolves its imports and removes comments.
 * @param source The CSS file to parse through.
 * @returns compiled css text.
 */
function textify(source) {
    var foreignImports = [];
    var weirdImports = [];
    var allImports = [source.toString()];
    function textify_core(source) {
        var cssText = (0, fs_1.readFileSync)(source).toString();
        var store = "";
        var text = "";
        var cssFileImports = [];
        for (var i = 0; cssText[i]; i++) {
            //   Ignore comments.
            if (cssText.slice(i, i + 2) === "/*") {
                do
                    i++;
                while (cssText[i] && cssText.slice(i, i + 2) !== "*/");
                i += 2;
            }
            else if (parseUtils_1.stringMarkers.includes(cssText[i])) {
                //   Ignore strings.
                var marker = cssText[i++];
                text += marker;
                while (cssText[i] && cssText[i] !== marker)
                    text += cssText[i++];
                text += cssText[i++];
                // Import statements.
            }
            else if (cssText.slice(i, i + 7) === "@import") {
                i += 8;
                while ((0, parseUtils_1.isSpaceCharac)(cssText[i]))
                    i++;
                while (cssText[i] && cssText[i] !== ";") {
                    if (parseUtils_1.stringMarkers.includes(cssText[i])) {
                        var marker = cssText[i++];
                        store += marker;
                        while (cssText[i] && cssText[i] !== marker)
                            store += cssText[i++];
                        store += marker;
                        i++;
                    }
                    else
                        store += cssText[i++];
                }
                if (store.includes("https://") || store.includes("http://")) {
                    foreignImports.push("@import " + store);
                }
                else
                    cssFileImports.push(store);
                store = "";
                while ((0, parseUtils_1.isSpaceCharac)(cssText[i]))
                    i++;
            }
            else if (cssText.slice(i, i + 4) === "url(") {
                text += "url(";
                i += 4;
                while (cssText[i] && cssText[i] !== ")") {
                    if (parseUtils_1.stringMarkers.includes(cssText[i])) {
                        var marker = cssText[i++];
                        store += marker;
                        while (cssText[i] && cssText[i] !== marker) {
                            store += cssText[i++];
                        }
                        (0, parseUtils_1.checkForEnd)(cssText[i], source);
                        store += marker;
                    }
                    else
                        store += cssText[i];
                    i++;
                }
                (0, parseUtils_1.checkForEnd)(cssText[i], source);
                if (store.includes("https://") || store.includes("http://")) {
                    text += store + ")";
                }
                else {
                    if (parseUtils_1.stringMarkers.includes(store[0])) {
                        store = store.slice(1, store.lastIndexOf(store[0]));
                    }
                    var truePath = (0, relativePath_1.default)(source, store);
                    weirdImports.push({
                        srcpath: truePath,
                        name: path.basename(truePath),
                    });
                    text += "\"./".concat(path.basename(truePath), "\")");
                }
                store = "";
            }
            else
                text += cssText[i];
        }
        cssFileImports.forEach(function (cssimport) {
            var src = "";
            var i = 0;
            while (cssimport[i]) {
                if (parseUtils_1.stringMarkers.includes(cssimport[i])) {
                    var marker = cssimport[i++];
                    while (cssimport[i] && cssimport[i] !== marker)
                        src += cssimport[i++];
                }
                else if (cssimport.slice(i, i + 3) === "url") {
                    i += 3;
                    while ((0, parseUtils_1.isSpaceCharac)(cssimport[i]))
                        i++;
                    if (cssimport[i] === "(") {
                        i++;
                        while (cssimport[i] && cssimport[i] !== ")") {
                            if (parseUtils_1.stringMarkers.includes(cssimport[i])) {
                                var marker = cssimport[i++];
                                while (cssimport[i] && cssimport[i] !== marker)
                                    src += cssimport[i++];
                            }
                            else
                                src += cssimport[i++];
                        }
                    }
                }
                else
                    src += cssimport[i++];
            }
            if (src.endsWith(")"))
                src = src.slice(0, -1);
            if (src.endsWith(".css")) {
                var realSrc = (0, relativePath_1.default)(source, src);
                if (realSrc === source)
                    errors_1.default.enc("CSS_SELF_IMPORT", source);
                if (!(0, fs_1.existsSync)(realSrc))
                    errors_1.default.enc("CSS_NON_EXISTENT", realSrc);
                if (allImports.includes(realSrc))
                    errors_1.default.enc("CSS_CIRCULAR_IMPORT", realSrc);
                text = textify_core(realSrc) + "\n" + text;
                allImports.push(realSrc);
            }
            else
                foreignImports.push("@import url(".concat(src, ")"));
        });
        return text;
    }
    var result = textify_core(source);
    return {
        text: foreignImports.join(";") +
            (foreignImports.length > 0 ? ";" : "") +
            result,
        links: weirdImports,
    };
}
exports.default = textify;
