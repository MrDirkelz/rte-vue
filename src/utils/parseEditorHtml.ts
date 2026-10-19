/**
 * Convert editor HTML into a simple block AST that the `.docx` and `.odt`/`.odf`
 * builders can consume independently. Keeping this in one place means both
 * builders share the same idea of what a paragraph / heading / list looks like.
 *
 * Recognised structure (matches TipTap StarterKit's output):
 *   - <p>, <h1>–<h6>, <ul>, <ol>, <li> (TipTap wraps <li> content in <p>)
 *   - inline marks <strong>/<b>, <em>/<i>, <s>/<del>/<strike>, <u>/<ins>, <a href>
 *   - <br> as a line break inside a paragraph / heading / list item
 *   - nested <ul>/<ol> inside an <li> — captured as the item's `children`
 *     so docx (via `<w:ilvl>`) and odt (via nested `<text:list>`) keep
 *     indentation and per-level numbering
 *
 * Anything else (code, blockquote, images, tables) — text content is
 * preserved, marks are dropped. Extending coverage means adding a new `Block`
 * variant or a new inline-tag case below; both builders pick it up via the AST.
 */

export type InlineRun = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    strike?: boolean;
    underline?: boolean;
    /** Hyperlink target. When set, the run is a clickable link to this URL. */
    link?: string;
    /** True for `<br>` — `text` is empty in this case. */
    lineBreak?: boolean;
};

/** A single `<li>`. `runs` is the item's own text; `children` is the (zero or
 *  more) nested lists inside this item, each rendered one indent level deeper
 *  by the builders. HTML allows multiple sibling sublists in one item, so
 *  `children` is an array — most items leave it `undefined`. */
export type ListItem = {
    runs: InlineRun[];
    children?: ListBlock[];
};

export type ListBlock = {
    kind: "list";
    /** True for `<ol>`. Nested lists carry their own `ordered` on the child
     *  ListBlock, so an ordered list can contain unordered children and vice
     *  versa — both builders honor the per-level kind. */
    ordered: boolean;
    items: ListItem[];
};

export type Block =
    | { kind: "paragraph"; runs: InlineRun[] }
    | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; runs: InlineRun[] }
    | ListBlock;

type Marks = Omit<InlineRun, "text" | "lineBreak">;

function inlineFromNode(node: Node, marks: Marks): InlineRun[] {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        return text ? [{ text, ...marks }] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as Element;
    switch (el.tagName.toLowerCase()) {
        case "br":
            return [{ text: "", lineBreak: true }];
        case "strong":
        case "b":
            return inlineFromChildren(el, { ...marks, bold: true });
        case "em":
        case "i":
            return inlineFromChildren(el, { ...marks, italic: true });
        case "s":
        case "del":
        case "strike":
            return inlineFromChildren(el, { ...marks, strike: true });
        case "u":
        case "ins":
            return inlineFromChildren(el, { ...marks, underline: true });
        case "a": {
            const href = el.getAttribute("href") ?? "";
            return inlineFromChildren(el, href ? { ...marks, link: href } : marks);
        }
        case "p":
            // TipTap wraps <li> content in <p>; treat as transparent for inline purposes.
            return inlineFromChildren(el, marks);
        default:
            return inlineFromChildren(el, marks);
    }
}

function inlineFromChildren(el: Element, marks: Marks): InlineRun[] {
    const runs: InlineRun[] = [];
    for (const child of Array.from(el.childNodes)) {
        runs.push(...inlineFromNode(child, marks));
    }
    return runs;
}

function listItemFromLi(li: Element): ListItem {
    const runs: InlineRun[] = [];
    const children: ListBlock[] = [];
    for (const child of Array.from(li.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent ?? "";
            if (!text.trim()) continue;
            runs.push({ text });
            continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === "ul" || tag === "ol") {
            children.push(listFromElement(el));
            continue;
        }
        runs.push(...inlineFromNode(el, {}));
    }
    return children.length > 0 ? { runs, children } : { runs };
}

function listFromElement(el: Element): ListBlock {
    const items = Array.from(el.children)
        .filter((c) => c.tagName.toLowerCase() === "li")
        .map(listItemFromLi);
    return {
        kind: "list",
        ordered: el.tagName.toLowerCase() === "ol",
        items,
    };
}

function blocksFromNodes(nodes: Node[]): Block[] {
    const blocks: Block[] = [];
    let pendingInline: InlineRun[] | null = null;
    const flush = () => {
        if (pendingInline) {
            blocks.push({ kind: "paragraph", runs: pendingInline });
            pendingInline = null;
        }
    };
    for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent ?? "";
            if (!text.trim()) continue;
            if (!pendingInline) pendingInline = [];
            pendingInline.push({ text });
            continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        flush();
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
            const level = parseInt(tag.slice(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
            blocks.push({ kind: "heading", level, runs: inlineFromChildren(el, {}) });
            continue;
        }
        switch (tag) {
            case "p":
                blocks.push({ kind: "paragraph", runs: inlineFromChildren(el, {}) });
                break;
            case "ul":
            case "ol":
                blocks.push(listFromElement(el));
                break;
            default:
                blocks.push({ kind: "paragraph", runs: inlineFromChildren(el, {}) });
                break;
        }
    }
    flush();
    return blocks;
}

/**
 * Parse editor HTML into the intermediate Block AST.
 *
 * @param html - HTML string, typically from `editor.getHTML()`
 * @returns Array of Block entries in document order
 */
export default function parseEditorHtml(html: string): Block[] {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    return blocksFromNodes(Array.from(doc.body.childNodes));
}
