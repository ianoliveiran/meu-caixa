// Abre o app de verdade (Electron) numa tela virtual, entra no modo de exemplo e tira fotos de cada tela.
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'shots';
  const data = path.join(out, 'data');
  fs.rmSync(data, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const app = await electron.launch({
    executablePath: require('electron'),
    args: [path.join(__dirname, '..'), '--no-sandbox'],
    env: Object.assign({}, process.env, { MEUCAIXA_DATA: path.resolve(data) })
  });
  const win = await app.firstWindow();
  const errors = [];
  win.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  win.on('pageerror', (e) => errors.push(String(e)));
  await win.setViewportSize({ width: Number(process.argv[3] || 1440), height: 900 });
  await win.waitForSelector('.app');
  await win.screenshot({ path: path.join(out, '0-welcome.png') });
  await win.click('text=Ver com dados de exemplo');
  await win.waitForSelector('.stack');
  await win.waitForTimeout(400);
  await win.screenshot({ path: path.join(out, '1-visao.png'), fullPage: true });
  await win.click('[data-act=card-step][data-v="1"]');
  await win.waitForTimeout(500);
  await win.click('.toggle-paid');
  await win.screenshot({ path: path.join(out, '2-visao-card2.png'), fullPage: true });
  for (const [v, name] of [['lanc', '3-lanc'], ['cartoes', '4-cartoes'], ['contas', '5-contas'], ['bancos', '6-bancos']]) {
    await win.click('.nav [data-act=nav][data-v=' + v + ']');
    await win.waitForTimeout(250);
    await win.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
  }
  await win.click('.nav [data-act=nav][data-v=contas]');
  await win.click('text=Nova conta');
  await win.waitForTimeout(200);
  await win.screenshot({ path: path.join(out, '7-dialog.png') });
  console.log('errors:', JSON.stringify(errors));
  await app.close();
})().catch((e) => { console.error(e); process.exit(1); });
