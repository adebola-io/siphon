"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getDOMNodes_1 = require("./getDOMNodes");
function createDOMTree(source) {
    var _a;
    var nodes = (0, getDOMNodes_1.default)(source);
    var filledNodes = [];
    for (var i = 0; nodes[i]; i++) {
        nodes[i].identifier = i;
        var h = i - 1;
        if (nodes[i].parent) {
            while (nodes[h] && nodes[i].parent !== nodes[h].tagName)
                h--;
            if (nodes[h]) {
                if (!nodes[h].children)
                    nodes[h].children = [];
                (_a = nodes[h].children) === null || _a === void 0 ? void 0 : _a.push(nodes[i]);
            }
        }
        else
            filledNodes.push(nodes[i]);
    }
    return filledNodes;
}
exports.default = createDOMTree;
