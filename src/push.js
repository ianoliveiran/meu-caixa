'use strict';
// Notificações no celular e no PC (web push). Decide o que avisar e manda para os aparelhos cadastrados.

const webpush = require('web-push');
const { buildModel } = require('./rules');

const PREFS_DEFAULT = { compras: true, contas: true, limites: true, lembretes: true, alertas: true, resumo: true };
// Endereço do site, usado como contato nas notificações. A Vercel preenche VERCEL_PROJECT_PRODUCTION_URL sozinha.
const SITE = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'https://vercel.com');
const DAY = 86400000;

function prefs(db) {
  return Object.assign({}, PREFS_DEFAULT, (db.push && db.push.prefs) || {});
}

function ensure(db) {
  if (!db.push || typeof db.push !== 'object') db.push = {};
  if (!Array.isArray(db.push.subs)) db.push.subs = [];
  if (!db.push.sent || typeof db.push.sent !== 'object') db.push.sent = {};
  return db.push;
}

const fmt = (v) => {
  const p = Math.abs(Number(v) || 0).toFixed(2).split('.');
  return 'R$ ' + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
};

// Chave de controle: lançamentos e alertas avisam uma vez; contas e lembretes uma vez por dia.
function keyFor(a, now) {
  const day = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  return a.tipo === 'conta' || a.tipo === 'lembrete' ? a.id + '@' + day : a.id;
}

// Marca o que já existe como avisado (para não chegar uma enxurrada quando ativa pela primeira vez).
function baseline(db, now) {
  const p = ensure(db);
  const m = buildModel(db, { now });
  for (const a of m.avisos || []) if (a.tipo !== 'conta' && a.tipo !== 'lembrete') p.sent[keyFor(a, now)] = +now;
}

function plan(db, now) {
  const p = ensure(db);
  const pr = prefs(db);
  const hour = now.getHours();
  const awake = hour >= 8 && hour < 22;
  const m = buildModel(db, { now });
  const out = [];
  const novas = [];
  const mark = [];
  for (const a of m.avisos || []) {
    const k = keyFor(a, now);
    if (p.sent[k]) continue;
    if (a.tipo === 'tx') {
      if (!pr.compras) { mark.push(k); continue; }
      if (awake) { novas.push(a); mark.push(k); }
    } else if (a.tipo === 'conta') {
      if (!pr.contas) continue;
      const urgente = /hoje|amanhã|Venceu/.test(a.texto);
      if (urgente && hour >= 9 && hour < 22) { out.push({ title: a.titulo + ' · ' + a.texto.replace(' e ainda não apareceu paga', ''), body: fmt(a.valor) + (a.atrasada ? ' · ainda não apareceu paga no extrato' : ''), url: '/#contas', tag: 'conta-' + a.id }); mark.push(k); }
    } else if (a.tipo === 'lembrete') {
      if (!pr.lembretes) continue;
      if (hour >= 8 && hour < 22) { out.push({ title: 'Lembrete: ' + a.titulo, body: a.texto, url: '/', tag: 'lembrete-' + a.id }); mark.push(k); }
    } else {
      const pref = a.tipo === 'limite' ? 'limites' : a.tipo === 'resumo' ? 'resumo' : 'alertas';
      if (!pr[pref]) { mark.push(k); continue; }
      if (!awake || (a.tipo === 'resumo' && hour < 9)) continue;
      out.push({ title: a.titulo, body: a.texto, url: a.tipo === 'resumo' ? '/' : '/#lanc', tag: a.tipo + '-' + a.id });
      mark.push(k);
    }
  }
  if (novas.length === 1) {
    const a = novas[0];
    out.unshift({ title: (a.valor > 0 ? 'Entrou ' : 'Nova compra · ') + fmt(a.valor), body: a.titulo + ' · ' + a.texto, url: '/#lanc', tag: 'tx' });
  } else if (novas.length > 1) {
    const total = novas.filter((a) => a.valor < 0).reduce((s, a) => s + Math.abs(a.valor), 0);
    out.unshift({ title: novas.length + ' lançamentos novos' + (total ? ' · ' + fmt(total) + ' em gastos' : ''), body: novas.slice(0, 4).map((a) => a.titulo + ' ' + (a.valor > 0 ? '+' : '') + fmt(a.valor)).join(' · ') + (novas.length > 4 ? '…' : ''), url: '/#lanc', tag: 'tx' });
  }
  return { out, mark };
}

function commit(db, mark, now) {
  const p = ensure(db);
  for (const k of mark) p.sent[k] = +now;
  for (const [k, t] of Object.entries(p.sent)) if (+now - t > 45 * DAY) delete p.sent[k];
}

// Manda para todos os aparelhos; aparelho que não existe mais (desinstalou, trocou de navegador) sai da lista.
async function send(db, notes, vapid) {
  const p = ensure(db);
  if (!notes.length || !p.subs.length || !vapid || !vapid.pub || !vapid.priv) return { enviadas: 0, removidos: 0 };
  webpush.setVapidDetails(SITE, vapid.pub, vapid.priv);
  let enviadas = 0;
  const mortos = new Set();
  for (const s of p.subs) {
    for (const n of notes) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(n), { TTL: 86400, urgency: 'normal', topic: String(n.tag || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || undefined });
        enviadas++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { mortos.add(s.endpoint); break; }
      }
    }
  }
  if (mortos.size) p.subs = p.subs.filter((s) => !mortos.has(s.endpoint));
  return { enviadas, removidos: mortos.size };
}

function newKeys() {
  return webpush.generateVAPIDKeys();
}

module.exports = { plan, commit, send, baseline, ensure, prefs, newKeys, PREFS_DEFAULT };
