import { Identifier, PrivateIdentifier } from "../../../../../types";
import { isDigit, isValidIdentifierCharacter } from "../../../../../utils";
import { ezra } from "./base";

const keywords: any = {
  arguments: true,
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
  eval: true,
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

ezra.identifier = function (allowKeyword = false) {
  const id = new Identifier(this.j);
  if (!isValidIdentifierCharacter(this.char)) this.raise("IDENTIFIER_EXPECTED");
  if (isDigit(this.char)) this.raise("ID_FOLLOWS_LITERAL");
  while (isValidIdentifierCharacter(this.char))
    (id.name += this.char), this.next();
  id.loc.end = this.j - 1;
  if (!allowKeyword && keywords[id.name]) {
    this.raise("RESERVED", id.name, id.loc.end);
  }
  this.innerspace(true);
  return id;
};
