export const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Makes sure the root <svg> of serialized markup declares the SVG namespace
 * exactly once. A standalone SVG file needs the declaration, and Firefox's
 * XMLSerializer can write it twice (when the element also carries it as an
 * attribute), which makes the file invalid and the picture fail to load.
 */
export function withSingleSvgNamespace(markup: string): string {
  const end = markup.indexOf(">");
  if (!markup.startsWith("<svg") || end < 0) return markup;
  const rootTag = markup.slice(0, end).replace(/\sxmlns="[^"]*"/g, "");
  return `${rootTag.replace(/^<svg/, `<svg xmlns="${SVG_NS}"`)}${markup.slice(end)}`;
}
