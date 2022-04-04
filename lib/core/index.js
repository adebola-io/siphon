"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bundler_1 = require("./bundler");
var formatter_1 = require("./formatter");
var minifier_1 = require("./minifier");
var resolver_1 = require("./resolver");
var parser_1 = require("./parser");
var generator_1 = require("./generator");
var core = {
    bundler: bundler_1.default,
    minifier: minifier_1.default,
    formatter: formatter_1.default,
    parser: parser_1.default,
    Generator: generator_1.default,
    Resolver: resolver_1.default,
};
exports.default = core;
