import { HTMLDocumentNode } from "../../../types";
/**
 * Recursively search through a DOM tree for elements that belong to a specific class. Similar to `document.getElementsByClassName` in the browser.
 * @param nodes The nodes to search through.
 * @param className class to search for.
 */
function classSearch(nodes: HTMLDocumentNode[], className: string) {
  let result: Array<any> = [];
  nodes.forEach((node) => {
    if (node.classList?.includes(className)) result.push(node);
    if (node.children) result.push(classSearch(node.children, className));
  });
  return result.flat(1);
}

export default classSearch;
