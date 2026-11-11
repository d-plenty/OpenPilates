// Checks every movement file in library/movements against the shared vocabulary.
// Run with: npm run check:library
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanMovement } from '../server/validate.js';

const dir = fileURLToPath(new URL('../library/movements', import.meta.url));
const all = new Map();
let problems = 0;
for (const app of readdirSync(dir)) {
  for (const f of readdirSync(join(dir, app))) {
    const file = join(dir, app, f);
    let raw;
    try { raw = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`✗ ${app}/${f}: not valid JSON (${e.message})`); problems++; continue; }
    try {
      const clean = cleanMovement(raw, { slug: raw.slug });
      if (raw.slug !== basename(f, '.json')) throw new Error(`slug "${raw.slug}" should match the file name`);
      if (raw.apparatus !== app) throw new Error(`apparatus "${raw.apparatus}" but file is in ${app}/`);
      for (const k of ['spine', 'patterns', 'equipment']) {
        const lost = (raw[k] || []).filter((x) => !clean[k].includes(x));
        if (lost.length) throw new Error(`unknown ${k}: ${lost.join(', ')}`);
      }
      const lostM = [...(raw.muscles?.primary || []), ...(raw.muscles?.secondary || [])].filter((x) => ![...clean.muscles.primary, ...clean.muscles.secondary].includes(x));
      if (lostM.length) throw new Error(`unknown muscles: ${lostM.join(', ')}`);
      if ((raw.cautions || []).length !== clean.cautions.length) throw new Error('unknown caution tag');
      all.set(raw.slug, raw);
    } catch (e) { console.error(`✗ ${app}/${f}: ${e.message}`); problems++; }
  }
}
for (const mv of all.values()) for (const c of mv.cautions || []) {
  if (c.swap && !all.has(c.swap)) { console.error(`✗ ${mv.slug}: swap "${c.swap}" doesn't exist`); problems++; }
}
console.log(problems ? `${problems} problem(s) in ${all.size} movements` : `✓ ${all.size} movements look good`);
process.exit(problems ? 1 : 0);
