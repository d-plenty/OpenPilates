import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS = [
  `CREATE TABLE users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL UNIQUE COLLATE NOCASE,
     display_name TEXT NOT NULL,
     role TEXT NOT NULL DEFAULT 'instructor',
     pass_hash TEXT NOT NULL,
     disabled INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE sessions (
     token TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     expires_at TEXT NOT NULL
   );
   CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
   CREATE TABLE movements (
     slug TEXT PRIMARY KEY,
     apparatus TEXT NOT NULL,
     data TEXT NOT NULL,
     source TEXT NOT NULL DEFAULT 'library',
     owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE movement_notes (
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     slug TEXT NOT NULL,
     text TEXT NOT NULL,
     PRIMARY KEY (user_id, slug)
   );
   CREATE TABLE flows (
     id TEXT PRIMARY KEY,
     owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
     title TEXT NOT NULL,
     data TEXT NOT NULL,
     shared INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE clients (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     notes TEXT NOT NULL DEFAULT '',
     tags TEXT NOT NULL DEFAULT '[]',
     archived INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );`
];

export function openDb(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, 'openpilates.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (v INTEGER NOT NULL)');
  const row = db.prepare('SELECT v FROM schema_version').get();
  let v = row ? row.v : 0;
  if (!row) db.prepare('INSERT INTO schema_version (v) VALUES (0)').run();
  while (v < MIGRATIONS.length) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[v]);
      v++;
      db.prepare('UPDATE schema_version SET v = ?').run(v);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
  return db;
}

// Load the bundled movement library. Library rows are refreshed on every start so
// image updates ship new and corrected movements; studio-edited copies are left alone.
export function loadLibrary(db, libraryDir) {
  const files = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.json')) files.push(p);
    }
  };
  walk(libraryDir);
  const get = db.prepare('SELECT source FROM movements WHERE slug = ?');
  const upsert = db.prepare(`INSERT INTO movements (slug, apparatus, data, source, updated_at) VALUES (?, ?, ?, 'library', datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET apparatus = excluded.apparatus, data = excluded.data, updated_at = excluded.updated_at WHERE movements.source = 'library'`);
  let loaded = 0;
  for (const f of files) {
    try {
      const mv = JSON.parse(readFileSync(f, 'utf8'));
      if (!mv.slug || !mv.name) continue;
      const existing = get.get(mv.slug);
      if (existing && existing.source !== 'library') continue;
      upsert.run(mv.slug, mv.apparatus, JSON.stringify(mv));
      loaded++;
    } catch (e) {
      console.warn(`Skipping movement file ${f}: ${e.message}`);
    }
  }
  return loaded;
}

export function libraryVersionOf(libraryDir, slug) {
  for (const a of ['reformer', 'mat']) {
    const p = join(libraryDir, a, slug + '.json');
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  }
  return null;
}

export function getSetting(db, key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
}

export function setSetting(db, key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
}
