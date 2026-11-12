'use strict';
// Liga a interface ao servidor: login no Supabase e chamadas para /api/rpc.
(function () {
  const C = window.MEUCAIXA_CONFIG || {};
  const KEY = 'meucaixa-sessao';
  const root = document.getElementById('root');
  let session = null;
  let listeners = [];
  let syncing = false;
  let staleTried = false;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function readSession() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function writeSession(s) { session = s; try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) { /* sem armazenamento */ } }

  async function authCall(path, body, token) {
    const res = await fetch(C.supabaseUrl + '/auth/v1/' + path, {
      method: 'POST',
      headers: Object.assign({ apikey: C.supabaseKey, 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: JSON.stringify(body || {})
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* sem corpo */ }
    return { ok: res.ok, status: res.status, data };
  }
  function keep(data) {
    writeSession({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000, email: data.user && data.user.email });
  }
  async function token() {
    if (!session) return null;
    if (Date.now() > session.expires_at - 60000) {
      const r = await authCall('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
      if (!r.ok) { writeSession(null); return null; }
      keep(r.data);
    }
    return session.access_token;
  }

  async function rpc(action, arg) {
    const t = await token();
    if (!t) { showLogin('Sua sessão terminou. Entre de novo.'); throw new Error('login'); }
    const res = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ action, arg }) });
    if (res.status === 401) { writeSession(null); showLogin('Sua sessão terminou. Entre de novo.'); throw new Error('login'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data.error || 'O servidor não respondeu. Tente de novo.' };
    return data.result;
  }
  const call = (action) => (arg) => rpc(action, arg);
  const notify = (d) => listeners.forEach((fn) => { try { fn(d); } catch (e) { /* ignora */ } });

  async function backgroundSync() {
    syncing = true;
    notify({ syncing: true });
    try { await rpc('sync:now'); } catch (e) { /* mostra no painel */ }
    syncing = false;
    notify({ syncing: false });
  }

  window.caixa = {
    getModel: async (month) => {
      const m = await rpc('model:get', month);
      if (m && m.sync) {
        m.sync.syncing = syncing;
        if (m.sync.stale && !staleTried && !syncing) { staleTried = true; setTimeout(backgroundSync, 50); }
      }
      return m;
    },
    syncNow: async () => { syncing = true; try { return await rpc('sync:now'); } finally { syncing = false; } },
    saveSecrets: call('secrets:save'),
    addItem: call('items:add'),
    removeItem: call('items:remove'),
    saveSettings: call('settings:save'),
    saveBill: call('bills:save'),
    removeBill: call('bills:remove'),
    markBill: call('bill:mark'),
    setCategory: call('tx:category'),
    saveCatRule: call('catrule:save'),
    removeCatRule: call('catrule:remove'),
    saveManual: call('manual:save'),
    removeManual: call('manual:remove'),
    addCompra: call('manual:compra'),
    removeCompra: call('manual:compraRemove'),
    startDemo: call('demo:start'),
    stopDemo: call('demo:stop'),
    importDesktop: call('import:desktop'),
    openExternal: async (url) => { if (/^https:\/\//.test(url)) window.open(url, '_blank', 'noopener'); return { ok: true }; },
    onChange: (fn) => { listeners.push(fn); return () => { listeners = listeners.filter((x) => x !== fn); }; },
    email: () => (session && session.email) || '',
    logout: async () => {
      const t = session && session.access_token;
      writeSession(null);
      if (t) authCall('logout', {}, t).catch(() => {});
      location.reload();
    }
  };

  function loadScript(src) {
    return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.body.appendChild(s); });
  }
  async function startApp() {
    root.innerHTML = '<div class="loading">Abrindo seu caixa...</div>';
    await loadScript('art.js');
    await loadScript('app.js');
  }

  const logo = '<svg aria-hidden="true" width="44" height="44" viewBox="0 0 64 64"><defs><radialGradient id="lgB2" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#ff9ccf"/><stop offset="1" stop-color="#e5368f"/></radialGradient><radialGradient id="lgC2" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff3a3"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs><rect x="14" y="47" width="8" height="12" rx="3.5" fill="#c41f73"/><rect x="38" y="47" width="8" height="12" rx="3.5" fill="#c41f73"/><ellipse cx="31" cy="36" rx="25" ry="19" fill="url(#lgB2)"/><path d="M17 22l-3-11 12 6z" fill="#e5368f"/><ellipse cx="55" cy="37" rx="7" ry="8" fill="#ff7ab8" stroke="#c41f73" stroke-width="1.5"/><circle cx="44" cy="29" r="2.6" fill="#4a0a2c"/><rect x="23" y="17.5" width="15" height="4" rx="2" fill="#8a1050"/><circle cx="30.5" cy="10" r="8.5" fill="url(#lgC2)" stroke="#b45309" stroke-width="2"/></svg>';

  const gIcon = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function googleLogin() {
    location.href = C.supabaseUrl + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.origin + '/');
  }

  // Volta do Google: o Supabase devolve a sessão no endereço (#access_token=...).
  async function fromRedirect() {
    const h = new URLSearchParams(location.hash.slice(1));
    const q = new URLSearchParams(location.search);
    if (!h.get('access_token') && !h.get('error') && !q.get('error')) return false;
    history.replaceState(null, '', location.pathname);
    const err = h.get('error_description') || q.get('error_description') || h.get('error') || q.get('error');
    if (err) {
      showLogin(/database error|saving new user|fechado/i.test(err) ? 'Essa conta do Google não tem acesso a este Meu Caixa.' : 'Não consegui entrar com o Google: ' + err.replace(/\+/g, ' '));
      return true;
    }
    const data = { access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: Number(h.get('expires_in')) || 3600 };
    try {
      const res = await fetch(C.supabaseUrl + '/auth/v1/user', { headers: { apikey: C.supabaseKey, Authorization: 'Bearer ' + data.access_token } });
      if (res.ok) data.user = await res.json();
    } catch (e) { /* segue sem e-mail */ }
    keep(data);
    startApp();
    return true;
  }

  function showLogin(msg, isError) {
    root.innerHTML = '<div class="login"><section class="panel">' +
      '<div class="brandline">' + logo + '<div><h1>Meu Caixa</h1><span class="sub">Entre para ver suas finanças</span></div></div>' +
      '<button type="button" class="btn primary google" id="google">' + gIcon + 'Entrar com Google</button>' +
      (msg ? '<div class="msg ' + (isError === false ? 'ok' : 'err') + '" role="status">' + esc(msg) + '</div>' : '') +
      '<details class="senha"' + (/senha|E-mail|caracteres|criar a conta/.test(msg || '') ? ' open' : '') + '><summary>Entrar com e-mail e senha</summary>' +
      '<form id="login-form"><div class="field"><label for="lemail">E-mail</label><input id="lemail" type="email" autocomplete="username" required></div>' +
      '<div class="field"><label for="lsenha">Senha</label><input id="lsenha" type="password" autocomplete="current-password" required minlength="10"><small>No primeiro acesso, escolha uma senha com pelo menos 10 caracteres.</small></div>' +
      '<div class="actions"><button class="btn" type="submit" data-modo="entrar">Entrar</button><button class="btn" type="submit" data-modo="criar">Primeiro acesso: criar senha</button></div></form></details></section></div>';
    document.getElementById('google').addEventListener('click', googleLogin);
    const form = document.getElementById('login-form');
    let modo = 'entrar';
    form.querySelectorAll('button[data-modo]').forEach((b) => b.addEventListener('click', () => { modo = b.dataset.modo; }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('lemail').value.trim();
      const password = document.getElementById('lsenha').value;
      form.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      if (modo === 'criar') {
        if (password.length < 10) { showLogin('Use pelo menos 10 caracteres na senha.'); return; }
        const r = await authCall('signup', { email, password });
        if (!r.ok) {
          const m = String((r.data && (r.data.msg || r.data.message || r.data.error_description)) || '');
          if (/already registered|already exists/i.test(m)) return showLogin('Esse e-mail já tem senha. Use Entrar.');
          if (/database error|saving new user|fechado/i.test(m) || r.status === 500) return showLogin('Esse e-mail não tem acesso a este Meu Caixa.');
          return showLogin(m || 'Não consegui criar a conta.');
        }
      }
      const r = await authCall('token?grant_type=password', { email, password });
      if (!r.ok) return showLogin(modo === 'criar' ? 'Conta criada, mas não consegui entrar. Tente Entrar.' : 'E-mail ou senha errados.');
      keep(r.data);
      startApp();
    });
  }

  if (!C.supabaseUrl || !C.supabaseKey) {
    root.innerHTML = '<div class="loading">Falta configurar o Supabase neste site.</div>';
    return;
  }
  session = readSession();
  fromRedirect().then((handled) => { if (handled) return; if (session) startApp(); else showLogin(); });
})();
