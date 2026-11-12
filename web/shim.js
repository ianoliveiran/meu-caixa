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

  function showLogin(msg, isError) {
    root.innerHTML = '<div class="login"><section class="panel">' +
      '<div class="brandline">' + logo + '<div><h1>Meu Caixa</h1><span class="sub">Entre para ver suas finanças</span></div></div>' +
      '<form id="login-form"><div class="field"><label for="lemail">E-mail</label><input id="lemail" type="email" autocomplete="username" required></div>' +
      '<div class="field"><label for="lsenha">Senha</label><input id="lsenha" type="password" autocomplete="current-password" required minlength="10"><small>No primeiro acesso, escolha uma senha com pelo menos 10 caracteres.</small></div>' +
      (msg ? '<div class="msg ' + (isError === false ? 'ok' : 'err') + '" role="status">' + esc(msg) + '</div>' : '') +
      '<div class="actions"><button class="btn primary" type="submit" data-modo="entrar">Entrar</button><button class="btn" type="submit" data-modo="criar">Primeiro acesso: criar senha</button></div></form></section></div>';
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
  if (session) startApp(); else showLogin();
})();
