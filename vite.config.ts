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
            entryRoot: "src",
            include: ["src"],
        }),
    ],
    build: {
        lib: {
            entry: "src/index.ts",
            name: "RTextEditor",
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
