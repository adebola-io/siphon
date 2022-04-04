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
declare interface TreeNode {
  /**
   * The parent node that this node is appended to.
   */
  parent: TreeNode | null;
  /**
   * The data value in this node. It can be a function, object, string or number.
   */
  data: any;
  /**
   * The children nodes of this node.
   */
  children: TreeNode[];
  /**
   * Adds a node as a child to this node.
   */
  append(node: TreeNode): void;
}
declare class Tree {
  root(): TreeNode;
  /**
   * A constructor for a node on the tree that will later be appended to another node.
   * @param details The starting details of this node.
   */
  Node: new (details?: TreeNode) => TreeNode;
  /**
   * The render() function goes through the tree and trims down its circular properties .e.g. references to parents from children.
   * @returns A object version of the tree that can be properly stringified or displayed without circular errors.
   */
  render(): Object;
}

declare interface TaskArgs {
  watch?: boolean;
}
/**
 * A running CLI process.
 */
declare class Task {
  constructor(argv: string[]);
  args: TaskArgs;
  inputs: string[];
}
declare module structures {
  export { Stack };
  export { Tree };
  export { Task };
}

export = structures;
