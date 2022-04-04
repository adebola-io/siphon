function nte(unit: number) {
  return `${unit.toString().length === 1 ? `0${unit}` : unit}`;
}
export interface datingOptions {
  noDate?: boolean;
}
export function newTimeStamp(options?: datingOptions) {
  let d = new Date();
  return `${nte(d.getHours())}:${nte(d.getMinutes())}:${nte(d.getSeconds())}${
    options?.noDate ? "" : `|${d.getDay()}-${d.getMonth()}-${d.getFullYear()}`
  }`;
}
