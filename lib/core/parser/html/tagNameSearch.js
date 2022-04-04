"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function tagNameSearch(nodes, searchStr) {
    var results = [];
    nodes.forEach(function (node) {
        if (node.tagName === searchStr)
            results.push(node);
        if (node.children)
            results.push(tagNameSearch(node.children, searchStr));
    });
    return results.flat(1);
}
exports.default = tagNameSearch;
