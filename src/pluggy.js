'use strict';
// Cliente mínimo da API da Pluggy (somente leitura).
// Usa os mesmos endpoints do SDK oficial: POST /auth, GET /items/:id,
// GET /accounts?itemId=, GET /v2/transactions (cursor) e GET /bills?accountId=.

const BASE = 'https://api.pluggy.ai';

class PluggyError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

class PluggyClient {
  constructor(clientId, clientSecret, fetchImpl) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.fetch = fetchImpl || globalThis.fetch;
    this.apiKey = null;
    this.apiKeyAt = 0;
  }

  async auth() {
    // A chave dura 2 horas; renovamos com folga.
    if (this.apiKey && Date.now() - this.apiKeyAt < 90 * 60 * 1000) return this.apiKey;
    const res = await this.fetch(BASE + '/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ clientId: this.clientId, clientSecret: this.clientSecret, nonExpiring: false })
    });
    if (!res.ok) {
      throw new PluggyError(
        res.status === 401 || res.status === 403
          ? 'A Pluggy recusou o Client ID ou o Client Secret. Confira os dois em Bancos e ajustes.'
          : 'Não foi possível entrar na Pluggy (erro ' + res.status + ').',
        res.status
      );
    }
    const body = await res.json();
    this.apiKey = body.apiKey;
    this.apiKeyAt = Date.now();
    return this.apiKey;
  }

  async get(path, params) {
    const key = await this.auth();
    const qs = params
      ? '?' + Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
          .join('&')
      : '';
    const res = await this.fetch(BASE + '/' + path + qs, {
      headers: { 'X-API-KEY': key, Accept: 'application/json' }
    });
    if (res.status === 401) {
      this.apiKey = null;
      throw new PluggyError('A sessão com a Pluggy expirou. Tente sincronizar de novo.', 401);
    }
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (e) { /* sem corpo */ }
      throw new PluggyError('A Pluggy respondeu com erro ' + res.status + (detail ? ': ' + detail : '') + '.', res.status);
    }
    return res.json();
  }

  fetchItem(itemId) {
    return this.get('items/' + encodeURIComponent(itemId));
  }

  async fetchAccounts(itemId) {
    const body = await this.get('accounts', { itemId });
    return body.results || [];
  }

  async fetchAllTransactions(accountId, dateFrom) {
    const out = [];
    let after;
    for (let guard = 0; guard < 200; guard++) {
      const body = await this.get('v2/transactions', { accountId, dateFrom, after });
      out.push(...(body.results || []));
      if (!body.next) break;
      after = new URL(body.next, BASE).searchParams.get('after');
      if (!after) break;
    }
    return out;
  }

  async fetchBills(accountId) {
    try {
      const body = await this.get('bills', { accountId });
      return body.results || [];
    } catch (e) {
      // Nem todo banco expõe faturas fechadas; seguimos sem elas.
      return [];
    }
  }
}

module.exports = { PluggyClient, PluggyError };
