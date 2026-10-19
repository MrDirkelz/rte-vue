import parseEditorHtml, { type Block, type InlineRun, type ListBlock } from "./parseEditorHtml";

/**
 * Build a valid `.docx` file from editor HTML. Preserves headings (1–6),
 * bold / italic / strike / underline inline marks, hyperlinks, and bullet +
 * numbered lists (with nested sublists — each item rides at its own ilvl,
 * using Word's default per-level numbering / bullet glyphs).
 *
 * Anything beyond that (blockquotes, code, images, tables, …) is
 * flattened to text only — see `parseEditorHtml` for the supported set.
 *
 * Lazy-loads `jszip` so the dependency only ships when a docx export is
 * actually triggered.
 *
 * @param html - HTML, typically from `editor.getHTML()`. Plain text without
 *   tags is treated as a single paragraph; if you need one paragraph per line,
 *   wrap each line in `<p>...</p>` before calling.
 */

// Word's default per-level numbering cycle for ordered lists, and bullet glyphs
// for unordered lists. Level N uses entry N % length.
const ORDERED_FORMATS = ["decimal", "lowerLetter", "lowerRoman"];
const BULLET_CHARS = ["•", "◦", "▪"];
// 720 twips = 0.5 inch per indent level.
const INDENT_TWIPS = 720;
// Word supports up to 9 list levels.
const MAX_LEVELS = 9;

function escapeXml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
    return escapeXml(s).replace(/"/g, "&quot;");
}

/** Register every hyperlink target found in a block, assigning relationship ids. */
function collectLinks(block: Block, links: Map<string, string>): void {
    const fromRuns = (runs: InlineRun[]) => {
        for (const run of runs) {
            if (run.link && !links.has(run.link)) {
                // rId1-3 are reserved for document / styles / numbering.
                links.set(run.link, `rId${links.size + 4}`);
            }
        }
    };
    const fromList = (list: ListBlock) => {
        for (const item of list.items) {
            fromRuns(item.runs);
            if (item.children) for (const child of item.children) fromList(child);
        }
    };
    switch (block.kind) {
        case "paragraph":
        case "heading":
            fromRuns(block.runs);
            break;
        case "list":
            fromList(block);
            break;
    }
}

