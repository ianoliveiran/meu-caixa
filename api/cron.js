'use strict';
// Roda de hora em hora, chamado pelo agendador do Supabase (pg_cron).
// Busca os bancos, vê o que tem de novo e manda as notificações.
process.env.TZ = 'America/Sao_Paulo';

const { enc, dec, seal, unseal } = require('../src/seal');
const { actions } = require('../src/actions');
const { emptyDb } = require('../src/store');
const push = require('../src/push');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';
async function rpc(fn, args) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  if (!res.ok) throw new Error(fn + ': ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json();
}

function hydrate(data) {
  const base = emptyDb();
  const db = Object.assign(base, unseal(data));
  db.settings = Object.assign(emptyDb().settings, db.settings || {});
  return db;
}

// Um usuário: sincroniza, decide os avisos e grava. Se o app gravou no meio do caminho, refaz com os dados novos.
async function runUser(secret, row, vapid) {
  const env = { enc, dec };
  let current = row;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const db = hydrate(current.data);
    const subs = push.ensure(db).subs.length;
    const configured = db.secrets && db.secrets.clientId && !db.settings.demo && (db.settings.items || []).length;
    const stale = !db.lastSync || Date.now() - new Date(db.lastSync) > 50 * 60 * 1000;
    if (configured && stale) { try { await actions['sync:now'](db, null, env); } catch (e) { /* segue com o que tem */ } }
    if (!subs && !(configured && stale)) return { pulou: true };
    const now = new Date();
    const { out, mark } = push.plan(db, now);
    const r = subs ? await push.send(db, out, vapid) : { enviadas: 0 };
    push.commit(db, mark, now);
    const ok = await rpc('cron_save', { p_secret: secret, p_user: current.user_id, p_data: seal(db), p_prev: current.updated_at });
    if (ok) return { avisos: out.length, enviadas: r.enviadas };
    const again = (await rpc('cron_states', { p_secret: secret })).find((x) => x.user_id === current.user_id);
    if (!again) return { erro: 'sumiu' };
    current = again;
  }
  return { erro: 'conflito' };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const secret = String(req.headers['x-cron-secret'] || '');
  if (!secret || secret.length < 32) { res.statusCode = 401; return res.end('{"error":"sem acesso"}'); }
  try {
    const rows = await rpc('cron_states', { p_secret: secret });
    if (!rows.length) { res.statusCode = 401; return res.end('{"error":"sem acesso"}'); }
    const vapid = (await rpc('vapid_get', { p_secret: secret }))[0] || null;
    const out = [];
    for (const row of rows) {
      try { out.push(await runUser(secret, row, vapid)); } catch (e) { out.push({ erro: e.message }); }
    }
    return res.end(JSON.stringify({ ok: true, usuarios: out }));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: e.message }));
  }
};
