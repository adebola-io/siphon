import createDOMTree from "./createDOMTree";
import getDOMNodes from "./getDOMNodes";
import getNodeAttributes from "./getNodeAttributes";
import idSearch from "./idSearch";
import tagNameSearch from "./tagNameSearch";
declare const html: {
    createDOMTree: typeof createDOMTree;
    getDOMNodes: typeof getDOMNodes;
    getNodeAttributes: typeof getNodeAttributes;
    idSearch: typeof idSearch;
    tagNameSearch: typeof tagNameSearch;
};
export default html;
