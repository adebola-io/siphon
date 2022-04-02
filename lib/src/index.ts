import { bundler } from "./core/bundler";
import formatter from "./core/formatter";
import minifier from "./core/minifier";

const siphon = { bundler, formatter, minifier };
export default siphon;
