import { existsSync, PathLike, readFileSync } from "fs";
import * as path from "path";
import Errors from "../../../errors";
import relativePath from "../../../utils/relativePath";
import { checkForEnd, isSpaceCharac, stringMarkers } from "../html/parseUtils";

/**
 * Runs through a CSS file, resolves its imports and removes comments.
 * @param source The CSS file to parse through.
 * @returns compiled css text.
 */
function textify(source: PathLike) {
  let foreignImports: string[] = [];
  let weirdImports: { srcpath: string; name: string }[] = [];
  let allImports: string[] = [source.toString()];
  function textify_core(source: PathLike) {
    let cssText = readFileSync(source).toString();
    let store = "";
    let text = "";
    let cssFileImports = [];
    for (let i = 0; cssText[i]; i++) {
      //   Ignore comments.
      if (cssText.slice(i, i + 2) === "/*") {
        do i++;
        while (cssText[i] && cssText.slice(i, i + 2) !== "*/");
        i += 2;
      } else if (stringMarkers.includes(cssText[i])) {
        //   Ignore strings.
        let marker = cssText[i++];
        text += marker;
        while (cssText[i] && cssText[i] !== marker) text += cssText[i++];
        text += cssText[i++];
        // Import statements.
      } else if (cssText.slice(i, i + 7) === "@import") {
        i += 8;
        while (isSpaceCharac(cssText[i])) i++;
        while (cssText[i] && cssText[i] !== ";") {
          if (stringMarkers.includes(cssText[i])) {
            let marker = cssText[i++];
            store += marker;
            while (cssText[i] && cssText[i] !== marker) store += cssText[i++];
            store += marker;
            i++;
          } else store += cssText[i++];
        }
        if (store.includes("https://") || store.includes("http://")) {
          foreignImports.push("@import " + store);
        } else cssFileImports.push(store);
        store = "";
        while (isSpaceCharac(cssText[i])) i++;
      } else if (cssText.slice(i, i + 4) === "url(") {
        text += "url(";
        i += 4;
        while (cssText[i] && cssText[i] !== ")") {
          if (stringMarkers.includes(cssText[i])) {
            let marker = cssText[i++];
            store += marker;
            while (cssText[i] && cssText[i] !== marker) {
              store += cssText[i++];
            }
            checkForEnd(cssText[i], source);
            store += marker;
          } else store += cssText[i];
          i++;
        }
        checkForEnd(cssText[i], source);
        if (store.includes("https://") || store.includes("http://")) {
          text += store + ")";
        } else {
          if (stringMarkers.includes(store[0])) {
            store = store.slice(1, store.lastIndexOf(store[0]));
          }
          let truePath = relativePath(source, store);
          weirdImports.push({
            srcpath: truePath,
            name: path.basename(truePath),
          });
          text += `"./${path.basename(truePath)}")`;
        }
        store = "";
      } else text += cssText[i];
    }
    cssFileImports.forEach(function (cssimport) {
      let src = "";
      let i = 0;
      while (cssimport[i]) {
        if (stringMarkers.includes(cssimport[i])) {
          let marker = cssimport[i++];
          while (cssimport[i] && cssimport[i] !== marker) src += cssimport[i++];
        } else if (cssimport.slice(i, i + 3) === "url") {
          i += 3;
          while (isSpaceCharac(cssimport[i])) i++;
          if (cssimport[i] === "(") {
            i++;
            while (cssimport[i] && cssimport[i] !== ")") {
              if (stringMarkers.includes(cssimport[i])) {
                let marker = cssimport[i++];
                while (cssimport[i] && cssimport[i] !== marker)
                  src += cssimport[i++];
              } else src += cssimport[i++];
            }
          }
        } else src += cssimport[i++];
      }
      if (src.endsWith(")")) src = src.slice(0, -1);
      if (src.endsWith(".css")) {
        let realSrc = relativePath(source, src);
        if (realSrc === source) Errors.enc("CSS_SELF_IMPORT", source);
        if (!existsSync(realSrc)) Errors.enc("CSS_NON_EXISTENT", realSrc);
        if (allImports.includes(realSrc))
          Errors.enc("CSS_CIRCULAR_IMPORT", realSrc);
        text = textify_core(realSrc) + "\n" + text;
        allImports.push(realSrc);
      } else foreignImports.push(`@import url(${src})`);
    });
    return text;
  }
  let result = textify_core(source);
  return {
    text:
      foreignImports.join(";") +
      (foreignImports.length > 0 ? ";" : "") +
      result,
    links: weirdImports,
  };
}

export default textify;
