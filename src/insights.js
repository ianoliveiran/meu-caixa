'use strict';
// Recursos opcionais do painel: metas, limites, parcelas futuras, cobranças que se repetem,
// gastos fora do normal, Pix no crédito no ano, resumo do mês e histórico de 6 meses.
// Cada um pode ser desligado em Bancos e ajustes.

const FEATURE_DEFAULTS = {
  metas: true, limites: true, parcelas: true, assinaturas: true, alertas: true,
  pixAno: true, resumo: true, grafico: true, semanal: false
};

const DAY = 86400000;
const SPEND = new Set(['expense', 'pix_credit', 'fee']);

function features(settings) {
  return Object.assign({}, FEATURE_DEFAULTS, (settings && settings.features) || {});
}

function median(xs) {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// h = { all, now, mk, settings, db, label, monthKey, addMonths, monthLabel, round2, CATS, suggestTerm, bankAccounts, bankNameOf, catTotals, avisos, seenAt }
function buildInsights(h) {
  const f = features(h.settings);
  const { all, now, round2, monthKey, addMonths, monthLabel } = h;
  const nowKey = monthKey(now);
  const out = { features: f };

  // Gasto e entrada de um mês, do mesmo jeito que "Para onde foi o dinheiro".
  const monthTotals = (key) => {
    let saiu = 0;
    let entrou = 0;
    const cats = {};
    for (const t of all) {
      if (monthKey(t.date) === key) {
        if (SPEND.has(t.kind)) { saiu += Math.abs(t.value); cats[t.cat] = (cats[t.cat] || 0) + Math.abs(t.value); }
        if (t.kind === 'refund') { saiu -= t.value; if (cats[t.cat]) cats[t.cat] -= t.value; }
      }
      if (t.kind === 'income' && t.comp === key) entrou += t.value;
    }
    return { saiu: round2(saiu), entrou: round2(entrou), sobra: round2(entrou - saiu), cats };
  };
  const firstKey = all.length ? monthKey(all[all.length - 1].date) : nowKey;

  // ----- Histórico de 6 meses -----
  const hist = [];
  for (let i = 5; i >= 0; i--) {
    const key = addMonths(nowKey, -i);
    if (key < firstKey) continue;
    const t = monthTotals(key);
    const ml = monthLabel(key);
    hist.push({ key, mes: ml.curto, ano: ml.ano, entrou: t.entrou, saiu: t.saiu, sobra: t.sobra, atual: key === nowKey, cats: t.cats });
  }
  // O primeiro mês com dados costuma vir pela metade; fica fora da média.
  const fechados = hist.filter((x) => !x.atual && x.key !== firstKey && (x.entrou > 0 || x.saiu > 0)).slice(-3);
  const ritmo = fechados.length ? round2(fechados.reduce((s, x) => s + x.sobra, 0) / fechados.length) : null;
  if (f.grafico) out.historico = hist.map((x) => ({ key: x.key, mes: x.mes, ano: x.ano, entrou: x.entrou, saiu: x.saiu, sobra: x.sobra, atual: x.atual }));

  // ----- Metas -----
  if (f.metas) {
    out.metas = (h.settings.metas || []).map((g) => {
      const acc = g.contaId ? h.bankAccounts.find((a) => a.id === g.contaId) : null;
      // Meta que anda com uma despesa fixa: o que já tinha pago antes + cada parcela que aparece no extrato.
      const bill = g.billId ? (h.settings.bills || []).find((b) => b.id === g.billId) : null;
      let pagos = null;
      let parcela = null;
      if (bill) {
        parcela = Number(bill.valor) || 0;
        const keys = String(bill.busca || bill.nome || '').split(',').map(h.norm).filter((k) => k.length >= 3);
        const desde = /^\d{4}-\d{2}$/.test(g.desde || '') ? g.desde : '0000-00';
        const meses = {};
        let soma = 0;
        let qtd = 0;
        for (const t of all) {
          if (!(t.value < 0) || !['expense', 'pix_credit'].includes(t.kind)) continue;
          if (monthKey(t.date) < desde) continue;
          if (!keys.some((k) => t.text.includes(k))) continue;
          const a = Math.abs(t.value);
          if (parcela > 0 && (a < parcela * 0.3 || a > parcela * 3)) continue;
          soma += a; qtd++; meses[monthKey(t.date)] = true;
        }
        // Mês marcado como pago à mão, sem pagamento achado no extrato, conta a parcela.
        for (const [mk, marks] of Object.entries(h.db.billMarks || {})) {
          if (mk >= desde && marks && marks[bill.id] === true && !meses[mk]) { soma += parcela; qtd++; }
        }
        pagos = { soma: round2(soma), qtd };
      }
      const atual = acc ? round2(Number(acc.balance) || 0) : round2((Number(g.guardado) || 0) + (pagos ? pagos.soma : 0));
      const valor = Number(g.valor) || 0;
      const falta = round2(Math.max(0, valor - atual));
      let meses = null;
      if (g.prazo && /^\d{4}-\d{2}$/.test(g.prazo)) {
        const [py, pm] = g.prazo.split('-').map(Number);
        meses = Math.max(1, (py - now.getFullYear()) * 12 + (pm - 1 - now.getMonth()) + 1);
      }
      const porMes = meses ? round2(falta / meses) : null;
      let chegaEm = null;
      const passo = bill ? parcela : ritmo;
      if (falta <= 0) chegaEm = 'já chegou';
      else if (passo && passo > 0) {
        const n = Math.ceil(falta / passo);
        const ml = monthLabel(addMonths(nowKey, n));
        chegaEm = ml.nome.toLowerCase() + ' de ' + ml.ano;
      }
      const prazoLabel = g.prazo ? (() => { const ml = monthLabel(g.prazo); return ml.nome.toLowerCase() + ' de ' + ml.ano; })() : null;
      return {
        id: g.id, nome: g.nome, valor, atual, falta, pct: valor > 0 ? Math.min(100, round2(atual / valor * 100)) : 0,
        prazo: g.prazo || '', prazoLabel, meses, porMes, ritmo: bill ? null : ritmo, chegaEm,
        noRitmo: porMes !== null && passo !== null && passo !== undefined ? passo >= porMes - 0.01 : null,
        conta: acc ? h.bankNameOf(acc) : null, contaId: g.contaId || '', guardado: Number(g.guardado) || 0,
        bill: bill ? { nome: bill.nome, parcela, pagos: pagos.soma, qtd: pagos.qtd, extra: porMes !== null ? round2(Math.max(0, porMes - parcela)) : null } : null
      };
    });
  }

  // ----- Limites por categoria -----
  if (f.limites) {
    const lim = h.settings.limites || {};
    out.limites = Object.keys(lim).filter((c) => Number(lim[c]) > 0 && h.CATS[c]).map((c) => {
      const gasto = round2(Math.max(0, h.catTotals[c] || 0));
      const valor = Number(lim[c]);
      return { cat: c, label: h.CATS[c].label, valor, gasto, pct: round2(gasto / valor * 100), resta: round2(valor - gasto) };
    }).sort((a, b) => b.pct - a.pct);
    // Aviso quando passa de 80% e de 100% no mês atual.
    if (h.mk === nowKey) {
      for (const c of Object.keys(lim)) {
        const valor = Number(lim[c]);
        if (!(valor > 0) || !h.CATS[c]) continue;
        const txs = all.filter((t) => monthKey(t.date) === nowKey && t.cat === c && (SPEND.has(t.kind) || t.kind === 'refund')).sort((a, b) => a.date - b.date);
        let acc = 0;
        let passou80 = null;
        let passou100 = null;
        for (const t of txs) {
          acc += t.kind === 'refund' ? -t.value : Math.abs(t.value);
          const when = +(t.createdAt || t.date);
          if (!passou80 && acc >= valor * 0.8) passou80 = when;
          if (!passou100 && acc >= valor) passou100 = when;
        }
        const label = h.CATS[c].label;
        if (passou100) h.avisos.push({ id: 'lim100:' + c + ':' + nowKey, tipo: 'limite', titulo: label + ': limite estourado', texto: 'Gastou R$ ' + fmt(acc) + ' de R$ ' + fmt(valor) + ' este mês', valor: -round2(acc), cat: c, quando: passou100, atrasada: true, novo: passou100 > h.seenAt });
        else if (passou80) h.avisos.push({ id: 'lim80:' + c + ':' + nowKey, tipo: 'limite', titulo: label + ': 80% do limite', texto: 'Restam R$ ' + fmt(valor - acc) + ' até o fim do mês', valor: -round2(acc), cat: c, quando: passou80, novo: passou80 > h.seenAt });
      }
    }
  }

  // ----- Parcelas futuras nos cartões -----
  if (f.parcelas) {
    const compras = new Map();
    for (const t of all) {
      if (!t.inst || !t.isCard || t.value >= 0) continue;
      const key = t.accountId + '|' + h.suggestTerm(t.description) + '|' + t.inst.total + '|' + Math.round(Math.abs(t.value));
      const prev = compras.get(key);
      if (!prev || t.inst.n > prev.inst.n) compras.set(key, t);
    }
    const meses = {};
    for (const t of compras.values()) {
      const base = monthKey(t.date);
      for (let k = 1; k <= t.inst.total - t.inst.n; k++) {
        const key = addMonths(base, k);
        if (key <= nowKey) continue;
        if (!meses[key]) meses[key] = { total: 0, itens: [] };
        meses[key].total += Math.abs(t.value);
        meses[key].itens.push({ nome: t.description, valor: round2(Math.abs(t.value)), parcela: (t.inst.n + k) + ' de ' + t.inst.total, cartao: t.bank });
      }
    }
    out.parcelas = Object.keys(meses).sort().slice(0, 12).map((key) => {
      const ml = monthLabel(key);
      return { key, mes: ml.curto, nome: ml.nome, ano: ml.ano, total: round2(meses[key].total), itens: meses[key].itens.sort((a, b) => b.valor - a.valor) };
    });
  }

  // ----- Cobranças que se repetem (assinaturas) -----
  if (f.assinaturas) {
    const janela = [0, 1, 2, 3].map((i) => addMonths(nowKey, -i));
    const grupos = new Map();
    for (const t of all) {
      if (t.kind !== 'expense' && t.kind !== 'pix_credit') continue;
      if (t.inst) continue;
      const key = monthKey(t.date);
      if (!janela.includes(key)) continue;
      const termo = h.suggestTerm(t.description);
      if (!termo) continue;
      if (!grupos.has(termo)) grupos.set(termo, []);
      grupos.get(termo).push(t);
    }
    const bills = (h.settings.bills || []).map((b) => String(b.busca || b.nome || '').toLowerCase());
    const lista = [];
    for (const [termo, txs] of grupos) {
      const porMes = {};
      for (const t of txs) (porMes[monthKey(t.date)] = porMes[monthKey(t.date)] || []).push(t);
      const ms = Object.keys(porMes);
      if (ms.length < 3) continue;
      if (Object.values(porMes).some((l) => l.length > 2)) continue;
      const vals = txs.map((t) => Math.abs(t.value));
      const med = median(vals);
      if (vals.some((v) => Math.abs(v - med) > Math.max(5, med * 0.25))) continue;
      const ordem = txs.slice().sort((a, b) => b.date - a.date);
      const ultimo = Math.abs(ordem[0].value);
      const anterior = ordem[1] ? Math.abs(ordem[1].value) : ultimo;
      const subiu = ultimo > anterior * 1.05 && ultimo - anterior >= 1;
      const ja = bills.some((b) => b && (b.includes(termo) || termo.includes(b)));
      lista.push({
        termo, nome: ordem[0].description, valor: round2(ultimo), anual: round2(ultimo * 12), meses: ms.length,
        cat: ordem[0].cat, conta: ordem[0].bank + (ordem[0].isCard ? ' crédito' : ' conta'),
        dia: ordem[0].date.getDate(), subiu: subiu ? { de: round2(anterior), para: round2(ultimo) } : null, jaFixa: ja,
        marca: h.label(ordem[0]).marca
      });
      if (subiu && f.alertas !== false) {
        const t = ordem[0];
        const when = +(t.createdAt || t.date);
        if (now - when < 10 * DAY) h.avisos.push({ id: 'sub:' + t.id, tipo: 'alerta', titulo: ordem[0].description + ' ficou mais cara', texto: 'De R$ ' + fmt(anterior) + ' para R$ ' + fmt(ultimo), valor: -round2(ultimo), cat: t.cat, marca: h.label(t).marca, quando: when, novo: when > h.seenAt });
      }
    }
    out.assinaturas = lista.sort((a, b) => b.valor - a.valor);
    out.assinaturasTotal = round2(lista.reduce((s, x) => s + x.valor, 0));
  }

  // ----- Gastos fora do normal e cobranças duplicadas -----
  if (f.alertas) {
    const recentes = all.filter((t) => SPEND.has(t.kind) && t.kind !== 'fee' && now - (t.createdAt || t.date) < 7 * DAY && now - t.date < 10 * DAY);
    const porTermo = new Map();
    for (const t of all) {
      if (!SPEND.has(t.kind) || t.kind === 'fee' || t.inst) continue;
      const termo = h.suggestTerm(t.description);
      if (!porTermo.has(termo)) porTermo.set(termo, []);
      porTermo.get(termo).push(t);
    }
    for (const t of recentes) {
      if (t.inst) continue;
      const termo = h.suggestTerm(t.description);
      const outros = (porTermo.get(termo) || []).filter((x) => x.id !== t.id && x.date < t.date);
      const when = +(t.createdAt || t.date);
      if (outros.length >= 3) {
        const med = median(outros.map((x) => Math.abs(x.value)));
        if (Math.abs(t.value) > med * 2.5 && Math.abs(t.value) - med > 30) {
          h.avisos.push({ id: 'alto:' + t.id, tipo: 'alerta', titulo: t.description + ' veio alto', texto: 'Costuma ser uns R$ ' + fmt(med) + ' · ' + h.label(t).conta, valor: t.value, cat: t.cat, marca: h.label(t).marca, quando: when, novo: when > h.seenAt });
        }
      }
      const dup = all.find((x) => x !== t && x.id < t.id && x.accountId === t.accountId && x.value === t.value && monthKey(x.date) === monthKey(t.date) && Math.abs(x.date - t.date) < DAY && h.suggestTerm(x.description) === termo && SPEND.has(x.kind));
      if (dup) {
        h.avisos.push({ id: 'dup:' + t.id, tipo: 'alerta', titulo: 'Cobrança repetida? ' + t.description, texto: 'Dois lançamentos iguais no mesmo dia · ' + h.label(t).conta, valor: t.value, cat: t.cat, marca: h.label(t).marca, quando: when, novo: when > h.seenAt });
      }
    }
  }

  // ----- Pix no crédito no ano -----
  if (f.pixAno) {
    const ano = now.getFullYear();
    const doAno = all.filter((t) => t.date.getFullYear() === ano);
    const pix = doAno.filter((t) => t.kind === 'pix_credit');
    const taxas = doAno.filter((t) => t.kind === 'fee');
    out.pixAno = { ano, qtd: pix.length, total: round2(pix.reduce((s, t) => s + Math.abs(t.value), 0)), taxas: round2(taxas.reduce((s, t) => s + Math.abs(t.value), 0)) };
  }

  // ----- Resumo do mês que fechou (aparece no sininho nos primeiros dias do mês) -----
  if (f.resumo && now.getDate() <= 7) {
    const prevKey = addMonths(nowKey, -1);
    const p = monthTotals(prevKey);
    if (p.saiu > 0 || p.entrou > 0) {
      const pp = monthTotals(addMonths(nowKey, -2));
      let destaque = '';
      let maior = null;
      for (const c of Object.keys(p.cats)) {
        const antes = pp.cats[c] || 0;
        const dif = p.cats[c] - antes;
        if (antes > 50 && dif > 50 && (!maior || dif > maior.dif)) maior = { c, dif, pct: Math.round(dif / antes * 100) };
      }
      if (maior) destaque = ' · ' + (h.CATS[maior.c] || { label: maior.c }).label + ' subiu ' + maior.pct + '%';
      const ml = monthLabel(prevKey);
      const when = +new Date(now.getFullYear(), now.getMonth(), 1, 8);
      h.avisos.push({ id: 'resumo:' + prevKey, tipo: 'resumo', titulo: 'Resumo de ' + ml.nome.toLowerCase(), texto: 'Entrou R$ ' + fmt(p.entrou) + ', saiu R$ ' + fmt(p.saiu) + destaque, valor: p.sobra, cat: 'renda', quando: Math.min(+now, when), mes: prevKey, novo: when > h.seenAt && when <= +now });
    }
  }

  // ----- Resumo semanal da IA: avisa quando um novo ficou pronto -----
  if (f.semanal && h.db.weekly && h.db.weekly.at) {
    const when = +new Date(h.db.weekly.at);
    if (now - when < 7 * DAY) h.avisos.push({ id: 'semanal:' + h.db.weekly.at, tipo: 'semanal', titulo: 'Sua conversa da semana chegou', texto: 'Resumo da semana na aba Conversar', valor: null, cat: 'renda', quando: when, novo: when > h.seenAt });
  }

  return out;
}

function fmt(v) {
  const p = Math.abs(Number(v) || 0).toFixed(2).split('.');
  return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
}

module.exports = { buildInsights, features, FEATURE_DEFAULTS };
