'use strict';
// Assistente financeiro: monta um resumo dos dados do usuário e conversa pela API da OpenAI.

const { buildModel } = require('./rules');

const DEFAULT_MODEL = 'gpt-5.4-mini';
const FALLBACK_MODELS = ['gpt-5-mini', 'gpt-4.1-mini'];
const MAX_SAVED = 60;
const MAX_SENT = 16;

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const brl = (v) => 'R$ ' + r2(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function shift(key, n) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
}

// Texto com tudo que a IA precisa saber. Valores negativos são saídas.
function buildContext(db, now) {
  now = now || new Date();
  const cur = monthKey(now);
  const m = buildModel(db, { now });
  const s = m.settings || db.settings || {};
  const L = [];
  L.push('Hoje: ' + now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + '.');
  L.push('Salário líquido: ' + brl(s.salario) + ', cai por volta do dia ' + (s.diaSalario || '?') + ' (próximo: ' + m.plano.salarioDia + '). Quer investir por mês: ' + brl(s.investir) + '.');
  L.push('');
  L.push('## Agora');
  L.push('Saldo nas contas: ' + brl(m.plano.saldoContas) + ' (' + m.plano.contas.map((c) => c.nome + ' ' + brl(c.saldo)).join('; ') + ').');
  L.push('Livre até o salário (saldo menos o que vence antes dele): ' + brl(m.plano.livre) + '.');
  L.push('Vence antes do salário: ' + (m.plano.antes.map((x) => x.nome + ' ' + brl(x.valor) + ' em ' + x.dia).join('; ') || 'nada') + '.');
  L.push('Vai sair do próximo salário: ' + (m.plano.depois.map((x) => x.nome + ' ' + brl(x.valor) + ' em ' + x.dia).join('; ') || 'nada') + '. Sobra prevista do salário: ' + brl(m.plano.sobraSalario) + '.');
  if (m.reserva) L.push('Reserva: ' + m.reserva.conta + ' com ' + brl(m.reserva.saldo) + (m.reserva.meta ? ', meta ' + brl(m.reserva.meta) : '') + '.');
  L.push('');
  L.push('## Cartões de crédito');
  for (const c of m.cards) {
    L.push('- ' + c.nome + ': fatura atual ' + brl(c.atual.valor) + ' (' + c.atual.estado + ', vence ' + c.vence + '), limite ' + brl(c.limite) + ', livre ' + brl(c.livre) + (c.prox && c.prox.some((p) => !p.atual && p.valor) ? '. Anteriores: ' + c.prox.filter((p) => !p.atual && p.valor).map((p) => p.mes + ' ' + brl(p.valor) + ' ' + p.estado).join(', ') : '') + '.');
  }
  for (const c of (m.manualCredits || []).filter((x) => !m.cards.some((k) => k.nome === x.nome))) L.push('- ' + c.nome + ' (crédito fora do banco): limite ' + brl(c.limite) + ', usado ' + brl(c.gastoAtual) + ', livre ' + brl(c.livre) + ', paga todo dia ' + c.dia + '.');
  if (m.parcelas && m.parcelas.length) {
    L.push('');
    L.push('## Parcelas já comprometidas nas próximas faturas');
    for (const p of m.parcelas.slice(0, 8)) L.push('- ' + p.nome + ' ' + p.ano + ': ' + brl(p.total) + ' (' + p.itens.map((i) => i.nome + ' ' + i.parcela).join('; ') + ')');
  }
  if (m.metas && m.metas.length) {
    L.push('');
    L.push('## Metas');
    for (const g of m.metas) L.push('- ' + g.nome + ': tem ' + brl(g.atual) + ' de ' + brl(g.valor) + (g.prazoLabel ? ', prazo ' + g.prazoLabel + ', precisa guardar ' + brl(g.porMes) + ' por mês' : '') + (g.ritmo !== null ? '; sobra média dos últimos meses ' + brl(g.ritmo) : '') + '.');
  }
  if (m.limites && m.limites.length) {
    L.push('');
    L.push('## Limites mensais que ele definiu');
    for (const l of m.limites) L.push('- ' + l.label + ': gastou ' + brl(l.gasto) + ' de ' + brl(l.valor) + ' este mês.');
  }
  if (m.assinaturas && m.assinaturas.length) {
    L.push('');
    L.push('## Cobranças que se repetem todo mês');
    for (const a of m.assinaturas) L.push('- ' + a.nome + ': ' + brl(a.valor) + ' por mês' + (a.subiu ? ' (subiu de ' + brl(a.subiu.de) + ')' : ''));
  }
  L.push('');
  L.push('## Contas e despesas fixas deste mês');
  for (const b of m.bills) L.push('- ' + b.nome + ': ' + brl(b.valor) + (b.dia ? ', dia ' + b.dia : '') + (b.semanal ? ', toda semana' : '') + ' — ' + (b.status ? b.status.texto : (b.paid ? 'paga' : 'em aberto')) + '.');
  L.push('');
  L.push('## Mês a mês (gastos não incluem pagamento de fatura nem transferências entre contas próprias)');
  const months = [];
  for (let i = 3; i >= 0; i--) months.push(shift(cur, -i));
  const detail = [];
  for (const key of months) {
    const mm = key === cur ? m : buildModel(db, { now, month: key });
    if (!mm.totalGasto && !mm.renda.valor) continue;
    L.push('- ' + mm.month.nome + ' ' + mm.month.ano + (key === cur ? ' (em andamento)' : '') + ': renda ' + brl(mm.renda.valor) + ', gasto total ' + brl(mm.totalGasto) + '. Por categoria: ' + mm.categorias.map((c) => c.label + ' ' + brl(c.valor)).join(', ') + '.' + (mm.pixCredito && mm.pixCredito.qtd ? ' Pix no crédito: ' + brl(mm.pixCredito.total) + ' com ' + brl(mm.pixCredito.taxas) + ' de taxas.' : ''));
    if (months.indexOf(key) >= 1) detail.push(mm);
  }
  L.push('');
  L.push('## Lançamentos dos últimos meses (data | descrição | valor | categoria | conta | tipo)');
  const KIND = { expense: 'gasto', pix_credit: 'Pix no crédito', fee: 'taxa', card_payment: 'pagamento de fatura', card_payment_in: 'fatura recebida', transfer_out: 'transferência entre contas próprias', transfer_in: 'transferência entre contas próprias', income: 'entrada', yield: 'rendimento', refund: 'estorno' };
  let n = 0;
  for (const mm of detail.reverse()) {
    for (const t of mm.lancamentos) {
      if (n++ >= 450) break;
      L.push(t.data + '/' + mm.month.ano + ' | ' + t.nome + ' | ' + brl(t.valor) + ' | ' + t.catLabel + ' | ' + t.conta + ' | ' + (KIND[t.kind] || t.kind));
    }
  }
  return L.join('\n');
}

