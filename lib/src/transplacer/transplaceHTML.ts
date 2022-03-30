import { isForeignTag, isVoid } from "../parser/parseUtils";
import { HTMLDocumentNode } from "../types/html";

/**
 * Takes in a set of nodes and returns their original HTML format.
 * @param nodes The tree(s) of nodes generated from the original HTML.
 * @returns A stringified text representing the original HTML content.
 */
function transplaceHTML(nodes: HTMLDocumentNode[] | undefined): string {
  let html: string = "";

  if (nodes) {
    nodes.forEach((node) => {
      if (node.type !== "text") {
        let attributeList: string = "";
        if (node.attributes) {
          Object.entries(node.attributes).forEach((entry) => {
            if (entry[1] !== true) {
              attributeList += ` ${entry[0]}="${entry[1]}"`;
            } else attributeList += ` ${entry[0]}`;
          });
        }
        if (!isForeignTag(node.tagName)) {
          html += `<${node.tagName}${attributeList}${
            isVoid(node.tagName) && node.type !== "definition" ? "/" : ""
          }>${transplaceHTML(node.children)}${
            !isVoid(node.tagName) ? `</${node.tagName}>` : ""
          }`;
        } else
          html += `<${node.tagName}${attributeList}>${node.content}</${node.tagName}>`;
      } else html += node.content;
    });
  }
  return html;
}

export default transplaceHTML;
