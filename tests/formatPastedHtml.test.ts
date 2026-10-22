import { describe, it, expect } from "vitest";
import formatPastedHtml from "../src/utils/formatPastedHtml";

describe("formatPastedHtml", () => {
    it("trims whitespace and removes empty paragraphs", () => {
        const html = "  <p>Test</p> <p> </p>  ";
        expect(formatPastedHtml(html)).toBe("<p>Test</p>");
    });

    it("removes soft hyphens", () => {
        expect(formatPastedHtml("Line\u00ADBreak")).toBe("LineBreak");
    });

    it("converts Word inline bold and italic to semantic tags", () => {
        const html = '<span style="font-weight: bold; font-style: italic;">Text</span>';
        expect(formatPastedHtml(html)).toBe("<strong><em>Text</em></strong>");
    });

    it("keeps headings as-is by default", () => {
        const html = "<h1>Title</h1><h2>Section</h2>";
        expect(formatPastedHtml(html)).toBe("<h1>Title</h1><h2>Section</h2>");
    });

    it("shifts headings down with headingOffset", () => {
        const html = "<h1>Title</h1><h2>Section</h2>";
        expect(formatPastedHtml(html, { headingOffset: 1 })).toBe(
            "<h2>Title</h2><h3>Section</h3>",
        );
    });

    it("clamps shifted headings at h6", () => {
        expect(formatPastedHtml("<h5>Small</h5>", { headingOffset: 3 })).toBe("<h6>Small</h6>");
    });

    it("converts unsupported headings (h7+) to paragraphs", () => {
        expect(formatPastedHtml("<h9>Huge</h9>")).toBe("<p>Huge</p>");
    });
});
