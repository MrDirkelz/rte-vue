import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import RTextEditor from "../RTextEditor.vue";
import { __setEditor } from "@tiptap/vue-3";

declare module "@tiptap/vue-3" {
    export function __setEditor(value: unknown): void;
}

vi.mock("@tiptap/starter-kit", () => ({
    default: {
        configure: () => ({}),
    },
}));

vi.mock("@tiptap/extension-link", () => ({
    default: {
        configure: () => ({}),
    },
}));

vi.mock("@tiptap/vue-3", async () => {
    const vue = await import("vue");
    const editorRef = vue.ref(null);

    const EditorContent = vue.defineComponent({
        name: "EditorContent",
        props: {
            editor: {
                type: Object,
                required: false,
            },
        },
        setup() {
            return () => vue.h("div", { "data-testid": "editor-content" });
        },
    });

    const useEditor = () => editorRef;

    const __setEditor = (value: unknown) => {
        editorRef.value = value as typeof editorRef.value;
    };

    return { useEditor, EditorContent, __setEditor };
});

const createEditorMock = (overrides: Partial<Record<string, unknown>> = {}) => {
    const chain = {
        focus: () => chain,
        toggleBold: () => chain,
        toggleItalic: () => chain,
        toggleStrike: () => chain,
        toggleHeading: () => chain,
        toggleBulletList: () => chain,
        toggleOrderedList: () => chain,
        unsetLink: () => chain,
        setLink: () => chain,
        extendMarkRange: () => chain,
        run: vi.fn(),
    };

    return {
        isEmpty: false,
        isActive: vi.fn().mockReturnValue(false),
        state: {
            selection: {
                empty: false,
            },
        },
        getAttributes: vi.fn().mockReturnValue({}),
        chain: () => chain,
        commands: {
            setContent: vi.fn(),
            insertContent: vi.fn(),
            focus: vi.fn(),
        },
        ...overrides,
    };
};

beforeEach(() => {
    __setEditor(createEditorMock());
});

describe("RTextEditor", () => {
    it("renders the title and toolbar buttons", () => {
        const wrapper = mount(RTextEditor, {
            props: {
                title: "Editor Title",
            },
        });

        expect(wrapper.text()).toContain("Editor Title");
        const boldButton = wrapper
            .findAll("button")
            .find((button) => button.text() === "Bold");

        expect(boldButton).toBeDefined();
    });

    it("hides the toolbar when showToolbar is false", () => {
        const wrapper = mount(RTextEditor, {
            props: {
                showToolbar: false,
            },
        });

        expect(wrapper.find(".rte-toolbar").exists()).toBe(false);
    });

    it("hides the toolbar when disabled", () => {
        const wrapper = mount(RTextEditor, {
            props: {
                disabled: true,
            },
        });

        expect(wrapper.find(".rte-toolbar").exists()).toBe(false);
    });

    it("shows the placeholder when the editor is empty", () => {
        __setEditor(createEditorMock({ isEmpty: true }));

        const wrapper = mount(RTextEditor, {
            props: {
                placeholder: "Start typing...",
            },
        });

        expect(wrapper.find(".rte-placeholder").exists()).toBe(true);
    });

    it("opens the link modal when clicking the link button", async () => {
        const wrapper = mount(RTextEditor);

        const linkButton = wrapper
            .findAll("button")
            .find((button) => button.text() === "Link");

        expect(linkButton).toBeDefined();
        await linkButton?.trigger("click");

        expect(wrapper.find(".rte-modal").exists()).toBe(true);
    });

    it("disables the unlink button when no link is selected", () => {
        const wrapper = mount(RTextEditor);

        const unlinkButton = wrapper
            .findAll("button")
            .find((button) => button.text() === "Unlink");

        expect(unlinkButton?.attributes("disabled")).toBeDefined();
    });

    it("supports custom toolbar groups and labels", () => {
        const wrapper = mount(RTextEditor, {
            props: {
                toolbarGroups: [
                    ["bold", "italic"],
                    ["link", "unlink"],
                ],
                toolbarLabels: {
                    bold: "Strong",
                },
            },
        });

        expect(wrapper.findAll(".rte-toolbar-group").length).toBe(2);
        const strongButton = wrapper
            .findAll("button")
            .find((button) => button.text() === "Strong");

        expect(strongButton).toBeDefined();
    });

    it("applies custom classNames to the root and toolbar", () => {
        const wrapper = mount(RTextEditor, {
            props: {
                classNames: {
                    root: "custom-root",
                    toolbar: "custom-toolbar",
                },
            },
        });

        expect(wrapper.find(".rte-root").classes()).toContain("custom-root");
        expect(wrapper.find(".rte-toolbar").classes()).toContain("custom-toolbar");
    });

    it("renders a custom toolbar slot with provided props", () => {
        const wrapper = mount(RTextEditor, {
            props: {
                toolbarItems: ["bold", "italic"],
                showToolbar: true,
                disabled: false,
            },
            slots: {
                toolbar: '<div class="custom-toolbar-slot">Custom Toolbar</div>',
            },
        });

        expect(wrapper.find(".custom-toolbar-slot").exists()).toBe(true);
        expect(wrapper.find(".custom-toolbar-slot").text()).toBe("Custom Toolbar");
    });
});
