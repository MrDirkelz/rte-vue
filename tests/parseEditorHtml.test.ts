import { describe, it, expect } from "vitest";
import parseEditorHtml from "../src/utils/parseEditorHtml";

describe("parseEditorHtml", () => {
    it("parses paragraphs with marks and links", () => {
        const blocks = parseEditorHtml(
            '<p><strong>b</strong><em>i</em><s>s</s><u>u</u><a href="https://x.y">l</a></p>',
        );
        expect(blocks).toHaveLength(1);
        const runs = (blocks[0] as any).runs;
        expect(runs.map((r: any) => r.text)).toEqual(["b", "i", "s", "u", "l"]);
        expect(runs[0].bold).toBe(true);
        expect(runs[1].italic).toBe(true);
        expect(runs[2].strike).toBe(true);
        expect(runs[3].underline).toBe(true);
        expect(runs[4].link).toBe("https://x.y");
    });

    it("parses headings and line breaks", () => {
        const blocks = parseEditorHtml("<h2>T</h2><p>a<br>b</p>");
        expect(blocks[0]).toMatchObject({ kind: "heading", level: 2 });
        const runs = (blocks[1] as any).runs;
        expect(runs.some((r: any) => r.lineBreak)).toBe(true);
    });

    it("parses nested lists", () => {
        const blocks = parseEditorHtml(
            "<ol><li><p>one</p><ul><li><p>sub</p></li></ul></li><li><p>two</p></li></ol>",
        );
        const list = blocks[0] as any;
        expect(list.kind).toBe("list");
        expect(list.ordered).toBe(true);
        expect(list.items).toHaveLength(2);
        expect(list.items[0].children[0].ordered).toBe(false);
        expect(list.items[0].children[0].items[0].runs[0].text).toBe("sub");
    });

    it("returns no blocks for empty input and keeps text of unknown elements", () => {
        expect(parseEditorHtml("")).toEqual([]);
        const blocks = parseEditorHtml("<blockquote>quoted</blockquote>");
        expect(JSON.stringify(blocks)).toContain("quoted");
    });
});
