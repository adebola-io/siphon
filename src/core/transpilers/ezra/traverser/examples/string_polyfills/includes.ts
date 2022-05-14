// MDN polyfill for String.prototype.includes
import {
  IfStatement,
  ReturnStatement,
  ThrowStatement,
} from "../../../../../../types";
import {
  assignmentExpression as assign,
  binaryExpression as binary,
  blockStatement as block,
  callExpression as call,
  expressionStatement as exprStat,
  newFunctionExp as _function,
  newIdentifier as id,
  memberExpression as member,
  numberLiteral as num,
  newString as str,
  this_,
  unaryExpression,
  undefined_,
  use_strict,
} from "../../helpers/creator";
import String_prototype from "./prototype";

let String_prototype_includes = member(String_prototype, id("includes"));
let searchString = id("searchString");
let position = id("position");
/**
 * if (searchString instanceof RegExp)
 *    throw TypeError('First argument must not be a RegExp');
 */
let regexQuery = new IfStatement(0);
regexQuery.test = binary(searchString, "instanceof", id("RegexEp"));
let throwstat = new ThrowStatement(0);
throwstat.argument = call(id("TypeError"), [
  str('"First argument must not be a RegExp"'),
]);
regexQuery.consequent = throwstat;
regexQuery.alternate = null;

/**
 * if (position === undefined) position = 0;
 */
let posUndefined = new IfStatement(0);
posUndefined.test = binary(position, "===", undefined_);
posUndefined.consequent = exprStat(assign(position, "=", num(0)));
posUndefined.alternate = null;

/**
 * return this.indexOf(search, start) !== -1;
 */
let retstat = new ReturnStatement(0);
retstat.argument = binary(
  call(member(this_, id("indexOf")), [searchString, position]),
  "!==",
  unaryExpression("-", num(1))
);

let includes = new IfStatement(0);
includes.test = binary(String_prototype_includes, "===", undefined_);
includes.consequent = block([
  exprStat(
    assign(
      String_prototype_includes,
      "=",
      _function(
        null,
        [searchString, position],
        block([use_strict, regexQuery, posUndefined, retstat])
      )
    )
  ),
]);
includes.alternate = null;

export default includes;
