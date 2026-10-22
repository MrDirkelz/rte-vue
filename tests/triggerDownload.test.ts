import { describe, it, expect, vi, afterEach } from "vitest";
import triggerDownload from "../src/utils/triggerDownload";

describe("triggerDownload", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("wraps strings in a Blob with the mime type and clicks a temporary link", () => {
        const create = vi.fn().mockReturnValue("blob:1");
        const revoke = vi.fn();
        (URL as any).createObjectURL = create;
        (URL as any).revokeObjectURL = revoke;
        let name = "";
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(function (this: HTMLAnchorElement) {
                name = this.download;
            });
        triggerDownload("abc", "a.txt", "text/plain");
        expect(click).toHaveBeenCalled();
        expect(name).toBe("a.txt");
        expect((create.mock.calls[0][0] as Blob).type).toBe("text/plain");
        expect(revoke).toHaveBeenCalledWith("blob:1");
        expect(document.querySelector("a[download]")).toBeNull();
    });

    it("uses a Blob as-is and tolerates a missing mime type", () => {
        const create = vi.fn().mockReturnValue("blob:2");
        (URL as any).createObjectURL = create;
        (URL as any).revokeObjectURL = vi.fn();
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        const blob = new Blob(["x"], { type: "application/x-test" });
        triggerDownload(blob, "b.bin", "ignored/type");
        expect(create.mock.calls[0][0]).toBe(blob);
        triggerDownload("plain", "c.txt");
        expect((create.mock.calls[1][0] as Blob).type).toBe("");
    });
});
