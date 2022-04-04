import { HTMLDocumentNode, siphonOptions } from "../../types";
declare class Generator {
    /**
     * Takes in a set of nodes and returns their original HTML format.
     * @param nodes The tree(s) of nodes generated from the original HTML.
     * @returns A stringified text representing the original HTML content.
     */
    generate(nodes: HTMLDocumentNode[] | undefined, options: siphonOptions, spacers?: string): string;
}
export default Generator;
