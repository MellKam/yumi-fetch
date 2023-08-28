import { defineConfig } from "npm:vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        mod: "./src/mod.ts",
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
