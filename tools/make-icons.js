// Gera os ícones do app (PNG e ICO) a partir de um SVG, usando o Chromium do Playwright.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64">
<defs>
<radialGradient id="b" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#ff9ccf"/><stop offset="1" stop-color="#e5368f"/></radialGradient>
<radialGradient id="c" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff3a3"/><stop offset="1" stop-color="#f59e0b"/></radialGradient>
</defs>
<rect x="14" y="47" width="8" height="12" rx="3.5" fill="#c41f73"/>
<rect x="38" y="47" width="8" height="12" rx="3.5" fill="#c41f73"/>
<path d="M7 34c-5 0-6-6-1-6" stroke="#c41f73" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<ellipse cx="31" cy="36" rx="25" ry="19" fill="url(#b)"/>
<path d="M17 22l-3-11 12 6z" fill="#e5368f"/>
<ellipse cx="55" cy="37" rx="7" ry="8" fill="#ff7ab8" stroke="#c41f73" stroke-width="1.5"/>
<circle cx="53.5" cy="35" r="1.6" fill="#8a1050"/><circle cx="56.5" cy="39.5" r="1.6" fill="#8a1050"/>
<circle cx="44" cy="29" r="2.6" fill="#4a0a2c"/>
<rect x="23" y="17.5" width="15" height="4" rx="2" fill="#8a1050"/>
<circle cx="30.5" cy="10" r="8.5" fill="url(#c)" stroke="#b45309" stroke-width="2"/>
<rect x="29" y="5.5" width="3" height="9" rx="1.5" fill="#b45309"/>
</svg>`;
(async () => {
  const out = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngs = {};
  for (const s of sizes) {
    await page.setViewportSize({ width: s, height: s });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg(s)}</body></html>`);
    pngs[s] = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'icon.png'), pngs[256]);
  fs.writeFileSync(path.join(out, 'tray.png'), pngs[32]);
  // ICO com PNGs dentro (aceito pelo Windows desde o Vista).
  const list = [16, 24, 32, 48, 64, 128, 256];
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(list.length, 4);
  const dir = Buffer.alloc(16 * list.length);
  let offset = 6 + dir.length;
  list.forEach((s, i) => {
    const b = pngs[s];
    dir.writeUInt8(s >= 256 ? 0 : s, i * 16); dir.writeUInt8(s >= 256 ? 0 : s, i * 16 + 1);
    dir.writeUInt8(0, i * 16 + 2); dir.writeUInt8(0, i * 16 + 3);
    dir.writeUInt16LE(1, i * 16 + 4); dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(b.length, i * 16 + 8); dir.writeUInt32LE(offset, i * 16 + 12);
    offset += b.length;
  });
  fs.writeFileSync(path.join(out, 'icon.ico'), Buffer.concat([header, dir].concat(list.map((s) => pngs[s]))));
  console.log('ícones gerados');
})();
