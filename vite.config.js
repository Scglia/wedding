import { defineConfig } from "vite";
import { resolve } from "path";
import handlebars from "vite-plugin-handlebars";
import fs from "fs";

// Load translation files safely
const loadLocale = (lang) => {
  return JSON.parse(
    fs.readFileSync(resolve(__dirname, `src/locales/${lang}.json`), "utf-8"),
  );
};

export default defineConfig({
  plugins: [
    handlebars({
      // Points to where you keep reusable HTML blocks like your RSVP form layout
      partialDirectory: resolve(__dirname, "src/partials"),
      // Dynamically passes the correct JSON data depending on which page Vite is compiling
      context(pagePath) {
        if (pagePath.includes("/es/")) return loadLocale("es");
        if (pagePath.includes("/fr/")) return loadLocale("fr");
        return loadLocale("en"); // Default fallback
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Tells Vite to build all 3 language pages explicitly
      input: {
        main: resolve(__dirname, "index.html"),
        en: resolve(__dirname, "en/index.html"),
        es: resolve(__dirname, "es/index.html"),
        fr: resolve(__dirname, "fr/index.html"),
      },
    },
  },
});
