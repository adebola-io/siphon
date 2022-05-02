"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var errors_1 = require("../../../errors");
var utils_1 = require("../../../utils");
var types_1 = require("../../../types");
function parse(src, mode) {
    if (mode === void 0) { mode = "file"; }
    var text = "";
    if (mode === "file")
        text = (0, fs_1.readFileSync)(src).toString();
    else
        text = src.toString();
    function parserCore(text, root) {
        if (root === void 0) { root = new types_1.Stylesheet(0, 0); }
        // String Reader.
        function readString(i) {
            var marker = text[i++], str = "";
            while (text[i] && text[i] !== marker) {
                if (text[i] === "\n") {
                    errors_1.default.enc("CSS_STRING_OR_URI_EXPECTED", src, i);
                }
                else if (text[i] === "\\" &&
                    text[i + 1] === marker &&
                    text[i - 1] !== "\\") {
                    str += text[(i += 2)] + marker;
                }
                else
                    str += text[i++];
            }
            return { str: str, end: i + 1, marker: marker };
        }
        // @ Rules.
        function readAtRule(i) {
            // @import Rules.
            function readImportRule(start, i) {
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                var href = "", resourcetype;
                switch (true) {
                    case text.slice(i, i + 4) === "url(":
                        i += 4;
                        while ((0, utils_1.isSpaceCharac)(text[i]))
                            i++;
                        if (!/'|"/.test(text[i])) {
                            while (text[i] && text[i] !== ")") {
                                if (text[i] === "\n") {
                                    errors_1.default.enc("CLOSING_BRAC_EXPECTED", src, i);
                                }
                                else
                                    href += text[i++];
                            }
                            (0, utils_1.checkForEnd)(text[i], src);
                            i++;
                            break;
                        }
                    case /'|"/.test(text[i]):
                        var movethrough = readString(i);
                        href = movethrough.str;
                        i = movethrough.end;
                        break;
                    default:
                        errors_1.default.enc("CSS_STRING_OR_URI_EXPECTED", src, i);
                }
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                if (text[i] !== ";" && i !== text.length)
                    errors_1.default.enc("SEMI_COLON_EXPECTED", src, i);
                href = href.trim().trimEnd();
                if (href.startsWith("http://") || href.startsWith("https://")) {
                    resourcetype = "cross-site";
                }
                else
                    resourcetype = "local";
                var rule = new types_1.ImportRule(start, i, resourcetype);
                rule.href = href;
                root.rules.push(rule);
                read(i + 1);
            }
            // @font-face rules.
            function readFontFaceRule(start, i) {
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                if (text[i] !== "{")
                    errors_1.default.enc("CSS_OPEN_CURL_EXPECTED", src, i);
                i++;
                var rule = new types_1.FontFaceRule(start, 0);
                function readFontStyles() {
                    var property = "";
                    var value = "";
                    while (text[i] && text[i] !== ":")
                        property += text[i++];
                    if (!text[i])
                        errors_1.default.enc("COLON_EXPECTED", src, i);
                    i++;
                    while (text[i] && !/;|}/.test(text[i])) {
                        if (/'|"/.test(text[i])) {
                            var strn = readString(i);
                            value += strn.marker + strn.str + strn.marker;
                            i = strn.end;
                        }
                        else
                            value += text[i++];
                    }
                    switch (property.trim().trimEnd()) {
                        case "font-family":
                            rule.family = value.trim().trimEnd();
                            break;
                        case "src":
                            rule.source = value.trim().trimEnd();
                            break;
                        default:
                            break;
                    }
                    while (text[i] === ";" || (0, utils_1.isSpaceCharac)(text[i]))
                        i++;
                    if (text[i] !== "}")
                        readFontStyles();
                }
                readFontStyles();
                rule.loc.end = i;
                root.rules.push(rule);
                read(i + 1);
            }
            // @media rules.
            function readMediaRule(start, i) {
                var params = "";
                while (text[i] && text[i] !== "{") {
                    if (/"|'/.test(text[i])) {
                        var value = readString(i);
                        params += value.marker + value.str + value.marker;
                        i = value.end;
                    }
                    else
                        params += text[i++];
                }
                i++;
                var level = 1, chunk = "";
                while (text[i] && level) {
                    if (text[i] === "{")
                        level++;
                    else if (text[i] === "}")
                        level--;
                    chunk += text[i++];
                }
                chunk = chunk.slice(0, -1);
                var mediarule = parserCore(chunk, new types_1.MediaRule(start, 0, params.trim().trimEnd()));
                mediarule.loc.end = i;
                root.rules.push(mediarule);
                read(i);
            }
            // @supports rules.
            function readSupportRule(start, i) {
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                var inverseQuery = false;
                if (text.slice(i, i + 3) === "not") {
                    inverseQuery = true;
                    i += 3;
                    while ((0, utils_1.isSpaceCharac)(text[i]))
                        i++;
                }
                if (!text[i] || text[i] !== "(")
                    errors_1.default.enc("OPEN_BRAC_EXPECTED", src, i);
                i++;
                var query = "";
                while (text[i] && text[i] !== ")") {
                    if (/'|"/.test(text[i])) {
                        var str = readString(i);
                        query += str.marker + str.str + str.marker;
                        i = str.end;
                    }
                    else
                        query += text[i++];
                }
                if (!text[i])
                    errors_1.default.enc("CLOSING_BRAC_EXPECTED", src, i);
                i++;
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                if (text[i] !== "{")
                    errors_1.default.enc("CSS_OPEN_CURL_EXPECTED", src, i);
                i++;
                var level = 1, chunk = "";
                while (text[i] && level) {
                    if (text[i] === "{")
                        level++;
                    else if (text[i] === "}")
                        level--;
                    chunk += text[i++];
                }
                var supportRule = parserCore(chunk.slice(0, -1).trim().trimEnd(), new types_1.SupportRule(start, i, query, inverseQuery));
                supportRule.loc.end = i;
                root.rules.push(supportRule);
                read(i);
            }
            // @keyframes rules.
            function readKeyframeRule(start, i) {
                var keyframeRule = new types_1.KeyframeRule(start, 0);
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                var identifier = "";
                while (text[i] && text[i] !== "{")
                    identifier += text[i++];
                if (!text[i])
                    errors_1.default.enc("CSS_OPEN_CURL_EXPECTED", src, i);
                i++;
                if ((0, utils_1.isIllegalCSSIdentifier)(identifier))
                    errors_1.default.enc("CSS_INVALID_IDENTIFIER", src, i);
                keyframeRule.identifier = identifier.trimEnd();
                function readFrameStyles(frame, i) {
                    while ((0, utils_1.isSpaceCharac)(text[i]))
                        i++;
                    var style = new types_1.Style("", "");
                    style.loc.start = i;
                    while (text[i] && text[i] !== ":")
                        style.property += text[i++];
                    style.property = style.property.trimEnd();
                    i++;
                    while (text[i] && !/\;|}/.test(text[i])) {
                        if (/'|"/.test(text[i])) {
                            var movethr = readString(i);
                            style.value += movethr.marker + movethr.str + movethr.marker;
                            i = movethr.end;
                        }
                        else
                            style.value += text[i++];
                    }
                    style.value = style.value.trim().trimEnd();
                    if (!text[i])
                        errors_1.default.enc("CSS_OPEN_CURL_EXPECTED", src, i);
                    style.loc.end = i;
                    frame.styles.push(style);
                    frame.notation[style.property] = style.value;
                    while (text[i] === ";" || (0, utils_1.isSpaceCharac)(text[i]))
                        i++;
                    if (text[i] !== "}")
                        return readFrameStyles(frame, i);
                    else
                        return i + 1;
                }
                function readFrame() {
                    while ((0, utils_1.isSpaceCharac)(text[i]))
                        i++;
                    var frame = { mark: "", styles: [], notation: {} };
                    while (text[i] && text[i] !== "{")
                        frame.mark += text[i++];
                    if (!text[i])
                        errors_1.default.enc("CSS_OPEN_CURL_EXPECTED", src, i);
                    frame.mark = frame.mark.trimEnd();
                    i = readFrameStyles(frame, ++i);
                    keyframeRule.frames.push(frame);
                    while ((0, utils_1.isSpaceCharac)(text[i]))
                        i++;
                    if (text[i] !== "}")
                        readFrame();
                }
                readFrame();
                keyframeRule.loc.end = i;
                root.rules.push(keyframeRule);
                read(i + 1);
            }
            // @charset rules.
            function readCharsetRule(start, i) {
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
            }
            var atRuleName = "";
            var start = i - 1;
            while (text[i] && /[a-zA-Z]|-|[0-9]/.test(text[i])) {
                atRuleName += text[i++];
            }
            switch (atRuleName) {
                case "import":
                    readImportRule(start, i);
                    break;
                case "font-face":
                    readFontFaceRule(start, i);
                    break;
                case "media":
                    readMediaRule(start, i);
                    break;
                case "supports":
                    readSupportRule(start, i);
                    break;
                case "keyframes":
                    readKeyframeRule(start, i);
                    break;
                case "charset":
                    readCharsetRule(start, i);
                    break;
                default:
                    break;
            }
        }
        // Styles.
        function readStyleRule(i) {
            var start = i;
            // Read selectors.
            while ((0, utils_1.isSpaceCharac)(text[i]))
                i++;
            var selectorsRaw = "";
            while (text[i] && text[i] !== "{") {
                if (/'|"/.test(text[i])) {
                    var movethr = readString(i);
                    selectorsRaw += movethr.marker + movethr.str + movethr.marker;
                    i = movethr.end;
                }
                else
                    selectorsRaw += text[i++];
            }
            if (!text[i])
                errors_1.default.enc("CSS_OPEN_CURL_EXPECTED", src, i);
            i++;
            var rule = new types_1.StyleRule();
            rule.loc.start = start;
            var selector = "";
            for (var x = 0; selectorsRaw[x]; x++) {
                if (/'|"/.test(selectorsRaw[x])) {
                    var marker = selectorsRaw[x++];
                    selector += marker;
                    while (selectorsRaw[x] && selectorsRaw[x] !== marker) {
                        if (selectorsRaw[x] === "\n") {
                            errors_1.default.enc("CSS_STRING_OR_URI_EXPECTED", src, i);
                        }
                        else if (selectorsRaw[x] === "\\" &&
                            selectorsRaw[x + 1] === marker &&
                            selectorsRaw[x - 1] !== "\\") {
                            selector += selectorsRaw[(x += 2)] + marker;
                        }
                        else
                            selector += selectorsRaw[x++];
                    }
                    selector += marker;
                }
                else if (selectorsRaw[x] === ",") {
                    rule.selectors.push(selector.trim().trimEnd());
                    selector = "";
                }
                else
                    selector += selectorsRaw[x];
            }
            rule.selectors.push(selector.trim().trimEnd());
            // Read styles.
            function readStyles() {
                var start = i;
                var property = "", value = "";
                while ((0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                if (text[i] === "}")
                    return;
                while (text[i] && text[i] !== ":")
                    property += text[i++];
                i++;
                while (text[i] && text[i] !== ";" && text[i] !== "}") {
                    if (/'|"/.test(text[i])) {
                        var strn = readString(i);
                        value += strn.marker + strn.str + strn.marker;
                        i = strn.end;
                    }
                    else
                        value += text[i++];
                }
                var relation = new types_1.Style(property.trim().trimEnd(), value.trim().trimEnd());
                relation.loc.start = start;
                relation.loc.end = i;
                rule.content.push(relation);
                rule.notation[relation.property] = relation.value;
                while (text[i] === ";" || (0, utils_1.isSpaceCharac)(text[i]))
                    i++;
                if (text[i] !== "}")
                    readStyles();
            }
            readStyles();
            rule.loc.end = i;
            root.rules.push(rule);
            read(i + 1);
        }
        // Strip Comments.
        function removeComments() {
            var stripped = "";
            for (var i = 0; text[i]; i++) {
                if (text.slice(i, i + 2) === "/*") {
                    i += 2;
                    while (text[i] && text.slice(i, i + 2) !== "*/")
                        i++;
                    i++;
                }
                else
                    stripped += text[i];
            }
            return stripped.trim().trimEnd();
        }
        text = removeComments();
        // Base.
        function read(i) {
            while ((0, utils_1.isSpaceCharac)(text[i]))
                i++;
            if (text[i])
                if (text[i] === "@")
                    readAtRule(i + 1);
                else if (/[a-z]|[A-Z]|:|#|.|\[/.test(text[i]))
                    readStyleRule(i);
        }
        // Start.
        read(0);
        root.loc.end = text.length;
        return root;
    }
    return parserCore(text);
}
exports.default = parse;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
var tab = "  ";
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
                        case (0, utils_1.isForeignTag)(node.tagName):
                            html += "<".concat(node.tagName).concat(attributeList_1, ">");
                            if (node.content) {
                                if (options.formatFiles) {
                                    html += "\n".concat(node.content);
                                    html += spacers;
                                }
                                else
                                    html += node.content;
                            }
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
                        case (0, utils_1.isVoid)(node.tagName):
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
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberExpression = exports.UpdateExpression = exports.Property = exports.ObjectExpression = exports.ArrayExpression = exports.AssignmentExpression = exports.UnaryExpression = exports.ClassExpression = exports.ImportExpression = exports.ThisExpression = exports.NewExpression = exports.BlockStatement = exports.CatchClause = exports.TryStatement = exports.ThrowStatement = exports.ReturnStatement = exports.BreakStatement = exports.ForInStatement = exports.ForStatement = exports.SwitchCase = exports.SwitchStatement = exports.DoWhileStatement = exports.Comma = exports.WhileStatement = exports.IfStatement = exports.EmptyStatement = exports.ExpressionStatment = exports.ExportAllDeclaration = exports.ExportDefaultDeclaration = exports.ExportSpecifier = exports.ExportNamedDeclaration = exports.ImportNamespaceSpecifier = exports.ImportDefaultSpecifier = exports.ImportSpecifier = exports.ImportDeclaration = exports.Super = exports.PropertyDefinition = exports.MethodDefinition = exports.ClassBody = exports.ClassDeclaration = exports.FunctionDeclaration = exports.VariableDeclarator = exports.VariableDeclaration = exports.PrivateIdentifier = exports.Identifier = exports.TemplateElement = exports.TemplateLiteral = exports.Literal = exports.Program = exports.JSNode = void 0;
exports.isValidPropertyKeyStart = exports.isValidForParam = exports.isValidForInParam = exports.isValidParameter = exports.isChainExpression = exports.isOptional = exports.isValidReference = exports.isIdentifier = exports.isValidExpression = exports.SpreadElement = exports.ObjectPattern = exports.ArrayPattern = exports.AssignmentPattern = exports.ArrowFunctionExpression = exports.SequenceExpression = exports.LogicalExpression = exports.BinaryExpression = exports.FunctionExpression = exports.CallExpression = exports.ConditionalExpression = exports.ChainExpression = void 0;
var utils_1 = require("../utils");
var JSNode = /** @class */ (function () {
    function JSNode(start) {
        this.type = "Node";
        this.loc = { start: start };
    }
    return JSNode;
}());
exports.JSNode = JSNode;
var Program = /** @class */ (function (_super) {
    __extends(Program, _super);
    function Program() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "Program";
        _this.body = [];
        return _this;
        /** The last node appended to the body of the program. */
        // last?: JSNodes;
    }
    /** Add a node to the global scope of the program. */
    Program.prototype.push = function (node, options) {
        if (node)
            this.body.push(node);
    };
    /** Remove a node from the global scope of the program.*/
    Program.prototype.pop = function () {
        // this.last = this.body[this.body.length - 2];
        return this.body.pop();
    };
    return Program;
}(JSNode));
exports.Program = Program;
var Literal = /** @class */ (function (_super) {
    __extends(Literal, _super);
    function Literal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "Literal";
        _this.raw = "";
        return _this;
    }
    return Literal;
}(JSNode));
exports.Literal = Literal;
var TemplateLiteral = /** @class */ (function (_super) {
    __extends(TemplateLiteral, _super);
    function TemplateLiteral() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "TemplateLiteral";
        return _this;
    }
    return TemplateLiteral;
}(JSNode));
exports.TemplateLiteral = TemplateLiteral;
var TemplateElement = /** @class */ (function (_super) {
    __extends(TemplateElement, _super);
    function TemplateElement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "TemplateElement";
        return _this;
    }
    return TemplateElement;
}(JSNode));
exports.TemplateElement = TemplateElement;
var Identifier = /** @class */ (function (_super) {
    __extends(Identifier, _super);
    function Identifier() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "Identifier";
        _this.name = "";
        return _this;
    }
    return Identifier;
}(JSNode));
exports.Identifier = Identifier;
var PrivateIdentifier = /** @class */ (function (_super) {
    __extends(PrivateIdentifier, _super);
    function PrivateIdentifier() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "PrivateIdentifier";
        _this.name = "";
        return _this;
    }
    return PrivateIdentifier;
}(JSNode));
exports.PrivateIdentifier = PrivateIdentifier;
var VariableDeclaration = /** @class */ (function (_super) {
    __extends(VariableDeclaration, _super);
    function VariableDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "VariableDeclaration";
        _this.kind = "";
        _this.declarations = [];
        return _this;
    }
    return VariableDeclaration;
}(JSNode));
exports.VariableDeclaration = VariableDeclaration;
var VariableDeclarator = /** @class */ (function (_super) {
    __extends(VariableDeclarator, _super);
    function VariableDeclarator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "VariableDeclarator";
        return _this;
    }
    return VariableDeclarator;
}(JSNode));
exports.VariableDeclarator = VariableDeclarator;
var FunctionDeclaration = /** @class */ (function (_super) {
    __extends(FunctionDeclaration, _super);
    function FunctionDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "FunctionDeclaration";
        _this.params = [];
        return _this;
    }
    return FunctionDeclaration;
}(JSNode));
exports.FunctionDeclaration = FunctionDeclaration;
var ClassDeclaration = /** @class */ (function (_super) {
    __extends(ClassDeclaration, _super);
    function ClassDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ClassDeclaration";
        _this.id = null;
        _this.superClass = null;
        return _this;
    }
    return ClassDeclaration;
}(JSNode));
exports.ClassDeclaration = ClassDeclaration;
var ClassBody = /** @class */ (function (_super) {
    __extends(ClassBody, _super);
    function ClassBody() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ClassBody";
        _this.body = [];
        return _this;
    }
    return ClassBody;
}(JSNode));
exports.ClassBody = ClassBody;
var MethodDefinition = /** @class */ (function (_super) {
    __extends(MethodDefinition, _super);
    function MethodDefinition() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "MethodDefinition";
        return _this;
    }
    return MethodDefinition;
}(JSNode));
exports.MethodDefinition = MethodDefinition;
var PropertyDefinition = /** @class */ (function (_super) {
    __extends(PropertyDefinition, _super);
    function PropertyDefinition() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "PropertyDefinition";
        return _this;
    }
    return PropertyDefinition;
}(JSNode));
exports.PropertyDefinition = PropertyDefinition;
var Super = /** @class */ (function (_super) {
    __extends(Super, _super);
    function Super() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "Super";
        return _this;
    }
    return Super;
}(JSNode));
exports.Super = Super;
var ImportDeclaration = /** @class */ (function (_super) {
    __extends(ImportDeclaration, _super);
    function ImportDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ImportDeclaration";
        _this.specifiers = [];
        return _this;
    }
    return ImportDeclaration;
}(JSNode));
exports.ImportDeclaration = ImportDeclaration;
var ImportSpecifier = /** @class */ (function (_super) {
    __extends(ImportSpecifier, _super);
    function ImportSpecifier() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ImportSpecifier";
        return _this;
    }
    return ImportSpecifier;
}(JSNode));
exports.ImportSpecifier = ImportSpecifier;
var ImportDefaultSpecifier = /** @class */ (function (_super) {
    __extends(ImportDefaultSpecifier, _super);
    function ImportDefaultSpecifier() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ImportDefaultSpecifier";
        return _this;
    }
    return ImportDefaultSpecifier;
}(JSNode));
exports.ImportDefaultSpecifier = ImportDefaultSpecifier;
var ImportNamespaceSpecifier = /** @class */ (function (_super) {
    __extends(ImportNamespaceSpecifier, _super);
    function ImportNamespaceSpecifier() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ImportNamespaceSpecifier";
        return _this;
    }
    return ImportNamespaceSpecifier;
}(JSNode));
exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier;
var ExportNamedDeclaration = /** @class */ (function (_super) {
    __extends(ExportNamedDeclaration, _super);
    function ExportNamedDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ExportNamedDeclaration";
        _this.declaration = null;
        _this.specifiers = [];
        return _this;
    }
    return ExportNamedDeclaration;
}(JSNode));
exports.ExportNamedDeclaration = ExportNamedDeclaration;
var ExportSpecifier = /** @class */ (function (_super) {
    __extends(ExportSpecifier, _super);
    function ExportSpecifier() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ExportSpecifier";
        return _this;
    }
    return ExportSpecifier;
}(JSNode));
exports.ExportSpecifier = ExportSpecifier;
var ExportDefaultDeclaration = /** @class */ (function (_super) {
    __extends(ExportDefaultDeclaration, _super);
    function ExportDefaultDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ExportDefaultDeclaration";
        return _this;
    }
    return ExportDefaultDeclaration;
}(JSNode));
exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
var ExportAllDeclaration = /** @class */ (function (_super) {
    __extends(ExportAllDeclaration, _super);
    function ExportAllDeclaration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ExportAllDeclaration";
        return _this;
    }
    return ExportAllDeclaration;
}(JSNode));
exports.ExportAllDeclaration = ExportAllDeclaration;
var ExpressionStatment = /** @class */ (function (_super) {
    __extends(ExpressionStatment, _super);
    function ExpressionStatment() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ExpressionStatement";
        return _this;
    }
    return ExpressionStatment;
}(JSNode));
exports.ExpressionStatment = ExpressionStatment;
var EmptyStatement = /** @class */ (function (_super) {
    __extends(EmptyStatement, _super);
    function EmptyStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "EmptyStatement";
        return _this;
    }
    return EmptyStatement;
}(JSNode));
exports.EmptyStatement = EmptyStatement;
var IfStatement = /** @class */ (function (_super) {
    __extends(IfStatement, _super);
    function IfStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "IfStatement";
        return _this;
    }
    return IfStatement;
}(JSNode));
exports.IfStatement = IfStatement;
var WhileStatement = /** @class */ (function (_super) {
    __extends(WhileStatement, _super);
    function WhileStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "WhileStatement";
        return _this;
    }
    return WhileStatement;
}(JSNode));
exports.WhileStatement = WhileStatement;
var Comma = /** @class */ (function (_super) {
    __extends(Comma, _super);
    function Comma() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "Comma";
        _this.validNode = false;
        return _this;
    }
    return Comma;
}(JSNode));
exports.Comma = Comma;
var DoWhileStatement = /** @class */ (function (_super) {
    __extends(DoWhileStatement, _super);
    function DoWhileStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "DoWhileStatement";
        return _this;
    }
    return DoWhileStatement;
}(JSNode));
exports.DoWhileStatement = DoWhileStatement;
var SwitchStatement = /** @class */ (function (_super) {
    __extends(SwitchStatement, _super);
    function SwitchStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "SwitchStatement";
        return _this;
    }
    return SwitchStatement;
}(JSNode));
exports.SwitchStatement = SwitchStatement;
var SwitchCase = /** @class */ (function (_super) {
    __extends(SwitchCase, _super);
    function SwitchCase() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "SwitchCase";
        _this.test = null;
        _this.consequent = [];
        return _this;
    }
    return SwitchCase;
}(JSNode));
exports.SwitchCase = SwitchCase;
var ForStatement = /** @class */ (function (_super) {
    __extends(ForStatement, _super);
    function ForStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ForStatement";
        return _this;
    }
    return ForStatement;
}(JSNode));
exports.ForStatement = ForStatement;
var ForInStatement = /** @class */ (function (_super) {
    __extends(ForInStatement, _super);
    function ForInStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ForInStatment";
        return _this;
    }
    return ForInStatement;
}(JSNode));
exports.ForInStatement = ForInStatement;
var BreakStatement = /** @class */ (function (_super) {
    __extends(BreakStatement, _super);
    function BreakStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "BreakStatement";
        return _this;
    }
    return BreakStatement;
}(JSNode));
exports.BreakStatement = BreakStatement;
var ReturnStatement = /** @class */ (function (_super) {
    __extends(ReturnStatement, _super);
    function ReturnStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ReturnStatement";
        return _this;
    }
    return ReturnStatement;
}(JSNode));
exports.ReturnStatement = ReturnStatement;
var ThrowStatement = /** @class */ (function (_super) {
    __extends(ThrowStatement, _super);
    function ThrowStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ThrowStatement";
        return _this;
    }
    return ThrowStatement;
}(JSNode));
exports.ThrowStatement = ThrowStatement;
var TryStatement = /** @class */ (function (_super) {
    __extends(TryStatement, _super);
    function TryStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ThrowStatement";
        return _this;
    }
    return TryStatement;
}(JSNode));
exports.TryStatement = TryStatement;
var CatchClause = /** @class */ (function (_super) {
    __extends(CatchClause, _super);
    function CatchClause() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "CatchClause";
        return _this;
    }
    return CatchClause;
}(JSNode));
exports.CatchClause = CatchClause;
var BlockStatement = /** @class */ (function (_super) {
    __extends(BlockStatement, _super);
    function BlockStatement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "BlockStatement";
        _this.body = [];
        return _this;
    }
    return BlockStatement;
}(JSNode));
exports.BlockStatement = BlockStatement;
var NewExpression = /** @class */ (function (_super) {
    __extends(NewExpression, _super);
    function NewExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "NewExpression";
        return _this;
    }
    return NewExpression;
}(JSNode));
exports.NewExpression = NewExpression;
var ThisExpression = /** @class */ (function (_super) {
    __extends(ThisExpression, _super);
    function ThisExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ThisExpression";
        return _this;
    }
    return ThisExpression;
}(JSNode));
exports.ThisExpression = ThisExpression;
var ImportExpression = /** @class */ (function (_super) {
    __extends(ImportExpression, _super);
    function ImportExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ImportExpression";
        return _this;
    }
    return ImportExpression;
}(JSNode));
exports.ImportExpression = ImportExpression;
var ClassExpression = /** @class */ (function (_super) {
    __extends(ClassExpression, _super);
    function ClassExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ClassExpression";
        _this.id = null;
        _this.superClass = null;
        return _this;
    }
    return ClassExpression;
}(JSNode));
exports.ClassExpression = ClassExpression;
var UnaryExpression = /** @class */ (function (_super) {
    __extends(UnaryExpression, _super);
    function UnaryExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "UnaryExpression";
        _this.prefix = true;
        return _this;
    }
    return UnaryExpression;
}(JSNode));
exports.UnaryExpression = UnaryExpression;
var AssignmentExpression = /** @class */ (function (_super) {
    __extends(AssignmentExpression, _super);
    function AssignmentExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "AssignmentExpression";
        _this.operator = "";
        return _this;
    }
    return AssignmentExpression;
}(JSNode));
exports.AssignmentExpression = AssignmentExpression;
var ArrayExpression = /** @class */ (function (_super) {
    __extends(ArrayExpression, _super);
    function ArrayExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ArrayExpression";
        return _this;
    }
    return ArrayExpression;
}(JSNode));
exports.ArrayExpression = ArrayExpression;
var ObjectExpression = /** @class */ (function (_super) {
    __extends(ObjectExpression, _super);
    function ObjectExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ObjectExpression";
        return _this;
    }
    return ObjectExpression;
}(JSNode));
exports.ObjectExpression = ObjectExpression;
var Property = /** @class */ (function (_super) {
    __extends(Property, _super);
    function Property() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "Property";
        _this.kind = "init";
        _this.method = false;
        _this.shorthand = false;
        _this.computed = false;
        return _this;
    }
    return Property;
}(JSNode));
exports.Property = Property;
var UpdateExpression = /** @class */ (function (_super) {
    __extends(UpdateExpression, _super);
    function UpdateExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "UpdateExpression";
        return _this;
    }
    return UpdateExpression;
}(JSNode));
exports.UpdateExpression = UpdateExpression;
var MemberExpression = /** @class */ (function (_super) {
    __extends(MemberExpression, _super);
    function MemberExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "MemberExpression";
        _this.optional = false;
        _this.computed = false;
        return _this;
    }
    return MemberExpression;
}(JSNode));
exports.MemberExpression = MemberExpression;
var ChainExpression = /** @class */ (function (_super) {
    __extends(ChainExpression, _super);
    function ChainExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ChainExpression";
        return _this;
    }
    return ChainExpression;
}(JSNode));
exports.ChainExpression = ChainExpression;
var ConditionalExpression = /** @class */ (function (_super) {
    __extends(ConditionalExpression, _super);
    function ConditionalExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ConditionalExpression";
        return _this;
    }
    return ConditionalExpression;
}(JSNode));
exports.ConditionalExpression = ConditionalExpression;
var CallExpression = /** @class */ (function (_super) {
    __extends(CallExpression, _super);
    function CallExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "CallExpression";
        return _this;
    }
    return CallExpression;
}(JSNode));
exports.CallExpression = CallExpression;
var FunctionExpression = /** @class */ (function (_super) {
    __extends(FunctionExpression, _super);
    function FunctionExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "FunctionExpression";
        return _this;
    }
    return FunctionExpression;
}(JSNode));
exports.FunctionExpression = FunctionExpression;
var BinaryExpression = /** @class */ (function (_super) {
    __extends(BinaryExpression, _super);
    function BinaryExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "BinaryExpression";
        _this.operator = "";
        return _this;
    }
    return BinaryExpression;
}(JSNode));
exports.BinaryExpression = BinaryExpression;
var LogicalExpression = /** @class */ (function (_super) {
    __extends(LogicalExpression, _super);
    function LogicalExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "LogicalExpression";
        _this.operator = "";
        return _this;
    }
    return LogicalExpression;
}(JSNode));
exports.LogicalExpression = LogicalExpression;
var SequenceExpression = /** @class */ (function (_super) {
    __extends(SequenceExpression, _super);
    function SequenceExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "SequenceExpression";
        _this.expressions = [];
        return _this;
    }
    return SequenceExpression;
}(JSNode));
exports.SequenceExpression = SequenceExpression;
var ArrowFunctionExpression = /** @class */ (function (_super) {
    __extends(ArrowFunctionExpression, _super);
    function ArrowFunctionExpression() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ArrowFunctionExpression";
        _this.id = null;
        _this.expression = false;
        _this.params = [];
        _this.generator = false;
        _this.async = false;
        return _this;
    }
    return ArrowFunctionExpression;
}(JSNode));
exports.ArrowFunctionExpression = ArrowFunctionExpression;
var AssignmentPattern = /** @class */ (function (_super) {
    __extends(AssignmentPattern, _super);
    function AssignmentPattern() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "AssignmentPattern";
        return _this;
    }
    return AssignmentPattern;
}(JSNode));
exports.AssignmentPattern = AssignmentPattern;
var ArrayPattern = /** @class */ (function (_super) {
    __extends(ArrayPattern, _super);
    function ArrayPattern() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ArrayPattern";
        _this.elements = [];
        return _this;
    }
    return ArrayPattern;
}(JSNode));
exports.ArrayPattern = ArrayPattern;
var ObjectPattern = /** @class */ (function (_super) {
    __extends(ObjectPattern, _super);
    function ObjectPattern() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "ObjectPattern";
        _this.properties = [];
        return _this;
    }
    return ObjectPattern;
}(JSNode));
exports.ObjectPattern = ObjectPattern;
var SpreadElement = /** @class */ (function (_super) {
    __extends(SpreadElement, _super);
    function SpreadElement() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = "SpreadElement";
        return _this;
    }
    return SpreadElement;
}(JSNode));
exports.SpreadElement = SpreadElement;
function isValidExpression(node) {
    return node
        ? node.type.endsWith("Expression") ||
            node.type.endsWith("Literal") ||
            node.type.endsWith("Identifier")
        : false;
}
exports.isValidExpression = isValidExpression;
function isIdentifier(node) {
    return node ? node instanceof Identifier : false;
}
exports.isIdentifier = isIdentifier;
function isValidReference(node) {
    return node
        ? node instanceof Identifier ||
            (node instanceof MemberExpression && !isOptional(node))
        : false;
}
exports.isValidReference = isValidReference;
function isOptional(node) {
    if (node === undefined)
        return false;
    if (node.optional)
        return true;
    else if (node.object instanceof MemberExpression) {
        var obj = node;
        while (obj instanceof MemberExpression) {
            obj = obj.object;
            if (obj.optional)
                return true;
        }
        return false;
    }
    else
        return false;
}
exports.isOptional = isOptional;
function isChainExpression(node) {
    return node instanceof MemberExpression && isOptional(node);
}
exports.isChainExpression = isChainExpression;
function isValidParameter(node) {
    return node
        ? node instanceof AssignmentExpression || node instanceof Identifier
        : false;
}
exports.isValidParameter = isValidParameter;
function isValidForInParam(paramBody) {
    return paramBody
        ? (paramBody.length === 1 &&
            paramBody[0] instanceof ExpressionStatment &&
            paramBody[0].expression instanceof BinaryExpression &&
            paramBody[0].expression.operator === "in") ||
            (paramBody[0] instanceof VariableDeclaration &&
                paramBody[0].declarations.length === 1 &&
                paramBody[0].declarations[0].in)
        : false;
}
exports.isValidForInParam = isValidForInParam;
function isValidForParam(paramBody) {
    var _a, _b;
    return paramBody
        ? (paramBody.length === 3 || paramBody.length === 2) &&
            paramBody.find(function (param) {
                return !/ExpressionStatement|VariableDeclaration|EmptyStatement/.test(param.type);
            }) === undefined &&
            /ExpressionStatement|EmptyStatement/.test(paramBody[1].type) &&
            /ExpressionStatement|EmptyStatement/.test((_b = (_a = paramBody[2]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : "EmptyStatement")
        : false;
}
exports.isValidForParam = isValidForParam;
function isValidPropertyKeyStart(char) {
    return ((0, utils_1.isDigit)(char) || (0, utils_1.isValidIdentifierCharacter)(char) || /"|'|\[/.test(char));
}
exports.isValidPropertyKeyStart = isValidPropertyKeyStart;
