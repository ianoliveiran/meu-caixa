'use strict';
const { buildInsights, features } = require('./insights');
// Regras que transformam os dados brutos da Pluggy no que o painel mostra.
// Tudo aqui é função pura: recebe o banco local e devolve números prontos.

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CATS = {
  mercado: { label: 'Mercado' },
  restaurantes: { label: 'Restaurantes' },
  transporte: { label: 'Transporte' },
  saude: { label: 'Saúde' },
  assinaturas: { label: 'Assinaturas' },
  compras: { label: 'Compras' },
  moradia: { label: 'Moradia' },
  contas: { label: 'Contas da casa' },
  lazer: { label: 'Lazer' },
  educacao: { label: 'Educação' },
  pix: { label: 'Pix e transferências' },
  taxas: { label: 'Taxas e juros' },
  renda: { label: 'Renda' },
  reserva: { label: 'Entre suas contas' },
  fatura: { label: 'Pagamento de fatura' },
  outros: { label: 'Outros' }
};

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function digits(s) {
  return String(s || '').replace(/\D/g, '');
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  // Datas "YYYY-MM-DD" viram meia-noite local, não UTC.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?Z)?$/.exec(v);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  return new Date(v);
}

function monthKey(d) {
  const x = toDate(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
}

function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKey(d);
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return { nome: MESES[m - 1], curto: MESES_CURTOS[m - 1], ano: y };
}

