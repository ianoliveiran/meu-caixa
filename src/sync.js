'use strict';
// Busca contas, transações e faturas na Pluggy e grava no banco local.
// Na primeira vez traz ~200 dias. Depois, refaz só os últimos 20 dias, que é onde
// compras pendentes viram definitivas e às vezes mudam de valor.

const FIRST_DAYS = 200;
const OVERLAP_DAYS = 20;

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function slimTx(t) {
  const pd = t.paymentData || null;
  const party = (p) => (p ? { name: p.name || null, documentNumber: p.documentNumber ? { type: p.documentNumber.type, value: p.documentNumber.value } : undefined } : undefined);
  return {
    id: t.id,
    accountId: t.accountId,
    date: t.date,
    description: t.description,
    descriptionRaw: t.descriptionRaw || null,
    type: t.type,
    amount: t.amount,
    category: t.category || null,
    status: t.status || null,
    paymentData: pd ? { paymentMethod: pd.paymentMethod || null, payer: party(pd.payer), receiver: party(pd.receiver) } : null,
    creditCardMetadata: t.creditCardMetadata || null,
    merchant: t.merchant ? { name: t.merchant.name || null, businessName: t.merchant.businessName || null } : null,
    createdAt: t.createdAt || null
  };
}

function slimBill(b) {
  return {
    id: b.id,
    dueDate: b.dueDate,
    billClosingDate: b.billClosingDate || null,
    totalAmount: b.totalAmount,
    payments: (b.payments || []).map((p) => ({ amount: p.amount, paymentDate: p.paymentDate, paymentMode: p.paymentMode || null }))
  };
}

async function syncAll(db, client, onProgress) {
  const items = (db.settings.items || []).filter((x) => x && x.id);
  if (!items.length) throw new Error('Nenhum banco cadastrado ainda. Adicione os códigos das conexões em Bancos e ajustes.');
  await client.auth();
  const now = new Date();
  const errors = [];
  const before = new Set(Object.keys(db.transactions || {}));

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const rec = Object.assign({ id: it.id }, db.items[it.id] || {});
    if (onProgress) onProgress({ step: i + 1, total: items.length, label: it.label || rec.connectorName || 'banco' });
    try {
      try {
        const item = await client.fetchItem(it.id);
        rec.connectorName = (item.connector && item.connector.name) || rec.connectorName || it.label || null;
        rec.status = item.status || null;
        rec.lastUpdatedAt = item.lastUpdatedAt || item.updatedAt || null;
        rec.consentExpiresAt = item.consentExpiresAt || (item.consents && item.consents[0] && item.consents[0].expiresAt) || rec.consentExpiresAt || null;
        rec.error = item.error && item.error.message ? item.error.message : null;
      } catch (e) {
        if (e.status === 404) throw new Error('não encontrei essa conexão na Pluggy. Confira o código');
        // Algumas contas pessoais não liberam os detalhes da conexão; seguimos com as contas.
        rec.status = rec.status || null;
      }
      const accounts = await client.fetchAccounts(it.id);
      for (const a of accounts) {
        db.accounts[a.id] = Object.assign({}, a, { itemId: it.id });
        const last = db.accountSync[a.id] ? new Date(db.accountSync[a.id]) : null;
        const from = last
          ? new Date(last.getFullYear(), last.getMonth(), last.getDate() - OVERLAP_DAYS)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate() - FIRST_DAYS);
        const txs = await client.fetchAllTransactions(a.id, ymd(from));
        for (const [id, t] of Object.entries(db.transactions)) {
          if (t.accountId === a.id && new Date(t.date) >= from) delete db.transactions[id];
        }
        for (const t of txs) db.transactions[t.id] = slimTx(t);
        if (a.type === 'CREDIT') db.billsByAccount[a.id] = (await client.fetchBills(a.id)).map(slimBill);
        db.accountSync[a.id] = now.toISOString();
      }
      rec.syncedAt = now.toISOString();
      rec.error = rec.error || null;
    } catch (e) {
      rec.error = e.message;
      errors.push((it.label || rec.connectorName || 'Um banco') + ': ' + e.message);
    }
    db.items[it.id] = rec;
  }

  db.lastSync = now.toISOString();
  db.lastSyncError = errors.length ? errors.join(' · ') : null;
  const novas = Object.keys(db.transactions).filter((id) => !before.has(id));
  return { novas, errors };
}

function removeItem(db, itemId) {
  const accIds = Object.values(db.accounts).filter((a) => a.itemId === itemId).map((a) => a.id);
  for (const id of accIds) {
    delete db.accounts[id];
    delete db.billsByAccount[id];
    delete db.accountSync[id];
  }
  for (const [id, t] of Object.entries(db.transactions)) if (accIds.includes(t.accountId)) delete db.transactions[id];
  delete db.items[itemId];
}

module.exports = { syncAll, removeItem, slimTx };
