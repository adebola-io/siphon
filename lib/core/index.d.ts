import bundler from "./bundler";
import Resolver from "./resolver";
import Generator from "./generator";
declare const core: {
    bundler: typeof bundler;
    minifier: {
        minifyCSS: typeof import("./minifier/minifyCSS").default;
    };
    formatter: {
        formatCSS: typeof import("./formatter/formatCSS").default;
    };
    parser: {
        css: {
            textify: typeof import("./parser/css/textify").default;
        };
        html: {
            createDOMTree: typeof import("./parser/html/createDOMTree").default;
            getDOMNodes: typeof import("./parser/html/getDOMNodes").default;
            getNodeAttributes: typeof import("./parser/html/getNodeAttributes").default;
            idSearch: typeof import("./parser/html/idSearch").default;
            tagNameSearch: typeof import("./parser/html/tagNameSearch").default;
        };
    };
    Generator: typeof Generator;
    Resolver: typeof Resolver;
};
export default core;