function dayDiff(a, b) {
  return Math.round((toDate(a) - toDate(b)) / 86400000);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Valor com sinal: saída negativa, entrada positiva, independente da convenção do banco.
function signed(tx) {
  const a = Math.abs(Number(tx.amount) || 0);
  return tx.type === 'DEBIT' ? -a : a;
}

function txText(tx) {
  const pd = tx.paymentData || {};
  const parts = [tx.description, tx.descriptionRaw, tx.merchant && tx.merchant.name, tx.merchant && tx.merchant.businessName,
    pd.receiver && pd.receiver.name, pd.payer && pd.payer.name];
  return norm(parts.filter(Boolean).join(' | '));
}

// ---------- Categorias ----------

const CATEGORY_RULES = [
  ['fatura', /credit card payment|pagamento de cartao|pagamento de fatura/],
  ['reserva', /investment|investimento|savings|poupanca/],
  ['renda', /salary|salario|income|renda|wages|proventos/],
  ['mercado', /grocer|supermarket|supermercado|mercado|food and drink.*grocer/],
  ['restaurantes', /restaurant|eating out|food delivery|delivery|bar|cafe|lanchonete|padaria|bakery|fast food/],
  ['transporte', /transport|taxi|ride|gas station|fuel|parking|toll|combustivel|estacionamento|pedagio|uber/],
  ['saude', /health|pharmac|drugstore|farmacia|hospital|clinic|dentist|medic|gym|fitness|academia/],
  ['assinaturas', /streaming|digital service|subscription|assinatura|software/],
  ['compras', /shopping|online shopping|electronics|clothing|department|marketplace|compras|vestuario/],
  ['moradia', /rent|aluguel|housing|moradia|condominium|condominio|mortgage/],
  ['contas', /utilit|electric|energia|water|agua|internet|telecom|mobile|phone|telefon|gas\b/],
  ['lazer', /leisure|entertainment|travel|hotel|airline|ticket|cinema|lazer|viagem|games/],
  ['educacao', /education|school|course|university|educacao|escola|curso|book/],
  ['taxas', /tax|fee|interest|iof|juros|tarifa|encargo|bank fee/],
  ['pix', /transfer|pix|ted|doc\b/]
];

const DESC_RULES = [
  ['mercado', /supermerc|\bsuperm\b|mercado(?! pago| livre|livre)|atacad|assai|carrefour|pao de acucar|hortifruti|sacolao|zaffari|dia%|extra |big |sams club|acougue|padaria/],
  ['restaurantes', /ifood|rappi|ze delivery|restaurante|lanchonete|pizzaria|burger|mcdonald|bk |outback|starbucks|cafe|bar e|churrasc|sushi|food/],
  ['transporte', /uber|\b99\b|99app|99 tecnologia|\bposto\b|combust|shell|ipiranga|petrobras|br mania|estaciona|sem parar|conectcar|veloe|metro|bilhete unico|cabify|onibus|passagem/],
  ['saude', /farmacia|drogaria|droga raia|drogasil|pague menos|panvel|hospital|clinica|laborator|odonto|unimed|amil|hapvida|smart ?fit|academia|bluefit/],
  ['assinaturas', /netflix|spotify|prime video|amazon prime|disney|hbo|max\.com|globoplay|youtube|deezer|apple\.com|icloud|google (one|play|storage)|chatgpt|openai|microsoft|xbox|playstation|crunchyroll|paramount|claude/],
  ['compras', /amazon|mercadolivre|mercado livre|shopee|magalu|magazine luiza|aliexpress|shein|americanas|casas bahia|kabum|renner|riachuelo|c&a|zara|centauro|netshoes|decathlon/],
  ['moradia', /aluguel|condominio|imobiliaria|quinto andar|quintoandar/],
  ['contas', /enel|light s|cemig|copel|celesc|coelba|neoenergia|energisa|cpfl|sabesp|cedae|copasa|sanepar|comgas|naturgy|vivo|claro|tim |oi |nextel|net servicos|internet|telefon/],
  ['lazer', /ingresso|cinema|cinemark|sympla|eventim|steam|airbnb|booking|decolar|latam|gol linhas|azul linhas|hotel/],
  ['educacao', /escola|faculdade|universidade|curso|udemy|alura|livraria/]
];

const MCC_RULES = [
  ['mercado', [[5411, 5411], [5422, 5422], [5441, 5462], [5499, 5499]]],
  ['restaurantes', [[5812, 5814]]],
  ['transporte', [[4111, 4131], [4784, 4784], [5541, 5542], [7523, 7523], [4121, 4121]]],
  ['saude', [[5912, 5912], [8011, 8099], [7997, 7997]]],
  ['assinaturas', [[4899, 4899], [5815, 5818]]],
  ['contas', [[4812, 4816], [4900, 4900]]],
  ['lazer', [[7832, 7841], [7922, 7999], [3000, 3350], [4511, 4511], [7011, 7011]]],
  ['educacao', [[8211, 8299], [5942, 5942]]],
  ['compras', [[5300, 5399], [5600, 5699], [5732, 5734], [5942, 5999], [5200, 5299]]]
];

function categoryFor(tx) {
  const text = txText(tx);
  for (const [cat, re] of DESC_RULES) if (re.test(text)) return cat;
  const pc = norm(tx.category);
  if (pc) {
    if (/gaming|games/.test(pc)) return 'lazer';
    for (const [cat, re] of CATEGORY_RULES) if (re.test(pc)) return cat;
  }
  const mcc = tx.creditCardMetadata && Number(tx.creditCardMetadata.payeeMCC);
  if (mcc) {
    for (const [cat, ranges] of MCC_RULES) {
      if (ranges.some(([a, b]) => mcc >= a && mcc <= b)) return cat;
    }
  }
  if (/\bpix\b|transf|\bted\b/.test(text)) return 'pix';
  return 'outros';
}

// ---------- Classificação do tipo de movimento ----------

const RE_CARD_PAYMENT_BANK = /pag(amento|to|\.)?\s*(de\s*)?(da\s*)?fatura|fatura\s*(do\s*)?cart|pag(amento|to)?\s*(de\s*)?cart(ao|oes)|pgto\s*cart|pag\s*fat|deb(ito)?\s*aut(omatico)?\s*fatura|credit card payment/;
const RE_CARD_PAYMENT_CARD = /pagamento|pgto|pagto|pag fatura|pag\. fatura|pagamento recebido|credito de pagamento|payment/;
const RE_FEE = /\biof\b|juros|encargo|multa|tarifa|anuidade|taxa|seguro fatura|rotativo/;
const RE_PIX = /\bpix\b/;
const RE_YIELD = /rendiment|remunerac|rende|yield|juros sobre/;
const RE_SAVING = /aplicac|aplica |cofrinho|caixinha|porquinho|guardad|investiment|cdb/;

function isOwnTransfer(tx, ctx) {
  const pd = tx.paymentData || {};
  const other = tx.type === 'DEBIT' ? pd.receiver : pd.payer;
  const cat = norm(tx.category);
  if (/same person/.test(cat)) return true;
  if (other) {
    const doc = digits(other.documentNumber && other.documentNumber.value);
    if (doc && ctx.ownDocs.has(doc)) return true;
    if (doc && doc.length >= 11) return false;
    const name = norm(other.name);
    if (name && ctx.ownNames.has(name)) return true;
  }
  // "Pix enviado - Fulano de Tal": o nome do dono aparece na descrição.
  const desc = norm(tx.description);
  if (/pix|transf|ted\b|doc\b/.test(desc) && ctx.ownShort.some((n) => desc.includes(n))) return true;
  return false;
}

// Outra pessoa do outro lado (CPF/CNPJ diferente do seu)?
function hasForeignParty(tx, ctx) {
  const pd = tx.paymentData || {};
  const other = tx.type === 'DEBIT' ? pd.receiver : pd.payer;
  const doc = other && digits(other.documentNumber && other.documentNumber.value);
  return !!(doc && doc.length >= 11 && !ctx.ownDocs.has(doc));
}

const RE_INTERNAL = /dinheiro (reservado|retirado|guardado|resgatado)|resgate (da |do )?(caixinha|cofrinho)|guardado (na|no) (caixinha|cofrinho)/;
const RE_SALARY = /salari|proventos|folha de pag|pagto salario|vencimentos/;

function classifyOne(tx, acc, ctx) {
  const text = txText(tx);
  const val = signed(tx);
  const isCard = acc.type === 'CREDIT';
  const cat = norm(tx.category);
  if (isCard) {
    if (val > 0) {
      if (RE_CARD_PAYMENT_CARD.test(text) || /credit card payment/.test(cat)) return { kind: 'card_payment_in', cat: 'fatura' };
      return { kind: 'refund', cat: categoryFor(tx) };
    }
    const meta = tx.creditCardMetadata || {};
    if (meta.feeType || RE_FEE.test(text)) return { kind: 'fee', cat: 'taxas' };
    if (RE_PIX.test(text)) return { kind: 'pix_credit', cat: categoryFor(tx) === 'outros' ? 'pix' : categoryFor(tx) };
    return { kind: 'expense', cat: categoryFor(tx) };
  }
  // Conta corrente
  if (/internal/.test(cat) || RE_INTERNAL.test(text)) return { kind: 'internal', cat: 'reserva' };
  if (val < 0) {
    if (RE_CARD_PAYMENT_BANK.test(text) || /credit card payment/.test(cat)) return { kind: 'card_payment', cat: 'fatura' };
    if (isOwnTransfer(tx, ctx)) return { kind: 'transfer_out', cat: 'reserva' };
    if (RE_SAVING.test(text) && !RE_PIX.test(text)) return { kind: 'saving', cat: 'reserva' };
    return { kind: 'expense', cat: categoryFor(tx) };
  }
  if (isOwnTransfer(tx, ctx)) return { kind: 'transfer_in', cat: 'reserva' };
  if (RE_YIELD.test(text)) return { kind: 'yield', cat: 'renda' };
  if (/estorno|devoluc|reembolso/.test(text)) return { kind: 'refund', cat: categoryFor(tx) };
  return { kind: 'income', cat: 'renda', salary: RE_SALARY.test(text) };
}

// Liga pares que o banco não marcou: saída numa conta sua e entrada do mesmo valor em outra,
// em até 3 dias. Também liga o pagamento da fatura na conta ao crédito no cartão.
function pairPass(list, ctx) {
  const byAbs = new Map();
  for (const t of list) {
    const k = Math.abs(t.value).toFixed(2);
    if (!byAbs.has(k)) byAbs.set(k, []);
    byAbs.get(k).push(t);
  }
  for (const group of byAbs.values()) {
    if (group.length < 2) continue;
    for (const out of group) {
      if (out.value >= 0 || out.paired) continue;
      for (const inc of group) {
        if (inc.value <= 0 || inc.paired || inc.accountId === out.accountId) continue;
        if (Math.abs(dayDiff(inc.date, out.date)) > 3) continue;
        // Conta -> cartão: pagamento de fatura (inclusive antecipado).
        if (!out.isCard && inc.isCard && (out.kind === 'expense' || out.kind === 'card_payment') && (inc.kind === 'card_payment_in' || (inc.kind === 'refund' && !hasForeignParty(out.raw, ctx)))) {
          out.kind = 'card_payment'; out.cat = 'fatura'; out.paysCard = inc.accountId;
          inc.kind = 'card_payment_in'; inc.cat = 'fatura';
          out.paired = inc.paired = true;
          break;
        }
        // Conta -> conta sua.
        if (!out.isCard && !inc.isCard && out.kind === 'expense' && (inc.kind === 'income' || inc.kind === 'transfer_in') && !inc.salary
          && /pix|transf|ted\b|doc\b/.test(out.text) && /pix|transf|ted\b|doc\b/.test(inc.text)
          && !hasForeignParty(out.raw, ctx) && !hasForeignParty(inc.raw, ctx)) {
          out.kind = 'transfer_out'; out.cat = 'reserva';
          inc.kind = 'transfer_in'; inc.cat = 'reserva';
          out.paired = inc.paired = true;
          break;
        }
      }
    }
  }
}

// ---------- Visual dos bancos ----------

const BANK_STYLES = [
  [/nubank|nu pagamentos/, { cor: '#820ad1', bg: 'linear-gradient(135deg, #b14cf5 0%, #820ad1 45%, #4c0880 100%)', nome: '#ffffff', sigla: 'NU' }],
  [/itau|itaú/, { cor: '#1d3f91', bg: 'linear-gradient(135deg, #2f56b8 0%, #14307c 50%, #0a1a45 100%)', nome: '#fdba74', sigla: 'IT' }],
  [/inter/, { cor: '#ea580c', bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 45%, #c2410c 100%)', nome: '#ffffff', sigla: 'IN' }],
  [/mercado ?pago/, { cor: '#0284c7', bg: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #075985 100%)', nome: '#ffffff', sigla: 'MP' }],
  [/caixa/, { cor: '#1e40af', bg: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 55%, #172554 100%)', nome: '#fdba74', sigla: 'CX' }],
  [/santander/, { cor: '#b91c1c', bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 55%, #7f1d1d 100%)', nome: '#ffffff', sigla: 'SA' }],
  [/bradesco/, { cor: '#be123c', bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 55%, #881337 100%)', nome: '#ffffff', sigla: 'BR' }],
  [/c6/, { cor: '#1f2937', bg: 'linear-gradient(135deg, #4b5563 0%, #1f2937 55%, #030712 100%)', nome: '#ffffff', sigla: 'C6' }],
  [/banco do brasil|\bbb\b/, { cor: '#1e3a8a', bg: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 60%, #172554 100%)', nome: '#fde047', sigla: 'BB' }],
  [/ifood/, { cor: '#ea1d2c', bg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 45%, #9f1239 100%)', nome: '#ffffff', sigla: 'iF' }],
  [/picpay/, { cor: '#15803d', bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 55%, #14532d 100%)', nome: '#ffffff', sigla: 'PP' }]
];

// Selo da empresa: iniciais nas cores da marca (não usa o logotipo).
const BRANDS = [
  [/ifood|\bifd\b|ifd\*/, 'iF', '#ea1d2c', '#ffffff'],
  [/\b99 ?(food|app|pop|tecnologia|inapp)|99inapp|^99$|\| 99$|nupay\|99/, '99', '#ffd400', '#111111'],
  [/\buber\b/, 'U', '#000000', '#ffffff'],
  [/netflix/, 'N', '#e50914', '#ffffff'],
  [/spotify/, 'S', '#1db954', '#ffffff'],
  [/mercado ?livre|mercadolivre|melimais/, 'ML', '#ffe600', '#2d3277'],
  [/\bmp \*/, 'MP', '#0284c7', '#ffffff'],
  [/amazon|\bamz/, 'a', '#232f3e', '#ff9900'],
  [/discord/, 'D', '#5865f2', '#ffffff'],
  [/openai|chatgpt/, 'AI', '#10a37f', '#ffffff'],
  [/anthropic|claude/, 'C', '#d97757', '#ffffff'],
  [/crunchyroll|crunchyro/, 'CR', '#f47521', '#ffffff'],
  [/google/, 'G', '#4285f4', '#ffffff'],
  [/apple\.com|itunes/, 'A', '#111111', '#ffffff'],
  [/epic ?games|epicgames/, 'EG', '#2a2a2a', '#ffffff'],
  [/canva/, 'Ca', '#00c4cc', '#ffffff'],
  [/telefonica|\bvivo\b/, 'V', '#660099', '#ffffff'],
  [/\bclaro\b/, 'C', '#da291c', '#ffffff'],
  [/\btim\b/, 'T', '#004691', '#ffffff'],
  [/uninter/, 'UN', '#0b4f8a', '#ffffff'],
  [/pao de acucar/, 'PA', '#00843d', '#ffffff'],
  [/atacadao/, 'At', '#f58220', '#ffffff'],
  [/drogasil|droga raia|drogaria/, 'Rx', '#e30613', '#ffffff']
];
function brandFor(text) {
  const n = norm(text);
  for (const [re, sigla, cor, fg] of BRANDS) if (re.test(n)) return { sigla, cor, fg };
  return null;
}
function bankBrand(name) {
  const st = bankStyle(name);
  return { sigla: st.sigla, cor: st.cor, fg: '#ffffff' };
}

function bankStyle(name) {
  const n = norm(name);
  for (const [re, st] of BANK_STYLES) if (re.test(n)) return st;
  const sig = (String(name || '?').replace(/[^A-Za-zÀ-ú ]/g, '').trim().slice(0, 2) || '??').toUpperCase();
  return { cor: '#334155', bg: 'linear-gradient(135deg, #64748b 0%, #334155 55%, #0f172a 100%)', nome: '#ffffff', sigla: sig };
}

function shortBankName(name) {
  const n = norm(name);
  if (/nubank|nu pagamentos/.test(n)) return 'Nubank';
  if (/itau/.test(n)) return 'Itaú';
  if (/inter/.test(n)) return 'Inter';
  if (/mercado ?pago/.test(n)) return 'Mercado Pago';
  if (/caixa/.test(n)) return 'Caixa';
  if (/santander/.test(n)) return 'Santander';
  if (/bradesco/.test(n)) return 'Bradesco';
  return String(name || 'Banco').replace(/\s*\(.*\)\s*$/, '').replace(/\s*open finance\s*/i, '').trim();
}

// ---------- Montagem do painel ----------

function buildModel(db, opts) {
  const now = (opts && opts.now) ? toDate(opts.now) : new Date();
  const mk = (opts && opts.month) || monthKey(now);
  const settings = db.settings || {};
  const accounts = Object.values(db.accounts || {});
  const accById = new Map(accounts.map((a) => [a.id, a]));
  const items = db.items || {};

  const bankNameOf = (acc) => {
    const it = items[acc.itemId];
    const label = (settings.items || []).find((x) => x.id === acc.itemId);
    return shortBankName((label && label.label) || (it && it.connectorName) || acc.marketingName || acc.name);
  };

  const ctx = {
    ownDocs: new Set([digits(settings.cpf)].concat(accounts.map((a) => digits(a.taxNumber))).filter((d) => d.length >= 11)),
    ownNames: new Set(accounts.map((a) => norm(a.owner)).filter(Boolean)),
    ownShort: Array.from(new Set(accounts.map((a) => norm(a.owner).split(' ').slice(0, 3).join(' ')).filter((n) => n.split(' ').length >= 2)))
  };

  // Lista normalizada de todas as transações.
  const all = [];
  for (const tx of Object.values(db.transactions || {})) {
    const acc = accById.get(tx.accountId);
    if (!acc) continue;
    const c = classifyOne(tx, acc, ctx);
    all.push({
      id: tx.id,
      raw: tx,
      accountId: tx.accountId,
      isCard: acc.type === 'CREDIT',
      bank: bankNameOf(acc),
      date: toDate(tx.date),
      createdAt: tx.createdAt ? toDate(tx.createdAt) : null,
      value: signed(tx),
      text: txText(tx),
      description: prettyDescription(tx),
      kind: c.kind,
      salary: !!c.salary,
      cat: c.cat,
      pending: tx.status === 'PENDING',
      inst: tx.creditCardMetadata && tx.creditCardMetadata.totalInstallments > 1
        ? { n: tx.creditCardMetadata.installmentNumber || 1, total: tx.creditCardMetadata.totalInstallments }
        : null
    });
  }
  all.sort((a, b) => b.date - a.date || Math.abs(b.value) - Math.abs(a.value));
  pairPass(all, ctx);
  for (const x of (db.manual || []).filter((y) => y.tipo === 'credito')) {
    for (const c of (x.compras || [])) {
      const d = toDate(c.data);
      all.push({
        id: 'mc:' + c.id, raw: {}, accountId: 'manual:' + x.id, isCard: true, bank: x.nome, date: d, createdAt: null,
        value: -Math.abs(Number(c.valor) || 0), text: norm(c.descricao + ' ' + x.nome), description: c.descricao || x.nome,
        kind: 'expense', cat: c.cat || 'restaurantes', pending: false, inst: null, salary: false, manualCredit: x.id
      });
    }
  }
  all.sort((a, b) => b.date - a.date || Math.abs(b.value) - Math.abs(a.value));
  // Salário que cai nos últimos dias do mês paga o mês seguinte.
  for (const t of all) {
    t.comp = monthKey(t.date);
    if (t.salary) {
      const last = new Date(t.date.getFullYear(), t.date.getMonth() + 1, 0).getDate();
      if (t.date.getDate() >= last - 4) t.comp = addMonths(t.comp, 1);
    }
  }

  // Categorias fixas por nome (ex.: "fulana de tal" -> Contas da casa) e depois as trocas de um lançamento só.
  const ruleKinds = new Set(['expense', 'pix_credit', 'refund', 'income', 'fee']);
  const catRules = (db.catRules || []).filter((r) => r && r.termo && CATS[r.cat]).map((r) => ({ termo: norm(r.termo), cat: r.cat }));
  for (const t of all) {
    if (!ruleKinds.has(t.kind)) continue;
    const hay = t.text + ' | ' + norm(t.description);
    const r = catRules.find((x) => hay.includes(x.termo));
    if (r) t.cat = r.cat;
  }
  const catOverride = db.catOverrides || {};
  for (const t of all) if (catOverride[t.id] && CATS[catOverride[t.id]]) t.cat = catOverride[t.id];

  const inMonth = (t, key) => monthKey(t.date) === key;
  const monthTx = all.filter((t) => inMonth(t, mk));

  // ----- Reserva -----
  const bankAccounts = accounts.filter((a) => a.type !== 'CREDIT');
  let reserveAcc = bankAccounts.find((a) => a.id === settings.reserveAccountId);
  if (!reserveAcc) reserveAcc = bankAccounts.find((a) => /mercado ?pago/.test(norm(bankNameOf(a))));
  // O saldo já inclui o dinheiro rendendo; somar automaticallyInvestedBalance contaria em dobro.
  const reserveBalance = reserveAcc ? round2(Number(reserveAcc.balance) || 0) : 0;
  const reserveTx = reserveAcc ? monthTx.filter((t) => t.accountId === reserveAcc.id) : [];
  const guardadoMes = round2(reserveTx.filter((t) => t.kind === 'transfer_in').reduce((s, t) => s + t.value, 0)
    - reserveTx.filter((t) => t.kind === 'transfer_out').reduce((s, t) => s + Math.abs(t.value), 0)
    + monthTx.filter((t) => t.kind === 'saving').reduce((s, t) => s + Math.abs(t.value), 0));
  const rendeuMes = round2(reserveTx.filter((t) => t.kind === 'yield').reduce((s, t) => s + t.value, 0));
  const meta = Number(settings.metaReserva) || 0;

  // ----- Cartões -----
  const cardAccounts = accounts.filter((a) => a.type === 'CREDIT');
  const cards = cardAccounts.map((acc) => buildCard(acc, all, db, mk, now, bankNameOf(acc)))
    .concat((db.manual || []).filter((x) => x.tipo === 'credito').map((x) => manualCard(x, now, db)));

  // ----- Contas a pagar -----
  const used = new Set();
  const userBills = [];
  const ctxE = { mkNow: monthKey(now), marks: db.billMarks || {} };
  for (const b of (settings.bills || [])) for (const x of expandBill(b, mk, ctxE)) userBills.push(matchBill(x, mk, all, used, db, now));
  const cardBills = cards
    .filter((c) => c.dueThisMonth)
    .map((c) => {
      const mark = ((db.billMarks || {})[mk] || {})['card:' + c.id];
      const paidAuto = c.dueThisMonth.paid;
      const paid = mark === undefined ? paidAuto : mark;
      return {
        id: 'card:' + c.id,
        nome: 'Fatura ' + c.nome,
        dia: c.dueThisMonth.dia,
        valor: c.dueThisMonth.total,
        cat: 'fatura',
        icon: 'cartao',
        marca: bankBrand(c.nome),
        paid,
        how: paid ? (mark === true && !paidAuto ? 'manual' : 'extrato') : null,
        paidDate: c.dueThisMonth.paidDate,
        antecipado: c.dueThisMonth.antecipado,
        estimada: !!c.dueThisMonth.estimada,
        viaCard: false,
        auto: true
      };
    });
  const manualCredits = (db.manual || []).filter((x) => x.tipo === 'credito');
  const manualBills = manualCredits.filter((x) => !x.inicio || x.inicio <= mk).filter(() => mk >= monthKey(now)).map((x) => {
    const mark = ((db.billMarks || {})[mk] || {})['manual:' + x.id];
    return {
      id: 'manual:' + x.id, nome: 'Fatura ' + x.nome, dia: Number(x.dia) || 5, valor: manualGasto(x, db),
      cat: 'fatura', icon: 'restaurantes', marca: brandFor(x.nome), paid: !!mark, how: mark ? 'manual' : null, paidDate: null, antecipado: 0, viaCard: false, auto: true, manual: true
    };
  }).filter((b) => b.valor > 0.005 || b.paid);
  const bills = userBills.concat(cardBills).concat(manualBills).sort((a, b) => a.dia - b.dia || a.nome.localeCompare(b.nome));
  const today = (monthKey(now) === mk) ? now.getDate() : (mk < monthKey(now) ? 99 : 0);
  for (const b of bills) b.status = billStatus(b, today, mk, now);

  // ----- Fluxo do mês -----
  const incomeTx = all.filter((t) => t.kind === 'income' && t.comp === mk);
  const recebido = round2(incomeTx.reduce((s, t) => s + t.value, 0));
  const salario = Number(settings.salario) || 0;
  const isPast = mk < monthKey(now);
  const temSalario = incomeTx.some((t) => t.salary);
  const renda = isPast || temSalario ? recebido : round2(recebido + salario);
  const rendaFonte = isPast || temSalario ? 'recebido' : 'previsto';

  const contasFixas = round2(userBills.filter((b) => !b.viaCard && !b.noCartao).reduce((s, b) => s + b.valor, 0));
  const cartoesMes = round2(cardBills.concat(manualBills).reduce((s, b) => s + b.valor, 0));
  const diaADia = round2(monthTx
    .filter((t) => !t.isCard && t.kind === 'expense' && !used.has(t.id))
    .reduce((s, t) => s + Math.abs(t.value), 0));
  const reservaMes = Math.max(0, guardadoMes);
  const sobra = round2(renda - contasFixas - cartoesMes - diaADia - reservaMes);
  const pct = (v) => (renda > 0 ? Math.round(v / renda * 100) : 0);

  // ----- Gastos por categoria (tudo que é gasto de verdade, sem transferências) -----
  const spendKinds = new Set(['expense', 'pix_credit', 'fee']);
  const catTotals = {};
  for (const t of monthTx) {
    if (spendKinds.has(t.kind)) catTotals[t.cat] = (catTotals[t.cat] || 0) + Math.abs(t.value);
    if (t.kind === 'refund' && catTotals[t.cat]) catTotals[t.cat] -= t.value;
  }
  const categorias = Object.entries(catTotals)
    .filter(([, v]) => v > 0.005)
    .map(([k, v]) => ({ cat: k, label: (CATS[k] || CATS.outros).label, valor: round2(v) }))
    .sort((a, b) => b.valor - a.valor);
  const totalGasto = round2(categorias.reduce((s, c) => s + c.valor, 0));

  // ----- Pix no crédito -----
  const pixTx = monthTx.filter((t) => t.kind === 'pix_credit');
  const feeTx = monthTx.filter((t) => t.kind === 'fee');
  const pixCredito = {
    qtd: pixTx.length,
    total: round2(pixTx.reduce((s, t) => s + Math.abs(t.value), 0)),
    taxas: round2(feeTx.reduce((s, t) => s + Math.abs(t.value), 0))
  };

  // ----- Listas -----
  const label = (t) => ({
    id: t.id,
    data: fmtDay(t.date),
    nome: t.description + (t.inst ? ', ' + t.inst.n + ' de ' + t.inst.total : ''),
    cat: t.cat,
    catLabel: (CATS[t.cat] || CATS.outros).label,
    conta: t.bank + (t.isCard ? ' crédito' : ' conta'),
    bankCor: bankStyle(t.bank).cor,
    valor: t.value,
    kind: t.kind,
    tag: KIND_TAGS[t.kind] || null,
    termo: suggestTerm(t.description),
    marca: ['card_payment', 'card_payment_in'].includes(t.kind) ? bankBrand(t.kind === 'card_payment' && t.paysCard && accById.get(t.paysCard) ? bankNameOf(accById.get(t.paysCard)) : t.bank)
      : (['transfer_in', 'transfer_out', 'internal', 'yield'].includes(t.kind) ? bankBrand(t.bank) : brandFor(t.text + ' ' + t.description)),
    pending: t.pending
  });
  const compras = all.filter((t) => t.kind === 'expense' || t.kind === 'pix_credit').slice(0, 6).map(label);
  const lancamentos = monthTx.map(label);
  // ----- Notificações -----
  // Lançamentos que chegaram nos últimos 7 dias e contas que vencem em até 3 dias.
  // "Novo" é o que chegou depois da última vez que o sininho foi aberto.
  const seenAt = Number((db.settings || {}).notifSeen) || (now - 86400000);
  const DAY = 86400000;
  const avisos = [];
  const avisoKinds = new Set(['expense', 'pix_credit', 'fee', 'income', 'refund']);
  for (const t of all) {
    if (!t.createdAt || (now - t.createdAt) > 7 * DAY || !avisoKinds.has(t.kind)) continue;
    // Só o que chegou perto da data da compra. Lançamento antigo trazido de uma vez (primeira sincronização) não é novidade.
    if ((t.createdAt - t.date) > 3 * DAY) continue;
    const v = label(t);
    avisos.push({ id: 'tx:' + t.id, tipo: 'tx', titulo: v.nome, texto: v.conta + ' · ' + v.data, valor: v.valor, cat: v.cat, marca: v.marca, termo: v.termo, quando: +t.createdAt, novo: +t.createdAt > seenAt });
  }
  if (mk === monthKey(now)) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const b of bills) {
      if (b.paid || b.semanal || b.semData || !b.dia || b.noCartao) continue;
      const due = new Date(now.getFullYear(), now.getMonth(), b.dia);
      const dias = Math.round((due - today) / DAY);
      if (dias < -5 || dias > 3) continue;
      const desde = +new Date(due - 3 * DAY);
      avisos.push({ id: 'bill:' + b.id + ':' + mk, tipo: 'conta', titulo: b.nome, texto: dias < 0 ? 'Venceu há ' + (-dias) + (dias === -1 ? ' dia' : ' dias') + ' e ainda não apareceu paga' : dias === 0 ? 'Vence hoje' : dias === 1 ? 'Vence amanhã' : 'Vence em ' + dias + ' dias', valor: -b.valor, cat: b.icon || b.cat, marca: b.marca, quando: Math.min(+now, desde), atrasada: dias < 0, novo: desde > seenAt });
    }
  }
  const insights = buildInsights({ all, now, mk, settings, db, label, monthKey, addMonths, monthLabel, round2, CATS, suggestTerm, bankAccounts, bankNameOf, catTotals, avisos, seenAt });
  avisos.sort((a, b) => (b.novo - a.novo) || (b.tipo === 'conta') - (a.tipo === 'conta') || b.quando - a.quando);
  avisos.splice(30);
  const novas = avisos.filter((x) => x.novo).length;

  const bancos = Object.values(items).map((it) => {
    const accs = accounts.filter((a) => a.itemId === it.id);
    const nome = bankNameOf(accs[0] || { itemId: it.id, name: it.connectorName });
    const st = bankStyle(nome);
    return {
      id: it.id,
      nome,
      sigla: st.sigla,
      cor: st.cor,
      tipo: accs.some((a) => a.type === 'CREDIT') ? (accs.some((a) => a.type !== 'CREDIT') ? 'Conta e cartão de crédito' : 'Cartão de crédito') : 'Conta',
      saldo: round2(accs.filter((a) => a.type !== 'CREDIT').reduce((s, a) => s + (Number(a.balance) || 0), 0)),
      status: it.status,
      erro: it.error || null,
      atualizado: it.lastUpdatedAt || null,
      consentimento: it.consentExpiresAt || null,
      reserva: reserveAcc ? accs.some((a) => a.id === reserveAcc.id) : false
    };
  });

  const plano = buildPlan(db, all, cards, now, settings, bankAccounts, bankNameOf);
  const ml = monthLabel(mk);
  return {
    plano,
    month: { key: mk, nome: ml.nome, ano: ml.ano, isCurrent: mk === monthKey(now), prev: addMonths(mk, -1), next: addMonths(mk, 1) },
    sync: { last: db.lastSync || null, error: db.lastSyncError || null, bancosEm: (() => {
      const ds = Object.values(items).map((it) => it.lastUpdatedAt).filter(Boolean).map((x) => +new Date(x)).filter((x) => x > 0);
      return ds.length ? new Date(Math.max.apply(null, ds)).toISOString() : null;
    })(), demo: !!settings.demo, configured: !!(db.secrets && db.secrets.clientId) || !!settings.demo },
    renda: { valor: round2(renda), fonte: rendaFonte, salario },
    fluxo: {
      contasFixas, cartoes: cartoesMes, diaADia, reserva: reservaMes, sobra,
      pct: { contasFixas: pct(contasFixas), cartoes: pct(cartoesMes), diaADia: pct(diaADia), reserva: pct(reservaMes), sobra: pct(Math.max(0, sobra)) }
    },
    cards,
    cardsTotal: round2(cards.reduce((s, c) => s + c.aberta, 0)),
    bills,
    billsTotais: {
      aberto: round2(bills.filter((b) => !b.paid && !b.noCartao).reduce((s, b) => s + b.valor, 0)),
      noCartao: round2(bills.filter((b) => b.noCartao).reduce((s, b) => s + b.valor, 0)),
      pago: round2(bills.filter((b) => b.paid).reduce((s, b) => s + b.valor, 0)),
      pagas: bills.filter((b) => b.paid).length,
      total: bills.length
    },
    reserva: {
      conta: reserveAcc ? bankNameOf(reserveAcc) : null,
      saldo: reserveBalance, meta, guardadoMes: round2(guardadoMes), rendeuMes,
      falta: round2(Math.max(0, meta - reserveBalance)),
      pct: meta > 0 ? Math.min(100, round2(reserveBalance / meta * 100)) : 0,
      meses: guardadoMes > 0 && meta > reserveBalance ? Math.ceil((meta - reserveBalance) / guardadoMes) : null
    },
    categorias, totalGasto, pixCredito,
    compras, lancamentos, novas, avisos,
    features: insights.features,
    historico: insights.historico || null,
    metas: insights.metas || null,
    limites: insights.limites || null,
    parcelas: insights.parcelas || null,
    assinaturas: insights.assinaturas || null,
    assinaturasTotal: insights.assinaturasTotal || 0,
    pixAno: insights.pixAno || null,
    bancos,
    manual: (db.manual || []).filter((x) => x.tipo !== 'credito').map((x) => Object.assign({}, x)),
    manualCredits: (db.manual || []).filter((x) => x.tipo === 'credito').map((x) => {
      const cut = manualPaidCutoff(x, db);
      const gastoAtual = manualGasto(x, db);
      return Object.assign({}, x, {
        gastoAtual,
        livre: round2(Math.max(0, (Number(x.limite) || 0) - gastoAtual)),
        recentes: (x.compras || []).filter((c) => !cut || dayStart(c.data) > cut).slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 4)
          .map((c) => ({ id: c.id, descricao: c.descricao, valor: Number(c.valor) || 0, data: fmtDay(toDate(c.data)) }))
      });
    }),
    beneficiarios: buildPayees(all, now),
    catRules: (db.catRules || []).map((r) => ({ id: r.id, termo: r.termo, cat: r.cat, label: (CATS[r.cat] || CATS.outros).label })),
    settings: publicSettings(settings, bankAccounts.map((a) => ({ id: a.id, nome: bankNameOf(a) + ' · ' + (a.name || 'conta') })), now)
  };
}

const KIND_TAGS = {
  card_payment: 'Pagamento de fatura',
  card_payment_in: 'Pagamento recebido',
  transfer_out: 'Entre suas contas',
  transfer_in: 'Entre suas contas',
  saving: 'Guardado',
  yield: 'Rendimento',
  pix_credit: 'Pix no crédito',
  fee: 'Taxa ou juros',
  refund: 'Estorno'
};

function publicSettings(s, reserveOptions, now) {
  const mkNow = monthKey(now || new Date());
  const mesNome = monthLabel(mkNow).nome.toLowerCase();
  return {
    salario: s.salario || 0,
    investir: s.investir || 0,
    diaSalario: s.diaSalario || 1,
    metaReserva: s.metaReserva || 0,
    reserveAccountId: s.reserveAccountId || '',
    reserveOptions,
    autoStart: s.autoStart !== false,
    syncHours: s.syncHours || 3,
    items: (s.items || []).map((x) => ({ id: x.id, label: x.label || '' })),
    bills: (s.bills || []).map((b) => Object.assign({}, b, {
      quando: b.freq === 'unica' ? (b.data ? 'vence em ' + b.data.split('-').reverse().join('/') : 'sem data') : (b.freq === 'semanal' ? 'toda ' + DIAS_SEMANA[Number(b.diaSemana)] : 'dia ' + String(b.dia).padStart(2, '0')),
      vezesMes: b.freq === 'semanal' ? expandBill(b, mkNow, { mkNow }).length : 1,
      mesNome,
      porMes: round2((Number(b.valor) || 0) * (b.freq === 'semanal' || b.freq === 'unica' ? expandBill(b, mkNow, { mkNow }).length : 1))
    })),
    features: features(s),
    metas: (s.metas || []).map((g) => Object.assign({}, g)),
    limites: Object.assign({}, s.limites || {}),
    cpf: s.cpf ? '•••.' + digits(s.cpf).slice(3, 6) + '.•••-••' : '',
    demo: !!s.demo
  };
}

function prettyDescription(tx) {
  const pd = tx.paymentData || {};
  let d = String(tx.description || '').trim();
  // "Compra no débito via NuPay|99Food" -> "99Food"
  if (d.includes('|')) d = d.split('|').filter(Boolean).pop().trim() || d;
  d = d.replace(/\s+-\s+/g, ' - ').replace(/\s+-\s*$/, '');
  // "NETFLIX.COM      SAO PAULO     BRA": tira cidade e país do fim.
  const segs = d.split(/\s{2,}/);
  if (segs.length > 1) {
    const last = segs[segs.length - 1].trim();
    if (/^[A-Z]{2,3}$/.test(last)) { segs.pop(); if (segs.length > 1) segs.pop(); }
    else if (/\s[A-Z]{2,3}$/.test(last) && segs.length > 1) segs.pop();
    d = segs.join(' ').trim() || d;
  }
  d = d.replace(/^pix enviado\s*-\s*/i, 'Pix para ').replace(/^pix recebido\s*-\s*/i, 'Pix de ');
  d = d.replace(/^pagamento de pix qr code\s*/i, 'Pix para ').replace(/^transfer[eê]ncia enviada( pelo pix)?\s*/i, 'Pix para ');
  const receiver = pd.receiver && pd.receiver.name;
  if (/^pix\b|^transf|^ted\b/i.test(d) && receiver && tx.type === 'DEBIT') d = 'Pix para ' + titleCase(receiver);
  else if (/^pix\b|^transf|^ted\b/i.test(d) && pd.payer && pd.payer.name && tx.type === 'CREDIT') d = 'Pix de ' + titleCase(pd.payer.name);
  else if (tx.merchant && tx.merchant.name) d = titleCase(tx.merchant.name);
  else if (d === d.toUpperCase()) d = titleCase(d);
  return d || 'Sem descrição';
}

// Quem você paga, a partir do extrato: para sugerir e preencher a despesa fixa.
const CAT_TO_ICON = { moradia: 'moradia', contas: 'contas', saude: 'saude', educacao: 'educacao', assinaturas: 'assinaturas', transporte: 'transporte' };
function buildPayees(all, now) {
  const map = new Map();
  for (const t of all) {
    if (!(t.kind === 'expense' || t.kind === 'pix_credit') || (now - t.date) > 200 * 86400000) continue;
    const termo = suggestTerm(t.description);
    if (!termo || termo.length < 3) continue;
    const cur = map.get(termo) || { termo, list: [] };
    cur.list.push(t);
    map.set(termo, cur);
  }
  const out = [];
  for (const x of map.values()) {
    const list = x.list.sort((a, b) => b.date - a.date);
    const last = list[0];
    // Semanal se os últimos pagamentos vieram com 5 a 9 dias de intervalo.
    const gaps = [];
    for (let i = 0; i + 1 < Math.min(list.length, 5); i++) gaps.push(dayDiff(list[i].date, list[i + 1].date));
    gaps.sort((a, b) => a - b);
    const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;
    const semanal = gaps.length >= 2 && med >= 5 && med <= 9;
    let nome = last.description.replace(/^pix (para|de)\s+/i, '').replace(/^pagamento de (conta|titulo|t[ií]tulo|boleto)\s*-?\s*/i, '');
    nome = nome.replace(/\b\d[\d./-]{5,}\b/g, ' ').replace(/\b(ltda|s\.?a\.?|eireli)(\.|\b)/gi, ' ').replace(/\s+-.*$/, '').replace(/\s+/g, ' ').trim();
    nome = titleCase(nome.split(' ').slice(0, 4).join(' '));
    out.push({
      termo: x.termo, nome: last.description, nomeLimpo: nome || last.description,
      vezes: list.length, valor: round2(Math.abs(last.value)), data: fmtDay(last.date), conta: last.bank + (last.isCard ? ' crédito' : ''),
      dia: last.date.getDate(), diaSemana: last.date.getDay(), semanal, noCartao: !!last.isCard, icon: CAT_TO_ICON[last.cat] || 'contas', d: last.date, marca: brandFor(last.text + ' ' + last.description)
    });
  }
  return out.sort((a, b) => b.vezes - a.vezes || b.d - a.d).slice(0, 400).map((x) => { delete x.d; return x; });
}

// Sugestão de nome para a regra: quem recebeu ou a loja, sem "Pix para", "Compra no débito" etc.
function suggestTerm(desc) {
  const d = norm(desc).replace(/^(pix (para|de|enviado|recebido)|transferencia (enviada|recebida)( pelo pix)?|compra (no )?debito( via nupay)?|pagamento (de|com) (pix qr code|titulo|conta|pix))\s*[-|]?\s*/, '');
  const words = d.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && /[a-z]/.test(w));
  return words.slice(0, 2).join(' ');
}

function titleCase(s) {
  const small = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para']);
  return String(s).toLowerCase().split(/\s+/).map((w, i) => (i > 0 && small.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function fmtDay(d) {
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}

function dayStart(d) {
  const x = toDate(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function shiftMonth(date, n) {
  const d = toDate(date);
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last));
}

// Cartão: usa o que o banco informa pelo Open Finance.
// - Faturas fechadas: total e pagamentos vêm do banco (quando ele manda).
// - Fatura atual: o saldo devedor do cartão, que já desconta o que você antecipou.
// - Faturas antigas que o banco não mandou: o valor pago no cartão perto do vencimento.
function buildCard(acc, all, db, mk, now, nome) {
  const cd = acc.creditData || {};
  const st = bankStyle(nome);
  const today = dayStart(now);
  const txs = all.filter((t) => t.accountId === acc.id);
  const pays = txs.filter((t) => t.kind === 'card_payment_in').sort((a, b) => a.date - b.date);
  const bills = ((db.billsByAccount || {})[acc.id] || [])
    .filter((b) => b.dueDate)
    .map((b) => ({
      id: b.id,
      closing: b.billClosingDate ? dayStart(b.billClosingDate) : null,
      payments: (b.payments || []).map((p) => ({ amount: Number(p.amount) || 0, date: dayStart(p.paymentDate) })),
      due: dayStart(b.dueDate),
      total: round2(Number(b.totalAmount) || 0),
      pagos: round2((b.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)),
      lastPay: (b.payments || []).map((p) => dayStart(p.paymentDate)).sort((x, y) => y - x)[0] || null
    }))
    .sort((a, b) => a.due - b.due);
  const anchor = bills.length ? bills[bills.length - 1].due : (cd.balanceDueDate ? dayStart(cd.balanceDueDate) : null);
  const dueDay = anchor ? anchor.getDate() : 10;
  const billAt = (date) => bills.find((b) => monthKey(b.due) === monthKey(date));
  const paidWindow = (due) => {
    const from = shiftMonth(due, -1);
    const to = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 5);
    const list = pays.filter((p) => dayStart(p.date) > from && dayStart(p.date) <= to);
    return { soma: round2(list.reduce((s, p) => s + p.value, 0)), ultima: list.length ? list[list.length - 1].date : null };
  };

  // Próximo vencimento a partir de hoje.
  let nextDue = anchor ? new Date(anchor) : new Date(today.getFullYear(), today.getMonth(), dueDay);
  for (let i = 0; i < 36 && nextDue < today; i++) nextDue = shiftMonth(nextDue, 1);
  const nb = billAt(nextDue);
  const nbPaid = nb && (nb.pagos >= nb.total - 0.5 || paidWindow(nb.due).soma >= nb.total - 0.5);
  const closedOpen = nb && !nbPaid && nb.total > 0.005 ? nb : null;
  if (nb && nbPaid) nextDue = shiftMonth(nextDue, 1);

  const restoFechada = closedOpen ? round2(Math.max(0, closedOpen.total - closedOpen.pagos)) : 0;

  // Fatura aberta. Cada banco manda isso de um jeito pelo Open Finance:
  // 1) Se o banco mandou o último fechamento (até ~40 dias atrás): soma as compras depois do fechamento,
  //    tira estornos e pagamentos que não sejam da fatura fechada, e soma linhas de crédito à parte
  //    que não viram transação (ex.: NuPay no Nubank).
  // 2) Se o fechamento está velho ou não veio: usa o limite em uso informado pelo banco.
  const lastClosing = bills.map((b) => b.closing).filter((d) => d && d <= today).sort((a, b) => b - a)[0] || null;
  const billIds = new Set(bills.map((b) => b.id).filter(Boolean));
  const billPays = bills.flatMap((b) => b.payments);
  const isBillPayment = (t) => billPays.some((p) => Math.abs(p.amount - t.value) < 0.02 && Math.abs(dayDiff(t.date, p.date)) <= 3);
  const lines = cd.disaggregatedCreditLimits || [];
  const extraLinhas = round2(lines.filter((l) => /nupay/i.test(l.lineNameAdditionalInfo || '')).reduce((s, l) => s + (Number(l.usedAmount) || 0), 0));
  const usadoLimite = cd.creditLimit != null && cd.availableCreditLimit != null
    ? round2(Math.max(0, Number(cd.creditLimit) - Number(cd.availableCreditLimit)))
    : Math.max(0, Number(acc.balance) || 0);
  let abertaValor;
  let fonte;
  if (lastClosing && dayDiff(today, lastClosing) <= 35) {
    const abertas = txs.filter((t) => dayStart(t.date) > lastClosing && !(t.raw.creditCardMetadata && t.raw.creditCardMetadata.billId && billIds.has(t.raw.creditCardMetadata.billId)));
    const compras = abertas.filter((t) => ['expense', 'pix_credit', 'fee'].includes(t.kind)).reduce((s, t) => s + Math.abs(t.value), 0);
    const estornos = abertas.filter((t) => t.kind === 'refund').reduce((s, t) => s + t.value, 0);
    const pagos = abertas.filter((t) => t.kind === 'card_payment_in' && !isBillPayment(t)).reduce((s, t) => s + t.value, 0);
    abertaValor = round2(Math.max(0, compras - estornos - pagos + extraLinhas));
    fonte = 'Compras depois do fechamento de ' + fmtDay(lastClosing) + (extraLinhas > 0 ? ' + ' + fmtMoney(extraLinhas) + ' do NuPay' : '');
  } else {
    abertaValor = round2(Math.max(0, usadoLimite - restoFechada));
    fonte = 'Limite em uso informado pelo banco' + (lastClosing ? ' (o último fechamento que ele mandou é de ' + fmtDay(lastClosing) + ')' : '');
  }
  const openDue = closedOpen ? shiftMonth(closedOpen.due, 1) : nextDue;
  const atualDue = closedOpen ? closedOpen.due : nextDue;
  const atual = {
    estado: closedOpen ? 'Fechada' : 'Aberta',
    valor: closedOpen ? restoFechada : abertaValor,
    total: closedOpen ? closedOpen.total : abertaValor,
    antecipado: 0,
    vence: fmtDay(atualDue),
    mes: monthLabel(monthKey(atualDue)).nome.toLowerCase(),
    due: atualDue,
    fonte
  };

  // Valor de uma fatura passada: o total do banco ou, se ele não mandou, o que foi pago.
  const pastInfo = (due) => {
    const b = billAt(due);
    const w = paidWindow(due);
    if (b) {
      const pago = b.pagos >= b.total - 0.5 || w.soma >= b.total - 0.5;
      return { total: b.total, paid: pago, lastPay: b.lastPay || w.ultima, fonte: 'banco' };
    }
    if (w.soma > 0) return { total: w.soma, paid: true, lastPay: w.ultima, fonte: 'pagamentos' };
    return null;
  };

  const label = (d) => {
    const ml = monthLabel(monthKey(d));
    return ml.curto + (ml.ano !== now.getFullYear() ? ' ' + String(ml.ano).slice(2) : '');
  };
  const prox = [-2, -1].map((k) => {
    const d = shiftMonth(atualDue, k);
    const info = pastInfo(d);
    return { key: monthKey(d), mes: label(d), valor: info ? info.total : 0, atual: false, estado: info ? (info.paid ? 'Paga' : 'Fechada') : 'Sem dados' };
  }).concat([{ key: monthKey(atualDue), mes: label(atualDue), valor: atual.valor, atual: true, estado: atual.estado }]);

  // Fatura que vence no mês exibido.
  let dueThisMonth = null;
  const mDue = (() => { const [y, m] = mk.split('-').map(Number); const last = new Date(y, m, 0).getDate(); return new Date(y, m - 1, Math.min(dueDay, last)); })();
  if (closedOpen && monthKey(closedOpen.due) === mk) {
    dueThisMonth = { total: closedOpen.total, dia: closedOpen.due.getDate(), paid: false, paidDate: null, antecipado: closedOpen.pagos, fechada: true };
  } else if (monthKey(openDue) === mk) {
    if (abertaValor > 0.005) dueThisMonth = { total: abertaValor, dia: openDue.getDate(), paid: false, paidDate: null, antecipado: 0, fechada: false, estimada: true };
  } else if (mk < monthKey(atualDue)) {
    const info = pastInfo(mDue);
    if (info) dueThisMonth = { total: info.total, dia: mDue.getDate(), paid: info.paid, paidDate: info.lastPay ? fmtDay(info.lastPay) : null, antecipado: 0, fechada: true };
  }

  const limite = Number(cd.creditLimit) || 0;
  const livre = cd.availableCreditLimit !== null && cd.availableCreditLimit !== undefined ? Number(cd.availableCreditLimit) : Math.max(0, limite - saldo);
  const parcelas = new Set(txs.filter((t) => t.inst && t.inst.n < t.inst.total && t.date > shiftMonth(today, -2)).map((t) => t.description + t.inst.total));
  return {
    id: acc.id,
    nome,
    final: String(acc.number || '').replace(/\D/g, '').slice(-4) || '••••',
    atual,
    aberta: atual.valor,
    vence: atual.vence,
    limite: round2(limite),
    livre: round2(livre),
    uso: limite > 0 ? Math.max(0, Math.min(100, Math.round((limite - livre) / limite * 100))) : 0,
    bg: st.bg, solid: st.cor, nameColor: st.nome,
    prox,
    parceladas: parcelas.size,
    dueThisMonth
  };
}

// Próximo dia de salário: o dia escolhido ou o primeiro dia útil depois dele.
function payday(y, m, dia) {
  let d = new Date(y, m, Math.min(Math.max(1, dia), 28));
  while (d.getDay() === 0 || d.getDay() === 6) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return d;
}

// "Livre até o salário": o que tem nas contas hoje menos o que vence antes do próximo salário.
// Depois, o que o próximo salário precisa cobrir: faturas, despesas fixas e o que você quer investir.
function buildPlan(db, all, cards, now, settings, bankAccounts, bankNameOf) {
  const today = dayStart(now);
  const dia = Number(settings.diaSalario) || 1;
  let pay = payday(today.getFullYear(), today.getMonth(), dia);
  if (pay <= today) pay = payday(today.getFullYear(), today.getMonth() + 1, dia);
  // Se o salário desse mês já caiu (adiantado no fim do mês anterior), o próximo é o do mês seguinte.
  if (all.some((t) => t.salary && t.comp === monthKey(pay))) pay = payday(pay.getFullYear(), pay.getMonth() + 1, dia);
  const pay2 = payday(pay.getFullYear(), pay.getMonth() + 1, dia);

  const contas = bankAccounts.map((a) => ({ id: a.id, nome: bankNameOf(a), saldo: round2(Number(a.balance) || 0) }));
  const porBanco = {};
  for (const c of contas) porBanco[c.nome] = round2((porBanco[c.nome] || 0) + c.saldo);
  const saldoContas = round2(contas.reduce((s, c) => s + c.saldo, 0));

  // Despesas fixas com data, nos meses que a janela cobre.
  const fixas = [];
  for (const key of Array.from(new Set([monthKey(today), monthKey(pay), monthKey(pay2)]))) {
    const usedPlan = new Set();
    // Despesa paga no cartão já está dentro da fatura: não sai do salário de novo.
    for (const b of (settings.bills || []).filter((x) => x.pagamento !== 'cartao').flatMap((x) => expandBill(x, key, { mkNow: monthKey(today), marks: db.billMarks || {} }))) {
      const r = matchBill(b, key, all, usedPlan, db, today);
      const [y, m] = key.split('-').map(Number);
      const due = new Date(y, m - 1, Math.min(r.dia, new Date(y, m, 0).getDate()));
      fixas.push({ nome: r.nome, valor: r.valor, due, paid: r.paid, tipo: 'fixa', icon: r.icon, semData: r.semData });
    }
  }
  const faturas = cards.filter((c) => c.atual && c.atual.due && c.atual.valor > 0.005)
    .map((c) => ({ nome: 'Fatura ' + c.nome, valor: c.atual.valor, due: dayStart(c.atual.due), paid: false, tipo: 'fatura', icon: c.manual ? 'restaurantes' : 'cartao' }));
  const itens = fixas.concat(faturas);
  const fmt = (x) => ({ nome: x.nome, valor: round2(x.valor), dia: x.semData ? 'sem data' : fmtDay(x.due), tipo: x.tipo, icon: x.icon });
  const antes = itens.filter((x) => !x.paid && x.due < pay && (x.due >= today || monthKey(x.due) === monthKey(today))).sort((a, b) => a.due - b.due);
  const depois = itens.filter((x) => !x.paid && x.due >= pay && x.due < pay2).sort((a, b) => a.due - b.due);
  const totalAntes = round2(antes.reduce((s, x) => s + x.valor, 0));
  const salario = Number(settings.salario) || 0;
  const investir = Number(settings.investir) || 0;
  const faturasDepois = round2(depois.filter((x) => x.tipo === 'fatura').reduce((s, x) => s + x.valor, 0));
  const fixasDepois = round2(depois.filter((x) => x.tipo === 'fixa').reduce((s, x) => s + x.valor, 0));
  return {
    saldoContas,
    contas: Object.entries(porBanco).map(([nome, saldo]) => ({ nome, saldo, cor: bankStyle(nome).cor, sigla: bankStyle(nome).sigla })).sort((a, b) => b.saldo - a.saldo),
    salarioDia: fmtDay(pay),
    salarioMes: monthLabel(monthKey(pay)).nome.toLowerCase(),
    antes: antes.map(fmt),
    totalAntes,
    livre: round2(saldoContas - totalAntes),
    salario,
    investir,
    depois: depois.map(fmt),
    faturasDepois,
    fixasDepois,
    sobraSalario: round2(salario - faturasDepois - fixasDepois - investir)
  };
}

// Crédito lançado à mão (ex.: crédito do iFood): limite, gasto e dia de pagamento.
// Gasto do crédito à mão: compras lançadas depois do último pagamento marcado (+ o valor inicial, se ainda não pagou nenhuma vez).
function manualPaidCutoff(x, db) {
  const marks = db.billMarks || {};
  const months = Object.keys(marks).filter((k) => marks[k] && marks[k]['manual:' + x.id] === true).sort();
  if (!months.length) return null;
  const [y, m] = months[months.length - 1].split('-').map(Number);
  return new Date(y, m - 1, Math.min(28, Math.max(1, Number(x.dia) || 5)));
}
function manualGasto(x, db) {
  const cut = manualPaidCutoff(x, db);
  const compras = (x.compras || []).filter((c) => !cut || dayStart(c.data) > cut).reduce((s, c) => s + (Number(c.valor) || 0), 0);
  return round2((cut ? 0 : (Number(x.gasto) || 0)) + compras);
}

function manualCard(x, now, db) {
  const today = dayStart(now);
  const dia = Math.min(28, Math.max(1, Number(x.dia) || 5));
  let due = new Date(today.getFullYear(), today.getMonth(), dia);
  if (x.inicio) {
    const [y, m] = x.inicio.split('-').map(Number);
    const start = new Date(y, m - 1, dia);
    if (start > due) due = start;
  }
  if (due < today) due = shiftMonth(due, 1);
  const gasto = manualGasto(x, db || {});
  const limite = round2(Number(x.limite) || 0);
  const ml = monthLabel(monthKey(due));
  return {
    id: 'manual:' + x.id, manualId: x.id, manual: true, nome: x.nome, final: '',
    atual: { estado: 'À mão', valor: gasto, total: gasto, antecipado: 0, vence: fmtDay(due), mes: ml.nome.toLowerCase(), due },
    aberta: gasto, vence: fmtDay(due), limite, livre: round2(Math.max(0, limite - gasto)),
    uso: limite > 0 ? Math.min(100, Math.round(gasto / limite * 100)) : 0,
    bg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 45%, #9f1239 100%)', solid: '#e11d48', nameColor: '#ffffff', marca: brandFor(x.nome),
    prox: [{ key: monthKey(due), mes: ml.curto, valor: gasto, atual: true, estado: 'À mão' }],
    parceladas: 0, dueThisMonth: null, atualizado: x.atualizado || null
  };
}

// ----- Contas fixas: acha o pagamento no extrato ou no cartão -----
// Despesa semanal vira uma ocorrência por semana no mês (ex.: toda quinta).
const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
function expandBill(b, mk, ctx) {
  if (b.freq === 'unica' && !b.data) {
    // Sem data: fica no mês atual até ser paga; depois fica só no mês em que foi paga.
    const c = ctx || {};
    const marks = c.marks || {};
    const paidMonth = Object.keys(marks).sort().find((k) => marks[k] && marks[k][b.id] === true);
    const show = paidMonth ? mk === paidMonth : mk === c.mkNow;
    if (!show) return [];
    const [y, m] = mk.split('-').map(Number);
    return [Object.assign({}, b, { dia: new Date(y, m, 0).getDate(), semData: true })];
  }
  if (b.freq === 'unica') {
    if (b.data.slice(0, 7) !== mk) return [];
    return [Object.assign({}, b, { dia: Number(b.data.slice(8, 10)), janela: 10 })];
  }
  if (b.freq !== 'semanal') return [b];
  const [y, m] = mk.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const wd = Number(b.diaSemana);
  const out = [];
  for (let d = 1; d <= last; d++) {
    if (new Date(y, m - 1, d).getDay() === wd) out.push(Object.assign({}, b, { id: b.id + '@' + d, dia: d, janela: 3, baseId: b.id }));
  }
  return out;
}

function matchBill(b, mk, all, used, db, now) {
  const [y, m] = mk.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const due = new Date(y, m - 1, Math.min(Number(b.dia) || 1, lastDay));
  const valor = Number(b.valor) || 0;
  const keys = String(b.busca || b.nome || '').split(',').map(norm).filter((k) => k.length >= 3);
  let found = null;
  if (keys.length) {
    const cands = all.filter((t) => {
      if (used.has(t.id)) return false;
      if (!(t.value < 0) || !['expense', 'pix_credit'].includes(t.kind)) return false;
      const dd = dayDiff(t.date, due);
      if (b.semData) {
        if (b.criada && t.date < toDate(b.criada)) return false;
      } else if (b.janela ? Math.abs(dd) > b.janela : !(monthKey(t.date) === monthKey(due) || (dd >= -20 && dd <= 12))) return false;
      if (!keys.some((k) => t.text.includes(k))) return false;
      if (valor > 0) {
        const a = Math.abs(t.value);
        if (a < valor * 0.3 || a > valor * 3) return false;
      }
      return true;
    });
    cands.sort((p, q) => Math.abs(dayDiff(p.date, due)) - Math.abs(dayDiff(q.date, due)));
    found = cands[0] || null;
  }
  if (found) used.add(found.id);
  const mark = ((db.billMarks || {})[mk] || {})[b.id];
  const paid = mark === undefined ? !!found : mark;
  return {
    id: b.id,
    nome: b.nome,
    dia: due.getDate(),
    valor: found ? round2(Math.abs(found.value)) : valor,
    cat: b.cat || 'contas',
    icon: b.icon || b.cat || 'contas',
    marca: brandFor((b.busca || '') + ' ' + b.nome),
    paid,
    how: paid ? (found && mark !== true ? 'extrato' : (found ? 'extrato' : 'manual')) : null,
    paidDate: found ? fmtDay(found.date) : null,
    viaCard: !!(found && found.isCard),
    viaBank: found ? found.bank : null,
    semanal: b.freq === 'semanal',
    semData: !!b.semData,
    noCartao: b.pagamento === 'cartao',
    auto: false
  };
}

function billStatus(b, today, mk, now) {
  if (b.semData && !b.paid) return { texto: 'Sem data, a pagar', tom: 'normal' };
  if (b.noCartao) {
    if (b.paid) return { texto: 'Cobrada no cartão' + (b.viaBank ? ' ' + b.viaBank : '') + (b.paidDate ? ' em ' + b.paidDate : '') + ', já está na fatura', tom: 'ok' };
    return { texto: 'Cai no cartão dia ' + String(b.dia).padStart(2, '0') + ', entra na fatura', tom: 'normal' };
  }
  if (b.paid) {
    if (b.how === 'manual') return { texto: 'Marcada como paga por você', tom: 'ok' };
    if (b.viaCard) return { texto: 'Paga no crédito ' + (b.viaBank || '') + (b.paidDate ? ' em ' + b.paidDate : '') + ', vai para a fatura', tom: 'ok' };
    if (b.auto && b.antecipado > 0 && !b.paidDate) return { texto: 'Paga, antecipada', tom: 'ok' };
    return { texto: 'Paga' + (b.paidDate ? ' em ' + b.paidDate : '') + ', vista no extrato', tom: 'ok' };
  }
  const extra = (b.auto && b.antecipado > 0 ? ' · R$ ' + fmtMoney(b.antecipado) + ' já pago' : '') + (b.estimada ? ' · valor até agora' : '') + (b.manual ? ' · lançado à mão' : '');
  if (today === 99) return { texto: 'Venceu dia ' + String(b.dia).padStart(2, '0') + ', não achei o pagamento' + extra, tom: 'alerta' };
  const diff = b.dia - today;
  if (today > 0 && diff < 0) return { texto: 'Venceu dia ' + String(b.dia).padStart(2, '0') + ', não achei o pagamento' + extra, tom: 'alerta' };
  if (today > 0 && diff === 0) return { texto: 'Vence hoje' + extra, tom: 'alerta' };
  if (today > 0 && diff === 1) return { texto: 'Vence amanhã, dia ' + String(b.dia).padStart(2, '0') + extra, tom: 'alerta' };
  return { texto: (b.semanal ? 'Semanal, vence ' : 'Vence dia ') + String(b.dia).padStart(2, '0') + extra, tom: 'normal' };
}

function fmtMoney(v) {
  const p = Math.abs(v).toFixed(2).split('.');
  return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
}

module.exports = { buildModel, classifyOne, categoryFor, norm, monthKey, addMonths, fmtMoney, CATS, bankStyle, shortBankName };
