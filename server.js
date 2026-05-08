const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ quiet: true });

const app = express();
app.use(cors());
app.use(express.json());

// Ez a sor mondja meg, hogy a Frontend fájlokat (HTML, CSS, JS) is a szerver adja vissza
app.use(express.static(__dirname));

// --- 1. ADATBÁZIS INICIALIZÁLÁSA (5 ENTITÁS + 1 KAPCSOLÓTÁBLA) ---
const dbPath =
  process.env.DB_PATH ||
  (process.env.VERCEL ? "/tmp/forum.db" : "./forum.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("SQLite open error:", err.message, "path=", dbPath);
  } else {
    console.log("SQLite opened:", dbPath);
  }
});

db.serialize(() => {
  // 1. Users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT UNIQUE, 
    password TEXT, 
    role TEXT
  )`);
  
  // 2. Categories
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT
  )`);
  
  // 3. Posts
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    title TEXT, 
    content TEXT, 
    category_id INTEGER, 
    user_id INTEGER, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(user_id) REFERENCES users(id), 
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )`);
  
  // 4. Comments (ON DELETE CASCADE hozzáadva, hogy poszt törlésnél a komment is törlődjön)
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    content TEXT, 
    post_id INTEGER, 
    user_id INTEGER, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE, 
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  // 5. Tags (Max ponthoz az 5. logikai entitás)
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT UNIQUE
  )`);

  // 6. Post_Tags (Kapcsolótábla a posztok és címkék közé - N:M kapcsolat)
  db.run(`CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
  )`);

  // Alapértelmezett adatok: tesztek alatt kihagyjuk (különben záráskor futó callbackek DB-hibát okozhatnak)
  if (process.env.NODE_ENV !== "test") {
    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
      if (row && row.count === 0) {
        db.run("INSERT INTO categories (name) VALUES ('Általános'), ('Szoftverfejlesztés'), ('Hardver')");
      }
    });

    db.get("SELECT COUNT(*) as count FROM tags", (err, row) => {
      if (row && row.count === 0) {
        db.run("INSERT INTO tags (name) VALUES ('JavaScript'), ('Frontend'), ('Backend')");
      }
    });
  }
});

const SECRET_KEY = process.env.JWT_SECRET || "dev_only_insecure_secret_change_me";

function isValidEmail(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPassword(value) {
  if (typeof value !== "string") return false;
  const v = value;
  return v.length >= 8;
}

function isNonEmptyString(value, { min = 1, max = 20000 } = {}) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return v.length >= min && v.length <= max;
}

// --- 2. AUTENTIKÁCIÓ ÉS JOGOSULTSÁG ---

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!isValidEmail(username)) return res.status(400).json({ error: "Érvénytelen email formátum!" });
  if (!isValidPassword(password)) return res.status(400).json({ error: "A jelszónak legalább 8 karakternek kell lennie!" });
  const role = username === 'admin' ? 'admin' : 'user';
  const hash = bcrypt.hashSync(password, 8);
  
  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role], function(err) {
    if (err) return res.status(400).json({ error: "Ez a felhasználónév már foglalt!" });
    res.json({ message: "Sikeres regisztráció!" });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!isValidEmail(username)) return res.status(400).json({ error: "Érvénytelen email formátum!" });
  if (!isValidPassword(password)) return res.status(400).json({ error: "Hibás név vagy jelszó!" });
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Hibás név vagy jelszó!" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
    res.json({ token, role: user.role, username: user.username, userId: user.id });
  });
});

// Middleware: Biztosítja, hogy csak bejelentkezettek férjenek hozzá bizonyos végpontokhoz
function authenticate(req, res, next) {
  const raw = req.headers['authorization'];
  const token = typeof raw === "string" && raw.toLowerCase().startsWith("bearer ") ? raw.slice(7) : raw;
  if (!token) return res.status(403).json({ error: "Nincs bejelentkezve!" });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Érvénytelen token!" });
    req.user = user; 
    next();
  });
}

app.get("/me", authenticate, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

// --- 3. API VÉGPONTOK ---

// Kategóriák lekérése
app.get('/categories', (req, res) => {
  db.all("SELECT * FROM categories", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Szerverhiba történt!" });
    res.json(rows);
  });
});

// --- POSZTOK (CRUD 1) ---

// Összes poszt listázása (Read)
app.get('/posts', (req, res) => {
  db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Szerverhiba történt!" });
    res.json(rows);
  });
});

// Új poszt létrehozása (Create)
app.post('/posts', authenticate, (req, res) => {
  const { title, content, category_id } = req.body;
  if (!isNonEmptyString(title, { min: 1, max: 200 })) return res.status(400).json({ error: "A cím kötelező (max 200 karakter)." });
  if (!isNonEmptyString(content, { min: 10, max: 20000 })) return res.status(400).json({ error: "A tartalom kötelező (min 10 karakter)." });
  db.run("INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?)", 
    [title, content, category_id || 1, req.user.id], 
    function() { res.json({ id: this.lastID }); }
  );
});

