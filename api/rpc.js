'use strict';
// Datas no horário de Brasília (o servidor roda em UTC).
process.env.TZ = 'America/Sao_Paulo';
// Única rota da versão web. Confere o login no Supabase, carrega o banco do usuário,
// roda a ação e grava de volta. O banco só aceita leitura e escrita do próprio dono (RLS).

const crypto = require('crypto');
const { actions } = require('../src/actions');
const { emptyDb } = require('../src/store');
const push = require('../src/push');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';
const SECRET_KEY = process.env.SECRET_KEY || '';

// Client Secret da Pluggy fica criptografado (AES-256-GCM) com uma chave que só existe na Vercel.
function key() {
  const k = Buffer.from(SECRET_KEY, 'base64');
  if (k.length !== 32) throw new Error('SECRET_KEY ausente ou inválida no servidor.');
  return k;
}
function enc(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return 'gcm:' + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}
function dec(value) {
  if (!value || !String(value).startsWith('gcm:')) return '';
  try {
    const raw = Buffer.from(String(value).slice(4), 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
  } catch (e) {
    return '';
  }
}

async function supa(path, token, opts) {
  const o = opts || {};
  const res = await fetch(SUPABASE_URL + path, {
    method: o.method || 'GET',
    headers: Object.assign({ apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, o.headers || {}),
    body: o.body
  });
  return res;
}

async function getUser(token) {
  const res = await supa('/auth/v1/user', token);
  if (!res.ok) return null;
  return res.json();
}

// Sem filtro por id: o RLS só devolve a linha do dono do token. Assim dá para buscar em paralelo com o login.
async function loadState(token) {
  const res = await supa('/rest/v1/app_state?select=data&limit=1', token);
  if (!res.ok) throw new Error('Não consegui ler seus dados (' + res.status + ').');
  const rows = await res.json();
  const base = emptyDb();
  if (!rows.length) return base;
  const db = Object.assign(base, rows[0].data || {});
  db.settings = Object.assign(emptyDb().settings, db.settings || {});
  return db;
}

async function saveState(token, userId, db) {
  const res = await supa('/rest/v1/app_state?on_conflict=user_id', token, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, data: db, updated_at: new Date().toISOString() })
  });
  if (!res.ok) throw new Error('Não consegui salvar seus dados (' + res.status + ').');
}

async function rpcCall(token, fn, args) {
  const res = await supa('/rest/v1/rpc/' + fn, token, { method: 'POST', body: JSON.stringify(args || {}) });
  if (!res.ok) throw new Error('Supabase recusou ' + fn + ' (' + res.status + ').');
  return res.json();
}

// Chave pública das notificações; na primeira vez, cria o par de chaves e guarda no banco.
async function vapidKeys(token) {
  let rows = await rpcCall(token, 'vapid_keys');
  let k = rows && rows[0];
  if (!k || !k.pub) {
    const fresh = push.newKeys();
    await rpcCall(token, 'vapid_init', { p_pub: fresh.publicKey, p_priv: fresh.privateKey });
    rows = await rpcCall(token, 'vapid_keys');
    k = rows && rows[0];
  }
  return k;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Servidor sem configuração do Supabase.');
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const [user, loaded] = token ? await Promise.all([getUser(token), loadState(token).catch((e) => e)]) : [null, null];
    if (!user || !user.id) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'login' }));
    }
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    const { action, arg, month } = body || {};
    if (action === 'push:key') {
      const k = await vapidKeys(token);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ result: { ok: true, key: k.pub } }));
    }
    if (action === 'push:test') {
      if (loaded instanceof Error) throw loaded;
      const k = await vapidKeys(token);
      const r = await push.send(loaded, [{ title: 'Meu Cofrin', body: 'Notificações ligadas! É assim que os avisos vão chegar.', url: '/', tag: 'teste' }], k);
      await saveState(token, user.id, loaded);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ result: { ok: r.enviadas > 0, enviadas: r.enviadas, message: r.enviadas ? null : 'Nenhum aparelho recebeu. Ative as notificações neste aparelho primeiro.' } }));
    }
    const fn = actions[action];
    if (!fn) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'ação desconhecida' })); }

    if (loaded instanceof Error) throw loaded;
    const db = loaded;
    const env = { enc, dec };
    const out = await fn(db, arg, env);
    // Quem mudou algo já recebe o painel atualizado: economiza uma ida ao servidor.
    const model = out.changed && action !== 'model:get' ? (await actions['model:get'](db, month, env)).result : undefined;
    if (out.changed) await saveState(token, user.id, db);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ result: out.result, model }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: e.message || 'Erro no servidor.' }));
  }
};
