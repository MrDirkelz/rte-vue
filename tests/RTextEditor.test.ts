import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import RTextEditor from "../src/components/RTextEditor.vue";
import { __setEditor, useEditor } from "@tiptap/vue-3"; // __setEditor is our custom export from mock
import waitForExpect from "wait-for-expect";

// Type augmentation for our mock helper
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

// Mock @tiptap/vue-3
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
        template: '<div data-testid="editor-content"></div>',
    });

    // Mock useEditor to capture options and return editorRef
    const useEditor = vi.fn((options) => {
        return editorRef;
    });

    const __setEditor = (value: unknown) => {
        editorRef.value = value as any;
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
        insertContent: vi.fn(),
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
        getHTML: vi.fn().mockReturnValue(""),
        chain: () => chain,
        commands: {
            setContent: vi.fn(),
            insertContent: vi.fn(),
            focus: vi.fn(),
        },
        setEditable: vi.fn(),
        ...overrides,
    };
};

let editorMock: any;

beforeEach(() => {
    editorMock = createEditorMock();
    __setEditor(editorMock);
    vi.clearAllMocks();
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
            .find((button) => button.text() === "B");

        expect(boldButton).toBeDefined();
    });

    // (1) editor is exposed and commands work
    it("exposes the editor instance and commands work", async () => {
        const wrapper = mount(RTextEditor);
        
        await waitForExpect(() => {
            expect(wrapper.vm.editor).toBeDefined();
        });

        // wrapper.vm.editor is a Proxy, so reference equality with editorMock (plain object) fails.
        // We use toMatchObject or just check properties.
        expect(wrapper.vm.editor).toMatchObject({
             commands: expect.any(Object)
        });
        expect(wrapper.vm.editor?.commands).toBeDefined();
    });

    // (2) content updates on setContent
    it("updates editor content when content changes", async () => {
        const wrapper = mount(RTextEditor, {
            props: {
                modelValue: "Initial",
            },
        });

        // Initial content is handled by useEditor, not setContent command
        // We can verify useEditor was called with correct content
        expect(useEditor).toHaveBeenCalled();
        const options = (useEditor as any).mock.calls[0][0];
        expect(options.content).toBe("Initial");

        // Update modelValue
        await wrapper.setProps({ modelValue: "New Content" });
        
        await waitForExpect(() => {
            expect(editorMock.commands.setContent).toHaveBeenCalledWith("New Content");
        });
    });

    // (3) text prop updates sync editor
    it("syncs editor when text prop updates", async () => {
        const wrapper = mount(RTextEditor, {
            props: {
                text: "Text Prop Content",
            },
        });

        // Check useEditor for initial
        expect(useEditor).toHaveBeenCalled();
        const options = (useEditor as any).mock.calls[0][0];
        expect(options.content).toBe("Text Prop Content");
        
        await wrapper.setProps({ text: "Updated Text" });
        
        await waitForExpect(() => {
            expect(editorMock.commands.setContent).toHaveBeenCalledWith("Updated Text");
        });
    });

    // (4) paste HTML runs formatPastedHtml transform and keeps <h1> by default
    it("runs formatPastedHtml on paste and keeps <h1> by default", async () => {
        const wrapper = mount(RTextEditor);
        
        // Retrieve the options passed to useEditor to access handlePaste
        expect(useEditor).toHaveBeenCalled();
        const options = (useEditor as any).mock.calls[0][0];
        const handlePaste = options.editorProps.handlePaste;
        
        expect(handlePaste).toBeDefined();

        const htmlContent = "<h1>Title</h1><p>Body</p>";
        const mockClipboardData = {
            getData: vi.fn().mockReturnValue(htmlContent),
        };
        const mockEvent = {
            clipboardData: mockClipboardData,
            preventDefault: vi.fn(),
        } as unknown as ClipboardEvent;

        // Execute handlePaste
        const handled = handlePaste(undefined, mockEvent);
        
        expect(handled).toBe(true);
        expect(mockClipboardData.getData).toHaveBeenCalledWith("text/html");
        
        // Verify formatPastedHtml was applied (h1 preserved)
        // Note: formatPastedHtml should have run within the handlePaste logic
        expect(editorMock.commands.insertContent).toHaveBeenCalledWith(
            expect.stringContaining("<h1>Title</h1>")
        );
    });

    describe("download and copy", () => {
        it("downloads html via the toolbar button for a single format", async () => {
            editorMock.getHTML.mockReturnValue("<p>Hi</p>");
            const onDownload = vi.fn().mockReturnValue(false);
            const wrapper = mount(RTextEditor, {
                props: { downloader: true, onDownload, downloadFilename: "doc" } as any,
            });
            await wrapper.find("button[title='Download']").trigger("click");
            await waitForExpect(() => expect(onDownload).toHaveBeenCalled());
            const arg = onDownload.mock.calls[0][0];
            expect(arg.filename).toBe("doc.html");
            expect(arg.content).toBe("<p>Hi</p>");
        });

        it("triggers a real download when onDownload does not cancel", async () => {
            editorMock.getHTML.mockReturnValue("<p>Hi</p>");
            const create = vi.fn().mockReturnValue("blob:x");
            (URL as any).createObjectURL = create;
            (URL as any).revokeObjectURL = vi.fn();
            const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
            const wrapper = mount(RTextEditor, { props: { downloader: true } as any });
            await wrapper.find("button[title='Download']").trigger("click");
            await waitForExpect(() => expect(click).toHaveBeenCalled());
            expect(create).toHaveBeenCalled();
            click.mockRestore();
        });

        it("shows a format menu for multiple formats", async () => {
            editorMock.getHTML.mockReturnValue("<p>Hi</p>");
            const onDownload = vi.fn().mockReturnValue(false);
            const wrapper = mount(RTextEditor, {
                attachTo: document.body,
                props: {
                    downloader: true,
                    onDownload,
                    downloadFormats: [
                        { id: "html", label: "HTML", extension: "html" },
                        { id: "txt", label: "Text", extension: "txt" },
                    ],
                } as any,
            });
            await wrapper.find(".rte-download-trigger").trigger("click");
            const items = document.querySelectorAll(".rte-download-menu-item");
            expect(items.length).toBe(2);
            (items[1] as HTMLElement).click();
            await waitForExpect(() => expect(onDownload).toHaveBeenCalled());
            expect(onDownload.mock.calls[0][0].filename).toBe("document.txt");
            wrapper.unmount();
        });

        it("warns for unknown download formats", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            const wrapper = mount(RTextEditor, {
                props: {
                    downloader: true,
                    downloadFormats: [{ id: "pdf", label: "PDF", extension: "pdf" }],
                } as any,
            });
            await wrapper.find("button[title='Download']").trigger("click");
            await waitForExpect(() => expect(warn).toHaveBeenCalled());
            warn.mockRestore();
        });

        it("copies plain text via clipboard.writeText when ClipboardItem is unavailable", async () => {
            editorMock.getHTML.mockReturnValue("<p>Hello</p><p>World</p>");
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText },
                configurable: true,
            });
            const wrapper = mount(RTextEditor, { props: { copyable: true } as any });
            await wrapper.find("button[title='Copy']").trigger("click");
            await waitForExpect(() => expect(writeText).toHaveBeenCalledWith("Hello\nWorld"));
        });

        it("skips copy when onCopy returns false", async () => {
            editorMock.getHTML.mockReturnValue("<p>Hello</p>");
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText },
                configurable: true,
            });
            const onCopy = vi.fn().mockReturnValue(false);
            const wrapper = mount(RTextEditor, { props: { copyable: true, onCopy } as any });
            await wrapper.find("button[title='Copy']").trigger("click");
            await waitForExpect(() => expect(onCopy).toHaveBeenCalled());
            expect(writeText).not.toHaveBeenCalled();
        });
    });
});