const INSTRUCTIONS = [
  'Você é o assistente financeiro pessoal do dono deste app (Meu Cofrin), um brasileiro solteiro.',
  'Converse em português do Brasil, de um jeito direto e amigável, como um amigo que entende de finanças. Respostas curtas por padrão; aprofunde quando pedirem.',
  'Use os dados abaixo, que vêm do Open Finance dele e são atualizados uma vez por dia. Cite números concretos e faça as contas certinho. Se faltar dado, diga o que falta em vez de inventar.',
  'Ajude a tirar dúvidas, entender para onde vai o dinheiro, planejar metas (como juntar para o apartamento), montar orçamento e comparar opções.',
  'Não recomende ativos específicos como se fosse uma ordem; explique as opções e os riscos para ele decidir. Lembre que você não é consultor financeiro certificado quando o assunto for investimento ou decisão grande.',
  'Formatação: texto simples, parágrafos curtos, listas com "- " e **negrito** só no essencial. Sem tabelas e sem títulos com #. Valores no formato R$ 1.234,56.'
].join('\n');

function extractText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text) return data.output_text;
  const parts = [];
  for (const o of (data && data.output) || []) {
    for (const c of o.content || []) if (c.type === 'output_text' && c.text) parts.push(c.text);
  }
  return parts.join('\n').trim();
}

async function callOpenAI(key, model, instructions, input) {
  const body = { model, instructions, input, max_output_tokens: 4000 };
  if (/^(gpt-5|o\d)/.test(model)) body.reasoning = { effort: 'low' };
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || ('OpenAI respondeu ' + res.status));
    err.status = res.status;
    err.code = data.error && data.error.code;
    throw err;
  }
  return extractText(data);
}

