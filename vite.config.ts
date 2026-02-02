import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

const external = [
    "vue",
    "@tiptap/vue-3",
    "@tiptap/starter-kit",
    "@tiptap/extension-link",
];

export default defineConfig({
    plugins: [
        vue(),
        dts({
            entryRoot: ".",
            include: ["index.ts", "RichTextEditorStandalone.vue", "formatPastedHtml.ts"],
        }),
    ],
    build: {
        lib: {
            entry: "index.ts",
            name: "RichTextEditorStandalone",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
        },
        rollupOptions: {
            external,
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
    },
});
