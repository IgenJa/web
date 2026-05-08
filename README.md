[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Ew36zBjj)
# Webfejlesztési keretrendszerek — Projektmunka

> **Hallgató neve:** Schnepp Zétény  
> **Neptun kód:** GOXPCN  
> **Projekt téma:** Általános fórum alkalmazás (tetszőleges témákkal, admin résszel)  
> **Keretrendszer:** Vanilla JavaScript

---

## 🚀 A projekt indítása (lokális futtatás)

```bash
git clone <repo-url>
cd <projekt-mappa>
npm install
# Windows (PowerShell) példa:
copy .env.example .env
# majd a .env-ben állítsd be a JWT_SECRET-et
npm start
```

## ✅ Tesztek futtatása

```bash
npm test
```

---

## 🌐 Publikus URL

> _[Írd ide a deployolt alkalmazás URL-jét, pl. https://my-app.vercel.app]_

## ☁️ Deploy (Vercel)

1. Pushold a repót GitHubra
2. Vercel → **New Project** → importáld a repót
3. **Environment Variables**:
   - `JWT_SECRET`: egy hosszú random string (ne publikus!)
   - (opcionális) `DB_PATH`: `/tmp/forum.db` (Vercel serverless környezethez)
4. Deploy

---

## 📁 Projekt struktúra

```
├── docs/                    # Dokumentáció
│   ├── SPECIFICATION.md     # Funkcionális és nem-funkcionális követelmények
│   ├── DATAMODEL.md         # Adatmodell (entitások, kapcsolatok)
│   ├── COMPONENTS.md        # Komponens-terv
│   └── AI_PROMPT_LOG.md     # AI prompt napló
├── src/                     # Forráskód
└── .github/workflows/       # Automatikus értékelés (ne módosítsd!)
```

---

## 📅 Mérföldkövek

| # | Tartalom | Határidő | Állapot |
|---|----------|----------|---------|
| 1 | Specifikáció, UI és megjelenés | 2026.03.29. 23:59 | ⬜ |
| 2 | Backend és adatok | 2026.04.26. 23:59 | ⬜ |
| 3 | Biztonság és tesztelés | 2026.05.10. 23:59 | ⬜ |

### Hogyan kérd az értékelést?

1. Commitold és push-old a munkádat a `main` vagy `master` branch-re
2. Menj a repód **Actions** fülére
3. Válaszd a **"Mérföldkő értékelés"** workflow-t
4. Kattints a **"Run workflow"** → válaszd ki a mérföldkövet → **"Run workflow"**
5. Az eredmény egy **GitHub Issue**-ban jelenik meg

> ⚠️ Mérföldkőnként **maximum 2 alkalommal** futtathatod az értékelést. Használd bölcsen!  
> ⚠️ A határidőkön automatikus értékelés is fut.

---

## ⚠️ Fontos

- A `.github/workflows/` könyvtár tartalmát **ne módosítsd**!
- A `docs/` mappába rakd a dokumentációs fájlokat.
- Az `AI_PROMPT_LOG.md` fájlt a `docs/` mappában vezesd.
