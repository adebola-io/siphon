import bundler from "./bundler";
import formatter from "./formatter";
import minifier from "./minifier";
import Resolver from "./resolver";
import parser from "./parser";
import Generator from "./generator";

const core = {
  bundler,
  minifier,
  formatter,
  parser,
  Generator,
  Resolver,
};

export default core;
