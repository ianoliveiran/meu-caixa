'use strict';
const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage, safeStorage, powerMonitor, shell } = require('electron');
const path = require('path');
const { Store } = require('./src/store');
const { PluggyClient } = require('./src/pluggy');
const { syncAll, removeItem } = require('./src/sync');
const { buildModel, CATS } = require('./src/rules');
const { buildDemo } = require('./src/demo');

app.setAppUserModelId('br.local.meucaixa');
if (process.env.MEUCAIXA_DATA) app.setPath('userData', process.env.MEUCAIXA_DATA);
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;
let tray = null;
let store = null;
let syncing = false;
let timer = null;
let quitting = false;
const startHidden = process.argv.includes('--hidden');

// ---------- Segredos: criptografados pelo Windows (DPAPI) ----------
function enc(s) {
  if (!s) return '';
  if (safeStorage.isEncryptionAvailable()) return 'enc:' + safeStorage.encryptString(s).toString('base64');
  return 'raw:' + Buffer.from(s, 'utf8').toString('base64');
}
function dec(s) {
  if (!s) return '';
  try {
    if (s.startsWith('enc:')) return safeStorage.decryptString(Buffer.from(s.slice(4), 'base64'));
    if (s.startsWith('raw:')) return Buffer.from(s.slice(4), 'base64').toString('utf8');
  } catch (e) { return ''; }
  return '';
}
function client() {
  const sec = store.db.secrets || {};
  const id = dec(sec.clientId);
  const secret = dec(sec.clientSecret);
  if (!id || !secret) return null;
  return new PluggyClient(id, secret);
}

// ---------- Janela e bandeja ----------
function iconPath(name) {
  return path.join(__dirname, 'assets', name);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 420,
    minHeight: 560,
    show: false,
    backgroundColor: '#f3f5f9',
    autoHideMenuBar: true,
    title: 'Meu Caixa',
    icon: iconPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => { if (!startHidden) win.show(); });
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      win.hide();
      if (!store.db.settings.trayHintShown && tray) {
        store.db.settings.trayHintShown = true;
        store.save();
        tray.displayBalloon && tray.displayBalloon({ title: 'Meu Caixa continua aberto', content: 'Ele fica aqui perto do relógio e segue sincronizando. Para fechar de vez, clique com o botão direito e escolha Sair.' });
      }
    }
  });
  // Links externos abrem no navegador, nunca dentro do app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.on('show', () => {
    const last = store.db.lastSync ? new Date(store.db.lastSync) : null;
    if (!last || Date.now() - last > 60 * 60 * 1000) runSync(false);
  });
}

function showWindow() {
  if (!win) createWindow();
  win.show();
  if (win.isMinimized()) win.restore();
  win.focus();
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(iconPath('tray.png')));
  tray.setToolTip('Meu Caixa');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir o Meu Caixa', click: showWindow },
    { label: 'Sincronizar agora', click: () => runSync(true) },
    { type: 'separator' },
    { label: 'Sair', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', showWindow);
}

function applyAutoStart() {
  if (process.platform !== 'win32' && process.platform !== 'darwin') return;
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: store.db.settings.autoStart !== false, args: ['--hidden'] });
}

// ---------- Sincronização ----------
function notifyRenderer(extra) {
  if (win && !win.isDestroyed()) win.webContents.send('state:changed', Object.assign({ syncing }, extra || {}));
}

async function runSync(manual) {
  if (syncing) return { ok: false, message: 'Já estou sincronizando.' };
  if (store.db.settings.demo) return { ok: false, message: 'No modo de exemplo não há sincronização. Conecte seus bancos em Bancos e ajustes.' };
  const c = client();
  if (!c) return { ok: false, message: 'Falta o Client ID e o Client Secret da Pluggy em Bancos e ajustes.' };
  syncing = true;
  notifyRenderer();
  const firstSync = !store.db.lastSync || !Object.keys(store.db.accountSync || {}).length;
  try {
    const res = await syncAll(store.db, c, (p) => notifyRenderer({ progress: p }));
    store.save();
    const spend = res.novas
      .map((id) => store.db.transactions[id])
      .filter((t) => t && t.type === 'DEBIT');
    if (spend.length && !manual && !firstSync && Notification.isSupported() && store.db.settings.notify !== false) {
      new Notification({ title: 'Meu Caixa', body: spend.length === 1 ? '1 lançamento novo entrou.' : spend.length + ' lançamentos novos entraram.' }).show();
    }
    return { ok: !res.errors.length, message: res.errors.length ? res.errors.join(' · ') : null, novas: res.novas.length };
  } catch (e) {
    store.db.lastSyncError = e.message;
    store.save();
    return { ok: false, message: e.message };
  } finally {
    syncing = false;
    notifyRenderer();
  }
}

