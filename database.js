/**
 * Database layer — real SQL only in production path.
 *
 * - If DATABASE_URL is set → PostgreSQL (pg) — use for free-tier cloud (Neon, Supabase, Render Postgres)
 * - Else → SQLite via better-sqlite3 (file at DATABASE_PATH) — local / single-server
 *
 * Unified async API:
 *   await db.all(sql, params)
 *   await db.get(sql, params)
 *   await db.run(sql, params)  → { lastInsertRowid, changes }
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

let driver = null; // 'pg' | 'sqlite'
let pool = null;
let sqlite = null;

function toPgPlaceholders(sql) {
  // Convert ? placeholders to $1, $2, ...
  let i = 0;
  return sql.replace(/\?/g, () => '$' + (++i));
}

function normalizeSql(sql) {
  if (driver === 'pg') {
    return toPgPlaceholders(
      sql
        .replace(/datetime\('now'\)/gi, 'NOW()')
        .replace(/date\('now',\s*'\+(\d+)\s+days'\)/gi, "CURRENT_DATE + INTERVAL '$1 days'")
        .replace(/INSERT OR IGNORE/gi, 'INSERT')
        .replace(/COLLATE NOCASE/gi, '')
    );
  }
  return sql;
}

async function init() {
  if (driver) return;

  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    });
    driver = 'pg';
    const schema = fs.readFileSync(path.join(__dirname, 'schema.postgres.sql'), 'utf8');
    await pool.query(schema);
    console.log('[db] PostgreSQL connected');
    return;
  }

  // SQLite
  const Database = require('better-sqlite3');
  const dbPath = config.databasePath.endsWith('.json')
    ? config.databasePath.replace(/\.json$/i, '.db')
    : config.databasePath;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  sqlite.exec(schema);
  driver = 'sqlite';
  console.log('[db] SQLite connected at', dbPath);
}

async function all(sql, params = []) {
  await init();
  const q = normalizeSql(sql);
  if (driver === 'pg') {
    const res = await pool.query(q, params);
    return res.rows;
  }
  return sqlite.prepare(sql).all(...params);
}

async function get(sql, params = []) {
  await init();
  const q = normalizeSql(sql);
  if (driver === 'pg') {
    const res = await pool.query(q, params);
    return res.rows[0];
  }
  return sqlite.prepare(sql).get(...params);
}

async function run(sql, params = []) {
  await init();
  if (driver === 'pg') {
    let q = normalizeSql(sql);
    // Add RETURNING id for INSERTs so we can get lastInsertRowid
    if (/^\s*INSERT\s+/i.test(sql) && !/RETURNING/i.test(sql)) {
      q = q.replace(/;?\s*$/, '') + ' RETURNING id';
    }
    const res = await pool.query(q, params);
    return {
      lastInsertRowid: res.rows[0] ? res.rows[0].id : null,
      changes: res.rowCount || 0
    };
  }
  const info = sqlite.prepare(sql).run(...params);
  return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
}

async function close() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
  driver = null;
  pool = null;
  sqlite = null;
}

function getDriver() {
  return driver;
}

module.exports = { init, all, get, run, close, getDriver };
