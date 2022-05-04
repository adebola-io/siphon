import { datingOptions } from "../types";

export * from "./fs_utils";
export * from "./parsing_utils";
/**
 *
 * @param options Dating Options
 * @returns A new time stamp.
 */
export function newTimeStamp(options?: datingOptions) {
  function nte(unit: number) {
    return `${unit.toString().length === 1 ? `0${unit}` : unit}`;
  }
  let d = new Date();
  return `${nte(d.getHours())}:${nte(d.getMinutes())}:${nte(d.getSeconds())}${
    options?.noDate ? "" : `|${d.getDay()}-${d.getMonth()}-${d.getFullYear()}`
  }`;
}
