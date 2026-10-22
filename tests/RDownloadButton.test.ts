import { mount } from "@vue/test-utils";
import { describe, it, expect, afterEach } from "vitest";
import RDownloadButton from "../src/components/RDownloadButton.vue";

const formats = [
    { id: "html", label: "HTML", extension: "html" },
    { id: "txt", label: "Text", extension: "txt" },
];

describe("RDownloadButton", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("opens a menu, emits select and closes", async () => {
        const w = mount(RDownloadButton, {
            attachTo: document.body,
            props: { formats, label: "Download" },
        });
        expect(document.querySelector("[role=menu]")).toBeNull();
        await w.find("button").trigger("click");
        expect(document.querySelectorAll("[role=menuitem]").length).toBe(2);
        (document.querySelectorAll("[role=menuitem]")[1] as HTMLElement).click();
        await w.vm.$nextTick();
        expect(w.emitted("select")![0][0]).toEqual(formats[1]);
        expect(document.querySelector("[role=menu]")).toBeNull();
        w.unmount();
    });

    it("closes on Escape and on outside mousedown", async () => {
        const w = mount(RDownloadButton, {
            attachTo: document.body,
            props: { formats, label: "Download" },
        });
        await w.find("button").trigger("click");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await w.vm.$nextTick();
        expect(document.querySelector("[role=menu]")).toBeNull();
        await w.find("button").trigger("click");
        document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        await w.vm.$nextTick();
        expect(document.querySelector("[role=menu]")).toBeNull();
        await w.find("button").trigger("click");
        window.dispatchEvent(new Event("resize"));
        w.unmount();
    });

    it("respects disabled and applies class names", async () => {
        const w = mount(RDownloadButton, {
            attachTo: document.body,
            props: {
                formats,
                label: "Download",
                disabled: true,
                classNames: { button: "x-btn", downloadMenu: "x-menu", downloadMenuItem: "x-item" },
            },
        });
        expect(w.find("button").attributes("disabled")).toBeDefined();
        expect(w.find("button").classes()).toContain("x-btn");
        await w.setProps({ disabled: false });
        await w.find("button").trigger("click");
        expect(document.querySelector(".x-menu")).not.toBeNull();
        expect(document.querySelector(".x-item")).not.toBeNull();
        w.unmount();
    });
});
