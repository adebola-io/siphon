"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newTimeStamp = void 0;
function nte(unit) {
    return "".concat(unit.toString().length === 1 ? "0".concat(unit) : unit);
}
function newTimeStamp(options) {
    var d = new Date();
    return "".concat(nte(d.getHours()), ":").concat(nte(d.getMinutes()), ":").concat(nte(d.getSeconds())).concat((options === null || options === void 0 ? void 0 : options.noDate) ? "" : "|".concat(d.getDay(), "-").concat(d.getMonth(), "-").concat(d.getFullYear()));
}
exports.newTimeStamp = newTimeStamp;
