import fs from "fs";
import Handlebars from "handlebars";

// 1. Configuration
const srcDir = "./src";
const distDir = "./dist";
const locales = ["en", "cz", "fr"];

// 2. Ensure the output directory exists
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// 3. The Engine: Loop through locales and generate pages
locales.forEach((locale) => {
  // Read the translation JSON file
  const translationsPath = `${srcDir}/locales/${locale}.json`;
  if (!fs.existsSync(translationsPath)) return;
  const translations = JSON.parse(fs.readFileSync(translationsPath, "utf-8"));

  // Create the specific locale folder (e.g., dist/en/)
  const localeDist = `${distDir}/${locale}`;
  if (!fs.existsSync(localeDist)) fs.mkdirSync(localeDist, { recursive: true });

  // Read all base pages
  const pagesDir = `${srcDir}/pages`;
  fs.readdirSync(pagesDir).forEach((file) => {
    // Only compile HTML files
    if (!file.endsWith(".html")) return;

    const sourceCode = fs.readFileSync(`${pagesDir}/${file}`, "utf-8");

    // Compile and inject the translations
    const template = Handlebars.compile(sourceCode);
    const finalHtml = template(translations);

    // Write to the output folder
    fs.writeFileSync(`${localeDist}/${file}`, finalHtml);
  });
});

// 4. Handle Netlify Root Redirect
// Copies your _redirects file to the dist folder so Netlify knows to route traffic to /en/
const redirectsFile = `${srcDir}/pages/_redirects`;
if (fs.existsSync(redirectsFile)) {
  fs.copyFileSync(redirectsFile, `${distDir}/_redirects`);
}

console.log("✅ Static site generated successfully in /dist!");
