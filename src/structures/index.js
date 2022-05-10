"use strict";
/**
 * Useful structures and objects, handwritten in ES5 because Typescript has become an enemy of progress.
 */

var Stack = /** @class */ (function () {
  function Stack() {
    this.arr = [];
    this.t = 0;
  }
  Stack.prototype.pop = function () {
    if (this.t) --this.t;
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
var Visitor = /** @class */ (function () {
  var visitedKeys = new Map();
  function Visitor() {}
  Visitor.prototype.visit = function name(item) {
    visitedKeys.set(item, true);
  };
  Visitor.prototype.visited = function (item) {
    return visitedKeys.has(item);
  };
  return Visitor;
})();
var Queue = /** @class */ (function () {
  let arr = [];
  let f = 0;
  let b = 0;
  function Queue() {}
  Queue.prototype.front = function () {
    return arr[f];
  };
  Queue.prototype.rear = function () {
    return arr[b - 1];
  };
  Queue.prototype.pop = function () {
    return arr[f++];
  };
  Queue.prototype.push = function (data) {
    arr.push(data);
    b++;
  };
  return Queue;
})();
var Graph = /** @class */ (function () {})();
var TreeNode = /**@class */ function () {
  function TreeNode() {
    this.parent = null;
    this.data = null;
    this.children = [];
  }
  TreeNode.prototype.append = function () {};
  return TreeNode;
};
var Tree = /** @class */ (function () {
  function Tree() {
    this.rootIsDefined = false;
    this.nodeStore = [];
    this.Node.prototype.treeRef = this;
  }
  Tree.prototype.Node = /** @class */ (function () {
    function Node(details) {
      if (details === void 0) {
        details = { data: null, children: [], parent: null };
      }
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
        childNode.parent.children = childNode.parent.children.filter(function (
          otherNodes
        ) {
          return otherNodes !== childNode;
        });
      }
      this.children.push(childNode);
      childNode.parent = this;
      this.treeRef.nodeStore.push(childNode);
    };
    return Node;
  })();
  /**
   * Specifies the root node of the tree.
   */
  Tree.prototype.root = function (nodeDetails = {}) {
    if (this.rootIsDefined)
      throw new Error("The root of a tree can only defined once.");
    nodeDetails.root = true;
    var root = new this.Node(nodeDetails);
    this.nodeStore.push(root);
    this.rootIsDefined = true;
    return root;
  };
  Tree.prototype.render = function () {
    function cleanTree(root) {
      root = Object.assign({}, root);
      delete root.parent;
      for (var i = 0; root.children && root.children[i]; i++) {
        root.children[i] = cleanTree(root.children[i]);
      }
      return root;
    }
    var model = cleanTree(this.nodeStore[0]);
    return model;
  };
  return Tree;
})();
var Task = /** @class */ (function () {
  /**
   * Constructor.
   * @param {string[]} argv
   */
  function Task(argv) {
    argv = argv.slice(2);
    this.args = {};
    this.inputs = [];
    argv.forEach((argument) => {
      if (argument.startsWith("--")) {
        this.args[argument.slice(2)] = true;
      } else this.inputs.push(argument);
    });
  }
  return Task;
})();

exports.Stack = Stack;
exports.Queue = Queue;
exports.TreeNode = TreeNode;
exports.Tree = Tree;
exports.Task = Task;
exports.Visitor = Visitor;
