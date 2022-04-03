"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handwritten ES5 Declarations for Data Structures, because Typescript has become an enemy of progress.
 */
var Stack = /** @class */ (function () {
  function Stack() {
    this.arr = [];
    this.t = 0;
  }
  Stack.prototype.pop = function () {
    --this.t;
    return this.arr.pop();
  };
  Stack.prototype.push = function (data) {
    this.arr.push(data);
    ++this.t;
  };
  Stack.prototype.top = function () {
    return this.arr[this.t - 1];
  };
  Stack.prototype.size = function () {
    return this.t;
  };
  return Stack;
})();

var Tree = /** @class */ (function () {
  function Tree() {
    this.rootIsDefined = false;
    this.nodeStore = [];
    this.Node.prototype.treeRef = this;
  }
  Tree.prototype.Node = /** @class */ (function () {
    function Node(details = { data: null, children: [], parent: null }) {
      if (details.parent === undefined) details.parent = null;
      if (details.data === undefined) details.data = null;
      if (details.children === undefined) details.children = [];
      if (details.root === true) this.root = true;
      this.parent = details.parent;
      if (this.parent) details.parent.children.push(this);
      this.children = details.children;
      this.data = details.data;
    }
    Node.prototype.append = function (childNode) {
      if (childNode.parent) {
        childNode.parent.children = childNode.parent.children.filter(
          (otherNodes) => otherNodes !== childNode
        );
      }
      this.children.push(childNode);
      childNode.parent = this;
      this.treeRef.nodeStore.push(childNode);
    };
    return Node;
  })();
  Tree.prototype.root = function (nodeDetails) {
    if (this.rootIsDefined)
      throw new Error("The root of a tree can only defined once.");
    nodeDetails.root = true;
    let root = new this.Node(nodeDetails);
    this.nodeStore.push(root);
    this.rootIsDefined = true;
    return root;
  };
  Tree.prototype.render = function () {
    function cleanTree(root) {
      root = Object.assign({}, root);
      delete root.parent;
      for (let i = 0; root.children[i]; i++) {
        root.children[i] = cleanTree(root.children[i]);
      }
      return root;
    }
    let model = cleanTree(this.nodeStore[0]);
    return model;
  };
  return Tree;
})();

const Structures = {
  Stack,
  Tree,
};

exports.default = Structures;
