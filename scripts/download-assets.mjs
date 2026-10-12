import { mkdir, writeFile } from "node:fs/promises";

await mkdir("public/fonts", { recursive: true });
await mkdir("public/images", { recursive: true });
async function download(url, path) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved ${path}`);
}
const files = await (
  await fetch(
    "https://api.github.com/repos/googlefonts/golos-text/contents/fonts/variable",
  )
).json();
const font = files.find((f) => f.name.endsWith(".ttf"));
if (!font) throw new Error("Golos variable font not found");
await download(font.download_url, "public/fonts/GolosText-Variable.ttf");
await download(
  "https://raw.githubusercontent.com/googlefonts/golos-text/main/OFL.txt",
  "public/fonts/OFL.txt",
);
// Verified against the photo page and its download redirect on 2026-10-12.
const source = "https://images.unsplash.com/photo-1662950997384-1e3ed14e1217";
// The image origin is unreachable from this host. This public image proxy only
// resizes the verified original; the application serves the saved file locally.
await download(
  `https://wsrv.nl/?url=${encodeURIComponent(`${source}?w=1400&q=80`)}&w=1400&h=800&fit=cover&output=jpg`,
  "public/images/jungfrau.jpg",
);
await writeFile(
  "public/images/SOURCE.md",
  `# Jungfrau panorama\n\nPhotographer: allPhoto Bangkok\nSource: https://unsplash.com/photos/a-snowy-mountain-landscape-ZmSgK89kzFI\nImage: ${source}\nLicense: https://unsplash.com/license\nDownloaded for this local prototype.\n`,
);
