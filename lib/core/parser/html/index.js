"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var createDOMTree_1 = require("./createDOMTree");
var getDOMNodes_1 = require("./getDOMNodes");
var getNodeAttributes_1 = require("./getNodeAttributes");
var idSearch_1 = require("./idSearch");
var tagNameSearch_1 = require("./tagNameSearch");
var html = {
    createDOMTree: createDOMTree_1.default,
    getDOMNodes: getDOMNodes_1.default,
    getNodeAttributes: getNodeAttributes_1.default,
    idSearch: idSearch_1.default,
    tagNameSearch: tagNameSearch_1.default,
};
exports.default = html;
