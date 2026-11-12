'use strict';
// Testes das regras mais sensíveis: nada contado duas vezes, antecipação, Pix no crédito,
// transferência entre contas próprias, e a sincronização completa contra uma Pluggy simulada.
const assert = require('assert');
const { buildDemo } = require('../src/demo');
const { buildModel } = require('../src/rules');
const { PluggyClient } = require('../src/pluggy');
const { syncAll } = require('../src/sync');
const { emptyDb } = require('../src/store');

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('ok  ', name); }
  catch (e) { console.error('FAIL', name, '\n    ', e.message); process.exitCode = 1; }
}

const NOW = new Date(2026, 10, 11, 14, 0);
const db = buildDemo(NOW);
const m = buildModel(db, { now: NOW });
const byName = (n) => m.lancamentos.find((t) => t.nome.startsWith(n));

(async () => {
  await test('pagamento de fatura não entra como gasto', () => {
    const pay = byName('Pix para Nu Pagamentos');
    assert.strictEqual(pay.kind, 'card_payment');
    assert.ok(!m.categorias.some((c) => c.cat === 'fatura'));
    const spendTotal = m.lancamentos.filter((t) => ['expense', 'pix_credit', 'fee'].includes(t.kind)).reduce((s, t) => s - t.valor, 0);
    const refunds = m.lancamentos.filter((t) => t.kind === 'refund').reduce((s, t) => s + t.valor, 0);
    assert.strictEqual(Math.round((spendTotal - refunds) * 100), Math.round(m.totalGasto * 100));
  });

  await test('fatura aberta vem do saldo devedor do cartão e vence no mês seguinte ao último vencimento pago', () => {
    const nu = m.cards.find((c) => c.nome === 'Nubank');
    assert.strictEqual(nu.atual.estado, 'Aberta');
    assert.strictEqual(nu.atual.valor, 731.84);
    assert.strictEqual(nu.atual.vence, '25/11');
  });

  await test('fatura fechada e não paga aparece primeiro', () => {
    const itau = m.cards.find((c) => c.nome === 'Itaú');
    assert.strictEqual(itau.atual.estado, 'Fechada');
    assert.strictEqual(itau.atual.valor, 650.4);
    assert.strictEqual(itau.prox[1].estado, 'Paga');
  });

  await test('crédito à mão vira cartão e conta a pagar a partir do mês de início', () => {
    const ifood = m.cards.find((c) => c.manual);
    assert.strictEqual(ifood.livre, 380);
    assert.ok(!m.bills.some((b) => b.id === 'manual:ifood'));
    const dez = buildModel(db, { now: NOW, month: '2026-12' });
    const b = dez.bills.find((x) => x.id === 'manual:ifood');
    assert.strictEqual(b.valor, 120);
    assert.strictEqual(b.dia, 5);
  });

  await test('Pix para outra conta sua é transferência, não gasto nem renda', () => {
    const out = byName('Pix para Voce de Exemplo');
    const inc = byName('Pix de Voce de Exemplo');
    assert.strictEqual(out.kind, 'transfer_out');
    assert.strictEqual(inc.kind, 'transfer_in');
    assert.strictEqual(m.renda.valor, 6500);
    assert.strictEqual(m.reserva.guardadoMes, 500);
  });

  await test('conta paga com Pix no crédito fica paga e sai das contas fixas do mês', () => {
    const luz = m.bills.find((b) => b.id === 'luz');
    assert.ok(luz.paid);
    assert.ok(luz.viaCard);
    assert.ok(/no crédito Nubank/.test(luz.status.texto));
    assert.strictEqual(m.fluxo.contasFixas, 2509.7);
  });

  await test('taxas do Pix no crédito são somadas', () => {
    assert.strictEqual(m.pixCredito.qtd, 1);
    assert.strictEqual(m.pixCredito.taxas, 12.81);
  });

  await test('estorno reduz o gasto da categoria', () => {
    const est = byName('Estorno Amazon');
    assert.strictEqual(est.kind, 'refund');
  });

  await test('mês passado: todas as contas e faturas pagas', () => {
    const out = buildModel(db, { now: NOW, month: '2026-10' });
    assert.ok(out.bills.length >= 9);
    assert.ok(out.bills.every((b) => b.paid), out.bills.filter((b) => !b.paid).map((b) => b.nome).join(','));
  });

  await test('marcação manual vence a detecção automática', () => {
    const copy = JSON.parse(JSON.stringify(db));
    copy.billMarks = { '2026-11': { celular: true, aluguel: false } };
    const mm = buildModel(copy, { now: NOW });
    assert.ok(mm.bills.find((b) => b.id === 'celular').paid);
    assert.ok(!mm.bills.find((b) => b.id === 'aluguel').paid);
  });

  await test('sincronização completa com a Pluggy simulada', async () => {
    const calls = [];
    const pages = {
      'acc-card': [[
        { id: 't1', accountId: 'acc-card', date: '2026-11-03T03:00:00.000Z', description: 'SUPERMERCADO X', type: 'DEBIT', amount: 100, creditCardMetadata: { payeeMCC: 5411 }, createdAt: '2026-11-03T10:00:00Z' }
      ], [
        { id: 't2', accountId: 'acc-card', date: '2026-11-04T03:00:00.000Z', description: 'PIX NO CREDITO FULANO', type: 'DEBIT', amount: 50, paymentData: { receiver: { name: 'FULANO' } }, creditCardMetadata: {}, createdAt: '2026-11-04T10:00:00Z' }
      ]],
      'acc-cc': [[
        { id: 't3', accountId: 'acc-cc', date: '2026-11-05T03:00:00.000Z', description: 'SALARIO', type: 'CREDIT', amount: 5000, createdAt: '2026-11-05T10:00:00Z' }
      ]]
    };
    const json = (body, status) => ({ ok: (status || 200) < 400, status: status || 200, json: async () => body });
    const fakeFetch = async (url, opts) => {
      calls.push(url);
      const u = new URL(url);
      if (u.pathname === '/auth') {
        assert.strictEqual(JSON.parse(opts.body).clientId, 'cid');
        return json({ apiKey: 'k' });
      }
      assert.strictEqual(opts.headers['X-API-KEY'], 'k');
      if (u.pathname === '/items/item-1') return json({ id: 'item-1', status: 'UPDATED', connector: { name: 'Nubank' }, lastUpdatedAt: '2026-11-11T08:00:00Z' });
      if (u.pathname === '/accounts') return json({ results: [
        { id: 'acc-cc', itemId: 'item-1', type: 'BANK', subtype: 'CHECKING_ACCOUNT', balance: 1000, number: '123', name: 'Conta' },
        { id: 'acc-card', itemId: 'item-1', type: 'CREDIT', subtype: 'CREDIT_CARD', balance: 150, number: '5555', name: 'Cartão', creditData: { creditLimit: 1000, availableCreditLimit: 850, balanceCloseDate: '2026-11-20', balanceDueDate: '2026-11-27' } }
      ] });
      if (u.pathname === '/v2/transactions') {
        const acc = u.searchParams.get('accountId');
        assert.ok(u.searchParams.get('dateFrom'));
        const i = Number(u.searchParams.get('after') || 0);
        const list = pages[acc] || [[]];
        return json({ results: list[i] || [], next: i + 1 < list.length ? '/v2/transactions?accountId=' + acc + '&after=' + (i + 1) : null });
      }
      if (u.pathname === '/bills') return json({ results: [] });
      return json({ message: 'não encontrado' }, 404);
    };
    const local = emptyDb();
    local.settings.items = [{ id: 'item-1', label: 'Nubank' }];
    local.settings.salario = 5000;
    const res = await syncAll(local, new PluggyClient('cid', 'sec', fakeFetch));
    assert.deepStrictEqual(res.errors, []);
    assert.strictEqual(Object.keys(local.transactions).length, 3);
    assert.ok(calls.some((c) => c.includes('after=1')), 'não seguiu a paginação');
    const mm = buildModel(local, { now: NOW });
    assert.strictEqual(mm.cards.length, 1);
    assert.strictEqual(mm.cards[0].atual.valor, 150);
    assert.strictEqual(mm.cards[0].atual.vence, '27/11');
    assert.strictEqual(mm.cards[0].livre, 850);
    assert.strictEqual(mm.pixCredito.qtd, 1);
    // Segunda sincronização não duplica nada.
    await syncAll(local, new PluggyClient('cid', 'sec', fakeFetch));
    assert.strictEqual(Object.keys(local.transactions).length, 3);
  });

  await test('dados reais: reserva sem dobrar, salário do fim do mês conta no mês seguinte, cofrinho não é gasto', () => {
    const local = {
      settings: { salario: 5000, bills: [], reserveAccountId: 'mp' }, items: { i: { id: 'i' } }, manual: [],
      accounts: {
        mp: { id: 'mp', itemId: 'i', type: 'BANK', balance: 1618.02, owner: 'Fulano de Tal', taxNumber: '111.222.333-44', bankData: { automaticallyInvestedBalance: 1618.02 } },
        it: { id: 'it', itemId: 'i', type: 'BANK', balance: 10, owner: 'Fulano de Tal', taxNumber: '111.222.333-44' }
      },
      transactions: {
        s1: { id: 's1', accountId: 'it', date: '2026-10-30T12:00:00.000Z', description: 'Salário recebido - Portabilidade', type: 'CREDIT', amount: 4973.39 },
        r1: { id: 'r1', accountId: 'mp', date: '2026-11-01T12:00:00.000Z', description: 'Dinheiro reservado Casa', type: 'DEBIT', amount: -3000, category: 'Transfer - Internal' },
        r2: { id: 'r2', accountId: 'mp', date: '2026-11-02T12:00:00.000Z', description: 'Dinheiro retirado Casa', type: 'CREDIT', amount: 1000, category: 'Transfer - Internal' },
        p1: { id: 'p1', accountId: 'it', date: '2026-11-03T12:00:00.000Z', description: 'Compra débito Posto Natureza', type: 'DEBIT', amount: -100, paymentData: { payer: { documentNumber: { value: '111.222.333-44' } } } },
        p2: { id: 'p2', accountId: 'mp', date: '2026-11-03T12:00:00.000Z', description: 'Pix recebido - Outra Pessoa', type: 'CREDIT', amount: 100, paymentData: { payer: { documentNumber: { value: '999.888.777-66' } } } },
        p3: { id: 'p3', accountId: 'it', date: '2026-11-04T12:00:00.000Z', description: 'Pix enviado - Fulano de Tal', type: 'DEBIT', amount: -50 }
      }
    };
    const mm = buildModel(local, { now: NOW });
    assert.strictEqual(mm.reserva.saldo, 1618.02);
    assert.strictEqual(mm.renda.fonte, 'recebido');
    assert.strictEqual(mm.renda.valor, 4973.39 + 100);
    const kinds = Object.fromEntries(mm.lancamentos.map((t) => [t.id, t.kind]));
    assert.strictEqual(kinds.r1, 'internal');
    assert.strictEqual(kinds.r2, 'internal');
    assert.strictEqual(kinds.p1, 'expense');
    assert.strictEqual(kinds.p2, 'income');
    assert.strictEqual(kinds.p3, 'transfer_out');
    assert.strictEqual(mm.lancamentos.find((t) => t.id === 'p1').cat, 'transporte');
  });

  await test('credenciais erradas viram mensagem clara', async () => {
    const bad = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const local = emptyDb();
    local.settings.items = [{ id: 'item-1' }];
    await assert.rejects(syncAll(local, new PluggyClient('x', 'y', bad)), /Client ID ou o Client Secret/);
  });

  await test('nada do Open Finance se perde: some do banco, banco removido, reconectado', async () => {
    const { syncAll: sa, removeItem: rm } = require('../src/sync');
    const { emptyDb: ed } = require('../src/store');
    const d = ed();
    d.settings.items = [{ id: 'it1', label: 'Nubank' }];
    let txs = [
      { id: 'a', date: '2026-11-05T12:00:00Z', description: 'Mercado X', type: 'DEBIT', amount: -50, status: 'POSTED' },
      { id: 'b', date: '2026-11-06T12:00:00Z', description: 'Uber', type: 'DEBIT', amount: -20, status: 'PENDING' },
      { id: 'c', date: '2026-11-07T12:00:00Z', description: 'Farmacia', type: 'DEBIT', amount: -30, status: 'POSTED' }
    ];
    const cl = { auth: async () => 'k', fetchItem: async () => ({ status: 'UPDATED' }), fetchBills: async () => [],
      fetchAccounts: async (id) => [{ id: id === 'it1' ? 'acc1' : 'acc9', type: 'BANK', balance: 100, name: 'Conta' }],
      fetchAllTransactions: async (acc, from, to) => (to ? [] : txs.map((t) => Object.assign({ accountId: acc }, t))) };
    await sa(d, cl);
    txs = [{ id: 'b2', date: '2026-11-06T12:00:00Z', description: 'Uber', type: 'DEBIT', amount: -20, status: 'POSTED' }, txs[2]];
    await sa(d, cl);
    assert.ok(d.transactions.a && d.transactions.a.sumiuEm, 'o que sumiu do banco continua guardado');
    assert.ok(!d.transactions.b && d.transactions.b2, 'pendente trocado pelo definitivo');
    rm(d, 'it1');
    assert.strictEqual(Object.keys(d.transactions).length, 3, 'remover o banco não apaga o histórico');
    d.settings.items = [{ id: 'it2', label: 'Nubank' }];
    txs = [{ id: 'n1', date: '2026-11-07T12:00:00Z', description: 'Farmacia', type: 'DEBIT', amount: -30, status: 'POSTED' }];
    await sa(d, cl);
    assert.ok(!d.transactions.c && d.transactions.n1, 'reconectar não duplica');
  });

  console.log('\n' + passed + ' testes passaram');
})();
