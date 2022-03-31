import fs = require("fs");
import Errors from "../../errors";
import { HTMLDocumentNode } from "../../types";
import Stack from "../../utils/stack";
import getNodeAttributes from "./getNodeAttributes";
import {
  checkForEnd,
  isForeignTag,
  isSpaceCharac,
  isVoid,
  stringMarkers,
} from "./parseUtils";
/**
 * Verify the syntax of the HTML File.
 */
function getDOMNodes(source: fs.PathLike): Array<HTMLDocumentNode> {
  let srcText: string = fs.readFileSync(source).toString();
  let tagStack = new Stack();
  let node: HTMLDocumentNode = {
    type: "",
    parent: null,
  };
  let nodes: Array<HTMLDocumentNode> = [];
  let textStore: string = "";
  let textIsCounting = false;

  function handleForeignTags(
    startTag: string,
    textSlice: string,
    i: number,
    attrs?: string
  ) {
    let j = 1;
    let content: string = "";
    while (textSlice[j]) {
      if (stringMarkers.includes(textSlice[j])) {
        let marker = textSlice[j++];
        content += marker;
        while (textSlice[j] && textSlice[j] !== marker)
          content += textSlice[j++];
        content += textSlice[j++];
      } else if (textSlice[j] === "<") {
        break;
      } else content += textSlice[j++];
    }
    node = {
      type: "element",
      parent: tagStack.top(),
      attributes: attrs ? getNodeAttributes(attrs) : undefined,
      tagName: startTag,
      content,
    };
    nodes.push(node);
    return i + j - 1;
  }

  for (let i: number = 0; srcText[i]; i++) {
    //   Ignore comments.
    if (srcText.slice(i, i + 4) === "<!--") {
      i += 4;
      while (srcText[i] && srcText.slice(i, i + 3) !== "-->") i++;
      srcText[(i += 3)] ? "" : Errors.enc("COMMENT_UNCLOSED", source, i);
    }
    // Start of tags
    if (srcText[i] == "<") {
      if (textIsCounting) {
        // Push text as text node and clear textStore.
        node = {
          type: "text",
          parent: tagStack.top(),
          content: textStore.replace(/([\n\r]*)/g, "").replace(/\s[\s]*/g, " "),
        };
        nodes.push(node);
        textStore = "";
      }
      textIsCounting = false;
      // Ignore white spaces
      do i++;
      while (isSpaceCharac(srcText[i]));
      checkForEnd(srcText[i], source);
      //   Start of closing tags.
      if (srcText[i] === "/") {
        // Ignore white spaces.
        do i++;
        while (isSpaceCharac(srcText[i]));
        checkForEnd(srcText[i], source);
        let endofTag: string = "";
        while (srcText[i] && srcText[i] !== " " && srcText[i] !== ">")
          endofTag += srcText[i++];
        if (i > srcText.length) Errors.enc("ABRUPT", source);
        // Ignore white spaces
        while (isSpaceCharac(srcText[i])) i++;
        checkForEnd(srcText[i], source);
        if (endofTag.replace(/\n|\r/g, "") !== tagStack.top())
          Errors.enc("UNEXPECTED_CLOSE", source, i);
        tagStack.pop();
      } else {
        //   Start of opening tags.
        if (srcText[i] === ">") Errors.enc("HTML_FRAGMENT", source, i);
        let startofTag: string = "";
        while (srcText[i] && srcText[i] !== " " && srcText[i] !== ">")
          startofTag += srcText[i++];
        checkForEnd(srcText[i], source);
        startofTag = startofTag.replace(/\n|\r/g, "");
        if (srcText[i] === " ") {
          // Ignore white spaces.
          do i++;
          while (isSpaceCharac(srcText[i]));
          checkForEnd(srcText[i], source);
          //   Get attributes.
          let attributeList = "";
          while (srcText[i] && srcText[i] !== "/" && srcText[i] !== ">") {
            //   Ignore strings.
            if (stringMarkers.includes(srcText[i])) {
              let marker = srcText[i];
              attributeList += srcText[i++];
              while (srcText[i] && srcText[i] !== marker)
                attributeList += srcText[i++];
            }
            // read attributes.
            attributeList += srcText[i++];
          }
          checkForEnd(srcText[i], source);

          if (srcText[i] === ">") {
            /**
             * Foreign tags with attributes.
             */
            if (isForeignTag(startofTag)) {
              i = handleForeignTags(
                startofTag,
                srcText.slice(i),
                i,
                attributeList
              );
            } else {
              node = {
                type:
                  startofTag.toLowerCase() === "!doctype"
                    ? "definition"
                    : "element",
                parent: tagStack.top(),
                isVoid: isVoid(startofTag) ? true : undefined,
                tagName: startofTag,
                attributes: getNodeAttributes(attributeList),
              };
              nodes.push(node);
            }
            if (!isVoid(startofTag))
              tagStack.push(startofTag.replace(/\n|\r/g, ""));
          } else if (srcText[i] === "/") {
            // Ignore space characters.
            do i++;
            while (isSpaceCharac(srcText[i]));
            checkForEnd(srcText[i], source);
            node = {
              type: "element",
              tagName: startofTag,
              parent: tagStack.top(),
              isVoid: isVoid(startofTag) ? true : undefined,
              attributes: getNodeAttributes(attributeList),
            };
            nodes.push(node);
            if (!isVoid(startofTag))
              Errors.enc("INVALID_VOID_TAG", source, i, { name: startofTag });
          }
        } else {
          /**
           * Foreign Tags without Attributes.
           */
          if (isForeignTag(startofTag)) {
            i = handleForeignTags(startofTag, srcText.slice(i), i);
          } else {
            node = {
              type: "element",
              tagName: startofTag,
              parent: tagStack.top(),
            };
            nodes.push(node);
          }

          if (!isVoid(startofTag)) tagStack.push(startofTag);
        }
      }
    } else if (textIsCounting) {
      textStore += srcText[i];
    } else if (!isSpaceCharac(srcText[i])) {
      textStore += srcText[i];
      textIsCounting = true;
    }
  }
  return nodes;
}

export default getDOMNodes;
