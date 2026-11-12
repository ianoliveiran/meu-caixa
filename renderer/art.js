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
    chat: 'M2.5 4.5A2 2 0 0 1 4.5 2.5h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7.5L4.5 14v-2.5a2 2 0 0 1-2-2zM5.5 6.5h5M5.5 8.5h3',
    send: 'M2.5 8L13.5 2.5 10.5 13.5 7.5 9zM7.5 9l6-6.5',
    moon: 'M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z',
    sun: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1',
    pin: 'M9.5 2.5l4 4-2 1-2.5 2.5.5 3-1.5 1.5-2.5-2.5L2.5 15M5.5 9.5L3 7l1.5-1.5 3 .5L10 3.5z',
    close: 'M4 4l8 8M12 4l-8 8',
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

/* Bank asset collection: https://github.com/rzmt/logos-bancos-br
MIT License

Copyright (c) 2026 Rafael Matos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Local brand artwork: Simple Icons (CC0) and logos-bancos-br (bank source SVGs).
// Brand names and logos belong to their respective owners. No runtime image requests.
(function () {
  const entries = [
  {
    "key": "ifood",
    "name": "iFood",
    "sigla": "iF",
    "cor": "#ea1d2c",
    "fg": "#ffffff",
    "pattern": "ifood|\\bifd\\b|ifd\\*",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+aUZvb2Q8L3RpdGxlPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik04LjQyOCAxLjY3Yy00LjY1IDAtNy4xODQgNC4xNDktNy4xODQgNi45OTggMCAyLjI5NCAyLjIgMy4yOTkgNC4yNSAzLjI5OWwtLjAwNi0uMDA2YzQuMjQ0IDAgNy4xODQtMy44NTQgNy4xODQtNi45OTggMC0yLjI5LTIuMTc1LTMuMjkzLTQuMjQ0LTMuMjkzem0xMS4zMjggMGMtNC42NSAwLTcuMTg0IDQuMTQ5LTcuMTg0IDYuOTk4IDAgMi4yOTQgMi4yIDMuMjk5IDQuMjUgMy4yOTlsLS4wMDYtLjAwNkMyMS4wNjEgMTEuOTYgMjQgOC4xMDcgMjQgNC45NjNjMC0yLjI5LTIuMTgtMy4yOTMtNC4yNDQtMy4yOTN6TTE0LjE3MiAxNC41MmwyLjQzNSAxLjgzNGMtMi4xNyAyLjA3LTYuMTI0IDMuNTI1LTkuMzUzIDMuMTdBOC45MTMgOC45MTMgMCAwMS4yMyAxNC41NDFIMGE5LjU5OCA5LjU5OCAwIDAwOC44MjggNy43NThjMy44MTQuMjQgNy4zMjMtLjkwNSA5Ljk0Ny0zLjEzbC0uMDA0LjAwNyAxLjA4IDIuOTg4IDEuNTU1LTcuNjIzLTcuMjM0LS4wMloiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "nubank",
    "name": "Nubank",
    "sigla": "NU",
    "cor": "#820ad1",
    "fg": "#ffffff",
    "pattern": "nubank|nu pagamentos",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TnViYW5rPC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNNy4yNzk1IDUuNDMzNmMtMS4xODE1IDAtMi4xODQ2LjQ2MjgtMi45NDMyIDEuMjUyaC0uMDAyYy0uMDU0MS0uMDAyMi0uMTA3NC0uMDAyLS4xNjItLjAwMi0xLjU0MzYgMC0yLjk5MjUuODgzNS0zLjY5OSAyLjI1NTktLjMwODguNTk5Ni0uNDIzNCAxLjI0NDItLjQ1OSAxLjkwMDMtLjAzMjEuNTg5IDAgMS4xODYzIDAgMS43Njk2djUuNjUyM0gzLjE4NHMuMDAyMi0yLjc4NCAwLTUuMTc3N2MtLjAwMTQtMS42MTEyLS4wMTE4LTMuMDQ3MSAwLTMuMzQxOC4wNTYtMS4zOTM3LjQzNzItMi4zMDUzIDEuMTQ4NC0zLjA1MDggMi4zNTg1LjAwMTggMy44ODUyIDEuNjA5MSAzLjk3MDUgNC4xNjguMDE5Ni41ODc0LjAyNTQgMy43MzA0LjAyNTQgMy43MzA0djMuNjcyaDMuMTY3OHYtNC45NjVjMC0xLjUwMDcuMDEyNy0yLjgwMDYtLjA5MTgtMy42OTUyLS4yOTItMi41LTEuODIxLTQuMTY4LTQuMTI0OC00LjE2OHptOC4zOTAzLjMwMDhsLTMuMTY2LjAwMzl2NC45NjQ4YzAgMS41MDA5LS4wMTI3IDIuODAwNy4wOTE5IDMuNjk1My4yOTIxIDIuNTAwMSAxLjgyMSA0LjE2OCA0LjEyNDggNC4xNjggMS4xODE1IDAgMi4xODQ2LS40NjI4IDIuOTQzMi0xLjI1Mi4wMDAzLS4wMDAzLjAwMTYuMDAwNC4wMDIgMCAuMDU0Mi4wMDIzLjEwOTMuMDAyLjE2NC4wMDIgMS41NDM1IDAgMi45OTA1LS44ODM1IDMuNjk3MS0yLjI1NTguMzA4OC0uNTk5Ny40MjMzLTEuMjQ0Mi40NTktMS45MDA0LjAzMi0uNTg4OSAwLTEuMTg2MiAwLTEuNzY5NVY1LjczODNIMjAuODE2cy0uMDAyMiAyLjc4NCAwIDUuMTc3N2MuMDAxNSAxLjYxMTMuMDExOSAzLjA0NyAwIDMuMzQxOC0uMDU2IDEuMzkzNS0uNDM3MiAyLjMwNTMtMS4xNDgzIDMuMDUwOC0yLjM1ODYtLjAwMTgtMy44ODUzLTEuNjA5MS0zLjk3MDYtNC4xNjgtLjAxOTYtLjU4NzQtLjAyNzMtMi4wNDM3LS4wMjczLTMuNzMyNFoiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "itau",
    "name": "Itaú",
    "sigla": "IT",
    "cor": "#1d3f91",
    "fg": "#ffffff",
    "pattern": "itau",
    "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iOTAgOTAgMzMyIDMzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzI1MjgzXzEwNDgpIj4KPHBhdGggZD0iTTEzMy4xMDMgNDEwLjMwMkMxMTQuNjc5IDQwNi4yOTggMTA1LjA2MSAzOTUuMjQxIDEwMS42OTggMzc4Ljg5N0M5NC44MDE5IDM1MC4yMTQgOTAgMzA0LjM4OSA5MCAyNTZDOTAgMjA3LjYxMSA5NC44MDE5IDE2MS43ODYgMTAxLjY5OCAxMzMuMTAzQzEwNS4wNjEgMTE2LjYwMyAxMTQuNjc5IDEwNS43MDIgMTMzLjEwMyAxMDEuNTQyQzE2My4wNjggOTQuMTYwNyAyMDcuNDU0IDkwIDI1NiA5MEMzMDQuNTQ2IDkwIDM0OC45MzEgOTQuMTYwNyAzNzguODk3IDEwMS41NDJDMzk3LjMyMSAxMDUuNzAyIDQwNi45MzkgMTE2LjYwMyA0MTAuMzAyIDEzMy4xMDNDNDE3LjE5OCAxNjEuNzg2IDQyMiAyMDcuNDU0IDQyMiAyNTZDNDIyIDMwNC41NDYgNDE3LjE5OCAzNTAuMjE0IDQxMC4zMDIgMzc4Ljg5N0M0MDYuOTM5IDM5NS4yNDEgMzk3LjMyMSA0MDYuMjk4IDM3OC44OTcgNDEwLjMwMkMzNDguOTMxIDQxNy44MzkgMzA0LjU0NiA0MjIgMjU2IDQyMkMyMDcuNDU0IDQyMiAxNjMuMDY4IDQxNy44MzkgMTMzLjEwMyA0MTAuMzAyWk0xMzguODc0IDI1OC43MjJDMTQ3LjM2NiAyNTguNzIyIDE1My4yOTQgMjUyLjk1MSAxNTMuMjk0IDI0NC43ODZDMTUzLjI5NCAyMzYuNjIxIDE0Ny4zNjYgMjMwLjg1MSAxMzguODc0IDIzMC44NTFDMTMwLjM4MSAyMzAuODUxIDEyNC40NTQgMjM2LjYyMSAxMjQuNDU0IDI0NC43ODZDMTI0LjQ1NCAyNTIuOTUxIDEzMC4zODEgMjU4LjcyMiAxMzguODc0IDI1OC43MjJaTTE1MS4wNTcgMzUwLjU0MlYyNjcuMzg1SDEyNi43MDVWMzUwLjU0MkgxNTEuMDU3Wk0xNzIuNTMgMjg2LjI5M1YzMjEuODU5QzE3Mi41MyAzNDIuMDQ5IDE4My4xMDIgMzUyLjEzOCAyMDEuODU0IDM1Mi4xMzhDMjA4LjU4IDM1Mi4xMzggMjE0LjE5NCAzNTEuMzQgMjE2LjkxNSAzNTAuNTI3VjMzMS45NDdDMjE1LjE0OCAzMzIuNDMxIDIxMS45NDIgMzMyLjkwMSAyMDguMjY2IDMzMi45MDFDMjAwLjQxNSAzMzIuOTAxIDE5Ni44OTUgMzI5LjA1NCAxOTYuODk1IDMyMC4yNDhWMjg2LjI3OUgyMTguMDQxVjI2Ny4zNzFIMTk2Ljg5NVYyNDIuMjA3TDE3Mi41NDQgMjQ2LjUyNFYyNjcuMzU2SDE2MC4zNzVWMjg2LjI2NUgxNzIuNTQ0TDE3Mi41MyAyODYuMjkzWk0yNTQuMjQ3IDM1Mi42MzZDMjY0LjAyMiAzNTIuNjM2IDI3MS4wNzUgMzQ4LjYzMiAyNzYuMDM0IDM0MS45MDdMMjc2LjM0NyAzNTAuNTU2SDI5OS4xMDNWMzAxLjY4MkMyOTkuMTAzIDI3Ny45NzIgMjg1LjgwOSAyNjUuMzA1IDI2Mi4wODQgMjY1LjMwNUMyNDkuOTE2IDI2NS4zMDUgMjM5LjgxMyAyNjcuMjI4IDIzMC4wMzggMjcwLjkxOVYyOTAuNDY4QzIzOS42NTYgMjg2Ljc3OCAyNDkuMjYgMjg0LjU0MSAyNTguMjM3IDI4NC41NDFDMjY5LjQ1MSAyODQuNTQxIDI3NS43MDYgMjg5LjY3IDI3NS43MDYgMjk4LjY0N0MyNzMuNzgzIDI5OC40OSAyNzAuNTc3IDI5OC4zMzQgMjY3LjUyNyAyOTguMzM0QzI0MS44OTQgMjk4LjMzNCAyMjUuNzA3IDMwOC45MDYgMjI1LjcwNyAzMjcuMDE3QzIyNS43MDcgMzQyLjcxOSAyMzYuNzY0IDM1Mi42NSAyNTQuMjMzIDM1Mi42NUwyNTQuMjQ3IDM1Mi42MzZaTTI2OS43OTMgMzEzLjM4QzI3MS43MTcgMzEzLjM4IDI3NC43NjYgMzEzLjUzNyAyNzUuODc3IDMxMy43MDhWMzIwLjI3N0MyNzUuODc3IDMyOS4wOTcgMjY5Ljk1IDMzNS4xODEgMjYxLjQ1NyAzMzUuMTgxQzI1My45MiAzMzUuMTgxIDI0OS4yNzUgMzMxLjgxOSAyNDkuMjc1IDMyNS4wOTNDMjQ5LjI3NSAzMTcuMzk5IDI1Ni42NDEgMzEzLjM5NSAyNjkuNzc5IDMxMy4zOTVMMjY5Ljc5MyAzMTMuMzhaTTMzOS4xNzEgMzUyLjYzNkMzNDkuMjU5IDM1Mi42MzYgMzU2LjE1NiAzNDguOTQ2IDM2MS41OTkgMzQxLjU3OUwzNjEuOTEyIDM1MC41NTZIMzg1LjMwOVYyNjcuMzk5SDM2MC45NThWMzE2LjQzQzM2MC45NTggMzI2LjUxOCAzNTUuOTg1IDMzMi45MyAzNDcuODIgMzMyLjkzQzMzOS42NTUgMzMyLjkzIDMzNS40ODEgMzI3LjQ4NyAzMzUuNDgxIDMxNy4zODRWMjY3LjM5OUgzMTEuMTI5VjMyMS40MDNDMzExLjEyOSAzNDAuNDY4IDMyMi4wMyAzNTIuNjUgMzM5LjE3MSAzNTIuNjVWMzUyLjYzNlpNMzY5Ljc3OCAyNTYuMTcxVjIzNS4wMjZMMzI5LjIzOSAyNDIuMjM2VjI1Ni4xNzFIMzY5Ljc3OFoiIGZpbGw9IiMwMDAwNjYiLz4KPHBhdGggZD0iTTEzOC44NjUgMjU4Ljc0NkMxNDcuMzU4IDI1OC43NDYgMTUzLjI4NSAyNTIuOTc1IDE1My4yODUgMjQ0LjgxQzE1My4yODUgMjM2LjY0NiAxNDcuMzU4IDIzMC44NzUgMTM4Ljg2NSAyMzAuODc1QzEzMC4zNzMgMjMwLjg3NSAxMjQuNDQ1IDIzNi42NDYgMTI0LjQ0NSAyNDQuODFDMTI0LjQ0NSAyNTIuOTc1IDEzMC4zNzMgMjU4Ljc0NiAxMzguODY1IDI1OC43NDZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTUxLjA3IDI2Ny4zNDRIMTI2LjcxOVYzNTAuNTAxSDE1MS4wN1YyNjcuMzQ0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE3Mi41MTQgMjg2LjMwNVYzMjEuODdDMTcyLjUxNCAzNDIuMDYxIDE4My4wODYgMzUyLjE0OSAyMDEuODM4IDM1Mi4xNDlDMjA4LjU2MyAzNTIuMTQ5IDIxNC4xNzggMzUxLjM1MSAyMTYuODk5IDM1MC41MzlWMzMxLjk1OEMyMTUuMTMyIDMzMi40NDMgMjExLjkyNiAzMzIuOTEzIDIwOC4yNSAzMzIuOTEzQzIwMC4zOTkgMzMyLjkxMyAxOTYuODc5IDMyOS4wNjYgMTk2Ljg3OSAzMjAuMjZWMjg2LjI5MUgyMTguMDI1VjI2Ny4zODJIMTk2Ljg3OVYyNDIuMjE5TDE3Mi41MjggMjQ2LjUzNlYyNjcuMzY4SDE2MC4zNTlWMjg2LjI3NkgxNzIuNTI4TDE3Mi41MTQgMjg2LjMwNVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yNjIuMDY1IDI2NS4zMkMyNDkuODk2IDI2NS4zMiAyMzkuNzk0IDI2Ny4yNDQgMjMwLjAxOSAyNzAuOTM0VjI5MC40ODRDMjM5LjYzNyAyODYuNzkzIDI0OS4yNDEgMjg0LjU1NiAyNTguMjE4IDI4NC41NTZDMjY5LjQzMiAyODQuNTU2IDI3NS42ODcgMjg5LjY4NiAyNzUuNjg3IDI5OC42NjNDMjczLjc2MyAyOTguNTA2IDI3MC41NTcgMjk4LjM0OSAyNjcuNTA4IDI5OC4zNDlDMjQxLjg3NCAyOTguMzQ5IDIyNS42ODggMzA4LjkyMiAyMjUuNjg4IDMyNy4wMzJDMjI1LjY4OCAzNDIuNzM1IDIzNi43NDUgMzUyLjY2NiAyNTQuMjE0IDM1Mi42NjZDMjYzLjk4OSAzNTIuNjY2IDI3MS4wNDIgMzQ4LjY2MiAyNzYgMzQxLjkzN0wyNzYuMzE0IDM1MC41ODZIMjk5LjA2OVYzMDEuNzEyQzI5OS4wNjkgMjc4LjAwMiAyODUuNzc1IDI2NS4zMzUgMjYyLjA1MSAyNjUuMzM1TDI2Mi4wNjUgMjY1LjMyWk0yNzUuODQ0IDMyMC4yNzhDMjc1Ljg0NCAzMjkuMDk5IDI2OS45MTYgMzM1LjE4MyAyNjEuNDI0IDMzNS4xODNDMjUzLjg4NiAzMzUuMTgzIDI0OS4yNDEgMzMxLjgyIDI0OS4yNDEgMzI1LjA5NUMyNDkuMjQxIDMxNy40IDI1Ni42MDggMzEzLjM5NiAyNjkuNzQ1IDMxMy4zOTZDMjcxLjY2OSAzMTMuMzk2IDI3NC43MTggMzEzLjU1MyAyNzUuODI5IDMxMy43MjRWMzIwLjI5M0wyNzUuODQ0IDMyMC4yNzhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzM5LjE1OSAzNTIuNTgxQzM0OS4yNDcgMzUyLjU4MSAzNTYuMTQ0IDM0OC44OSAzNjEuNTg3IDM0MS41MjRMMzYxLjkgMzUwLjUwMUgzODUuMjk3VjI2Ny4zNDRIMzYwLjk0NlYzMTYuMzc0QzM2MC45NDYgMzI2LjQ2MyAzNTUuOTczIDMzMi44NzUgMzQ3LjgwOCAzMzIuODc1QzMzOS42NDQgMzMyLjg3NSAzMzUuNDY5IDMyNy40MzEgMzM1LjQ2OSAzMTcuMzI5VjI2Ny4zNDRIMzExLjExN1YzMjEuMzQ3QzMxMS4xMTcgMzQwLjQxMiAzMjIuMDE4IDM1Mi41OTUgMzM5LjE1OSAzNTIuNTk1VjM1Mi41ODFaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzY5LjczNCAyNTYuMTUzVjIzNS4wMDhMMzI5LjE5NSAyNDIuMjE4VjI1Ni4xNTNIMzY5LjczNFoiIGZpbGw9IndoaXRlIi8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDBfMjUyODNfMTA0OCI+CjxyZWN0IHdpZHRoPSIzMzIiIGhlaWdodD0iMzMyIiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTAgOTApIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+",
    "fullColor": true
  },
  {
    "key": "inter",
    "name": "Inter",
    "sigla": "IN",
    "cor": "#ea580c",
    "fg": "#ffffff",
    "pattern": "\\binter\\b",
    "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF83NDU2XzEwNzg4KSI+CjxwYXRoIGQ9Ik0wIDg1LjMzMzNDMCAzOC4yMDUgMzguMjA1IDAgODUuMzMzMyAwSDQyNi42NjdDNDczLjc5NSAwIDUxMiAzOC4yMDUgNTEyIDg1LjMzMzNWNDI2LjY2N0M1MTIgNDczLjc5NSA0NzMuNzk1IDUxMiA0MjYuNjY3IDUxMkg4NS4zMzMzQzM4LjIwNSA1MTIgMCA0NzMuNzk1IDAgNDI2LjY2N1Y4NS4zMzMzWiIgZmlsbD0iI0VBNzEwMCIvPgo8cGF0aCBkPSJNMjQzLjczNyAyOTkuMDc5SDI2Ni41OFYzMjMuNjY2SDI0Ny41OTZDMjI3LjYxNSAzMjMuNjY2IDIxNS4zNTMgMzE2Ljc1NyAyMTUuMzUzIDI5MS40MjNWMjM2LjUyNEgyMDEuNzg0QzE5OS40MTkgMjM2LjUyNCAxOTguMTc0IDIzMy42NiAxOTkuNzkyIDIzMS45MThMMjM5LjA2OCAxODcuMzUxQzI0MC43NDkgMTg1LjU0NiAyNDMuNzk5IDE4Ni43MjggMjQzLjc5OSAxODkuMjE4VjIxMS45MzdIMjY2LjQ1NlYyMzYuNTI0SDI0My43OTlWMjk5LjA3OUgyNDMuNzM3Wk0xNjIuMzIxIDIxMC4xMzJDMTQ4LjY5IDIxMC4xMzIgMTM4LjQ4MSAyMTcuOTc1IDEzMy41MDIgMjMwLjI5OUgxMzIuNTY4VjIxMS44NzVIMTA1LjQ5MlYzMjMuNjY2SDEzMy45MzhWMjM3LjAyMkgxNTIuOTIyQzE2MS4yMDEgMjM3LjAyMiAxNjQuMjUxIDIzOC43NjUgMTY0LjI1MSAyNDcuNjAzVjMyMy42NjZIMTkyLjY5NlYyNDIuMDYzQzE5Mi42MzQgMjE5LjU5MyAxODEuODY2IDIxMC4xMzIgMTYyLjMyMSAyMTAuMTMyWk01Ni4zMTg4IDMyMy42NjZIODQuNzY0NVYyMTEuODc1SDU2LjMxODhWMzIzLjY2NlpNNDI4LjQ3OCAyMzEuNjY5SDQyNy4yOTVWMjExLjg3NUgzOTkuMDM2VjMyMy42NjZINDI5LjE2M1YyMzguNTc4SDQ1NS42NzlWMjEwLjEzMkg0NTIuMDA2QzQzOC4wNjQgMjEwLjEzMiA0MzEuOTAxIDIxNi4yOTQgNDI4LjQ3OCAyMzEuNjY5Wk0zODUuODQxIDI2NC45MDdWMjczLjM3MkgzMDAuNTY2QzMwMi4xMjIgMjg5Ljk5MiAzMTIuNTE3IDMwMS4wMDkgMzI4LjU3NiAzMDEuMDA5QzM0Mi45NTQgMzAxLjAwOSAzNTMuMzQ5IDI5My4zNTMgMzU1LjQ2NSAyODMuODkySDM4NS43NzhDMzc5LjQyOSAzMDcuNDgyIDM1Ny43NjggMzI1LjUzMyAzMjguMTQgMzI1LjUzM0MyOTMuNTk0IDMyNS41MzMgMjcwLjEyOCAzMDAuOTQ3IDI3MC4xMjggMjY4LjcwNEMyNzAuMTI4IDIzNi40NjEgMjkyLjc4NSAyMTAuMTMyIDMyOC44ODcgMjEwLjEzMkMzNjIuOTk3IDIxMC4xMzIgMzg1Ljg0MSAyMzMuNTk4IDM4NS44NDEgMjY0LjkwN1pNMzAxLjQzNyAyNTIuNzY5SDM1Ni40NjFDMzUyLjE2NiAyNDEuNTY2IDM0My4wNzkgMjMzLjUzNiAzMjkuMDEyIDIzMy41MzZDMzE2LjY4NyAyMzMuNTk4IDMwNS44NTcgMjQwLjA3MiAzMDEuNDM3IDI1Mi43NjlaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzc0NTZfMTA3ODgiPgo8cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4=",
    "fullColor": true
  },
  {
    "key": "mercadopago",
    "name": "Mercado Pago",
    "sigla": "MP",
    "cor": "#0284c7",
    "fg": "#ffffff",
    "pattern": "mercado\\s?pago|\\bmp \\*",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TWVyY2FkbyBQYWdvPC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTEuMTE1IDE2LjQ3OWEuOTMuOTI3IDAgMCAxLS45MzktLjg4NmMtLjAwMi0uMDQyLS4wMDYtLjE1NS0uMTAzLS4xNTUtLjA0IDAtLjA3NC4wMjMtLjExMy4wNTktLjExMi4xMDMtLjI1NC4yMDYtLjQ2LjIwNmEuODE2LjgxNCAwIDAgMS0uMzA1LS4wNjZjLS41MzUtLjIxNC0uNTQyLS41NzgtLjUyMS0uNzI1LjAwNi0uMDM4LjAwNy0uMDgtLjAyLS4xMWwtLjAzMi0uMDNoLS4wMzRjLS4wMjcgMC0uMDU1LjAxMi0uMDkzLjAzOWEuNzg4Ljc4NiAwIDAgMS0uNDU0LjE2LjcuNjk5IDAgMCAxLS4yNTMtLjA1Yy0uNzA4LS4yNy0uNjUtLjkyOC0uNjE3LTEuMTI2LjAwNS0uMDQxLS4wMDUtLjA3Mi0uMDMtLjA5MmwtLjA1LS4wNC0uMDQ3LjA0M2EuNzI4LjcyNiAwIDAgMS0uNTA1LjIwMy43My43MjggMCAwIDEtLjczMi0uNzI1YzAtLjQuMzI4LS43MjIuNzMyLS43MjIuMzY0IDAgLjY3NS4yNy43MjEuNjNsLjAyNi4xOTUuMTEtLjE2NWMuMDEtLjAxOC4zMDctLjQ2Ljg1Mi0uNDYuMTAyIDAgLjIxLjAxNi4zMTYuMDUuNDM0LjEzLjUwOC41Mi41MTkuNjguMDA4LjA5NC4wNzUuMS4wOS4xLjAzNyAwIC4wNjQtLjAyNC4wODMtLjA0NWEuNzQ2Ljc0NCAwIDAgMSAuNTQtLjIyNWMuMTI4IDAgLjI2My4wMy40MDIuMDkuNjkuMjkzLjM3OSAxLjE1OC4zNzQgMS4xNjctLjA1OC4xNDQtLjA2MS4yMDctLjAwNS4yNDRsLjAyNy4wMTNoLjAyYy4wMyAwIC4wNy0uMDE0LjEzNC0uMDM1LjA5My0uMDMyLjIzNS0uMDguMzY3LS4wOGEuOTQ0Ljk0MiAwIDAgMSAuOTQuOTMuOTM2LjkzNCAwIDAgMS0uOTQuOTI4em03LjMwMi00LjE3MWMtMS4xMzgtLjk4LTMuNzY4LTMuMjQtNC40ODEtMy43Ny0uNDA2LS4zMDItLjY4NS0uNDYyLS45MjgtLjUzM2ExLjU1OSAxLjU1NCAwIDAgMC0uNDU2LS4wN2MtLjE4MiAwLS4zNzYuMDMyLS41OC4wOTUtLjQ2LjE0NS0uOTE4LjUwNS0xLjM2Mi44NTRsLS4wMjMuMDE4Yy0uNDE0LjMyNC0uODQuNjYtMS4xNjQuNzNhMS45ODYgMS45OCAwIDAgMS0uNDMuMDQ5Yy0uMzYyIDAtLjY4Ny0uMTA0LS44MS0uMjU4LS4wMi0uMDI1LS4wMDctLjA2Ni4wNC0uMTI1bC4wMDgtLjAwOCAxLTEuMDY3Yy43ODMtLjc3NCAxLjUyNS0xLjUwNiAzLjIzLTEuNTQ1aC4wODVjMS4wNjIgMCAyLjEyLjQ2OSAyLjI0LjUyNGE3LjAzIDcuMDMgMCAwIDAgMy4wNTYuNzI0YzEuMDc2IDAgMi4xODgtLjI2MyAzLjM1NC0uNzk1YTkuMTM1IDkuMTEgMCAwIDAtLjQwNS0uMzE3Yy0xLjAyNS40NC0yLjAwMy42Ni0yLjk0Ni42Ni0uOTYyIDAtMS45MjUtLjIyOS0yLjg1OC0uNjgtLjA1LS4wMjItMS4yMi0uNTY3LTIuNDQtLjU3LS4wMzIgMC0uMDY1IDAtLjA5Ni4wMDItMS40MzQuMDMzLTIuMjQuNTM2LTIuNzgyLjk3Ni0uNTI4LjAxMy0uOTgyLjEzOC0xLjM4OC4yNS0uMzYxLjEtLjY3My4xODYtLjk3OS4xODUtLjEyNSAwLS4zNS0uMDEtLjM3LS4wMTItLjM1LS4wMS0yLjExNS0uNDM3LTMuNTE4LS45NjItLjE0My4xLS4yOC4yMDMtLjQxNS4zMSAxLjQ2Ni41OTMgMy4yNSAxLjA1MyAzLjgxMiAxLjA4OS4xNTcuMDEuMzIzLjAyNy40OTEuMDI3LjM3MiAwIC43NDQtLjEwMyAxLjEwNC0uMjAzLjIxMy0uMDU5LjQ0Ni0uMTIzLjY5Mi0uMTdsLS4xOTYuMTk0LTEuMDE3IDEuMDg3Yy0uMDguMDgtLjI1NC4yOTQtLjE0LjU1N2EuNzA1LjcwMyAwIDAgMCAuMjY4LjI5MmMuMjQzLjE2Mi42NzcuMjcgMS4wOC4yNzEuMTUyIDAgLjI5Ny0uMDE1LjQzLS4wNDQuNDI3LS4wOTUuODc0LS40NDggMS4zNDktLjgyLjM3Ny0uMjk2LjkxMy0uNjcyIDEuMzIzLS43ODJhMS40OTQgMS40OSAwIDAgMSAuMzctLjA1LjYxMS42MSAwIDAgMSAuMDk1LjAwNWMuMjcuMDM0LjUzMy4xMjUgMS4wMDMuNDcyLjgzNS42MiA0LjUzMSAzLjgxNSA0LjU2NiAzLjg0Ni4wMDIuMDAyLjIzOC4yMDMuMjIuNTM3LS4wMDcuMTg2LS4xMS4zNTItLjI5NC40NjZhLjkwMi45IDAgMCAxLS40ODQuMTUuODA0LjgwMiAwIDAgMS0uNDI4LS4xMjRjLS4wMTQtLjAxLTEuMjgtMS4xNTctMS43NDYtMS41NDMtLjA3NC0uMDYtLjE0Ni0uMTE1LS4yMi0uMTE1YS4xMjIuMTIyIDAgMCAwLS4wOTYuMDQ1Yy0uMDczLjA5LjAxLjIxMi4xMDUuMjk0bDEuNDggMS40N2MuMDAyIDAgLjE4NC4xNy4yMDQuMzk1LjAxMi4yNDQtLjEwNi40NDctLjM1LjYwNmEuOTU3Ljk1NSAwIDAgMS0uNTI2LjE3MS43NjYuNzY0IDAgMCAxLS40Mi0uMTI3bC0uMjE0LS4yMDZhMjEuMDM1IDIwLjk3OCAwIDAgMC0xLjA4LTEuMDA5Yy0uMDcyLS4wNTgtLjE0OC0uMTEyLS4yMjEtLjExMmEuMTI3LjEyNyAwIDAgMC0uMDk0LjAzOGMtLjAzMy4wMzctLjA1Ni4xMDMuMDI4LjIxMmEuNjk4LjY5NiAwIDAgMCAuMDc1LjA4M2wxLjA3OCAxLjE5OGMuMDEuMDEuMjIyLjI2LjAyNC41MTFsLS4wMzguMDQ4YTEuMTggMS4xNzggMCAwIDEtLjEuMDk2Yy0uMTg0LjE1LS40My4xNjQtLjUyNy4xNjRhLjguNzk4IDAgMCAxLS4xNDctLjAxMmMtLjEwNi0uMDE4LS4xNzgtLjA0OC0uMjEyLS4wODlsLS4wMTMtLjAxM2MtLjA2LS4wNi0uNjAyLS42MDktMS4wNTQtLjk4LS4wNTktLjA1LS4xMzMtLjExLS4yMS0uMTFhLjEyOC4xMjggMCAwIDAtLjA5Ni4wNDJjLS4wOS4wOTYuMDQ0LjI0LjEuMjkzbC45MiAxLjAwM2EuMjA0LjIwNCAwIDAgMS0uMDMzLjA2MmMtLjAzMy4wNDQtLjE0NC4xNTUtLjQ3OS4xOTZhLjkxLjkwNyAwIDAgMS0uMTIyLjAwN2MtLjM0NSAwLS43MTItLjE2NC0uOTAyLS4yNjRhMS4zNDMgMS4zNCAwIDAgMCAuMTMtLjU3NiAxLjM2OCAxLjM2NSAwIDAgMC0xLjQyLTEuMzU3Yy4wMjQtLjM0Mi0uMDI1LS45OS0uNjk3LTEuMjc0YTEuNDU1IDEuNDUyIDAgMCAwLS41NzUtLjEyNWMtLjE0NiAwLS4yODcuMDI1LS40Mi4wNzVhMS4xNTMgMS4xNSAwIDAgMC0uNjcxLS41NjQgMS41MiAxLjUxNSAwIDAgMC0uNDk0LS4wODVjLS4yOCAwLS41MzcuMDgtLjc2Ny4yNDJhMS4xNjggMS4xNjUgMCAwIDAtLjkwMy0uNDMgMS4xNzMgMS4xNyAwIDAgMC0uODIuMzM1Yy0uMjg3LS4yMTctMS40MjUtLjkzLTQuNDY3LTEuNjEzYTE3LjM5IDE3LjM0NCAwIDAgMS0uNjkyLS4xODkgNC44MjIgNC44MiAwIDAgMC0uMDc3LjQ5NGwuNjcuMTU3YzMuMTA4LjY4MiA0LjEzNiAxLjM5MSA0LjMwOSAxLjUyNWExLjE0NSAxLjE0MiAwIDAgMC0uMDkuNDQyIDEuMTYgMS4xNTggMCAwIDAgMS4zNzggMS4xMzJjLjA5Ni40NjcuNDA2LjgyMS44NzkgMS4wMDNhMS4xNjUgMS4xNjIgMCAwIDAgLjQxNS4wOGMuMDkgMCAuMTc5LS4wMTIuMjY2LS4wMzQuMDg2LjIyLjI4Mi40OTMuNzIyLjY2OGExLjIzMyAxLjIzIDAgMCAwIC40NTcuMDk0Yy4xMjIgMCAuMjQxLS4wMjIuMzU1LS4wNjNhMS4zNzMgMS4zNyAwIDAgMCAxLjI2OS44NDFjLjM3LjAwMi43MjYtLjE0Ny45ODUtLjQxLjIyMS4xMjEuNjg4LjM0MSAxLjE2My4zNDEuMDYgMCAuMTE4LS4wMDIuMTc1LS4wMS40Ny0uMDU5LjY4OS0uMjQuNzg5LS4zODJhLjU3MS41NyAwIDAgMCAuMDQ4LS4wNzhjLjExLjAzMi4yMzQuMDU4LjM3My4wNTguMjU1IDAgLjUwMS0uMDg2Ljc1LS4yNjUuMjQ0LS4xNzQuNDE4LS40MjQuNDQ0LS42Mzd2LS4wMWMuMDgzLjAxNy4xNjcuMDI2LjI1MS4wMjYuMjY1IDAgLjUyNy0uMDgyLjc3My0uMjQyLjQ4LS4zMS41NjItLjcxNS41NTQtLjk4YTEuMjggMS4yNzkgMCAwIDAgLjk3OC0uMTk0IDEuMDQgMS4wNCAwIDAgMCAuNTAyLS44MDggMS4wODggMS4wODUgMCAwIDAtLjE2LS42NTNjLjgwNC0uMzQyIDIuNjM2LTEuMDAzIDQuNzk1LTEuNDgzYTQuNzM0IDQuNzIxIDAgMCAwLS4wNjctLjQ5MiAyNy43NDIgMjcuNjY3IDAgMCAwLTUuMDQ5IDEuNjJ6bTUuMTIzLS43NjNjMCA0LjAyNy01LjE2NiA3LjI5My0xMS41MzcgNy4yOTMtNi4zNzIgMC0xMS41MzgtMy4yNjYtMTEuNTM4LTcuMjkzIDAtNC4wMjggNS4xNjUtNy4yOTMgMTEuNTM5LTcuMjkzIDYuMzcxIDAgMTEuNTM3IDMuMjY1IDExLjUzNyA3LjI5M3ptLjQ2LjAwNGMwLTQuMjcyLTUuMzc0LTcuNzU1LTEyLTcuNzU1Uy4wMDIgNy4yNzcuMDAyIDExLjU1TDAgMTIuMDA0YzAgNC41MzMgNC42OTUgOC4yMDMgMTEuOTk5IDguMjAzIDcuMzQ3IDAgMTItMy42NyAxMi04LjIwNHoiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "caixa",
    "name": "Caixa",
    "sigla": "CX",
    "cor": "#1e40af",
    "fg": "#ffffff",
    "pattern": "caixa",
    "src": "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJFbGVtZW50b19zw61udGVzZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgCiAgICB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTIwMCAxMjAwIiAKICAgIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDEyMDAgMTIwMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOnVybCgjRnVuZG9fMDAwMDAwMDA5Mzk0ODc4MzE2NDQxODE2MzAwMDAwMDM1OTQxMTc4MzI5MjQyOTIwMDNfKTt9Cgkuc3Qxe2ZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6dXJsKCNTVkdJRF8xXyk7fQoJLnN0MntmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOnVybCgjU1ZHSURfMDAwMDAwNDYzMDQzMzc5MDM1NTUwNzkyODAwMDAwMDU4OTIyNTg0MzMxMjU4NzUxMTRfKTt9Cgkuc3Qze2ZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6dXJsKCNTVkdJRF8wMDAwMDAzMTkyODY5MzM2NTA1MzQ3MzQ5MDAwMDAxNTYwMDk4OTAzMjI0MjYwNjAxNV8pO30KCS5zdDR7ZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMTUwMTAzNzQ3MjAwNjgzODQxNzQwMDAwMDA5NTM2NjA2MTE1NDA4NjQ3MzA1Xyk7fQoJLnN0NXtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOnVybCgjU1ZHSURfMDAwMDAxMzIwNjY5ODI4Njk5MDIwNTYyMTAwMDAwMTM3NTEzMTg2NzY4ODk1NjU4ODRfKTt9Cjwvc3R5bGU+CjxsaW5lYXJHcmFkaWVudCBpZD0iRnVuZG9fMDAwMDAwOTQ1ODA0MDY5ODIwNDI5MjUwNTAwMDAwMDQ4OTA1ODYxOTE2NTQyNDU4MDRfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAiIHkxPSI2MDAiIHgyPSIxMjAwIiB5Mj0iNjAwIj4KCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDY2QjMiLz4KCTxzdG9wICBvZmZzZXQ9IjAuMTQ2NSIgc3R5bGU9InN0b3AtY29sb3I6IzE0N0VCMSIvPgoJPHN0b3AgIG9mZnNldD0iMC4zNjQyIiBzdHlsZT0ic3RvcC1jb2xvcjojMkM5QkFGIi8+Cgk8c3RvcCAgb2Zmc2V0PSIwLjU4MDkiIHN0eWxlPSJzdG9wLWNvbG9yOiMzRUFGQUUiLz4KCTxzdG9wICBvZmZzZXQ9IjAuNzk0MiIgc3R5bGU9InN0b3AtY29sb3I6IzQ4QkNBRCIvPgoJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzRDQzBBRCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8cmVjdCBpZD0iRnVuZG9fMDAwMDAwODU5NzI4NDg1NTE5MjU5NDY0MzAwMDAwMTAwMDE5ODgwODYyMzMwMzM4NjlfIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI0Z1bmRvXzAwMDAwMDk0NTgwNDA2OTgyMDQyOTI1MDUwMDAwMDA0ODkwNTg2MTkxNjU0MjQ1ODA0Xyk7IiB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMjAwIi8+CjxnIGlkPSJYXzAwMDAwMDIxODA2NTg1NjUxNzMzODkzOTAwMDAwMDE3OTE1NDg4OTk2NTA2MTAxNjg3XyI+CgkKCQk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjM3NDEyLjMxMjUiIHkxPSItMjk0NTQuMDMxMiIgeDI9IjM3NDEyLjMxMjUiIHkyPSItMTg0NTAuODIwMyIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgyLjgzNDYwN2UtMDIgMCAwIC0yLjgzNDYwN2UtMDIgLTM0OC44MjIgOTIuODI4OSkiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiNEQ0REREYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxLjE3NjQ3MGUtMDIiIHN0eWxlPSJzdG9wLWNvbG9yOiNEQ0REREYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjIiIHN0eWxlPSJzdG9wLWNvbG9yOiNFNkU3RTgiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojRjFGMUYyIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI3MjYuNSw2MTUuOCA1MzcuOSw4MDQuMyA2MDAuOCw5MjcuNyA2MDUsOTI3LjcgODg1LjQsOTI3LjcgCSIvPgoJCgkJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8wMDAwMDA3MDc5OTYxODMyMjEwOTg5OTYwMDAwMDAwMDA4MzYyMDEyODM1MjA5NTExM18iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMzEyMjguNjYwMiIgeTE9Ii0xNjM0My40MzI2IiB4Mj0iMzEyMjguNjYwMiIgeTI9Ii03MzIwLjc5OTgiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMi44MzQ2MDdlLTAyIDAgMCAtMi44MzQ2MDdlLTAyIC0zNDguODIyIDkyLjgyODkpIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojRENERERGIi8+CgkJPHN0b3AgIG9mZnNldD0iMS4xNzY0NzBlLTAyIiBzdHlsZT0ic3RvcC1jb2xvcjojRENERERGIi8+CgkJPHN0b3AgIG9mZnNldD0iMC4yIiBzdHlsZT0ic3RvcC1jb2xvcjojRTZFN0U4Ii8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6I0YxRjFGMiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCQoJCTxwb2x5Z29uIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtmaWxsOnVybCgjU1ZHSURfMDAwMDAwNzA3OTk2MTgzMjIxMDk4OTk2MDAwMDAwMDAwODM2MjAxMjgzNTIwOTUxMTNfKTsiIHBvaW50cz0iCgkJNDczLjYsNTg0LjIgNzU4LjEsNTg0LjIgNjYyLjEsMzk1LjcgNjYyLjEsMzk1LjcgNTk5LjIsMjcyLjMgMzE0LjcsMjcyLjMgCSIvPgoJCgkJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8wMDAwMDAzNzY2NzAyNDQ1MDIwNjY1NjI5MDAwMDAwNjY0NDYxNjE3NTQ2NTAxODc4OV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjc0MTMuNTc4MSIgeTE9Ii0xOTY2MS4zNjcyIiB4Mj0iMjc0MTMuNTc4MSIgeTI9Ii0yODI0My45Njg4IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDIuODM0NjA3ZS0wMiAwIDAgLTIuODM0NjA3ZS0wMiAtMzQ4LjgyMiA5Mi44Mjg5KSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6I0ZBQTgzMSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEuMTc2NDcwZS0wMiIgc3R5bGU9InN0b3AtY29sb3I6I0ZBQTgzMSIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOTg4MiIgc3R5bGU9InN0b3AtY29sb3I6I0Y1ODYzNCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiNGNTg2MzQiLz4KCTwvbGluZWFyR3JhZGllbnQ+CgkKCQk8cG9seWdvbiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMDM3NjY3MDI0NDUwMjA2NjU2MjkwMDAwMDA2NjQ0NjE2MTc1NDY1MDE4Nzg5Xyk7IiBwb2ludHM9IgoJCTEzMCw5MjcuNyA0MTQuNiw5MjcuNyA1MzcuOSw4MDQuMyA1MzcuOSw4MDQuNCA3MjYuNSw2MTUuOCA0NDEuOSw2MTUuOCAJIi8+CgkKCQk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzAwMDAwMDc4NzI1MzMyNDM1MDgwNjEzNjkwMDAwMDExMTE5ODE4NjgxNjgwNTc1NjE3XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSI0Mjg1OC45NjQ4IiB5MT0iLTgyMDEuMDU1NyIgeDI9IjQyODU4Ljk2NDgiIHkyPSItMTU0NjMuMjQwMiIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgyLjgzNDYwN2UtMDIgMCAwIC0yLjgzNDYwN2UtMDIgLTM0OC44MjIgOTIuODI4OSkiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiNGQUE4MzEiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxLjE3NjQ3MGUtMDIiIHN0eWxlPSJzdG9wLWNvbG9yOiNGQUE4MzEiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojRjU4NjM0Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJCgkJPHBvbHlnb24gc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6dXJsKCNTVkdJRF8wMDAwMDA3ODcyNTMzMjQzNTA4MDYxMzY5MDAwMDAxMTExOTgxODY4MTY4MDU3NTYxN18pOyIgcG9pbnRzPSIKCQk3ODUuNSwyNzIuMyA2NjIuMSwzOTUuNyA3NTguMSw1ODQuMiAxMDcwLDI3Mi4zIAkiLz4KCQoJCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMDAwMDAwMzE5MTU4NTA3OTU0NTA4MTEwNDAwMDAwMTM4NjY4MTQ3OTYzMTUyODE1ODJfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjMxMjgzLjYxMzMiIHkxPSItMjI1MTEuNTY2NCIgeDI9IjM3OTM0LjM0NzciIHkyPSItMjI1MTEuNTY2NCIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgyLjgzNDYwN2UtMDIgMCAwIC0yLjgzNDYwN2UtMDIgLTM0OC44MjIgOTIuODI4OSkiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiNDRUNGRDEiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjY1MSIgc3R5bGU9InN0b3AtY29sb3I6I0Q2RDdEOSIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOTg4MiIgc3R5bGU9InN0b3AtY29sb3I6I0RDRERERiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiNEQ0REREYiLz4KCTwvbGluZWFyR3JhZGllbnQ+CgkKCQk8cG9seWdvbiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7ZmlsbDp1cmwoI1NWR0lEXzAwMDAwMDMxOTE1ODUwNzk1NDUwODExMDQwMDAwMDEzODY2ODE0Nzk2MzE1MjgxNTgyXyk7IiBwb2ludHM9IgoJCTcyNi41LDYxNS44IDUzNy45LDgwNC4zIDU1OS4yLDg0NiAJIi8+CjwvZz4KPC9zdmc+",
    "fullColor": true
  },
  {
    "key": "santander",
    "name": "Santander",
    "sigla": "SA",
    "cor": "#b91c1c",
    "fg": "#ffffff",
    "pattern": "santander",
    "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPHRpdGxlPkFydGJvYXJkPC90aXRsZT4KICAgIDxnIGlkPSJBcnRib2FyZCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZSIgZmlsbD0iI0ZGRkZGRiIgeD0iMCIgeT0iMCIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiPjwvcmVjdD4KICAgICAgICA8ZyBpZD0ic2FudGFuZGVyX2NoYW1hIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5MCwgOTgpIiBmaWxsPSIjRUMwMDAwIiBmaWxsLXJ1bGU9Im5vbnplcm8iPgogICAgICAgICAgICA8cGF0aCBkPSJNMjM3Ljk0Nzk3MiwxNDQuNzA4MjI3IEMyMzcuNDM1NjI2LDEzMy4yODM4OTMgMjM0LjI4ODM2LDEyMi4wMDYwMjUgMjI4LjM1OTc4OCwxMTEuODI2NjUxIEwxNzYuMzkzMjk4LDIxLjc1MDE3MzggQzE3Mi40NDA5MTcsMTQuODY2MjgwNCAxNjkuNjU5NjEyLDcuNTQyOTg5NTcgMTY4LjE5NTc2NywwIEwxNjYsMy43MzQ4NzgzMyBDMTUzLjExODE2NiwyNS45OTc2ODI1IDE1My4xMTgxNjYsNTMuNDYwMDIzMiAxNjYsNzUuNzk2MDYwMyBMMjA3LjU3MzE5MiwxNDcuODU3MjQyIEMyMjAuNDU1MDI2LDE3MC4xMjAwNDYgMjIwLjQ1NTAyNiwxOTcuNjU1NjIgMjA3LjU3MzE5MiwyMTkuOTE4NDI0IEwyMDUuMzc3NDI1LDIyMy42NTMzMDIgQzIwMy44NDAzODgsMjE2LjExMDMxMyAyMDEuMTMyMjc1LDIwOC43MTM3ODkgMTk3LjE3OTg5NCwyMDEuOTAzMTI5IEwxNTkuMTE5OTI5LDEzNS45MjAyNzggTDEzNC44MjAxMDYsOTMuODExMzU1NyBDMTMwLjg2NzcyNSw4Ni45Mjc0NjIzIDEyOC4wODY0Miw3OS42MDQxNzE1IDEyNi42MjI1NzUsNzIuMDYxMTgxOSBMMTI0LjQyNjgwOCw3NS43OTYwNjAzIEMxMTEuNjE4MTY2LDk3Ljk4NTYzMTUgMTExLjU0NDk3NCwxMjUuMzc0NzM5IDEyNC4yODA0MjMsMTQ3LjYzNzU0MyBMMTI0LjI4MDQyMywxNDcuNjM3NTQzIEwxNjYsMjE5LjkxODQyNCBDMTc4Ljg4MTgzNCwyNDIuMTgxMjI4IDE3OC44ODE4MzQsMjY5LjY0MzU2OSAxNjYsMjkxLjk3OTYwNiBMMTYzLjgwNDIzMywyOTUuNzE0NDg0IEMxNjIuMjY3MTk2LDI4OC4xNzE0OTUgMTU5LjU1OTA4MywyODAuNzc0OTcxIDE1NS42MDY3MDIsMjczLjk2NDMxMSBMMTAzLjY0MDIxMiwxODMuODg3ODMzIEM5Ni42ODY5NDg5LDE3MS44MDQ0MDMgOTMuNDY2NDkwMywxNTguMTgzMDgyIDk0LjA1MjAyODIsMTQ0LjcwODIyNyBDMzguNDI1OTI1OSwxNTkuMjgxNTc2IDAsMTkwLjExMjYzIDAsMjI1LjkyMzUyMyBDMCwyNzUuNjQ4NjY3IDc0LjI5MDEyMzUsMzE2IDE2NiwzMTYgQzI1Ny42MzY2ODQsMzE2IDMzMiwyNzUuNjQ4NjY3IDMzMiwyMjUuOTIzNTIzIEMzMzIsMTkwLjExMjYzIDI5My41NzQwNzQsMTU5LjI4MTU3NiAyMzcuOTQ3OTcyLDE0NC43MDgyMjciIGlkPSJQYXRoIj48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=",
    "fullColor": true
  },
  {
    "key": "bradesco",
    "name": "Bradesco",
    "sigla": "BR",
    "cor": "#be123c",
    "fg": "#ffffff",
    "pattern": "bradesco",
    "src": "data:image/svg+xml;base64,PHN2ZyBpZD0iYSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIxMTMuMDkiIHkxPSIzNDAuNTUiIHgyPSIzOTguOTEiIHkyPSIxNzUuNTIiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCA1MTQuMDMpIHNjYWxlKDEgLTEpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjYmEyMzg5Ii8+PHN0b3Agb2Zmc2V0PSIuMzUiIHN0b3AtY29sb3I9IiNjZDIzNzUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmOTIyNDYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBkPSJtMjU2LDkxYzkxLjEyLDAsMTY1LDczLjg3LDE2NSwxNjQuOTlzLTczLjg4LDE2NS4wMS0xNjUsMTY1LjAxLTE2NS03My44OC0xNjUtMTY1UzE2NC44OCw5MSwyNTYsOTFaIiBzdHlsZT0iZmlsbDp1cmwoI2IpOyBmaWxsLXJ1bGU6ZXZlbm9kZDsgc3Ryb2tlLXdpZHRoOjBweDsiLz48cGF0aCBkPSJtMzYzLjA2LDI1OS4zOWMwLDI0LjAyLTI4LjM3LDQzLjg5LTY1LjgyLDU1Ljk5LTIuNjcuODctNC45OS4xOC01LjcxLTEuOS0uNzItMi4yNC0uMTgtMy44MSw0Ljk5LTYuMDUsMjEuNDEtOS4zNCwzOS40MS0yMy4zMywzOS40MS0zNy4zMywwLTI3LjY1LTU0Ljc3LTQ4Ljc0LTExOS42OS00OC43NC05Ljk5LDAtMTkuMDkuNTMtMjcuNDcsMS4yMi00LjE3LDkuNDEtNi4zLDE5LjYtNi4yNSwyOS45LDAsMjAuOTIsOC45MSw0MiwyNC45Niw1Ni4xNywyLjEzLDEuOTEsMi4zMSwzLjY0Ljg5LDUuNTRzLTMuNTcsMS44OS02LjA3LjM0Yy0yNS4zMy0xNS43My00MS43My00NC40Mi00MS4wMy03NC42Ni4wMy00LjU0LjUyLTkuMDYsMS40Ni0xMy40OS04LjM5LDEuNzMtMTYuNDIsMy42NC0yNC4yNiw1LjkxLTIuNS42Ni00LjI4LDAtNS4xOC0xLjg5LS44OC0yLjA4LDAtMy44MSwyLjUtNS4xOSw5LjEtNS4wMSwxOS40NS05LjE2LDMwLjY5LTEyLjYyLDEyLjMtMzIuODYsNDQuNi01Ni41Miw4Mi41OS01Ny4yMSwyOS4wNy0uNTEsNTMuNjksMTIuNDksNzAuNDYsMzEuNjQsMS45NywyLjI0LDIuMTMsMy45NC4zNSw1LjdzLTMuNTcsMS41NC01LjkxLS4zNWMtMTIuODQtMTAuNTUtMzEuOTItMTcuNjMtNTEuMDEtMTcuNjMtMjUuODYsMC00OS4wNSwxMS45My02My43MSwzMC40MiwxNC4wMy0yLjM3LDI4LjIzLTMuNTgsNDIuNDYtMy42Myw2Ny43OCwwLDEyMS4zLDI1LjIzLDEyMS4zLDU3LjlsLjA1LS4wM1ptLTkzLjc2LDExMS42NWgtMTkuNDF2LTY1LjU5bDE4LjA3LTEwLjI0YzIuMTgtMS4yMiw0LjgtLjI0LDQuOCwyLjQ0djY5Ljk4Yy0uMDEsMS44OS0xLjU2LDMuNDItMy40NSwzLjRoMFptLTM5LjE3LDBjLTEuMjIsMC0yLjIyLS45Ny0yLjIzLTIuMTl2LTQ4LjRjLS4wNS0xLjYuODMtMy4wOSwyLjI2LTMuODJsMTMuNjUtNy43NHY2Mi4xNGgtMTMuNjdaIiBzdHlsZT0iZmlsbDojZmZmOyBzdHJva2Utd2lkdGg6MHB4OyIvPjwvc3ZnPg==",
    "fullColor": true
  },
  {
    "key": "c6bank",
    "name": "C6 Bank",
    "sigla": "C6",
    "cor": "#1f2937",
    "fg": "#ffffff",
    "pattern": "\\bc6\\b",
    "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjA4LjI1NyAyODEuOTAxQzIxMy4zOSAyNzcuNDkyIDIxNi43NDIgMjcxLjcgMjE4LjMxOSAyNjQuNTI0SDI2OS4wMjVDMjY2LjY5NiAyODUuMDI4IDI1OC4yNzkgMzAxLjYzNiAyNDMuNzcyIDMxNC4zNDlDMjI5LjI2NSAzMjcuMDYgMjExLjQwMyAzMzMuNDE3IDE5MC4xOTIgMzMzLjQxN0MxNzQuNzI3IDMzMy40MTcgMTYwLjggMzMwLjA4NiAxNDguNDE1IDMyMy40MjJDMTM2LjAzMSAzMTYuNzU3IDEyNi4zNjMgMzA3LjQ5NyAxMTkuNDE4IDI5NS42MzhDMTEyLjQ3MiAyODMuNzgxIDEwOSAyNzAuNDY5IDEwOSAyNTUuNzA4QzEwOSAyNDAuOTQ2IDExMi40NzIgMjI3LjYzNiAxMTkuNDE4IDIxNS43NzdDMTI2LjM2MyAyMDMuOTIgMTM2LjAzMSAxOTQuNjU5IDE0OC40MTUgMTg3Ljk5NUMxNjAuOCAxODEuMzMyIDE3NC43MjcgMTc4IDE5MC4xOTIgMTc4QzIxMS4wNjIgMTc4IDIyOC42ODQgMTg0LjEzNSAyNDMuMDU1IDE5Ni40MDJDMjU3LjQyNCAyMDguNjcxIDI2NS45MDkgMjI0Ljc0NyAyNjguNTA5IDI0NC42MzZIMjE4LjUyMkMyMTYuNCAyMzguMDc1IDIxMi43NzMgMjMyLjc5NiAyMDcuNjQxIDIyOC43OTdDMjAyLjUxMSAyMjQuNzk4IDE5Ni43NjMgMjIyLjc5OSAxOTAuMzk1IDIyMi43OTlDMTgxLjYzNyAyMjIuNzk5IDE3NC41NzIgMjI1LjgyNSAxNjkuMjAxIDIzMS44NzNDMTYzLjgyNyAyMzcuOTIyIDE2MS4xNDIgMjQ1Ljg2NyAxNjEuMTQyIDI1NS43MDhDMTYxLjE0MiAyNjUuNDgyIDE2My44NDYgMjczLjM5MiAxNjkuMjUyIDI3OS40NEMxNzQuNjU4IDI4NS40ODkgMTgxLjcwNSAyODguNTEzIDE5MC4zOTUgMjg4LjUxM0MxOTcuMTcxIDI4OC41MTMgMjAzLjEyNSAyODYuMzA5IDIwOC4yNTcgMjgxLjkwMVpNMzg4LjIyMyAyNDEuNDk0QzM5OC4wNzIgMjUwLjc1NiA0MDMgMjYyLjczIDQwMyAyNzcuNDE3QzQwMyAyOTQuMjAzIDM5Ny4zMzEgMzA3LjczMiAzODUuOTk2IDMxOC4wMDdDMzc0LjY1OCAzMjguMjggMzU5LjcxNSAzMzMuNDE3IDM0MS4xNyAzMzMuNDE3QzMyMi44NDQgMzMzLjQxNyAzMDcuOTM4IDMyOC4yNjEgMjk2LjQ1NyAzMTcuOTUyQzI4NC45NzUgMzA3LjY0IDI3OS4yMzUgMjk0LjI3NSAyNzkuMjM1IDI3Ny44NUMyNzkuMjM1IDI2OC44OCAyODAuODEyIDI1OS44NTQgMjgzLjk2MSAyNTAuNzczQzI4Ny4xMTMgMjQxLjY5NSAyOTEuOTgzIDIzMS43NjQgMjk4LjU3NyAyMjAuOTgyTDMyMS44ODggMTgyLjk3N0wzNzEuMTMzIDE4Mi45NjZMMzQzLjU2MSAyMjcuODJDMzQ2LjMxMyAyMjcuNjc1IDM0OC40ODYgMjI3LjYwMyAzNTAuMDgzIDIyNy42MDNDMzY1LjY1NiAyMjcuNjAzIDM3OC4zNjggMjMyLjIzMyAzODguMjIzIDI0MS40OTRaTTM1NC45NzMgMjkxLjE5OUMzNTguNTE5IDI4Ny42NTUgMzYwLjI5NSAyODMuMDYgMzYwLjI5NSAyNzcuNDE3QzM2MC4yOTUgMjcxLjc3MyAzNTguNTE5IDI2Ny4xNDMgMzU0Ljk3MyAyNjMuNTI1QzM1MS40MjIgMjU5LjkwNyAzNDYuODIyIDI1OC4wOTggMzQxLjE3IDI1OC4wOThDMzM1LjUyMSAyNTguMDk4IDMzMC45MTkgMjU5LjkwNyAzMjcuMzczIDI2My41MjVDMzIzLjgyMSAyNjcuMTQzIDMyMi4wNDYgMjcxLjc3MyAzMjIuMDQ2IDI3Ny40MTdDMzIyLjA0NiAyODMuMDYgMzIzLjgyMSAyODcuNjU1IDMyNy4zNzMgMjkxLjE5OUMzMzAuOTE5IDI5NC43NDUgMzM1LjUyMSAyOTYuNTE3IDM0MS4xNyAyOTYuNTE3QzM0Ni44MjIgMjk2LjUxNyAzNTEuNDIyIDI5NC43NDUgMzU0Ljk3MyAyOTEuMTk5WiIgZmlsbD0iIzI0MjQyNCIvPgo8L3N2Zz4=",
    "fullColor": true
  },
  {
    "key": "bancodobrasil",
    "name": "Banco do Brasil",
    "sigla": "BB",
    "cor": "#1e3a8a",
    "fg": "#ffffff",
    "pattern": "banco do brasil|\\bbb\\b",
    "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSIjRkNGQzMwIi8+CjxwYXRoIGQ9Ik0zMjAuODQ0IDIwMC42NjdMMjg3LjEyNSAxNzguMTg4TDkwIDMxMS4zMzRMMjU2IDQyMkw0MjIgMzExLjMzNEwzNTIuODMzIDI2NS41MTFMMjY5LjgzMyAzMjEuNzA5TDMwNi4xNDYgMzQ1LjA1M0wyNTYgMzc1LjMxM0wxNjEuNzYgMzExLjMzNEwzMjAuODQ0IDIwMC42NjdaIiBmaWxsPSIjNDY1RUZGIi8+CjxwYXRoIGQ9Ik0xNTkuMTY3IDM3Ni4xNzdMMTI0LjU4MyAzNTIuODMzTDkwIDM3Ni4xNzdWNDIyTDE1OS4xNjcgMzc2LjE3N1oiIGZpbGw9IiM0NjVFRkYiLz4KPHBhdGggZD0iTTQyMiAyMDAuNjY3TDI1NiA5MEw5MCAyMDAuNjY3TDE1OS4xNjcgMjQ2LjQ5TDI0Mi4xNjcgMTkwLjI5MkwyMDUuODU0IDE2Ni45NDhMMjU2IDEzNi42ODdMMzUwLjI0IDIwMC42NjdMMTkxLjE1NiAzMTEuMzMzTDIyNC44NzQgMzMzLjgxM0w0MjIgMjAwLjY2N1oiIGZpbGw9IiM0NjVFRkYiLz4KPHBhdGggZD0iTTQyMiAxMzUuODIzVjkwTDM1Mi44MzMgMTM1LjgyM0wzODcuNDE2IDE1OS4xNjdMNDIyIDEzNS44MjNaIiBmaWxsPSIjNDY1RUZGIi8+Cjwvc3ZnPg==",
    "fullColor": true
  },
  {
    "key": "picpay",
    "name": "PicPay",
    "sigla": "PP",
    "cor": "#15803d",
    "fg": "#ffffff",
    "pattern": "picpay",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+UGljUGF5PC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTYuNDYzIDEuNTg3djcuNTM3SDI0VjEuNTg3em0xLjI1NiAxLjI1Nmg1LjAyNXY1LjAyNWgtNS4wMjV6bTEuMjU2IDEuMjU2djIuNTEzaDIuNTEzVjQuMDk5ek0zLjc3IDUuMzU1VjguNTNoMy4zNzZjMi4xNDIgMCAzLjM1OCAxLjA0IDMuMzU4IDIuOTM5IDAgMS45NDctMS4yMTYgMy4wMTEtMy4zNTggMy4wMTFIMy43NjlWOC41M0gwdjEzLjg4NGgzLjc2OXYtNC43NmgzLjU3YzQuMzMzIDAgNi44MTUtMi4zNTIgNi44MTUtNi4zMiAwLTMuNzcxLTIuNDgyLTUuOTc4LTYuODE0LTUuOTc4WiIvPjwvc3ZnPg==",
    "fullColor": false
  },
  {
    "key": "uber",
    "name": "Uber",
    "sigla": "U",
    "cor": "#000000",
    "fg": "#ffffff",
    "pattern": "\\buber\\b",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+VWJlcjwvdGl0bGU+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTAgNy45N3Y0Ljk1OGMwIDEuODY3IDEuMzAyIDMuMTAxIDMgMy4xMDEuODI2IDAgMS41NjItLjMxNiAyLjA5NC0uODd2LjczNkg2LjI3VjcuOTdINS4wODJ2NC44ODhjMCAxLjI1Ny0uODUgMi4xMDYtMS45NDcgMi4xMDYtMS4xMSAwLTEuOTQ2LS44MjctMS45NDYtMi4xMDZWNy45NzFIMHptNy40NCAwdjcuOTI1aDEuMTN2LS43MjVjLjUyMS41MzIgMS4yNTcuODYgMi4wNi44NmEzLjAwNiAzLjAwNiAwIDAgMCAzLjAzNC0zLjAxIDMuMDEgMy4wMSAwIDAgMC0zLjAzMy0zLjAyNCAyLjg2IDIuODYgMCAwIDAtMi4wNDkuODYxVjcuOTcxSDcuNDM5em05Ljg2OSAyLjAzOGMtMS42ODcgMC0yLjk2NSAxLjM3LTIuOTY1IDMgMCAxLjcyIDEuMzM0IDMuMDEgMy4wNjYgMy4wMSAxLjA1MyAwIDEuOTEzLS40NjMgMi40OS0xLjIzM2wtLjgyNi0uNjExYy0uNDMuNTc3LS45OTYuODQ3LTEuNjY0Ljg0Ny0uOTczIDAtMS43NTMtLjctMS45MTItMS42NGg0LjY5N3YtLjM3M2MwLTEuNzItMS4yMjItMy0yLjg4Ni0zem02LjI5NS4wNjhjLS42MzQgMC0xLjA5OC4yOTQtMS4zODEuNzU4di0uNzEzaC0xLjEzMXY1Ljc3NGgxLjE0MlYxMi42MWMwLS44OTQuNTQ0LTEuNDcgMS4yOTEtMS40N0gyNHYtMS4wNjVoLS4zOTZ6bS02LjMxOS45MjhjLjg1IDAgMS41NjQuNTg4IDEuNzU2IDEuNDdIMTUuNTJjLjIwMy0uODgyLjkxNi0xLjQ3IDEuNzY1LTEuNDd6bS02LjczMi4wMTJjMS4wODYgMCAxLjk4Ljg4MyAxLjk4IDIuMDA0YTEuOTkzIDEuOTkzIDAgMCAxLTEuOTggMi4wMDFBMS45ODkgMS45ODkgMCAwIDEgOC41NiAxMy4wMmExLjk5IDEuOTkgMCAwIDEgMS45OTItMi4wMDR6Ii8+PC9zdmc+",
    "fullColor": false
  },
  {
    "key": "netflix",
    "name": "Netflix",
    "sigla": "N",
    "cor": "#e50914",
    "fg": "#ffffff",
    "pattern": "netflix",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+TmV0ZmxpeDwvdGl0bGU+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0ibTUuMzk4IDAgOC4zNDggMjMuNjAyYzIuMzQ2LjA1OSA0Ljg1Ni4zOTggNC44NTYuMzk4TDEwLjExMyAwSDUuMzk4em04LjQ4OSAwdjkuMTcybDQuNzE1IDEzLjMzVjBoLTQuNzE1ek01LjM5OCAxLjVWMjRjMS44NzMtLjIyNSAyLjgxLS4zMTIgNC43MTUtLjM5OFYxNC44M0w1LjM5OCAxLjV6Ii8+PC9zdmc+",
    "fullColor": false
  },
  {
    "key": "spotify",
    "name": "Spotify",
    "sigla": "S",
    "cor": "#1db954",
    "fg": "#ffffff",
    "pattern": "spotify",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+U3BvdGlmeTwvdGl0bGU+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTEyIDBDNS40IDAgMCA1LjQgMCAxMnM1LjQgMTIgMTIgMTIgMTItNS40IDEyLTEyUzE4LjY2IDAgMTIgMHptNS41MjEgMTcuMzRjLS4yNC4zNTktLjY2LjQ4LTEuMDIxLjI0LTIuODItMS43NC02LjM2LTIuMTAxLTEwLjU2MS0xLjE0MS0uNDE4LjEyMi0uNzc5LS4xNzktLjg5OS0uNTM5LS4xMi0uNDIxLjE4LS43OC41NC0uOSA0LjU2LTEuMDIxIDguNTItLjYgMTEuNjQgMS4zMi40Mi4xOC40NzkuNjU5LjMwMSAxLjAyem0xLjQ0LTMuM2MtLjMwMS40Mi0uODQxLjYtMS4yNjIuMy0zLjIzOS0xLjk4LTguMTU5LTIuNTgtMTEuOTM5LTEuMzgtLjQ3OS4xMi0xLjAyLS4xMi0xLjE0LS42LS4xMi0uNDguMTItMS4wMjEuNi0xLjE0MUM5LjYgOS45IDE1IDEwLjU2MSAxOC43MiAxMi44NGMuMzYxLjE4MS41NC43OC4yNDEgMS4yem0uMTItMy4zNkMxNS4yNCA4LjQgOC44MiA4LjE2IDUuMTYgOS4zMDFjLS42LjE3OS0xLjItLjE4MS0xLjM4LS43MjEtLjE4LS42MDEuMTgtMS4yLjcyLTEuMzgxIDQuMjYtMS4yNiAxMS4yOC0xLjAyIDE1LjcyMSAxLjYyMS41MzkuMy43MTkgMS4wMi40MTkgMS41Ni0uMjk5LjQyMS0xLjAyLjU5OS0xLjU1OS4zeiIvPjwvc3ZnPg==",
    "fullColor": false
  },
  {
    "key": "amazon",
    "name": "Amazon",
    "sigla": "a",
    "cor": "#232f3e",
    "fg": "#ff9900",
    "pattern": "amazon|\\bamz",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+QW1hem9uPC90aXRsZT48cGF0aCBmaWxsPSIjZmY5OTAwIiBkPSJNLjA0NSAxOC4wMmMuMDcyLS4xMTYuMTg3LS4xMjQuMzQ4LS4wMjIgMy42MzYgMi4xMSA3LjU5NCAzLjE2NiAxMS44NyAzLjE2NiAyLjg1MiAwIDUuNjY4LS41MzMgOC40NDctMS41OTVsLjMxNS0uMTRjLjEzOC0uMDYuMjM0LS4xLjI5My0uMTMuMjI2LS4wODguMzktLjA0Ni41MjUuMTMuMTIuMTc0LjA5LjMzNi0uMTIuNDgtLjI1Ni4xOS0uNi40MS0xLjAwNi42NTQtMS4yNDQuNzQzLTIuNjQgMS4zMTYtNC4xODUgMS43MjZhMTcuNjE3IDE3LjYxNyAwIDAxLTEwLjk1MS0uNTc3IDE3Ljg4IDE3Ljg4IDAgMDEtNS40My0zLjM1Yy0uMS0uMDc0LS4xNTEtLjE1LS4xNTEtLjIyIDAtLjA0Ny4wMjEtLjA5LjA1MS0uMTN6bTYuNTY1LTYuMjE4YzAtMS4wMDUuMjQ3LTEuODYzLjc0My0yLjU3Ny40OTUtLjcxIDEuMTctMS4yNSAyLjA0LTEuNjE1Ljc5Ni0uMzM1IDEuNzU2LS41NzUgMi45MTItLjcyLjM5LS4wNDYgMS4wMzMtLjEwMyAxLjkyLS4xNzR2LS4zN2MwLS45My0uMTA1LTEuNTU4LS4zLTEuODc1LS4zMDItLjQzLS43OC0uNjUtMS40NC0uNjVoLS4xODJjLS40OC4wNDYtLjg5Ni4xOTYtMS4yNDYuNDYtLjM1LjI3LS41NzUuNjMtLjY3NSAxLjA5Ni0uMDYuMy0uMjA2LjQ2NS0uNDM1LjUxbC0yLjUyLS4zMTVjLS4yNDgtLjA2LS4zNzItLjE4LS4zNzItLjM5IDAtLjA0Ni4wMDctLjA5LjAyMi0uMTUuMjQ3LTEuMjkuODU1LTIuMjUgMS44Mi0yLjg4Ljk3Ni0uNjE2IDIuMS0uOTc1IDMuMzktMS4wNWguNTRjMS42NSAwIDIuOTU3LjQzNCAzLjg4OCAxLjI5LjEzNS4xNS4yNy4zLjQwNS40OC4xMi4xNjUuMjI0LjMxNC4yODMuNDUuMDc1LjEzNC4xNS4zMy4xOTUuNTcuMDYuMjU0LjEwNS40Mi4xMzUuNTEuMDMuMTA0LjA2Mi4zLjA3Ni42MTUuMDEuMzEzLjAyLjQ5My4wMi41NTN2NS4yOGMwIC4zNzYuMDYuNzIuMTY1IDEuMDM2LjEwNS4zMTMuMjEuNTQuMzE1LjY3NGwuNTEuNjc0Yy4wOS4xMzYuMTM2LjI1Ni4xMzYuMzYgMCAuMTItLjA2LjIyNi0uMTguMzE0LTEuMiAxLjA1LTEuODYgMS42Mi0xLjk2MyAxLjcxLS4xNjUuMTM1LS4zNzUuMTUtLjYzLjA0NWE2LjA2MiA2LjA2MiAwIDAxLS41MjYtLjQ5NmwtLjMxLS4zNDdhOS4zOTEgOS4zOTEgMCAwMS0uMzE3LS40MmwtLjMtLjQzNWMtLjgxLjg4Ni0xLjYwMyAxLjQ0LTIuNCAxLjY2NS0uNDk0LjE1LTEuMDkzLjIyNy0xLjgzLjIyNy0xLjExIDAtMi4wNC0uMzQzLTIuNzYtMS4wMzQtLjcyLS42OS0xLjA4LTEuNjY1LTEuMDgtMi45NGwtLjA1LS4wNzZ6bTMuNzUzLS40MzhjMCAuNTY2LjE0IDEuMDIuNDI1IDEuMzY0LjI4NS4zNC42NzUuNTEyIDEuMTU1LjUxMi4wNDUgMCAuMTA2LS4wMDcuMTk1LS4wMi4wOS0uMDE2LjEzNC0uMDIzLjE2Ni0uMDIzLjYxNC0uMTYgMS4wOC0uNTUzIDEuNDI0LTEuMTc4LjE2NS0uMjguMjg1LS41OC4zNi0uOTEuMDktLjMyLjEyLS41OS4xMzUtLjguMDE1LS4xOTUuMDE1LS41NC4wMTUtMS4wMDV2LS41NGMtLjg0IDAtMS40ODQuMDYtMS45Mi4xOC0xLjI3NS4zNi0xLjkyIDEuMTctMS45MiAyLjQzbC0uMDM1LS4wMnptOS4xNjIgNy4wMjdjLjAzLS4wNi4wNzUtLjExLjEzMi0uMTcuMzYyLS4yNDMuNzE0LS40MSAxLjA1LS41YTguMDk0IDguMDk0IDAgMDExLjYxMi0uMjRjLjE0LS4wMTIuMjggMCAuNDEuMDMuNjUuMDYgMS4wNS4xNjggMS4xNzIuMzMuMDYzLjA5LjA5OS4yMjguMDk5LjM5di4xNWMwIC41MS0uMTQ5IDEuMTEtLjQyNCAxLjgtLjI3OC42OS0uNjY0IDEuMjQ4LTEuMTU2IDEuNjgtLjA3My4wNi0uMTQuMDktLjE5Ny4wOS0uMDMgMC0uMDYgMC0uMDktLjAxMi0uMDktLjA0NC0uMTA3LS4xMi0uMDY0LS4yNC41NC0xLjI2LjgwNi0yLjE0My44MDYtMi42NCAwLS4xNS0uMDMtLjI3LS4wODctLjM0NC0uMTQ1LS4xNjYtLjU1LS4yNTctMS4yMjQtLjI1Ny0uMjQzIDAtLjUzMy4wMTYtLjg3LjA0Ni0uMzYzLjA0NS0uNy4wOS0xIC4xMzUtLjA5IDAtLjE0OC0uMDE0LS4xOC0uMDQ0LS4wMy0uMDMtLjAzNi0uMDQ3LS4wMi0uMDc3IDAtLjAxNy4wMDYtLjAzLjAyLS4wNjN2LS4wNnoiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "discord",
    "name": "Discord",
    "sigla": "D",
    "cor": "#5865f2",
    "fg": "#ffffff",
    "pattern": "discord",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+RGlzY29yZDwvdGl0bGU+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTIwLjMxNyA0LjM2OThhMTkuNzkxMyAxOS43OTEzIDAgMDAtNC44ODUxLTEuNTE1Mi4wNzQxLjA3NDEgMCAwMC0uMDc4NS4wMzcxYy0uMjExLjM3NTMtLjQ0NDcuODY0OC0uNjA4MyAxLjI0OTUtMS44NDQ3LS4yNzYyLTMuNjgtLjI3NjItNS40ODY4IDAtLjE2MzYtLjM5MzMtLjQwNTgtLjg3NDItLjYxNzctMS4yNDk1YS4wNzcuMDc3IDAgMDAtLjA3ODUtLjAzNyAxOS43MzYzIDE5LjczNjMgMCAwMC00Ljg4NTIgMS41MTUuMDY5OS4wNjk5IDAgMDAtLjAzMjEuMDI3N0MuNTMzNCA5LjA0NTgtLjMxOSAxMy41Nzk5LjA5OTIgMTguMDU3OGEuMDgyNC4wODI0IDAgMDAuMDMxMi4wNTYxYzIuMDUyOCAxLjUwNzYgNC4wNDEzIDIuNDIyOCA1Ljk5MjkgMy4wMjk0YS4wNzc3LjA3NzcgMCAwMC4wODQyLS4wMjc2Yy40NjE2LS42MzA0Ljg3MzEtMS4yOTUyIDEuMjI2LTEuOTk0MmEuMDc2LjA3NiAwIDAwLS4wNDE2LS4xMDU3Yy0uNjUyOC0uMjQ3Ni0xLjI3NDMtLjU0OTUtMS44NzIyLS44OTIzYS4wNzcuMDc3IDAgMDEtLjAwNzYtLjEyNzdjLjEyNTgtLjA5NDMuMjUxNy0uMTkyMy4zNzE4LS4yOTE0YS4wNzQzLjA3NDMgMCAwMS4wNzc2LS4wMTA1YzMuOTI3OCAxLjc5MzMgOC4xOCAxLjc5MzMgMTIuMDYxNCAwYS4wNzM5LjA3MzkgMCAwMS4wNzg1LjAwOTVjLjEyMDIuMDk5LjI0Ni4xOTgxLjM3MjguMjkyNGEuMDc3LjA3NyAwIDAxLS4wMDY2LjEyNzYgMTIuMjk4NiAxMi4yOTg2IDAgMDEtMS44NzMuODkxNC4wNzY2LjA3NjYgMCAwMC0uMDQwNy4xMDY3Yy4zNjA0LjY5OC43NzE5IDEuMzYyOCAxLjIyNSAxLjk5MzJhLjA3Ni4wNzYgMCAwMC4wODQyLjAyODZjMS45NjEtLjYwNjcgMy45NDk1LTEuNTIxOSA2LjAwMjMtMy4wMjk0YS4wNzcuMDc3IDAgMDAuMDMxMy0uMDU1MmMuNTAwNC01LjE3Ny0uODM4Mi05LjY3MzktMy41NDg1LTEzLjY2MDRhLjA2MS4wNjEgMCAwMC0uMDMxMi0uMDI4NnpNOC4wMiAxNS4zMzEyYy0xLjE4MjUgMC0yLjE1NjktMS4wODU3LTIuMTU2OS0yLjQxOSAwLTEuMzMzMi45NTU1LTIuNDE4OSAyLjE1Ny0yLjQxODkgMS4yMTA4IDAgMi4xNzU3IDEuMDk1MiAyLjE1NjggMi40MTkgMCAxLjMzMzItLjk1NTUgMi40MTg5LTIuMTU2OSAyLjQxODl6bTcuOTc0OCAwYy0xLjE4MjUgMC0yLjE1NjktMS4wODU3LTIuMTU2OS0yLjQxOSAwLTEuMzMzMi45NTU0LTIuNDE4OSAyLjE1NjktMi40MTg5IDEuMjEwOCAwIDIuMTc1NyAxLjA5NTIgMi4xNTY4IDIuNDE5IDAgMS4zMzMyLS45NDYgMi40MTg5LTIuMTU2OCAyLjQxODlaIi8+PC9zdmc+",
    "fullColor": false
  },
  {
    "key": "openai",
    "name": "OpenAI",
    "sigla": "AI",
    "cor": "#10a37f",
    "fg": "#ffffff",
    "pattern": "openai|chatgpt",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+T3BlbkFJPC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMjIuMjgxOSA5LjgyMTFhNS45ODQ3IDUuOTg0NyAwIDAgMC0uNTE1Ny00LjkxMDggNi4wNDYyIDYuMDQ2MiAwIDAgMC02LjUwOTgtMi45QTYuMDY1MSA2LjA2NTEgMCAwIDAgNC45ODA3IDQuMTgxOGE1Ljk4NDcgNS45ODQ3IDAgMCAwLTMuOTk3NyAyLjkgNi4wNDYyIDYuMDQ2MiAwIDAgMCAuNzQyNyA3LjA5NjYgNS45OCA1Ljk4IDAgMCAwIC41MTEgNC45MTA3IDYuMDUxIDYuMDUxIDAgMCAwIDYuNTE0NiAyLjkwMDFBNS45ODQ3IDUuOTg0NyAwIDAgMCAxMy4yNTk5IDI0YTYuMDU1NyA2LjA1NTcgMCAwIDAgNS43NzE4LTQuMjA1OCA1Ljk4OTQgNS45ODk0IDAgMCAwIDMuOTk3Ny0yLjkwMDEgNi4wNTU3IDYuMDU1NyAwIDAgMC0uNzQ3NS03LjA3Mjl6bS05LjAyMiAxMi42MDgxYTQuNDc1NSA0LjQ3NTUgMCAwIDEtMi44NzY0LTEuMDQwOGwuMTQxOS0uMDgwNCA0Ljc3ODMtMi43NTgyYS43OTQ4Ljc5NDggMCAwIDAgLjM5MjctLjY4MTN2LTYuNzM2OWwyLjAyIDEuMTY4NmEuMDcxLjA3MSAwIDAgMSAuMDM4LjA1MnY1LjU4MjZhNC41MDQgNC41MDQgMCAwIDEtNC40OTQ1IDQuNDk0NHptLTkuNjYwNy00LjEyNTRhNC40NzA4IDQuNDcwOCAwIDAgMS0uNTM0Ni0zLjAxMzdsLjE0Mi4wODUyIDQuNzgzIDIuNzU4MmEuNzcxMi43NzEyIDAgMCAwIC43ODA2IDBsNS44NDI4LTMuMzY4NXYyLjMzMjRhLjA4MDQuMDgwNCAwIDAgMS0uMDMzMi4wNjE1TDkuNzQgMTkuOTUwMmE0LjQ5OTIgNC40OTkyIDAgMCAxLTYuMTQwOC0xLjY0NjR6TTIuMzQwOCA3Ljg5NTZhNC40ODUgNC40ODUgMCAwIDEgMi4zNjU1LTEuOTcyOFYxMS42YS43NjY0Ljc2NjQgMCAwIDAgLjM4NzkuNjc2NWw1LjgxNDQgMy4zNTQzLTIuMDIwMSAxLjE2ODVhLjA3NTcuMDc1NyAwIDAgMS0uMDcxIDBsLTQuODMwMy0yLjc4NjVBNC41MDQgNC41MDQgMCAwIDEgMi4zNDA4IDcuODcyem0xNi41OTYzIDMuODU1OEwxMy4xMDM4IDguMzY0IDE1LjExOTIgNy4yYS4wNzU3LjA3NTcgMCAwIDEgLjA3MSAwbDQuODMwMyAyLjc5MTNhNC40OTQ0IDQuNDk0NCAwIDAgMS0uNjc2NSA4LjEwNDJ2LTUuNjc3MmEuNzkuNzkgMCAwIDAtLjQwNy0uNjY3em0yLjAxMDctMy4wMjMxbC0uMTQyLS4wODUyLTQuNzczNS0yLjc4MThhLjc3NTkuNzc1OSAwIDAgMC0uNzg1NCAwTDkuNDA5IDkuMjI5N1Y2Ljg5NzRhLjA2NjIuMDY2MiAwIDAgMSAuMDI4NC0uMDYxNWw0LjgzMDMtMi43ODY2YTQuNDk5MiA0LjQ5OTIgMCAwIDEgNi42ODAyIDQuNjZ6TTguMzA2NSAxMi44NjNsLTIuMDItMS4xNjM4YS4wODA0LjA4MDQgMCAwIDEtLjAzOC0uMDU2N1Y2LjA3NDJhNC40OTkyIDQuNDk5MiAwIDAgMSA3LjM3NTctMy40NTM3bC0uMTQyLjA4MDVMOC43MDQgNS40NTlhLjc5NDguNzk0OCAwIDAgMC0uMzkyNy42ODEzem0xLjA5NzYtMi4zNjU0bDIuNjAyLTEuNDk5OCAyLjYwNjkgMS40OTk4djIuOTk5NGwtMi41OTc0IDEuNDk5Ny0yLjYwNjctMS40OTk3WiIvPjwvc3ZnPg==",
    "fullColor": false
  },
  {
    "key": "claude",
    "name": "Claude",
    "sigla": "C",
    "cor": "#d97757",
    "fg": "#ffffff",
    "pattern": "anthropic|claude",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+Q2xhdWRlPC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJtNC43MTQ0IDE1Ljk1NTUgNC43MTc0LTIuNjQ3MS4wNzktLjIzMDctLjA3OS0uMTI3NWgtLjIzMDdsLS43ODkzLS4wNDg2LTIuNjk1Ni0uMDcyOS0yLjMzNzUtLjA5NzEtMi4yNjQ2LS4xMjE0LS41NzA3LS4xMjE1LS41MzQzLS43MDQyLjA1NDYtLjM1MjIuNDc5Ny0uMzIxOC42ODYuMDYwOCAxLjUxNzkuMTAzMiAyLjI3NjcuMTU3OCAxLjY1MTQuMDk3MiAyLjQ0NjguMjU1aC4zODg2bC4wNTQ2LS4xNTc5LS4xMzM2LS4wOTcxLS4xMDMyLS4wOTcyTDYuOTczIDkuODM1NmwtMi41NS0xLjY4NzktMS4zMzU2LS45NzE0LS43MjI1LS40OTE4LS4zNjQzLS40NjE0LS4xNTc4LTEuMDA3OC42NTU3LS43MjI1Ljg4MDMuMDYwNy4yMjQ2LjA2MDcuODkyNS42ODYgMS45MDY0IDEuNDc1NCAyLjQ4OTMgMS44MzM2LjM2NDMuMzAzNS4xNDU3LS4xMDMyLjAxODItLjA3MjgtLjE2NC0uMjczMy0xLjM1MzktMi40NDY3LTEuNDQ1LTIuNDg5My0uNjQzNS0xLjAzMi0uMTctLjYxOTRjLS4wNjA3LS4yNTUtLjEwMzItLjQ2NzQtLjEwMzItLjcyODVMNi4yODcuMTMzNSA2LjY5OTcgMGwuOTk1Ny4xMzM2LjQxOS4zNjQyLjYxOTIgMS40MTQ3IDEuMDAxOCAyLjIyODIgMS41NTQzIDMuMDI5Ni40NTUzLjg5ODUuMjQyOS44MzE4LjA5MS4yNTVoLjE1Nzl2LS4xNDU3bC4xMjc1LTEuNzA2LjIzNjgtMi4wOTQ3LjIzMDctMi42OTU3LjA3ODktLjc1ODkuMzc2NC0uOTEwNy43NDY4LS40OTE4LjU4MjguMjc5My40Nzk3LjY4Ni0uMDY2OC40NDMzLS4yODUzIDEuODUxNy0uNTU4NiAyLjkwMjEtLjM2NDMgMS45NDI5aC4yMTI1bC4yNDI5LS4yNDI5Ljk4MzUtMS4zMDUzIDEuNjUxNC0yLjA2NDMuNzI4Ni0uODE5Ni44NS0uOTA0Ni41NDY0LS40MzExaDEuMDMyMWwuNzU5IDEuMTI5My0uMzQgMS4xNjU3LTEuMDYyNSAxLjM0NzgtLjg4MDQgMS4xNDE0LTEuMjYyOCAxLjctLjc4OTMgMS4zNi4wNzI5LjEwOTMuMTg4Mi0uMDE4MyAyLjg1MzUtLjYwNyAxLjU0MjEtLjI3OTQgMS44Mzk2LS4zMTU3LjgzMTguMzg4Ni4wOTEuMzk0Ni0uMzI3OC44MDc1LTEuOTY3LjQ4NTctMi4zMDcyLjQ2MTQtMy40MzY0LjgxMzYtLjA0MjUuMDMwNC4wNDg2LjA2MDcgMS41NDgyLjE0NTcuNjYxOC4wMzY0aDEuNjIxbDMuMDE3NS4yMjQ3Ljc4OTIuNTIyLjQ3MzYuNjM3Ni0uMDc5LjQ4NTctMS4yMTQyLjYxOTMtMS42MzkzLS4zODg2LTMuODI1LS45MTA3LTEuMzExMy0uMzI3OWgtLjE4MjJ2LjEwOTNsMS4wOTI5IDEuMDY4NiAyLjAwMzUgMS44MDkyIDIuNTA3NSAyLjMzMTQuMTI3NS41NzY4LS4zMjE4LjQ1NTQtLjM0LS4wNDg2LTIuMjAzOS0xLjY1NzUtLjg1LS43NDY4LTEuOTI0Ni0xLjYyMWgtLjEyNzV2LjE3bC40NDMyLjY0OTYgMi4zNDM2IDMuNTIxNC4xMjE0IDEuMDgwNy0uMTcuMzUyMS0uNjA3MS4yMTI1LS42Njc5LS4xMjE0LTEuMzcyMS0xLjkyNDZMMTQuMzggMTcuOTU5bC0xLjE0MTQtMS45NDI4LS4xMzk3LjA3OS0uNjc0IDcuMjU1Mi0uMzE1Ni4zNzAzLS43Mjg2LjI3OTMtLjYwNzEtLjQ2MTQtLjMyMTgtLjc0NjguMzIxOC0xLjQ3NTMuMzg4Ni0xLjkyNDYuMzE1Ny0xLjUzLjI4NTMtMS45MDA0LjE3LS42MzE0LS4wMTIxLS4wNDI1LS4xMzk3LjAxODItMS40MzI4IDEuOTY3Mi0yLjE3OTYgMi45NDQ2LTEuNzI0MyAxLjg0NTYtLjQxMjguMTY0LS43MTY0LS4zNzA0LjA2NjctLjY2MTguNDAwOC0uNTg4OSAyLjM4Ni0zLjAzNTcgMS40Mzg5LTEuODgyLjkyOS0xLjA4NjgtLjAwNjItLjE1NzloLS4wNTQ2bC02LjMzODUgNC4xMTY0LTEuMTI5My4xNDU3LS40ODU3LS40NTU0LjA2MDgtLjc0NjcuMjMwNy0uMjQyOSAxLjkwNjQtMS4zMTE0WiIvPjwvc3ZnPg==",
    "fullColor": false
  },
  {
    "key": "crunchyroll",
    "name": "Crunchyroll",
    "sigla": "CR",
    "cor": "#f47521",
    "fg": "#ffffff",
    "pattern": "crunchyroll|crunchyro",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+Q3J1bmNoeXJvbGw8L3RpdGxlPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0yLjkwOSAxMy40MzZDMi45MTQgNy42MSA3LjY0MiAyLjg5MyAxMy40NjggMi44OThjNS41NzYuMDA1IDEwLjEzNyA0LjMzOSAxMC41MSA5LjgxOXEuMDIxLS4zNTEuMDIyLS43MDZDMjQuMDA3IDUuMzg1IDE4LjY0LjAwNiAxMi4wMTIgMFMuMDA3IDUuMzYgMCAxMS45ODggNS4zNiAyMy45OTQgMTEuOTg4IDI0cS40MTIgMCAuODE1LS4wMjdjLTUuNTI2LS4zMzgtOS45LTQuOTI4LTkuODk0LTEwLjUzOFptMTYuMjg0LjE1NWE0LjEgNC4xIDAgMCAxLTQuMDk1LTQuMTAzIDQuMSA0LjEgMCAwIDEgMi43MTItMy44NTUgOC45NSA4Ljk1IDAgMCAwLTQuMTg3LTEuMDM3IDkuMDA3IDkuMDA3IDAgMSAwIDguOTk3IDkuMDE2cS0uMDAxLS44NDctLjE1LTEuNjUxYTQuMSA0LjEgMCAwIDEtMy4yNzggMS42M1oiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "google",
    "name": "Google",
    "sigla": "G",
    "cor": "#4285f4",
    "fg": "#ffffff",
    "pattern": "google",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+R29vZ2xlPC90aXRsZT48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTIuNDggMTAuOTJ2My4yOGg3Ljg0Yy0uMjQgMS44NC0uODUzIDMuMTg3LTEuNzg3IDQuMTMzLTEuMTQ3IDEuMTQ3LTIuOTMzIDIuNC02LjA1MyAyLjQtNC44MjcgMC04LjYtMy44OTMtOC42LTguNzJzMy43NzMtOC43MiA4LjYtOC43MmMyLjYgMCA0LjUwNyAxLjAyNyA1LjkwNyAyLjM0N2wyLjMwNy0yLjMwN0MxOC43NDcgMS40NCAxNi4xMzMgMCAxMi40OCAwIDUuODY3IDAgLjMwNyA1LjM4Ny4zMDcgMTJzNS41NiAxMiAxMi4xNzMgMTJjMy41NzMgMCA2LjI2Ny0xLjE3MyA4LjM3My0zLjM2IDIuMTYtMi4xNiAyLjg0LTUuMjEzIDIuODQtNy42NjcgMC0uNzYtLjA1My0xLjQ2Ny0uMTczLTIuMDUzSDEyLjQ4eiIvPjwvc3ZnPg==",
    "fullColor": false
  },
  {
    "key": "apple",
    "name": "Apple",
    "sigla": "A",
    "cor": "#111111",
    "fg": "#ffffff",
    "pattern": "apple\\.com|itunes",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+QXBwbGU8L3RpdGxlPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0xMi4xNTIgNi44OTZjLS45NDggMC0yLjQxNS0xLjA3OC0zLjk2LTEuMDQtMi4wNC4wMjctMy45MSAxLjE4My00Ljk2MSAzLjAxNC0yLjExNyAzLjY3NS0uNTQ2IDkuMTAzIDEuNTE5IDEyLjA5IDEuMDEzIDEuNDU0IDIuMjA4IDMuMDkgMy43OTIgMy4wMzkgMS41Mi0uMDY1IDIuMDktLjk4NyAzLjkzNS0uOTg3IDEuODMxIDAgMi4zNS45ODcgMy45Ni45NDggMS42MzctLjAyNiAyLjY3Ni0xLjQ4IDMuNjc2LTIuOTQ4IDEuMTU2LTEuNjg4IDEuNjM2LTMuMzI1IDEuNjYyLTMuNDE1LS4wMzktLjAxMy0zLjE4Mi0xLjIyMS0zLjIyLTQuODU3LS4wMjYtMy4wNCAyLjQ4LTQuNDk0IDIuNTk3LTQuNTU5LTEuNDI5LTIuMDktMy42MjMtMi4zMjQtNC4zOS0yLjM3Ni0yLS4xNTYtMy42NzUgMS4wOS00LjYxIDEuMDl6TTE1LjUzIDMuODNjLjg0My0xLjAxMiAxLjQtMi40MjcgMS4yNDUtMy44My0xLjIwNy4wNTItMi42NjIuODA1LTMuNTMyIDEuODE4LS43OC44OTYtMS40NTQgMi4zMzgtMS4yNzMgMy43MTQgMS4zMzguMTA0IDIuNzE1LS42ODggMy41NTktMS43MDEiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "epicgames",
    "name": "Epic Games",
    "sigla": "EG",
    "cor": "#2a2a2a",
    "fg": "#ffffff",
    "pattern": "epic\\s?games",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+RXBpYyBHYW1lczwvdGl0bGU+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTMuNTM3IDBDMi4xNjUgMCAxLjY2LjUwNiAxLjY2IDEuODc5VjE4LjQ0YTQuMjYyIDQuMjYyIDAgMDAuMDIuNDMzYy4wMzEuMy4wMzcuNTkuMzE2LjkyLjAyNy4wMzMuMzExLjI0NS4zMTEuMjQ1LjE1My4wNzUuMjU4LjEzLjQzLjJsOC4zMzUgMy40OTFjLjQzMy4xOTkuNjE0LjI3Ni45MjguMjdoLjAwMmMuMzE0LjAwNi40OTUtLjA3MS45MjgtLjI3bDguMzM1LTMuNDkyYy4xNzItLjA3LjI3Ny0uMTI0LjQzLS4yIDAgMCAuMjg0LS4yMTEuMzExLS4yNDMuMjgtLjMzLjI4NS0uNjIxLjMxNi0uOTJhNC4yNjEgNC4yNjEgMCAwMC4wMi0uNDM0VjEuODc5YzAtMS4zNzMtLjUwNi0xLjg4LTEuODc4LTEuODh6bTEzLjM2NiAzLjExaC42OGMxLjEzOCAwIDEuNjg4LjU1MyAxLjY4OCAxLjY5NnYxLjg4aC0xLjM3NHYtMS44YzAtLjM2OS0uMTctLjU0LS41MjMtLjU0aC0uMjM1Yy0uMzY3IDAtLjUzNy4xNy0uNTM3LjUzOXY1LjgxYzAgLjM2OS4xNy41NC41MzcuNTRoLjI2MmMuMzUzIDAgLjUyMy0uMTcxLjUyMy0uNTRWOC42MTloMS4zNzN2Mi4xNDNjMCAxLjE0NC0uNTYyIDEuNzEtMS43IDEuNzFoLS42OTRjLTEuMTM4IDAtMS43LS41NjYtMS43LTEuNzFWNC44MmMwLTEuMTQ0LjU2Mi0xLjcwOSAxLjctMS43MDl6bS0xMi4xODYuMDhoMy4xMTR2MS4yNzRINi4xMTd2Mi42MDNoMS42NDh2MS4yNzVINi4xMTd2Mi43NzRoMS43NHYxLjI3NWgtMy4xNHptMy44MTYgMGgyLjE5OGMxLjEzOCAwIDEuNy41NjQgMS43IDEuNzA4djIuNDQ1YzAgMS4xNDQtLjU2MiAxLjcxLTEuNyAxLjcxaC0uNzk5djMuMzM4aC0xLjR6bTQuNTMgMGgxLjR2OS4yMDFoLTEuNHptLTMuMTMgMS4yMzV2My4zOTJoLjU3NWMuMzU0IDAgLjUyMy0uMTcxLjUyMy0uNTRWNC45NjVjMC0uMzY4LS4xNy0uNTQtLjUyMy0uNTR6bS0zLjc0IDEwLjE0N2ExLjcwOCAxLjcwOCAwIDAxLjU5MS4xMDggMS43NDUgMS43NDUgMCAwMS40OS4yOTlsLS40NTIuNTQ2YTEuMjQ3IDEuMjQ3IDAgMDAtLjMwOC0uMTk1LjkxLjkxIDAgMDAtLjM2My0uMDY4LjY1OC42NTggMCAwMC0uMjguMDYuNzAzLjcwMyAwIDAwLS4yMjQuMTYzLjc4My43ODMgMCAwMC0uMTUxLjI0My43OTkuNzk5IDAgMDAtLjA1Ni4yOTl2LjAwOGEuODUyLjg1MiAwIDAwLjA1Ni4zMS43LjcgMCAwMC4xNTcuMjQ1LjczNi43MzYgMCAwMC4yMzguMTYuNzc0Ljc3NCAwIDAwLjMwMy4wNTguNzkuNzkgMCAwMC40NDUtLjExNnYtLjMzOWgtLjU0OHYtLjU2NUg3LjM3djEuMjU1YTIuMDE5IDIuMDE5IDAgMDEtLjUyNC4zMDcgMS43ODkgMS43ODkgMCAwMS0uNjgzLjEyMyAxLjY0MiAxLjY0MiAwIDAxLS42MDItLjEwNyAxLjQ2IDEuNDYgMCAwMS0uNDc4LS4zIDEuMzcxIDEuMzcxIDAgMDEtLjMxOC0uNDU1IDEuNDM4IDEuNDM4IDAgMDEtLjExNS0uNTh2LS4wMDhhMS40MjYgMS40MjYgMCAwMS4xMTMtLjU3IDEuNDQ5IDEuNDQ5IDAgMDEuMzEyLS40NiAxLjQxOCAxLjQxOCAwIDAxLjQ3NC0uMzA5IDEuNTggMS41OCAwIDAxLjU5OC0uMTExIDEuNzA4IDEuNzA4IDAgMDEuMDQ1IDB6bTExLjk2My4wMDhhMi4wMDYgMi4wMDYgMCAwMS42MTIuMDk0IDEuNjEgMS42MSAwIDAxLjUwNy4yNzdsLS4zODYuNTQ2YTEuNTYyIDEuNTYyIDAgMDAtLjM5LS4yMDUgMS4xNzggMS4xNzggMCAwMC0uMzg4LS4wNy4zNDcuMzQ3IDAgMDAtLjIwOC4wNTIuMTU0LjE1NCAwIDAwLS4wNy4xMjd2LjAwOGEuMTU4LjE1OCAwIDAwLjAyMi4wODQuMTk4LjE5OCAwIDAwLjA3Ni4wNjYuODMxLjgzMSAwIDAwLjE0Ny4wNmMuMDYyLjAyLjE0LjA0LjIzNi4wNjFhMy4zODkgMy4zODkgMCAwMS40My4xMjIgMS4yOTIgMS4yOTIgMCAwMS4zMjguMTcuNjc4LjY3OCAwIDAxLjIwNy4yNC43MzkuNzM5IDAgMDEuMDcxLjMzN3YuMDA4YS44NjUuODY1IDAgMDEtLjA4MS4zODIuODIuODIgMCAwMS0uMjI5LjI4NSAxLjAzMiAxLjAzMiAwIDAxLS4zNTMuMTggMS42MDYgMS42MDYgMCAwMS0uNDYuMDYxIDIuMTYgMi4xNiAwIDAxLS43MS0uMTE2IDEuNzE4IDEuNzE4IDAgMDEtLjU5My0uMzQ2bC40My0uNTE0Yy4yNzcuMjIzLjU3OC4zMzUuOS4zMzVhLjQ1Ny40NTcgMCAwMC4yMzYtLjA1LjE1Ny4xNTcgMCAwMC4wODItLjE0MnYtLjAwOGEuMTUuMTUgMCAwMC0uMDItLjA3Ny4yMDQuMjA0IDAgMDAtLjA3My0uMDY2Ljc1My43NTMgMCAwMC0uMTQzLS4wNjIgMi40NSAyLjQ1IDAgMDAtLjIzMy0uMDYyIDUuMDM2IDUuMDM2IDAgMDEtLjQxMy0uMTEzIDEuMjYgMS4yNiAwIDAxLS4zMzEtLjE2LjcyLjcyIDAgMDEtLjIyMi0uMjQzLjczLjczIDAgMDEtLjA4Mi0uMzZ2LS4wMDhhLjg2My44NjMgMCAwMS4wNzQtLjM1OS43OTQuNzk0IDAgMDEuMjE0LS4yODMgMS4wMDcgMS4wMDcgMCAwMS4zNC0uMTg1IDEuNDIzIDEuNDIzIDAgMDEuNDQ4LS4wNjYgMi4wMDYgMi4wMDYgMCAwMS4wMjUgMHptLTkuMzU4LjAyNWguNzQybDEuMTgzIDIuODFoLS44MjVsLS4yMDMtLjQ5OUg4LjYyM2wtLjE5OC40OThoLS44MXptMi4xOTcuMDJoLjgxNGwuNjYzIDEuMDguNjYzLTEuMDhoLjgxNHYyLjc5aC0uNzY2di0xLjYwMmwtLjcxMSAxLjA5MWgtLjAxNmwtLjcwNy0xLjA4M3YxLjU5M2gtLjc1NHptMy40NjkgMGgyLjIzNXYuNjU4aC0xLjQ3M3YuNDIyaDEuMzM0di42MWgtMS4zMzR2LjQ0MmgxLjQ5M3YuNjU4aC0yLjI1NXptLTUuMy44OTdsLS4zMTUuNzkzaC42MjR6bS0xLjE0NSA1LjE5aDguMDE0bC00LjA5IDEuMzQ4eiIvPjwvc3ZnPg==",
    "fullColor": false
  },
  {
    "key": "canva",
    "name": "Canva",
    "sigla": "Ca",
    "cor": "#00c4cc",
    "fg": "#ffffff",
    "pattern": "canva",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+Q2FudmE8L3RpdGxlPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0xMiAwQzUuMzczIDAgMCA1LjM3MyAwIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyUzE4LjYyNyAwIDEyIDB6TTYuOTYyIDcuNjhjLjc1NCAwIDEuMzM3LjU0OSAxLjQwNSAxLjIuMDY5LjU4My0uMTcxIDEuMDk3LS44MjIgMS40MDYtLjM0My4xNzEtLjQ4LjE3Mi0uNTQ5LjA2OS0uMDM0LS4wNjkgMC0uMTM3LjA2OS0uMjA2LjYxNy0uNTE0LjYxNy0uOTI2LjU0OC0xLjUwOC0uMDM0LS4zNzgtLjMwOC0uNjE4LS41ODMtLjYxOC0xLjIgMC0yLjkxNCAyLjY3NC0yLjY3NCA0LjYyOS4xMDMuNzU0LjU0OSAxLjY0NiAxLjUwOSAxLjY0Ni4zMDggMCAuNjUtLjEwMy45Ni0uMjQuNS0uMjY0Ljc5OS0uNDcgMS4wOTctLjgtLjA3My0uODg1LjcwNC0yLjA0NiAxLjg1MS0yLjA0Ni41MTUgMCAuOTI2LjIwNS45Ni41ODMuMDY4LjUxNC0uMzc3LjU4Mi0uNTE0LjU4MnMtLjM3OC0uMDM0LS4zNzgtLjE3Yy0uMDM0LS4xMzguMzA5LS4wNy4yNzUtLjM3OC0uMDM1LS4yMDYtLjI0LS4yNzQtLjQ0Ni0uMjc0LS43MiAwLTEuMTMxLjk5NC0xLjAyOSAxLjYxMS4wMzUuMjc1LjE3Mi41NDkuNDQ3LjU0OS4yMDUgMCAuNTE0LS4zMS42MTctLjc1NS4wNjgtLjMwOC4zNDMtLjUxNC41ODMtLjUxNC4xMDIgMCAuMTcuMDM0LjIwNS4xNzF2LjEzOGMtLjAzNC4xMzctLjEzNy41NDgtLjEwMi42NTEgMCAuMDY5LjAzNC4xNzEuMTcuMTcxLjA5MiAwIC40MzYtLjE4Ljc3Ny0uNDU5LjExNy0uNTkuMjUzLTEuMjk4LjI1My0xLjM1Ny4wMzQtLjI0LjEzNy0uNDguNjE3LS40OC4xMDMgMCAuMTcxLjAzNC4yMDUuMTcxdi4xMzhsLS4xMzYuNjE3Yy40NDUtLjU4MyAxLjA5Ny0uOTk0IDEuNTA4LS45OTQuMTcyIDAgLjMwOS4xMDIuMzA5LjI3NCAwIC4xMDMgMCAuMjc0LS4wNjkuNDQ2LS4xMzcuMzc3LS4zMDkuOTYtLjQxMiAxLjQ3NCAwIC4xMzcuMDM1LjI3NC4yMDcuMjc0LjE3MSAwIC42ODUtLjIwNiAxLjA5Ni0uNzU0bC4wMDctLjAwNGMtLjAwMi0uMDY4LS4wMDctLjEzNC0uMDA3LS4yMDIgMC0uNDExLjAzNS0uNzU0LjEwNC0uOTk0LjA2OC0uMjc0LjQxMS0uNTE0LjYxNy0uNTE0LjEwMyAwIC4yMDUuMDY5LjIwNS4xNzEgMCAuMDM1IDAgLjEwMy0uMDM0LjEzNy0uMTM3LjQ0Ni0uMjQuODU3LS4yNCAxLjI2OSAwIC4yNC4wMzQuNTgyLjEwMi43ODggMCAuMDM0LjAzNS4wNjkuMDcuMDY5LjA2OCAwIC41NDgtLjQ0NS44OS0xLjAyOC0uMzA4LS4yMDYtLjQ4LS41NDktLjQ4LS45NiAwLS43Mi40NDYtMS4wOTcuODU4LTEuMDk3LjM0MyAwIC42MTcuMjQuNjE3LjcyIDAgLjMwOC0uMTAzLjY1LS4yNzQuOTZoLjEwMmEuNzcuNzcgMCAwIDAgLjU4NC0uMjQuMjkzLjI5MyAwIDAgMSAuMTM0LS4xMTdjLjMzNS0uNDI1LjgzLS43NCAxLjQxLS43NC40OCAwIC45MjQuMjA1Ljk1OS41ODIuMDY4LjUxNS0uMzc4LjYxOC0uNTE1LjYxOGwtLjAwMi0uMDAyYy0uMTM4IDAtLjM3Ny0uMDM1LS4zNzctLjE3MiAwLS4xMzcuMzA5LS4wNjguMjc0LS4zNzYtLjAzNC0uMjA2LS4yNC0uMjc1LS40NDYtLjI3NS0uNjg2IDAtMS4xMy44OTEtMS4wMjggMS42MTEuMDM0LjI3NS4xNzEuNTgzLjQ0NS41ODMuMjA2IDAgLjUxNS0uMzA4LjY1Mi0uNzU0LjA2OC0uMjc0LjM0My0uNTE0LjU4My0uNTE0LjEwMyAwIC4xNy4wMzQuMjA1LjE3MSAwIC4wNjkgMCAuMjA2LS4xMzcuNjUyLS4xNy4zMDgtLjE3MS40OC0uMTM3LjYxNy4wMzQuMjc0LjE3MS40OC4zMDkuNTgzLjAzNC4wMzQuMDY4LjEwMi4wNjguMTAyIDAgLjA2OS0uMDM0LjEzOC0uMTM3LjEzOC0uMDM0IDAtLjA2OCAwLS4xMDMtLjAzNS0uNTE0LS4yMDUtLjcyLS41NDgtLjc4OS0uODkxLS4yMDUuMjQtLjQ0NS4zNzctLjcyLjM3Ny0uNDQ1IDAtLjg5LS40MTEtLjk2LS45MjZhMS42MDkgMS42MDkgMCAwIDEgLjA3NS0uNjQ5Yy0uMjAzLjEzLS40MjIuMjAzLS42MjMuMjAzaC0uMTdjLS40NDcuNjUyLS45MjcgMS4wOTgtMS4yNyAxLjMwM2EuODk2Ljg5NiAwIDAgMS0uMzc3LjEwNGMtLjA2OCAwLS4xNzEtLjAzNS0uMjA1LS4xMDQtLjA5NS0uMTUyLS4xNTYtLjM5Mi0uMTkzLS42NjctLjQ4MS41MjctMS4xNDUuODA1LTEuNDUzLjgwNS0uMzQzIDAtLjU0OC0uMjA2LS41ODItLjU1di0uMzc2Yy4xMDItLjc1NC4zNzctMS4yLjM3Ny0xLjMzN2EuMDc0LjA3NCAwIDAgMC0uMDY5LS4wN2MtLjI0IDAtMS4wMjguODI0LTEuMTY2IDEuMzczbC0uMTAzLjQ0NWMtLjA2OC4zMDktLjM3Ny41MTUtLjU4Mi41MTUtLjEwMyAwLS4xNzItLjAzNS0uMjA2LS4xNzJ2LS4xMzdsLjA0Ni0uMjMzYy0uNDM1LjMxLS44Ny41MDgtMS4wNzUuNTA4LS4zMDggMC0uNDgtLjE3Mi0uNTE0LS40MTItLjIwNi4yNzQtLjQ0NS40MTItLjc1NC40MTItLjM1MiAwLS42OTYtLjI0LS44NjItLjU5My0uMjQ0LjI3NS0uNTIzLjU1My0uODUyLjc2NC0uNDguMzA5LTEuMDI4LjU0OS0xLjY4LjU0OS0uNTgyIDAtMS4wOTctLjMwOS0xLjM3MS0uNTgzLS40MTItLjM3Ny0uNjUxLS45Ni0uNjg2LTEuNTA5LS4yMDUtMS42OC44MjMtMy44NCAyLjQtNC44LjM3OC0uMjA1Ljc1NS0uMzQzIDEuMTMyLS4zNDN6bTkuNzcgMy4yOTFjLS4xMDQgMC0uMTcyLjE3Mi0uMTcyLjM0MyAwIC4yNzQuMTM3LjU4My4zMDkuNzU1YTEuNzQgMS43NCAwIDAgMCAuMTAyLS41ODNjMC0uMzQzLS4xMzctLjUxNS0uMjQtLjUxNXoiLz48L3N2Zz4=",
    "fullColor": false
  },
  {
    "key": "vivo",
    "name": "Vivo",
    "sigla": "V",
    "cor": "#660099",
    "fg": "#ffffff",
    "pattern": "telefonica|\\bvivo\\b",
    "src": "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+dml2bzwvdGl0bGU+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTE5LjYwNCAxNC4xMDFjLTEuMTU5IDAtMS4yNjItLjk1LTEuMjYyLTEuMjQgMC0uMjkuMTAzLTEuMjQyIDEuMjYyLTEuMjQyaDIuMDYyYzEuMTYgMCAxLjI2My45NTEgMS4yNjMgMS4yNDIgMCAuMjktLjEwNCAxLjI0LTEuMjYzIDEuMjRtLTIuMDYyLTMuNTI3Yy0yLjE0MiAwLTIuMzMzIDEuNzUyLTIuMzMzIDIuMjg3IDAgLjUzNS4xOSAyLjI4NiAyLjMzMyAyLjI4NmgyLjA2MmMyLjE0MyAwIDIuMzM0LTEuNzUxIDIuMzM0LTIuMjg2IDAtLjUzNS0uMTktMi4yODctMi4zMzQtMi4yODdtLTUuNDc3LjEwN2MtLjI4NiAwLS4zNDUuMDUtLjQ1Ni4yMTMtLjExLjE2NC0yLjAyMiAzLjA4Mi0yLjAyMiAzLjA4Mi0uMDYuMDktLjEyNi4xMjYtLjIwNi4xMjYtLjA4IDAtLjE0NS0uMDM2LS4yMDYtLjEyNiAwIDAtMS45MTItMi45MTgtMi4wMjItMy4wODItLjExLS4xNjQtLjE3LS4yMTMtLjQ1Ni0uMjEzaC0uNjY4Yy0uMTU0IDAtLjIyNC4xMi0uMTI3LjI2N2wyLjI4MyAzLjQ2N2MuMzU0LjUyMS42MTQuNzMyIDEuMTk2LjczMnMuODQyLS4yMSAxLjE5Ni0uNzMybDIuMjg0LTMuNDY3Yy4wOTYtLjE0Ni4wMjYtLjI2Ny0uMTI4LS4yNjdtLTguODc2LjI4NGMwLS4yMDMuMDgtLjI4NC4yODMtLjI4NGguNTA1Yy4yMDMgMCAuMjgzLjA4LjI4My4yODN2My45YzAgLjIwMi0uMDguMjgzLS4yODMuMjgzaC0uNTA1Yy0uMjAzIDAtLjI4My0uMDgtLjI4My0uMjgzem0tMS43NjktLjI4NWMtLjI4NyAwLS4zNDYuMDUtLjQ1Ni4yMTMtLjExLjE2NC0yLjAyMiAzLjA4Mi0yLjAyMiAzLjA4Mi0uMDYxLjA5LS4xMjYuMTI2LS4yMDYuMTI2LS4wOCAwLS4xNDUtLjAzNi0uMjA2LS4xMjYgMCAwLTEuOTEyLTIuOTE4LTIuMDIzLTMuMDgyLS4xMS0uMTY0LS4xNjktLjIxMy0uNDU1LS4yMTNILjE3NWMtLjE3MSAwLS4yMjQuMTItLjEyNy4yNjdsMi4yODMgMy40NjdjLjM1NS41MjEuNjE1LjczMiAxLjE5Ny43MzIuNTgyIDAgLjg0Mi0uMjEgMS4xOTYtLjczMmwyLjI4My0zLjQ2N2MuMDk3LS4xNDYuMDQ0LS4yNjctLjEyNy0uMjY3bTEuMDU1LS44OTNjLS4xNjUtLjE2NC0uMTY1LS4yOTUgMC0uNDZsLjM1MS0uMzUxYy4xNjUtLjE2NS4yOTYtLjE2NS40NiAwbC4zNTIuMzUxYy4xNjUuMTY1LjE2NS4yOTYgMCAuNDZsLS4zNTIuMzUyYy0uMTY0LjE2NS0uMjk1LjE2NS0uNDYgMHoiLz48L3N2Zz4=",
    "fullColor": false
  }
];
  const normalize = (name) => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const patterns = entries.map((entry) => [new RegExp(entry.pattern), entry]);
  window.BRAND_LOGOS = {
    forMark: (mark) => mark && entries.find((e) => e.sigla === mark.sigla && e.cor === mark.cor),
    forName: (name) => { const n = normalize(name); const match = patterns.find(([re]) => re.test(n)); return match ? match[1] : null; }
  };
})();
