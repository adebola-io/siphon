import { PathLike, readFileSync } from "fs";
import relativePath from "../../../utils/relativePath";
import { isSpaceCharac, stringMarkers } from "../html/parseUtils";

/**
 * Runs through a CSS file, resolves its imports and removes comments.
 * @param source The CSS file to parse through.
 * @returns compiled css text.
 */
function textify(source: PathLike) {
  let crossSiteImports: string[] = [];
  function textify_core(source: PathLike) {
    let cssText = readFileSync(source).toString();
    let store = "";
    let text = "";
    let baseimports = [];
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
          crossSiteImports.push("@import " + store);
        } else baseimports.push(store);
        store = "";
        while (isSpaceCharac(cssText[i])) i++;
      } else text += cssText[i];
    }
    baseimports.forEach(function (cssimport) {
      let realImport = "";
      let i = 0;
      while (cssimport[i]) {
        if (stringMarkers.includes(cssimport[i])) {
          let marker = cssimport[i++];
          while (cssimport[i] && cssimport[i] !== marker)
            realImport += cssimport[i++];
        } else if (cssimport.slice(i, i + 3) === "url") {
          i += 3;
          while (isSpaceCharac(cssimport[i])) i++;
          if (cssimport[i] === "(") {
            i++;
            while (cssimport[i] && cssimport[i] !== ")") {
              if (stringMarkers.includes(cssimport[i])) {
                let marker = cssimport[i++];
                while (cssimport[i] && cssimport[i] !== marker)
                  realImport += cssimport[i++];
              } else realImport += cssimport[i++];
            }
          }
        } else realImport += cssimport[i++];
      }
      if (realImport.endsWith(")")) realImport = realImport.slice(0, -1);
      text = textify_core(relativePath(source, realImport)) + "\n" + text;
    });
    return text;
  }
  let result = textify_core(source);
  return (
    crossSiteImports.join(";\n") +
    (crossSiteImports.length > 0 ? ";\n" : "") +
    result
  );
}

export default textify;
