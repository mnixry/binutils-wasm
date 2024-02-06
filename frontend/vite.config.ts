import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@binutils-wasm/binutils", "@binutils-wasm/gas"],
  },
  define: {
    "import.meta.env.VERCEL": JSON.stringify(process.env.VERCEL),
  },
});
