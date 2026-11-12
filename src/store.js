'use strict';
// Banco local: um arquivo JSON na pasta de dados do app (só no seu PC).
// A gravação é atômica (escreve num arquivo temporário e troca), para não corromper se o PC desligar.

const fs = require('fs');
const path = require('path');

function emptyDb() {
  return {
    version: 1,
    settings: { salario: 0, metaReserva: 0, autoStart: true, syncHours: 3, items: [], bills: [], demo: false },
    secrets: {},
    items: {},
    accounts: {},
    transactions: {},
    billsByAccount: {},
    accountSync: {},
    manual: [],
    billMarks: {},
    catOverrides: {},
    catRules: [],
    seenTx: {},
    lastSync: null,
    lastSyncError: null
  };
}

class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'meu-caixa.json');
    this.db = emptyDb();
  }

  load() {
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      const raw = fs.readFileSync(this.file, 'utf8');
      this.db = Object.assign(emptyDb(), JSON.parse(raw));
      this.db.settings = Object.assign(emptyDb().settings, this.db.settings || {});
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // Arquivo ilegível: guarda uma cópia e começa do zero, em vez de travar o app.
        try { fs.copyFileSync(this.file, this.file + '.corrompido-' + Date.now()); } catch (x) { /* ignora */ }
      }
      this.db = emptyDb();
    }
    return this.db;
  }

  save() {
    fs.mkdirSync(this.dir, { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.db));
    fs.renameSync(tmp, this.file);
    // Uma cópia de segurança por dia.
    const day = new Date().toISOString().slice(0, 10);
    const backup = path.join(this.dir, 'backups', 'meu-caixa-' + day + '.json');
    if (!fs.existsSync(backup)) {
      try {
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.copyFileSync(this.file, backup);
        const files = fs.readdirSync(path.dirname(backup)).filter((f) => f.endsWith('.json')).sort();
        for (const f of files.slice(0, Math.max(0, files.length - 14))) fs.unlinkSync(path.join(path.dirname(backup), f));
      } catch (e) { /* backup é melhor esforço */ }
    }
  }

  reset() {
    const keepSecrets = this.db.secrets;
    const keepAuto = this.db.settings.autoStart;
    this.db = emptyDb();
    this.db.secrets = keepSecrets || {};
    this.db.settings.autoStart = keepAuto;
    this.save();
  }
}

module.exports = { Store, emptyDb };
