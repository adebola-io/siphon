import { generatorOptions } from ".";
import { JSNode } from "../../../types";

export class gen_utils {
  state = "";
  indentLevel = 0;
  options!: generatorOptions;
  global: any = this;
  fail() {}
  render(node?: JSNode) {
    this.global[node?.type ?? "fail"](node);
  }
  lineLength = 0;
  /**
   * Write to the state.
   * @param text The text to write.
   */
  write(text: string) {
    this.state += text;
    this.lineLength += text.length;
  }
  /**
   * Only write to the state if a condition is true.
   */
  writeIf(text: string, condition?: boolean) {
    if (condition) this.write(text);
  }
  renderTopLevel(node: any) {
    if (
      node.type === "ExpressionStatement" &&
      /Function|Object|Class/.test(node.expression.type)
    ) {
      this.write("(");
      this.render(node.expression);
      this.write(")");
    } else this.render(node);
  }
  /**
   * Add a new line and the nessary indentation to the output.
   */
  newline() {
    if (this.options.format) {
      this.write("\n");
      this.lineLength = 0;
      for (let x = 0; x < this.indentLevel; x++)
        this.write("  "), (this.lineLength += 2);
    }
  }
  comma(node: any, i: number) {
    if (i !== node.length - 1) {
      this.write(",");
      this.space();
    }
  }
  /** Align items in a sequence vertically for easier access. */
  verticalAlign = 0;
  /**
   * Add a space to the output.
   * @param inBetween The text to write between the space and another space.
   */
  space(inBetween?: string) {
    if (this.options.format)
      this.state += ` ${inBetween ? `${inBetween} ` : ""}`;
    else if (inBetween) this.write(inBetween);
  }
  /** Print a list of nodes separated by commas. */
  sequence(list: any[]) {
    let i = 0;
    if (list.length > 2) {
      this.indentLevel++;
      if (list[0].type !== "VariableDeclarator") this.newline();
    } else if (list[0]?.type === "Property" && list[0].method) {
      this.indentLevel++;
      this.newline();
    }
    for (i; list[i]; i++) {
      this.render(list[i]);
      this.comma(list, i);
      if (list.length > 2 && i !== list.length - 1) this.newline();
    }
    if (list.length > 2) {
      this.indentLevel--;
      if (list[0].type !== "VariableDeclarator") this.newline();
    } else if (list[0]?.type === "Property" && list[0].method) {
      this.indentLevel--;
      this.newline();
    }
  }
  /**
   * Erase written text;
   * @param length How far back to erase.
   */
  erase(length = 1) {
    this.state = this.state.slice(0, -length);
  }
}
