'use strict';
// Dados de exemplo no mesmo formato da Pluggy, para ver o app funcionando antes de conectar os bancos.
// Tudo é calculado a partir do mês atual. Nada aqui é dado real.

function monthKeyOf(x) {
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
}

function buildDemo(nowInput) {
  const now = nowInput ? new Date(nowInput) : new Date();
  const Y = now.getFullYear();
  const M = now.getMonth();
  const d = (day, mOff) => {
    const x = new Date(Y, M + (mOff || 0), day, 12);
    return x.toISOString();
  };
  const OWNER = 'VOCE DE EXEMPLO';
  const CPF = '00011122233';
  const recent = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
  const old = new Date(now.getTime() - 10 * 86400000).toISOString();

  const items = {
    'demo-nu': { id: 'demo-nu', connectorName: 'Nubank', status: 'UPDATED', lastUpdatedAt: now.toISOString(), consentExpiresAt: new Date(Y + 1, M, now.getDate()).toISOString() },
    'demo-itau': { id: 'demo-itau', connectorName: 'Itaú', status: 'UPDATED', lastUpdatedAt: now.toISOString(), consentExpiresAt: new Date(Y + 1, M, now.getDate()).toISOString() },
    'demo-inter': { id: 'demo-inter', connectorName: 'Inter', status: 'UPDATED', lastUpdatedAt: now.toISOString(), consentExpiresAt: new Date(Y + 1, M, now.getDate()).toISOString() },
    'demo-mp': { id: 'demo-mp', connectorName: 'Mercado Pago', status: 'UPDATED', lastUpdatedAt: now.toISOString(), consentExpiresAt: new Date(Y + 1, M, now.getDate()).toISOString() },
    'demo-caixa': { id: 'demo-caixa', connectorName: 'Caixa', status: 'UPDATED', lastUpdatedAt: now.toISOString(), consentExpiresAt: new Date(Y + 1, M, now.getDate()).toISOString() }
  };

  const bank = (id, itemId, balance, extra) => Object.assign({ id, itemId, type: 'BANK', subtype: 'CHECKING_ACCOUNT', number: '0001-' + id.length, balance, name: 'Conta corrente', owner: OWNER, taxNumber: CPF, bankData: null, creditData: null }, extra || {});
  const card = (id, itemId, number, limit, avail, closeDay, dueDay) => ({
    id, itemId, type: 'CREDIT', subtype: 'CREDIT_CARD', number, balance: 0, name: 'Cartão de crédito', owner: OWNER, taxNumber: CPF, bankData: null,
    creditData: { creditLimit: limit, availableCreditLimit: avail, balanceCloseDate: d(closeDay), balanceDueDate: d(dueDay), brand: 'MASTERCARD', level: 'PLATINUM' }
  });

  const accounts = {
    'nu-cc': bank('nu-cc', 'demo-nu', 2085.30),
    'nu-card': Object.assign(card('nu-card', 'demo-nu', '5162 •••• •••• 4821', 8000, 7268.16, 18, 25), { balance: 731.84 }),
    'itau-cc': bank('itau-cc', 'demo-itau', 1240.18),
    'itau-card': Object.assign(card('itau-card', 'demo-itau', '4984 •••• •••• 7730', 5000, 4212.87, 11, 18), { balance: 787.13 }),
    'inter-cc': bank('inter-cc', 'demo-inter', 312.45),
    'inter-card': Object.assign(card('inter-card', 'demo-inter', '5502 •••• •••• 1198', 2000, 1595.20, 13, 20), { balance: 404.80 }),
    'mp-cc': bank('mp-cc', 'demo-mp', 7500, { name: 'Conta Mercado Pago' }),
    'caixa-cc': bank('caixa-cc', 'demo-caixa', 96.72)
  };

  let seq = 0;
  const tx = (accountId, day, mOff, type, amount, description, extra) => {
    seq += 1;
    return Object.assign({
      id: 'demo-tx-' + seq,
      accountId,
      date: d(day, mOff),
      description,
      descriptionRaw: null,
      type,
      amount: type === 'DEBIT' && !accounts[accountId].creditData ? -amount : amount,
      currencyCode: 'BRL',
      category: null,
      status: 'POSTED',
      paymentData: null,
      creditCardMetadata: null,
      createdAt: old
    }, extra || {});
  };
  const pixTo = (name, doc) => ({ paymentData: { paymentMethod: 'PIX', receiver: { name, documentNumber: doc ? { type: 'CPF', value: doc } : undefined } } });
  const pixFrom = (name, doc) => ({ paymentData: { paymentMethod: 'PIX', payer: { name, documentNumber: doc ? { type: 'CPF', value: doc } : undefined } } });
  const cc = (meta) => ({ creditCardMetadata: meta || {} });
  const fresh = { createdAt: recent };

  const list = [
    // Dois meses atrás: compras que formaram as faturas já pagas
    tx('nu-card', 22, -2, 'DEBIT', 310.15, 'IFOOD *IFOOD', cc({ payeeMCC: 5812 })),
    tx('nu-card', 2, -1, 'DEBIT', 400, 'AMAZON MARKETPLACE', cc({ payeeMCC: 5942 })),
    tx('nu-card', 5, -1, 'DEBIT', 21.90, 'SPOTIFY', cc({ payeeMCC: 4899 })),
    tx('nu-card', 10, -1, 'DEBIT', 178.10, 'POSTO SHELL', cc({ payeeMCC: 5541 })),
    tx('itau-card', 15, -2, 'DEBIT', 112.40, 'DROGASIL', cc({ payeeMCC: 5912 })),
    tx('itau-card', 28, -2, 'DEBIT', 500, 'CARREFOUR', cc({ payeeMCC: 5411 })),
    tx('inter-card', 20, -2, 'DEBIT', 88, 'UBER *TRIP', cc({ payeeMCC: 4121 })),
    tx('inter-card', 3, -1, 'DEBIT', 300, 'CENTAURO', cc({ payeeMCC: 5655 })),
    // Mês passado
    tx('itau-cc', 5, -1, 'CREDIT', 6500, 'SALARIO', pixFrom('EMPRESA EXEMPLO LTDA')),
    tx('itau-cc', 5, -1, 'DEBIT', 1800, 'PIX ENVIADO', pixTo('IMOBILIARIA EXEMPLO')),
    tx('itau-cc', 5, -1, 'DEBIT', 420, 'BOLETO CONDOMINIO RESIDENCIAL'),
    tx('nu-cc', 8, -1, 'DEBIT', 109.90, 'DEBITO AUTOMATICO VIVO INTERNET'),
    tx('nu-cc', 12, -1, 'DEBIT', 171.20, 'PAGAMENTO CONTA ENEL'),
    tx('nu-cc', 15, -1, 'DEBIT', 59.90, 'CLARO CELULAR'),
    tx('inter-cc', 20, -1, 'DEBIT', 119.90, 'SMART FIT'),
    tx('itau-cc', 18, -1, 'DEBIT', 612.40, 'PAGAMENTO FATURA CARTAO'),
    tx('itau-card', 18, -1, 'CREDIT', 612.40, 'PAGAMENTO RECEBIDO'),
    tx('nu-cc', 25, -1, 'DEBIT', 910.15, 'PAGAMENTO DE FATURA'),
    tx('nu-card', 25, -1, 'CREDIT', 910.15, 'Pagamento recebido'),
    tx('inter-cc', 20, -1, 'DEBIT', 388.00, 'PAG FATURA INTER'),
    tx('inter-card', 20, -1, 'CREDIT', 388.00, 'PAGAMENTO EFETUADO'),
    tx('itau-cc', 6, -1, 'DEBIT', 500, 'PIX ENVIADO', pixTo(OWNER, CPF)),
    tx('mp-cc', 6, -1, 'CREDIT', 500, 'PIX RECEBIDO', pixFrom(OWNER, CPF)),
    tx('mp-cc', 1, -1, 'CREDIT', 86.40, 'RENDIMENTOS'),
    tx('nu-card', 25, -1, 'DEBIT', 230.00, 'LOJA RENNER', cc({ payeeMCC: 5651 })),
    tx('nu-card', 30, -1, 'DEBIT', 255.31, 'IFOOD *IFOOD', cc({ payeeMCC: 5812 })),
    tx('itau-card', 20, -1, 'DEBIT', 370.37, 'AMAZON MARKETPLACE', cc({ payeeMCC: 5942 })),
    tx('inter-card', 20, -1, 'DEBIT', 149.90, 'UBER *TRIP', cc({ payeeMCC: 4121 })),

    // Este mês
    tx('mp-cc', 1, 0, 'CREDIT', 92.10, 'RENDIMENTOS'),
    tx('itau-cc', 5, 0, 'CREDIT', 6500, 'SALARIO', pixFrom('EMPRESA EXEMPLO LTDA')),
    tx('itau-cc', 5, 0, 'DEBIT', 1800, 'PIX ENVIADO', pixTo('IMOBILIARIA EXEMPLO')),
    tx('itau-cc', 5, 0, 'DEBIT', 420, 'BOLETO CONDOMINIO RESIDENCIAL'),
    tx('itau-cc', 6, 0, 'DEBIT', 500, 'PIX ENVIADO', pixTo(OWNER, CPF)),
    tx('mp-cc', 6, 0, 'CREDIT', 500, 'PIX RECEBIDO', pixFrom(OWNER, CPF)),
    tx('nu-cc', 8, 0, 'DEBIT', 109.90, 'DEBITO AUTOMATICO VIVO INTERNET'),
    // Antecipou parte da fatura do Nubank para liberar limite...
    tx('itau-cc', 8, 0, 'DEBIT', 300, 'PIX ENVIADO', pixTo('NU PAGAMENTOS S.A.')),
    tx('nu-card', 8, 0, 'CREDIT', 300, 'Pagamento recebido'),
    // ...e pagou a luz com Pix no crédito.
    tx('nu-card', 9, 0, 'DEBIT', 186.40, 'PIX NO CREDITO ENEL DISTRIBUICAO', Object.assign(cc({}), pixTo('ENEL DISTRIBUICAO SAO PAULO'))),
    tx('nu-card', 9, 0, 'DEBIT', 12.10, 'JUROS PIX NO CREDITO', cc({ feeType: 'OTHER' })),
    tx('nu-card', 9, 0, 'DEBIT', 0.71, 'IOF PIX NO CREDITO', cc({ feeType: 'OTHER' })),
    tx('nu-cc', 3, 0, 'DEBIT', 75, 'PIX ENVIADO', pixTo('JOAO DA SILVA')),
    tx('caixa-cc', 4, 0, 'DEBIT', 18.50, 'COMPRA DEBITO PADARIA DA ESQUINA'),
    tx('nu-card', 2, 0, 'DEBIT', 120, 'MERCADOLIVRE*LOJA', cc({ installmentNumber: 2, totalInstallments: 4, payeeMCC: 5999 })),
    tx('nu-card', 7, 0, 'DEBIT', 39.90, 'NETFLIX.COM', cc({ payeeMCC: 4899 })),
    tx('nu-card', 10, 0, 'DEBIT', 187.42, 'SUPERMERCADO BOM PRECO', Object.assign(cc({ payeeMCC: 5411 }), fresh)),
    tx('itau-card', 1, 0, 'CREDIT', 45, 'ESTORNO AMAZON MARKETPLACE'),
    tx('itau-card', 6, 0, 'DEBIT', 136.73, 'KABUM', cc({ installmentNumber: 3, totalInstallments: 6, payeeMCC: 5732 })),
    tx('itau-card', 8, 0, 'DEBIT', 68.30, 'DROGARIA SAO PAULO', cc({ payeeMCC: 5912 })),
    tx('itau-card', 10, 0, 'DEBIT', 120, 'POSTO AVENIDA', Object.assign(cc({ payeeMCC: 5541 }), fresh)),
    tx('inter-card', 1, 0, 'DEBIT', 200, 'MAGALU', cc({ installmentNumber: 1, totalInstallments: 2, payeeMCC: 5732 })),
    tx('inter-card', 9, 0, 'DEBIT', 54.90, 'IFOOD *RESTAURANTE', Object.assign(cc({ payeeMCC: 5812 }), fresh))
  ];

  const transactions = {};
  for (const t of list) transactions[t.id] = t;

  return {
    version: 1,
    settings: {
      demo: true,
      salario: 6500,
      metaReserva: 19500,
      autoStart: true,
      syncHours: 3,
      items: Object.keys(items).map((id) => ({ id, label: items[id].connectorName })),
      bills: [
        { id: 'aluguel', nome: 'Aluguel', dia: 5, valor: 1800, cat: 'moradia', icon: 'moradia', busca: 'imobiliaria' },
        { id: 'condominio', nome: 'Condomínio', dia: 5, valor: 420, cat: 'moradia', icon: 'moradia', busca: 'condominio' },
        { id: 'internet', nome: 'Internet', dia: 8, valor: 109.90, cat: 'contas', icon: 'internet', busca: 'vivo' },
        { id: 'luz', nome: 'Luz', dia: 12, valor: 180, cat: 'contas', icon: 'luz', busca: 'enel' },
        { id: 'celular', nome: 'Celular', dia: 15, valor: 59.90, cat: 'contas', icon: 'celular', busca: 'claro' },
        { id: 'academia', nome: 'Academia', dia: 20, valor: 119.90, cat: 'saude', icon: 'academia', busca: 'smart fit, academia' }
      ]
    },
    items,
    accounts,
    transactions,
    billsByAccount: {
      'nu-card': [{ id: 'b-nu-1', dueDate: d(25, -1), billClosingDate: d(18, -1), totalAmount: 910.15, payments: [{ amount: 910.15, paymentDate: d(25, -1) }] }],
      'itau-card': [
        { id: 'b-it-1', dueDate: d(18, -1), billClosingDate: d(11, -1), totalAmount: 612.40, payments: [{ amount: 612.40, paymentDate: d(18, -1) }] },
        { id: 'b-it-2', dueDate: d(18, 0), billClosingDate: d(11, 0), totalAmount: 650.40, payments: [] }
      ],
      'inter-card': [{ id: 'b-in-1', dueDate: d(20, -1), billClosingDate: d(13, -1), totalAmount: 388, payments: [{ amount: 388, paymentDate: d(20, -1) }] }]
    },
    manual: [{ id: 'ifood', tipo: 'credito', nome: 'iFood', limite: 500, gasto: 120, dia: 5, inicio: monthKeyOf(new Date(Y, M + 1, 1)), atualizado: new Date(Y, M, 2).toISOString() }],
    billMarks: {},
    catOverrides: {},
    lastSync: now.toISOString(),
    lastSyncError: null
  };
}

module.exports = { buildDemo };
