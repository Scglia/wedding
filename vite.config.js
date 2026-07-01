import { defineConfig } from "vite";

// build.js generates the whole site into /dist as plain static HTML/CSS.
// Vite's only job here is to serve that folder during local development.
export default defineConfig({
  root: "dist",
  server: {
    open: "/en/",
  },
});
