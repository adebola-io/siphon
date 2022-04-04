"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function idSearch(nodes, searchStr) {
    var _a, _b;
    var result = null;
    if (nodes)
        for (var i = 0; nodes[i]; i++) {
            if (((_b = (_a = nodes[i].attributes) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.trim()) === searchStr.trim()) {
                return nodes[i];
            }
            else if (nodes[i].children) {
                result = idSearch(nodes[i].children, searchStr);
            }
        }
    return result;
}
exports.default = idSearch;
