import { Identifier } from "../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

export const keywords: any = {
  // arguments: true,
  await: true,
  break: true,
  case: true,
  catch: true,
  class: true,
  const: true,
  continue: true,
  debugger: true,
  default: true,
  delete: true,
  do: true,
  else: true,
  // eval: true,
  extends: true,
  import: true,
  export: true,
  false: true,
  finally: true,
  for: true,
  function: true,
  if: true,
  implements: true,
  return: true,
  in: true,
  instanceof: true,
  interface: true,
  let: true,
  new: true,
  null: true,
  package: true,
  private: true,
  protected: true,
  public: true,
  static: true,
  super: true,
  switch: true,
  synchronized: true,
  this: true,
  try: true,
  typeof: true,
  var: true,
  void: true,
  while: true,
  with: true,
  yield: true,
};

ezra.identifier = function (allowKeyword = false, allowHyphen = false) {
  const id = new Identifier(this.i);
  if (!isValidIdentifierCharacter(this.text[this.i]))
    this.raise("IDENTIFIER_EXPECTED");
  if (isDigit(this.text[this.i])) this.raise("ID_FOLLOWS_LITERAL");
  while (
    isValidIdentifierCharacter(this.text[this.i]) ||
    (allowHyphen && this.text[this.i] === "-")
  )
    (id.name += this.text[this.i]), this.i++;
  id.loc.end = this.i - 1;
  if (!allowKeyword && keywords[id.name] === true) {
    this.raise("RESERVED", id.name, id.loc.end);
  }
  return id;
};
