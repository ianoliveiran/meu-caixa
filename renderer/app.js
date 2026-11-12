'use strict';
(function () {
  const api = window.caixa;
  const { CAT, icon, tile, ill } = window.ART;
  const root = document.getElementById('root');

  const S = {
    screen: 'visao',
    month: null,
    m: null,
    card: 0,
    day: null,
    showPaid: false,
    filtro: 'todos',
    cat: null,
    q: '',
    menu: false,
    dialog: null,
    msg: {},
    syncing: false,
    progress: null,
    editSecrets: false,
    hide: false
  };
  try { S.hide = localStorage.getItem('meucaixa-ocultar') === '1'; } catch (e) { /* sem armazenamento */ }

  // ---------- Utilidades ----------
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function money(v) {
    if (S.hide) return '•••,••';
    return moneyRaw(v);
  }
  function moneyRaw(v) {
    const p = Math.abs(Number(v) || 0).toFixed(2).split('.');
    return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
  }
  const brl = (v) => 'R$ ' + money(v);
  const signedBrl = (v) => (v < 0 ? '− ' : '+ ') + brl(v);
  function bigNum(v, cls) {
    const parts = money(v).split(',');
    return '<div class="' + (cls || 'big') + '"><span class="rs">R$ </span>' + parts[0] + '<span class="ct">,' + parts[1] + '</span></div>';
  }
  function when(iso) {
    if (!iso) return 'nunca';
    const d = new Date(iso);
    const now = new Date();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const sameDay = (a, b) => a.toDateString() === b.toDateString();
    if (sameDay(d, now)) return 'hoje às ' + hm;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, y)) return 'ontem às ' + hm;
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' às ' + hm;
  }
  function dateBr(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  const catStyle = (c) => CAT[c] || CAT.outros;
  // Selo com as iniciais da empresa nas cores dela; sem selo, o ícone da categoria.
  function mark(mk, cat, small) {
    if (!mk) return tile(cat, small);
    return '<span class="tile' + (small ? ' s' : '') + ' brand" aria-hidden="true" style="background:' + mk.cor + ';color:' + mk.fg + '">' + esc(mk.sigla) + '</span>';
  }

  let toastTimer = null;
  function toast(text) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3500);
  }

  async function load() {
    S.m = await api.getModel(S.month);
    S.month = S.m.month.key;
    S.syncing = !!S.m.sync.syncing;
    if (S.card >= S.m.cards.length) S.card = 0;
    render();
  }

  // ---------- Estrutura ----------
  const NAV = [
    ['visao', 'Visão geral', 'grid'],
    ['lanc', 'Lançamentos', 'list'],
    ['cartoes', 'Cartões', 'card'],
    ['contas', 'Contas a pagar', 'calendar'],
    ['fixas', 'Despesas fixas', 'contas']
  ];

  function sidebar(m) {
    const navBtn = ([id, label, ic]) => '<button type="button" data-act="nav" data-v="' + id + '" class="' + (S.screen === id ? 'on' : '') + '">' + icon(ic) + label + '</button>';
    let box;
    if (S.syncing) {
      const p = S.progress;
      box = '<div class="sync-box idle"><span class="ic">' + icon('sync', 15, 1.8).replace('<svg', '<svg class="spin"') + '</span><div><b>Sincronizando</b><span>' + (p ? esc(p.label) + ' (' + p.step + ' de ' + p.total + ')' : 'buscando seus bancos') + '</span></div></div>';
    } else if (m.sync.demo) {
      box = '<div class="sync-box idle"><span class="ic">' + icon('alert', 15, 1.8) + '</span><div><b>Dados de exemplo</b><span>Conecte seus bancos para ver os seus números.</span></div></div>';
    } else if (m.sync.error) {
      box = '<div class="sync-box err"><span class="ic">' + icon('alert', 15, 1.8) + '</span><div><b>Algo falhou</b><span>' + esc(m.sync.error) + '</span></div></div>';
    } else if (m.sync.last) {
      box = '<div class="sync-box ok"><span class="ic">' + icon('sync', 15, 1.8) + '</span><div><b>Sincronizado</b><span>' + esc(when(m.sync.last)) + ' · ' + m.bancos.length + (m.bancos.length === 1 ? ' banco' : ' bancos') + '</span></div></div>';
    } else {
      box = '<div class="sync-box idle"><span class="ic">' + icon('sync', 15, 1.8) + '</span><div><b>Ainda não sincronizou</b><span>Conecte seus bancos em Bancos e ajustes.</span></div></div>';
    }
    return '<nav class="side" aria-label="Menu">' +
      '<div class="brand">' + window.ART.ill.logo + '<div><b>Meu Caixa</b><small>Finanças pessoais</small></div></div>' +
      '<div class="nav"><span class="nav-label">Menu</span>' + NAV.map(navBtn).join('') + '</div>' +
      '<div class="nav"><span class="nav-label">Ajustes</span>' + navBtn(['bancos', 'Bancos e ajustes', 'bank']) + '</div>' +
      '<div class="side-foot">' + box + '</div></nav>';
  }

  function topBar(m) {
    const titles = { visao: null, lanc: 'Lançamentos', cartoes: 'Cartões', contas: 'Contas a pagar', fixas: 'Despesas fixas', bancos: 'Bancos e ajustes' };
    const t = titles[S.screen];
    const monthNav = S.screen !== 'bancos' && S.screen !== 'fixas';
    const h1 = t
      ? esc(t) + (monthNav ? ' <span>· ' + esc(m.month.nome.toLowerCase()) + ' ' + m.month.ano + '</span>' : '')
      : esc(m.month.nome) + ' <span>' + m.month.ano + '</span>';
    return '<header class="top-bar"><div class="left">' +
      (monthNav ? '<button type="button" class="icon-btn ghost" data-act="month" data-v="' + m.month.prev + '" aria-label="Mês anterior">' + icon('left', 16, 1.8) + '</button>' +
        '<button type="button" class="icon-btn" data-act="month" data-v="' + m.month.next + '" aria-label="Próximo mês">' + icon('right', 16, 1.8) + '</button>' : '') +
      '<h1>' + h1 + '</h1>' +
      (!m.month.isCurrent && monthNav ? '<button type="button" class="btn small" data-act="month" data-v="">Voltar para hoje</button>' : '') +
      (m.sync.demo ? '<span class="pill amber">Dados de exemplo</span>' : '') +
      '</div><div class="right">' +
      '<button type="button" class="icon-btn out" data-act="hide" aria-pressed="' + S.hide + '" aria-label="' + (S.hide ? 'Mostrar valores' : 'Esconder valores') + '" title="' + (S.hide ? 'Mostrar valores' : 'Esconder valores') + '">' + icon(S.hide ? 'eyeoff' : 'eye') + '</button>' +
      '<button type="button" class="icon-btn out" data-act="nav" data-v="lanc" aria-label="' + m.novas + ' lançamentos novos nas últimas 24 horas">' + icon('bell') + (m.novas ? '<span class="badge">' + m.novas + '</span>' : '') + '</button>' +
      '<button type="button" class="icon-btn out" data-act="sync" aria-label="Sincronizar agora"' + (S.syncing || m.sync.demo ? ' disabled' : '') + '>' + icon('sync', 18, 1.6).replace('<svg', S.syncing ? '<svg class="spin"' : '<svg') + '</button>' +
      '<div class="dropdown"><button type="button" class="btn primary" data-act="menu" aria-expanded="' + S.menu + '">' + icon('plus', 14, 2) + 'Adicionar' + icon('down', 14, 2) + '</button>' +
      (S.menu ? '<div class="menu"><button type="button" data-act="dlg-bill">' + tile('contas', true) + 'Despesa fixa (apartamento, luz...)</button><button type="button" data-act="dlg-bill" data-freq="unica">' + tile('calendar', true) + 'Conta a pagar (uma vez só)</button></div>' : '') +
      '</div></div></header>';
  }

  // ---------- Visão geral ----------
  function sobraPanel(m) {
    const f = m.fluxo;
    const renda = m.renda.valor;
    const segs = [
      ['Contas fixas', f.contasFixas, '#1e3a8a', f.pct.contasFixas],
      ['Faturas que vencem no mês', f.cartoes, '#2563eb', f.pct.cartoes],
      ['Dia a dia (débito e Pix)', f.diaADia, '#60a5fa', f.pct.diaADia],
      ['Reserva', f.reserva, '#ec4899', f.pct.reserva]
    ];
    const total = Math.max(renda, f.contasFixas + f.cartoes + f.diaADia + f.reserva + Math.max(0, f.sobra), 1);
    const bar = segs.concat([['Sobra', Math.max(0, f.sobra), '#16a34a']])
      .filter((s) => s[1] > 0.005)
      .map((s) => '<div style="flex:' + (s[1] / total * 100).toFixed(2) + ' 1 0;background:' + s[2] + '"></div>').join('');
    const neg = f.sobra < 0;
    return '<section class="panel" style="flex:2 1 520px;gap:22px" aria-label="Sobra prevista">' +
      '<div class="head"><div style="gap:14px"><h2 class="h2">' + (m.month.isCurrent ? 'Sobra prevista' : 'Sobra do mês') + '</h2>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px">' +
      (neg ? '<div class="huge" style="color:#be123c"><span class="rs">− R$ </span>' + money(f.sobra).split(',')[0] + '<span class="ct">,' + money(f.sobra).split(',')[1] + '</span></div>' : bigNum(f.sobra, 'huge')) +
      '<div style="display:flex;flex-direction:column;gap:2px;padding-left:16px;border-left:1px solid #e2e8f0">' +
      (renda > 0
        ? (neg ? '<span class="warn">Faltam ' + brl(-f.sobra) + ' no mês</span>' : '<span class="good">' + icon('up', 14, 2) + f.pct.sobra + '% da renda livre</span>')
        : '<span class="warn">Informe seu salário</span>') +
      '<span class="sub" style="font-size:13px">depois de contas, faturas e reserva</span></div></div></div>' + ill.wallet + '</div>' +
      '<div class="bar" role="img" aria-label="Para onde vai a renda do mês">' + bar + '</div>' +
      '<div class="legend">' +
      '<div><span class="k">' + (m.renda.fonte === 'previsto' ? 'Salário (previsto)' : 'Renda recebida') + '</span><span class="v">' + brl(renda) + '</span></div>' +
      segs.map((s) => '<div><span class="k"><span class="dot" style="background:' + s[2] + '"></span>' + s[0] + '</span><span class="v">− ' + brl(s[1]) + ' <small>' + s[3] + '%</small></span></div>').join('') +
      '<div><span class="k"><span class="dot" style="background:#16a34a"></span>Sobra</span><span class="v" style="color:' + (neg ? '#be123c' : '#15803d') + '">' + (neg ? '− ' : '') + brl(f.sobra) + '</span></div>' +
      '</div>' +
      (renda <= 0 ? '<button type="button" class="link" data-act="nav" data-v="bancos">Informar salário em Bancos e ajustes</button>' : '') +
      '</section>';
  }

  function reservaPanel(m) {
    const r = m.reserva;
    if (!r.conta) {
      return '<section class="panel" style="flex:1 1 300px" aria-label="Reserva"><div class="head"><div><h2 class="h2">Reserva</h2><span class="sub">Escolha em qual conta fica sua reserva para acompanhar a meta.</span></div>' + ill.piggy + '</div><button type="button" class="btn" data-act="nav" data-v="bancos">Escolher conta da reserva</button></section>';
    }
    return '<section class="panel" style="flex:1 1 300px" aria-label="Reserva">' +
      '<div class="head"><div><h2 class="h2">Reserva</h2><span class="sub">no ' + esc(r.conta) + '</span>' + bigNum(r.saldo) +
      (r.rendeuMes > 0 ? '<span class="good" style="font-size:13px">' + icon('check', 14, 2) + 'rendeu ' + brl(r.rendeuMes) + ' este mês</span>' : '') + '</div>' + ill.piggy + '</div>' +
      (r.meta > 0
        ? '<div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;justify-content:space-between" class="sub"><span>' + Math.round(r.pct) + '% da meta</span><span>meta ' + brl(r.meta) + '</span></div>' +
          '<div role="img" aria-label="' + Math.round(r.pct) + '% da meta" style="height:12px;background:#fce7f3;border-radius:6px"><div style="width:' + r.pct + '%;height:12px;background:linear-gradient(90deg,#f472b6,#db2777);border-radius:6px"></div></div></div>'
        : '<button type="button" class="link" data-act="nav" data-v="bancos" style="align-self:flex-start">Definir uma meta</button>') +
      '<div class="tiles">' +
      '<div>' + tile('reserva') + '<div><span>Guardado no mês</span><b>' + brl(r.guardadoMes) + '</b></div></div>' +
      '<div><span class="tile" aria-hidden="true" style="background:#dcfce7;color:#15803d">' + icon('trend') + '</span><div><span>Rendeu no mês</span><b>' + brl(r.rendeuMes) + '</b></div></div>' +
      (r.meta > 0 ? '<div><span class="tile" aria-hidden="true" style="background:#dbeafe;color:#1d4ed8">' + icon('target') + '</span><div><span>Falta</span><b>' + brl(r.falta) + '</b></div></div>' +
        '<div><span class="tile" aria-hidden="true" style="background:#fef3c7;color:#b45309">' + icon('calendar') + '</span><div><span>Nesse ritmo</span><b>' + (r.falta <= 0 ? 'Meta batida' : (r.meses ? r.meses + (r.meses === 1 ? ' mês' : ' meses') : 'guarde algo')) + '</b></div></div>' : '') +
      '</div></section>';
  }

  function cardFace(c, opts) {
    const o = opts || {};
    const tag = o.button ? 'button' : 'div';
    const attrs = o.button ? ' type="button" data-act="card-pick" data-v="' + o.index + '" aria-label="Mostrar cartão ' + esc(c.nome) + '"' : '';
    const style = o.style || '';
    return '<' + tag + attrs + ' class="cc' + (o.flat ? ' flat' : '') + '" style="background:' + c.bg + ';' + style + '"><span class="sheen" aria-hidden="true"></span>' +
      '<span><span class="bank" style="color:' + c.nameColor + '">' + esc(c.nome) + '</span><span class="state">' + esc(c.atual.estado) + '</span></span>' +
      '<span>' + ill.chip + '<span class="num">' + (c.manual ? 'LANÇADO À MÃO' : '•••• ' + esc(c.final)) + '</span>' + ill.wave + '</span>' +
      '<span style="align-items:flex-end"><span><span class="lbl">Vence</span><span class="val">' + esc(c.atual.vence) + '</span></span>' +
      '<span style="text-align:right"><span class="lbl">Limite livre</span><span class="val">' + brl(c.livre) + '</span></span></span>' +
      '</' + tag + '>';
  }

  function proxBoxes(c) {
    const vals = c.prox.map((p) => p.valor);
    const mx = Math.max.apply(null, vals.concat([1]));
    const ys = vals.map((v) => 12 + 40 * (1 - v / mx));
    const last = c.prox.length - 1;
    return '<div class="months" style="grid-template-columns:repeat(' + c.prox.length + ',minmax(0,1fr))">' + c.prox.map((p, k) => {
      const L = k === 0 ? ys[0] : (ys[k - 1] + ys[k]) / 2;
      const R = k === last ? ys[last] : (ys[k] + ys[k + 1]) / 2;
      const pts = '0,' + L.toFixed(1) + ' 50,' + ys[k].toFixed(1) + ' 100,' + R.toFixed(1);
      const on = !!p.atual;
      const stroke = on ? '#2563eb' : '#94a3b8';
      return '<div class="mbox' + (on ? ' on' : '') + '"><b style="font-size:13px">' + esc(p.mes) + '</b>' +
        '<span class="pill ' + (on ? 'blue' : (p.estado === 'Paga' ? 'green' : 'gray')) + '" style="font-size:10px;padding:2px 8px">' + esc(p.estado) + '</span>' +
        '<div class="chart"><svg aria-hidden="true" viewBox="0 0 100 64" preserveAspectRatio="none">' +
        (on ? '<polygon points="' + pts + ' 100,64 0,64" fill="#dbeafe"/>' : '') +
        '<polyline points="' + pts + '" fill="none" stroke="' + stroke + '" stroke-width="2"' + (on ? '' : ' stroke-dasharray="4 4"') + ' vector-effect="non-scaling-stroke"/></svg>' +
        '<span class="pt" style="top:' + ys[k].toFixed(1) + 'px;border-color:' + stroke + '"></span></div>' +
        '<b style="font-size:13px;color:' + (on ? '#1d4ed8' : '#475569') + '">' + brl(p.valor) + '</b></div>';
    }).join('') + '</div>';
  }

  function cartoesPanel(m) {
    if (!m.cards.length) {
      return '<section class="panel" style="flex:1.15 1 360px" aria-label="Cartões"><div class="head"><div><h2 class="h2">Cartões</h2><span class="sub">Nenhum cartão de crédito conectado.</span></div>' + ill.cards + '</div><div class="cc flat empty"><span>Os cartões aparecem aqui depois que você conectar o banco.</span></div></section>';
    }
    const n = m.cards.length;
    const a = m.cards[S.card] || m.cards[0];
    const stack = m.cards.map((c, i) => {
      const d = (i - S.card + n) % n;
      return cardFace(c, { button: true, index: i, style: 'left:' + (d * 22) + 'px;z-index:' + (n - d) + ';transform:scale(' + (1 - d * 0.08).toFixed(2) + ')' });
    }).join('');
    return '<section class="panel" style="flex:1.15 1 360px;gap:18px" aria-label="Cartões">' +
      '<div class="head"><div><h2 class="h2">Cartões</h2><span class="sub">Fatura ' + esc(a.atual.estado.toLowerCase()) + ' de ' + esc(a.atual.mes) + ' · ' + esc(a.nome) + '</span>' + bigNum(a.atual.valor) +
      (a.atual.antecipado > 0 ? '<span class="good" style="font-size:13px">' + icon('check', 14, 2) + brl(a.atual.antecipado) + ' já antecipado</span>' : '') +
      '</div>' + ill.cards + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><button type="button" class="btn small" data-act="nav" data-v="cartoes">Ver fatura</button>' +
      '<span class="sub">' + n + (n === 1 ? ' cartão' : ' cartões') + ' · ' + brl(m.cardsTotal) + ' no total</span>' +
      (n > 1 ? '<div style="display:flex;gap:6px"><button type="button" class="round" data-act="card-step" data-v="-1" aria-label="Cartão anterior">' + icon('left', 14, 2) + '</button><button type="button" class="round" data-act="card-step" data-v="1" aria-label="Próximo cartão">' + icon('right', 14, 2) + '</button></div>' : '') +
      '</div>' +
      '<div class="stack"><div class="spacer" aria-hidden="true"></div>' + stack + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px"><span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5b6474">' + (a.manual ? 'Fatura · ' : 'Últimas faturas · ') + esc(a.nome) + '</span>' + proxBoxes(a) +
      (a.manual ? '<button type="button" class="btn small rose" style="align-self:flex-start" data-act="dlg-credit" data-v="' + esc(a.manualId) + '">' + icon('pencil', 14) + 'Atualizar gasto e limite</button>' : '') + '</div>' +
      '</section>';
  }

  function billRow(b) {
    const tone = b.status.tom === 'ok' ? 'color:#15803d;font-weight:600' : (b.status.tom === 'alerta' ? 'color:#b45309;font-weight:600' : '');
    return '<div class="li' + (b.paid ? ' paid' : '') + '">' +
      '<button type="button" class="check' + (b.paid ? ' on' : '') + '" data-act="bill-mark" data-v="' + esc(b.id) + '" data-paid="' + (b.paid ? '0' : '1') + '" aria-pressed="' + b.paid + '" aria-label="' + (b.paid ? 'Desmarcar ' : 'Marcar ') + esc(b.nome) + ' como paga"><span>' + icon('check', 12, 2.4) + '</span></button>' +
      mark(b.marca, b.icon, true) +
      '<div class="grow"><span class="t">' + esc(b.nome) + '</span><span class="m" style="' + tone + '">' + esc(b.status.texto) + '</span></div>' +
      '<span class="v">' + brl(b.valor) + '</span></div>';
  }

  function dayPills(m) {
    const days = Array.from(new Set(m.bills.filter((b) => !b.semData).map((b) => b.dia))).sort((a, b) => a - b);
    if (!days.length) return '';
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:32px" class="sub"><span>' + (S.day ? 'Contas do dia ' + String(S.day).padStart(2, '0') : 'Toque num dia para filtrar') + '</span>' +
      (S.day ? '<button type="button" class="btn small" data-act="day" data-v="">Ver todas</button>' : '') + '</div>' +
      '<div class="days">' + days.map((d) => {
        const on = S.day === d;
        const dots = m.bills.filter((b) => b.dia === d && !b.semData).map((b) => '<i style="background:' + (b.paid ? '#16a34a' : (on ? '#ffffff' : '#2563eb')) + '"></i>').join('');
        return '<button type="button" class="day' + (on ? ' on' : '') + '" data-act="day" data-v="' + d + '" aria-pressed="' + on + '">' + String(d).padStart(2, '0') + '<span class="dots" aria-hidden="true">' + dots + '</span></button>';
      }).join('') + '</div>';
  }

  function contasPanel(m) {
    const t = m.billsTotais;
    const filt = (b) => !S.day || (b.dia === S.day && !b.semData);
    const open = m.bills.filter((b) => !b.paid && filt(b));
    const paid = m.bills.filter((b) => b.paid && filt(b));
    const showPaid = S.showPaid || !!S.day;
    const next = m.bills.find((b) => !b.paid);
    const parts = money(t.aberto).split(',');
    return '<section class="panel" style="flex:1 1 320px" aria-label="Contas a pagar">' +
      '<div class="head"><div><h2 class="h2">Contas a pagar' + (next ? ' <small>· próxima dia ' + String(next.dia).padStart(2, '0') + '</small>' : '') + '</h2>' +
      '<div class="big"><span class="rs">R$ </span>' + parts[0] + '<span class="ct">,' + parts[1] + '</span></div>' +
      '<span class="sub">em aberto · <b style="color:#0f172a">' + t.pagas + ' de ' + t.total + ' pagas</b></span></div>' + ill.calendar + '</div>' +
      (m.bills.length ? dayPills(m) : '<div class="empty-state">Cadastre aluguel, luz, internet e o que mais você paga todo mês. O app procura o pagamento sozinho no extrato.<button type="button" class="btn small" data-act="dlg-bill">Adicionar conta fixa</button></div>') +
      '<div class="list">' + open.map(billRow).join('') + (showPaid ? paid.map(billRow).join('') : '') +
      (m.bills.length && !open.length && !showPaid ? '<div class="empty-state" style="padding:16px">Tudo pago' + (S.day ? ' nesse dia' : ' este mês') + '.</div>' : '') + '</div>' +
      (!S.day && paid.length ? '<button type="button" class="toggle-paid' + (S.showPaid ? ' open' : '') + '" data-act="toggle-paid" aria-expanded="' + S.showPaid + '">' + icon('check', 14, 2) + (S.showPaid ? 'Esconder as pagas' : 'Ver ' + paid.length + (paid.length === 1 ? ' paga' : ' pagas') + ' este mês') + icon('down', 14, 2).replace('<svg', '<svg class="chev"') + '</button>' : '') +
      '</section>';
  }

  function txRow(t) {
    const cls = t.valor > 0 ? 'in' : (t.tag && ['Pagamento de fatura', 'Pagamento recebido', 'Entre suas contas'].includes(t.tag) ? 'neutral' : '');
    return '<div class="li">' + mark(t.marca, t.cat) + '<div class="grow"><span class="t">' + esc(t.nome) + (t.pending ? ' <span class="pill gray" style="font-size:10px">pendente</span>' : '') + '</span>' +
      '<span class="m"><span class="dot" style="background:' + t.bankCor + '"></span>' + esc(t.conta) + ' · ' + esc(t.data) + (t.tag ? ' · ' + esc(t.tag) : '') + '</span></div>' +
      '<span class="v ' + cls + '">' + (t.valor > 0 ? '+ ' : '') + brl(t.valor) + '</span></div>';
  }

  function comprasPanel(m) {
    return '<section class="panel" style="flex:1 1 320px" aria-label="Últimas compras">' +
      '<div class="head"><div><h2 class="h2">Últimas compras</h2><span class="sub">entram sozinhas, já com categoria</span>' +
      (m.novas ? '<span class="pill blue" style="align-self:flex-start">' + m.novas + (m.novas === 1 ? ' nova' : ' novas') + ' nas últimas 24 h</span>' : '') + '</div>' + ill.bag + '</div>' +
      (m.compras.length ? '<div class="list">' + m.compras.map(txRow).join('') + '</div>' : '<div class="empty-state">As compras aparecem aqui depois da primeira sincronização.</div>') +
      '<button type="button" class="btn small" style="margin-top:auto;align-self:flex-start" data-act="nav" data-v="lanc">Ver todos os lançamentos</button></section>';
  }

  function donut(cats, total) {
    const C = 2 * Math.PI * 26;
    let off = 0;
    const segs = cats.map((c) => {
      const len = total > 0 ? c.valor / total * C : 0;
      const s = '<circle cx="38" cy="38" r="26" fill="none" stroke="' + catStyle(c.cat).bar + '" stroke-width="14" stroke-dasharray="' + len.toFixed(2) + ' ' + C.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 38 38)"/>';
      off += len;
      return s;
    }).join('');
    return '<svg class="ill" role="img" aria-label="Divisão dos gastos por categoria" width="80" height="80" viewBox="0 0 76 76"><circle cx="38" cy="38" r="26" fill="none" stroke="#f1f5f9" stroke-width="14"/>' + segs + '</svg>';
  }

  function categoriasPanel(m) {
    let cats = m.categorias.slice();
    if (cats.length > 8) {
      const rest = cats.slice(7).reduce((s, c) => s + c.valor, 0);
      cats = cats.slice(0, 7).concat([{ cat: 'outros', label: 'Outras', valor: rest }]);
    }
    const mx = Math.max.apply(null, cats.map((c) => c.valor).concat([1]));
    return '<section class="panel" style="flex:2 1 520px;gap:18px" aria-label="Para onde foi o dinheiro">' +
      '<div class="head"><div><h2 class="h2">Para onde foi o dinheiro</h2><span class="sub">' + brl(m.totalGasto) + ' em gastos no mês, somando cartões, débito e Pix. Pagamento de fatura e transferência entre suas contas não entram. Clique numa categoria para ver os lançamentos.</span></div>' + donut(cats, m.totalGasto) + '</div>' +
      (cats.length ? '<div class="cats">' + cats.map((c) => '<button type="button" class="cat cat-btn" data-act="cat-open" data-v="' + esc(c.cat) + '" aria-label="Ver lançamentos de ' + esc(c.label) + '">' + tile(c.cat) + '<div class="grow"><div class="line"><span style="font-weight:600">' + esc(c.label) + ' <span class="sub">' + (m.totalGasto > 0 ? Math.round(c.valor / m.totalGasto * 100) : 0) + '%</span></span><b style="white-space:nowrap">' + brl(c.valor) + '</b></div>' +
        '<div class="track"><div style="width:' + (c.valor / mx * 100).toFixed(1) + '%;background:' + catStyle(c.cat).bar + '"></div></div></div></button>').join('') + '</div>'
        : '<div class="empty-state">Nenhum gasto neste mês ainda.</div>') +
      '</section>';
  }

  function sidePanels(m) {
    const p = m.pixCredito;
    const manual = m.manual.map((x) => '<div class="li">' + tile('restaurantes') + '<div class="grow"><span class="t">' + esc(x.nome) + ' <span class="pill amber" style="font-size:10px">à mão</span></span><span class="m">atualizado em ' + esc(dateBr(x.atualizado)) + '</span></div><span class="v">' + brl(x.valor) + '</span>' +
      '<button type="button" class="icon-btn ghost" data-act="dlg-manual" data-v="' + esc(x.id) + '" aria-label="Atualizar ' + esc(x.nome) + '">' + icon('pencil', 16) + '</button></div>').join('');
    const credits = m.manualCredits.map((x) => '<div style="display:flex;flex-direction:column;gap:8px;padding:12px 0;border-top:1px solid #eef1f6">' +
      '<div class="li" style="padding:0;border:0">' + mark(/ifood/i.test(x.nome) ? { sigla: 'iF', cor: '#ea1d2c', fg: '#ffffff' } : null, 'restaurantes') +
      '<div class="grow"><span class="t">' + esc(x.nome) + '</span><span class="m">gasto ' + brl(x.gastoAtual) + ' de ' + brl(x.limite) + ' · paga dia ' + String(x.dia).padStart(2, '0') + '</span></div>' +
      '<div style="text-align:right"><span class="sub" style="display:block">livre</span><span class="v" style="color:#15803d">' + brl(x.livre) + '</span></div>' +
      '<button type="button" class="icon-btn ghost" data-act="dlg-credit" data-v="' + esc(x.id) + '" aria-label="Editar ' + esc(x.nome) + '">' + icon('pencil', 16) + '</button></div>' +
      '<div class="track" role="img" aria-label="Limite usado" style="height:8px"><div style="height:8px;width:' + (x.limite > 0 ? Math.min(100, x.gastoAtual / x.limite * 100).toFixed(1) : 0) + '%;background:#e11d48"></div></div>' +
      (x.recentes.length ? '<div class="list">' + x.recentes.map((c) => '<div class="li" style="padding:6px 0;border-top:0"><div class="grow"><span class="t" style="font-weight:500">' + esc(c.descricao) + '</span><span class="m">' + esc(c.data) + '</span></div><span class="v">' + brl(c.valor) + '</span>' +
        '<button type="button" class="icon-btn ghost" data-act="compra-remove" data-v="' + esc(c.id) + '" data-credit="' + esc(x.id) + '" aria-label="Apagar a compra ' + esc(c.descricao) + '">' + icon('trash', 15) + '</button></div>').join('') + '</div>' : '') +
      '<button type="button" class="btn small rose" style="align-self:flex-start" data-act="dlg-compra" data-v="' + esc(x.id) + '">' + icon('plus', 14, 2) + 'Lançar compra</button></div>').join('');
    const manualPanel = '<section class="panel" aria-label="iFood e outros créditos"><div class="head"><div><h2 class="h2">iFood e outros créditos</h2><span class="sub">Esses não vêm do banco. Lance cada compra aqui e o limite livre se atualiza. No dia do pagamento, marque a fatura como paga em Contas a pagar.</span></div>' + ill.burger + '</div>' +
      (credits ? '<div style="display:flex;flex-direction:column">' + credits + '</div>' : '') +
      '<button type="button" class="btn small" style="align-self:flex-start" data-act="dlg-credit">' + icon('plus', 14, 2) + 'Novo crédito</button></section>';
    const pixPanel = p.qtd
      ? '<section class="panel" aria-label="Pix no crédito"><div class="head"><div><h2 class="h2">Pix no crédito</h2><span class="sub">' + p.qtd + (p.qtd === 1 ? ' Pix' : ' Pix') + ' no crédito este mês</span>' + bigNum(p.total) + '</div>' + ill.lightning + '</div>' +
        '<div class="tiles"><div>' + tile('taxas') + '<div><span>Taxas e juros do mês</span><b>' + brl(p.taxas) + '</b></div></div></div>' +
        '<span class="sub">As taxas são as linhas de juros, IOF e tarifa que aparecem nas faturas dos cartões.</span></section>'
      : '';
    return '<div style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:20px">' + pixPanel + manualPanel + '</div>';
  }

  function planoPanel(m) {
    const p = m.plano;
    const neg = p.livre < 0;
    const parts = money(p.livre).split(',');
    const row = (x) => '<div class="li" style="padding:8px 0">' + tile(x.icon || 'contas', true) + '<div class="grow"><span class="t" style="font-weight:500">' + esc(x.nome) + '</span><span class="m">vence ' + esc(x.dia) + '</span></div><span class="v">− ' + brl(x.valor) + '</span></div>';
    const total = Math.max(p.salario, p.faturasDepois + p.fixasDepois + p.investir + Math.max(0, p.sobraSalario), 1);
    const seg = (v, cor) => v > 0.005 ? '<div style="flex:' + (v / total * 100).toFixed(2) + ' 1 0;background:' + cor + '"></div>' : '';
    const sobraNeg = p.sobraSalario < 0;
    return '<section class="panel" style="flex:2 1 520px;gap:20px" aria-label="Livre até o salário">' +
      '<div class="head"><div style="gap:14px"><h2 class="h2">Livre até o salário <small>· salário previsto ' + esc(p.salarioDia) + '</small></h2>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px">' +
      '<div class="huge"' + (neg ? ' style="color:#be123c"' : '') + '><span class="rs">' + (neg ? '− ' : '') + 'R$ </span>' + parts[0] + '<span class="ct">,' + parts[1] + '</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:2px;padding-left:16px;border-left:1px solid #e2e8f0">' +
      '<span class="sub" style="font-size:13px">' + brl(p.saldoContas) + ' nas contas hoje</span>' +
      (p.totalAntes > 0 ? '<span class="warn" style="font-size:13px">− ' + brl(p.totalAntes) + ' que vence antes do salário</span>' : '<span class="good" style="font-size:13px">' + icon('check', 14, 2) + 'nada vence antes do salário</span>') +
      '</div></div></div>' + ill.wallet + '</div>' +
      (p.antes.length ? '<div class="list">' + p.antes.map(row).join('') + '</div>' : '') +
      '<div style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #eef1f6;padding-top:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><h3 class="h2">Salário de ' + esc(p.salarioMes) + '</h3>' +
      (p.salario > 0 ? '<span class="sub">sobram <b style="color:' + (sobraNeg ? '#be123c' : '#15803d') + ';font-size:15px">' + (sobraNeg ? '− ' : '') + brl(p.sobraSalario) + '</b> para o dia a dia</span>' : '<button type="button" class="link" data-act="nav" data-v="bancos">Informar o salário</button>') + '</div>' +
      (p.salario > 0 ? '<div class="bar" role="img" aria-label="Como o salário se divide">' + seg(p.faturasDepois, '#2563eb') + seg(p.fixasDepois, '#1e3a8a') + seg(p.investir, '#ec4899') + seg(Math.max(0, p.sobraSalario), '#16a34a') + '</div>' : '') +
      '<div class="legend">' +
      '<div><span class="k">Salário</span><span class="v">' + brl(p.salario) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#2563eb"></span>Faturas</span><span class="v">− ' + brl(p.faturasDepois) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#1e3a8a"></span>Despesas fixas</span><span class="v">− ' + brl(p.fixasDepois) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#ec4899"></span>Investir</span><span class="v">− ' + brl(p.investir) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#16a34a"></span>Sobra</span><span class="v" style="color:' + (sobraNeg ? '#be123c' : '#15803d') + '">' + (sobraNeg ? '− ' : '') + brl(p.sobraSalario) + '</span></div>' +
      '</div>' +
      (p.depois.length ? '<details class="det"><summary>Ver o que sai do salário (' + p.depois.length + ')</summary><div class="list">' + p.depois.map(row).join('') + '</div></details>' : '') +
      (!m.settings.bills.length ? '<span class="sub">Cadastre o apartamento e o que mais você paga todo mês em <button type="button" class="link" data-act="nav" data-v="fixas">Despesas fixas</button> para essa conta ficar completa.</span>' : '') +
      '</div></section>';
  }

  function saldosPanel(m) {
    const p = m.plano;
    return '<section class="panel" style="flex:1 1 300px" aria-label="Dinheiro nas contas">' +
      '<div class="head"><div><h2 class="h2">Dinheiro nas contas</h2><span class="sub">saldo de hoje em cada banco</span>' + bigNum(p.saldoContas) + '</div>' + ill.piggy + '</div>' +
      '<div class="list">' + p.contas.map((c) => '<div class="li" style="padding:9px 0"><span class="tile s" aria-hidden="true" style="background:' + c.cor + ';color:#fff;font:700 12px var(--display)">' + esc(c.sigla) + '</span><div class="grow"><span class="t" style="font-weight:500">' + esc(c.nome) + '</span></div><span class="v"' + (c.saldo < 0 ? ' style="color:#be123c"' : '') + '>' + (c.saldo < 0 ? '− ' : '') + brl(c.saldo) + '</span></div>').join('') + '</div>' +
      (p.investir > 0 ? '<span class="sub">Você planeja investir ' + brl(p.investir) + ' por mês.</span>' : '<span class="sub">Investimento: nada por enquanto. <button type="button" class="link" data-act="nav" data-v="bancos">Mudar</button></span>') +
      '</section>';
  }

  function screenVisao(m) {
    return '<div class="row">' + planoPanel(m) + saldosPanel(m) + '</div>' +
      '<div class="row top">' + cartoesPanel(m) + contasPanel(m) + comprasPanel(m) + '</div>' +
      '<div class="row top">' + categoriasPanel(m) + sidePanels(m) + '</div>';
  }

  // ---------- Lançamentos ----------
  function screenLanc(m) {
    const filters = [['todos', 'Todos'], ['gastos', 'Gastos'], ['entradas', 'Entradas'], ['credito', 'Cartão de crédito'], ['movimentos', 'Faturas e entre contas']];
    const spend = ['expense', 'pix_credit', 'fee'];
    const moves = ['card_payment', 'card_payment_in', 'transfer_in', 'transfer_out', 'saving'];
    const q = S.q.trim().toLowerCase();
    const rows = m.lancamentos.filter((t) => {
      if (S.filtro === 'gastos' && !spend.includes(t.kind)) return false;
      if (S.filtro === 'entradas' && !(t.valor > 0 && !moves.includes(t.kind))) return false;
      if (S.filtro === 'credito' && !/crédito$/.test(t.conta)) return false;
      if (S.filtro === 'movimentos' && !moves.includes(t.kind)) return false;
      if (S.cat && t.cat !== S.cat) return false;
      if (q && !(t.nome.toLowerCase().includes(q) || t.catLabel.toLowerCase().includes(q) || t.conta.toLowerCase().includes(q))) return false;
      return true;
    });
    const options = (sel) => m.cats.map((c) => '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('');
    return '<section class="panel" aria-label="Lançamentos">' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px"><div class="chips">' +
      filters.map(([id, l]) => '<button type="button" class="chip' + (S.filtro === id ? ' on' : '') + '" data-act="filtro" data-v="' + id + '" aria-pressed="' + (S.filtro === id) + '">' + l + '</button>').join('') +
      (S.cat ? '<button type="button" class="chip on" data-act="cat-clear" aria-label="Tirar o filtro de categoria" style="background:' + catStyle(S.cat).fg + '">' + esc((m.cats.find((c) => c.id === S.cat) || { label: S.cat }).label) + ' ✕</button>' : '') +
      '</div><input class="search" id="busca" type="search" placeholder="Buscar" aria-label="Buscar lançamentos" value="' + esc(S.q) + '"></div>' +
      '<span class="sub">' + rows.length + (rows.length === 1 ? ' lançamento' : ' lançamentos') + '. Para mudar a categoria, clique nela.</span>' +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Data</th><th>Categoria</th><th>Conta ou cartão</th><th>Valor</th></tr></thead><tbody>' +
        rows.map((t) => {
          const st = catStyle(t.cat);
          const fixed = ['card_payment', 'card_payment_in', 'transfer_in', 'transfer_out'].includes(t.kind);
          return '<tr><td><span class="desc">' + mark(t.marca, t.cat, true) + '<span>' + esc(t.nome) + (t.tag ? '<br><span class="sub">' + esc(t.tag) + '</span>' : '') + '</span></span></td>' +
            '<td class="sub" style="white-space:nowrap">' + esc(t.data) + '</td>' +
            '<td>' + (fixed ? '<span class="pill" style="background:' + st.bg + ';color:' + st.fg + '">' + esc(t.catLabel) + '</span>'
              : '<select class="cat-select" data-tx="' + esc(t.id) + '" aria-label="Categoria de ' + esc(t.nome) + '" style="background:' + st.bg + ';color:' + st.fg + '">' + options(t.cat) + '</select>') + '</td>' +
            '<td><span style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:' + t.bankCor + '"></span>' + esc(t.conta) + '</span></td>' +
            '<td style="font-weight:700;white-space:nowrap;color:' + (t.valor > 0 ? '#15803d' : '#0f172a') + '">' + signedBrl(t.valor) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="empty-state">Nada encontrado neste mês.</div>') +
      '</section>';
  }

  // ---------- Cartões ----------
  function screenCartoes(m) {
    if (!m.cards.length) return '<section class="panel"><div class="empty-state">Nenhum cartão de crédito conectado ainda.</div></section>';
    return '<div class="row top">' + m.cards.map((c) => '<section class="panel" style="flex:1 1 300px;gap:18px">' + cardFace(c, { flat: true }) +
      '<div style="display:flex;flex-direction:column;gap:4px"><span class="sub">' + (c.manual ? 'Lançado à mão' : 'Fatura ' + esc(c.atual.estado.toLowerCase())) + ' · vence ' + esc(c.atual.vence) + '</span>' + bigNum(c.atual.valor) +
      (c.atual.antecipado > 0 ? '<span class="good" style="font-size:13px">' + icon('check', 14, 2) + brl(c.atual.antecipado) + ' antecipado de ' + brl(c.atual.total) + '</span>' : '') + '</div>' +
      (c.limite > 0 ? '<div style="display:flex;flex-direction:column;gap:6px"><div role="img" aria-label="' + c.uso + '% do limite em uso" class="track" style="height:10px"><div style="height:10px;width:' + c.uso + '%;background:' + c.solid + '"></div></div><span class="sub">' + c.uso + '% de ' + brl(c.limite) + ' em uso · livre ' + brl(c.livre) + '</span></div>' : '') +
      proxBoxes(c) +
      (c.manual ? '<button type="button" class="btn small rose" style="align-self:flex-start" data-act="dlg-credit" data-v="' + esc(c.manualId) + '">' + icon('pencil', 14) + 'Atualizar gasto e limite</button>'
        : '<span class="sub">' + (c.parceladas ? c.parceladas + (c.parceladas === 1 ? ' compra parcelada em andamento.' : ' compras parceladas em andamento.') : '') + (c.atual.fonte ? (c.parceladas ? ' ' : '') + 'Como calculei: ' + esc(c.atual.fonte) + '. O banco atualiza uma vez por dia.' : '') + '</span>') + '</section>').join('') + '</div>' +
      '<section class="panel" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between"><div style="display:flex;flex-direction:column;gap:4px"><h2 class="h2">Total que falta pagar nos cartões</h2><span class="sub">Soma da fatura mostrada em cada cartão, já descontado o que você antecipou.</span></div><span class="big">' + brl(m.cardsTotal) + '</span></section>';
  }

  // ---------- Contas a pagar ----------
  function screenContas(m) {
    const t = m.billsTotais;
    const filt = (b) => !S.day || b.dia === S.day;
    const fixed = m.settings.bills;
    const avulsas = m.settings.bills.filter((b) => b.freq === 'unica');
    return '<section class="panel" aria-label="Contas do mês">' +
      '<div style="display:flex;flex-wrap:wrap;gap:16px">' +
      '<div style="flex:1 1 180px;background:#fff7ed;border-radius:16px;padding:16px"><span class="sub" style="color:#9a3412;font-weight:600">Em aberto</span><div class="big" style="font-size:30px">' + brl(t.aberto) + '</div></div>' +
      '<div style="flex:1 1 180px;background:#f0fdf4;border-radius:16px;padding:16px"><span class="sub" style="color:#166534;font-weight:600">Já pago</span><div class="big" style="font-size:30px;color:#15803d">' + brl(t.pago) + '</div></div>' +
      '<div style="flex:1 1 180px;background:#eff6ff;border-radius:16px;padding:16px"><span class="sub" style="color:#1e40af;font-weight:600">Pagas</span><div class="big" style="font-size:30px">' + t.pagas + ' de ' + t.total + '</div></div></div>' +
      (m.bills.length ? '<div style="max-width:560px;display:flex;flex-direction:column;gap:8px">' + dayPills(m) + '</div>' : '') +
      '<div class="list">' + m.bills.filter(filt).map(billRow).join('') + '</div>' +
      '<span class="sub">Uma conta fica paga sozinha quando o pagamento aparece no extrato ou no cartão. Se o app errar, clique no círculo para corrigir.</span></section>' +
      (avulsas.length ? '<section class="panel" aria-label="Contas de uma vez só"><h2 class="h2">Contas de uma vez só</h2><div class="list">' + avulsas.map((b) => '<div class="li">' + tile(b.icon || 'contas', true) + '<div class="grow"><span class="t">' + esc(b.nome) + '</span><span class="m">' + esc(b.quando) + '</span></div><span class="v">' + brl(b.valor) + '</span>' +
        '<button type="button" class="icon-btn ghost" data-act="dlg-bill" data-v="' + esc(b.id) + '" aria-label="Editar ' + esc(b.nome) + '">' + icon('pencil', 16) + '</button>' +
        '<button type="button" class="icon-btn ghost" data-act="bill-remove" data-v="' + esc(b.id) + '" aria-label="Apagar ' + esc(b.nome) + '">' + icon('trash', 16) + '</button></div>').join('') + '</div></section>' : '') +
      '';
  }

  function screenFixas(m) {
    const fixed = m.settings.bills.filter((b) => b.freq !== 'unica');
    const total = fixed.filter((b) => b.pagamento !== 'cartao').reduce((s, b) => s + (Number(b.porMes) || 0), 0);
    const totalCartao = fixed.filter((b) => b.pagamento === 'cartao').reduce((s, b) => s + (Number(b.porMes) || 0), 0);
    return '<section class="panel" aria-label="Despesas fixas"><div class="head"><div><h2 class="h2">O que você paga todo mês</h2><span class="sub">' + fixed.length + (fixed.length === 1 ? ' despesa' : ' despesas') + ' · ' + brl(total) + ' saem da conta' + (totalCartao > 0 ? ' e ' + brl(totalCartao) + ' vão no cartão' : '') + ' em ' + esc((fixed[0] && fixed[0].mesNome) || 'este mês') + '. Elas entram em Contas a pagar e saem do salário na Visão geral. As faturas dos cartões entram sozinhas.</span></div><button type="button" class="btn small primary" data-act="dlg-bill">' + icon('plus', 14, 2) + 'Nova despesa</button></div>' +
      (fixed.length ? '<div class="list">' + fixed.map((b) => '<div class="li">' + tile(b.icon || 'contas', true) + '<div class="grow"><span class="t">' + esc(b.nome) + '</span><span class="m">' + (b.pagamento === 'cartao' ? '<span class="pill blue" style="font-size:10px">no cartão</span> ' : '') + esc(b.quando) + (b.freq === 'semanal' ? ' · ' + b.vezesMes + ' ' + esc(b.quando.replace('toda ', '')) + 's em ' + esc(b.mesNome) + ' = ' + brl(b.porMes) : '') + ' · ' + (b.busca ? 'procura por “' + esc(b.busca) + '”' : 'procura pelo nome') + '</span></div><span class="v">' + brl(b.valor) + '</span>' +
        '<button type="button" class="icon-btn ghost" data-act="dlg-bill" data-v="' + esc(b.id) + '" aria-label="Editar ' + esc(b.nome) + '">' + icon('pencil', 16) + '</button>' +
        '<button type="button" class="icon-btn ghost" data-act="bill-remove" data-v="' + esc(b.id) + '" aria-label="Apagar ' + esc(b.nome) + '">' + icon('trash', 16) + '</button></div>').join('') + '</div>'
        : '<div class="empty-state">Nada cadastrado ainda. Comece pelo apartamento.<button type="button" class="btn small primary" data-act="dlg-bill">Adicionar despesa</button></div>') +
      '<span class="sub">“Como aparece no extrato” são palavras do pagamento (ex.: o nome de quem recebe). Quando o app acha o pagamento, a despesa fica paga sozinha.</span></section>';
  }

  // ---------- Bancos e ajustes ----------
  function msg(key) {
    const x = S.msg[key];
    return x ? '<div class="msg ' + (x.ok ? 'ok' : 'err') + '" role="status">' + esc(x.text) + '</div>' : '';
  }

  function screenBancos(m) {
    const s = m.settings;
    const configured = m.sync.configured && !m.sync.demo;
    const bancos = m.bancos.length
      ? '<div class="list">' + m.bancos.map((b) => '<div class="li" style="flex-wrap:wrap">' +
          '<span class="tile" aria-hidden="true" style="background:' + b.cor + ';color:#fff;font:700 14px var(--display)">' + esc(b.sigla) + '</span>' +
          '<div class="grow" style="flex:1 1 200px"><span class="t">' + esc(b.nome) + (b.reserva ? ' <span class="pill" style="background:#fce7f3;color:#be185d;font-size:10px">reserva</span>' : '') + '</span><span class="m">' + esc(b.tipo) + (b.consentimento ? ' · autorizado até ' + esc(dateBr(b.consentimento)) : '') + '</span></div>' +
          '<span class="m" style="flex:1 1 200px;font-weight:600;color:' + (b.erro ? '#be123c' : '#15803d') + '">' + (b.erro ? esc(b.erro) : 'Atualizado ' + esc(when(b.atualizado || m.sync.last))) + '</span>' +
          '<span class="v">' + brl(b.saldo) + '</span>' +
          (m.sync.demo ? '' : '<button type="button" class="icon-btn ghost" data-act="item-remove" data-v="' + esc(b.id) + '" aria-label="Remover ' + esc(b.nome) + '">' + icon('trash', 16) + '</button>') +
          '</div>').join('') + '</div>'
      : '<div class="empty-state" style="padding:12px">Nenhum banco ainda.</div>';
    const pending = s.items.filter((it) => !m.bancos.some((b) => b.id === it.id));
    const pendingList = pending.length ? '<div class="list">' + pending.map((it) => '<div class="li"><span class="tile s" style="background:#f1f5f9;color:#475569">' + icon('link', 16) + '</span><div class="grow"><span class="t">' + esc(it.label || 'Banco') + '</span><span class="m">' + esc(it.id) + ' · aguardando a próxima sincronização</span></div><button type="button" class="icon-btn ghost" data-act="item-remove" data-v="' + esc(it.id) + '" aria-label="Remover">' + icon('trash', 16) + '</button></div>').join('') + '</div>' : '';

    const demoBanner = m.sync.demo
      ? '<section class="panel" style="background:#fffbeb;border-color:#fde68a"><h2 class="h2">Você está vendo dados de exemplo</h2><span class="sub" style="color:#92400e">Nada disso é seu. Quando quiser usar com seus bancos, saia do exemplo: os dados de exemplo são apagados e o app fica pronto para conectar.</span><button type="button" class="btn" style="align-self:flex-start" data-act="demo-stop">Sair do exemplo</button></section>'
      : '';

    const secretsForm = '<form data-form="secrets" class="form"><div class="field"><label for="cid">Client ID</label><input id="cid" name="clientId" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field"><label for="csec">Client Secret</label><input id="csec" name="clientSecret" type="password" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Salvar e testar</button></div></form>';

    return demoBanner +
      '<section class="panel"><div class="head"><div><h2 class="h2">Bancos conectados</h2><span class="sub">' + (m.sync.web ? 'Sincroniza quando você abre o app, no máximo a cada 6 h.' : 'Sincroniza ao abrir o app e a cada ' + s.syncHours + ' h.') + ' A Pluggy atualiza os bancos uma vez por dia.</span></div>' +
      (configured ? '<button type="button" class="btn small" data-act="sync"' + (S.syncing ? ' disabled' : '') + '>' + icon('sync', 16) + (S.syncing ? 'Sincronizando' : 'Sincronizar agora') + '</button>' : '') + '</div>' +
      bancos + pendingList + msg('sync') + '</section>' +

      (m.sync.demo ? '' :
        '<section class="panel"><h2 class="h2">1. Conectar a Pluggy</h2>' +
        (configured && !S.editSecrets
          ? '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><span class="good">' + icon('check', 14, 2) + (m.sync.web ? 'Credenciais salvas e criptografadas no servidor' : 'Credenciais salvas e criptografadas neste PC') + '</span><button type="button" class="link" data-act="edit-secrets">Trocar credenciais</button></div>'
          : '<ol class="steps"><li>Crie sua conta em <button type="button" class="link" data-act="ext" data-v="https://meu.pluggy.ai">meu.pluggy.ai</button> e conecte cada banco (Itaú, Inter, Nubank, Caixa, Mercado Pago). O próprio banco pede a autorização no app dele.</li>' +
            '<li>No <button type="button" class="link" data-act="ext" data-v="https://dashboard.pluggy.ai">dashboard.pluggy.ai</button>, crie uma aplicação, adicione o conector MeuPluggy e copie o Client ID e o Client Secret.</li>' +
            '<li>Cole os dois aqui. ' + (m.sync.web ? 'Eles ficam guardados criptografados no servidor e nunca voltam para o navegador.' : 'Eles ficam guardados só neste PC, criptografados pelo Windows.') + '</li></ol>' + secretsForm) +
        msg('secrets') + '</section>' +

        '<section class="panel"><h2 class="h2">2. Adicionar cada banco</h2><span class="sub">No dashboard da Pluggy, abra a aplicação Demo, autorize o MeuPluggy e copie o Item ID de cada banco. Um código por banco, não por conta.</span>' +
        '<form data-form="item" class="form"><div class="field"><label for="iid">Item ID</label><input id="iid" name="id" autocomplete="off" spellcheck="false" placeholder="1a2b3c4d-..."></div>' +
        '<div class="field"><label for="ilabel">Nome do banco</label><input id="ilabel" name="label" placeholder="Nubank"></div>' +
        '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Adicionar banco</button></div></form>' + msg('item') +
        '<span class="sub">O plano gratuito permite até 5 conexões. Itaú, Inter, Nubank, Caixa e Mercado Pago ocupam as 5.</span></section>') +

      '<section class="panel"><h2 class="h2">Seu mês</h2>' +
      '<form data-form="settings" class="form">' +
      '<div class="field"><label for="sal">Salário líquido</label><input id="sal" name="salario" inputmode="decimal" value="' + (s.salario ? moneyRaw(s.salario) : '') + '" placeholder="6.500,00"><small>Usado para calcular o que sobra do próximo salário.</small></div>' +
      '<div class="field"><label for="dsal">Dia do salário</label><input id="dsal" name="diaSalario" inputmode="numeric" value="' + esc(s.diaSalario) + '"><small>Se cair no fim de semana, o app conta o primeiro dia útil depois.</small></div>' +
      '<div class="field"><label for="inv">Quanto quer investir por mês</label><input id="inv" name="investir" inputmode="decimal" value="' + moneyRaw(s.investir) + '" placeholder="0,00"><small>Sai do salário antes da sobra. Deixe 0 se não for investir agora.</small></div>' +
      '<div class="field"><label for="cpf">Seu CPF (opcional)</label><input id="cpf" name="cpf" inputmode="numeric" placeholder="' + (s.cpf ? esc(s.cpf) : 'só números') + '"><small>Ajuda a reconhecer Pix entre contas suas. Fica só neste PC.</small></div>' +
      (m.sync.web ? '' : '<div class="field"><label for="hrs">Sincronizar a cada</label><select id="hrs" name="syncHours">' + [1, 2, 3, 6, 12].map((h) => '<option value="' + h + '"' + (h === s.syncHours ? ' selected' : '') + '>' + h + (h === 1 ? ' hora' : ' horas') + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Ao ligar o computador</label><label class="switch"><input type="checkbox" name="autoStart"' + (s.autoStart ? ' checked' : '') + (m.sync.autoStartAvailable ? '' : ' disabled') + '> Abrir o Meu Caixa junto com o Windows</label></div>'
        + '') +
      '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Salvar</button></div></form>' + msg('settings') + '</section>' +

      (m.sync.web ? '<section class="panel"><h2 class="h2">Trazer do app de Windows</h2><span class="sub">Escolha o arquivo meu-caixa.json do app de Windows. Vêm junto bancos, lançamentos, despesas fixas, regras de categoria e o crédito do iFood. A chave da Pluggy não vem: cole aqui de novo.</span>' +
        '<label class="btn small" style="align-self:flex-start;cursor:pointer">' + icon('down', 14, 2) + 'Escolher arquivo<input type="file" id="importar" accept=".json,application/json" hidden></label>' + msg('import') + '</section>' +
        '<section class="panel" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between"><div><h2 class="h2">Sua conta</h2><span class="sub">' + esc(api.email ? api.email() : '') + '</span></div><button type="button" class="btn small" data-act="logout">Sair desta conta</button></section>' : '') +
      '<section class="panel"><div class="head"><div><h2 class="h2">Categorias fixas</h2><span class="sub">Criadas quando você troca a categoria em Lançamentos e escolhe “Sempre”.</span></div></div>' +
      (m.catRules.length ? '<div class="list">' + m.catRules.map((r) => '<div class="li">' + tile(r.cat, true) + '<div class="grow"><span class="t">“' + esc(r.termo) + '”</span><span class="m">sempre ' + esc(r.label) + '</span></div>' +
        '<button type="button" class="icon-btn ghost" data-act="catrule-remove" data-v="' + esc(r.id) + '" aria-label="Apagar a regra ' + esc(r.termo) + '">' + icon('trash', 16) + '</button></div>').join('') + '</div>' : '<div class="empty-state" style="padding:12px">Nenhuma ainda.</div>') +
      '</section>' +
      '';
  }

  // ---------- Boas-vindas ----------
  function screenWelcome() {
    return '<div class="welcome"><section class="panel"><div class="head"><div><h1>Seu dinheiro, atualizado sozinho</h1><span class="sub" style="font-size:15px;max-width:60ch">O Meu Caixa busca suas compras, faturas e saldos pelo Open Finance, sem você digitar nada. Tudo fica guardado só neste computador.</span></div>' + ill.wallet + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px"><button type="button" class="btn primary" data-act="nav" data-v="bancos">Conectar meus bancos</button><button type="button" class="btn" data-act="demo-start">Ver com dados de exemplo</button></div></section></div>';
  }

  // ---------- Janelas de edição ----------
  const BILL_ICONS = [['moradia', 'Moradia'], ['luz', 'Luz'], ['agua', 'Água'], ['internet', 'Internet'], ['celular', 'Celular'], ['academia', 'Academia'], ['saude', 'Saúde'], ['educacao', 'Educação'], ['assinaturas', 'Assinatura'], ['transporte', 'Transporte'], ['contas', 'Outra conta']];

  function dialog(m) {
    const d = S.dialog;
    if (!d) return '';
    let body = '';
    if (d.type === 'bill') {
      const b = d.id ? m.settings.bills.find((x) => x.id === d.id) || {} : {};
      const fq = b.freq || d.freq || 'mensal';
      body = '<h2 class="h2" id="dlg-t">' + (fq === 'unica' ? (d.id ? 'Editar conta a pagar' : 'Nova conta a pagar') : (d.id ? 'Editar despesa fixa' : 'Nova despesa fixa')) + '</h2>' +
        '<form data-form="bill" class="form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><input type="hidden" name="id" value="' + esc(b.id || '') + '">' +
        '<div class="field sug-wrap" style="grid-column:1/-1"><label for="bb">Buscar no seu extrato</label><input id="bb" name="busca" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="sug" aria-expanded="false" value="' + esc(b.busca || '') + '" placeholder="fulana de tal, enel"><div class="sug" id="sug" role="listbox" hidden></div><small>Digite o nome de quem você paga e escolha da lista: o app preenche o resto e você só confere. Quando esse pagamento aparecer no mês, a despesa fica paga sozinha.</small></div>' +
        '<div class="field"><label for="bn">Nome</label><input id="bn" name="nome" required value="' + esc(b.nome || '') + '" placeholder="Apartamento"></div>' +
        '<div class="field"><label for="bf">Repete</label><select id="bf" name="freq"><option value="mensal"' + (fq === 'mensal' ? ' selected' : '') + '>Todo mês</option><option value="semanal"' + (fq === 'semanal' ? ' selected' : '') + '>Toda semana</option><option value="unica"' + (fq === 'unica' ? ' selected' : '') + '>Uma vez só</option></select></div>' +
        '<div class="field" id="wrap-data"' + (fq === 'unica' ? '' : ' hidden') + '><label for="bdt">Vence em (opcional)</label><input id="bdt" name="data" type="date" value="' + esc(b.data || '') + '"><small>Sem data, ela fica em Contas a pagar até você marcar como paga.</small></div>' +
        '<div class="field" id="wrap-dia"' + (fq === 'mensal' ? '' : ' hidden') + '><label for="bd">Dia do vencimento</label><input id="bd" name="dia" inputmode="numeric" value="' + esc(b.freq === 'semanal' ? '' : (b.dia || '')) + '" placeholder="10"></div>' +
        '<div class="field" id="wrap-sem"' + (fq === 'semanal' ? '' : ' hidden') + '><label for="bs">Dia da semana</label><select id="bs" name="diaSemana">' + ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((n, i) => '<option value="' + i + '"' + (Number(b.diaSemana === undefined ? 4 : b.diaSemana) === i ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
        '<div class="field"><label for="bv">Valor de costume</label><input id="bv" name="valor" inputmode="decimal" value="' + (b.valor ? moneyRaw(b.valor) : '') + '" placeholder="180,00"><small>Se for semanal, o valor de cada semana. Se mudar, coloque uma média.</small></div>' +
        '<div class="field"><label for="bp">Como você paga</label><select id="bp" name="pagamento"><option value="conta"' + (b.pagamento !== 'cartao' ? ' selected' : '') + '>Sai da conta (débito, Pix, boleto)</option><option value="cartao"' + (b.pagamento === 'cartao' ? ' selected' : '') + '>No cartão de crédito</option></select><small>No cartão, ela já entra na fatura e não é descontada de novo do salário.</small></div>' +
        '<div class="field"><label for="bi">Tipo</label><select id="bi" name="icon">' + BILL_ICONS.map(([k, l]) => '<option value="' + k + '"' + (k === (b.icon || 'contas') ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +

        '<div class="actions" style="grid-column:1/-1"><button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>' + msg('dlg');
    } else if (d.type === 'manual') {
      const x = d.id ? m.manual.find((y) => y.id === d.id) || {} : {};
      body = '<h2 class="h2" id="dlg-t">' + (d.id ? 'Atualizar valor' : 'Novo valor à mão') + '</h2>' +
        '<form data-form="manual" class="form"><input type="hidden" name="id" value="' + esc(x.id || '') + '">' +
        '<div class="field"><label for="mn">Nome</label><input id="mn" name="nome" required value="' + esc(x.nome || '') + '" placeholder="Crédito iFood"></div>' +
        '<div class="field"><label for="mv">Valor atual</label><input id="mv" name="valor" inputmode="decimal" required value="' + (x.valor !== undefined ? moneyRaw(x.valor) : '') + '" placeholder="150,00"></div>' +
        '<div class="actions" style="grid-column:1/-1"><button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>' + msg('dlg');
    } else if (d.type === 'credit') {
      const x = d.id ? m.manualCredits.find((y) => y.id === d.id) || {} : {};
      const nm = new Date(); nm.setMonth(nm.getMonth() + 1);
      const inicioDefault = nm.getFullYear() + '-' + String(nm.getMonth() + 1).padStart(2, '0');
      body = '<h2 class="h2" id="dlg-t">' + (d.id ? 'Atualizar crédito' : 'Novo crédito à mão') + '</h2><span class="sub">Para crédito que não sincroniza, como o do iFood. Ele vira um cartão no painel e uma conta a pagar no dia do pagamento.</span>' +
        '<form data-form="manual" class="form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><input type="hidden" name="id" value="' + esc(x.id || '') + '"><input type="hidden" name="tipo" value="credito">' +
        '<div class="field"><label for="cn">Nome</label><input id="cn" name="nome" required value="' + esc(x.nome || 'iFood') + '"></div>' +
        '<div class="field"><label for="cl">Limite</label><input id="cl" name="limite" inputmode="decimal" required value="' + (x.limite !== undefined ? moneyRaw(x.limite) : '') + '" placeholder="500,00"></div>' +
        '<div class="field"><label for="cg">Já gasto antes de usar o app</label><input id="cg" name="gasto" inputmode="decimal" value="' + (x.gasto !== undefined ? moneyRaw(x.gasto) : '') + '" placeholder="120,00"><small>Só na primeira vez. Depois, lance cada compra pelo botão “Lançar compra”.</small></div>' +
        '<div class="field"><label for="cd">Dia do pagamento</label><input id="cd" name="dia" inputmode="numeric" required value="' + esc(x.dia || 5) + '"></div>' +
        '<div class="field"><label for="ci">Primeiro pagamento em</label><input id="ci" name="inicio" type="month" value="' + esc(x.inicio || inicioDefault) + '"></div>' +
        '<div class="actions" style="grid-column:1/-1">' + (d.id ? '<button type="button" class="btn danger" data-act="manual-remove" data-v="' + esc(x.id) + '">Apagar</button>' : '') + '<button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>' + msg('dlg');
    } else if (d.type === 'compra') {
      const x = m.manualCredits.find((y) => y.id === d.id) || {};
      const hoje = new Date();
      const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
      body = '<h2 class="h2" id="dlg-t">Compra no ' + esc(x.nome || 'crédito') + '</h2><span class="sub">Livre agora: ' + brl(x.livre || 0) + '</span>' +
        '<form data-form="compra" class="form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><input type="hidden" name="creditId" value="' + esc(d.id) + '">' +
        '<div class="field"><label for="cv">Valor</label><input id="cv" name="valor" inputmode="decimal" required placeholder="70,00"></div>' +
        '<div class="field"><label for="cdt">Data</label><input id="cdt" name="data" type="date" value="' + iso + '"></div>' +
        '<div class="field"><label for="cds">Descrição</label><input id="cds" name="descricao" value="Pedido ' + esc(x.nome || '') + '"></div>' +
        '<div class="field"><label for="cc">Categoria</label><select id="cc" name="cat">' + m.cats.map((c) => '<option value="' + c.id + '"' + (c.id === 'restaurantes' ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('') + '</select></div>' +
        '<div class="actions" style="grid-column:1/-1"><button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Lançar</button></div></form>' + msg('dlg');
    } else if (d.type === 'cat') {
      const label = (m.cats.find((c) => c.id === d.cat) || { label: d.cat }).label;
      body = '<h2 class="h2" id="dlg-t">Mudar para ' + esc(label) + '</h2><span class="sub" style="font-size:14px">' + esc(d.nome) + '</span>' +
        '<form data-form="catrule" class="form" style="grid-template-columns:1fr"><input type="hidden" name="cat" value="' + esc(d.cat) + '">' +
        '<div class="field"><label for="ct">Sempre que aparecer</label><input id="ct" name="termo" value="' + esc(d.termo) + '"><small>Vale para todos os lançamentos, antigos e novos, que tenham esse nome. Use só o essencial, como “fulana de tal” ou “discord”.</small></div>' +
        '<div class="actions"><button type="button" class="btn" data-act="cat-once">Só este lançamento</button><button type="submit" class="btn primary">Sempre ' + esc(label) + '</button></div></form>' + msg('dlg');
    } else if (d.type === 'confirm') {
      body = '<h2 class="h2" id="dlg-t">' + esc(d.title) + '</h2><span class="sub" style="font-size:14px">' + esc(d.text) + '</span>' +
        '<div class="actions"><button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="button" class="btn rose" data-act="confirm-yes">' + esc(d.yes) + '</button></div>';
    }
    return '<div class="overlay" data-act="dlg-backdrop"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">' + body + '</div></div>';
  }

  // ---------- Render ----------
  function render() {
    const m = S.m;
    if (!m) return;
    const focusId = document.activeElement && document.activeElement.id;
    const caret = focusId === 'busca' ? document.activeElement.selectionStart : null;
    let content;
    const noData = !m.sync.hasData && !m.sync.demo;
    if (noData && S.screen !== 'bancos') content = screenWelcome();
    else if (S.screen === 'lanc') content = topBar(m) + screenLanc(m);
    else if (S.screen === 'cartoes') content = topBar(m) + screenCartoes(m);
    else if (S.screen === 'contas') content = topBar(m) + screenContas(m);
    else if (S.screen === 'fixas') content = topBar(m) + screenFixas(m);
    else if (S.screen === 'bancos') content = topBar(m) + screenBancos(m);
    else content = topBar(m) + screenVisao(m);
    root.innerHTML = '<div class="app">' + sidebar(m) + '<main class="main">' + content + '</main></div>' + dialog(m);
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); if (caret !== null && el.setSelectionRange) el.setSelectionRange(caret, caret); }
    }
    if (S.dialog) {
      const first = root.querySelector('.dialog input:not([type=hidden]), .dialog button.rose');
      if (first && !focusId) first.focus();
    }
  }

  // ---------- Ações ----------
  async function run(promise, key, okText) {
    const res = await promise;
    if (res && res.ok === false) {
      S.msg[key] = { ok: false, text: res.message || 'Não deu certo.' };
    } else {
      S.msg[key] = okText ? { ok: true, text: okText } : null;
    }
    await load();
    return res;
  }

  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) { if (S.menu) { S.menu = false; render(); } return; }
    const act = el.dataset.act;
    const v = el.dataset.v;
    if (act !== 'menu' && S.menu) S.menu = false;
    switch (act) {
      case 'nav': S.screen = v; S.day = null; S.msg = {}; if (v === 'lanc') S.cat = null; window.scrollTo(0, 0); render(); break;
      case 'month': S.month = v || null; S.day = null; await load(); break;
      case 'menu': S.menu = !S.menu; render(); break;
      case 'hide':
        S.hide = !S.hide;
        try { localStorage.setItem('meucaixa-ocultar', S.hide ? '1' : '0'); } catch (err) { /* sem armazenamento */ }
        toast(S.hide ? 'Valores escondidos.' : 'Valores à mostra.');
        render();
        break;
      case 'sync': {
        S.msg.sync = null;
        const res = await api.syncNow();
        if (res && res.ok === false && res.message) { S.msg.sync = { ok: false, text: res.message }; toast(res.message); }
        else if (res && res.ok) toast(res.novas ? res.novas + ' lançamentos atualizados.' : 'Tudo em dia.');
        await load();
        break;
      }
      case 'card-step': {
        const n = S.m.cards.length;
        S.card = (S.card + Number(v) + n) % n; render(); break;
      }
      case 'card-pick': S.card = Number(v); render(); break;
      case 'day': S.day = v ? (S.day === Number(v) ? null : Number(v)) : null; render(); break;
      case 'toggle-paid': S.showPaid = !S.showPaid; render(); break;
      case 'bill-mark': await run(api.markBill({ month: S.month, id: v, paid: el.dataset.paid === '1' }), 'bill'); break;
      case 'filtro': S.filtro = v; render(); break;
      case 'dlg-bill': S.dialog = { type: 'bill', id: v || null, freq: el.dataset.freq || null }; S.msg.dlg = null; render(); break;
      case 'dlg-manual': S.dialog = { type: 'manual', id: v || null }; S.msg.dlg = null; render(); break;
      case 'dlg-credit': S.dialog = { type: 'credit', id: v || null }; S.msg.dlg = null; render(); break;
      case 'cat-open': S.cat = v; S.filtro = 'todos'; S.q = ''; S.screen = 'lanc'; window.scrollTo(0, 0); render(); break;
      case 'cat-clear': S.cat = null; render(); break;
      case 'dlg-close': S.dialog = null; render(); break;
      case 'dlg-backdrop': if (e.target === el) { S.dialog = null; render(); } break;
      case 'bill-remove': {
        const b = S.m.settings.bills.find((x) => x.id === v);
        S.dialog = { type: 'confirm', title: 'Apagar ' + (b ? b.nome : 'conta') + '?', text: 'Ela some da lista de contas a pagar. Os lançamentos do extrato continuam.', yes: 'Apagar', run: () => api.removeBill(v) };
        render(); break;
      }
      case 'manual-remove': {
        S.dialog = { type: 'confirm', title: 'Apagar esse valor?', text: 'Ele some do painel.', yes: 'Apagar', run: () => api.removeManual(v) };
        render(); break;
      }
      case 'item-remove': {
        S.dialog = { type: 'confirm', title: 'Remover esse banco?', text: 'As contas, cartões e lançamentos dele saem do app. Para voltar, é só adicionar o Item ID de novo.', yes: 'Remover', run: () => api.removeItem(v) };
        render(); break;
      }
      case 'demo-stop': {
        S.dialog = { type: 'confirm', title: 'Sair do exemplo?', text: 'Os dados de exemplo são apagados e o app fica pronto para conectar seus bancos.', yes: 'Sair do exemplo', run: async () => { const r = await api.stopDemo(); S.screen = 'bancos'; return r; } };
        render(); break;
      }
      case 'confirm-yes': {
        const fn = S.dialog && S.dialog.run;
        S.dialog = null;
        if (fn) await run(fn(), 'confirm');
        break;
      }
      case 'cat-once': {
        const d = S.dialog;
        S.dialog = null;
        await run(api.setCategory({ id: d.id, cat: d.cat }), 'cat');
        toast('Categoria trocada só nesse lançamento.');
        break;
      }
      case 'sug-pick': {
        const input = document.getElementById('bb');
        if (input) {
          const parts = input.value.split(',').map((x) => x.trim()).filter(Boolean);
          parts.pop();
          parts.push(el.dataset.termo);
          input.value = Array.from(new Set(parts)).join(', ');
          const b = (S.sugList || [])[Number(el.dataset.i)];
          if (b) {
            const set = (id, v) => { const f = document.getElementById(id); if (f) f.value = v; };
            const nome = document.getElementById('bn');
            if (nome && !nome.value) nome.value = b.nomeLimpo;
            const fqNow = (document.getElementById('bf') || {}).value;
            if (fqNow !== 'unica') set('bf', b.semanal ? 'semanal' : 'mensal');
            set('bd', String(b.dia));
            set('bs', String(b.diaSemana));
            set('bv', moneyRaw(b.valor));
            set('bi', b.icon);
            set('bp', b.noCartao ? 'cartao' : 'conta');
            toggleFreq((document.getElementById('bf') || {}).value);
            toast('Preenchido com o pagamento de ' + b.data + '. Confira e salve.');
          }
          document.getElementById('sug').hidden = true;
          input.setAttribute('aria-expanded', 'false');
          const nm = document.getElementById('bn');
          if (nm) { nm.focus(); nm.select(); }
        }
        break;
      }
      case 'dlg-compra': S.dialog = { type: 'compra', id: v }; S.msg.dlg = null; render(); break;
      case 'compra-remove': await run(api.removeCompra({ creditId: el.dataset.credit, compraId: v }), 'compra'); toast('Compra apagada.'); break;
      case 'catrule-remove': await run(api.removeCatRule(v), 'cat'); break;
      case 'demo-start': S.screen = 'visao'; await run(api.startDemo(), 'demo'); break;
      case 'edit-secrets': S.editSecrets = true; render(); break;
      case 'ext': api.openExternal(v); break;
      case 'logout': if (api.logout) api.logout(); break;
      default: break;
    }
  });

  root.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const kind = form.dataset.form;
    if (kind === 'secrets') {
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Testando...';
      const res = await run(api.saveSecrets(data), 'secrets', 'Pronto, a Pluggy aceitou as credenciais.');
      if (res && res.ok) S.editSecrets = false;
      render();
    } else if (kind === 'item') {
      const res = await run(api.addItem(data), 'item', 'Banco adicionado. Ele aparece depois da próxima sincronização.');
      if (res && res.ok) { await api.syncNow(); await load(); }
    } else if (kind === 'settings') {
      const patch = {
        salario: data.salario || '0',
        investir: data.investir || '0',
        diaSalario: data.diaSalario || '1',
        syncHours: data.syncHours,
        autoStart: !!(form.querySelector('[name=autoStart]') || {}).checked
      };
      if (data.cpf) patch.cpf = data.cpf;
      await run(api.saveSettings(patch), 'settings', 'Salvo.');
    } else if (kind === 'compra') {
      const res = await api.addCompra(data);
      if (res.ok) { S.dialog = null; toast('Compra lançada.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    } else if (kind === 'catrule') {
      const res = await api.saveCatRule({ termo: data.termo, cat: data.cat });
      if (res.ok) { S.dialog = null; toast('Pronto. Tudo com “' + data.termo.trim() + '” agora entra nessa categoria.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    } else if (kind === 'bill') {
      const res = await api.saveBill(data);
      if (res.ok) { S.dialog = null; toast('Conta salva.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    } else if (kind === 'manual') {
      const res = await api.saveManual(data);
      if (res.ok) { S.dialog = null; toast('Valor salvo.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    }
  });

  const normJs = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function showSug(input) {
    const box = document.getElementById('sug');
    if (!box || !S.m) return;
    const parts = input.value.split(',');
    const q = normJs(parts[parts.length - 1].trim());
    const list = (S.m.beneficiarios || []).filter((b) => !q || normJs(b.termo).includes(q) || normJs(b.nome).includes(q)).slice(0, 7);
    S.sugList = list;
    if (!list.length) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    box.innerHTML = list.map((b, i) => '<button type="button" role="option" data-act="sug-pick" data-i="' + i + '" data-termo="' + esc(b.termo) + '" data-valor="' + b.valor + '"><span style="display:flex;gap:10px;align-items:center">' + mark(b.marca, b.icon, true) + '<span><b>' + esc(b.nomeLimpo) + '</b><small>' + (b.semanal ? 'toda semana · ' : '') + b.vezes + (b.vezes === 1 ? ' vez' : ' vezes') + ' · última em ' + esc(b.data) + ' · ' + esc(b.conta) + '</small></span></span><span class="val">' + brl(b.valor) + '</span></button>').join('');
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  root.addEventListener('mousedown', (e) => { if (e.target.id === 'bb') showSug(e.target); });
  root.addEventListener('focusout', (e) => {
    if (e.target.id === 'bb') setTimeout(() => { const box = document.getElementById('sug'); if (box && !box.contains(document.activeElement)) box.hidden = true; }, 150);
  });

  root.addEventListener('input', (e) => {
    if (e.target.id === 'bb') { showSug(e.target); return; }
    if (e.target.id === 'busca') { S.q = e.target.value; render(); }
  });

  function toggleFreq(v) {
    const map = { 'wrap-dia': 'mensal', 'wrap-sem': 'semanal', 'wrap-data': 'unica' };
    for (const id in map) { const el = document.getElementById(id); if (el) el.hidden = map[id] !== v; }
  }

  root.addEventListener('change', async (e) => {
    if (e.target.id === 'importar' && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      S.msg.import = { ok: true, text: 'Lendo o arquivo...' };
      render();
      try {
        const data = JSON.parse(await file.text());
        const res = await api.importDesktop(data);
        S.msg.import = res && res.ok ? { ok: true, text: 'Pronto: ' + res.transacoes + ' lançamentos trazidos.' } : { ok: false, text: (res && res.message) || 'Não deu certo.' };
      } catch (err) {
        S.msg.import = { ok: false, text: 'Não consegui ler esse arquivo. Ele precisa ser o meu-caixa.json.' };
      }
      await load();
      return;
    }
    if (e.target.id === 'bf') { toggleFreq(e.target.value); return; }
    const sel = e.target.closest('select.cat-select');
    if (sel) {
      const t = S.m.lancamentos.find((x) => x.id === sel.dataset.tx);
      S.dialog = { type: 'cat', id: sel.dataset.tx, cat: sel.value, nome: t ? t.nome : '', termo: t ? t.termo : '' };
      S.msg.dlg = null;
      render();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (S.dialog || S.menu)) { S.dialog = null; S.menu = false; render(); }
  });

  api.onChange(async (data) => {
    S.syncing = !!data.syncing;
    S.progress = data.progress || null;
    if (data.progress) { render(); return; }
    await load();
  });

  load();
})();
