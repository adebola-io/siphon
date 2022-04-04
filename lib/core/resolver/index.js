"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var errors_1 = require("../../errors");
var getFileName_1 = require("../../utils/getFileName");
var relativePath_1 = require("../../utils/relativePath");
var formatter_1 = require("../formatter");
var minifier_1 = require("../minifier");
var parser_1 = require("../parser");
var tagNameSearch_1 = require("../parser/html/tagNameSearch");
var Resolver = /** @class */ (function () {
    function Resolver(sourceFile, destination, options) {
        this.assets = {};
        this.options = options;
        this.source = sourceFile;
        this.destination = destination;
        this.outDir = (0, relativePath_1.default)(destination, "./");
        this.baseName = (0, getFileName_1.default)(destination);
    }
    Resolver.prototype.resolveStyles = function (nodes) {
        var _this = this;
        var _a;
        var styleLinks = (0, tagNameSearch_1.default)(nodes, "link").filter(function (link) {
            var attributes = link.attributes;
            return ((attributes === null || attributes === void 0 ? void 0 : attributes.rel) === "stylesheet" &&
                !((attributes === null || attributes === void 0 ? void 0 : attributes.href.startsWith("http://")) ||
                    (attributes === null || attributes === void 0 ? void 0 : attributes.href.startsWith("https://"))));
        });
        var cssContent = "";
        styleLinks.forEach(function (link) {
            var _a;
            var truePath = (0, relativePath_1.default)(_this.source, (_a = link.attributes) === null || _a === void 0 ? void 0 : _a.href);
            var resource = parser_1.default.css.textify(truePath);
            resource.links.forEach(function (resourceLink) {
                if (!_this.assets[resourceLink.name]) {
                    if ((0, fs_1.existsSync)(resourceLink.srcpath) &&
                        !(0, fs_1.lstatSync)(resourceLink.srcpath).isDirectory()) {
                        (0, fs_1.writeFile)("".concat(_this.outDir, "/").concat(resourceLink.name), (0, fs_1.readFileSync)(resourceLink.srcpath), "base64", function () { });
                        _this.assets[resourceLink.name] = resourceLink.srcpath;
                    }
                    else
                        errors_1.default.enc("FILE_NON_EXISTENT", resourceLink.srcpath);
                }
            });
            if (_this.options.internalStyles) {
                link.tagName = "style";
                link.content = resource.text;
                delete link.attributes.rel;
                delete link.attributes.href;
            }
            else {
                delete link.attributes;
                delete link.content;
                delete link.type;
                delete link.parent;
                cssContent += resource.text;
            }
        });
        if (!this.options.internalStyles) {
            if (this.options.formatFiles) {
                cssContent = formatter_1.default.formatCSS(cssContent, "", "  ", true).trim();
            }
            else {
                cssContent = minifier_1.default.minifyCSS(cssContent);
            }
            var cssBundle = "".concat(this.baseName, ".bundle.css");
            (0, fs_1.writeFileSync)("".concat(this.outDir, "/").concat(cssBundle), cssContent);
            var head = (0, tagNameSearch_1.default)(nodes, "head")[0];
            (_a = head.children) === null || _a === void 0 ? void 0 : _a.push({
                type: "element",
                tagName: "link",
                isVoid: true,
                attributeList: "rel=\"stylesheet\" href=\"./".concat(cssBundle, "\""),
                attributes: {
                    rel: "stylesheet",
                    href: "./".concat(cssBundle),
                },
            });
        }
        return nodes;
    };
    Resolver.prototype.resolve = function (nodes) {
        nodes = this.resolveStyles(nodes);
        return nodes;
    };
    return Resolver;
}());
exports.default = Resolver;
