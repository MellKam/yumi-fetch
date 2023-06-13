import { defineConfig } from "npm:vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "./src/mod.ts",
        plugins: "./src/plugins/mod.ts",
      },
      formats: ["cjs", "es"],
    },
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
});
