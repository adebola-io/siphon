import * as fs from "fs";
import { HTMLDocumentNode } from "../../../types";
import getDOMNodes from "./getDOMNodes";

function createDOMTree(source: fs.PathLike): HTMLDocumentNode[] {
  let nodes = getDOMNodes(source);
  let filledNodes: HTMLDocumentNode[] = [];
  for (let i = 0; nodes[i]; i++) {
    let h = i - 1;
    if (nodes[i].parent) {
      while (
        nodes[h] &&
        !(
          nodes[i].parent[0] === nodes[h].tagName &&
          nodes[i].parent[1] === nodes[h].identifier
        )
      )
        h--;
      if (nodes[h]) {
        if (!nodes[h].children) nodes[h].children = [];
        nodes[i].parent = nodes[h];
        nodes[i].childID = nodes[h].children?.length ?? 0;
        nodes[h].children?.push(nodes[i]);
      }
    } else filledNodes.push(nodes[i]);
  }
  return filledNodes;
}

export default createDOMTree;
