import fs = require("fs");
import path = require("path");
import { isSpaceCharac } from "./parser/parseUtils";
function err(message: string, source?: fs.PathLike, charac?: number): void {
  var sourceText: any;
  let i = 0,
    j = 1,
    k = 0;
  if (source && charac) {
    sourceText = fs.readFileSync(source).toString();
    while (i < charac) {
      if (sourceText[i] === "\n") {
        j++;
        k = 0;
      }
      if (!isSpaceCharac(sourceText[i])) k++;
      i++;
    }
  }
  message = `${message} ${
    source && charac
      ? `\n    at ${path.resolve(source.toString())}:${j}:${k}`
      : ""
  }`;
  throw new Error(message);
}
type Clauses =
  | "FILE_NON_EXISTENT"
  | "CSS_NON_EXISTENT"
  | "NOT_A_DIRECTORY"
  | "COMMENT_UNCLOSED"
  | "TAG_UNCLOSED"
  | "HTML_FRAGMENT"
  | "INVALID_TAG"
  | "INVALID_VOID_TAG"
  | "ABRUPT"
  | "CLOSING_TAG_ATTR"
  | "UNEXPECTED_CLOSE";
const Errors = {
  enc(clause: Clauses, source: fs.PathLike, charac?: number, options?: any) {
    switch (clause) {
      case "FILE_NON_EXISTENT":
        err(`Barrel could not find ${source.toString()}.`);
        break;
      case "CSS_NON_EXISTENT":
        err(
          `You are trying to import '${source.toString()}', which cannot be found.`
        );
        break;
      case "NOT_A_DIRECTORY":
        err(
          `The given path ${source.toString()} does not lead to a directory.`
        );
        break;
      case "COMMENT_UNCLOSED":
        err(`Barrel encountered an unclosed comment.`, source, charac);
        break;
      case "TAG_UNCLOSED":
        err(`Expected a start tag.`, source, charac);
        break;
      case "HTML_FRAGMENT":
        err(`Barrel does not support HTML fragments.`, source, charac);
        break;
      case "INVALID_TAG":
        err(`Invalid tag Name '${options.name}'`, source, charac);
        break;
      case "INVALID_VOID_TAG":
        err(`'${options.name}' cannot be used as a void tag.`, source, charac);
        break;
      case "ABRUPT":
        err(`Unexpected end of file.`);
        break;
      case "CLOSING_TAG_ATTR":
        err(`Attributes are not allowed in the closing tag.`, source, charac);
        break;
      case "UNEXPECTED_CLOSE":
        err(`Encountered unexpected closing tag.`, source, charac);
        break;
    }
  },
};

export default Errors;
