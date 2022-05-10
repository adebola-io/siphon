import { newIdentifier, memberExpression } from "../../helpers/creator";

const String_prototype = memberExpression(
  newIdentifier("String"),
  newIdentifier("prototype")
);

export default String_prototype;
