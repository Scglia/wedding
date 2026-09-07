import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

// 1. Configuration
const srcDir = "./src";
const distDir = "./dist";
const locales = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "cs", label: "Čeština" },
];

// 2. Ensure the output directory exists
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// Helpers and shared partials (src/partials/<name>.html → {{> name}})
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("add", (a, b) => a + b);
Handlebars.registerHelper("json", (value) => JSON.stringify(value));

const partialsDir = `${srcDir}/partials`;
if (fs.existsSync(partialsDir)) {
  fs.readdirSync(partialsDir).forEach((file) => {
    if (!file.endsWith(".html")) return;
    Handlebars.registerPartial(
      path.basename(file, ".html"),
      fs.readFileSync(`${partialsDir}/${file}`, "utf-8"),
    );
  });
}

// 3. The Engine: Loop through locales and generate pages
locales.forEach(({ code }) => {
  // Read the translation JSON file
  const translationsPath = `${srcDir}/locales/${code}.json`;
  if (!fs.existsSync(translationsPath)) return;
  const translations = JSON.parse(fs.readFileSync(translationsPath, "utf-8"));

  // Give every page access to the full list of locales, so templates can
  // render a language switcher without hardcoding links.
  const context = {
    ...translations,
    locales: locales.map((locale) => ({
      ...locale,
      active: locale.code === code,
    })),
  };

  // Create the specific locale folder (e.g., dist/en/)
  const localeDist = `${distDir}/${code}`;
  if (!fs.existsSync(localeDist)) fs.mkdirSync(localeDist, { recursive: true });

  // Read all base pages
  const pagesDir = `${srcDir}/pages`;
  fs.readdirSync(pagesDir).forEach((file) => {
    // Only compile HTML files
    if (!file.endsWith(".html")) return;

    const sourceCode = fs.readFileSync(`${pagesDir}/${file}`, "utf-8");

    // Compile and inject the translations
    const template = Handlebars.compile(sourceCode);
    const finalHtml = template(context);

    // Write to the output folder
    fs.writeFileSync(`${localeDist}/${file}`, finalHtml);
  });
});

// 4. Copy static assets (stylesheet, public files) into the output root
const stylesPath = `${srcDir}/styles.css`;
if (fs.existsSync(stylesPath)) {
  fs.copyFileSync(stylesPath, `${distDir}/styles.css`);
}

const publicDir = `${srcDir}/public`;
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
}

// 5. Root redirect
// Netlify reads _redirects; everyone else gets a plain HTML fallback page
// that redirects to the default locale.
const redirectsFile = `${srcDir}/pages/_redirects`;
if (fs.existsSync(redirectsFile)) {
  fs.copyFileSync(redirectsFile, `${distDir}/_redirects`);
}

const defaultLocale = locales[0].code;
fs.writeFileSync(
  path.join(distDir, "index.html"),
  `<!DOCTYPE html>\n<html>\n<head><meta http-equiv="refresh" content="0; url=/${defaultLocale}/"><style>a,a:hover,a:active,a:visited{color:#f3f2f2}</style></head>\n<body style="margin:0;background:#f3f2f2"><a href="/${defaultLocale}/">Continue</a></body>\n</html>\n`,
);

console.log("✅ Static site generated successfully in /dist!");
