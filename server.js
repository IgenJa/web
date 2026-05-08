const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ quiet: true });
const { dbReady } = require("./db.js");

const app = express();
app.use(cors());
app.use(express.json());

// Ez a sor mondja meg, hogy a Frontend fájlokat (HTML, CSS, JS) is a szerver adja vissza
app.use(express.static(__dirname));

// DB init (Vercelen sql.js, lokálban sqlite3)
app.use(async (req, res, next) => {
  try {
    req.db = await dbReady;
    next();
  } catch (err) {
    next(err);
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
  
  req.db
    .run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role])
    .then(() => res.json({ message: "Sikeres regisztráció!" }))
    .catch(() => res.status(400).json({ error: "Ez a felhasználónév már foglalt!" }));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!isValidEmail(username)) return res.status(400).json({ error: "Érvénytelen email formátum!" });
  if (!isValidPassword(password)) return res.status(400).json({ error: "Hibás név vagy jelszó!" });
  req.db
    .get("SELECT * FROM users WHERE username = ?", [username])
    .then((user) => {
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Hibás név vagy jelszó!" });
      }
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
      return res.json({ token, role: user.role, username: user.username, userId: user.id });
    })
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
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
  req.db
    .all("SELECT * FROM categories", [])
    .then((rows) => res.json(rows))
    .catch((err) => {
      console.error("GET /categories failed:", err);
      res.status(500).json({ error: "Szerverhiba történt!" });
    });
});

// --- POSZTOK (CRUD 1) ---

// Összes poszt listázása (Read)
app.get('/posts', (req, res) => {
  req.db
    .all("SELECT * FROM posts ORDER BY created_at DESC", [])
    .then((rows) => res.json(rows))
    .catch((err) => {
      console.error("GET /posts failed:", err);
      res.status(500).json({ error: "Szerverhiba történt!" });
    });
});

// Új poszt létrehozása (Create)
app.post('/posts', authenticate, (req, res) => {
  const { title, content, category_id } = req.body;
  if (!isNonEmptyString(title, { min: 1, max: 200 })) return res.status(400).json({ error: "A cím kötelező (max 200 karakter)." });
  if (!isNonEmptyString(content, { min: 10, max: 20000 })) return res.status(400).json({ error: "A tartalom kötelező (min 10 karakter)." });
  req.db
    .run("INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?)", [title, content, category_id || 1, req.user.id])
    .then((r) => res.json({ id: r.lastID }))
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
});

// Poszt szerkesztése (Update) - CSAK ADMIN VAGY TULAJDONOS
app.put('/posts/:id', authenticate, (req, res) => {
  const { title, content } = req.body;
  if (!isNonEmptyString(title, { min: 1, max: 200 })) return res.status(400).json({ error: "A cím kötelező (max 200 karakter)." });
  if (!isNonEmptyString(content, { min: 10, max: 20000 })) return res.status(400).json({ error: "A tartalom kötelező (min 10 karakter)." });
  
  req.db
    .get("SELECT user_id FROM posts WHERE id = ?", [req.params.id])
    .then((post) => {
      if (!post) return res.status(404).json({ error: "Poszt nem található!" });
      if (req.user.role !== 'admin' && Number(post.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: "Nincs jogosultságod más posztját szerkeszteni!" });
      }
      return req.db
        .run("UPDATE posts SET title = ?, content = ? WHERE id = ?", [title, content, req.params.id])
        .then(() => res.json({ message: "Poszt frissítve!" }));
    })
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
});

// Poszt törlése (Delete) - CSAK ADMIN VAGY TULAJDONOS
app.delete('/posts/:id', authenticate, (req, res) => {
  req.db
    .get("SELECT user_id FROM posts WHERE id = ?", [req.params.id])
    .then((post) => {
      if (!post) return res.status(404).json({ error: "Poszt nem található!" });
      if (req.user.role !== 'admin' && Number(post.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: "Csak admin vagy a tulajdonos törölheti a posztot!" });
      }
      return req.db
        .run("DELETE FROM posts WHERE id = ?", [req.params.id])
        .then(() => res.json({ message: "Poszt törölve!" }));
    })
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
});

// --- KOMMENTEK (CRUD 2) ---

// Kommentek lekérése poszt azonosító alapján (Read)
app.get('/comments/:postId', (req, res) => {
  req.db
    .all("SELECT * FROM comments WHERE post_id = ?", [req.params.postId])
    .then((rows) => res.json(rows))
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
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
  req.db
    .run("INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)", [req.body.content, req.body.postId, req.user.id])
    .then((r) => res.json({ id: r.lastID }))
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
});

// Komment szerkesztése (Update)
app.put('/comments/:id', authenticate, (req, res) => {
  if (!isNonEmptyString(req.body.content, { min: 1, max: 5000 })) return res.status(400).json({ error: "A komment nem lehet üres." });
  req.db
    .get("SELECT user_id FROM comments WHERE id = ?", [req.params.id])
    .then((row) => {
      if (!row) return res.status(404).json({ error: "Komment nem található!" });
      if (req.user.role !== "admin" && Number(row.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: "Nincs jogosultságod más kommentjét szerkeszteni!" });
      }
      return req.db
        .run("UPDATE comments SET content = ? WHERE id = ?", [req.body.content, req.params.id])
        .then(() => res.json({ message: "Komment frissítve!" }));
    })
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
});

// Komment törlése (Delete)
app.delete('/comments/:id', authenticate, (req, res) => {
  req.db
    .get("SELECT user_id FROM comments WHERE id = ?", [req.params.id])
    .then((row) => {
      if (!row) return res.status(404).json({ error: "Komment nem található!" });
      if (req.user.role !== "admin" && Number(row.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: "Nincs jogosultságod más kommentjét törölni!" });
      }
      return req.db
        .run("DELETE FROM comments WHERE id = ?", [req.params.id])
        .then(() => res.json({ message: "Komment törölve!" }));
    })
    .catch(() => res.status(500).json({ error: "Szerverhiba történt!" }));
});

// --- SZERVER INDÍTÁSA ---
if (require.main === module) {
  app.listen(3000, () => console.log('A szerver sikeresen elindult: http://localhost:3000'));
}

module.exports = { app };