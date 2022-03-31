import { HTMLDocumentNode } from "../../types";

function tagNameSearch(nodes: HTMLDocumentNode[], searchStr: string) {
  let results: any[] = [];
  nodes.forEach((node) => {
    if (node.tagName === searchStr) results.push(node);
    if (node.children) results.push(tagNameSearch(node.children, searchStr));
  });
  return results.flat(1);
}

export default tagNameSearch;
