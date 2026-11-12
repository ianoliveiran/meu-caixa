'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const call = (ch) => (arg) => ipcRenderer.invoke(ch, arg);

contextBridge.exposeInMainWorld('caixa', {
  getModel: call('model:get'),
  syncNow: call('sync:now'),
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
  openExternal: call('app:openExternal'),
  onChange: (fn) => {
    const handler = (e, data) => fn(data);
    ipcRenderer.on('state:changed', handler);
    return () => ipcRenderer.removeListener('state:changed', handler);
  }
});
