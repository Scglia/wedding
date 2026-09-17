import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { execFileSync } from "child_process";

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

// 4b. Modern image formats
// Every JPEG under src/public gets an AVIF and a WebP sibling in dist, so pages
// can offer them through <picture> and fall back to the original JPEG.
// Conversion uses ImageMagick (`brew install imagemagick`); if it isn't
// installed the build still succeeds and browsers just use the JPEG.
// Outputs are skipped when they are newer than their source, so the watcher
// rebuild stays fast.
const imageFormats = [
  { ext: "avif", args: ["-quality", "60"] },
  { ext: "webp", args: ["-quality", "80"] },
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function hasMagick() {
  try {
    execFileSync("magick", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (fs.existsSync(publicDir)) {
  if (hasMagick()) {
    let converted = 0;
    walk(publicDir)
      .filter((file) => /\.jpe?g$/i.test(file))
      .forEach((source) => {
        const rel = path.relative(publicDir, source);
        const sourceTime = fs.statSync(source).mtimeMs;
        imageFormats.forEach(({ ext, args }) => {
          const target = path.join(distDir, rel.replace(/\.jpe?g$/i, `.${ext}`));
          if (fs.existsSync(target) && fs.statSync(target).mtimeMs > sourceTime) return;
          execFileSync("magick", [source, "-strip", ...args, target], { stdio: "inherit" });
          converted++;
        });
      });
    if (converted) console.log(`🖼  Converted ${converted} image(s) to AVIF/WebP`);
  } else {
    console.warn("⚠️  ImageMagick (magick) not found — skipping AVIF/WebP conversion");
  }
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
