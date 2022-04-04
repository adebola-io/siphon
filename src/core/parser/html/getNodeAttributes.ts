import { stringMarkers } from "../../../utils";
function getNodeAttributes(list: string) {
  let i = 0,
    key: string = "",
    value: string | undefined = undefined,
    attributes: any = {};
  list = list.trim();
  while (list[i]) {
    if (list[i] === "=") {
      i++;
      value = "";
      if (stringMarkers.includes(list[i])) {
        let marker = list[i++];
        // value += marker;
        while (list[i] && list[i] !== marker) value += list[i++];
        // value += marker;
      } else while (list[i] && list[i] !== " ") value += list[i++];
    } else if (list[i] === " " && key.trim() !== "") {
      attributes[key.trim()] = value !== undefined ? value : true;
      key = "";
      value = "";
    } else {
      key += list[i];
    }
    i++;
  }
  attributes[key.trim()] = value !== undefined ? value : true;

  return attributes;
}

export default getNodeAttributes;
