import { newIdentifier, newMemberExp } from "../../helpers/creator";

const String_prototype = newMemberExp(
  newIdentifier("String"),
  newIdentifier("prototype")
);

export default String_prototype;
