// Monta o site em web/dist: a mesma interface do app de Windows + login e servidor.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
for (const f of ['app.js', 'art.js', 'styles.css']) fs.copyFileSync(path.join(root, 'renderer', f), path.join(out, f));
for (const f of fs.readdirSync(path.join(root, 'renderer', 'fonts'))) fs.copyFileSync(path.join(root, 'renderer', 'fonts', f), path.join(out, 'fonts', f));
for (const f of ['index.html', 'shim.js', 'web.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'sw.js']) fs.copyFileSync(path.join(__dirname, f), path.join(out, f));
const config = { supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''), supabaseKey: process.env.SUPABASE_ANON_KEY || '' };
fs.writeFileSync(path.join(out, 'config.js'), 'window.MEUCAIXA_CONFIG = ' + JSON.stringify(config) + ';\n');
console.log('site montado em web/dist');
