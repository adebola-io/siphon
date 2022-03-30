const barrel = require("../lib/dist/barrel.js").default;

console.log(barrel("test/test.html").getElementsByTagName("link"));
