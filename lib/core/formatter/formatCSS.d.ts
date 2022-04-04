/**
 * Formats CSS text.
 * @param srcText Source CSS text.
 * @param spacers The parent indent.
 * @param tab The specified indenting width.
 * @returns Formatted CSS text.
 */
declare function formatCSS(srcText: string, spacers?: string, tab?: string, isExternalSheet?: boolean): string;
export default formatCSS;
