import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.mts"],
    format: ["esm"],
    clean: true,
    splitting: true,
    dts: true,
    target: "es2020",
    minifySyntax: true,
  },
  {
    entry: ["src/index.cts"],
    format: ["cjs"],
    clean: true,
    splitting: true,
    dts: true,
    target: "es2020",
    minifySyntax: true,
  },
]);
