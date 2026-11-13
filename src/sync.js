'use strict';
// Busca contas, transações e faturas na Pluggy e grava no banco local.
// Na primeira vez traz ~200 dias. Depois, refaz só os últimos 20 dias, que é onde
// compras pendentes viram definitivas e às vezes mudam de valor.

const FIRST_DAYS = 200;
// Uma vez por conta, tenta trazer o histórico mais antigo que o banco ainda tiver (até 1 ano).
const BACKFILL_DAYS = 365;
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
  if (!db.backfill) db.backfill = {};
  // Lançamentos de bancos removidos: se o mesmo banco for conectado de novo, não duplica.
  const archivedIdx = new Map();
  for (const t of Object.values(db.transactions)) {
    const acc = db.accounts[t.accountId];
    if (!acc || !acc.arquivada) continue;
    const k = dupKey(acc.bankLabel, acc.type, t);
    if (!archivedIdx.has(k)) archivedIdx.set(k, []);
    archivedIdx.get(k).push(t.id);
  }

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
        if (e.status === 404) throw new Error('a Pluggy não achou esse Item ID com o seu Client ID. Ele precisa ser copiado do Demo da mesma aplicação de onde vieram o Client ID e o Client Secret (e é o código do MeuPluggy, não do site meu.pluggy.ai)');
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
        const fresh = new Set(txs.map((t) => t.id));
        const freshList = txs.map(slimTx);
        // Nada é apagado só porque o banco parou de mandar. Só sai o que foi claramente substituído:
        // uma compra pendente (que vira definitiva com outro código) ou uma que voltou igual com outro código.
        for (const [id, t] of Object.entries(db.transactions)) {
          if (t.accountId !== a.id || new Date(t.date) < from || fresh.has(id)) continue;
          if (t.status === 'PENDING' || replacedBy(t, freshList)) delete db.transactions[id];
          else if (!t.sumiuEm) t.sumiuEm = now.toISOString();
        }
        const label = it.label || rec.connectorName || '';
        for (const t of freshList) {
          db.transactions[t.id] = t;
          const old = archivedIdx.get(dupKey(label, a.type, t));
          if (old && old.length) delete db.transactions[old.shift()];
        }
        // Histórico mais antigo, uma vez por conta: só acrescenta o que ainda não temos.
        if (!db.backfill[a.id]) {
          try {
            const oldFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - BACKFILL_DAYS);
            const firstHave = Object.values(db.transactions).filter((t) => t.accountId === a.id).reduce((m, t) => (new Date(t.date) < m ? new Date(t.date) : m), now);
            if (firstHave - oldFrom > 7 * 86400000) {
              const older = await client.fetchAllTransactions(a.id, ymd(oldFrom), ymd(firstHave));
              for (const raw of older) {
                if (db.transactions[raw.id]) continue;
                const t = slimTx(raw);
                const dup = archivedIdx.get(dupKey(label, a.type, t));
                if (dup && dup.length) delete db.transactions[dup.shift()];
                db.transactions[t.id] = t;
              }
            }
            db.backfill[a.id] = now.toISOString();
          } catch (e) { /* tenta de novo na próxima */ }
        }
        if (a.type === 'CREDIT') db.billsByAccount[a.id] = (await client.fetchBills(a.id)).map(slimBill);
        db.accountSync[a.id] = now.toISOString();
      }
      rec.syncedAt = now.toISOString();
      rec.error = rec.error || null;
    } catch (e) {
      rec.error = e.message;
      errors.push((it.label || rec.connectorName || 'Banco ' + String(it.id).slice(0, 8)) + ': ' + e.message);
    }
    db.items[it.id] = rec;
  }

  db.lastSync = now.toISOString();
  db.lastSyncError = errors.length ? errors.join(' · ') : null;
  const novas = Object.keys(db.transactions).filter((id) => !before.has(id));
  return { novas, errors };
}

// Remover um banco não apaga o histórico: as contas viram "arquivadas" (fora dos saldos)
// e os lançamentos continuam. Se o banco voltar com outro código, os repetidos são trocados pelos novos.
function removeItem(db, itemId) {
  const label = ((db.settings.items || []).find((x) => x.id === itemId) || {}).label || (db.items[itemId] && db.items[itemId].connectorName) || '';
  for (const a of Object.values(db.accounts).filter((x) => x.itemId === itemId)) {
    db.accounts[a.id] = Object.assign({}, a, { arquivada: true, bankLabel: label, itemId: 'arquivado:' + itemId });
    delete db.billsByAccount[a.id];
    delete db.accountSync[a.id];
  }
  delete db.items[itemId];
}

function normTxt(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function dupKey(bank, type, t) {
  return normTxt(bank) + '|' + type + '|' + String(t.date).slice(0, 10) + '|' + Number(t.amount).toFixed(2) + '|' + normTxt(t.description).slice(0, 24);
}

// O banco às vezes troca o código de um lançamento: mesmo valor, data próxima e descrição parecida.
function replacedBy(t, freshList) {
  const d = new Date(t.date);
  const desc = normTxt(t.description).slice(0, 8);
  return freshList.some((f) => Number(f.amount).toFixed(2) === Number(t.amount).toFixed(2) && Math.abs(new Date(f.date) - d) <= 5 * 86400000 && normTxt(f.description).slice(0, 8) === desc);
}

module.exports = { syncAll, removeItem, slimTx };
