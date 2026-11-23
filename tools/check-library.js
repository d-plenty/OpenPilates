// Checks every movement file in library/movements against the shared vocabulary.
// Run with: npm run check:library
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanMovement, cleanSeries } from '../server/validate.js';
import { POSES } from '../shared/poses.js';

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
const retired = (s) => all.has(s) && all.get(s).retired;
for (const mv of all.values()) {
  if (mv.retired) continue;
  for (const c of mv.cautions || []) if (c.swap && retired(c.swap)) { console.error(`✗ ${mv.slug}: swap "${c.swap}" is retired`); problems++; }
  for (const p of mv.prep || []) if (retired(p)) { console.error(`✗ ${mv.slug}: lead-in "${p}" is retired`); problems++; }
  if (!(mv.sources || []).length) { console.error(`✗ ${mv.slug}: no reference names this movement (see library/SOURCES.md)`); problems++; }
  if ((mv.modifications || []).length) { console.error(`✗ ${mv.slug}: "modifications" is now "variations"`); problems++; }
  for (const v of mv.variations || []) if (!['regression', 'progression', 'variation'].includes(v.kind)) { console.error(`✗ ${mv.slug}: variation "${v.name}" has kind "${v.kind}"`); problems++; }
  for (const c of mv.cautions || []) {
    if (c.swap && !all.has(c.swap)) { console.error(`✗ ${mv.slug}: swap "${c.swap}" doesn't exist`); problems++; }
    if (c.swap && all.has(c.swap) && (all.get(c.swap).cautions || []).some((x) => x.tag === c.tag && x.severity !== 'modify')) { console.error(`✗ ${mv.slug}: swap "${c.swap}" carries the same "${c.tag}" caution`); problems++; }
  }
  for (const p of mv.prep || []) if (!all.has(p)) { console.error(`✗ ${mv.slug}: lead-in "${p}" doesn't exist`); problems++; }
  if (!POSES[mv.pose]) { console.error(`✗ ${mv.slug}: no picture (pose "${mv.pose}")`); problems++; }
  else if (POSES[mv.pose].ctx !== (mv.apparatus === 'mat' ? 'mat' : 'reformer')) { console.error(`✗ ${mv.slug}: picture "${mv.pose}" is for the other apparatus`); problems++; }
  for (const k of ['section', 'role', 'pregnancy', 'levelTo']) if (!mv[k]) { console.error(`✗ ${mv.slug}: missing ${k}`); problems++; }
  if (!mv.summary) { console.error(`✗ ${mv.slug}: no description`); problems++; }
  if ((mv.pregnancy === 'avoid' || mv.pregnancy === 'early_only') && !(mv.cautions || []).some((c) => c.tag === 'pregnancy')) { console.error(`✗ ${mv.slug}: pregnancy is "${mv.pregnancy}" but there is no pregnancy caution`); problems++; }
}
// series
const sdir = fileURLToPath(new URL('../library/series', import.meta.url));
let nSeries = 0;
for (const f of readdirSync(sdir)) {
  let raw;
  try { raw = JSON.parse(readFileSync(join(sdir, f), 'utf8')); cleanSeries(raw); } catch (e) { console.error(`✗ series/${f}: ${e.message}`); problems++; continue; }
  nSeries++;
  if (raw.slug !== basename(f, '.json')) { console.error(`✗ series/${f}: slug should match the file name`); problems++; }
  for (const i of raw.items) {
    const mv = all.get(i.slug);
    if (!mv) { console.error(`✗ series/${f}: no movement "${i.slug}"`); problems++; continue; }
    if (mv.retired) { console.error(`✗ series/${f}: "${i.slug}" is retired`); problems++; }
    if (mv.apparatus !== raw.apparatus) { console.error(`✗ series/${f}: "${i.slug}" is for the other apparatus`); problems++; }
    if (i.variation && !(mv.variations || []).some((v) => v.name === i.variation)) { console.error(`✗ series/${f}: "${i.slug}" has no variation "${i.variation}"`); problems++; }
  }
}
const live = [...all.values()].filter((m) => !m.retired).length;
console.log(problems ? `${problems} problem(s) in ${all.size} movements` : `✓ ${live} movements (${all.size - live} retired) and ${nSeries} series look good`);
process.exit(problems ? 1 : 0);
