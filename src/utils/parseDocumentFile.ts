/**
 * Parses document files (.docx, .odt, .odf, .txt) into HTML content.
 *
 * Uses dynamic imports for mammoth (docx) and jszip (odt/odf) to keep
 * the main bundle lightweight — these are only loaded when needed.
 */

const SUPPORTED_EXTENSIONS = [".docx", ".odt", ".odf", ".txt"] as const;
type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

function getExtension(filename: string): string {
    const idx = filename.lastIndexOf(".");
    return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

/** Parse a plain text file into HTML paragraphs */
async function parseTxt(file: File): Promise<string> {
    const text = await file.text();
    if (!text.trim()) return "";
    const paragraphs = text.split(/\n\n+/);
    return paragraphs
        .map((p) => {
            const lines = p
                .split(/\n/)
                .map((l) => l.trimEnd())
                .join("<br>");
            return `<p>${lines}</p>`;
        })
        .join("");
}

/** Parse a .docx file into HTML using mammoth */
async function parseDocx(file: File): Promise<string> {
    let mammoth: any;
    try {
        const mod = await import("mammoth");
        mammoth = mod.default ?? mod;
    } catch {
        throw new Error(
            'The "mammoth" package is required to parse .docx files. Install it with: npm install mammoth',
        );
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
}

/** Parse an ODF (.odt/.odf) file into HTML using jszip + DOMParser */
async function parseOdt(file: File): Promise<string> {
    let jszip: any;
    try {
        const mod = await import("jszip");
        jszip = mod.default ?? mod;
    } catch {
        throw new Error(
            'The "jszip" package is required to parse .odt/.odf files. Install it with: npm install jszip',
        );
    }
    const arrayBuffer = await file.arrayBuffer();
    const zip = await jszip.loadAsync(arrayBuffer);
    const contentXml = await zip.file("content.xml")?.async("string");
    if (!contentXml) {
        throw new Error("Invalid ODT/ODF file: content.xml not found");
    }
    return convertOdfToHtml(contentXml);
}

const ODF_NS_OFFICE = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";
const ODF_NS_TEXT = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
const XLINK_NS = "http://www.w3.org/1999/xlink";

/** Convert ODF content.xml to basic HTML */
function convertOdfToHtml(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const body = doc.getElementsByTagNameNS(ODF_NS_OFFICE, "body")[0];
    if (!body) return "";
    const textBody = body.getElementsByTagNameNS(ODF_NS_OFFICE, "text")[0];
    if (!textBody) return "";
    return processOdfNodes(textBody.childNodes);
}

/** Recursively convert ODF XML nodes to HTML */
function processOdfNodes(nodes: NodeListOf<ChildNode>): string {
    let html = "";
    for (const node of Array.from(nodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
            html += node.textContent || "";
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            switch (el.localName) {
                case "p":
                    html += `<p>${processOdfNodes(el.childNodes)}</p>`;
                    break;
                case "h": {
                    const level =
                        el.getAttributeNS(ODF_NS_TEXT, "outline-level") || "1";
                    const h = Math.min(parseInt(level, 10) || 1, 6);
                    html += `<h${h}>${processOdfNodes(el.childNodes)}</h${h}>`;
                    break;
                }
                case "span":
                    html += processOdfNodes(el.childNodes);
                    break;
                case "list":
                    html += `<ul>${processOdfNodes(el.childNodes)}</ul>`;
                    break;
                case "list-item":
                    html += `<li>${processOdfNodes(el.childNodes)}</li>`;
                    break;
                case "a": {
                    const href = el.getAttributeNS(XLINK_NS, "href") || "";
                    html += `<a href="${href}">${processOdfNodes(el.childNodes)}</a>`;
                    break;
                }
                case "line-break":
                    html += "<br>";
                    break;
                case "tab":
                    html += "    ";
                    break;
                case "s": {
                    const count = parseInt(
                        el.getAttributeNS(ODF_NS_TEXT, "c") || "1",
                        10,
                    );
                    html += " ".repeat(count);
                    break;
                }
                default:
                    html += processOdfNodes(el.childNodes);
                    break;
            }
        }
    }
    return html;
}

/**
 * Parse a document file into HTML content.
 *
 * @param file - A File object from a file input or drag-and-drop event
 * @returns A promise resolving to the HTML string representation of the file content
 * @throws Error if the file type is unsupported or a required dependency is missing
 *
 * @example
 * ```ts
 * const html = await parseDocumentFile(file);
 * ```
 */
export default async function parseDocumentFile(file: File): Promise<string> {
    const ext = getExtension(file.name) as SupportedExtension;
    switch (ext) {
        case ".txt":
            return parseTxt(file);
        case ".docx":
            return parseDocx(file);
        case ".odt":
        case ".odf":
            return parseOdt(file);
        default:
            throw new Error(
                `Unsupported file type: "${ext}". Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}`,
            );
    }
}

export { SUPPORTED_EXTENSIONS };
