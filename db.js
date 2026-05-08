const fs = require("fs");
const path = require("path");

const isVercel = Boolean(process.env.VERCEL);
const isTest = process.env.NODE_ENV === "test";

const defaultFilePath = isVercel ? "/tmp/forum.db" : "./forum.db";
const filePath = process.env.DB_PATH || defaultFilePath;

let _close = null;

async function initSqlJsDb() {
  // sql.js needs async init
  // eslint-disable-next-line global-require
  const initSqlJs = require("sql.js");
  const SQL = await initSqlJs();

  let db;
  if (!isTest && fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    db = new SQL.Database(new Uint8Array(buf));
  } else {
    db = new SQL.Database();
  }

  function persist() {
    if (isTest) return;
    try {
      const out = db.export();
      const dir = path.dirname(filePath);
      if (dir && dir !== "." && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(out));
    } catch (e) {
      // In serverless this should still work for /tmp; if not, fail silently.
      console.error("DB persist failed:", e?.message || e);
    }
  }

  function execAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  async function all(sql, params = []) {
    return execAll(sql, params);
  }

  async function get(sql, params = []) {
    const rows = execAll(sql, params);
    return rows[0];
  }

  async function run(sql, params = []) {
    db.run(sql, params);
    // emulate sqlite3 lastID
    const row = execAll("SELECT last_insert_rowid() AS id", [])[0];
    persist();
    return { lastID: row?.id };
  }

  _close = () => {
    try {
      persist();
      db.close();
    } catch {
      // ignore
    }
  };

  return { all, get, run, filePath };
}

async function initSqlite3Db() {
  // Only require sqlite3 in non-Vercel environments (native module)
  // eslint-disable-next-line global-require
  const sqlite3 = require("sqlite3").verbose();

  const raw = new sqlite3.Database(filePath);
  _close = () => raw.close();

  function all(sql, params = []) {
    return new Promise((resolve, reject) => {
      raw.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  function get(sql, params = []) {
    return new Promise((resolve, reject) => {
      raw.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
  }

  function run(sql, params = []) {
    return new Promise((resolve, reject) => {
      raw.run(sql, params, function onRun(err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  return { all, get, run, filePath };
}

async function initDb() {
  const impl = isVercel ? await initSqlJsDb() : await initSqlite3Db();

  // schema
  await impl.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  await impl.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);

  await impl.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    category_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await impl.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    post_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await impl.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  )`);

  await impl.run(`CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (post_id, tag_id)
  )`);

  // seed (skip in tests)
  if (!isTest) {
    const c = await impl.get("SELECT COUNT(*) as count FROM categories");
    if (Number(c?.count || 0) === 0) {
      await impl.run("INSERT INTO categories (name) VALUES (?), (?), (?)", [
        "Általános",
        "Szoftverfejlesztés",
        "Hardver",
      ]);
    }

    const t = await impl.get("SELECT COUNT(*) as count FROM tags");
    if (Number(t?.count || 0) === 0) {
      await impl.run("INSERT INTO tags (name) VALUES (?), (?), (?)", ["JavaScript", "Frontend", "Backend"]);
    }
  }

  return impl;
}

const dbReady = initDb();

function closeDb() {
  if (_close) _close();
}

module.exports = { dbReady, closeDb };

