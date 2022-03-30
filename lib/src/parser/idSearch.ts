import { HTMLDocumentNode } from "../types/html";

function idSearch(
  nodes: HTMLDocumentNode[] | undefined,
  searchStr: string
): HTMLDocumentNode | null {
  let result: HTMLDocumentNode | null = null;
  if (nodes)
    for (let i = 0; nodes[i]; i++) {
      if (nodes[i].attributes?.id?.trim() === searchStr.trim()) {
        return nodes[i];
      } else if (nodes[i].children) {
        result = idSearch(nodes[i].children, searchStr);
      }
    }
  return result;
}

export default idSearch;
