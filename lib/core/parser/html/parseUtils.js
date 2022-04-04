"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringMarkers = exports.isVoid = exports.isForeignTag = exports.checkForEnd = exports.illegalCSSIdentifierCharacter = exports.isSpaceCharac = void 0;
var errors_1 = require("../../../errors");
function isSpaceCharac(character) {
    return /\u0020|\u0009|\u000A|\u000C|\u000D/.test(character);
}
exports.isSpaceCharac = isSpaceCharac;
function illegalCSSIdentifierCharacter(character) {
    return /\u0020|\u0009|\u000A|\u000C|\u000D|"/.test(character);
}
exports.illegalCSSIdentifierCharacter = illegalCSSIdentifierCharacter;
function checkForEnd(character, source) {
    if (!character)
        errors_1.default.enc("ABRUPT", source);
}
exports.checkForEnd = checkForEnd;
function isForeignTag(tagName) {
    return tagName ? ["script", "style"].includes(tagName) : false;
}
exports.isForeignTag = isForeignTag;
function isVoid(tagName) {
    if (tagName)
        return [
            "!DOCTYPE",
            "area",
            "base",
            "br",
            "col",
            "command",
            "embed",
            "hr",
            "img",
            "input",
            "keygen",
            "link",
            "meta",
            "param",
            "source",
            "track",
            "wbr",
        ].includes(tagName);
    else
        return false;
}
exports.isVoid = isVoid;
exports.stringMarkers = ["'", "`", '"'];
