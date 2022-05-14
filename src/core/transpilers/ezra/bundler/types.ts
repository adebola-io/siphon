import { PathLike } from "fs";
import { FunctionDeclaration, VariableDeclaration } from "../../../../types";

export interface Asset {
  id: string;
  filename: PathLike;
  dependencies: Dependency[];
  module: Array<FunctionDeclaration | VariableDeclaration>;
}
export interface Dependency {
  id: string;
  path: PathLike;
  extension: string;
}
