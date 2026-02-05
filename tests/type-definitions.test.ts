
import { describe, it } from "vitest";
import { RTextEditor } from "../src/index";
import type { ToolbarItem, RichTextEditorProps } from "../src/index";
import { type Editor } from "@tiptap/vue-3";

// This test file primarily serves as a compile-time check for types.
// The code inside strict checks won't necessarily run, but if it compiles, we are good.

describe("Type checks", () => {
    it("should carry correct types for Editor chain commands", () => {
         // This function serves as a compile-time check.
         // It is never invoked at runtime, so we don't need a real Editor instance.
         const _typeCheck = () => {
             // Mock editor instance typed as Editor
             const editor = {} as Editor;

             // Check if core commands exist
             editor.chain().focus().run();

             // Check if Link extension commands exist (specifically unsetLink as requested)
             // This will fail compilation if types are not augmented correctly
             editor.chain().unsetLink().run();
             editor.chain().focus().unsetLink().run();
             editor.chain().setLink({ href: "https://example.com" }).run();

             // Check heading (StarterKit)
             editor.chain().toggleHeading({ level: 1 }).run();
         };
         
         expect(_typeCheck).toBeDefined();
    });

    it("should export correct types from the package", () => {
        const item: ToolbarItem = "bold";
        const props: RichTextEditorProps = {
            toolbarItems: [item, "link", "unlink"],
            onRequestLink: () => {}
        };
        // avoid unused var error
        void item;
        void props;
    });

    it("should accept defineExpose types on the component instance", () => {
        // Approximate the instance type lookup
        type RTextEditorInstance = InstanceType<typeof RTextEditor>;
        
        const instance = {} as RTextEditorInstance;
        
        // This checks if 'editor' is exposed and typed correctly
        if (instance.editor) {
            instance.editor.chain().unsetLink();
        }
    });
});
