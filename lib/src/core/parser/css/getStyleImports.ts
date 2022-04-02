import { PathLike, readFileSync } from "fs";
import { isSpaceCharac, stringMarkers } from "../html/parseUtils";

function getStyleImports(source: PathLike) {
  let cssText = readFileSync(source).toString();
  let store = "";
  let imports = [];
  for (let i = 0; cssText[i]; i++) {
    //   Ignore comments.
    if (cssText.slice(i, i + 2) === "/*") {
      do i++;
      while (cssText[i] && cssText.slice(i, i + 2) !== "*/");
      i += 2;
    } else if (stringMarkers.includes(cssText[i])) {
      //   Ignore strings.
      let marker = cssText[i++];
      while (cssText[i] && cssText[i] !== marker) i++;
      i++;
    } else if (cssText.slice(i, i + 7) === "@import") {
      i += 8;
      while (isSpaceCharac(cssText[i])) i++;
      while (cssText[i] && cssText[i] !== ";") {
        if (stringMarkers.includes(cssText[i])) {
          let marker = cssText[i++];
          store += marker;
          while (cssText[i] && cssText[i] !== marker) store += cssText[i++];
          store += marker;
        } else store += cssText[i];
        i++;
      }
      imports.push(store);
      store = "";
    }
  }
  return imports;
}

export default getStyleImports;
