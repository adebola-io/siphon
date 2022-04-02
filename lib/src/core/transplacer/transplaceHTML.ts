import { isForeignTag, isVoid } from "../parser/html/parseUtils";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import formatter from "../formatter";
import minifier from "../minifier";
const tab: string = "  ";
/**
 * Takes in a set of nodes and returns their original HTML format.
 * @param nodes The tree(s) of nodes generated from the original HTML.
 * @returns A stringified text representing the original HTML content.
 */
function transplaceHTML(
  nodes: HTMLDocumentNode[] | undefined,
  options: siphonOptions,
  spacers: string = ""
): string {
  let html: string = "";
  if (nodes) {
    nodes.forEach((node) => {
      let attributeList: string = "";
      if (node.type !== "text") {
        if (options.formatFiles) html += spacers;
        if (node.attributes) {
          Object.entries(node.attributes).forEach((entry) => {
            if (entry[1] !== true) {
              attributeList += ` ${entry[0]}="${entry[1]}"`;
            } else attributeList += ` ${entry[0]}`;
          });
          if (attributeList.length > 50 && options.formatFiles) {
            attributeList = "\n" + spacers + tab;
            Object.entries(node.attributes).forEach((entry) => {
              if (entry[1] !== true) {
                attributeList +=
                  ` ${entry[0]}="${entry[1]}"` + "\n" + spacers + tab;
              } else attributeList += ` ${entry[0]}` + "\n" + spacers + tab;
            });
          }
        }
      }
      switch (true) {
        // Handle foreign tags.
        case isForeignTag(node.tagName):
          html += `<${node.tagName}${attributeList}>`;
          html += `${
            options.formatFiles && node.content
              ? formatExternalText(node.content, node.tagName, spacers)
              : node.content
              ? minifyExternalText(node.content, node.tagName)
              : ""
          }`;
          if (options.formatFiles && node.content) html += spacers;
          html += `</${node.tagName}>`;
          if (options.formatFiles) html += "\n";
          break;
        // Handle text nodes.
        case node.type === "text":
          if (options.formatFiles && node.content && node.content.length > 70) {
            html += "\n" + spacers;
            let textSlices: string[] = [];
            let i = 0;
            do {
              if (node.content[i + 70] === " ") {
                textSlices.push(node.content?.slice(i, i + 70));
                i += 70;
              } else {
                let j = i + 70;
                while (node.content[j] && node.content[j] !== " ") {
                  j++;
                }
                textSlices.push(node.content?.slice(i, j));
                i = j;
              }
            } while (node.content[i]);
            html += textSlices.join("\n" + spacers) + "\n";
          } else html += `${node.content}`;
          break;
        // Handle DOCTYPE definition.
        case node.type === "definition":
          html += `<${node.tagName}${attributeList}>${
            options.formatFiles ? "\n" : ""
          }`;
          break;
        // Handle void tags.
        case isVoid(node.tagName):
          html += `<${node.tagName}${attributeList}${
            options.formatFiles ? " " : ""
          }/>${options.formatFiles ? "\n" : ""}`;
          break;
        // Handle regular tags.
        default:
          html += `<${node.tagName}${attributeList}>`;
          if (node.children && options.formatFiles) {
            if (node.children[0].type !== "text") {
              html += "\n";
            }
          }
          html += transplaceHTML(node.children, options, spacers + tab);
          if (options.formatFiles) {
            if (
              (node.children && node.children[0].type !== "text") ||
              (node.children &&
                node.children[0].type == "text" &&
                node.children[0].content &&
                node.children[0].content?.length > 70)
            ) {
              html += spacers;
            }
          }
          html += `</${node.tagName}>`;
          if (options.formatFiles) html += "\n";
          break;
      }
    });
  }
  return html;
}
function formatExternalText(
  externalText: string,
  assetType?: string,
  spacers?: string
) {
  if (assetType === "style")
    return formatter.formatCSS(externalText, spacers, tab);
  if (assetType === "script") return externalText;
}

function minifyExternalText(externalText?: string, assetType?: string) {
  if (externalText !== undefined && assetType === "style")
    return minifier.minifyCSS(externalText);
}

export default transplaceHTML;
