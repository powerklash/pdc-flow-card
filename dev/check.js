// controllo prima di ogni commit/release:
// 1) sintassi di pdc-flow-card.js  2) nessun riferimento personale nei file pubblici
// Le parole da cercare stanno in dev/private/parole-private.txt (una per riga, ignorato da git).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
let ok = true;
try { execFileSync(process.execPath, ['--check', path.join(ROOT, 'pdc-flow-card.js')], { stdio: 'inherit' }); console.log('sintassi: ok'); }
catch { ok = false; console.log('sintassi: ERRORE'); }
const m = fs.readFileSync(path.join(ROOT, 'pdc-flow-card.js'), 'utf8').match(/PDC_VERSION = '([^']+)'/);
console.log('versione:', m ? m[1] : '?');
const listFile = path.join(__dirname, 'private', 'parole-private.txt');
if (!fs.existsSync(listFile)) { console.log('ATTENZIONE: manca dev/private/parole-private.txt, controllo privacy saltato'); process.exit(ok ? 0 : 1); }
const words = fs.readFileSync(listFile, 'utf8').split(/\r?\n/).map((w) => w.trim()).filter((w) => w && !w.startsWith('#'));
const files = ['pdc-flow-card.js', 'README.md', 'CHANGELOG.md', 'CLAUDE.md', 'hacs.json', '.github/FUNDING.yml'];
for (const d of ['dev']) for (const f of fs.readdirSync(path.join(ROOT, d))) if (/\.(js|html|json|md)$/.test(f)) files.push(d + '/' + f);
for (const f of files) {
  const p = path.join(ROOT, f); if (!fs.existsSync(p)) continue;
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  lines.forEach((l, i) => { for (const w of words) { const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); if (re.test(l)) { ok = false; console.log(`PRIVATO: ${f}:${i + 1} contiene "${w}"`); } } });
}
console.log(ok ? 'controllo privacy: ok' : 'controllo: PROBLEMI TROVATI');
process.exit(ok ? 0 : 1);