function friendly(err) {
  const msg = String(err.message || '');
  if (err.status === 401) return 'A OpenAI recusou a chave. Confira se colou a chave inteira em Bancos e ajustes.';
  if (err.status === 429 || /quota|billing|credit/i.test(msg)) return 'A OpenAI recusou por falta de crédito ou limite de uso. Confira em platform.openai.com/settings/organization/billing.';
  return 'A OpenAI não respondeu: ' + msg;
}

async function chat(db, text, env) {
  const key = env.dec(db.secrets && db.secrets.openai);
  if (!key) return { ok: false, message: 'Cole sua chave da OpenAI em Bancos e ajustes.' };
  text = String(text || '').trim().slice(0, 4000);
  if (!text) return { ok: false, message: 'Escreva uma pergunta.' };
  const history = (db.chat || []).slice(-MAX_SENT).map((x) => ({ role: x.role, content: x.content }));
  const input = history.concat([{ role: 'user', content: text }]);
  const instructions = INSTRUCTIONS + '\n\n# Dados financeiros dele\n' + buildContext(db);
  const chosen = (db.settings.ai && db.settings.ai.model) || DEFAULT_MODEL;
  const tries = [chosen].concat(FALLBACK_MODELS.filter((x) => x !== chosen));
  let reply = '';
  let used = chosen;
  for (const model of tries) {
    try {
      reply = await callOpenAI(key, model, instructions, input);
      used = model;
      break;
    } catch (err) {
      const missing = err.status === 404 || err.code === 'model_not_found' || /model/i.test(err.message) && err.status === 400;
      if (!missing || model === tries[tries.length - 1]) return { ok: false, message: friendly(err) };
    }
  }
  if (!reply) return { ok: false, message: 'A OpenAI devolveu uma resposta vazia. Tente de novo.' };
  const at = new Date().toISOString();
  db.chat = (db.chat || []).concat([{ role: 'user', content: text, at }, { role: 'assistant', content: reply, at }]).slice(-MAX_SAVED);
  if (used !== chosen) db.settings.ai = Object.assign({}, db.settings.ai, { model: used });
  return { ok: true, reply };
}

// Resumo da semana que fechou, escrito pela IA e guardado na conversa.
async function weekly(db, env) {
  const key = env.dec(db.secrets && db.secrets.openai);
  if (!key) return { ok: false, message: 'Sem chave da OpenAI.' };
  const instructions = INSTRUCTIONS + '\n\n# Dados financeiros dele\n' + buildContext(db);
  const pedido = 'Escreva a "conversa da semana": um resumo curto da semana que acabou (segunda a domingo), olhando os lançamentos. Diga quanto gastou na semana, onde mais gastou, se algo fugiu do normal, como está o mês até agora e uma sugestão prática para esta semana. Comece com "Resumo da semana:".';
  const chosen = (db.settings.ai && db.settings.ai.model) || DEFAULT_MODEL;
  const tries = [chosen].concat(FALLBACK_MODELS.filter((x) => x !== chosen));
  let reply = '';
  for (const model of tries) {
    try { reply = await callOpenAI(key, model, instructions, [{ role: 'user', content: pedido }]); break; } catch (err) {
      const missing = err.status === 404 || err.code === 'model_not_found' || /model/i.test(err.message) && err.status === 400;
      if (!missing || model === tries[tries.length - 1]) return { ok: false, message: friendly(err) };
    }
  }
  if (!reply) return { ok: false, message: 'Resposta vazia.' };
  const at = new Date().toISOString();
  db.chat = (db.chat || []).concat([{ role: 'assistant', content: reply, at, weekly: true }]).slice(-MAX_SAVED);
  db.weekly = { at };
  return { ok: true };
}

function mondayStart(now) {
  const d = new Date(now);
  const dow = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  return d;
}

async function testKey(key) {
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + key } });
  if (res.status === 401) throw new Error('A OpenAI recusou essa chave. Confira se copiou ela inteira.');
  if (!res.ok) throw new Error('Não consegui falar com a OpenAI (' + res.status + ').');
}

module.exports = { buildContext, chat, weekly, mondayStart, testKey, DEFAULT_MODEL };
