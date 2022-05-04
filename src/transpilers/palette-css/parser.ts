import { PathLike, readFileSync } from "fs";
import Errors from "../../errors";
import {
  checkForEnd,
  isIllegalCSSIdentifier,
  isSpaceCharac,
} from "../../utils";
import {
  Stylesheet,
  MediaRule,
  SupportRule,
  ImportRule,
  FontFaceRule,
  CharsetRule,
  StyleRule,
  Style,
  KeyframeRule,
  Keyframe,
} from "../../types";

function parse(src: PathLike | string): Stylesheet | SupportRule | MediaRule {
  function parserCore(text: string, root = new Stylesheet(0, 0)) {
    // String Reader.
    function readString(i: number) {
      let marker = text[i++],
        str = "";
      while (text[i] && text[i] !== marker) {
        if (text[i] === "\n") {
          Errors.enc("CSS_STRING_OR_URI_EXPECTED", src, i);
        } else if (
          text[i] === "\\" &&
          text[i + 1] === marker &&
          text[i - 1] !== "\\"
        ) {
          str += text[(i += 2)] + marker;
        } else str += text[i++];
      }
      return { str, end: i + 1, marker };
    }
    // @ Rules.
    function readAtRule(i: number) {
      // @import Rules.
      function readImportRule(start: number, i: number) {
        while (isSpaceCharac(text[i])) i++;
        var href = "",
          resourcetype: "cross-site" | "local";
        switch (true) {
          case text.slice(i, i + 4) === "url(":
            i += 4;
            while (isSpaceCharac(text[i])) i++;
            if (!/'|"/.test(text[i])) {
              while (text[i] && text[i] !== ")") {
                if (text[i] === "\n") {
                  Errors.enc("CLOSING_BRAC_EXPECTED", src, i);
                } else href += text[i++];
              }
              checkForEnd(text[i], src);
              i++;
              break;
            }
          case /'|"/.test(text[i]):
            var movethrough = readString(i);
            href = movethrough.str;
            i = movethrough.end;
            break;
          default:
            Errors.enc("CSS_STRING_OR_URI_EXPECTED", src, i);
        }
        while (isSpaceCharac(text[i])) i++;
        if (text[i] !== ";" && i !== text.length)
          Errors.enc("SEMI_COLON_EXPECTED", src, i);
        href = href.trim().trimEnd();
        if (href.startsWith("http://") || href.startsWith("https://")) {
          resourcetype = "cross-site";
        } else resourcetype = "local";
        let rule = new ImportRule(start, i, resourcetype);
        rule.href = href;
        root.rules.push(rule);
        read(i + 1);
      }
      // @font-face rules.
      function readFontFaceRule(start: number, i: number) {
        while (isSpaceCharac(text[i])) i++;
        if (text[i] !== "{") Errors.enc("CSS_OPEN_CURL_EXPECTED", src, i);
        i++;
        const rule = new FontFaceRule(start, 0);
        function readFontStyles() {
          let property = "";
          let value = "";
          while (text[i] && text[i] !== ":") property += text[i++];
          if (!text[i]) Errors.enc("COLON_EXPECTED", src, i);
          i++;
          while (text[i] && !/;|}/.test(text[i])) {
            if (/'|"/.test(text[i])) {
              let strn = readString(i);
              value += strn.marker + strn.str + strn.marker;
              i = strn.end;
            } else value += text[i++];
          }
          switch (property.trim().trimEnd()) {
            case "font-family":
              rule.family = value.trim().trimEnd();
              break;
            case "src":
              rule.source = value.trim().trimEnd();
              break;
            default:
              break;
          }
          while (text[i] === ";" || isSpaceCharac(text[i])) i++;
          if (text[i] !== "}") readFontStyles();
        }
        readFontStyles();
        rule.loc.end = i;
        root.rules.push(rule);
        read(i + 1);
      }
      // @media rules.
      function readMediaRule(start: number, i: number) {
        let params = "";
        while (text[i] && text[i] !== "{") {
          if (/"|'/.test(text[i])) {
            let value = readString(i);
            params += value.marker + value.str + value.marker;
            i = value.end;
          } else params += text[i++];
        }
        i++;
        let level = 1,
          chunk = "";
        while (text[i] && level) {
          if (text[i] === "{") level++;
          else if (text[i] === "}") level--;
          chunk += text[i++];
        }
        chunk = chunk.slice(0, -1);
        const mediarule = parserCore(
          chunk,
          new MediaRule(start, 0, params.trim().trimEnd())
        );
        mediarule.loc.end = i;
        root.rules.push(mediarule);
        read(i);
      }
      // @supports rules.
      function readSupportRule(start: number, i: number) {
        while (isSpaceCharac(text[i])) i++;
        var inverseQuery: boolean = false;
        if (text.slice(i, i + 3) === "not") {
          inverseQuery = true;
          i += 3;
          while (isSpaceCharac(text[i])) i++;
        }
        if (!text[i] || text[i] !== "(")
          Errors.enc("OPEN_BRAC_EXPECTED", src, i);
        i++;
        let query = "";
        while (text[i] && text[i] !== ")") {
          if (/'|"/.test(text[i])) {
            let str = readString(i);
            query += str.marker + str.str + str.marker;
            i = str.end;
          } else query += text[i++];
        }
        if (!text[i]) Errors.enc("CLOSING_BRAC_EXPECTED", src, i);
        i++;
        while (isSpaceCharac(text[i])) i++;
        if (text[i] !== "{") Errors.enc("CSS_OPEN_CURL_EXPECTED", src, i);
        i++;
        let level = 1,
          chunk = "";
        while (text[i] && level) {
          if (text[i] === "{") level++;
          else if (text[i] === "}") level--;
          chunk += text[i++];
        }
        const supportRule = parserCore(
          chunk.slice(0, -1).trim().trimEnd(),
          new SupportRule(start, i, query, inverseQuery)
        );
        supportRule.loc.end = i;
        root.rules.push(supportRule);
        read(i);
      }
      // @keyframes rules.
      function readKeyframeRule(start: number, i: number) {
        const keyframeRule = new KeyframeRule(start, 0);
        while (isSpaceCharac(text[i])) i++;
        let identifier = "";
        while (text[i] && text[i] !== "{") identifier += text[i++];
        if (!text[i]) Errors.enc("CSS_OPEN_CURL_EXPECTED", src, i);
        i++;
        if (isIllegalCSSIdentifier(identifier))
          Errors.enc("CSS_INVALID_IDENTIFIER", src, i);
        keyframeRule.identifier = identifier.trimEnd();
        function readFrameStyles(frame: Keyframe, i: number): number {
          while (isSpaceCharac(text[i])) i++;
          const style = new Style("", "");
          style.loc.start = i;
          while (text[i] && text[i] !== ":") style.property += text[i++];
          style.property = style.property.trimEnd();
          i++;
          while (text[i] && !/\;|}/.test(text[i])) {
            if (/'|"/.test(text[i])) {
              let movethr = readString(i);
              style.value += movethr.marker + movethr.str + movethr.marker;
              i = movethr.end;
            } else style.value += text[i++];
          }
          style.value = style.value.trim().trimEnd();
          if (!text[i]) Errors.enc("CSS_OPEN_CURL_EXPECTED", src, i);
          style.loc.end = i;
          frame.styles.push(style);
          frame.notation[style.property] = style.value;
          while (text[i] === ";" || isSpaceCharac(text[i])) i++;
          if (text[i] !== "}") return readFrameStyles(frame, i);
          else return i + 1;
        }

        function readFrame() {
          while (isSpaceCharac(text[i])) i++;
          const frame = { mark: "", styles: [], notation: {} };
          while (text[i] && text[i] !== "{") frame.mark += text[i++];
          if (!text[i]) Errors.enc("CSS_OPEN_CURL_EXPECTED", src, i);
          frame.mark = frame.mark.trimEnd();
          i = readFrameStyles(frame, ++i);
          keyframeRule.frames.push(frame);
          while (isSpaceCharac(text[i])) i++;
          if (text[i] !== "}") readFrame();
        }

        readFrame();
        keyframeRule.loc.end = i;
        root.rules.push(keyframeRule);
        read(i + 1);
      }
      // @charset rules.
      function readCharsetRule(start: number, i: number) {
        while (isSpaceCharac(text[i])) i++;
      }
      let atRuleName = "";
      let start = i - 1;
      while (text[i] && /[a-zA-Z]|-|[0-9]/.test(text[i])) {
        atRuleName += text[i++];
      }
      switch (atRuleName) {
        case "import":
          readImportRule(start, i);
          break;
        case "font-face":
          readFontFaceRule(start, i);
          break;
        case "media":
          readMediaRule(start, i);
          break;
        case "supports":
          readSupportRule(start, i);
          break;
        case "keyframes":
          readKeyframeRule(start, i);
          break;
        case "charset":
          readCharsetRule(start, i);
          break;
        default:
          break;
      }
    }
    // Styles.
    function readStyleRule(i: number) {
      let start = i;
      // Read selectors.
      while (isSpaceCharac(text[i])) i++;
      var selectorsRaw: string = "";

      while (text[i] && text[i] !== "{") {
        if (/'|"/.test(text[i])) {
          let movethr = readString(i);
          selectorsRaw += movethr.marker + movethr.str + movethr.marker;
          i = movethr.end;
        } else selectorsRaw += text[i++];
      }
      if (!text[i]) Errors.enc("CSS_OPEN_CURL_EXPECTED", src, i);
      i++;
      const rule = new StyleRule();
      rule.loc.start = start;
      let selector = "";
      for (let x = 0; selectorsRaw[x]; x++) {
        if (/'|"/.test(selectorsRaw[x])) {
          let marker = selectorsRaw[x++];
          selector += marker;
          while (selectorsRaw[x] && selectorsRaw[x] !== marker) {
            if (selectorsRaw[x] === "\n") {
              Errors.enc("CSS_STRING_OR_URI_EXPECTED", src, i);
            } else if (
              selectorsRaw[x] === "\\" &&
              selectorsRaw[x + 1] === marker &&
              selectorsRaw[x - 1] !== "\\"
            ) {
              selector += selectorsRaw[(x += 2)] + marker;
            } else selector += selectorsRaw[x++];
          }
          selector += marker;
        } else if (selectorsRaw[x] === ",") {
          rule.selectors.push(selector.trim().trimEnd());
          selector = "";
        } else selector += selectorsRaw[x];
      }
      rule.selectors.push(selector.trim().trimEnd());
      // Read styles.
      function readStyles() {
        let start = i;
        let property: string = "",
          value: string = "";
        while (isSpaceCharac(text[i])) i++;
        if (text[i] === "}") return;
        while (text[i] && text[i] !== ":") property += text[i++];
        i++;
        while (text[i] && text[i] !== ";" && text[i] !== "}") {
          if (/'|"/.test(text[i])) {
            let strn = readString(i);
            value += strn.marker + strn.str + strn.marker;
            i = strn.end;
          } else value += text[i++];
        }
        const relation = new Style(
          property.trim().trimEnd(),
          value.trim().trimEnd()
        );
        relation.loc.start = start;
        relation.loc.end = i;
        rule.content.push(relation);
        rule.notation[relation.property] = relation.value;
        while (text[i] === ";" || isSpaceCharac(text[i])) i++;
        if (text[i] !== "}") readStyles();
      }
      readStyles();
      rule.loc.end = i;
      root.rules.push(rule);
      read(i + 1);
    }
    // Strip Comments.
    function removeComments() {
      let stripped: string = "";
      for (let i = 0; text[i]; i++) {
        if (text.slice(i, i + 2) === "/*") {
          i += 2;
          while (text[i] && text.slice(i, i + 2) !== "*/") i++;
          i++;
        } else stripped += text[i];
      }
      return stripped.trim().trimEnd();
    }
    text = removeComments();
    // Base.
    function read(i: number) {
      while (isSpaceCharac(text[i])) i++;
      if (text[i])
        if (text[i] === "@") readAtRule(i + 1);
        else if (/[a-z]|[A-Z]|:|#|.|\[/.test(text[i])) readStyleRule(i);
    }
    // Start.
    read(0);
    root.loc.end = text.length;
    return root;
  }
  return parserCore(src.toString());
}

export default parse;
