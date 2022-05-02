import { generatorOptions } from ".";

export class gen_utils {
  output = "";
  indentLevel = 0;
  options!: generatorOptions;
  lineLength = 50;
  write(text: string) {
    this.output += text;
    this.lineLength += text.length;
  }
  /**
   * Add a new line and the nessary indentation to the output.
   */
  newline() {
    if (this.options.format) {
      this.write("\n");
      this.lineLength = 0;
      for (let x = 0; x < this.indentLevel; x++) this.write("  ");
    }
  }
  comma(node: any, i: number) {
    if (i !== node.length - 1) {
      this.write(",");
      this.space();
    }
  }
  verticalAlign = false;
  /**
   * Add a space to the output.
   * @param isNecessary Whether or not the space is important for syntactic correctness.
   */
  space(isNecessary = false) {
    if (this.options.format || isNecessary) this.output += " ";
  }
  /**
   * Erase written text;
   * @param length How far back to erase.
   */
  erase(length = 1) {
    this.output = this.output.slice(0, -length);
  }
}
