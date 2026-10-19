import parseEditorHtml, { type Block, type InlineRun, type ListBlock } from "./parseEditorHtml";

/**
 * Build a valid `.odt` (OpenDocument Text) file from editor HTML. Preserves
 * headings (1–6, each bound to a `Heading_20_N` paragraph style with bold +
 * descending font size so LibreOffice / Word / Google Docs render the visual
 * hierarchy, not just the outline level), bold / italic / strike / underline
 * inline marks, hyperlinks, and bullet + numbered lists (with nested
 * sublists — each sublist is emitted as a `<text:list>` inside the parent
 * `<text:list-item>`, and the list-style declares per-level numbering / bullet
 * glyphs). Used for both `.odt` and `.odf` exports — only the extension differs.
 *
 * Anything beyond that (blockquotes, code, images, tables, …) is
 * flattened to text only — see `parseEditorHtml` for the supported set.
 *
 * Lazy-loads `jszip` so the dependency only ships when an odt/odf export is
 * actually triggered.
 *
 * @param html - HTML, typically from `editor.getHTML()`. Plain text without
 *   tags is treated as a single paragraph.
 */

const ORDERED_FORMATS = ["1", "a", "i"];
const BULLET_CHARS = ["•", "◦", "▪"];
// ODF supports up to 10 list levels.
const MAX_LEVELS = 9;
// Heading font sizes in pt, H1 → H6.
const HEADING_SIZES = [24, 18, 14, 12, 11, 10];

function escapeXml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
    return escapeXml(s).replace(/"/g, "&quot;");
}

function runXml(run: InlineRun): string {
    if (run.lineBreak) return "<text:line-break/>";
    let out = escapeXml(run.text);
    if (run.strike) out = `<text:span text:style-name="Strike">${out}</text:span>`;
    if (run.underline) out = `<text:span text:style-name="Underline">${out}</text:span>`;
    if (run.italic) out = `<text:span text:style-name="Italic">${out}</text:span>`;
    if (run.bold) out = `<text:span text:style-name="Bold">${out}</text:span>`;
    if (run.link) {
        out = `<text:a xlink:type="simple" xlink:href="${escapeAttr(run.link)}">${out}</text:a>`;
    }
    return out;
}

function runsXml(runs: InlineRun[]): string {
    return runs.map(runXml).join("");
}

function listXml(list: ListBlock): string {
    if (list.items.length === 0) return "";
    const style = list.ordered ? "Numbered_20_List" : "Bullet_20_List";
    const items = list.items
        .map((item) => {
            const para = `<text:p text:style-name="Text_20_Body">${runsXml(item.runs)}</text:p>`;
            const nested = (item.children ?? []).map(listXml).join("");
            return `<text:list-item>${para}${nested}</text:list-item>`;
        })
        .join("");
    return `<text:list text:style-name="${style}">${items}</text:list>`;
}

function blockXml(block: Block): string {
    switch (block.kind) {
        case "paragraph":
            return `<text:p text:style-name="Text_20_Body">${runsXml(block.runs)}</text:p>`;
        case "heading":
            return `<text:h text:style-name="Heading_20_${block.level}" text:outline-level="${block.level}">${runsXml(block.runs)}</text:h>`;
        case "list":
            return listXml(block);
    }
}

function numberLevel(level: number): string {
    const fmt = ORDERED_FORMATS[level % ORDERED_FORMATS.length];
    const space = (level + 1) * 0.5;
    return `<text:list-level-style-number text:level="${level + 1}" style:num-format="${fmt}" text:start-value="1"><style:list-level-properties text:space-before="${space}cm" text:min-label-width="0.5cm"/></text:list-level-style-number>`;
}

function bulletLevel(level: number): string {
    const ch = BULLET_CHARS[level % BULLET_CHARS.length];
    const space = (level + 1) * 0.5;
    return `<text:list-level-style-bullet text:level="${level + 1}" text:bullet-char="${ch}"><style:list-level-properties text:space-before="${space}cm" text:min-label-width="0.5cm"/></text:list-level-style-bullet>`;
}

const NUMBER_LEVELS = Array.from({ length: MAX_LEVELS }, (_, i) => numberLevel(i)).join("");
const BULLET_LEVELS = Array.from({ length: MAX_LEVELS }, (_, i) => bulletLevel(i)).join("");

function headingStyle(level: number): string {
    const size = HEADING_SIZES[level - 1];
    return `<style:style style:name="Heading_20_${level}" style:display-name="Heading ${level}" style:family="paragraph" style:parent-style-name="Text_20_Body" style:next-style-name="Text_20_Body" style:class="text">
      <style:paragraph-properties fo:margin-top="0.247cm" fo:margin-bottom="0.106cm" fo:keep-with-next="always"/>
      <style:text-properties fo:font-size="${size}pt" fo:font-weight="bold"/>
    </style:style>`;
}

const HEADING_STYLES = [1, 2, 3, 4, 5, 6].map(headingStyle).join("\n    ");

export default async function buildOdt(html: string): Promise<Blob> {
    let JSZip: typeof import("jszip");
    try {
        const mod = await import("jszip");
        /* v8 ignore next -- @preserve: ESM/CJS interop; the `?? mod` arm only runs for a build that lacks a default export */
        JSZip = (mod.default ?? mod) as typeof import("jszip");
    } catch {
        throw new Error(
            'The "jszip" package is required to build .odt/.odf files. Install it with: npm install jszip',
        );
    }

    const body = parseEditorHtml(html).map(blockXml).join("\n      ");

    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Strike" style:family="text">
      <style:text-properties style:text-line-through-style="solid"/>
    </style:style>
    <style:style style:name="Underline" style:family="text">
      <style:text-properties style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
    <style:style style:name="Text_20_Body" style:display-name="Text Body" style:family="paragraph" style:class="text">
      <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.212cm"/>
    </style:style>
    ${HEADING_STYLES}
    <text:list-style style:name="Numbered_20_List">${NUMBER_LEVELS}</text:list-style>
    <text:list-style style:name="Bullet_20_List">${BULLET_LEVELS}</text:list-style>
  </office:automatic-styles>
  <office:body>
    <office:text>
      ${body || "<text:p/>"}
    </office:text>
  </office:body>
</office:document-content>`;

    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

    const zip = new JSZip();
    // The mimetype entry must be first and uncompressed per the ODF spec.
    zip.file("mimetype", "application/vnd.oasis.opendocument.text", {
        compression: "STORE",
    });
    zip.file("META-INF/manifest.xml", manifestXml);
    zip.file("content.xml", contentXml);

    return zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.oasis.opendocument.text",
    });
}
