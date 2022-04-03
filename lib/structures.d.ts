declare class Stack {
  /**
   * Removes the topmost value in the stack and returns it.
   */
  pop(): any;
  /**
   * Adds data to the stack.
   * @param data Data to push into the stack.
   */
  push(data: any): void;
  /**
   * Returns the topmost value of the stack without removing it.
   */
  top(): any;
  /**
   * Returns the total number of items in the stack.
   */
  size(): number;
}
export interface TreeNode {
  /**
   * The parent node that this node is appended to.
   */
  parent: TreeNode;
  /**
   * The data value in this node. It can be a function, object, string or number.
   */
  data: any;
  /**
   * The children of this node.
   */
  children: TreeNode[];
  /**
   * Adds a node as a child to this node.
   * @param childNode The node to append.
   */
  append(childNode: TreeNode): true;
}
declare class Tree {
  /**
   * Specifies the root node of the tree.
   */
  root(values: TreeNode): TreeNode;
  /**
   * A constructor for a node on the tree to be appended to another node.
   */
  Node(params: TreeNode): TreeNode;
  /**
   * The Tree.render() function goes through the tree and trims down its circular properties .e.g. references to parents from children.
   * @returns A condensed version of the tree that can be properly stringified or displayed without circular errors.
   */
  render(): Object;
}
declare const Structures: {
  Stack: typeof Stack;
  Tree: typeof Tree;
};
export default Structures;
