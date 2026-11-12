'use strict';
// Ícones e ilustrações em SVG (desenhados à mão, sem imagens externas).
window.ART = (function () {
  const P = {
    grid: 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z',
    list: 'M3 4h10M3 8h10M3 12h6',
    card: 'M1.5 4h13v8.5h-13zM1.5 7h13M4 10.5h3',
    calendar: 'M2 3.5h12v10.5H2zM2 7h12M5.5 1.5v3M10.5 1.5v3',
    bank: 'M2 6l6-3.5L14 6M3.5 6.5v5M6.5 6.5v5M9.5 6.5v5M12.5 6.5v5M2 13.5h12',
    sync: 'M13.5 6.5A5.5 5.5 0 0 0 3.2 4.5M2.5 9.5a5.5 5.5 0 0 0 10.3 2M3 1.5v3h3M13 14.5v-3h-3',
    bell: 'M4 11.5V7a4 4 0 0 1 8 0v4.5l1.5 1.5h-11zM6.5 14.5h3',
    plus: 'M8 3v10M3 8h10',
    left: 'M10 3L5 8l5 5',
    right: 'M6 3l5 5-5 5',
    down: 'M4 6l4 4 4-4',
    check: 'M3 8.5l3 3 7-7',
    up: 'M4 12L12 4M6 4h6v6',
    trend: 'M2 12l4-4 3 3 5-6M10 5h4v4',
    target: 'M8 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
    pencil: 'M10.5 2.5l3 3L6 13H3v-3zM9 4l3 3',
    trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9',
    alert: 'M8 2l6.5 11.5h-13zM8 6.5v3M8 11.5h.01',
    hand: 'M5 8V3.5a1 1 0 0 1 2 0V7M7 7V2.5a1 1 0 0 1 2 0V7M9 7V3.5a1 1 0 0 1 2 0V8M11 8V5.5a1 1 0 0 1 2 0V10a4.5 4.5 0 0 1-4.5 4.5H8A4 4 0 0 1 4.6 12.6L2.5 9.3a1 1 0 0 1 1.6-1.2L5 9',
    eye: 'M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    eyeoff: 'M2 2l12 12M6.6 6.6a2 2 0 0 0 2.8 2.8M4.2 4.4C2.5 5.6 1.5 8 1.5 8s2.4 4.5 6.5 4.5c1.4 0 2.6-.5 3.6-1.2M7 3.6c.3 0 .7-.1 1-.1 4.1 0 6.5 4.5 6.5 4.5s-.6 1.1-1.6 2.3',
    link: 'M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1',
    // Categorias
    mercado: 'M1.5 2h2l1.6 8h7.4l1.5-5.5H4.3M6 13.5a1 1 0 1 0 .01 0M12 13.5a1 1 0 1 0 .01 0',
    compras: 'M3 5h10l-.8 9H3.8zM5.5 5V4a2.5 2.5 0 0 1 5 0v1',
    restaurantes: 'M4 1.5v5a1.5 1.5 0 0 0 3 0v-5M5.5 1.5v13M11 1.5c-1.5 1-2 3-2 5h2v8',
    transporte: 'M2.5 10.5V8l1.5-4h8l1.5 4v2.5zM4.5 13v-2.5M11.5 13v-2.5M2.5 8h11',
    saude: 'M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4.5a3 3 0 0 1 6 1.3C14 10 8 13.5 8 13.5z',
    assinaturas: 'M3 3.5h10a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 11V5A1.5 1.5 0 0 1 3 3.5zM6.5 6v4l3.5-2z',
    renda: 'M8 2v8M5 7l3 3 3-3M2.5 11v2.5h11V11',
    moradia: 'M2 7.5L8 2.5l6 5M3.5 6.5v7h9v-7M6.5 13.5v-4h3v4',
    reserva: 'M8 2l5 2.2v3.6c0 3-2.1 5.2-5 6.2-2.9-1-5-3.2-5-6.2V4.2z',
    pix: 'M3 5.5h9.5L10 3M13 10.5H3.5L6 13',
    luz: 'M9 1.5L3.5 9h4l-1 5.5L12 7H8z',
    agua: 'M8 2c2.5 3.2 4.5 5.6 4.5 8a4.5 4.5 0 0 1-9 0C3.5 7.6 5.5 5.2 8 2z',
    internet: 'M2 6.5a9 9 0 0 1 12 0M4 9a5.5 5.5 0 0 1 8 0M6.5 11.5a2 2 0 0 1 3 0M8 13.5h.01',
    celular: 'M5 1.5h6a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM7 12h2',
    academia: 'M2 6v4M4 4.5v7M12 4.5v7M14 6v4M4 8h8',
    contas: 'M4 1.5h8v13l-2-1.2-2 1.2-2-1.2-2 1.2zM6 5h4M6 8h4',
    lazer: 'M2.5 5.5h11v2a1.5 1.5 0 0 0 0 3v2h-11v-2a1.5 1.5 0 0 0 0-3zM9.5 5.5v7',
    educacao: 'M1.5 6L8 3l6.5 3L8 9zM4 7.2v3.3c1.2 1.3 2.5 2 4 2s2.8-.7 4-2V7.2',
    taxas: 'M3 13L13 3M4.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM11.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    fatura: 'M1.5 4h13v8.5h-13zM1.5 7h13M4 10.5h3',
    cartao: 'M1.5 4h13v8.5h-13zM1.5 7h13M4 10.5h3',
    outros: 'M4 8h.01M8 8h.01M12 8h.01'
  };

  const CAT = {
    mercado: { bg: '#dcfce7', fg: '#15803d', bar: '#22c55e' },
    compras: { bg: '#ede9fe', fg: '#6d28d9', bar: '#8b5cf6' },
    restaurantes: { bg: '#ffe4e6', fg: '#be123c', bar: '#f43f5e' },
    transporte: { bg: '#fef3c7', fg: '#b45309', bar: '#f59e0b' },
    saude: { bg: '#e0f2fe', fg: '#0369a1', bar: '#0ea5e9' },
    assinaturas: { bg: '#e0e7ff', fg: '#4338ca', bar: '#6366f1' },
    renda: { bg: '#dcfce7', fg: '#15803d', bar: '#22c55e' },
    moradia: { bg: '#dbeafe', fg: '#1d4ed8', bar: '#3b82f6' },
    reserva: { bg: '#fce7f3', fg: '#be185d', bar: '#ec4899' },
    pix: { bg: '#ccfbf1', fg: '#0f766e', bar: '#14b8a6' },
    contas: { bg: '#fef9c3', fg: '#a16207', bar: '#eab308' },
    luz: { bg: '#fef9c3', fg: '#a16207', bar: '#eab308' },
    agua: { bg: '#e0f2fe', fg: '#0369a1', bar: '#0ea5e9' },
    internet: { bg: '#e0f2fe', fg: '#0369a1', bar: '#0ea5e9' },
    celular: { bg: '#f1f5f9', fg: '#334155', bar: '#64748b' },
    academia: { bg: '#ffedd5', fg: '#c2410c', bar: '#f97316' },
    lazer: { bg: '#fae8ff', fg: '#a21caf', bar: '#d946ef' },
    educacao: { bg: '#e0e7ff', fg: '#3730a3', bar: '#6366f1' },
    taxas: { bg: '#fee2e2', fg: '#b91c1c', bar: '#ef4444' },
    fatura: { bg: '#ede9fe', fg: '#6d28d9', bar: '#8b5cf6' },
    cartao: { bg: '#ede9fe', fg: '#6d28d9', bar: '#8b5cf6' },
    outros: { bg: '#f1f5f9', fg: '#475569', bar: '#94a3b8' }
  };

  function icon(name, size, sw) {
    const d = P[name] || P.outros;
    return '<svg aria-hidden="true" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.6) + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"></path></svg>';
  }

  function tile(cat, small) {
    const c = CAT[cat] || CAT.outros;
    return '<span class="tile' + (small ? ' s' : '') + '" aria-hidden="true" style="background:' + c.bg + ';color:' + c.fg + '">' + icon(P[cat] ? cat : 'outros', small ? 16 : 18) + '</span>';
  }

  const ill = {
    wallet: '<svg class="ill" aria-hidden="true" width="108" height="90" viewBox="0 0 96 80"><defs><linearGradient id="wlBill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#16a34a"/></linearGradient><linearGradient id="wlBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><g transform="rotate(-14 46 24)"><rect x="20" y="8" width="54" height="30" rx="4" fill="url(#wlBill)"/><circle cx="47" cy="23" r="7" fill="none" stroke="#dcfce7" stroke-width="2"/></g><g transform="rotate(-4 52 26)"><rect x="26" y="12" width="54" height="30" rx="4" fill="#22c55e"/><circle cx="53" cy="27" r="7" fill="none" stroke="#bbf7d0" stroke-width="2"/></g><rect x="6" y="28" width="78" height="48" rx="11" fill="url(#wlBody)"/><rect x="6" y="28" width="78" height="10" rx="5" fill="#334155"/><rect x="56" y="42" width="34" height="22" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/><circle cx="67" cy="53" r="4.5" fill="#fbbf24"/></svg>',
    piggy: '<svg class="ill" aria-hidden="true" width="92" height="80" viewBox="0 0 88 76"><defs><radialGradient id="pigBody" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#fbcfe8"/><stop offset="1" stop-color="#ec4899"/></radialGradient><radialGradient id="pigCoin" cx="0.35" cy="0.35" r="0.75"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs><path d="M13 44c-6 0-7-7-1-7" stroke="#db2777" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="26" y="58" width="9" height="13" rx="3.5" fill="#db2777"/><rect x="52" y="58" width="9" height="13" rx="3.5" fill="#db2777"/><ellipse cx="44" cy="46" rx="31" ry="22" fill="url(#pigBody)"/><path d="M27 31l-3-11 13 7z" fill="#ec4899"/><ellipse cx="75" cy="47" rx="7" ry="8" fill="#f472b6"/><circle cx="73.5" cy="45" r="1.5" fill="#9d174d"/><circle cx="76.5" cy="49" r="1.5" fill="#9d174d"/><circle cx="61" cy="39" r="2.3" fill="#831843"/><rect x="36" y="26" width="17" height="4" rx="2" fill="#9d174d"/><circle cx="44.5" cy="12" r="10" fill="url(#pigCoin)" stroke="#d97706" stroke-width="2"/><text x="44.5" y="16" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-weight="700" font-size="11" fill="#92400e">R$</text></svg>',
    cards: '<svg class="ill" aria-hidden="true" width="96" height="72" viewBox="0 0 92 70"><defs><linearGradient id="ilCardA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c084fc"/><stop offset="1" stop-color="#7e22ce"/></linearGradient><linearGradient id="ilCardB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><g transform="rotate(-16 44 34)"><rect x="8" y="14" width="64" height="40" rx="7" fill="url(#ilCardA)"/></g><g transform="rotate(10 52 40)"><rect x="20" y="20" width="64" height="40" rx="7" fill="url(#ilCardB)"/><rect x="28" y="30" width="13" height="10" rx="2.5" fill="#fcd34d"/><rect x="28" y="48" width="30" height="3.5" rx="1.75" fill="#bfdbfe"/></g></svg>',
    calendar: '<svg class="ill" aria-hidden="true" width="88" height="80" viewBox="0 0 84 76"><defs><linearGradient id="calTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#2563eb"/></linearGradient><radialGradient id="calCoin" cx="0.35" cy="0.35" r="0.75"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs><rect x="16" y="8" width="64" height="62" rx="11" fill="#ffffff" stroke="#dbe3f0" stroke-width="2"/><path d="M16 19a11 11 0 0 1 11-11h42a11 11 0 0 1 11 11v8H16z" fill="url(#calTop)"/><rect x="30" y="2" width="6" height="14" rx="3" fill="#1e3a8a"/><rect x="60" y="2" width="6" height="14" rx="3" fill="#1e3a8a"/><rect x="26" y="34" width="9" height="7" rx="2" fill="#dbeafe"/><rect x="39" y="34" width="9" height="7" rx="2" fill="#dbeafe"/><rect x="52" y="34" width="9" height="7" rx="2" fill="#2563eb"/><rect x="65" y="34" width="9" height="7" rx="2" fill="#dbeafe"/><rect x="39" y="46" width="9" height="7" rx="2" fill="#dbeafe"/><rect x="52" y="46" width="9" height="7" rx="2" fill="#dbeafe"/><rect x="65" y="46" width="9" height="7" rx="2" fill="#fbcfe8"/><rect x="52" y="58" width="9" height="6" rx="2" fill="#dbeafe"/><rect x="65" y="58" width="9" height="6" rx="2" fill="#dbeafe"/><circle cx="18" cy="58" r="14" fill="url(#calCoin)" stroke="#d97706" stroke-width="2"/><text x="18" y="62.5" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-weight="700" font-size="12" fill="#92400e">R$</text></svg>',
    bag: '<svg class="ill" aria-hidden="true" width="80" height="80" viewBox="0 0 76 76"><defs><linearGradient id="bagBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c"/></linearGradient></defs><path d="M27 26v-7a11 11 0 0 1 22 0v7" stroke="#9a3412" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M12 26h52l-4 44H16z" fill="url(#bagBody)"/><path d="M12 26h52l-1 9H13z" fill="#fdba74"/><g transform="rotate(-18 56 52)"><path d="M44 46h18l5 6-5 6H44z" fill="#22c55e"/><circle cx="49" cy="52" r="2.2" fill="#ffffff"/></g></svg>',
    burger: '<svg class="ill" aria-hidden="true" width="88" height="74" viewBox="0 0 84 70"><defs><linearGradient id="bunTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><path d="M12 32a30 22 0 0 1 60 0z" fill="url(#bunTop)"/><ellipse cx="30" cy="20" rx="2.5" ry="1.5" fill="#fef3c7"/><ellipse cx="42" cy="15" rx="2.5" ry="1.5" fill="#fef3c7"/><ellipse cx="54" cy="21" rx="2.5" ry="1.5" fill="#fef3c7"/><ellipse cx="38" cy="25" rx="2.5" ry="1.5" fill="#fef3c7"/><path d="M10 33h64l-5 6-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4z" fill="#22c55e"/><rect x="9" y="38" width="66" height="4" rx="2" fill="#facc15"/><rect x="11" y="41" width="62" height="10" rx="5" fill="#7c2d12"/><path d="M12 53h60v3a9 9 0 0 1-9 9H21a9 9 0 0 1-9-9z" fill="url(#bunTop)"/></svg>',
    lightning: '<svg class="ill" aria-hidden="true" width="80" height="76" viewBox="0 0 80 76"><defs><linearGradient id="pixG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect x="14" y="10" width="52" height="52" rx="14" transform="rotate(45 40 36)" fill="url(#pixG)"/><rect x="27" y="23" width="26" height="26" rx="7" transform="rotate(45 40 36)" fill="#ccfbf1"/><path d="M43 22l-9 15h7l-3 13 10-17h-7z" fill="#0f766e"/></svg>',
    logo: '<svg aria-hidden="true" width="38" height="38" viewBox="0 0 64 64"><defs><radialGradient id="lgB" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#ff9ccf"/><stop offset="1" stop-color="#e5368f"/></radialGradient><radialGradient id="lgC" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff3a3"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs><rect x="14" y="47" width="8" height="12" rx="3.5" fill="#c41f73"/><rect x="38" y="47" width="8" height="12" rx="3.5" fill="#c41f73"/><path d="M7 34c-5 0-6-6-1-6" stroke="#c41f73" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="31" cy="36" rx="25" ry="19" fill="url(#lgB)"/><path d="M17 22l-3-11 12 6z" fill="#e5368f"/><ellipse cx="55" cy="37" rx="7" ry="8" fill="#ff7ab8" stroke="#c41f73" stroke-width="1.5"/><circle cx="53.5" cy="35" r="1.6" fill="#8a1050"/><circle cx="56.5" cy="39.5" r="1.6" fill="#8a1050"/><circle cx="44" cy="29" r="2.6" fill="#4a0a2c"/><rect x="23" y="17.5" width="15" height="4" rx="2" fill="#8a1050"/><circle cx="30.5" cy="10" r="8.5" fill="url(#lgC)" stroke="#b45309" stroke-width="2"/><rect x="29" y="5.5" width="3" height="9" rx="1.5" fill="#b45309"/></svg>',
    chip: '<svg aria-hidden="true" width="42" height="32" viewBox="0 0 42 32"><rect x="0.75" y="0.75" width="40.5" height="30.5" rx="7" fill="#e7e5e4" stroke="#a8a29e" stroke-width="1.5"/><path d="M0.75 11h13M0.75 21h13M28.25 11h13M28.25 21h13M13.75 0.75v30.5M28.25 0.75v30.5M13.75 16h14.5" stroke="#a8a29e" stroke-width="1.5" fill="none"/></svg>',
    wave: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"><path d="M6 6.5c1.5 2 1.5 5 0 7M9.5 4.5c2.3 3.2 2.3 7.8 0 11M13 2.5c3.2 4.5 3.2 10.5 0 15"/></svg>'
  };

  return { P, CAT, icon, tile, ill };
})();
