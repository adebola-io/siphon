import * as fs from "fs";
import * as path from "path";
import { trace } from "../../utils";
import { red, bold } from "colors";
import { ErrorTypes } from "../../types";

function error(msg: string, src?: fs.PathLike, char?: number): void {
  var pos: any;
  var full: string = bold(red(`${msg}`));
  if (src !== undefined) {
    if (char !== undefined) pos = trace(src, char);
    let pth =
      path.resolve(src.toString()) +
      (char !== undefined ? `:${pos.line}:${pos.col}` : "");
    full += bold(red("\n    " + `at ${pth}`));
  }
  const e: any = new Error(full);
  e.heading = msg;
  e.location = src;
  e.position = pos;
  throw e;
}

const Errors = {
  enc(type: ErrorTypes, src: fs.PathLike, index?: number, options?: any) {
    var e = { [type]: true },
      message = "";
    switch (true) {
      case e.FILE_NON_EXISTENT:
        error(`Siphon could not find ${src.toString()}.`);
      case e.MISSING_SCRIPT:
        message = `Siphon could not find the script file '${options.token}'.`;
        error(message, src, index);
      case e.NO_ROOTDIR:
        error(`The rootDir '${src}' does not exist.`);
      case e.SOMETHING_WENT_WRONG:
        error(`Something went wrong while parsing your Javascript text.`, src);
      case e.CSS_NON_EXISTENT:
        error(`The stylesheet '${src.toString()}' cannot be found.`);
      case e.CSS_SELF_IMPORT:
        error(`The stylesheet ${src.toString()} has an import to itself.`);
      case e.HTML_SELF_INJECT:
        error(`The HTML file ${src.toString()} has an inject to itself.`);
      case e.CSS_CIRCULAR_IMPORT:
        error(`The stylesheet ${src.toString()} has already been imported.`);
      case e.CSS_STRING_OR_URI_EXPECTED:
        error("String or URL expected.", src, index);
      case e.OPEN_BRAC_EXPECTED:
        error("'(' expected.", src, index);
      case e.CLOSING_CURL_EXPECTED:
        error("'}' was expected.", src, index);
      case e.CLOSING_SQUARE_BRAC_EXPECTED:
        error("']' was expected.", src, index);
      case e.SEMI_COLON_EXPECTED:
        error("Semicolon expected.", src, index);
      case e.COLON_EXPECTED:
        error("':' expected.", src, index);
      case e.CSS_OPEN_CURL_EXPECTED:
        error("'{' expected.", src, index);
      case e.CATCH_NEW_PARAM:
        error("A catch block can only have one paramater.", src, index);
      case e.CATCH_ASSIGN:
        error("A catch parameter must not have an initializer.");
      case e.CONST_INIT:
        error("const variables must be initialized.", src, index);
      case e.DESTRUCTURING_ERROR:
        error("Destructured variables must have an initializer.", src, index);
      case e.CSS_INVALID_IDENTIFIER:
        error("Invalid CSS Identifier.", src, index);
      case e.JS_INVALID_IDENTIFIER:
        error("Invalid identifier.", src, index);
      case e.JS_STATIC_CONSTRUCTOR:
        message =
          "'static' modifier cannot appear on a constructor declaration.";
        error(message, src, index);
      case e.JS_ILLEGAL_PRIV_IDENT:
        message = "Private identifiers cannot be used outside class bodies.";
        error(message, src, index);
      case e.JS_ILLEGAL_IMPORT_EXP:
        message =
          "Dynamic imports can only accept a module specifier and an optional assertion as arguments.";
        error(message, src, index);
      case e.JS_DUPLICATE_CONSTRUCTORS:
        error("A class may only have one constructor.", src, index);
      case e.JS_ILLEGAL_RETURN:
        message = `A 'return' statement can only be used within a function body.`;
        error(message, src, index);
      case e.JS_ILLEGAL_CONTINUE:
        message = `A 'continue' statement can only jump to a label of an enclosing iteration statement.`;
        error(message, src, index);
      case e.HTML_CIRCULAR_INJECT:
        error(`Circular module detected in ${src.toString()}.`);
      case e.NOT_A_DIRECTORY:
        error(`The path ${src.toString()} does not lead to a directory.`);
      case e.COMMENT_UNCLOSED:
        error(`Unclosed comment.`, src, index);
      case e.TAG_UNCLOSED:
        error(`Expected a start tag.`, src, index);
      case e.HTML_FRAGMENT:
        error(`Siphon does not support HTML fragments.`, src, index);
      case e.UNCLOSED_BLOCK_COMMENT:
        error("*/ expected.", src, index);
      case e.JS_UNEXPECTED_TOKEN:
        error(`Unexpected token '${options.token}'.`, src, index);
      case e.JS_ARGUMENT_EXPRESSION_EXPECTED:
        error(`Argument expression expected.`, src, index);
      case e.JS_INVALID_REGEX_FLAG:
        error(`Invalid regular expression flag.`, src, index);
      case e.JS_WHILE_EXPECTED:
        error(`'while' expected.`, src, index);
      case e.JS_INVALID_LHS_POFTIX:
        message = `Invalid left-hand side expression in postfix operation.`;
        error(message, src, index);
      case e.JS_PARAM_DEC_EXPECTED:
        error("Parameter declaration expected.", src, index);
      case e.JS_PARAM_CLASH:
        message = `The parameter '${options.token}' has already been declared.'`;
        error(message, src, index);
      case e.JS_INVALID_LHS_PREFIX:
        message = `Invalid left-hand side expression in prefix operation.`;
        error(message, src, index);
      case e.JS_INVALID_LHS_ASSIGN:
        error(`Invalid left-hand side in assignment.`, src, index);
      case e.JS_ILLEGAL_CASE:
        error("A case can only be used within a switch statement.", src, index);
      case e.JS_EXPORT_EXPECTED:
        error("'export' expected.", src, index);
      case e.JS_ILLEGAL_ELSE:
        error("Unexpected else statement.", src, index);
      case e.JS_PROPERTY_DEC_EXPECTED:
        error("Property declaration expected.", src, index);
      case e.JS_REST_MUST_END:
        error("A rest element must be last in a parameter list.", src, index);
      case e.JSX_NO_CLOSE:
        message = `JSX element '${options.token}' has no corresponding closing tag.`;
        error(message, src, index);
      case e.JSX_FRAGMENT_NO_CLOSE:
        error(`JSX Fragment has no corresponding closing tag.`, src, index);
      case e.INVALID_NEW_META_PROPERTY:
        message = `'${options.token}' is not a valid meta-property for keyword 'new'. Did you mean 'target'?`;
        error(message, src, index);
      case e.INVALID_TAG:
        error(`Invalid tag Name '${options.name}'`, src, index);
      case e.MODULE_REQUIRES_SRC:
        error(`HTML module tags require a src attribute.`);
      case e.INVALID_VOID_TAG:
        error(`'${options.name}' cannot be used as a void tag.`, src, index);
      case e.ABRUPT:
        error(`Unexpected end of file.`, src);
      case e.CLOSING_TAG_ATTR:
        error(`Attributes are not allowed in the closing tag.`, src, index);
      case e.UNEXPECTED_CLOSE:
        error(`Encountered unexpected closing tag.`, src, index);
      case e.OPEN_CURLY_EXPECTED:
        error(`'{' expected.`, src, index);
      case e.UNSUPPORTED_IMAGE_FORMAT:
        message = `${options.src} is not a supported image format. \n\n To stop image checking, set checkImageTypes to false in your config file.`;
        error(message, src, index);
      case e.JS_UNEXP_KEYWORD_OR_IDENTIFIER:
        error(`Unexpected keyword or Identifier.`, src, index);
      case e.UNTERMINATED_STRING_LITERAL:
        error(`Siphon encountered an unterminated string literal.`, src, index);
      case e.UNTERMINATED_REGEX_LITERAL:
        message = `Siphon encountered an unterminated regular expression literal.`;
        error(message, src, index);
      case e.RESERVED:
        message = `'${options.token}' is a reserved keyword and cannot be used as an identifer.`;
        error(message, src, index);
      case e.EXPECTED:
        error(`'${options.token}' expected.`, src, index);
      case e.COMMA_EXPECTED:
        error(`A ',' was expected.`, src, index);
      case e.JS_CASE_EXPECTED:
        error("'case' or 'default' expected.", src, index);
      case e.EXPRESSION_EXPECTED:
        error("An expression was expected.", src, index);
      case e.VARIABLE_DECLARATION_EXPECTED:
        error("Variable declaration or statement expected.", src, index);
      case e.JS_DEC_OR_STATEMENT_EXPECTED:
        error("Declaration or statement expected", src, index);
      case e.JS_INVALID_SETTER_PARAMS:
        error(`A 'set' accessor must have exactly one parameter.`, src, index);
      case e.JS_INVALID_GETTER_PARAMS:
        error(`A 'get' accessor cannot have parameters.`, src, index);
      case e.JS_ILLEGAL_IMPORT:
        message =
          "An import statement can only be used at the top level of a module.";
        error(message, src, index);
      case e.JS_COMMA_IN_COMPUTED_PROP:
        error("Commas are not allowed in computed property names.", src, index);
      case e.IDENTIFIER_EXPECTED:
        error("Identifier expected.", src, index);
      case e.EMPTY_CONST_DECLARATION:
        error("'const' declarations must be initialized.", src, index);
      case e.JS_IMPORTED_MODULE_MISSING:
        error(`Cannot find module '${options.token}'.`, src, index);
        break;
      case e.BIGINT_DECIMAL:
        error("A bigint literal must be an integer.", src, index);
      case e.ID_FOLLOWS_LITERAL:
        message =
          "An identifier or keyword cannot immediately follow a numeric literal.";
        error(message, src, index);
      case e.MISSING_DESC_INITIALIZER:
        error("Destructured variables must have an initializer.", src, index);
      case e.INVALID_ASSIGNMENT_LEFT:
        error("Invalid left-hand side in assignment.", src, index);
      case e.SHEBANG_NOT_ALLOWED:
        error("Shebang comments are not suppoerted in the browser.");
    }
  },
  custom(message: string, source: fs.PathLike, charac?: number) {
    error(message, source, charac);
  },
};

export default Errors;
