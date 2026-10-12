import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const out = process.argv[2] || "design/shots/r1";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const shots = [];
const scan = [];
for (const [lang, width] of [
  ["ru", 1440],
  ["de", 768],
  ["en", 375],
]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await page.addInitScript(
    (l) => localStorage.setItem("alpenwerk-language", l),
    lang,
  );
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${out}/${lang}-${width}-full.png`,
    fullPage: true,
  });
  await page.screenshot({ path: `${out}/${lang}-${width}-hero.png` });
  shots.push(`${lang}-${width}-hero.png`);
  await page.evaluate(() => document.activeElement?.blur());
  await page
    .locator("#calculator")
    .screenshot({ path: `${out}/${lang}-${width}-calculator.png` });
  shots.push(`${lang}-${width}-calculator.png`);
  await page.locator(".result-apply").click();
  await page
    .locator("dialog")
    .screenshot({ path: `${out}/${lang}-${width}-application.png` });
  await page.keyboard.press("Escape");
  const issues = await page.evaluate(() => {
    const issues = [];
    const els = [...document.querySelectorAll("main *,header *,footer *")];
    for (const el of els) {
      const r = el.getBoundingClientRect(),
        css = getComputedStyle(el);
      if (
        r.width === 0 ||
        r.height === 0 ||
        css.visibility === "hidden" ||
        (el.closest("details:not([open])") &&
          el.tagName !== "SUMMARY" &&
          !el.closest("summary"))
      )
        continue;
      if (
        !el.classList.contains("sr-only") &&
        !el.closest("svg") &&
        (r.right > innerWidth + 1 || r.left < -1)
      )
        issues.push({
          kind: "overflow",
          element: el.className || el.tagName,
          right: r.right,
        });
      if (
        el.children.length === 0 &&
        el.textContent.trim() &&
        parseFloat(css.fontSize) < 11 &&
        el.tagName !== "svg"
      )
        issues.push({
          kind: "small-text",
          element: el.className || el.tagName,
          size: css.fontSize,
        });
    }
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      issues,
    };
  });
  scan.push({ lang, width, ...issues });
  await page.close();
}
await writeFile(`${out}/scan.json`, JSON.stringify(scan, null, 2));
const sheet = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
await sheet.goto("http://127.0.0.1:5173/design/explore.html");
await sheet.setContent(
  `<html><body style="margin:0;padding:24px;background:#dce2dd;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${shots.map((s) => `<figure style="margin:0"><figcaption style="font:14px Arial;margin-bottom:8px">${s}</figcaption><img style="width:100%;display:block" src="http://127.0.0.1:5173/${out}/${s}"></figure>`).join("")}</body></html>`,
);
await sheet.waitForLoadState("networkidle");
await sheet.screenshot({ path: `${out}/sheet.png`, fullPage: true });
await browser.close();
console.log(`Screenshots and scan: ${out}`);
console.log(
  JSON.stringify(
    scan.map((s) => ({
      lang: s.lang,
      width: s.width,
      overflow: s.overflow,
      issues: s.issues.length,
    })),
  ),
);
