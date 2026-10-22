/**
 * Options for formatPastedHtml.
 */
export type FormatPastedHtmlOptions = {
    /**
     * Demote every heading in the pasted content by this many levels
     * (capped at h6). Defaults to 0 (preserve original heading levels).
     */
    headingOffset?: number;
};

const BLOCK_TAGS = new Set([
    "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
    "blockquote", "pre", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
    "section", "article", "aside", "header", "footer", "figure", "figcaption",
    "main", "nav", "dl", "dt", "dd", "hr",
]);

function isBlockElement(node: Node | null | undefined): boolean {
    return (
        (node?.nodeType ?? 0) === Node.ELEMENT_NODE &&
        BLOCK_TAGS.has((node as Element).tagName.toLowerCase())
    );
}

/**
 * Collapse runs of whitespace inside text nodes and trim whitespace that sits
 * next to block-level boundaries.
 */
function collapseWhitespace(html: string): string {
    if (typeof DOMParser === "undefined") {
        return html.replace(/ {2,}/g, " ");
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes: Text[] = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let current: Node | null;
    while ((current = walker.nextNode())) {
        const text = current as Text;
        if (text.textContent) {
            text.textContent = text.textContent.replace(/\s+/g, " ");
        }
        nodes.push(text);
    }
    for (const text of nodes) {
        /* v8 ignore next -- @preserve: collected nodes always have content; the empty-content guard is defensive */
        if (!text.textContent) continue;
        const prev = text.previousSibling;
        const next = text.nextSibling;
        const parentIsBlock = isBlockElement(text.parentNode);
        const atStart = isBlockElement(prev) || (prev === null && parentIsBlock);
        const atEnd = isBlockElement(next) || (next === null && parentIsBlock);
        let value = text.textContent;
        if (atStart) value = value.replace(/^ /, "");
        if (atEnd) value = value.replace(/ $/, "");
        if (value === "") {
            text.parentNode?.removeChild(text);
        } else if (value !== text.textContent) {
            text.textContent = value;
        }
    }
    return doc.body.innerHTML;
}

type Marks = { bold: boolean; italic: boolean; underline: boolean; strike: boolean };

function marksFromStyle(style: string): Marks {
    return {
        // Word Online uses either keyword `bold` or numeric weights 700-900.
        bold: /font-weight:\s*(bold|[7-9]\d{2})/i.test(style),
        italic: /font-style:\s*italic/i.test(style),
        // text-decoration can carry multiple values (e.g. "underline line-through"),
        // so look for the keyword anywhere in the declaration.
        underline: /text-decoration:[^;"]*\bunderline\b/i.test(style),
        strike: /text-decoration:[^;"]*\bline-through\b/i.test(style),
    };
}

function wrapWithMarks(span: Element, marks: Marks): Node {
    const doc = span.ownerDocument;
    const fragment = doc.createDocumentFragment();
    while (span.firstChild) fragment.appendChild(span.firstChild);
    let result: Node = fragment;
    const wrap = (node: Node, tag: string) => {
        const el = doc.createElement(tag);
        el.appendChild(node);
        return el;
    };
    if (marks.strike) result = wrap(result, "s");
    if (marks.underline) result = wrap(result, "u");
    if (marks.italic) result = wrap(result, "em");
    if (marks.bold) result = wrap(result, "strong");
    return result;
}

function convertSpans(root: Element): void {
    const spans = Array.from(root.querySelectorAll("span")).reverse();
    for (const span of spans) {
        const marks = marksFromStyle(span.getAttribute("style") ?? "");
        const replacement = wrapWithMarks(span, marks);
        span.parentNode?.replaceChild(replacement, span);
    }
}

const KEPT_STYLE_PROPS = new Set(["font-weight", "font-style", "text-decoration"]);

function stripWordArtifacts(root: Element): void {
    const all = root.querySelectorAll("*");
    for (const el of Array.from(all)) {
        const cls = el.getAttribute("class");
        if (cls && /\bMso[\w-]*/.test(cls)) {
            const cleaned = cls.replace(/\bMso[\w-]*/g, "").trim();
            if (cleaned) el.setAttribute("class", cleaned);
            else el.removeAttribute("class");
        }
        const style = el.getAttribute("style");
        if (style == null) continue;
        if (/mso-/i.test(style)) {
            el.removeAttribute("style");
            continue;
        }
        const kept = style
            .split(";")
            .map((d) => d.trim())
            .filter((d) => {
                if (!d) return false;
                const prop = d.split(":")[0].trim().toLowerCase();
                return KEPT_STYLE_PROPS.has(prop);
            });
        if (kept.length === 0) el.removeAttribute("style");
        else el.setAttribute("style", kept.join("; "));
    }
}

/** Regex fallback used when DOMParser is unavailable. */
function convertWithRegex(html: string): string {
    html = html.replace(
        /<span[^>]*style="[^"]*font-weight:\s*(bold|[7-9]\d{2})[^"]*"[^>]*>(.*?)<\/span>/gi,
        (match, _w, content) =>
            /font-style:\s*italic/i.test(match)
                ? `<strong><em>${content}</em></strong>`
                : `<strong>${content}</strong>`,
    );
    html = html.replace(
        /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/span>/gi,
        (_m, content) => `<em>${content}</em>`,
    );
    html = html.replace(
        /<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi,
        "<u>$1</u>",
    );
    html = html.replace(
        /<span[^>]*style="[^"]*text-decoration:\s*line-through[^"]*"[^>]*>(.*?)<\/span>/gi,
        "<s>$1</s>",
    );
    html = html.replace(/<span[^>]*>(.*?)<\/span>/gi, "$1");
    html = html.replace(/\s*class="Mso[^"]*"/gi, "");
    html = html.replace(/\s*style="[^"]*mso-[^"]*"/gi, "");
    html = html.replace(/\s*style="[^"]*"/gi, (m) =>
        /font-weight|font-style|text-decoration/i.test(m) ? m : "",
    );
    return html;
}

function sanitizeWordHtml(html: string): string {
    if (typeof DOMParser === "undefined") {
        return convertWithRegex(html);
    }
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    convertSpans(doc.body);
    stripWordArtifacts(doc.body);
    return doc.body.innerHTML;
}

/**
 * Format pasted/uploaded HTML for the editor:
 *   - remove images (the editor has no image support; uploaded `.docx` files in
 *     particular embed images as large base64 `<img>` tags we never want)
 *   - strip editor-injected line breaks and soft hyphens
 *   - convert Word Online style-based formatting to semantic tags
 *   - collapse whitespace inside text nodes so line-wrapped source
 *     HTML doesn't introduce visible double-spaces
 *   - optionally demote headings by `headingOffset`
 *
 * The original heading structure is preserved unless a non-zero
 * `headingOffset` is supplied.
 */
export default function formatPastedHtml(
    html: string,
    options: FormatPastedHtmlOptions = {},
): string {
    const offset = Math.max(0, Math.floor(options.headingOffset ?? 0));

    html = html
        .trim()
        .replace(/<img\b[^>]*>/gi, "")
        .replace(/<\/img>/gi, "")
        .replace(/[\r\n\u2028\u2029]+/g, " ")
        .replace(/\u00ad/g, "")
        .replace(
            /<p(\b[^>]*)>(?:\s|&nbsp;|\u00a0)*(?:&nbsp;|\u00a0)(?:\s|&nbsp;|\u00a0)*<\/p>/gi,
            "<p$1><br></p>",
        )
        .replace(/<p\b[^>]*>[ \t\r\n]*<\/p>/gi, "")
        .replace(/&nbsp;/g, " ")
        .replace(/^\s+|\s+$/g, "");

    html = sanitizeWordHtml(html);
    html = collapseWhitespace(html);

    if (offset > 0) {
        html = html
            .replace(
                /<h([1-6])([^>]*)>/gi,
                (_, level, attrs) =>
                    `<h${Math.min(parseInt(level, 10) + offset, 6)}${attrs}>`,
            )
            .replace(
                /<\/h([1-6])>/gi,
                (_, level) => `</h${Math.min(parseInt(level, 10) + offset, 6)}>`,
            );
    }

    return html
        .replace(/<h([7-9]|\d{2,})([^>]*)>/gi, "<p$2>")
        .replace(/<\/h([7-9]|\d{2,})>/gi, "</p>")
        .trim();
}
