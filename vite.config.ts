import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Plain Vite + React single-page app. Builds a static bundle to dist/.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: true,
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});
