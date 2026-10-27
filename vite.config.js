import { defineConfig } from "vite";

export default defineConfig({
  base: "/tableau_export_to_excel_button/",
  server: {
    host: true,
    port: 8787,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 8787,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        configure: "configure.html",
      },
    },
  },
});
