import { PathLike, readFileSync, writeFileSync } from "fs";
import { basename, extname, resolve } from "path";
import {
  FontFaceRule,
  HTMLDocumentNode,
  ImportRule,
  siphonOptions,
  StyleRule,
  Stylesheet,
} from "../../types";
import {
  copyInBase64,
  fileExists,
  getFileName as fileName,
  relativePath as rel,
  stringifytoBase64,
  tryMkingDir,
} from "../../utils";
import Palette from "../transpilers/palette";
import tagNameSearch from "../transpilers/mimo/tagNameSearch";
/**
 * Performs required transformations on the relationships between HTML and CSS.
 * @param nodes The generated DOM for the HTML.
 * @param source The address of the HTML file.
 * @param destination The destination address.
 * @param options Bundling options.
 * @param assets A mapping of all included assets, e.g. fonts, images, etc.
 * @returns Transformed DOM.
 */
function resolveCSS(
  nodes: HTMLDocumentNode[],
  source: PathLike,
  destination: PathLike,
  options: siphonOptions,
  assets: any
) {
  const trail: PathLike[] = [];
  /**
   * Recursively look for and combine CSS imports.
   * @param href Starting Path.
   * @returns Resolved CSS.
   */
  function resolveCSSImports(AST: any, href: PathLike) {
    var rule: any;
    for (let i = 0; AST.rules[i]; i++) {
      rule = AST.rules[i];
      if (
        rule instanceof ImportRule &&
        rule.resourceType === "local" &&
        rule.href.endsWith(".css")
      ) {
        // Resolve @imports.
        const index = AST.rules.indexOf(rule);
        const subHref = rel(href, rule.href);
        if (!trail.includes(subHref) && fileExists(subHref)) {
          trail.push(subHref);
          const subAST = Palette.parse(readFileSync(subHref).toString());
          const subASTRules = resolveCSSImports(subAST, subHref);
          AST.rules.splice(index, 1, ...subASTRules);
          i += subASTRules.length - 1;
        } else if (fileExists(subHref)) AST.rules.splice(index, 1);
      } else if (rule instanceof StyleRule) {
        // Resolve urls.
        Object.entries(rule.notation).forEach((entry: any) => {
          if (entry[1].startsWith("url(") && entry[1].endsWith(")")) {
            var asset = "";
            if (/'|"/.test(entry[1][4]))
              asset = rel(href, entry[1].slice(5, -2));
            else asset = rel(href, entry[1].slice(4, -1));
            // Ignore HTTP requests.
            if (!asset.startsWith("https://") && !asset.startsWith("http://")) {
              if (options.wickedMode && fileExists(asset)) {
                rule.notation[entry[0]] =
                  'url("' + stringifytoBase64(asset) + '")';
              } else {
                const file = basename(asset);
                if (!assets[file] && fileExists(asset)) {
                  if (options.storeImagesSeparately) {
                    copyInBase64(asset, `${outputDirectory}/img/${file}`);
                    rule.notation[entry[0]] = `url(./img/${file})`;
                  } else {
                    copyInBase64(asset, `${outputDirectory}/${file}`);
                    rule.notation[entry[0]] = `url(./${file})`;
                  }
                  assets[file] = asset;
                } else if (assets[file] && assets[file] !== asset) {
                  let id = 1;
                  let newcopy = fileName(file) + `-${id}` + extname(file);
                  while (assets[newcopy]) {
                    newcopy = fileName(file) + `-${++id}` + extname(file);
                  }
                  if (options.storeImagesSeparately) {
                    copyInBase64(asset, `${outputDirectory}/img/${newcopy}`);
                    rule.notation[entry[0]] = `url(./img/${newcopy})`;
                  } else {
                    copyInBase64(asset, `${outputDirectory}/${newcopy}`);
                    rule.notation[entry[0]] = `url(./${newcopy})`;
                  }
                  assets[newcopy] = asset;
                } else if (fileExists(asset)) {
                  rule.notation[entry[0]] = `url(./${file})`;
                }
              }
            }
          }
        });
      } else if (
        rule instanceof FontFaceRule &&
        rule.source.startsWith("url(")
      ) {
        // Resolve font files.
        var src = rule.source.slice(4, -1);
        if (/"|'/.test(src[0])) src = rule.source.slice(5, -2);
        if (!src.startsWith("http://") && !src.startsWith("https://")) {
          var asset = rel(href, src);
          if (options.wickedMode && fileExists(asset)) {
            rule.source = `url("${stringifytoBase64(asset)}")`;
          } else {
            const file = basename(asset);
            tryMkingDir(`${outputDirectory}/fonts`);
            if (!assets[file] && fileExists(asset)) {
              copyInBase64(asset, `${outputDirectory}/fonts/${file}`);
              assets[file] = asset;
              rule.source = `url(./fonts/${file})`;
            } else if (assets[file] && assets[file] !== asset) {
              let id = 1;
              let newcopy = fileName(file) + `-${id}` + extname(file);
              while (assets[newcopy]) {
                newcopy = fileName(file) + `-${++id}` + extname(file);
              }
              copyInBase64(asset, `${outputDirectory}/fonts/${newcopy}`);
              assets[newcopy] = asset;
              rule.source = `url(./fonts/${newcopy})`;
            } else if (fileExists(asset)) {
              rule.source = `url(./fonts/${file})`;
            }
          }
        }
      }
    }
    return AST.rules;
  }
  /** CSS <style> nodes. */
  const styles: HTMLDocumentNode[] = tagNameSearch(nodes, "style");
  styles.forEach((style) => {
    const AST = Palette.parse(style.content ?? "");
    AST.rules = [...resolveCSSImports(AST, resolve(source.toString()))];
    if (options.formatFiles) {
      style.content = Palette.generate(AST, { indent: "      ", format: true });
    } else style.content = Palette.generate(AST, { indent: "", format: false });
  });
  /** CSS <link> nodes. */
  const links: HTMLDocumentNode[] = tagNameSearch(nodes, "link").filter(
    (link) => {
      return link.attributes.href && link.attributes.rel === "stylesheet";
    }
  );
  /** <head> node */
  const head: HTMLDocumentNode = tagNameSearch(nodes, "head")[0];
  /** Output CSS Syntax Tree */
  let outputAST = new Stylesheet(0, 0);
  /** Output CSS Text */
  let outputText = "";
  /** Directory to create bundled css if need be. */
  let outputDirectory = rel(destination, "./");
  /** List of imported stylesheets to prevent circular import loop. */
  links.forEach((link) => {
    const href = rel(source, link.attributes.href);
    if (fileExists(href)) {
      trail.push(href);
      const AST = Palette.parse(readFileSync(href).toString());
      outputAST.rules.push(...resolveCSSImports(AST, href));
      delete link.type;
    }
  });
  if (links.length !== 0)
    if (options.internalStyles || options.wickedMode) {
      //   Internal <style>
      if (options.formatFiles) {
        outputText = Palette.generate(outputAST, {
          format: true,
          indent: "      ",
        });
      } else {
        outputText = Palette.generate(outputAST, { format: false, indent: "" });
      }
      const style: HTMLDocumentNode = {
        type: "element",
        tagName: "style",
        childID: head.children?.length,
        content: outputText,
      };
      head?.children?.splice(links[0].childID ?? 0, 0, style);
    } else {
      const outputFileName = fileName(destination) + ".bundle.css";
      // External .css stylesheet.
      if (options.formatFiles)
        outputText = Palette.generate(outputAST, {
          format: true,
          indent: "",
        });
      else {
        outputText = Palette.generate(outputAST, {
          format: false,
          indent: "",
        });
      }
      const bundledLink: HTMLDocumentNode = {
        type: "element",
        tagName: "link",
        isVoid: true,
        childID: head.children?.length,
        attributeList: `rel="stylesheet" href="./${outputFileName}"`,
        attributes: {
          rel: "stylesheet",
          href: "./" + outputFileName,
        },
        content: outputText,
      };
      head?.children?.splice(links[0].childID ?? 0, 0, bundledLink);
      // Write into output.
      writeFileSync(`${outputDirectory}/${outputFileName}`, outputText);
    }
  return nodes;
}

export default resolveCSS;
