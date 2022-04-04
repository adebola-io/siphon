/**
 * Useful structures and objects, handwritten in ES5 because Typescript has become an enemy of progress.
 */

exports.Stack = /** @class */ (function () {
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
exports.Tree = /** @class */ (function () {
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
  Tree.prototype.root = function (nodeDetails) {
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
      for (var i = 0; root.children[i]; i++) {
        root.children[i] = cleanTree(root.children[i]);
      }
      return root;
    }
    var model = cleanTree(this.nodeStore[0]);
    return model;
  };
  return Tree;
})();
exports.Task = /** @class */ (function () {
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
// export var Structures = {
//   Stack: Stack,
//   Tree: Tree,
//   Task: Task,
// };
