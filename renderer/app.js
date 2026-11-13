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
    ordem: 'data',
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
  // Filtros de Lançamentos ficam como você deixou, até entre abas.
  try {
    const l = JSON.parse(localStorage.getItem('meucaixa-lanc') || '{}');
    if (l.filtro) S.filtro = l.filtro;
    if (l.ordem) S.ordem = l.ordem;
    if (l.cat) S.cat = l.cat;
  } catch (e) { /* sem armazenamento */ }
  function saveLanc() {
    try { localStorage.setItem('meucaixa-lanc', JSON.stringify({ filtro: S.filtro, ordem: S.ordem, cat: S.cat })); } catch (e) { /* sem armazenamento */ }
  }
  // Aparência: automático (segue o celular/computador), claro ou escuro.
  function applyTheme() {
    let t = 'auto';
    try { t = localStorage.getItem('meucaixa-tema') || 'auto'; } catch (e) { /* sem armazenamento */ }
    const dark = t === 'escuro' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', dark ? '#0b1020' : '#f3f5f9');
    return t;
  }
  S.tema = applyTheme();
  if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); render(); }); } catch (e) { /* navegador antigo */ } }
  const SCREENS = ['visao', 'ia', 'lanc', 'cartoes', 'contas', 'fixas', 'bancos'];
  function screenFromHash() {
    const h = location.hash.replace('#', '');
    return SCREENS.includes(h) ? h : null;
  }
  S.screen = screenFromHash() || S.screen;
  function goScreen(v) {
    S.screen = v; S.day = null; S.msg = {}; S.notif = null;
    try { history.replaceState(null, '', v === 'visao' ? location.pathname : '#' + v); } catch (e) { /* sem histórico */ }
    window.scrollTo(0, 0);
    render();
  }
  window.addEventListener('hashchange', () => { const v = screenFromHash(); if (v && v !== S.screen) goScreen(v); });

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
  // Logos locais das marcas conhecidas; iniciais e categoria para nomes sem logo.
  function mark(mk, cat, small) {
    if (!mk) return tile(cat, small);
    const brand = window.BRAND_LOGOS.forMark(mk);
    if (brand) return '<span class="tile' + (small ? ' s' : '') + ' brand brand-logo" aria-hidden="true" style="background:' + (brand.fullColor ? '#ffffff' : brand.cor) + '"><img src="' + brand.src + '" alt="" width="28" height="28"></span>';
    return '<span class="tile' + (small ? ' s' : '') + ' brand" aria-hidden="true" style="background:' + mk.cor + ';color:' + mk.fg + '">' + esc(mk.sigla) + '</span>';
  }

  function markName(name, cat, small) {
    return mark(window.BRAND_LOGOS.forName(name), cat, small);
  }
  function cardBank(name) {
    const brand = window.BRAND_LOGOS.forName(name);
    return brand ? '<img class="card-bank-logo' + (brand.key === 'c6bank' ? ' bank-light' : '') + '" src="' + brand.src + '" alt="' + esc(name) + '" width="88" height="40">' : esc(name);
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
    const navBtn = ([id, label, ic]) => '<a href="#' + id + '" data-act="nav" data-v="' + id + '" class="' + (S.screen === id ? 'on' : '') + '"' + (S.screen === id ? ' aria-current="page"' : '') + '>' + icon(ic) + label + '</a>';
    let box;
    if (S.syncing) {
      const p = S.progress;
      box = '<div class="sync-box idle"><span class="ic">' + icon('sync', 15, 1.8).replace('<svg', '<svg class="spin"') + '</span><div><b>Sincronizando</b><span>' + (p ? esc(p.label) + ' (' + p.step + ' de ' + p.total + ')' : 'buscando seus bancos') + '</span></div></div>';
    } else if (m.sync.demo) {
      box = '<div class="sync-box idle"><span class="ic">' + icon('alert', 15, 1.8) + '</span><div><b>Dados de exemplo</b><span>Conecte seus bancos para ver os seus números.</span></div></div>';
    } else if (m.sync.error) {
      box = '<div class="sync-box err"><span class="ic">' + icon('alert', 15, 1.8) + '</span><div><b>Algo falhou</b><span>' + esc(m.sync.error) + '</span></div></div>';
    } else if (m.sync.last) {
      box = '<div class="sync-box ok"><span class="ic">' + icon('sync', 15, 1.8) + '</span><div><b>' + (m.sync.bancosEm ? 'Bancos atualizaram ' + esc(when(m.sync.bancosEm)) : 'Sincronizado') + '</b><span>Conferido ' + esc(when(m.sync.last)) + ' · o Open Finance atualiza uma vez por dia</span></div></div>';
    } else {
      box = '<div class="sync-box idle"><span class="ic">' + icon('sync', 15, 1.8) + '</span><div><b>Ainda não sincronizou</b><span>Conecte seus bancos em Bancos e ajustes.</span></div></div>';
    }
    return '<nav class="side" aria-label="Menu">' +
      '<div class="brand">' + window.ART.ill.logo + '<div><b>Meu Cofrin</b><small>Finanças pessoais</small></div></div>' +
      '<div class="nav"><span class="nav-label">Menu</span>' + (m.sync.web ? NAV.slice(0, 1).concat([['ia', 'Conversar', 'chat']], NAV.slice(1)) : NAV).map(navBtn).join('') + '</div>' +
      '<div class="nav"><span class="nav-label">Ajustes</span>' + navBtn(['bancos', 'Bancos e ajustes', 'bank']) + '</div>' +
      '<div class="side-foot">' + box + '</div></nav>';
  }

  function notifPanel(m) {
    const list = S.notif.list || [];
    const item = (a) => '<button type="button" class="notif-item' + (a.novo ? ' novo' : '') + '" data-act="notif-open" data-v="' + esc(a.id) + '">' +
      (a.tipo === 'conta' || a.tipo === 'limite' || a.tipo === 'alerta' ? '<span class="tile s" aria-hidden="true" style="background:' + (a.atrasada ? 'var(--soft-red-bg)' : 'var(--soft-amber-bg)') + ';color:' + (a.atrasada ? 'var(--red-fg)' : 'var(--soft-amber-fg)') + '">' + icon(a.tipo === 'conta' && !a.atrasada ? 'calendar' : 'alert', 15, 1.8) + '</span>'
        : a.tipo === 'resumo' ? '<span class="tile s" aria-hidden="true" style="background:var(--soft-green-bg2);color:var(--soft-green-fg)">' + icon('trend', 15, 1.8) + '</span>'
        : a.tipo === 'lembrete' ? '<span class="tile s" aria-hidden="true" style="background:var(--blue-soft);color:var(--blue-d)">' + icon('bell', 15, 1.8) + '</span>'
        : mark(a.marca, a.cat, true)) +
      '<span class="grow"><b>' + esc(a.titulo) + '</b><small>' + esc(a.texto) + (a.tipo === 'tx' ? ' · chegou ' + esc(when(new Date(a.quando).toISOString())) : '') + '</small></span>' +
      (a.valor === null || a.valor === undefined ? '' : '<span class="val' + (a.valor > 0 ? ' pos' : '') + '">' + (a.tipo === 'resumo' ? (a.valor >= 0 ? 'sobrou ' : 'faltou ') + brl(Math.abs(a.valor)) : signedBrl(a.valor)) + '</span>') + '</button>';
    const novos = list.filter((a) => a.novo);
    const vistos = list.filter((a) => !a.novo);
    return '<div class="menu notif" role="dialog" aria-label="Notificações"><div class="notif-head"><b>Notificações</b>' + (novos.length ? '<span class="pill">' + novos.length + (novos.length === 1 ? ' nova' : ' novas') + '</span>' : '') + '</div>' +
      (list.length ? '<div class="notif-list">' + (novos.length ? novos.map(item).join('') : '') + (vistos.length ? '<span class="notif-sep">Vistas</span>' + vistos.map(item).join('') : '') + '</div>'
        : '<div class="empty-state" style="padding:20px 12px">Nada novo. Lançamentos dos últimos 7 dias e contas perto de vencer aparecem aqui.</div>') +
      '<button type="button" class="notif-foot" data-act="notif-all">Ver todos os lançamentos</button></div>';
  }

  function topBar(m) {
    const titles = { visao: null, lanc: 'Lançamentos', cartoes: 'Cartões', contas: 'Contas a pagar', fixas: 'Despesas fixas', bancos: 'Bancos e ajustes', ia: 'Conversar' };
    const t = titles[S.screen];
    const monthNav = S.screen !== 'bancos' && S.screen !== 'fixas' && S.screen !== 'ia';
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
      '<button type="button" class="icon-btn out" data-act="tema-toggle" aria-label="' + (document.documentElement.classList.contains('dark') ? 'Usar modo claro' : 'Usar modo escuro') + '" title="' + (document.documentElement.classList.contains('dark') ? 'Modo claro' : 'Modo escuro') + '">' + icon(document.documentElement.classList.contains('dark') ? 'sun' : 'moon', 18, 1.6) + '</button>' +
      '<button type="button" class="icon-btn out" data-act="hide" aria-pressed="' + S.hide + '" aria-label="' + (S.hide ? 'Mostrar valores' : 'Esconder valores') + '" title="' + (S.hide ? 'Mostrar valores' : 'Esconder valores') + '">' + icon(S.hide ? 'eyeoff' : 'eye') + '</button>' +
      '<div class="dropdown"><button type="button" class="icon-btn out" data-act="notif" aria-expanded="' + !!S.notif + '" aria-label="Notificações' + (m.novas ? ', ' + m.novas + (m.novas === 1 ? ' nova' : ' novas') : '') + '">' + icon('bell') + (m.novas ? '<span class="badge">' + m.novas + '</span>' : '') + '</button>' + (S.notif ? notifPanel(m) : '') + '</div>' +
      '<button type="button" class="icon-btn out" data-act="sync" aria-label="Sincronizar agora" title="' + (m.sync.bancosEm ? 'Bancos atualizaram ' + esc(when(m.sync.bancosEm)) + '. Clique para conferir se chegou algo novo.' : 'Sincronizar agora') + '"' + (S.syncing || m.sync.demo ? ' disabled' : '') + '>' + icon('sync', 18, 1.6).replace('<svg', S.syncing ? '<svg class="spin"' : '<svg') + '</button>' +
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
      (neg ? '<div class="huge" style="color:var(--red-fg)"><span class="rs">− R$ </span>' + money(f.sobra).split(',')[0] + '<span class="ct">,' + money(f.sobra).split(',')[1] + '</span></div>' : bigNum(f.sobra, 'huge')) +
      '<div style="display:flex;flex-direction:column;gap:2px;padding-left:16px;border-left:1px solid #e2e8f0">' +
      (renda > 0
        ? (neg ? '<span class="warn">Faltam ' + brl(-f.sobra) + ' no mês</span>' : '<span class="good">' + icon('up', 14, 2) + f.pct.sobra + '% da renda livre</span>')
        : '<span class="warn">Informe seu salário</span>') +
      '<span class="sub" style="font-size:13px">depois de contas, faturas e reserva</span></div></div></div>' + ill.wallet + '</div>' +
      '<div class="bar" role="img" aria-label="Para onde vai a renda do mês">' + bar + '</div>' +
      '<div class="legend">' +
      '<div><span class="k">' + (m.renda.fonte === 'previsto' ? 'Salário (previsto)' : 'Renda recebida') + '</span><span class="v">' + brl(renda) + '</span></div>' +
      segs.map((s) => '<div><span class="k"><span class="dot" style="background:' + s[2] + '"></span>' + s[0] + '</span><span class="v">− ' + brl(s[1]) + ' <small>' + s[3] + '%</small></span></div>').join('') +
      '<div><span class="k"><span class="dot" style="background:#16a34a"></span>Sobra</span><span class="v" style="color:' + (neg ? 'var(--red-fg)' : 'var(--soft-green-fg)') + '">' + (neg ? '− ' : '') + brl(f.sobra) + '</span></div>' +
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
          '<div role="img" aria-label="' + Math.round(r.pct) + '% da meta" style="height:12px;background:var(--soft-pink-bg);border-radius:6px"><div style="width:' + r.pct + '%;height:12px;background:linear-gradient(90deg,#f472b6,#db2777);border-radius:6px"></div></div></div>'
        : '<button type="button" class="link" data-act="nav" data-v="bancos" style="align-self:flex-start">Definir uma meta</button>') +
      '<div class="tiles">' +
      '<div>' + tile('reserva') + '<div><span>Guardado no mês</span><b>' + brl(r.guardadoMes) + '</b></div></div>' +
      '<div><span class="tile" aria-hidden="true" style="background:var(--soft-green-bg2);color:var(--soft-green-fg)">' + icon('trend') + '</span><div><span>Rendeu no mês</span><b>' + brl(r.rendeuMes) + '</b></div></div>' +
      (r.meta > 0 ? '<div><span class="tile" aria-hidden="true" style="background:var(--soft-blue-bg2);color:var(--soft-blue-fg2)">' + icon('target') + '</span><div><span>Falta</span><b>' + brl(r.falta) + '</b></div></div>' +
        '<div><span class="tile" aria-hidden="true" style="background:var(--soft-amber-bg);color:var(--soft-amber-fg)">' + icon('calendar') + '</span><div><span>Nesse ritmo</span><b>' + (r.falta <= 0 ? 'Meta batida' : (r.meses ? r.meses + (r.meses === 1 ? ' mês' : ' meses') : 'guarde algo')) + '</b></div></div>' : '') +
      '</div></section>';
  }

  function cardFace(c, opts) {
    const o = opts || {};
    const tag = o.button ? 'button' : 'div';
    const attrs = o.button ? ' type="button" data-act="card-pick" data-v="' + o.index + '" aria-label="Mostrar cartão ' + esc(c.nome) + '"' : '';
    const style = o.style || '';
    return '<' + tag + attrs + ' class="cc' + (o.flat ? ' flat' : '') + '" style="background:' + c.bg + ';' + style + '"><span class="sheen" aria-hidden="true"></span>' +
      '<span><span class="bank" style="color:' + c.nameColor + '">' + cardBank(c.nome) + '</span><span class="state">' + esc(c.atual.estado) + '</span></span>' +
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
        (on ? '<polygon points="' + pts + ' 100,64 0,64" style="fill:var(--blue-soft)"/>' : '') +
        '<polyline points="' + pts + '" fill="none" stroke="' + stroke + '" stroke-width="2"' + (on ? '' : ' stroke-dasharray="4 4"') + ' vector-effect="non-scaling-stroke"/></svg>' +
        '<span class="pt" style="top:' + ys[k].toFixed(1) + 'px;border-color:' + stroke + '"></span></div>' +
        '<b style="font-size:13px;color:' + (on ? 'var(--blue-d)' : 'var(--ink-2)') + '">' + brl(p.valor) + '</b></div>';
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
      '<div style="display:flex;flex-direction:column;gap:10px"><span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">' + (a.manual ? 'Fatura · ' : 'Últimas faturas · ') + esc(a.nome) + '</span>' + proxBoxes(a) +
      (a.manual ? '<button type="button" class="btn small rose" style="align-self:flex-start" data-act="dlg-credit" data-v="' + esc(a.manualId) + '">' + icon('pencil', 14) + 'Atualizar gasto e limite</button>' : '') + '</div>' +
      '</section>';
  }

  function billRow(b) {
    const tone = b.status.tom === 'ok' ? 'color:var(--soft-green-fg);font-weight:600' : (b.status.tom === 'alerta' ? 'color:var(--soft-amber-fg);font-weight:600' : '');
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
      '<span class="sub">em aberto · <b style="color:var(--ink)">' + t.pagas + ' de ' + t.total + ' pagas</b></span></div>' + ill.calendar + '</div>' +
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
    return '<svg class="ill" role="img" aria-label="Divisão dos gastos por categoria" width="80" height="80" viewBox="0 0 76 76"><circle cx="38" cy="38" r="26" fill="none" style="stroke:var(--slate-bg)" stroke-width="14"/>' + segs + '</svg>';
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
    const manual = m.manual.map((x) => '<div class="li">' + markName(x.nome, 'restaurantes') + '<div class="grow"><span class="t">' + esc(x.nome) + ' <span class="pill amber" style="font-size:10px">à mão</span></span><span class="m">atualizado em ' + esc(dateBr(x.atualizado)) + '</span></div><span class="v">' + brl(x.valor) + '</span>' +
      '<button type="button" class="icon-btn ghost" data-act="dlg-manual" data-v="' + esc(x.id) + '" aria-label="Atualizar ' + esc(x.nome) + '">' + icon('pencil', 16) + '</button></div>').join('');
    const credits = m.manualCredits.map((x) => '<div style="display:flex;flex-direction:column;gap:8px;padding:12px 0;border-top:1px solid #eef1f6">' +
      '<div class="li" style="padding:0;border:0">' + markName(x.nome, 'restaurantes') +
      '<div class="grow"><span class="t">' + esc(x.nome) + '</span><span class="m">gasto ' + brl(x.gastoAtual) + ' de ' + brl(x.limite) + ' · paga dia ' + String(x.dia).padStart(2, '0') + '</span></div>' +
      '<div style="text-align:right"><span class="sub" style="display:block">livre</span><span class="v" style="color:var(--soft-green-fg)">' + brl(x.livre) + '</span></div>' +
      '<button type="button" class="icon-btn ghost" data-act="dlg-credit" data-v="' + esc(x.id) + '" aria-label="Editar ' + esc(x.nome) + '">' + icon('pencil', 16) + '</button></div>' +
      '<div class="track" role="img" aria-label="Limite usado" style="height:8px"><div style="height:8px;width:' + (x.limite > 0 ? Math.min(100, x.gastoAtual / x.limite * 100).toFixed(1) : 0) + '%;background:#e11d48"></div></div>' +
      (x.recentes.length ? '<div class="list">' + x.recentes.map((c) => '<div class="li" style="padding:6px 0;border-top:0"><div class="grow"><span class="t" style="font-weight:500">' + esc(c.descricao) + '</span><span class="m">' + esc(c.data) + '</span></div><span class="v">' + brl(c.valor) + '</span>' +
        '<button type="button" class="icon-btn ghost" data-act="compra-remove" data-v="' + esc(c.id) + '" data-credit="' + esc(x.id) + '" aria-label="Apagar a compra ' + esc(c.descricao) + '">' + icon('trash', 15) + '</button></div>').join('') + '</div>' : '') +
      '<button type="button" class="btn small rose" style="align-self:flex-start" data-act="dlg-compra" data-v="' + esc(x.id) + '">' + icon('plus', 14, 2) + 'Lançar compra</button></div>').join('');
    const manualPanel = '<section class="panel" aria-label="iFood e outros créditos"><div class="head"><div><h2 class="h2">iFood e outros créditos</h2><span class="sub">Esses não vêm do banco. Lance cada compra aqui e o limite livre se atualiza. No dia do pagamento, marque a fatura como paga em Contas a pagar.</span></div>' + '<span class="credit-brand" aria-hidden="true">' + markName('iFood', 'restaurantes') + '</span></div>' +
      (credits ? '<div style="display:flex;flex-direction:column">' + credits + '</div>' : '') +
      '<button type="button" class="btn small" style="align-self:flex-start" data-act="dlg-credit">' + icon('plus', 14, 2) + 'Novo crédito</button></section>';
    const pixPanel = p.qtd
      ? '<section class="panel" aria-label="Pix no crédito"><div class="head"><div><h2 class="h2">Pix no crédito</h2><span class="sub">' + p.qtd + (p.qtd === 1 ? ' Pix' : ' Pix') + ' no crédito este mês</span>' + bigNum(p.total) + '</div>' + ill.lightning + '</div>' +
        '<div class="tiles"><div>' + tile('taxas') + '<div><span>Taxas e juros do mês</span><b>' + brl(p.taxas) + '</b></div></div></div>' +
        (m.pixAno && m.pixAno.qtd ? '<div class="tiles"><div>' + tile('pix') + '<div><span>Pix no crédito no ano</span><b>' + brl(m.pixAno.total) + '</b></div></div><div>' + tile('taxas') + '<div><span>Taxas no ano</span><b style="color:var(--red-fg)">' + brl(m.pixAno.taxas) + '</b></div></div></div>' : '') +
        '<span class="sub">As taxas são as linhas de juros, IOF e tarifa que aparecem nas faturas dos cartões.</span></section>'
      : (m.pixAno && m.pixAno.qtd ? '<section class="panel" aria-label="Pix no crédito no ano"><div class="head"><div><h2 class="h2">Pix no crédito em ' + m.pixAno.ano + '</h2><span class="sub">' + m.pixAno.qtd + ' Pix no crédito no ano</span>' + bigNum(m.pixAno.total) + '</div>' + ill.lightning + '</div><div class="tiles"><div>' + tile('taxas') + '<div><span>Taxas e juros no ano</span><b style="color:var(--red-fg)">' + brl(m.pixAno.taxas) + '</b></div></div></div></section>' : '');
    return '<div style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:20px">' + ((m.features || {}).lembretes && m.lembretes ? lembretesPanel(m) : '') + pixPanel + manualPanel + '</div>';
  }

  function fixadosPanel(m) {
    const f = m.fixados || [];
    if (!f.length) return '';
    const card = (x) => {
      const mx = Math.max.apply(null, x.meses.map((y) => Math.abs(y.total)).concat([1]));
      const pos = x.total > 0;
      return '<div class="fix-card' + (S.termo === x.termo ? ' on' : '') + '">' +
        '<div class="fix-top">' + mark(x.marca, x.cat, true) + '<b title="' + esc(x.nome) + '">' + esc(x.nome) + '</b>' +
        '<button type="button" class="icon-btn ghost" data-act="fixar" data-v="' + esc(x.termo) + '" aria-label="Desafixar ' + esc(x.nome) + '" title="Desafixar">' + icon('close', 14, 2) + '</button></div>' +
        '<div class="fix-big"><span class="' + (pos ? 'pos' : '') + '">' + (pos ? '+ ' : '') + brl(Math.abs(x.total)) + '</span><small>' + x.qtd + (x.qtd === 1 ? ' vez' : ' vezes') + ' no total' + (x.primeira ? ', desde ' + esc(dateBr(x.primeira)) : '') + '</small></div>' +
        '<div class="fix-stats"><div><small>Este mês</small><b>' + brl(Math.abs(x.mesTotal)) + '</b><small>' + x.mesQtd + (x.mesQtd === 1 ? ' vez' : ' vezes') + '</small></div><div><small>No ano</small><b>' + brl(Math.abs(x.anoTotal)) + '</b><small>' + x.anoQtd + (x.anoQtd === 1 ? ' vez' : ' vezes') + '</small></div><div><small>Média por vez</small><b>' + brl(Math.abs(x.media)) + '</b></div></div>' +
        '<div class="fix-bars" aria-label="Últimos 6 meses">' + x.meses.map((y) => '<div title="' + esc(y.mes) + ': ' + y.qtd + 'x, ' + brl(Math.abs(y.total)) + '"><span style="height:' + Math.max(y.qtd ? 6 : 2, Math.abs(y.total) / mx * 100).toFixed(1) + '%' + (y.qtd ? '' : ';opacity:.35') + '"></span><small>' + esc(y.mes) + '</small></div>').join('') + '</div>' +
        '<button type="button" class="link" data-act="fixado-ver" data-v="' + esc(x.termo) + '">' + (S.termo === x.termo ? 'Mostrar todos os lançamentos' : 'Ver só esses lançamentos') + '</button></div>';
    };
    return '<section class="panel" aria-label="Fixados"><div class="head"><div><h2 class="h2">Fixados</h2><span class="sub">Quantas vezes cada um aparece e quanto somou, desde o primeiro lançamento guardado.</span></div></div><div class="fix-grid">' + f.map(card).join('') + '</div></section>';
  }

  function lembreteQuando(x) {
    if (!x.data) return 'sem data';
    const dm = x.data.split('-').reverse().slice(0, 2).join('/');
    if (x.dias < 0) return 'era para ' + dm;
    if (x.dias === 0) return 'hoje';
    if (x.dias === 1) return 'amanhã';
    return dm;
  }

  function lembretesPanel(m) {
    const l = m.lembretes || [];
    return '<section class="panel" aria-label="Lembretes"><div class="head"><div><h2 class="h2">Lembretes</h2><span class="sub">' + (l.length ? 'Na data, eles aparecem no sininho. Marque quando fizer.' : 'Crie aqui ou peça na aba Conversar: “me lembra de cancelar a assinatura dia 20”.') + '</span></div>' +
      (m.sync.web ? '<button type="button" class="btn small" data-act="dlg-lembrete">' + icon('plus', 14, 2) + 'Novo</button>' : '') + '</div>' +
      (l.length ? '<div class="list">' + l.map((x) => '<div class="li lem' + (x.dias !== null && x.dias <= 0 ? ' due' : '') + '">' +
        (m.sync.web ? '<button type="button" class="check-btn" data-act="lembrete-done" data-v="' + esc(x.id) + '" aria-label="Feito: ' + esc(x.texto) + '" title="Feito">' + icon('check', 14, 2.2) + '</button>' : '') +
        '<div class="grow"><span class="t">' + esc(x.texto) + '</span><span class="m">' + esc(lembreteQuando(x)) + (x.origem === 'ia' ? ' · criado pelo assistente' : '') + '</span></div></div>').join('') + '</div>' : '') + '</section>';
  }

  function metasPanel(m) {
    const metas = m.metas || [];
    const web = m.sync.web;
    if (!metas.length) {
      return '<section class="panel compact-cta" style="flex:1 1 300px" aria-label="Metas"><div class="grow"><h2 class="h2">Metas</h2><span class="sub">Junte para algo com prazo, como o apartamento. O app diz quanto guardar por mês e se você está no ritmo.</span></div>' +
        (web ? '<button type="button" class="btn small primary" data-act="dlg-meta">' + icon('plus', 14, 2) + 'Criar meta</button>' : '') + '</section>';
    }
    return '<section class="panel" style="flex:1 1 380px" aria-label="Metas"><div class="head"><div><h2 class="h2">Metas</h2>' + (metas.some((g) => !g.bill && !g.conta || g.conta) && metas.some((g) => g.ritmo !== null) ? '<span class="sub">O ritmo é a média do que sobrou nos últimos meses fechados.</span>' : '') + '</div>' + (web ? '<button type="button" class="btn small" data-act="dlg-meta">' + icon('plus', 14, 2) + 'Nova</button>' : '') + '</div>' +
      metas.map((g) => '<div class="meta">' +
        '<div class="line"><span class="t">' + icon('target', 16, 1.8) + esc(g.nome) + '</span>' + (web ? '<button type="button" class="icon-btn ghost" data-act="dlg-meta" data-v="' + esc(g.id) + '" aria-label="Editar a meta ' + esc(g.nome) + '">' + icon('pencil', 15) + '</button>' : '') + '</div>' +
        '<div class="line"><b class="big-s">' + brl(g.atual) + '</b><span class="sub">de ' + brl(g.valor) + (g.conta ? ' · guardado no ' + esc(g.conta) : '') + '</span></div>' +
        (g.bill ? '<span class="sub">' + (g.guardado ? brl(g.guardado) + ' pagos antes + ' : '') + g.bill.qtd + (g.bill.qtd === 1 ? ' parcela' : ' parcelas') + ' de ' + esc(g.bill.nome) + ' (' + brl(g.bill.pagos) + ')' + (g.bill.contaExtra ? ' + ' + brl(g.bill.saldoExtra) + ' guardados no ' + esc(g.bill.contaExtra) : '') + '</span>' : '') +
        '<div class="track" role="img" aria-label="' + Math.round(g.pct) + '% da meta" style="height:10px"><div style="height:10px;width:' + g.pct + '%;background:var(--green)"></div></div>' +
        '<span class="sub">' + (g.falta <= 0 ? '<span class="good">' + icon('check', 13, 2) + 'Meta alcançada!</span>'
          : (g.porMes !== null ? (g.bill ? 'Faltam ' + brl(g.falta) + ' até ' + esc(g.prazoLabel) + ' (' + brl(g.porMes) + ' por mês).' : 'Faltam ' + brl(g.falta) + ' até ' + esc(g.prazoLabel) + ': guarde <b>' + brl(g.porMes) + '</b> por mês.') : 'Faltam ' + brl(g.falta) + '.') +
            (g.bill && g.bill.extra !== null ? (g.bill.extra > 0 ? ' A parcela de ' + brl(g.bill.parcela) + ' cobre parte: <b>além dela, guarde ' + brl(g.bill.extra) + ' por mês</b>.' : ' Só com a parcela de ' + brl(g.bill.parcela) + ' você chega no prazo.') : '') +
            (g.bill && g.bill.extra === null && g.chegaEm ? ' Só com a parcela de ' + brl(g.bill.parcela) + ', você chega em ' + esc(g.chegaEm) + '.' : '') +
            (g.ritmo !== null ? ' ' + (g.ritmo > 0 ? 'No ritmo atual (' + brl(g.ritmo) + ' por mês) você chega em ' + esc(g.chegaEm) + '.' : 'Nos últimos meses não sobrou dinheiro, então ainda não dá para prever.') : '') +
            (g.noRitmo === true ? ' <span class="pill green">no ritmo</span>' : g.noRitmo === false ? ' <span class="pill amber">abaixo do ritmo</span>' : '')) + '</span></div>').join('') + '</section>';
  }

  function limitesPanel(m) {
    const lim = m.limites || [];
    const web = m.sync.web;
    if (!lim.length) {
      return '<section class="panel compact-cta" style="flex:1 1 300px" aria-label="Limites por categoria"><div class="grow"><h2 class="h2">Limites do mês</h2><span class="sub">Um teto para categorias como restaurantes ou compras. O sininho avisa quando chegar em 80% e quando passar.</span></div>' +
        (web ? '<button type="button" class="btn small primary" data-act="dlg-limites">' + icon('plus', 14, 2) + 'Definir limites</button>' : '') + '</section>';
    }
    return '<section class="panel" style="flex:1 1 380px" aria-label="Limites do mês"><div class="head"><div><h2 class="h2">Limites do mês</h2><span class="sub">' + esc(m.month.nome.toLowerCase()) + ' · gasto até agora em cada categoria</span></div>' + (web ? '<button type="button" class="btn small" data-act="dlg-limites">' + icon('pencil', 14) + 'Ajustar</button>' : '') + '</div>' +
      '<div class="cats one">' + lim.map((l) => {
        const cor = l.pct >= 100 ? '#e11d48' : l.pct >= 80 ? '#f59e0b' : catStyle(l.cat).bar;
        return '<button type="button" class="cat cat-btn" data-act="cat-open" data-v="' + esc(l.cat) + '">' + tile(l.cat) + '<div class="grow"><div class="line"><span style="font-weight:600">' + esc(l.label) + '</span><b style="white-space:nowrap">' + brl(l.gasto) + ' <span class="sub">de ' + brl(l.valor) + '</span></b></div>' +
          '<div class="track"><div style="width:' + Math.min(100, l.pct).toFixed(1) + '%;background:' + cor + '"></div></div>' +
          '<span class="sub" style="color:' + (l.pct >= 100 ? 'var(--red-fg)' : l.pct >= 80 ? 'var(--soft-amber-fg)' : 'var(--muted)') + '">' + (l.resta >= 0 ? 'restam ' + brl(l.resta) : 'passou ' + brl(-l.resta)) + '</span></div></button>';
      }).join('') + '</div></section>';
  }

  function graficoPanel(m) {
    const h = m.historico;
    const mx = Math.max.apply(null, h.map((x) => Math.max(x.entrou, x.saiu)).concat([1]));
    const W = 640;
    const H = 180;
    const col = W / h.length;
    const bw = Math.min(26, col / 3.2);
    const y = (v) => H - (v / mx) * (H - 10);
    const bars = h.map((x, i) => {
      const cx = col * i + col / 2;
      return '<rect x="' + (cx - bw - 2).toFixed(1) + '" y="' + y(x.entrou).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - y(x.entrou)).toFixed(1) + '" rx="4" style="fill:var(--green)"' + (x.atual ? ' opacity="0.55"' : '') + '><title>Entrou ' + brl(x.entrou) + '</title></rect>' +
        '<rect x="' + (cx + 2).toFixed(1) + '" y="' + y(x.saiu).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - y(x.saiu)).toFixed(1) + '" rx="4" style="fill:var(--rose)"' + (x.atual ? ' opacity="0.55"' : '') + '><title>Saiu ' + brl(x.saiu) + '</title></rect>';
    }).join('');
    return '<section class="panel" aria-label="Últimos meses"><div class="head"><div><h2 class="h2">Últimos meses</h2><span class="sub">Quanto entrou e quanto saiu em cada mês. O mês atual está mais claro porque ainda não fechou.</span></div>' +
      '<div class="legend-mini"><span><i style="background:var(--green)"></i>Entrou</span><span><i style="background:var(--rose)"></i>Saiu</span></div></div>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' ' + (H + 2) + '" role="img" aria-label="Entradas e saídas dos últimos meses" preserveAspectRatio="none"><line x1="0" x2="' + W + '" y1="' + H + '" y2="' + H + '" style="stroke:var(--line)"/>' + bars + '</svg>' +
      '<div class="chart-x" style="grid-template-columns:repeat(' + h.length + ',1fr)">' + h.map((x) => '<div><b>' + esc(x.mes) + '</b><span class="' + (x.sobra >= 0 ? 'pos' : 'neg') + '">' + (x.sobra >= 0 ? 'sobrou ' : 'faltou ') + brl(Math.abs(x.sobra)) + '</span></div>').join('') + '</div></section>';
  }

  function parcelasPanel(m) {
    const p = m.parcelas || [];
    if (!p.length) return '<section class="panel"><h2 class="h2">Parcelas nos próximos meses</h2><div class="empty-state" style="padding:12px">Nenhuma compra parcelada em andamento.</div></section>';
    const mx = Math.max.apply(null, p.map((x) => x.total).concat([1]));
    return '<section class="panel" aria-label="Parcelas nos próximos meses"><div class="head"><div><h2 class="h2">Parcelas nos próximos meses</h2><span class="sub">Quanto das próximas faturas já está comprometido com compras parceladas. Clique num mês para ver as compras.</span></div></div>' +
      '<div class="parc">' + p.map((x) => '<button type="button" class="parc-m' + (S.parcMes === x.key ? ' on' : '') + '" data-act="parc-mes" data-v="' + x.key + '"><span class="parc-bar"><span style="height:' + Math.max(4, x.total / mx * 100).toFixed(1) + '%"></span></span><b>' + esc(x.mes) + '</b><small>' + brl(x.total) + '</small></button>').join('') + '</div>' +
      (S.parcMes && p.find((x) => x.key === S.parcMes) ? (() => {
        const x = p.find((y) => y.key === S.parcMes);
        return '<div class="list">' + x.itens.map((i) => '<div class="li">' + tile('compras', true) + '<div class="grow"><span class="t">' + esc(i.nome) + '</span><span class="m">parcela ' + esc(i.parcela) + ' · ' + esc(i.cartao) + '</span></div><span class="v">' + brl(i.valor) + '</span></div>').join('') + '</div>';
      })() : '') + '</section>';
  }

  function assinaturasPanel(m) {
    const a = m.assinaturas || [];
    return '<section class="panel" aria-label="Cobranças que se repetem"><div class="head"><div><h2 class="h2">Cobranças que se repetem</h2><span class="sub">' + (a.length ? 'Encontrei ' + a.length + (a.length === 1 ? ' cobrança' : ' cobranças') + ' que aparecem todo mês, somando ' + brl(m.assinaturasTotal) + ' por mês (' + brl(m.assinaturasTotal * 12) + ' por ano).' : 'Nenhuma cobrança mensal repetida nos últimos 4 meses.') + '</span></div></div>' +
      (a.length ? '<div class="list">' + a.map((x, i) => '<div class="li">' + mark(x.marca, x.cat, true) + '<div class="grow"><span class="t">' + esc(x.nome) + (x.subiu ? ' <span class="pill amber" style="font-size:10px">subiu de ' + brl(x.subiu.de) + '</span>' : '') + '</span><span class="m">' + esc(x.conta) + ' · ' + x.meses + ' meses seguidos · ' + brl(x.anual) + ' por ano</span></div><span class="v">' + brl(x.valor) + '</span>' +
        (x.jaFixa ? '<span class="pill green" style="font-size:10px">já é fixa</span>' : '<button type="button" class="icon-btn ghost" data-act="ass-fixa" data-v="' + i + '" title="Virar despesa fixa" aria-label="Virar despesa fixa: ' + esc(x.nome) + '">' + icon('contas', 16) + '</button>') + '</div>').join('') + '</div>' : '') +
      '</section>';
  }

  function metaFonteHelp(v) {
    if (!v) return 'Você atualiza o valor guardado quando quiser.';
    if (v.startsWith('bill:')) return 'Cada parcela paga que aparecer no extrato soma na meta sozinha. Some também o que você já tinha pago antes.';
    return 'O valor guardado acompanha o saldo dessa conta sozinho.';
  }

  const PUSH_TIPOS = [
    ['compras', 'Compras e entradas novas', 'Quando os bancos atualizarem, um aviso com o que entrou e saiu.'],
    ['contas', 'Contas vencendo', 'Na véspera e no dia do vencimento, de manhã. E se passar do dia sem aparecer paga.'],
    ['limites', 'Limites por categoria', 'Quando chegar em 80% e quando passar do limite.'],
    ['lembretes', 'Lembretes', 'No dia do lembrete, de manhã.'],
    ['alertas', 'Gastos fora do normal', 'Compra bem acima do costume, cobrança repetida ou assinatura que ficou mais cara.'],
    ['resumo', 'Resumo do mês', 'No começo do mês, como foi o mês que fechou.']
  ];

  function pushPanel(m) {
    const info = S.pushInfo;
    const pp = m.push || { aparelhos: [], prefs: {} };
    const aqui = info && info.endpoint && pp.aparelhos.some((a) => a.endpoint === info.endpoint);
    let estado;
    if (!info) estado = '<span class="sub">Conferindo este aparelho...</span>';
    else if (info.ios && !info.standalone) estado = '<div class="msg ok" style="background:var(--blue-soft);color:var(--blue-d)">No iPhone, as notificações só funcionam pelo app da tela de início. Abra o Meu Cofrin pelo ícone e ative por lá.</div>';
    else if (!info.supported) estado = '<div class="msg err">Este navegador não aceita notificações de sites.</div>';
    else if (info.permission === 'denied') estado = '<div class="msg err">As notificações estão bloqueadas para este site. Libere em Configurações do navegador → Notificações e volte aqui.</div>';
    else if (aqui) estado = '<div class="push-row"><span class="good">' + icon('check', 14, 2) + 'Ativadas neste aparelho</span><span class="push-btns"><button type="button" class="btn small" data-act="push-test">Mandar um teste</button><button type="button" class="btn small" data-act="push-off" data-v="' + esc(info.endpoint) + '">Desativar aqui</button></span></div>';
    else estado = '<div class="push-row"><span class="sub">Ainda não ativadas neste aparelho.</span><button type="button" class="btn small primary" data-act="push-on">' + icon('bell', 14, 2) + 'Ativar neste aparelho</button></div>' +
      (info.firefox ? '<span class="sub">No Firefox, os avisos só chegam com o Firefox aberto. Para receber com tudo fechado no PC, use o Edge: abra o site, menu ⋯ → Aplicativos → Instalar este site como aplicativo, e ative por lá.</span>' : '');
    return '<section class="panel" aria-label="Notificações"><div><h2 class="h2">Notificações</h2><span class="sub">Avisos no celular e no computador, mesmo com o app fechado. O app confere os bancos de hora em hora; ninguém é avisado entre 22h e 8h.</span></div>' +
      estado + msg('push') +
      (pp.aparelhos.length ? '<div class="list">' + pp.aparelhos.map((a) => '<div class="li">' + tile('celular', true) + '<div class="grow"><span class="t">' + esc(a.device) + (info && a.endpoint === info.endpoint ? ' <span class="pill blue" style="font-size:10px">este</span>' : '') + '</span><span class="m">ativado em ' + esc(dateBr(a.criado)) + '</span></div>' +
        '<button type="button" class="icon-btn ghost" data-act="push-off" data-v="' + esc(a.endpoint) + '" aria-label="Parar de avisar o ' + esc(a.device) + '">' + icon('trash', 15) + '</button></div>').join('') + '</div>' : '') +
      '<div class="feat-list">' + PUSH_TIPOS.map(([k, t, d]) => '<label class="feat"><span class="grow"><b>' + esc(t) + '</b><small>' + esc(d) + '</small></span><span class="toggle"><input type="checkbox" data-pushpref="' + k + '"' + (pp.prefs[k] !== false ? ' checked' : '') + '><span aria-hidden="true"></span></span></label>').join('') + '</div></section>';
  }

  const FEATURES = [
    ['metas', 'Metas', 'Juntar para algo com prazo, como o apartamento, e quanto guardar por mês.'],
    ['limites', 'Limites por categoria', 'Um teto por mês para categorias como restaurantes. O sininho avisa em 80% e quando passar.'],
    ['parcelas', 'Parcelas futuras', 'Em Cartões, quanto das próximas faturas já está comprometido.'],
    ['assinaturas', 'Cobranças que se repetem', 'Em Despesas fixas, as assinaturas que o app encontrou, e aviso quando ficarem mais caras.'],
    ['alertas', 'Gastos fora do normal', 'Aviso quando uma compra vem bem acima do costume ou parece duplicada.'],
    ['pixAno', 'Pix no crédito no ano', 'Quanto você já pagou de juros e IOF no ano.'],
    ['resumo', 'Resumo do mês', 'No começo de cada mês, um resumo do mês que fechou no sininho.'],
    ['grafico', 'Gráfico dos últimos meses', 'Entradas e saídas mês a mês na Visão geral.'],
    ['lembretes', 'Lembretes', 'Lembretes que você cria ou pede para o assistente criar. Na data, eles aparecem no sininho.']
  ];

  function featuresPanel(m) {
    const f = m.features || {};
    return '<section class="panel" aria-label="O que aparece no app"><div><h2 class="h2">O que aparece no app</h2><span class="sub">Desligue o que você não quer ver. Dá para ligar de novo quando quiser, e nada do que você cadastrou se perde.</span></div>' +
      '<div class="feat-list">' + FEATURES.map(([k, t, d]) => '<label class="feat"><span class="grow"><b>' + esc(t) + '</b><small>' + esc(d) + '</small></span><span class="toggle"><input type="checkbox" data-feature="' + k + '"' + (f[k] ? ' checked' : '') + '><span aria-hidden="true"></span></span></label>').join('') + '</div></section>';
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
      '<div class="huge"' + (neg ? ' style="color:var(--red-fg)"' : '') + '><span class="rs">' + (neg ? '− ' : '') + 'R$ </span>' + parts[0] + '<span class="ct">,' + parts[1] + '</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:2px;padding-left:16px;border-left:1px solid #e2e8f0">' +
      '<span class="sub" style="font-size:13px">' + brl(p.saldoContas) + ' nas contas hoje</span>' +
      (p.totalAntes > 0 ? '<span class="warn" style="font-size:13px">− ' + brl(p.totalAntes) + ' que vence antes do salário</span>' : '<span class="good" style="font-size:13px">' + icon('check', 14, 2) + 'nada vence antes do salário</span>') +
      '</div></div></div>' + ill.wallet + '</div>' +
      (p.antes.length ? '<div class="list">' + p.antes.map(row).join('') + '</div>' : '') +
      '<div style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #eef1f6;padding-top:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><h3 class="h2">Salário de ' + esc(p.salarioMes) + '</h3>' +
      (p.salario > 0 ? '<span class="sub">sobram <b style="color:' + (sobraNeg ? 'var(--red-fg)' : 'var(--soft-green-fg)') + ';font-size:15px">' + (sobraNeg ? '− ' : '') + brl(p.sobraSalario) + '</b> para o dia a dia</span>' : '<button type="button" class="link" data-act="nav" data-v="bancos">Informar o salário</button>') + '</div>' +
      (p.salario > 0 ? '<div class="bar" role="img" aria-label="Como o salário se divide">' + seg(p.faturasDepois, '#2563eb') + seg(p.fixasDepois, '#1e3a8a') + seg(p.investir, '#ec4899') + seg(Math.max(0, p.sobraSalario), '#16a34a') + '</div>' : '') +
      '<div class="legend">' +
      '<div><span class="k">Salário</span><span class="v">' + brl(p.salario) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#2563eb"></span>Faturas</span><span class="v">− ' + brl(p.faturasDepois) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#1e3a8a"></span>Despesas fixas</span><span class="v">− ' + brl(p.fixasDepois) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#ec4899"></span>Investir</span><span class="v">− ' + brl(p.investir) + '</span></div>' +
      '<div><span class="k"><span class="dot" style="background:#16a34a"></span>Sobra</span><span class="v" style="color:' + (sobraNeg ? 'var(--red-fg)' : 'var(--soft-green-fg)') + '">' + (sobraNeg ? '− ' : '') + brl(p.sobraSalario) + '</span></div>' +
      '</div>' +
      (p.depois.length ? '<details class="det"><summary>Ver o que sai do salário (' + p.depois.length + ')</summary><div class="list">' + p.depois.map(row).join('') + '</div></details>' : '') +
      (!m.settings.bills.length ? '<span class="sub">Cadastre o apartamento e o que mais você paga todo mês em <button type="button" class="link" data-act="nav" data-v="fixas">Despesas fixas</button> para essa conta ficar completa.</span>' : '') +
      '</div></section>';
  }

  function saldosPanel(m) {
    const p = m.plano;
    return '<section class="panel" style="flex:1 1 300px" aria-label="Dinheiro nas contas">' +
      '<div class="head"><div><h2 class="h2">Dinheiro nas contas</h2><span class="sub">' + (m.sync.bancosEm && !m.sync.demo ? 'bancos atualizaram ' + esc(when(m.sync.bancosEm)) : 'saldo de hoje em cada banco') + '</span>' + bigNum(p.saldoContas) + '</div>' + ill.piggy + '</div>' +
      '<div class="list">' + p.contas.map((c) => '<div class="li" style="padding:9px 0">' + mark(window.BRAND_LOGOS.forName(c.nome) || { sigla: c.sigla, cor: c.cor, fg: '#fff' }, 'contas', true) + '<div class="grow"><span class="t" style="font-weight:500">' + esc(c.nome) + '</span></div><span class="v"' + (c.saldo < 0 ? ' style="color:var(--red-fg)"' : '') + '>' + (c.saldo < 0 ? '− ' : '') + brl(c.saldo) + '</span></div>').join('') + '</div>' +
      (p.investir > 0 ? '<span class="sub">Você planeja investir ' + brl(p.investir) + ' por mês.</span>' : '<span class="sub">Investimento: nada por enquanto. <button type="button" class="link" data-act="nav" data-v="bancos">Mudar</button></span>') +
      '</section>';
  }

  function screenVisao(m) {
    return '<div class="row">' + planoPanel(m) + saldosPanel(m) + '</div>' +
      '<div class="row top">' + cartoesPanel(m) + contasPanel(m) + comprasPanel(m) + '</div>' +
      ((m.features || {}).metas || (m.features || {}).limites ? '<div class="row top">' + ((m.features || {}).metas ? metasPanel(m) : '') + ((m.features || {}).limites ? limitesPanel(m) : '') + '</div>' : '') +
      '<div class="row top">' + categoriasPanel(m) + sidePanels(m) + '</div>' +
      (m.historico && m.historico.length > 1 ? graficoPanel(m) : '');
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
      if (S.termo && t.termo !== S.termo) return false;
      if (q && !(t.nome.toLowerCase().includes(q) || t.catLabel.toLowerCase().includes(q) || t.conta.toLowerCase().includes(q))) return false;
      return true;
    });
    if (S.ordem === 'valor') rows.sort((a, b) => a.valor - b.valor);
    const groups = [];
    if (S.ordem === 'categoria') {
      const by = {};
      for (const t of rows) { if (!by[t.cat]) { by[t.cat] = { cat: t.cat, label: t.catLabel, rows: [], total: 0 }; groups.push(by[t.cat]); } by[t.cat].rows.push(t); by[t.cat].total += t.valor; }
      groups.sort((a, b) => a.total - b.total);
    }
    S.lancRows = rows;
    const canFix = (t) => ['expense', 'pix_credit'].includes(t.kind) && t.valor < 0;
    const options = (sel) => m.cats.map((c) => '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('');
    const fixSet = new Set((m.fixados || []).map((f) => f.termo));
    const pinBtn = (t) => t.termo ? '<button type="button" class="icon-btn ghost pin-btn' + (fixSet.has(t.termo) ? ' on' : '') + '" data-act="fixar" data-v="' + esc(t.termo) + '" data-nome="' + esc(t.nome.replace(/, \d+ de \d+$/, '')) + '" aria-pressed="' + fixSet.has(t.termo) + '" aria-label="' + (fixSet.has(t.termo) ? 'Desafixar ' : 'Fixar ') + esc(t.nome) + '" title="' + (fixSet.has(t.termo) ? 'Desafixar' : 'Fixar e acompanhar') + '">' + icon('pin', 15, 1.7) + '</button>' : '';
    S.pinBtn = pinBtn;
    return fixadosPanel(m) + '<section class="panel" aria-label="Lançamentos">' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px"><div class="chips">' +
      filters.map(([id, l]) => '<button type="button" class="chip' + (S.filtro === id ? ' on' : '') + '" data-act="filtro" data-v="' + id + '" aria-pressed="' + (S.filtro === id) + '">' + l + '</button>').join('') +
      (S.termo ? '<button type="button" class="chip on" data-act="fixado-ver" data-v="' + esc(S.termo) + '" aria-label="Tirar o filtro do fixado">Só: ' + esc(((m.fixados || []).find((f) => f.termo === S.termo) || { nome: S.termo }).nome) + ' ✕</button>' : '') +
      (S.cat ? '<button type="button" class="chip on" data-act="cat-clear" aria-label="Tirar o filtro de categoria" style="background:' + catStyle(S.cat).fg + '">' + esc((m.cats.find((c) => c.id === S.cat) || { label: S.cat }).label) + ' ✕</button>' : '') +
      '</div><input class="search" id="busca" type="search" placeholder="Buscar" aria-label="Buscar lançamentos" value="' + esc(S.q) + '"></div>' +
      '<div class="lanc-tools"><label class="mini-sel"><span>Categoria</span><select id="lanc-cat"><option value="">Todas</option>' + m.cats.map((c) => '<option value="' + c.id + '"' + (c.id === S.cat ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('') + '</select></label>' +
      '<label class="mini-sel"><span>Ordenar por</span><select id="lanc-ordem">' + [['data', 'Data'], ['valor', 'Maior valor'], ['categoria', 'Categoria (agrupado)']].map(([k, l]) => '<option value="' + k + '"' + (S.ordem === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      (rows.length ? '<button type="button" class="btn small" style="margin-left:auto" data-act="csv">' + icon('down', 14, 2) + 'Baixar planilha</button>' : '') + '</div>' +
      '<span class="sub">' + rows.length + (rows.length === 1 ? ' lançamento' : ' lançamentos') + '. Para mudar a categoria, clique nela.</span>' +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Data</th><th>Categoria</th><th>Conta ou cartão</th><th>Valor</th><th><span class="sr">Despesa fixa</span></th></tr></thead><tbody>' +
        (S.ordem === 'categoria' ? groups.map((g) => '<tr class="grp"><td colspan="6"><span class="desc">' + tile(g.cat, true) + esc(g.label) + ' <span class="sub">· ' + g.rows.length + (g.rows.length === 1 ? ' lançamento' : ' lançamentos') + '</span></span><b>' + signedBrl(g.total) + '</b></td></tr>' + g.rows.map(rowHtml).join('')).join('') : rows.map(rowHtml).join('')) + '</tbody></table></div>'
        : '<div class="empty-state">Nada encontrado neste mês.</div>') +
      '</section>';
    function rowHtml(t) {
          const st = catStyle(t.cat);
          const fixed = ['card_payment', 'card_payment_in', 'transfer_in', 'transfer_out'].includes(t.kind);
          return '<tr><td><span class="desc">' + mark(t.marca, t.cat, true) + '<span>' + esc(t.nome) + (t.tag || t.guardado ? '<br><span class="sub">' + esc(t.tag || '') + (t.tag && t.guardado ? ' · ' : '') + (t.guardado ? '<span class="pill gray" style="font-size:10px" title="O Open Finance não manda mais esse lançamento, mas ele continua guardado no app.">guardado · ' + esc(t.guardado) + '</span>' : '') + '</span>' : '') + '</span></span></td>' +
            '<td class="sub" style="white-space:nowrap">' + esc(t.data) + '</td>' +
            '<td>' + (fixed ? '<span class="pill" style="background:' + st.bg + ';color:' + st.fg + '">' + esc(t.catLabel) + '</span>'
              : '<select class="cat-select" data-tx="' + esc(t.id) + '" aria-label="Categoria de ' + esc(t.nome) + '" style="background:' + st.bg + ';color:' + st.fg + '">' + options(t.cat) + '</select>') + '</td>' +
            '<td><span style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:' + t.bankCor + '"></span>' + esc(t.conta) + '</span></td>' +
            '<td style="font-weight:700;white-space:nowrap;color:' + (t.valor > 0 ? 'var(--green-d)' : 'var(--ink)') + '">' + signedBrl(t.valor) + '</td>' +
            '<td class="fix-cell">' + S.pinBtn(t) + (canFix(t) ? '<button type="button" class="icon-btn ghost" data-act="tx-fixa" data-v="' + esc(t.id) + '" aria-label="Virar despesa fixa: ' + esc(t.nome) + '" title="Virar despesa fixa">' + icon('contas', 16) + '</button>' : '') + '</td></tr>';
    }
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
      ((m.features || {}).parcelas && m.parcelas ? parcelasPanel(m) : '') +
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
      '<div style="flex:1 1 180px;background:var(--soft-orange-bg);border-radius:16px;padding:16px"><span class="sub" style="color:var(--soft-orange-fg);font-weight:600">Em aberto</span><div class="big" style="font-size:30px">' + brl(t.aberto) + '</div></div>' +
      '<div style="flex:1 1 180px;background:var(--soft-green-bg);border-radius:16px;padding:16px"><span class="sub" style="color:var(--soft-green-fg2);font-weight:600">Já pago</span><div class="big" style="font-size:30px;color:var(--soft-green-fg)">' + brl(t.pago) + '</div></div>' +
      '<div style="flex:1 1 180px;background:var(--soft-blue-bg);border-radius:16px;padding:16px"><span class="sub" style="color:var(--soft-blue-fg);font-weight:600">Pagas</span><div class="big" style="font-size:30px">' + t.pagas + ' de ' + t.total + '</div></div></div>' +
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
      '<span class="sub">“Como aparece no extrato” são palavras do pagamento (ex.: o nome de quem recebe). Quando o app acha o pagamento, a despesa fica paga sozinha.</span></section>' +
      ((m.features || {}).assinaturas && m.assinaturas ? assinaturasPanel(m) : '');
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
          mark(window.BRAND_LOGOS.forName(b.nome) || { sigla: b.sigla, cor: b.cor, fg: '#fff' }, 'contas') +
          '<div class="grow" style="flex:1 1 200px"><span class="t">' + esc(b.nome) + (b.reserva ? ' <span class="pill" style="background:var(--soft-pink-bg);color:var(--soft-pink-fg);font-size:10px">reserva</span>' : '') + '</span><span class="m">' + esc(b.tipo) + (b.consentimento ? ' · autorizado até ' + esc(dateBr(b.consentimento)) : '') + '</span></div>' +
          '<span class="m" style="flex:1 1 200px;font-weight:600;color:' + (b.erro ? 'var(--red-fg)' : 'var(--soft-green-fg)') + '">' + (b.erro ? esc(b.erro) : 'Atualizado ' + esc(when(b.atualizado || m.sync.last))) + '</span>' +
          '<span class="v">' + brl(b.saldo) + '</span>' +
          (m.sync.demo ? '' : '<button type="button" class="icon-btn ghost" data-act="item-remove" data-v="' + esc(b.id) + '" aria-label="Remover ' + esc(b.nome) + '">' + icon('trash', 16) + '</button>') +
          '</div>').join('') + '</div>'
      : '<div class="empty-state" style="padding:12px">Nenhum banco ainda.</div>';
    const pending = s.items.filter((it) => !m.bancos.some((b) => b.id === it.id));
    const pendingList = pending.length ? '<div class="list">' + pending.map((it) => '<div class="li"><span class="tile s" style="background:var(--slate-bg);color:var(--slate-fg)">' + icon('link', 16) + '</span><div class="grow"><span class="t">' + esc(it.label || 'Banco') + '</span><span class="m">' + esc(it.id) + ' · aguardando a próxima sincronização</span></div><button type="button" class="icon-btn ghost" data-act="item-remove" data-v="' + esc(it.id) + '" aria-label="Remover">' + icon('trash', 16) + '</button></div>').join('') + '</div>' : '';

    const demoBanner = m.sync.demo
      ? '<section class="panel" style="background:var(--soft-amber-bg2);border-color:var(--soft-amber-line)"><h2 class="h2">Você está vendo dados de exemplo</h2><span class="sub" style="color:var(--soft-amber-fg2)">Nada disso é seu. Quando quiser usar com seus bancos, saia do exemplo: os dados de exemplo são apagados e o app fica pronto para conectar.</span><button type="button" class="btn" style="align-self:flex-start" data-act="demo-stop">Sair do exemplo</button></section>'
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
          : '<ol class="steps"><li>Crie sua conta em <button type="button" class="link" data-act="ext" data-v="https://meu.pluggy.ai">meu.pluggy.ai</button> e conecte cada banco que você usa. O próprio banco pede a autorização no app dele.</li>' +
            '<li>No <button type="button" class="link" data-act="ext" data-v="https://dashboard.pluggy.ai">dashboard.pluggy.ai</button>, crie uma aplicação, adicione o conector MeuPluggy e copie o Client ID e o Client Secret.</li>' +
            '<li>Cole os dois aqui. ' + (m.sync.web ? 'Eles ficam guardados criptografados no servidor e nunca voltam para o navegador.' : 'Eles ficam guardados só neste PC, criptografados pelo Windows.') + '</li></ol>' + secretsForm) +
        msg('secrets') + '</section>' +

        '<section class="panel"><h2 class="h2">2. Adicionar cada banco</h2><span class="sub">No dashboard da Pluggy, abra a aplicação Demo, autorize o MeuPluggy e copie o Item ID de cada banco. Um código por banco, não por conta.</span>' +
        '<form data-form="item" class="form"><div class="field"><label for="iid">Item ID</label><input id="iid" name="id" autocomplete="off" spellcheck="false" placeholder="1a2b3c4d-..."></div>' +
        '<div class="field"><label for="ilabel">Nome do banco</label><input id="ilabel" name="label" placeholder="Nubank"></div>' +
        '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Adicionar banco</button></div></form>' + msg('item') +
        '<span class="sub">O plano gratuito permite até 5 bancos conectados.</span></section>') +

      '<section class="panel"><h2 class="h2">Seu mês</h2>' +
      '<form data-form="settings" class="form">' +
      '<div class="field"><label for="sal">Salário líquido</label><input id="sal" name="salario" inputmode="decimal" value="' + (s.salario ? moneyRaw(s.salario) : '') + '" placeholder="6.500,00"><small>Usado para calcular o que sobra do próximo salário.</small></div>' +
      '<div class="field"><label for="dsal">Dia do salário</label><input id="dsal" name="diaSalario" inputmode="numeric" value="' + esc(s.diaSalario) + '"><small>Se cair no fim de semana, o app conta o primeiro dia útil depois.</small></div>' +
      '<div class="field"><label for="inv">Quanto quer investir por mês</label><input id="inv" name="investir" inputmode="decimal" value="' + moneyRaw(s.investir) + '" placeholder="0,00"><small>Sai do salário antes da sobra. Deixe 0 se não for investir agora.</small></div>' +
      '<div class="field"><label for="cpf">Seu CPF (opcional)</label><input id="cpf" name="cpf" inputmode="numeric" placeholder="' + (s.cpf ? esc(s.cpf) : 'só números') + '"><small>Ajuda a reconhecer Pix entre contas suas. Fica só neste PC.</small></div>' +
      (m.sync.web ? '' : '<div class="field"><label for="hrs">Sincronizar a cada</label><select id="hrs" name="syncHours">' + [1, 2, 3, 6, 12].map((h) => '<option value="' + h + '"' + (h === s.syncHours ? ' selected' : '') + '>' + h + (h === 1 ? ' hora' : ' horas') + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Ao ligar o computador</label><label class="switch"><input type="checkbox" name="autoStart"' + (s.autoStart ? ' checked' : '') + (m.sync.autoStartAvailable ? '' : ' disabled') + '> Abrir o Meu Cofrin junto com o Windows</label></div>'
        + '') +
      '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Salvar</button></div></form>' + msg('settings') + '</section>' +

      (m.sync.web && api.pushState ? pushPanel(m) : '') +
      (m.sync.web ? featuresPanel(m) : '') +
      (m.sync.web ? '<section class="panel"><h2 class="h2">Trazer do app de Windows</h2><span class="sub">Escolha o arquivo meu-caixa.json do app de Windows. Vêm junto bancos, lançamentos, despesas fixas, regras de categoria e o crédito do iFood. A chave da Pluggy não vem: cole aqui de novo.</span>' +
        '<label class="btn small" style="align-self:flex-start;cursor:pointer">' + icon('down', 14, 2) + 'Escolher arquivo<input type="file" id="importar" accept=".json,application/json" hidden></label>' + msg('import') + '</section>' +
        '<section class="panel" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between"><div><h2 class="h2">Sua conta</h2><span class="sub">' + esc(api.email ? api.email() : '') + '</span></div><button type="button" class="btn small" data-act="logout">Sair desta conta</button></section>' : '') +
      '<section class="panel" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px"><div><h2 class="h2">Aparência</h2><span class="sub">Vale só para este aparelho.</span></div><div class="chips" role="radiogroup" aria-label="Aparência">' +
        [['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([k, l]) => '<button type="button" class="chip' + (S.tema === k ? ' on' : '') + '" role="radio" aria-checked="' + (S.tema === k) + '" data-act="tema" data-v="' + k + '">' + l + '</button>').join('') + '</div></section>' +
      '<section class="panel"><div class="head"><div><h2 class="h2">Categorias fixas</h2><span class="sub">Criadas quando você troca a categoria em Lançamentos e escolhe “Sempre”.</span></div></div>' +
      (m.catRules.length ? '<div class="list">' + m.catRules.map((r) => '<div class="li">' + tile(r.cat, true) + '<div class="grow"><span class="t">“' + esc(r.termo) + '”</span><span class="m">sempre ' + esc(r.label) + '</span></div>' +
        '<button type="button" class="icon-btn ghost" data-act="catrule-remove" data-v="' + esc(r.id) + '" aria-label="Apagar a regra ' + esc(r.termo) + '">' + icon('trash', 16) + '</button></div>').join('') + '</div>' : '<div class="empty-state" style="padding:12px">Nenhuma ainda.</div>') +
      '</section>' +
      '';
  }

  // ---------- Conversar (IA) ----------
  function md(text) {
    const lines = esc(text).split('\n');
    let html = '';
    let list = false;
    for (const raw of lines) {
      const line = raw.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      const item = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (item) { if (!list) { html += '<ul>'; list = true; } html += '<li>' + item[1] + '</li>'; continue; }
      if (list) { html += '</ul>'; list = false; }
      if (line.trim()) html += '<p>' + line.replace(/^#+\s*/, '') + '</p>';
    }
    if (list) html += '</ul>';
    return html;
  }

  const AI_SUGESTOES = [
    'Para onde está indo a maior parte do meu dinheiro?',
    'Quanto consigo guardar por mês para o apartamento?',
    'Monta um orçamento para o próximo mês',
    'Tem algum gasto que eu deveria cortar?',
    'Como está minha fatura dos cartões este mês?',
    'Posso comprar algo de R$ 3.000 em 10x?',
    'Me lembra de revisar as assinaturas no dia 1º'
  ];

  function screenIA(m) {
    const ai = m.ai || {};
    const keyForm = '<form data-form="aikey" class="form"><div class="field"><label for="aik">Chave da API da OpenAI</label><input id="aik" name="key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-..."><small>Fica guardada criptografada no servidor e nunca volta para o navegador.</small></div>' +
      '<div class="field"><label for="aim">Modelo</label><input id="aim" name="model" autocomplete="off" spellcheck="false" value="' + esc(ai.model || '') + '"><small>Pode deixar como está.</small></div>' +
      '<div class="field" style="justify-content:flex-end"><button class="btn primary" type="submit">Salvar e testar</button></div></form>' + msg('aikey');
    if (!ai.configured || S.editAi) {
      return '<section class="panel"><h2 class="h2">Converse sobre o seu dinheiro</h2><span class="sub">Um assistente que conhece seus saldos, cartões, contas e os lançamentos dos últimos meses. Tira dúvidas, debate decisões e ajuda a planejar.</span>' +
        '<ol class="steps"><li>Entre em <button type="button" class="link" data-act="ext" data-v="https://platform.openai.com/api-keys">platform.openai.com/api-keys</button> e clique em <b>Create new secret key</b>.</li><li>Copie a chave (começa com sk-) e cole aqui.</li></ol>' + keyForm +
        (ai.configured ? '<button type="button" class="link" style="align-self:flex-start" data-act="ai-edit" data-v="0">Cancelar</button>' : '') + '</section>';
    }
    const msgs = (ai.messages || []).slice();
    if (S.aiPending) msgs.push({ role: 'user', content: S.aiPending });
    const bubbles = msgs.map((x) => '<div class="bub ' + (x.role === 'user' ? 'me' : 'ai') + '">' + (x.role === 'user' ? '<p>' + esc(x.content).replace(/\n/g, '<br>') + '</p>' : md(x.content) + (x.acoes || []).map((a) => '<span class="acao">' + icon(a.tipo === 'criou' ? 'bell' : 'check', 13, 1.8) + (a.tipo === 'criou' ? 'Lembrete criado: ' : 'Lembrete apagado: ') + esc(a.texto) + (a.data ? ' · ' + esc(a.data.split('-').reverse().slice(0, 2).join('/')) : '') + '</span>').join('')) + '</div>').join('') +
      (S.aiBusy ? '<div class="bub ai typing" role="status"><span></span><span></span><span></span><em>Pensando nos seus números...</em></div>' : '');
    const empty = '<div class="chat-empty"><span class="chat-ic">' + icon('chat', 24, 1.6) + '</span>' + '<b>Pergunte qualquer coisa sobre o seu dinheiro</b><span>Eu vejo seus saldos, cartões, contas fixas e os lançamentos dos últimos meses.</span>' +
      '<div class="chips">' + AI_SUGESTOES.map((t) => '<button type="button" class="chip" data-act="ai-suggest" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>';
    const conversas = ai.conversas || [];
    const lista = '<aside class="chat-list' + (S.aiList ? ' open' : '') + '" aria-label="Conversas">' +
      '<button type="button" class="btn primary small" data-act="ai-clear">' + icon('plus', 14, 2) + 'Nova conversa</button>' +
      (conversas.length ? '<div class="conv-items">' + conversas.map((c) => '<div class="conv' + (c.id === ai.atual ? ' on' : '') + '"><button type="button" class="conv-open" data-act="ai-open" data-v="' + esc(c.id) + '"' + (c.id === ai.atual ? ' aria-current="true"' : '') + '><b>' + esc(c.titulo) + '</b><small>' + esc(when(c.atualizada)) + ' · ' + Math.ceil(c.qtd / 2) + (Math.ceil(c.qtd / 2) === 1 ? ' pergunta' : ' perguntas') + '</small></button>' +
        '<button type="button" class="icon-btn ghost conv-del" data-act="ai-delete" data-v="' + esc(c.id) + '" aria-label="Apagar a conversa ' + esc(c.titulo) + '">' + icon('trash', 14) + '</button></div>').join('') + '</div>'
        : '<span class="sub" style="padding:8px 4px">Suas conversas aparecem aqui.</span>') + '</aside>';
    const atual = conversas.find((c) => c.id === ai.atual);
    return '<div class="chat-shell">' + lista + '<section class="panel chat">' +
      '<div class="chat-head"><button type="button" class="btn small chat-list-btn" data-act="ai-list" aria-expanded="' + !!S.aiList + '">' + icon('list', 14) + 'Conversas' + (conversas.length ? ' (' + conversas.length + ')' : '') + '</button>' +
      '<span class="chat-title"><b>' + esc(atual && !S.aiPending ? atual.titulo : (S.aiPending && !atual ? 'Nova conversa' : (atual ? atual.titulo : 'Nova conversa'))) + '</b><span class="sub">Respostas da OpenAI com base nos seus dados. Confira antes de decidir algo grande.</span></span><span class="chat-tools">' +
      '<button type="button" class="link" data-act="ai-edit" data-v="1">Chave e modelo</button></span></div>' +
      '<div class="chat-log" id="chat-log" aria-live="polite">' + (msgs.length ? bubbles : empty) + '</div>' +
      msg('ai') +
      '<form data-form="ai" class="chat-input"><textarea id="aiq" name="q" rows="1" placeholder="Pergunte sobre o seu dinheiro..." aria-label="Sua pergunta"' + (S.aiBusy ? ' disabled' : '') + '>' + esc(S.aiDraft || '') + '</textarea>' +
      '<button class="btn primary" type="submit" aria-label="Enviar"' + (S.aiBusy ? ' disabled' : '') + '>' + icon('send', 16, 1.8) + '</button></form></section></div>';
  }

  async function sendAi(text) {
    text = String(text || '').trim();
    if (!text || S.aiBusy) return;
    S.aiBusy = true; S.aiPending = text; S.aiDraft = ''; S.msg.ai = null;
    render();
    let res;
    try { res = await api.aiSend({ text, conversa: S.m && S.m.ai ? S.m.ai.atual : null }); } catch (e) { res = { ok: false, message: 'Não consegui falar com o servidor. Tente de novo.' }; }
    S.aiBusy = false; S.aiPending = null;
    if (!res || !res.ok) { S.aiDraft = text; S.msg.ai = { ok: false, text: (res && res.message) || 'Não deu certo.' }; }
    await load();
  }

  // ---------- Boas-vindas ----------
  function screenWelcome() {
    return '<div class="welcome"><section class="panel"><div class="head"><div><h1>Seu dinheiro, atualizado sozinho</h1><span class="sub" style="font-size:15px;max-width:60ch">O Meu Cofrin busca suas compras, faturas e saldos pelo Open Finance, sem você digitar nada. ' + (S.m && S.m.sync && S.m.sync.web ? 'Tudo fica na sua conta, protegido por login.' : 'Tudo fica guardado só neste computador.') + '</span></div>' + ill.wallet + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px"><button type="button" class="btn primary" data-act="nav" data-v="bancos">Conectar meus bancos</button><button type="button" class="btn" data-act="demo-start">Ver com dados de exemplo</button></div></section></div>';
  }

  // ---------- Janelas de edição ----------
  const BILL_ICONS = [['moradia', 'Moradia'], ['luz', 'Luz'], ['agua', 'Água'], ['internet', 'Internet'], ['celular', 'Celular'], ['academia', 'Academia'], ['saude', 'Saúde'], ['educacao', 'Educação'], ['assinaturas', 'Assinatura'], ['transporte', 'Transporte'], ['contas', 'Outra conta']];

  function dialog(m) {
    const d = S.dialog;
    if (!d) return '';
    let body = '';
    if (d.type === 'bill') {
      const b = d.id ? m.settings.bills.find((x) => x.id === d.id) || {} : (d.prefill || {});
      const fq = b.freq || d.freq || 'mensal';
      body = '<h2 class="h2" id="dlg-t">' + (fq === 'unica' ? (d.id ? 'Editar conta a pagar' : 'Nova conta a pagar') : (d.id ? 'Editar despesa fixa' : 'Nova despesa fixa')) + '</h2>' + (d.prefill ? '<span class="sub">Preenchi a partir de “' + esc(d.prefill.origem) + '”. Confira e salve.</span>' : '') +
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
    } else if (d.type === 'meta') {
      const g = d.id ? (m.settings.metas || []).find((x) => x.id === d.id) || {} : {};
      const contas = m.settings.reserveOptions || [];
      const fixasMeta = (m.settings.bills || []).filter((b) => b.freq !== 'unica');
      const fonteAtual = g.billId ? 'bill:' + g.billId : (g.contaId || '');
      const hoje = new Date();
      const mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
      body = '<h2 class="h2" id="dlg-t">' + (d.id ? 'Editar meta' : 'Nova meta') + '</h2>' +
        '<form data-form="meta" class="form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><input type="hidden" name="id" value="' + esc(g.id || '') + '">' +
        '<div class="field"><label for="gn">Nome</label><input id="gn" name="nome" required value="' + esc(g.nome || '') + '" placeholder="Apartamento"></div>' +
        '<div class="field"><label for="gv">Valor da meta</label><input id="gv" name="valor" inputmode="decimal" required value="' + (g.valor ? moneyRaw(g.valor) : '') + '" placeholder="60.000,00"></div>' +
        '<div class="field"><label for="gp">Até quando (opcional)</label><input id="gp" name="prazo" type="month" value="' + esc(g.prazo || '') + '"><small>Com prazo, o app diz quanto guardar por mês.</small></div>' +
        '<div class="field" style="grid-column:1/-1"><label for="gc">Como a meta anda</label><select id="gc" name="fonte"><option value="">Eu digo quanto já tenho</option>' +
          (contas.length ? '<optgroup label="Saldo de uma conta">' + contas.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === g.contaId ? ' selected' : '') + '>Saldo da conta ' + esc(c.nome) + '</option>').join('') + '</optgroup>' : '') +
          (fixasMeta.length ? '<optgroup label="Somando as parcelas de uma despesa fixa">' + fixasMeta.map((b) => '<option value="bill:' + esc(b.id) + '"' + (b.id === g.billId ? ' selected' : '') + '>Parcelas de ' + esc(b.nome) + ' (' + brl(b.valor) + ')</option>').join('') + '</optgroup>' : '') +
          '</select><small id="gc-help">' + metaFonteHelp(fonteAtual) + '</small></div>' +
        '<div class="field" id="wrap-guardado"' + (g.contaId ? ' hidden' : '') + '><label for="gg" id="gg-label">' + (g.billId ? 'Quanto já tinha pago antes' : 'Quanto já tem guardado') + '</label><input id="gg" name="guardado" inputmode="decimal" value="' + (g.guardado ? moneyRaw(g.guardado) : '') + '" placeholder="0,00"></div>' +
        '<div class="field" id="wrap-desde"' + (g.billId ? '' : ' hidden') + '><label for="gd">Contar parcelas a partir de</label><input id="gd" name="desde" type="month" value="' + esc(g.desde || mesAtual) + '"><small>As parcelas desse mês em diante que aparecerem no extrato somam na meta.</small></div>' +
        '<div class="field" id="wrap-extra" style="grid-column:1/-1"' + (g.billId ? '' : ' hidden') + '><label for="gx">Dinheiro extra guardado em (opcional)</label><select id="gx" name="contaExtra"><option value="">Em nenhuma conta separada</option>' + contas.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === g.contaExtra ? ' selected' : '') + '>Somar o saldo da conta ' + esc(c.nome) + '</option>').join('') + '</select><small>Se você junta o que falta numa conta só para isso, o saldo dela soma na meta junto com as parcelas.</small></div>' +
        '<div class="actions" style="grid-column:1/-1">' + (d.id ? '<button type="button" class="btn danger" data-act="meta-remove" data-v="' + esc(g.id) + '">Apagar</button>' : '') + '<button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>' + msg('dlg');
    } else if (d.type === 'lembrete') {
      body = '<h2 class="h2" id="dlg-t">Novo lembrete</h2>' +
        '<form data-form="lembrete" class="form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">' +
        '<div class="field" style="grid-column:1/-1"><label for="lt">Lembrar de</label><input id="lt" name="texto" required maxlength="200" placeholder="Cancelar o Crunchyroll"></div>' +
        '<div class="field"><label for="ld">Quando (opcional)</label><input id="ld" name="data" type="date"><small>Na data, ele aparece no sininho.</small></div>' +
        '<div class="actions" style="grid-column:1/-1"><button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>' + msg('dlg');
    } else if (d.type === 'limites') {
      const cur = m.settings.limites || {};
      const gastos = {};
      for (const c of m.categorias) gastos[c.cat] = c.valor;
      const cats = m.cats.filter((c) => !['renda', 'reserva', 'pix'].includes(c.id));
      body = '<h2 class="h2" id="dlg-t">Limites por mês</h2><span class="sub">Deixe em branco a categoria que não quer limitar. Ao lado, quanto já foi este mês.</span>' +
        '<form data-form="limites" class="lim-form">' + cats.map((c) => '<label class="lim-row">' + tile(c.id, true) + '<span class="grow"><b>' + esc(c.label) + '</b><small>' + (gastos[c.id] ? brl(gastos[c.id]) + ' este mês' : 'nada este mês') + '</small></span><input name="' + esc(c.id) + '" inputmode="decimal" placeholder="sem limite" value="' + (cur[c.id] ? moneyRaw(cur[c.id]) : '') + '" aria-label="Limite para ' + esc(c.label) + '"></label>').join('') +
        '<div class="actions"><button type="button" class="btn" data-act="dlg-close">Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>' + msg('dlg');
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
    else if (S.screen === 'bancos') {
      content = topBar(m) + screenBancos(m);
      if (S.pushInfo === undefined && api.pushState) { S.pushInfo = null; api.pushState().then((x) => { S.pushInfo = x; render(); }).catch(() => { S.pushInfo = { supported: false }; render(); }); }
    }
    else if (S.screen === 'ia') content = topBar(m) + screenIA(m);
    else content = topBar(m) + screenVisao(m);
    root.innerHTML = '<div class="app">' + sidebar(m) + '<main class="main">' + content + '</main></div>' + dialog(m);
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); if (caret !== null && el.setSelectionRange) el.setSelectionRange(caret, caret); }
    }
    if (S.screen === 'ia') {
      const log = document.getElementById('chat-log');
      if (log) log.scrollTop = log.scrollHeight;
      const q = document.getElementById('aiq');
      if (q && !S.aiBusy && !focusId && window.matchMedia('(min-width: 761px)').matches) q.focus();
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
    // Ctrl/Cmd/Shift + clique num link abre em outra aba, como num site normal.
    if (el && el.tagName === 'A' && (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) return;
    if (el && el.tagName === 'A') e.preventDefault();
    if (!el) { if ((S.menu || S.notif) && !e.target.closest('.menu')) { S.menu = false; S.notif = null; render(); } return; }
    const act = el.dataset.act;
    const v = el.dataset.v;
    if (act !== 'menu' && S.menu) S.menu = false;
    if (S.notif && !['notif', 'notif-open', 'notif-all', 'hide'].includes(act)) S.notif = null;
    switch (act) {
      case 'nav': goScreen(v); break;
      case 'month': S.month = v || null; S.day = null; await load(); break;
      case 'menu': S.menu = !S.menu; S.notif = null; render(); break;
      case 'notif':
        if (S.notif) { S.notif = null; render(); break; }
        S.menu = false;
        S.notif = { list: (S.m.avisos || []).slice() };
        render();
        if (S.m.novas && api.notifSeen) { api.notifSeen().then(() => load()).catch(() => {}); }
        break;
      case 'notif-all': S.notif = null; S.screen = 'lanc'; S.cat = null; S.q = ''; S.filtro = 'todos'; S.month = null; window.scrollTo(0, 0); await load(); break;
      case 'notif-open': {
        const a = ((S.notif && S.notif.list) || []).find((x) => x.id === v);
        S.notif = null;
        if (a && a.tipo === 'conta') { S.screen = 'contas'; S.month = null; }
        else if (a && a.tipo === 'limite') { S.screen = 'lanc'; S.cat = a.cat; S.filtro = 'todos'; S.q = ''; S.month = null; }
        else if (a && a.tipo === 'resumo') { S.screen = 'visao'; S.month = a.mes; }
        else if (a && a.tipo === 'lembrete') { S.screen = 'visao'; S.month = null; }
        else if (a && a.tipo === 'alerta') { S.screen = 'lanc'; S.cat = null; S.filtro = 'todos'; S.q = a.titulo.replace(/^Cobrança repetida\? /, '').replace(/ (veio alto|ficou mais cara)$/, ''); S.month = null; }
        else if (a) { S.screen = 'lanc'; S.cat = null; S.filtro = 'todos'; S.q = a.titulo.replace(/, \d+ de \d+$/, ''); S.month = null; }
        window.scrollTo(0, 0); await load(); break;
      }
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
        await load();
        if (res && res.ok) {
          const em = S.m && S.m.sync.bancosEm ? ' Os bancos mandaram dados ' + when(S.m.sync.bancosEm) + '.' : '';
          toast((res.novas ? res.novas + (res.novas === 1 ? ' lançamento novo.' : ' lançamentos novos.') : 'Conferi agora: nada novo.') + em);
        }
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
      case 'filtro': S.filtro = v; saveLanc(); render(); break;
      case 'dlg-bill': S.dialog = { type: 'bill', id: v || null, freq: el.dataset.freq || null }; S.msg.dlg = null; render(); break;
      case 'dlg-manual': S.dialog = { type: 'manual', id: v || null }; S.msg.dlg = null; render(); break;
      case 'dlg-credit': S.dialog = { type: 'credit', id: v || null }; S.msg.dlg = null; render(); break;
      case 'cat-open': S.cat = v; S.filtro = 'todos'; S.q = ''; S.screen = 'lanc'; saveLanc(); try { history.replaceState(null, '', '#lanc'); } catch (err) { /* sem histórico */ } window.scrollTo(0, 0); render(); break;
      case 'cat-clear': S.cat = null; saveLanc(); render(); break;
      case 'dlg-meta': S.dialog = { type: 'meta', id: v || null }; S.msg.dlg = null; render(); break;
      case 'fixar': {
        const r = await api.toggleFixado({ termo: v, nome: el.dataset.nome });
        if (r && r.ok) toast(r.fixado ? 'Fixado no topo de Lançamentos.' : 'Desafixado.');
        if (r && !r.fixado && S.termo === v) S.termo = null;
        await load(); break;
      }
      case 'fixado-ver': S.termo = S.termo === v ? null : v; S.month = S.termo ? S.month : S.month; render(); break;
      case 'dlg-lembrete': S.dialog = { type: 'lembrete' }; S.msg.dlg = null; render(); break;
      case 'lembrete-done': el.disabled = true; await api.doneLembrete(v); toast('Lembrete concluído.'); await load(); break;
      case 'dlg-limites': S.dialog = { type: 'limites' }; S.msg.dlg = null; render(); break;
      case 'meta-remove': {
        const g = (S.m.settings.metas || []).find((x) => x.id === v);
        S.dialog = { type: 'confirm', title: 'Apagar a meta ' + (g ? g.nome : '') + '?', text: 'Só a meta some. Seu dinheiro e seus lançamentos continuam iguais.', yes: 'Apagar', run: () => api.removeMeta(v) };
        render(); break;
      }
      case 'csv': {
        const rows = S.lancRows || [];
        const ano = S.m.month.ano;
        const cell = (x) => { const v = String(x === null || x === undefined ? '' : x); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
        const num = (v) => (v < 0 ? '-' : '') + moneyRaw(v);
        const lines = [['Data', 'Descrição', 'Categoria', 'Conta ou cartão', 'Valor', 'Tipo'].join(';')].concat(rows.map((t) => [t.data + '/' + ano, t.nome, t.catLabel, t.conta, num(t.valor), t.tag || (t.valor > 0 ? 'Entrada' : 'Gasto')].map(cell).join(';')));
        const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'lancamentos-' + S.m.month.key + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        toast('Planilha baixada: ' + rows.length + ' lançamentos. Abre no Excel e no Google Planilhas.');
        break;
      }
      case 'push-on': {
        el.disabled = true; S.msg.push = { ok: true, text: 'Ativando...' }; render();
        let r;
        try { r = await api.pushEnable(); } catch (err) { r = { ok: false, message: 'Não deu para ativar: ' + err.message }; }
        S.msg.push = r && r.ok ? { ok: true, text: 'Pronto! Mandei uma notificação de teste.' } : { ok: false, text: (r && r.message) || 'Não deu certo.' };
        S.pushInfo = await api.pushState();
        await load();
        if (r && r.ok) api.pushTest().catch(() => {});
        break;
      }
      case 'push-test': {
        el.disabled = true;
        const r = await api.pushTest();
        S.msg.push = r && r.ok ? { ok: true, text: 'Teste enviado. Deve chegar em alguns segundos.' } : { ok: false, text: (r && r.message) || 'Não deu certo.' };
        await load(); break;
      }
      case 'push-off': {
        await api.pushDisable(v);
        S.pushInfo = await api.pushState();
        S.msg.push = { ok: true, text: 'Esse aparelho não recebe mais avisos.' };
        await load(); break;
      }
      case 'tema':
        try { localStorage.setItem('meucaixa-tema', v); } catch (err) { /* sem armazenamento */ }
        S.tema = applyTheme(); render(); break;
      case 'parc-mes': S.parcMes = S.parcMes === v ? null : v; render(); break;
      case 'ass-fixa': {
        const x = (S.m.assinaturas || [])[Number(v)];
        if (!x) break;
        const iconOk = BILL_ICONS.some(([k]) => k === x.cat) ? x.cat : 'assinaturas';
        S.dialog = { type: 'bill', id: null, freq: 'mensal', prefill: { origem: x.nome, busca: x.termo, nome: x.nome, valor: x.valor, dia: x.dia, icon: iconOk, pagamento: /crédito$/.test(x.conta) ? 'cartao' : 'conta', freq: 'mensal' } };
        S.msg.dlg = null; render(); break;
      }
      case 'tx-fixa': {
        const t = S.m.lancamentos.find((x) => x.id === v);
        if (!t) break;
        const ben = (S.m.beneficiarios || []).find((b) => b.termo === t.termo) || {};
        const iconOk = BILL_ICONS.some(([k]) => k === t.cat) ? t.cat : 'contas';
        S.dialog = { type: 'bill', id: null, freq: ben.semanal ? 'semanal' : 'mensal', prefill: {
          origem: t.nome, busca: t.termo || '', nome: ben.nomeLimpo || t.nome, valor: Math.abs(t.valor),
          dia: Number(String(t.data).split('/')[0]) || '', diaSemana: ben.diaSemana, icon: iconOk,
          pagamento: /crédito$/.test(t.conta) ? 'cartao' : 'conta', freq: ben.semanal ? 'semanal' : 'mensal'
        } };
        S.msg.dlg = null; render(); break;
      }
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
        S.dialog = { type: 'confirm', title: 'Remover esse banco?', text: 'O banco para de atualizar e sai dos saldos, mas os lançamentos antigos dele continuam guardados no histórico. Se conectar de novo, nada fica repetido.', yes: 'Remover', run: () => api.removeItem(v) };
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
      case 'ai-suggest': sendAi(v); break;
      case 'ai-edit': S.editAi = v === '1'; S.msg.aikey = null; render(); break;
      case 'ai-clear': S.aiList = false; S.aiDraft = ''; await api.aiClear(); S.msg.ai = null; await load(); break;
      case 'ai-list': S.aiList = !S.aiList; render(); break;
      case 'ai-open': S.aiList = false; S.msg.ai = null; if (S.m.ai.atual !== v) { S.m.ai.atual = v; await api.aiOpen(v); await load(); } else render(); break;
      case 'ai-delete': {
        const c = (S.m.ai.conversas || []).find((x) => x.id === v);
        S.dialog = { type: 'confirm', title: 'Apagar esta conversa?', text: '“' + (c ? c.titulo : '') + '” some para sempre.', yes: 'Apagar', run: () => api.aiDelete(v) };
        render(); break;
      }
      case 'tema-toggle': {
        const next = document.documentElement.classList.contains('dark') ? 'claro' : 'escuro';
        try { localStorage.setItem('meucaixa-tema', next); } catch (err) { /* sem armazenamento */ }
        S.tema = applyTheme(); render(); break;
      }
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
    } else if (kind === 'meta') {
      const res = await api.saveMeta(data);
      if (res.ok) { S.dialog = null; toast('Meta salva.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    } else if (kind === 'lembrete') {
      const res = await api.saveLembrete(data);
      if (res.ok) { S.dialog = null; toast('Lembrete salvo.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    } else if (kind === 'limites') {
      const res = await api.saveLimites(data);
      if (res.ok) { S.dialog = null; toast('Limites salvos.'); await load(); }
      else { S.msg.dlg = { ok: false, text: res.message }; render(); }
    } else if (kind === 'ai') {
      sendAi(data.q);
    } else if (kind === 'aikey') {
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Testando...';
      const res = await run(api.aiKey({ key: data.key, model: data.model }), 'aikey', null);
      if (res && res.ok) { S.editAi = false; S.msg.aikey = null; render(); }
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
    if (e.target.id === 'aiq') { S.aiDraft = e.target.value; e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }
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
    if (e.target.id === 'gc') {
      const v = e.target.value;
      const isBill = v.startsWith('bill:');
      const w = document.getElementById('wrap-guardado'); if (w) w.hidden = !!v && !isBill;
      const wd = document.getElementById('wrap-desde'); if (wd) wd.hidden = !isBill;
      const wx = document.getElementById('wrap-extra'); if (wx) wx.hidden = !isBill;
      const l = document.getElementById('gg-label'); if (l) l.textContent = isBill ? 'Quanto já tinha pago antes' : 'Quanto já tem guardado';
      const hp = document.getElementById('gc-help'); if (hp) hp.textContent = metaFonteHelp(v);
      return;
    }
    if (e.target.dataset && e.target.dataset.pushpref) {
      const patch = {}; patch[e.target.dataset.pushpref] = e.target.checked;
      await api.pushPrefs(patch); await load(); return;
    }
    if (e.target.dataset && e.target.dataset.feature) {
      const patch = {}; patch[e.target.dataset.feature] = e.target.checked;
      await api.saveFeatures(patch); await load(); return;
    }
    if (e.target.id === 'lanc-cat') { S.cat = e.target.value || null; saveLanc(); render(); return; }
    if (e.target.id === 'lanc-ordem') { S.ordem = e.target.value; saveLanc(); render(); return; }
    const sel = e.target.closest('select.cat-select');
    if (sel) {
      const t = S.m.lancamentos.find((x) => x.id === sel.dataset.tx);
      S.dialog = { type: 'cat', id: sel.dataset.tx, cat: sel.value, nome: t ? t.nome : '', termo: t ? t.termo : '' };
      S.msg.dlg = null;
      render();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.id === 'aiq' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendAi(e.target.value); return; }
    if (e.key === 'Escape' && (S.dialog || S.menu || S.notif)) { S.dialog = null; S.menu = false; S.notif = null; render(); }
  });

  api.onChange(async (data) => {
    S.syncing = !!data.syncing;
    S.progress = data.progress || null;
    if (data.progress) { render(); return; }
    await load();
  });

  load();
})();
