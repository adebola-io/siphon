"use strict";

var Structures = require("../lib/structures")["default"];

var familyTree = new Structures.Tree();
var treeRoot = familyTree.root({
  data: "This is the familt tree of the Barrons."
});
var newNode = new familyTree.Node({
  data: "Hello, it's me."
});
treeRoot.append(newNode);
familyTree.render();
console.log(newNode.parent);