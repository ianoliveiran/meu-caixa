'use strict';
// Criptografia no servidor. Uma chave só (SECRET_KEY, que existe apenas na Vercel) protege:
// - as chaves da Pluggy e da OpenAI (enc/dec);
// - os dados inteiros de cada conta no banco (seal/unseal): compactados e embaralhados com AES-256-GCM.
// Quem abre o Supabase vê só { v, enc } com um texto ilegível.

const crypto = require('crypto');
const zlib = require('zlib');

function key() {
  const k = Buffer.from(process.env.SECRET_KEY || '', 'base64');
  if (k.length !== 32) throw new Error('SECRET_KEY ausente ou inválida no servidor.');
  return k;
}

function encBuf(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}

function decBuf(b64) {
  const raw = Buffer.from(String(b64), 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]);
}

function enc(text) {
  if (!text) return '';
  return 'gcm:' + encBuf(Buffer.from(String(text), 'utf8'));
}

function dec(value) {
  if (!value || !String(value).startsWith('gcm:')) return '';
  try { return decBuf(String(value).slice(4)).toString('utf8'); } catch (e) { return ''; }
}

function seal(db) {
  return { v: 1, enc: encBuf(zlib.gzipSync(Buffer.from(JSON.stringify(db), 'utf8'))) };
}

// Aceita o formato antigo (dados abertos) para a primeira leitura depois da mudança.
function unseal(data) {
  if (data && typeof data === 'object' && data.v === 1 && typeof data.enc === 'string') {
    let buf;
    try { buf = decBuf(data.enc); } catch (e) { throw new Error('Não consegui abrir seus dados: a SECRET_KEY da Vercel não é a mesma que trancou os dados.'); }
    return JSON.parse(zlib.gunzipSync(buf).toString('utf8'));
  }
  return data || {};
}

module.exports = { enc, dec, seal, unseal };
