"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var errors_1 = require("../../../errors");
var Structures = require("../../../../structures");
var getNodeAttributes_1 = require("./getNodeAttributes");
var parseUtils_1 = require("./parseUtils");
/**
 * Go through an HTML file and return its content as an array of nodes.
 */
function getDOMNodes(source) {
    var srcText = fs.readFileSync(source).toString();
    var tagStack = new Structures.Stack();
    var node = {
        type: "",
        parent: null,
    };
    var nodes = [];
    var textStore = "";
    var textIsCounting = false;
    function handleForeignTags(startTag, textSlice, i, attrs) {
        var j = 1;
        var content = "";
        while (textSlice[j]) {
            if (parseUtils_1.stringMarkers.includes(textSlice[j])) {
                var marker = textSlice[j++];
                content += marker;
                while (textSlice[j] && textSlice[j] !== marker)
                    content += textSlice[j++];
                content += textSlice[j++];
            }
            else if (textSlice[j] === "<") {
                break;
            }
            else
                content += textSlice[j++];
        }
        node = {
            type: "element",
            parent: tagStack.top(),
            attributes: attrs ? (0, getNodeAttributes_1.default)(attrs) : undefined,
            attributeList: attrs ? attrs : undefined,
            tagName: startTag,
            content: content === "" ? undefined : content,
        };
        nodes.push(node);
        return i + j - 1;
    }
    for (var i = 0; srcText[i]; i++) {
        //   Ignore comments.
        if (srcText.slice(i, i + 4) === "<!--") {
            i += 4;
            while (srcText[i] && srcText.slice(i, i + 3) !== "-->")
                i++;
            srcText[(i += 3)] ? "" : errors_1.default.enc("COMMENT_UNCLOSED", source, i);
        }
        // Start of tags
        if (srcText[i] == "<") {
            if (textIsCounting) {
                // Push text as text node and clear textStore.
                node = {
                    type: "text",
                    parent: tagStack.top(),
                    content: textStore.replace(/([\n\r]*)/g, "").replace(/\s[\s]*/g, " "),
                };
                nodes.push(node);
                textStore = "";
            }
            textIsCounting = false;
            // Ignore white spaces
            do
                i++;
            while ((0, parseUtils_1.isSpaceCharac)(srcText[i]));
            (0, parseUtils_1.checkForEnd)(srcText[i], source);
            //   Start of closing tags.
            if (srcText[i] === "/") {
                // Ignore white spaces.
                do
                    i++;
                while ((0, parseUtils_1.isSpaceCharac)(srcText[i]));
                (0, parseUtils_1.checkForEnd)(srcText[i], source);
                var endofTag = "";
                while (srcText[i] && srcText[i] !== " " && srcText[i] !== ">")
                    endofTag += srcText[i++];
                if (i > srcText.length)
                    errors_1.default.enc("ABRUPT", source);
                // Ignore white spaces
                while ((0, parseUtils_1.isSpaceCharac)(srcText[i]))
                    i++;
                (0, parseUtils_1.checkForEnd)(srcText[i], source);
                if (endofTag.replace(/\n|\r/g, "") !== tagStack.top())
                    errors_1.default.enc("UNEXPECTED_CLOSE", source, i);
                tagStack.pop();
            }
            else {
                //   Start of opening tags.
                if (srcText[i] === ">")
                    errors_1.default.enc("HTML_FRAGMENT", source, i);
                var startofTag = "";
                while (srcText[i] && srcText[i] !== " " && srcText[i] !== ">")
                    startofTag += srcText[i++];
                (0, parseUtils_1.checkForEnd)(srcText[i], source);
                startofTag = startofTag.replace(/\n|\r/g, "");
                if (srcText[i] === " ") {
                    // Ignore white spaces.
                    do
                        i++;
                    while ((0, parseUtils_1.isSpaceCharac)(srcText[i]));
                    (0, parseUtils_1.checkForEnd)(srcText[i], source);
                    //   Get attributes.
                    var attributeList = "";
                    while (srcText[i] && srcText[i] !== "/" && srcText[i] !== ">") {
                        //   Ignore strings.
                        if (parseUtils_1.stringMarkers.includes(srcText[i])) {
                            var marker = srcText[i];
                            attributeList += srcText[i++];
                            while (srcText[i] && srcText[i] !== marker)
                                attributeList += srcText[i++];
                        }
                        // read attributes.
                        attributeList += srcText[i++];
                    }
                    (0, parseUtils_1.checkForEnd)(srcText[i], source);
                    if (srcText[i] === ">") {
                        /**
                         * Foreign tags with attributes.
                         */
                        if ((0, parseUtils_1.isForeignTag)(startofTag)) {
                            i = handleForeignTags(startofTag, srcText.slice(i), i, attributeList);
                        }
                        else {
                            node = {
                                type: startofTag.toLowerCase() === "!doctype"
                                    ? "definition"
                                    : "element",
                                parent: tagStack.top(),
                                isVoid: (0, parseUtils_1.isVoid)(startofTag) ? true : undefined,
                                tagName: startofTag,
                                attributes: (0, getNodeAttributes_1.default)(attributeList),
                                attributeList: attributeList,
                            };
                            nodes.push(node);
                        }
                        if (!(0, parseUtils_1.isVoid)(startofTag))
                            tagStack.push(startofTag.replace(/\n|\r/g, ""));
                    }
                    else if (srcText[i] === "/") {
                        // Ignore space characters.
                        do
                            i++;
                        while ((0, parseUtils_1.isSpaceCharac)(srcText[i]));
                        (0, parseUtils_1.checkForEnd)(srcText[i], source);
                        node = {
                            type: "element",
                            tagName: startofTag,
                            parent: tagStack.top(),
                            isVoid: (0, parseUtils_1.isVoid)(startofTag) ? true : undefined,
                            attributes: (0, getNodeAttributes_1.default)(attributeList),
                            attributeList: attributeList,
                        };
                        nodes.push(node);
                        if (!(0, parseUtils_1.isVoid)(startofTag))
                            errors_1.default.enc("INVALID_VOID_TAG", source, i, { name: startofTag });
                    }
                }
                else {
                    /**
                     * Foreign Tags without Attributes.
                     */
                    if ((0, parseUtils_1.isForeignTag)(startofTag)) {
                        i = handleForeignTags(startofTag, srcText.slice(i), i);
                    }
                    else {
                        node = {
                            type: "element",
                            tagName: startofTag,
                            parent: tagStack.top(),
                        };
                        nodes.push(node);
                    }
                    if (!(0, parseUtils_1.isVoid)(startofTag))
                        tagStack.push(startofTag);
                }
            }
        }
        else if (textIsCounting) {
            textStore += srcText[i];
        }
        else if (!(0, parseUtils_1.isSpaceCharac)(srcText[i])) {
            textStore += srcText[i];
            textIsCounting = true;
        }
    }
    return nodes;
}
exports.default = getDOMNodes;
