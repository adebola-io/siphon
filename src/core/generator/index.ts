import { isForeignTag, isVoid } from "../../utils";
import { HTMLDocumentNode, siphonOptions } from "../../types";
import parser from "../parser";
import formatter from "../formatter";
import minifier from "../minifier";
const tab: string = "  ";

function formatExternalText(
  externalText: string,
  assetType?: string,
  spacers?: string
) {
  if (assetType === "style")
    return formatter.formatCSS(externalText, spacers, tab);
  if (assetType === "script") return externalText;
}

function minifyExternalText(
  externalText?: string,
  assetType?: string,
  options?: siphonOptions
) {
  if (externalText !== undefined && assetType === "style")
    return minifier.minifyCSS(externalText);
  if (externalText !== undefined && assetType === "script") {
    return minifier.minifyJS(
      parser.js.transform(
        parser.js.tokenize(externalText, options),
        "minification"
      )
    );
  }
}

class Generator {
  /**
   * Takes in a set of nodes and returns their original HTML format.
   * @param nodes The tree(s) of nodes generated from the original HTML.
   * @returns A stringified text representing the original HTML content.
   */
  generate(
    nodes: HTMLDocumentNode[] | undefined,
    options: siphonOptions,
    spacers: string = ""
  ): string {
    let html: string = "";
    if (nodes) {
      nodes.forEach((node) => {
        // Only run if the node has a type. i.e. Ignore deleted and manipulated nodes.
        if (node.type) {
          let attributeList: string = "";
          if (node.type !== "text") {
            if (options.formatFiles) html += spacers;
            if (node.attributes) {
              if (
                node.attributeList &&
                node.attributeList.length > 50 &&
                options.formatFiles
              ) {
                attributeList = "\n" + spacers + tab;
                Object.entries(node.attributes).forEach((entry) => {
                  if (entry[1] !== true) {
                    attributeList +=
                      ` ${entry[0]}="${entry[1]}"` + "\n" + spacers + tab;
                  } else attributeList += ` ${entry[0]}` + "\n" + spacers + tab;
                });
              } else {
                Object.entries(node.attributes).forEach((entry) => {
                  if (entry[1] !== true) {
                    attributeList += ` ${entry[0]}="${entry[1]}"`;
                  } else attributeList += ` ${entry[0]}`;
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
                  ? minifyExternalText(node.content, node.tagName, options)
                  : ""
              }`;
              if (options.formatFiles && node.content) html += spacers;
              html += `</${node.tagName}>`;
              if (options.formatFiles) html += "\n";
              break;
            // Handle text nodes.
            case node.type === "text":
              if (
                options.formatFiles &&
                node.content &&
                node.content.length > 70
              ) {
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
              html += this.generate(node.children, options, spacers + tab);
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
        }
      });
    }
    return html;
  }
}

export default Generator;
