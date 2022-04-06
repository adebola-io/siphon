"use strict";
/**
 * Useful structures and objects, handwritten in ES5 because Typescript has become an enemy of progress.
 */

// /**
//  * The extending function.
//  */
// var __extends =
//   (this && this.__extends) ||
//   (function () {
//     var extendStatics = function (d, b) {
//       extendStatics =
//         Object.setPrototypeOf ||
//         ({ __proto__: [] } instanceof Array &&
//           function (d, b) {
//             d.__proto__ = b;
//           }) ||
//         function (d, b) {
//           for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
//         };
//       return extendStatics(d, b);
//     };
//     return function (d, b) {
//       extendStatics(d, b);
//       function __() {
//         this.constructor = d;
//       }
//       d.prototype =
//         b === null
//           ? Object.create(b)
//           : ((__.prototype = b.prototype), new __());
//     };
//   })();

//
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

// var AST = /** @class */ (function () {
//   function AST() {
//     this.Node = /** @class */ (function () {
//       function Node() {
//         this.start = null;
//         this.stop = null;
//         this.type = null;
//       }
//       return Node;
//     })();
//     this.Program = /** @class */ (function (_super) {
//       __extends(Program, _super);
//       function Program() {
//         var _this = (_super !== null && _super.apply(this, arguments)) || this;
//         _this.type = "Program";
//         _this.body = [];
//       }
//       return Program;
//     })(this.Node);
//     this.VariableDeclaration = /**@class */ (function (_super) {
//       __extends(VariableDeclaration, _super);
//       function VariableDeclaration() {
//         var _this = (_super !== null && _super.apply(this, arguments)) || this;
//         _this.type = "VariableDeclaration";
//         _this.body = [];
//         _this.declarators = [];
//       }
//       return VariableDeclaration;
//     })();
//   }
//   return AST;
// })();

// var jsTree = new AST();
// var program = new jsTree.Program();
// console.log(program);
