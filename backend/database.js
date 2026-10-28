'use strict';

const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'campaign.db');

let db;

/**
 * Initialize the SQLite database and create tables if they don't exist.
 * sql.js is a pure-JavaScript SQLite implementation (no native binaries required).
 */
async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists, otherwise create a new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      village TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      call_sid TEXT,
      status TEXT DEFAULT 'initiated',
      duration INTEGER,
      message_delivered INTEGER DEFAULT 0,
      response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS campaign (
      id INTEGER PRIMARY KEY,
      candidate_name TEXT,
      message_telugu TEXT,
      message_english TEXT,
      village_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[DB] Database initialized successfully at', DB_PATH);

  // Persist DB to disk on graceful shutdown
  process.on('exit', () => persistDB());
  process.on('SIGINT', () => { persistDB(); process.exit(0); });
  process.on('SIGTERM', () => { persistDB(); process.exit(0); });

  return db;
}

/**
 * Write the in-memory database back to disk.
 */
function persistDB() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('[DB] Failed to persist database:', e.message);
  }
}

/**
 * Return the active database instance.
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call await initDB() first.');
  }
  return db;
}

/**
 * Execute a SELECT query and return all rows as objects.
 * sql.js uses a different API from better-sqlite3, so we add helpers.
 */
function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  persistDB();
  return rows;
}

function dbGet(sql, params = []) {
  const rows = dbAll(sql, params);
  return rows[0] || null;
}

function dbRun(sql, params = []) {
  db.run(sql, params);
  persistDB();
  return { changes: db.getRowsModified() };
}

module.exports = { initDB, getDB, dbAll, dbGet, dbRun, persistDB };
