"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parseUtils_1 = require("../parser/html/parseUtils");
var formatter_1 = require("../formatter");
var minifier_1 = require("../minifier");
var tab = "  ";
function formatExternalText(externalText, assetType, spacers) {
    if (assetType === "style")
        return formatter_1.default.formatCSS(externalText, spacers, tab);
    if (assetType === "script")
        return externalText;
}
function minifyExternalText(externalText, assetType) {
    if (externalText !== undefined && assetType === "style")
        return minifier_1.default.minifyCSS(externalText);
}
var Generator = /** @class */ (function () {
    function Generator() {
    }
    /**
     * Takes in a set of nodes and returns their original HTML format.
     * @param nodes The tree(s) of nodes generated from the original HTML.
     * @returns A stringified text representing the original HTML content.
     */
    Generator.prototype.generate = function (nodes, options, spacers) {
        var _this = this;
        if (spacers === void 0) { spacers = ""; }
        var html = "";
        if (nodes) {
            nodes.forEach(function (node) {
                var _a, _b, _c;
                // Only run if the node has a type. i.e. Ignore deleted and manipulated nodes.
                if (node.type) {
                    var attributeList_1 = "";
                    if (node.type !== "text") {
                        if (options.formatFiles)
                            html += spacers;
                        if (node.attributes) {
                            if (node.attributeList &&
                                node.attributeList.length > 50 &&
                                options.formatFiles) {
                                attributeList_1 = "\n" + spacers + tab;
                                Object.entries(node.attributes).forEach(function (entry) {
                                    if (entry[1] !== true) {
                                        attributeList_1 +=
                                            " ".concat(entry[0], "=\"").concat(entry[1], "\"") + "\n" + spacers + tab;
                                    }
                                    else
                                        attributeList_1 += " ".concat(entry[0]) + "\n" + spacers + tab;
                                });
                            }
                            else {
                                Object.entries(node.attributes).forEach(function (entry) {
                                    if (entry[1] !== true) {
                                        attributeList_1 += " ".concat(entry[0], "=\"").concat(entry[1], "\"");
                                    }
                                    else
                                        attributeList_1 += " ".concat(entry[0]);
                                });
                            }
                        }
                    }
                    switch (true) {
                        // Handle foreign tags.
                        case (0, parseUtils_1.isForeignTag)(node.tagName):
                            html += "<".concat(node.tagName).concat(attributeList_1, ">");
                            html += "".concat(options.formatFiles && node.content
                                ? formatExternalText(node.content, node.tagName, spacers)
                                : node.content
                                    ? minifyExternalText(node.content, node.tagName)
                                    : "");
                            if (options.formatFiles && node.content)
                                html += spacers;
                            html += "</".concat(node.tagName, ">");
                            if (options.formatFiles)
                                html += "\n";
                            break;
                        // Handle text nodes.
                        case node.type === "text":
                            if (options.formatFiles &&
                                node.content &&
                                node.content.length > 70) {
                                html += "\n" + spacers;
                                var textSlices = [];
                                var i = 0;
                                do {
                                    if (node.content[i + 70] === " ") {
                                        textSlices.push((_a = node.content) === null || _a === void 0 ? void 0 : _a.slice(i, i + 70));
                                        i += 70;
                                    }
                                    else {
                                        var j = i + 70;
                                        while (node.content[j] && node.content[j] !== " ") {
                                            j++;
                                        }
                                        textSlices.push((_b = node.content) === null || _b === void 0 ? void 0 : _b.slice(i, j));
                                        i = j;
                                    }
                                } while (node.content[i]);
                                html += textSlices.join("\n" + spacers) + "\n";
                            }
                            else
                                html += "".concat(node.content);
                            break;
                        // Handle DOCTYPE definition.
                        case node.type === "definition":
                            html += "<".concat(node.tagName).concat(attributeList_1, ">").concat(options.formatFiles ? "\n" : "");
                            break;
                        // Handle void tags.
                        case (0, parseUtils_1.isVoid)(node.tagName):
                            html += "<".concat(node.tagName).concat(attributeList_1).concat(options.formatFiles ? " " : "", "/>").concat(options.formatFiles ? "\n" : "");
                            break;
                        // Handle regular tags.
                        default:
                            html += "<".concat(node.tagName).concat(attributeList_1, ">");
                            if (node.children && options.formatFiles) {
                                if (node.children[0].type !== "text") {
                                    html += "\n";
                                }
                            }
                            html += _this.generate(node.children, options, spacers + tab);
                            if (options.formatFiles) {
                                if ((node.children && node.children[0].type !== "text") ||
                                    (node.children &&
                                        node.children[0].type == "text" &&
                                        node.children[0].content &&
                                        ((_c = node.children[0].content) === null || _c === void 0 ? void 0 : _c.length) > 70)) {
                                    html += spacers;
                                }
                            }
                            html += "</".concat(node.tagName, ">");
                            if (options.formatFiles)
                                html += "\n";
                            break;
                    }
                }
            });
        }
        return html;
    };
    return Generator;
}());
exports.default = Generator;
