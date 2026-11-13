'use strict';
// Ações do app (as mesmas da versão de Windows), sem depender do Electron.
// Usadas pela versão web: cada ação recebe o banco (objeto), o argumento e o ambiente.

const assistant = require('./assistant');
const push = require('./push');
const { buildModel, CATS } = require('./rules');
const { PluggyClient } = require('./pluggy');
const { syncAll, removeItem } = require('./sync');
const { buildDemo } = require('./demo');
const { emptyDb } = require('./store');

const BILL_ICONS = ['moradia', 'luz', 'agua', 'internet', 'celular', 'academia', 'contas', 'saude', 'educacao', 'assinaturas', 'transporte', 'cartao', 'outros'];
const STALE_MS = 6 * 3600 * 1000;

function parseMoney(v) {
  if (typeof v === 'number') return v;
  const n = Number(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

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

function client(db, env) {
  const sec = db.secrets || {};
  const id = env.dec(sec.clientId);
  const secret = env.dec(sec.clientSecret);
  if (!id || !secret) return null;
  return new PluggyClient(id, secret);
}

async function runSync(db, env) {
  if (db.settings.demo) return { ok: false, message: 'No modo de exemplo não há sincronização. Conecte seus bancos em Bancos e ajustes.' };
  const c = client(db, env);
  if (!c) return { ok: false, message: 'Falta o Client ID e o Client Secret da Pluggy em Bancos e ajustes.' };
  try {
    const res = await syncAll(db, c);
    return { ok: !res.errors.length, message: res.errors.length ? res.errors.join(' · ') : null, novas: res.novas.length, changed: true };
  } catch (e) {
    db.lastSyncError = e.message;
    return { ok: false, message: e.message, changed: true };
  }
}

// Cada ação devolve { result, changed }. "changed" diz se precisa gravar o banco.
const actions = {
  'model:get': async (db, month, env) => {
    let migrou = false;
    // Quem já tinha um crédito cadastrado (como o do iFood) continua vendo; para os outros, vem desligado.
    if (!db.settings.features || db.settings.features.creditos === undefined) {
      db.settings.features = Object.assign({}, db.settings.features || {}, { creditos: (db.manual || []).some((x) => x.tipo === 'credito') });
      migrou = true;
    }
    const m = buildModel(db, { month: /^\d{4}-\d{2}$/.test(month || '') ? month : undefined });
    const configured = !!(db.secrets && db.secrets.clientId);
    m.sync.syncing = false;
    m.sync.configured = configured || !!db.settings.demo;
    m.sync.hasItems = (db.settings.items || []).length > 0;
    m.sync.hasData = Object.keys(db.accounts || {}).length > 0;
    m.sync.autoStartAvailable = false;
    m.sync.web = true;
    m.sync.stale = configured && !db.settings.demo && m.sync.hasItems && (!db.lastSync || (Date.now() - new Date(db.lastSync)) > STALE_MS);
    if (Array.isArray(db.chat) && db.chat.length > 0) migrou = true;
    const chats = assistant.migrateChats(db);
    const atual = chats.find((c) => c.id === db.chatAtual) || null;
    m.ai = {
      configured: !!(db.secrets && db.secrets.openai),
      model: (db.settings.ai && db.settings.ai.model) || assistant.DEFAULT_MODEL,
      atual: atual ? atual.id : null,
      conversas: chats.map((c) => ({ id: c.id, titulo: c.titulo, atualizada: c.atualizada, qtd: c.msgs.length })),
      messages: atual ? atual.msgs.map((x) => ({ role: x.role, content: x.content, at: x.at, acoes: x.acoes || null })) : []
    };
    const pp = push.ensure(db);
    m.push = { prefs: push.prefs(db), aparelhos: pp.subs.map((x) => ({ endpoint: x.endpoint, device: x.device, criado: x.criado })) };
    m.cats = Object.entries(CATS).filter(([k]) => k !== 'fatura').map(([k, v]) => ({ id: k, label: v.label }));
    return { result: m, changed: migrou };
  },

  'sync:now': async (db, arg, env) => {
    const r = await runSync(db, env);
    return { result: r, changed: !!r.changed };
  },

  'secrets:save': async (db, { clientId, clientSecret } = {}, env) => {
    clientId = String(clientId || '').trim();
    clientSecret = String(clientSecret || '').trim();
    if (!clientId || !clientSecret) return { result: { ok: false, message: 'Preencha o Client ID e o Client Secret.' } };
    try {
      await new PluggyClient(clientId, clientSecret).auth();
    } catch (err) {
      return { result: { ok: false, message: err.message } };
    }
    db.secrets = Object.assign({}, db.secrets, { clientId: env.enc(clientId), clientSecret: env.enc(clientSecret) });
    return { result: { ok: true }, changed: true };
  },

  'ai:key': async (db, { key, model } = {}, env) => {
    key = String(key || '').trim();
    model = String(model || '').trim();
    if (model && !/^[a-z0-9][a-z0-9.\-]{1,60}$/i.test(model)) return { result: { ok: false, message: 'Esse nome de modelo não parece certo.' } };
    if (key) {
      if (!/^sk-/.test(key)) return { result: { ok: false, message: 'A chave da OpenAI começa com sk-. Confira se copiou ela inteira.' } };
      try { await assistant.testKey(key); } catch (err) { return { result: { ok: false, message: err.message } }; }
      db.secrets = Object.assign({}, db.secrets, { openai: env.enc(key) });
    }
    if (model) db.settings.ai = Object.assign({}, db.settings.ai, { model });
    return { result: { ok: true }, changed: true };
  },

  'ai:send': async (db, text, env) => {
    const res = await assistant.chat(db, text, env);
    return { result: res, changed: !!res.ok };
  },

  'features:save': async (db, patch = {}) => {
    const { FEATURE_DEFAULTS } = require('./insights');
    const cur = Object.assign({}, db.settings.features || {});
    for (const k of Object.keys(patch)) if (k in FEATURE_DEFAULTS) cur[k] = !!patch[k];
    db.settings.features = cur;
    return { result: { ok: true }, changed: true };
  },

  'meta:save': async (db, g = {}) => {
    const nome = String(g.nome || '').trim().slice(0, 60);
    const valor = parseMoney(g.valor);
    if (!nome) return { result: { ok: false, message: 'Dê um nome para a meta, como Apartamento.' } };
    if (!(valor > 0)) return { result: { ok: false, message: 'Coloque o valor da meta, como 60.000,00.' } };
    const prazo = /^\d{4}-\d{2}$/.test(g.prazo || '') ? g.prazo : '';
    const fonte = String(g.fonte || g.contaId || '');
    const contaId = fonte.startsWith('bill:') ? '' : fonte;
    const billId = fonte.startsWith('bill:') ? fonte.slice(5) : '';
    if (billId && !(db.settings.bills || []).some((b) => b.id === billId)) return { result: { ok: false, message: 'Não achei essa despesa fixa.' } };
    const guardado = contaId ? 0 : (parseMoney(g.guardado) || 0);
    const desde = billId && /^\d{4}-\d{2}$/.test(g.desde || '') ? g.desde : '';
    const list = db.settings.metas || [];
    const id = g.id && list.some((x) => x.id === g.id) ? g.id : 'meta-' + Date.now().toString(36);
    const contaExtra = billId ? String(g.contaExtra || '') : '';
    const item = { id, nome, valor, prazo, contaId, billId, desde, guardado, contaExtra };
    db.settings.metas = list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? item : x)) : list.concat([item]);
    return { result: { ok: true }, changed: true };
  },

  'meta:remove': async (db, id) => {
    db.settings.metas = (db.settings.metas || []).filter((x) => x.id !== id);
    return { result: { ok: true }, changed: true };
  },

  'limites:save': async (db, lim = {}) => {
    const out = {};
    for (const [c, v] of Object.entries(lim)) {
      if (!CATS[c]) continue;
      const n = parseMoney(v);
      if (n > 0) out[c] = n;
    }
    db.settings.limites = out;
    return { result: { ok: true }, changed: true };
  },

  'notif:seen': async (db) => {
    db.settings.notifSeen = Date.now();
    return { result: { ok: true }, changed: true };
  },

  'fixado:toggle': async (db, x = {}) => {
    const termo = String(x.termo || '').trim().slice(0, 60);
    if (!termo) return { result: { ok: false, message: 'Não consegui identificar esse lançamento.' } };
    const list = db.settings.fixados || [];
    const tem = list.some((f) => f.termo === termo);
    db.settings.fixados = tem ? list.filter((f) => f.termo !== termo) : list.concat([{ termo, nome: String(x.nome || termo).slice(0, 80) }]).slice(-20);
    return { result: { ok: true, fixado: !tem }, changed: true };
  },

  'lembrete:save': async (db, x = {}) => {
    const texto = String(x.texto || '').trim().slice(0, 200);
    if (!texto) return { result: { ok: false, message: 'Escreva o lembrete.' } };
    const data = /^\d{4}-\d{2}-\d{2}$/.test(x.data || '') ? x.data : '';
    const list = db.lembretes || [];
    if (x.id && list.some((l) => l.id === x.id)) db.lembretes = list.map((l) => (l.id === x.id ? Object.assign({}, l, { texto, data }) : l));
    else db.lembretes = list.concat([{ id: 'l-' + Date.now().toString(36), texto, data, criado: new Date().toISOString(), origem: 'manual', feito: false }]);
    return { result: { ok: true }, changed: true };
  },

  'lembrete:done': async (db, id) => {
    db.lembretes = (db.lembretes || []).filter((l) => l.id !== id);
    return { result: { ok: true }, changed: true };
  },

  'push:subscribe': async (db, x = {}) => {
    const sub = x.sub || {};
    if (!/^https:\/\//.test(sub.endpoint || '') || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return { result: { ok: false, message: 'O navegador não mandou a inscrição direito. Tente de novo.' } };
    const p = push.ensure(db);
    if (!p.subs.length) push.baseline(db, new Date());
    p.subs = p.subs.filter((s) => s.endpoint !== sub.endpoint).concat([{ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, device: String(x.device || 'Aparelho').slice(0, 60), criado: new Date().toISOString() }]).slice(-10);
    return { result: { ok: true }, changed: true };
  },

  'push:unsubscribe': async (db, endpoint) => {
    const p = push.ensure(db);
    p.subs = p.subs.filter((s) => s.endpoint !== endpoint);
    return { result: { ok: true }, changed: true };
  },

  'push:prefs': async (db, patch = {}) => {
    const p = push.ensure(db);
    const cur = Object.assign({}, p.prefs || {});
    for (const k of Object.keys(patch)) if (k in push.PREFS_DEFAULT) cur[k] = !!patch[k];
    p.prefs = cur;
    return { result: { ok: true }, changed: true };
  },

  'ai:clear': async (db) => {
    assistant.migrateChats(db);
    db.chatAtual = null;
    return { result: { ok: true }, changed: true };
  },

  'ai:open': async (db, id) => {
    assistant.migrateChats(db);
    if (!db.chats.some((c) => c.id === id)) return { result: { ok: false, message: 'Essa conversa não existe mais.' } };
    db.chatAtual = id;
    return { result: { ok: true }, changed: true };
  },

  'ai:delete': async (db, id) => {
    assistant.migrateChats(db);
    db.chats = db.chats.filter((c) => c.id !== id);
    if (db.chatAtual === id) db.chatAtual = null;
    return { result: { ok: true }, changed: true };
  },

  'ai:forget': async (db) => {
    if (db.secrets) delete db.secrets.openai;
    return { result: { ok: true }, changed: true };
  },

  'items:add': async (db, { id, label } = {}) => {
    id = String(id || '').trim();
    if (!/^[0-9a-f-]{20,60}$/i.test(id)) return { result: { ok: false, message: 'Esse código não parece um Item ID da Pluggy. Ele tem letras, números e hífens, como 1a2b3c4d-....' } };
    const items = db.settings.items || [];
    if (items.some((x) => x.id === id)) return { result: { ok: false, message: 'Esse banco já está na lista.' } };
    items.push({ id, label: String(label || '').trim().slice(0, 40) });
    db.settings.items = items;
    return { result: { ok: true }, changed: true };
  },

  'items:remove': async (db, id) => {
    db.settings.items = (db.settings.items || []).filter((x) => x.id !== id);
    removeItem(db, id);
    return { result: { ok: true }, changed: true };
  },

  'settings:save': async (db, patch = {}) => {
    const s = db.settings;
    const fail = (message) => ({ result: { ok: false, message } });
    if ('salario' in patch) { const v = parseMoney(patch.salario); if (!(v >= 0)) return fail('O salário precisa ser um valor, como 6.500,00.'); s.salario = v; }
    if ('investir' in patch) { const v = parseMoney(patch.investir); if (!(v >= 0)) return fail('O investimento precisa ser um valor, como 500,00. Use 0 se não for investir.'); s.investir = v; }
    if ('diaSalario' in patch) { const d = Math.round(Number(patch.diaSalario)); if (!(d >= 1 && d <= 28)) return fail('O dia do salário precisa ser de 1 a 28.'); s.diaSalario = d; }
    if ('reserveAccountId' in patch) s.reserveAccountId = String(patch.reserveAccountId || '');
    if ('cpf' in patch) { const d = String(patch.cpf || '').replace(/\D/g, ''); if (d && d.length !== 11) return fail('O CPF tem 11 números.'); s.cpf = d; }
    return { result: { ok: true }, changed: true };
  },

  'bills:save': async (db, bill = {}) => {
    try {
      const b = cleanBill(bill);
      const list = db.settings.bills || [];
      const i = list.findIndex((x) => x.id === b.id);
      b.criada = (i >= 0 && list[i].criada) || new Date().toISOString().slice(0, 10);
      if (i >= 0) list[i] = b; else list.push(b);
      db.settings.bills = list;
      return { result: { ok: true }, changed: true };
    } catch (err) {
      return { result: { ok: false, message: err.message } };
    }
  },

  'bills:remove': async (db, id) => {
    db.settings.bills = (db.settings.bills || []).filter((x) => x.id !== id);
    return { result: { ok: true }, changed: true };
  },

  'bill:mark': async (db, { month, id, paid } = {}) => {
    if (!/^\d{4}-\d{2}$/.test(month || '')) return { result: { ok: false, message: 'Mês inválido.' } };
    const marks = db.billMarks || {};
    marks[month] = marks[month] || {};
    marks[month][String(id)] = !!paid;
    db.billMarks = marks;
    return { result: { ok: true }, changed: true };
  },

  'tx:category': async (db, { id, cat } = {}) => {
    if (!CATS[cat]) return { result: { ok: false, message: 'Categoria desconhecida.' } };
    db.catOverrides = db.catOverrides || {};
    db.catOverrides[String(id)] = cat;
    return { result: { ok: true }, changed: true };
  },

  'catrule:save': async (db, { termo, cat } = {}) => {
    termo = String(termo || '').trim().toLowerCase().slice(0, 60);
    if (termo.length < 3) return { result: { ok: false, message: 'Escreva pelo menos 3 letras do nome, como fulana de tal.' } };
    if (!CATS[cat]) return { result: { ok: false, message: 'Categoria desconhecida.' } };
    const list = (db.catRules || []).filter((r) => r.termo !== termo);
    list.push({ id: 'r' + Date.now().toString(36), termo, cat });
    db.catRules = list;
    return { result: { ok: true }, changed: true };
  },

  'catrule:remove': async (db, id) => {
    db.catRules = (db.catRules || []).filter((r) => r.id !== id);
    return { result: { ok: true }, changed: true };
  },

  'manual:save': async (db, m = {}) => {
    const nome = String(m.nome || '').trim().slice(0, 40);
    if (!nome) return { result: { ok: false, message: 'Dê um nome, como iFood.' } };
    const list = db.manual || [];
    const id = m.id || ('m' + Date.now().toString(36));
    const limite = parseMoney(m.limite);
    const gasto = parseMoney(m.gasto || '0');
    const dia = Math.round(Number(m.dia));
    if (!(limite >= 0)) return { result: { ok: false, message: 'O limite precisa ser um valor, como 500,00.' } };
    if (!(gasto >= 0)) return { result: { ok: false, message: 'O gasto precisa ser um valor, como 120,00.' } };
    if (!(dia >= 1 && dia <= 28)) return { result: { ok: false, message: 'O dia do pagamento precisa ser de 1 a 28.' } };
    const inicio = /^\d{4}-\d{2}$/.test(m.inicio || '') ? m.inicio : '';
    const prev = list.find((x) => x.id === id);
    const item = { id, tipo: 'credito', nome, limite, gasto, dia, inicio, compras: (prev && prev.compras) || [], atualizado: new Date().toISOString() };
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = item; else list.push(item);
    db.manual = list;
    return { result: { ok: true }, changed: true };
  },

  'manual:compra': async (db, c = {}) => {
    const x = (db.manual || []).find((y) => y.id === c.creditId && y.tipo === 'credito');
    if (!x) return { result: { ok: false, message: 'Não achei esse crédito.' } };
    const valor = parseMoney(c.valor);
    if (!(valor > 0)) return { result: { ok: false, message: 'O valor precisa ser maior que zero, como 70,00.' } };
    const data = /^\d{4}-\d{2}-\d{2}$/.test(c.data || '') ? c.data : new Date().toISOString().slice(0, 10);
    x.compras = x.compras || [];
    x.compras.push({ id: 'c' + Date.now().toString(36), descricao: String(c.descricao || 'Compra').trim().slice(0, 60) || 'Compra', valor, data, cat: CATS[c.cat] ? c.cat : 'restaurantes' });
    x.atualizado = new Date().toISOString();
    return { result: { ok: true }, changed: true };
  },

  'manual:compraRemove': async (db, { creditId, compraId } = {}) => {
    const x = (db.manual || []).find((y) => y.id === creditId);
    if (x) x.compras = (x.compras || []).filter((c) => c.id !== compraId);
    return { result: { ok: true }, changed: true };
  },

  'manual:remove': async (db, id) => {
    db.manual = (db.manual || []).filter((x) => x.id !== id);
    return { result: { ok: true }, changed: true };
  },

  'demo:start': async (db) => {
    const secrets = db.secrets;
    const demo = buildDemo();
    for (const k of Object.keys(db)) delete db[k];
    Object.assign(db, demo, { secrets: secrets || {} });
    return { result: { ok: true }, changed: true };
  },

  'demo:stop': async (db) => {
    const secrets = db.secrets;
    for (const k of Object.keys(db)) delete db[k];
    Object.assign(db, emptyDb(), { secrets: secrets || {} });
    return { result: { ok: true }, changed: true };
  },

  // Traz o arquivo do app de Windows. As credenciais de lá não servem aqui
  // (são criptografadas pelo Windows), então ficam de fora.
  'import:desktop': async (db, data) => {
    if (!data || typeof data !== 'object' || !data.settings || !data.transactions) {
      return { result: { ok: false, message: 'Esse arquivo não parece o meu-caixa.json do app de Windows.' } };
    }
    const keep = ['items', 'accounts', 'transactions', 'billsByAccount', 'accountSync', 'manual', 'billMarks', 'catOverrides', 'catRules', 'lastSync', 'lastSyncError'];
    const secrets = db.secrets;
    const chat = db.chat;
    const chats = db.chats;
    const chatAtual = db.chatAtual;
    const ai = db.settings && db.settings.ai;
    const base = emptyDb();
    for (const k of Object.keys(db)) delete db[k];
    Object.assign(db, base);
    for (const k of keep) if (data[k] !== undefined) db[k] = data[k];
    const s = Object.assign({}, data.settings);
    delete s.autoStart; delete s.syncHours; delete s.trayHintShown; delete s.demo;
    db.settings = Object.assign(base.settings, s, { demo: false });
    db.secrets = secrets || {};
    if (chat) db.chat = chat;
    if (chats) { db.chats = chats; db.chatAtual = chatAtual; }
    if (ai) db.settings.ai = ai;
    // Sem as credenciais, a próxima sincronização refaz só a janela recente.
    return { result: { ok: true, transacoes: Object.keys(db.transactions || {}).length }, changed: true };
  }
};

module.exports = { actions, parseMoney, cleanBill };
