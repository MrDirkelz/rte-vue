import { describe, it, expect } from "vitest";
import formatPastedHtml from "../src/utils/formatPastedHtml";

describe("formatPastedHtml", () => {
    it("trims whitespace and removes empty paragraphs", () => {
        const html = "  <p>Test</p> <p> </p>  ";
        expect(formatPastedHtml(html)).toBe("<p>Test</p>");
    });

    it("removes standalone line breaks and soft hyphens", () => {
        const html = "Line\u00AD<br>Break";
        expect(formatPastedHtml(html)).toBe("LineBreak");
    });

    it("converts Word inline bold and italic to semantic tags", () => {
        const html = '<span style="font-weight: bold; font-style: italic;">Text</span>';
        expect(formatPastedHtml(html)).toBe("<strong><em>Text</em></strong>");
    });

    it("demotes headings when h1 is present", () => {
        const html = "<h1>Title</h1><h2>Section</h2>";
        expect(formatPastedHtml(html)).toBe("<h2>Title</h2><h3>Section</h3>");
    });

    it("converts unsupported headings to paragraphs", () => {
        const html = "<h6>Small</h6><h9>Huge</h9>";
        expect(formatPastedHtml(html)).toBe("<p>Small</p><p>Huge</p>");
    });
});
