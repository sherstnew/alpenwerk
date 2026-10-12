// Run the actual app-designer DOM and pixel scan on the live web sections.
// Set chrome=none because these are website sections, not iOS device frames.
import { chromium } from "playwright-core";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const source = await readFile(
  ".agents/skills/app-designer/scripts/shoot.mjs",
  "utf8",
);
const code = source
  .slice(
    source.indexOf("const report = await page.evaluate"),
    source.indexOf("const appSizes ="),
  )
  .replace(
    '".ac-status,.ac-island,.ac-home,.mini"',
    '".ac-status,.ac-island,.ac-home,.mini,.sr-only"',
  )
  .replace(
    "/\\p{Extended_Pictographic}/gu",
    "/\\p{Emoji_Presentation}|\\p{Extended_Pictographic}\\uFE0F/gu",
  );
const scan = new Function(
  "page",
  `return (async () => { ${code}; return report; })()`,
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const out = process.argv[2] || "design/shots/r2";
await mkdir(out, { recursive: true });
const reports = [];
for (const lang of ["ru", "de", "en"])
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      (l) => localStorage.setItem("alpenwerk-language", l),
      lang,
    );
    await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
    await page.addStyleTag({
      content:
        ":root{--screen-w:402px}details:not([open]) > :not(summary){display:none}",
    });
    await page.evaluate(() => {
      document
        .querySelectorAll("header,main>section,footer")
        .forEach((el, i) => {
          el.classList.add("screen");
          el.dataset.chrome = "none";
          el.dataset.name = el.id || `section-${i}`;
        });
      document
        .querySelectorAll(".table-scroll")
        .forEach((el) => el.setAttribute("data-scrolls", ""));
    });
    const report = await scan(page);
    reports.push({ lang, width, report });
    console.log(
      `${lang} ${width}: ${report.reduce((sum, s) => sum + s.fails.length, 0)} FAIL(s)`,
    );
    for (const section of report)
      for (const fail of section.fails)
        console.log(`  ${section.name}: ${fail}`);
    await page.close();
  }
await writeFile(`${out}/skill-scan.json`, JSON.stringify(reports, null, 2));
await browser.close();
if (reports.some((r) => r.report.some((s) => s.fails.length)))
  process.exitCode = 1;
