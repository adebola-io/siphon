"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Minifies CSS Text.
 * @param text CSS Text to minify
 * @returns Minified string of text
 */
function minifyCSS(text) {
    return text
        .trim()
        .replace(/\n|\r|\t/g, "")
        .replace(/([\s]*)\>([\s]*)/g, ">")
        .replace(/;([\s]*)/g, ";")
        .replace(/([\s]*){([\s]*)/g, "{")
        .replace(/([\s]*)}([\s]*)/g, "}");
}
exports.default = minifyCSS;