function schedule() {
  if (timer) clearInterval(timer);
  const hours = Math.max(1, Number(store.db.settings.syncHours) || 3);
  timer = setInterval(() => runSync(false), hours * 3600 * 1000);
}

// ---------- IPC ----------
const BILL_ICONS = ['moradia', 'luz', 'agua', 'internet', 'celular', 'academia', 'contas', 'saude', 'educacao', 'assinaturas', 'transporte', 'cartao', 'outros'];

function cleanBill(b) {
  const nome = String(b.nome || '').trim().slice(0, 60);
  if (!nome) throw new Error('Dê um nome para a conta.');
  const semanal = b.freq === 'semanal';
  const unica = b.freq === 'unica';
  const data = String(b.data || '');
  if (unica && data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('A data não ficou certa. Escolha de novo ou deixe em branco.');
  const dia = semanal ? 1 : (unica ? (data ? Number(data.slice(8, 10)) : 1) : Math.round(Number(b.dia)));
  if (!semanal && !(dia >= 1 && dia <= 31)) throw new Error('O dia do vencimento precisa ser de 1 a 31.');
  const diaSemana = Math.round(Number(b.diaSemana));
  if (semanal && !(diaSemana >= 0 && diaSemana <= 6)) throw new Error('Escolha o dia da semana.');
  const valor = parseMoney(b.valor || '0');
  if (!(valor >= 0)) throw new Error('O valor precisa ser um número, como 120,50.');
  return {
    id: b.id || ('b' + Date.now().toString(36)),
    nome,
    dia,
    valor: Math.round(valor * 100) / 100,
    icon: BILL_ICONS.includes(b.icon) ? b.icon : 'contas',
    pagamento: b.pagamento === 'cartao' ? 'cartao' : 'conta',
    cat: ['moradia', 'saude', 'educacao', 'assinaturas', 'transporte'].includes(b.icon) ? b.icon : 'contas',
    busca: String(b.busca || '').slice(0, 120),
    freq: semanal ? 'semanal' : (unica ? 'unica' : 'mensal'),
    data: unica && data ? data : undefined,
    diaSemana: semanal ? diaSemana : undefined
  };
}

function parseMoney(v) {
  if (typeof v === 'number') return v;
  const n = Number(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

function registerIpc() {
  ipcMain.handle('model:get', (e, month) => {
    const m = buildModel(store.db, { month: /^\d{4}-\d{2}$/.test(month || '') ? month : undefined });
    m.sync.syncing = syncing;
    m.sync.configured = !!(store.db.secrets && store.db.secrets.clientId) || !!store.db.settings.demo;
    m.sync.hasItems = (store.db.settings.items || []).length > 0;
    m.sync.hasData = Object.keys(store.db.accounts).length > 0;
    m.sync.autoStartAvailable = app.isPackaged;
    m.cats = Object.entries(CATS).filter(([k]) => !['fatura'].includes(k)).map(([k, v]) => ({ id: k, label: v.label }));
    return m;
  });

  ipcMain.handle('sync:now', () => runSync(true));

  ipcMain.handle('secrets:save', async (e, { clientId, clientSecret }) => {
    clientId = String(clientId || '').trim();
    clientSecret = String(clientSecret || '').trim();
    if (!clientId || !clientSecret) return { ok: false, message: 'Preencha o Client ID e o Client Secret.' };
    try {
      await new PluggyClient(clientId, clientSecret).auth();
    } catch (err) {
      return { ok: false, message: err.message };
    }
    store.db.secrets = { clientId: enc(clientId), clientSecret: enc(clientSecret) };
    store.save();
    return { ok: true };
  });

  ipcMain.handle('items:add', (e, { id, label }) => {
    id = String(id || '').trim();
    if (!/^[0-9a-f-]{20,60}$/i.test(id)) return { ok: false, message: 'Esse código não parece um Item ID da Pluggy. Ele tem letras, números e hífens, como 1a2b3c4d-....' };
    const items = store.db.settings.items || [];
    if (items.some((x) => x.id === id)) return { ok: false, message: 'Esse banco já está na lista.' };
    items.push({ id, label: String(label || '').trim().slice(0, 40) });
    store.db.settings.items = items;
    store.save();
    return { ok: true };
  });

  ipcMain.handle('items:remove', (e, id) => {
    store.db.settings.items = (store.db.settings.items || []).filter((x) => x.id !== id);
    removeItem(store.db, id);
    store.save();
    return { ok: true };
  });

  ipcMain.handle('settings:save', (e, patch) => {
    const s = store.db.settings;
    if ('salario' in patch) { const v = parseMoney(patch.salario); if (!(v >= 0)) return { ok: false, message: 'O salário precisa ser um valor, como 6.500,00.' }; s.salario = v; }
    if ('metaReserva' in patch) { const v = parseMoney(patch.metaReserva); if (!(v >= 0)) return { ok: false, message: 'A meta precisa ser um valor, como 19.500,00.' }; s.metaReserva = v; }
    if ('investir' in patch) { const v = parseMoney(patch.investir); if (!(v >= 0)) return { ok: false, message: 'O investimento precisa ser um valor, como 500,00. Use 0 se não for investir.' }; s.investir = v; }
    if ('diaSalario' in patch) { const d = Math.round(Number(patch.diaSalario)); if (!(d >= 1 && d <= 28)) return { ok: false, message: 'O dia do salário precisa ser de 1 a 28.' }; s.diaSalario = d; }
    if ('reserveAccountId' in patch) s.reserveAccountId = String(patch.reserveAccountId || '');
    if ('cpf' in patch) { const d = String(patch.cpf || '').replace(/\D/g, ''); if (d && d.length !== 11) return { ok: false, message: 'O CPF tem 11 números.' }; s.cpf = d; }
    if ('syncHours' in patch) { s.syncHours = Math.min(12, Math.max(1, Math.round(Number(patch.syncHours) || 3))); schedule(); }
    if ('autoStart' in patch) { s.autoStart = !!patch.autoStart; applyAutoStart(); }
    store.save();
    return { ok: true };
  });

  ipcMain.handle('bills:save', (e, bill) => {
    try {
      const b = cleanBill(bill);
      const list = store.db.settings.bills || [];
      const i = list.findIndex((x) => x.id === b.id);
      b.criada = (i >= 0 && list[i].criada) || new Date().toISOString().slice(0, 10);
      if (i >= 0) list[i] = b; else list.push(b);
      store.db.settings.bills = list;
      store.save();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  });

  ipcMain.handle('bills:remove', (e, id) => {
    store.db.settings.bills = (store.db.settings.bills || []).filter((x) => x.id !== id);
    store.save();
    return { ok: true };
  });

  ipcMain.handle('bill:mark', (e, { month, id, paid }) => {
    const marks = store.db.billMarks || {};
    marks[month] = marks[month] || {};
    marks[month][id] = !!paid;
    store.db.billMarks = marks;
    store.save();
    return { ok: true };
  });

  ipcMain.handle('tx:category', (e, { id, cat }) => {
    if (!CATS[cat]) return { ok: false, message: 'Categoria desconhecida.' };
    store.db.catOverrides = store.db.catOverrides || {};
    store.db.catOverrides[id] = cat;
    store.save();
    return { ok: true };
  });

  ipcMain.handle('catrule:save', (e, { termo, cat }) => {
    termo = String(termo || '').trim().toLowerCase().slice(0, 60);
    if (termo.length < 3) return { ok: false, message: 'Escreva pelo menos 3 letras do nome, como fulana de tal.' };
    if (!CATS[cat]) return { ok: false, message: 'Categoria desconhecida.' };
    const list = (store.db.catRules || []).filter((r) => r.termo !== termo);
    list.push({ id: 'r' + Date.now().toString(36), termo, cat });
    store.db.catRules = list;
    store.save();
    return { ok: true };
  });

  ipcMain.handle('catrule:remove', (e, id) => {
    store.db.catRules = (store.db.catRules || []).filter((r) => r.id !== id);
    store.save();
    return { ok: true };
  });

  ipcMain.handle('manual:save', (e, m) => {
    const nome = String(m.nome || '').trim().slice(0, 40);
    if (!nome) return { ok: false, message: 'Dê um nome, como iFood.' };
    const list = store.db.manual || [];
    const id = m.id || ('m' + Date.now().toString(36));
    let item;
    if (m.tipo === 'credito') {
      const limite = parseMoney(m.limite);
      const gasto = parseMoney(m.gasto || '0');
      const dia = Math.round(Number(m.dia));
      if (!(limite >= 0)) return { ok: false, message: 'O limite precisa ser um valor, como 500,00.' };
      if (!(gasto >= 0)) return { ok: false, message: 'O gasto precisa ser um valor, como 120,00.' };
      if (!(dia >= 1 && dia <= 28)) return { ok: false, message: 'O dia do pagamento precisa ser de 1 a 28.' };
      const inicio = /^\d{4}-\d{2}$/.test(m.inicio || '') ? m.inicio : '';
      const prev = list.find((x) => x.id === id);
      item = { id, tipo: 'credito', nome, limite, gasto, dia, inicio, compras: (prev && prev.compras) || [], atualizado: new Date().toISOString() };
    } else {
      const valor = parseMoney(m.valor);
      if (!isFinite(valor)) return { ok: false, message: 'O valor precisa ser um número, como 150,00.' };
      item = { id, tipo: 'saldo', nome, valor, atualizado: new Date().toISOString() };
    }
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = item; else list.push(item);
    store.db.manual = list;
    store.save();
    return { ok: true };
  });

  ipcMain.handle('manual:compra', (e, c) => {
    const x = (store.db.manual || []).find((y) => y.id === c.creditId && y.tipo === 'credito');
    if (!x) return { ok: false, message: 'Não achei esse crédito.' };
    const valor = parseMoney(c.valor);
    if (!(valor > 0)) return { ok: false, message: 'O valor precisa ser maior que zero, como 70,00.' };
    const data = /^\d{4}-\d{2}-\d{2}$/.test(c.data || '') ? c.data : new Date().toISOString().slice(0, 10);
    x.compras = x.compras || [];
    x.compras.push({ id: 'c' + Date.now().toString(36), descricao: String(c.descricao || 'Compra').trim().slice(0, 60) || 'Compra', valor, data, cat: CATS[c.cat] ? c.cat : 'restaurantes' });
    x.atualizado = new Date().toISOString();
    store.save();
    return { ok: true };
  });

  ipcMain.handle('manual:compraRemove', (e, { creditId, compraId }) => {
    const x = (store.db.manual || []).find((y) => y.id === creditId);
    if (x) x.compras = (x.compras || []).filter((c) => c.id !== compraId);
    store.save();
    return { ok: true };
  });

  ipcMain.handle('manual:remove', (e, id) => {
    store.db.manual = (store.db.manual || []).filter((x) => x.id !== id);
    store.save();
    return { ok: true };
  });

  ipcMain.handle('demo:start', () => {
    const secrets = store.db.secrets;
    store.db = buildDemo();
    store.db.secrets = secrets || {};
    store.save();
    return { ok: true };
  });

  ipcMain.handle('demo:stop', () => {
    store.reset();
    return { ok: true };
  });

  ipcMain.handle('app:openExternal', (e, url) => {
    if (/^https:\/\/(meu\.pluggy\.ai|dashboard\.pluggy\.ai|docs\.pluggy\.ai|www\.pluggy\.ai|pluggy\.ai)(\/|$)/.test(url)) shell.openExternal(url);
    return { ok: true };
  });
}

// ---------- Início ----------
app.on('second-instance', showWindow);

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'));
  store.load();
  // "Saldo à mão" saiu do app: vira crédito, com o valor como limite.
  let migrou = false;
  for (const x of (store.db.manual || [])) {
    if (x.tipo !== 'credito') {
      x.tipo = 'credito'; x.limite = Number(x.valor) || 0; x.gasto = 0; x.dia = x.dia || 5; x.compras = x.compras || [];
      const d = new Date(); d.setMonth(d.getMonth() + 1);
      x.inicio = x.inicio || (d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
      delete x.valor; migrou = true;
    }
  }
  if (migrou) store.save();
  registerIpc();
  createWindow();
  createTray();
  applyAutoStart();
  schedule();
  setTimeout(() => runSync(false), 4000);
  powerMonitor.on('resume', () => setTimeout(() => runSync(false), 15000));
});

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', (e) => { /* continua na bandeja */ });
