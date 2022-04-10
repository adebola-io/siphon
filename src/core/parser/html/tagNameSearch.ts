import { HTMLDocumentNode } from "../../../types";

/**
 * Search through an HTML node tree or a group of node trees for a tag. Similar to `document.getElementsByTagName` in the DOM.
 * @param nodes The Nodified version of the page.
 * @param searchStr The tag name to search for.
 * @returns An array of matching nodes.
 */
function tagNameSearch(nodes: HTMLDocumentNode[], searchStr: string) {
  let results: any[] = [];
  nodes.forEach((node) => {
    if (node.tagName === searchStr) results.push(node);
    if (node.children) results.push(tagNameSearch(node.children, searchStr));
  });
  return results.flat(1);
}

export default tagNameSearch;
