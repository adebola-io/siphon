import { Identifier } from "../../../../types";
import { isValidIdentifierCharacter } from "../../../../utils";
import { ezra } from "./base";

ezra.identifier = function () {
  const id = new Identifier(this.j);
  if (!isValidIdentifierCharacter(this.char)) this.raise("IDENTIFIER_EXPECTED");
  while (isValidIdentifierCharacter(this.char))
    (id.name += this.char), this.next();
  id.loc.end = this.j;
  this.innerspace(true);
  return id;
};
