declare const parser: {
    css: {
        textify: typeof import("./css/textify").default;
    };
    html: {
        createDOMTree: typeof import("./html/createDOMTree").default;
        getDOMNodes: typeof import("./html/getDOMNodes").default;
        getNodeAttributes: typeof import("./html/getNodeAttributes").default;
        idSearch: typeof import("./html/idSearch").default;
        tagNameSearch: typeof import("./html/tagNameSearch").default;
    };
};
export default parser;
