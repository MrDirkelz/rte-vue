import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import buildDocx from "../src/utils/buildDocx";
import buildOdt from "../src/utils/buildOdt";

function readBlob(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as ArrayBuffer);
        r.onerror = () => reject(r.error);
        r.readAsArrayBuffer(blob);
    });
}

async function unzip(blob: Blob) {
    return JSZip.loadAsync(await readBlob(blob));
}

const HTML =
    '<h1>Title</h1><p><strong>bold</strong> <em>it</em> <u>un</u> <s>st</s> <a href="https://x.y/?a=1&b=2">link</a><br>next</p>' +
    "<ul><li><p>a</p><ol><li><p>b</p></li></ol></li></ul><p>&lt;tag&gt; &amp;</p>";

describe("buildDocx", () => {
    it("ships styled fonts, sizes and heading colours in styles.xml", async () => {
        const zip = await unzip(await buildDocx(HTML));
        const styles = await zip.file("word/styles.xml")!.async("string");
        expect(styles).toContain('w:ascii="Calibri"');
        expect(styles).toMatch(/styleId="Heading1">[\s\S]*?<w:color w:val="2F5496"\/>/);
        expect(styles).toContain("<w:keepNext/>");
    });

    it("produces a zip with the required parts", async () => {
        const zip = await unzip(await buildDocx(HTML));
        for (const f of ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]) {
            expect(zip.file(f), f).not.toBeNull();
        }
        const doc = await zip.file("word/document.xml")!.async("string");
        expect(doc).toContain("<w:b/>");
        expect(doc).toContain("<w:i/>");
        expect(doc).toContain("<w:strike/>");
        expect(doc).toContain("<w:u ");
        expect(doc).toContain("<w:br/>");
        expect(doc).toContain("&lt;tag&gt; &amp;");
        expect(doc).toContain("w:hyperlink");
        const rels = zip.file("word/_rels/document.xml.rels");
        expect(rels).not.toBeNull();
        expect(await rels!.async("string")).toContain("https://x.y/?a=1&amp;b=2");
    });

    it("has a valid mime type and handles empty input", async () => {
        const blob = await buildDocx("");
        expect(blob.type).toContain("wordprocessingml");
        const zip = await unzip(blob);
        expect(zip.file("word/document.xml")).not.toBeNull();
    });
});

describe("buildOdt", () => {
    it("produces a zip with mimetype first and the required parts", async () => {
        const blob = await buildOdt(HTML);
        expect(blob.type).toContain("opendocument.text");
        const zip = await unzip(blob);
        expect(await zip.file("mimetype")!.async("string")).toBe(
            "application/vnd.oasis.opendocument.text",
        );
        for (const f of ["content.xml", "META-INF/manifest.xml"]) {
            expect(zip.file(f), f).not.toBeNull();
        }
        const content = await zip.file("content.xml")!.async("string");
        expect(content).toContain("text:h");
        expect(content).toContain("text:list");
        expect(content).toContain("text:a");
        expect(content).toContain("&lt;tag&gt; &amp;");
        expect(content).toContain("text:line-break");
    });
});