function runXml(run: InlineRun): string {
    if (run.lineBreak) return "<w:r><w:br/></w:r>";
    const props: string[] = [];
    if (run.link) props.push('<w:rStyle w:val="Hyperlink"/>');
    if (run.bold) props.push("<w:b/>");
    if (run.italic) props.push("<w:i/>");
    if (run.strike) props.push("<w:strike/>");
    if (run.underline) props.push('<w:u w:val="single"/>');
    const rPr = props.length ? `<w:rPr>${props.join("")}</w:rPr>` : "";
    return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(run.text)}</w:t></w:r>`;
}

function runOrLinkXml(run: InlineRun, links: Map<string, string>): string {
    const inner = runXml(run);
    if (!run.link) return inner;
    const id = links.get(run.link);
    /* v8 ignore next -- @preserve: collectLinks registers every href, so `id` is always defined here; the `: r` arm is defensive */
    return id ? `<w:hyperlink r:id="${id}">${inner}</w:hyperlink>` : inner;
}

function paragraphXml(
    runs: InlineRun[],
    links: Map<string, string>,
    styleId?: string,
    num?: { numId: number; ilvl: number },
): string {
    const pPr: string[] = [];
    if (styleId) pPr.push(`<w:pStyle w:val="${styleId}"/>`);
    if (num) {
        pPr.push(`<w:numPr><w:ilvl w:val="${num.ilvl}"/><w:numId w:val="${num.numId}"/></w:numPr>`);
    }
    const pPrXml = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
    return `<w:p>${pPrXml}${runs.map((r) => runOrLinkXml(r, links)).join("")}</w:p>`;
}

function listXml(
    list: ListBlock,
    links: Map<string, string>,
    ilvl: number,
    allocNumId: (ordered: boolean) => number,
): string {
    const numId = allocNumId(list.ordered);
    return list.items
        .map((item) => {
            const own = paragraphXml(item.runs, links, undefined, { numId, ilvl });
            const nested = (item.children ?? [])
                .map((child) => listXml(child, links, ilvl + 1, allocNumId))
                .join("");
            return own + nested;
        })
        .join("");
}

function blockXml(
    block: Block,
    links: Map<string, string>,
    allocNumId: (ordered: boolean) => number,
): string {
    switch (block.kind) {
        case "paragraph":
            return paragraphXml(block.runs, links);
        case "heading":
            return paragraphXml(block.runs, links, `Heading${block.level}`);
        case "list":
            return listXml(block, links, 0, allocNumId);
    }
}

function orderedLevel(level: number): string {
    const fmt = ORDERED_FORMATS[level % ORDERED_FORMATS.length];
    const left = (level + 1) * INDENT_TWIPS;
    return `<w:lvl w:ilvl="${level}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="%${level + 1}."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${left}" w:hanging="360"/></w:pPr></w:lvl>`;
}

function bulletLevel(level: number): string {
    const ch = BULLET_CHARS[level % BULLET_CHARS.length];
    const left = (level + 1) * INDENT_TWIPS;
    return `<w:lvl w:ilvl="${level}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${ch}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${left}" w:hanging="360"/></w:pPr></w:lvl>`;
}

const ORDERED_LEVELS = Array.from({ length: MAX_LEVELS }, (_, i) => orderedLevel(i)).join("");
const BULLET_LEVELS = Array.from({ length: MAX_LEVELS }, (_, i) => bulletLevel(i)).join("");

function numberingXml(nums: { abstractId: number }[]): string {
    const numEntries = nums
        .map((n, i) => `<w:num w:numId="${i + 1}"><w:abstractNumId w:val="${n.abstractId}"/></w:num>`)
        .join("\n  ");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">${ORDERED_LEVELS}</w:abstractNum>
  <w:abstractNum w:abstractNumId="1">${BULLET_LEVELS}</w:abstractNum>
  ${numEntries}
</w:numbering>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="60"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="2F5496"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="200" w:after="60"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="2F5496"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="160" w:after="60"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="1F3763"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading4">
    <w:name w:val="heading 4"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="120" w:after="40"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="2F5496"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading5">
    <w:name w:val="heading 5"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="120" w:after="40"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="2F5496"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading6">
    <w:name w:val="heading 6"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="120" w:after="40"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="1F3763"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="character" w:styleId="Hyperlink">
    <w:name w:val="Hyperlink"/>
    <w:uiPriority w:val="99"/>
    <w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>
  </w:style>
</w:styles>`;

export default async function buildDocx(html: string): Promise<Blob> {
    let JSZip: typeof import("jszip");
    try {
        const mod = await import("jszip");
        /* v8 ignore next -- @preserve: ESM/CJS interop; the `?? mod` arm only runs for a build that lacks a default export */
        JSZip = (mod.default ?? mod) as typeof import("jszip");
    } catch {
        throw new Error(
            'The "jszip" package is required to build .docx files. Install it with: npm install jszip',
        );
    }

    const blocks = parseEditorHtml(html);

    const links = new Map<string, string>();
    for (const block of blocks) collectLinks(block, links);

    const nums: { abstractId: number }[] = [];
    const allocNumId = (ordered: boolean): number => {
        nums.push({ abstractId: ordered ? 0 : 1 });
        return nums.length;
    };

    const body = blocks.map((b) => blockXml(b, links, allocNumId)).join("\n    ");

    const linkRels = Array.from(links.entries())
        .map(
            ([url, id]) =>
                `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeAttr(url)}" TargetMode="External"/>`,
        )
        .join("\n  ");

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body || "<w:p/>"}
    <w:sectPr/>
  </w:body>
</w:document>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;

    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  ${linkRels}
</Relationships>`;

    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rootRels);
    zip.file("word/document.xml", documentXml);
    zip.file("word/_rels/document.xml.rels", docRels);
    zip.file("word/styles.xml", STYLES_XML);
    zip.file("word/numbering.xml", numberingXml(nums));

    return zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
}