// Poszt szerkesztése (Update) - CSAK ADMIN VAGY TULAJDONOS
app.put('/posts/:id', authenticate, (req, res) => {
  const { title, content } = req.body;
  if (!isNonEmptyString(title, { min: 1, max: 200 })) return res.status(400).json({ error: "A cím kötelező (max 200 karakter)." });
  if (!isNonEmptyString(content, { min: 10, max: 20000 })) return res.status(400).json({ error: "A tartalom kötelező (min 10 karakter)." });
  
  db.get("SELECT user_id FROM posts WHERE id = ?", [req.params.id], (err, post) => {
    if (!post) return res.status(404).json({ error: "Poszt nem található!" });

    // Ha a user NEM admin ÉS NEM is a saját posztja, akkor elutasítjuk
    if (req.user.role !== 'admin' && post.user_id !== req.user.id) {
      return res.status(403).json({ error: "Nincs jogosultságod más posztját szerkeszteni!" });
    }

    db.run("UPDATE posts SET title = ?, content = ? WHERE id = ?", [title, content, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: "Szerverhiba történt!" });
      res.json({ message: "Poszt frissítve!" });
    });
  });
});

// Poszt törlése (Delete) - CSAK ADMIN VAGY TULAJDONOS
app.delete('/posts/:id', authenticate, (req, res) => {
  db.get("SELECT user_id FROM posts WHERE id = ?", [req.params.id], (err, post) => {
    if (!post) return res.status(404).json({ error: "Poszt nem található!" });

    if (req.user.role !== 'admin' && post.user_id !== req.user.id) {
      return res.status(403).json({ error: "Csak admin vagy a tulajdonos törölheti a posztot!" });
    }

    db.run("DELETE FROM posts WHERE id = ?", [req.params.id], () => res.json({ message: "Poszt törölve!" }));
  });
});

// --- KOMMENTEK (CRUD 2) ---

// Kommentek lekérése poszt azonosító alapján (Read)
app.get('/comments/:postId', (req, res) => {
  db.all("SELECT * FROM comments WHERE post_id = ?", [req.params.postId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Szerverhiba történt!" });
    res.json(rows);
  });
});

// Globális hibakezelő (Vercelen is JSON hibát adjon)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Szerverhiba történt!" });
});

// Új komment (Create)
app.post('/comments', authenticate, (req, res) => {
  if (!isNonEmptyString(req.body.content, { min: 1, max: 5000 })) return res.status(400).json({ error: "A komment nem lehet üres." });
  if (!req.body.postId) return res.status(400).json({ error: "Hiányzó postId." });
  db.run("INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)", 
    [req.body.content, req.body.postId, req.user.id], 
    function() { res.json({ id: this.lastID }); }
  );
});

// Komment szerkesztése (Update)
app.put('/comments/:id', authenticate, (req, res) => {
  if (!isNonEmptyString(req.body.content, { min: 1, max: 5000 })) return res.status(400).json({ error: "A komment nem lehet üres." });
  db.get("SELECT user_id FROM comments WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Szerverhiba történt!" });
    if (!row) return res.status(404).json({ error: "Komment nem található!" });
    if (req.user.role !== "admin" && row.user_id !== req.user.id) {
      return res.status(403).json({ error: "Nincs jogosultságod más kommentjét szerkeszteni!" });
    }
    db.run("UPDATE comments SET content = ? WHERE id = ?", [req.body.content, req.params.id], function(err2) {
      if (err2) return res.status(500).json({ error: "Szerverhiba történt!" });
      res.json({ message: "Komment frissítve!" });
    });
  });
});

// Komment törlése (Delete)
app.delete('/comments/:id', authenticate, (req, res) => {
  db.get("SELECT user_id FROM comments WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Szerverhiba történt!" });
    if (!row) return res.status(404).json({ error: "Komment nem található!" });
    if (req.user.role !== "admin" && row.user_id !== req.user.id) {
      return res.status(403).json({ error: "Nincs jogosultságod más kommentjét törölni!" });
    }
    db.run("DELETE FROM comments WHERE id = ?", [req.params.id], function(err2) {
      if (err2) return res.status(500).json({ error: "Szerverhiba történt!" });
      res.json({ message: "Komment törölve!" });
    });
  });
});

// --- SZERVER INDÍTÁSA ---
if (require.main === module) {
  app.listen(3000, () => console.log('A szerver sikeresen elindult: http://localhost:3000'));
}

module.exports = { app, db };