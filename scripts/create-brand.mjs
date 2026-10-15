import fs from "node:fs/promises";
import path from "node:path";
import { openSync } from "fontkit";

const fontFile = "public/fonts/Caveat-Variable.ttf";
await fs.mkdir(path.dirname(fontFile), { recursive: true });
try {
  await fs.access(fontFile);
} catch {
  const response = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf",
  );
  if (!response.ok) throw Error("Could not download the licensed brand font");
  await fs.writeFile(fontFile, Buffer.from(await response.arrayBuffer()));
  const license = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/OFL.txt",
  );
  if (!license.ok) throw Error("Could not download the font license");
  await fs.writeFile("public/fonts/Caveat-OFL.txt", await license.text());
}
const font = openSync(fontFile).getVariation({ wght: 700 });
const run = font.layout("brisa");
let x = 0,
  minX = Infinity,
  maxX = -Infinity,
  minY = Infinity,
  maxY = -Infinity;
const shapes = [];
run.glyphs.forEach((glyph, i) => {
  const p = run.positions[i],
    gx = x + p.xOffset,
    gy = p.yOffset;
  minX = Math.min(minX, gx + glyph.bbox.minX);
  maxX = Math.max(maxX, gx + glyph.bbox.maxX);
  minY = Math.min(minY, gy + glyph.bbox.minY);
  maxY = Math.max(maxY, gy + glyph.bbox.maxY);
  shapes.push(
    `<path transform="translate(${gx} ${gy})" d="${glyph.path.toSVG()}"/>`,
  );
  x += p.xAdvance - 8;
});
const padding = 44,
  width = maxX - minX + padding * 2 + 95,
  height = maxY - minY + padding * 2 + 80;
const makeLogo = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="brisa"><title>brisa</title><g transform="translate(${padding - minX} ${padding + maxY}) scale(1 -1)" fill="${color}">${shapes.join("")}<circle cx="${maxX + 52}" cy="${minY + 43}" r="26"/></g><path d="M${width * 0.29} ${height - 29}Q${width * 0.56} ${height - 62} ${width * 0.86} ${height - 40}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" opacity=".64"/></svg>`;
await fs.mkdir("public/brand", { recursive: true });
await fs.writeFile("public/brand/brisa-logo.svg", makeLogo("#ED713B"));
await fs.writeFile("public/brand/brisa-logo-white.svg", makeLogo("#FFFCF7"));
await fs.writeFile("public/brand/brisa-logo-dark.svg", makeLogo("#34352F"));
const b = font.glyphForCodePoint("b".codePointAt(0)),
  box = b.bbox,
  s = 43 / (box.maxY - box.minY),
  cx = 32 - ((box.minX + box.maxX) * s) / 2,
  cy = 31 + ((box.minY + box.maxY) * s) / 2;
const symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#ED713B"/><path transform="translate(${cx} ${cy}) scale(${s} ${-s})" fill="#FFFCF7" d="${b.path.toSVG()}"/><circle cx="47" cy="46" r="2.5" fill="#FFFCF7"/></svg>`;
await fs.writeFile("public/brand/brisa-symbol.svg", symbol);
await fs.writeFile("public/favicon.svg", symbol);
console.log("Created outlined handwritten wordmarks, symbol and favicon.");
