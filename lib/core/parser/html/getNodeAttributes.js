"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parseUtils_1 = require("./parseUtils");
function getNodeAttributes(list) {
    var i = 0, key = "", value = undefined, attributes = {};
    list = list.trim();
    while (list[i]) {
        if (list[i] === "=") {
            i++;
            value = "";
            if (parseUtils_1.stringMarkers.includes(list[i])) {
                var marker = list[i++];
                // value += marker;
                while (list[i] && list[i] !== marker)
                    value += list[i++];
                // value += marker;
            }
            else
                while (list[i] && list[i] !== " ")
                    value += list[i++];
        }
        else if (list[i] === " " && key.trim() !== "") {
            attributes[key.trim()] = value !== undefined ? value : true;
            key = "";
            value = "";
        }
        else {
            key += list[i];
        }
        i++;
    }
    attributes[key.trim()] = value !== undefined ? value : true;
    return attributes;
}
exports.default = getNodeAttributes;
