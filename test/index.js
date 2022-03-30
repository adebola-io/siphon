const barrel = require("../lib/dist/barrel.js");

barrel.bundle(`test/test.html`).into("test/test.bundle.html");

// console.log([1, 2, 3, 4].slice(0, -1));
