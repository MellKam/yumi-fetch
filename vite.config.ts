import { defineConfig } from "npm:vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/mod.ts",
      formats: ["cjs", "es"],
      fileName: "index",
    },
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
});
