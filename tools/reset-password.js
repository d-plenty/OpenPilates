#!/usr/bin/env node
// Set a new password for someone who is locked out. Run it where the server runs, with the same DATA_DIR:
//   node tools/reset-password.js <username> <new password>
// With no arguments it lists the usernames.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../server/db.js';
import { hashPassword, passwordProblem } from '../server/auth.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = openDb(process.env.DATA_DIR || join(root, 'data'));
const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.log('Usage: node tools/reset-password.js <username> <new password>');
  console.log('Usernames here: ' + (db.prepare('SELECT username FROM users ORDER BY username').all().map((u) => u.username).join(', ') || '(none yet)'));
  process.exit(username ? 1 : 0);
}
const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase());
if (!user) { console.error(`No user called "${username}".`); process.exit(1); }
const problem = passwordProblem(password);
if (problem) { console.error(problem); process.exit(1); }
db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(password), user.id);
db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
console.log(`Password changed for ${username}. They are signed out everywhere and can sign in with the new one.`);
