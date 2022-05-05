import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: "lib/transpilers/ezra/index.js",
  output: {
    file: "lib/transpilers/ezra/ezra.bundle.mjs",
  },
  plugins: [commonjs(), nodeResolve()],
};
