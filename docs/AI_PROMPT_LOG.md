# AI Prompt Napló

Ez a fájl az AI-asszisztált fejlesztés során használt promptok és a kapott válaszok rövid, strukturált naplója.

## Használt eszköz
- **AI asszisztens**: Cursor (chat alapú fejlesztési támogatás)
- **Projekt**: Vanilla JS fórum alkalmazás (Node/Express + SQLite backenddel)

## 1. fázis — Követelmények, specifikáció (2026-03 vége)

### Prompt 1 (2026-03-28)
**Kérdés/prompt**: „Írj funkcionális és nem-funkcionális követelménylistát egy egyszerű fórum apphoz (posztok, kommentek, admin).”

**AI válasz röviden**: Javasolt user sztorik (poszt/komment CRUD), szerepkörök (user/admin), NFR-ek (teljesítmény, hozzáférhetőség, biztonság).

**Döntés**: **Elfogadva**  
**Indoklás**: Jó alapot adott a `docs/SPECIFICATION.md` felépítéséhez, minimális módosítással átültethető volt.

### Prompt 2 (2026-03-29)
**Kérdés/prompt**: „Adj javaslatot SPA navigációra hash-routerrel Vanilla JS-ben, komponensekre bontással.”

**AI válasz röviden**: Hash alapú útvonal-felbontás, dinamikus importok, re-render stratégia route váltáskor.

**Döntés**: **Elfogadva (kisebb módosítással)**  
**Indoklás**: A dinamikus import jó volt, de a routerben extra hibatűrést és async render kezelést később hozzá kellett adni.

## 2. fázis — Adatmodell, backend, CRUD (2026-04)

### Prompt 3 (2026-04-10)
**Kérdés/prompt**: „Tervezd meg a DB sémát SQLite-ra: user, category, post, comment, tag + kapcsolótábla.”

**AI válasz röviden**: Entitások mezőkkel, idegen kulcsok, N:M kapcsoló tábla (`post_tags`), alap index javaslatok.

**Döntés**: **Elfogadva**  
**Indoklás**: Közvetlenül alkalmazható volt a `server.js` inicializációban és a `docs/DATAMODEL.md`-ben.

### Prompt 4 (2026-04-18)
**Kérdés/prompt**: „Készíts Express végpontokat poszt + komment CRUD-hoz JWT auth mellett.”

**AI válasz röviden**: Middleware `authenticate`, poszt létrehozásnál user_id a tokenből, kommentek listázása postId szerint.

**Döntés**: **Elfogadva (módosítással)**  
**Indoklás**: A CRUD váz jó volt, de a jogosultságok (owner/admin) és hibakezelés több helyen finomítást igényelt.

### Prompt 5 (2026-04-23)
**Kérdés/prompt**: „Hogyan oldjam meg, hogy a frontend ugyanarról a szerverről kapja a statikus fájlokat és az API-t?”

**AI válasz röviden**: `express.static(__dirname)`, API route-ok ugyanazon hoston, CORS csak fejlesztéshez.

**Döntés**: **Elfogadva**  
**Indoklás**: Egyszerű és megfelel a beadandó jellegének; lokálisan működött gond nélkül.

## 3. fázis — Biztonság, jogosultság, validáció, tesztelés (2026-05)

### Prompt 6 (2026-05-02)
**Kérdés/prompt**: „Milyen minimális input validációt érdemes csinálni register/login/post/comment esetén?”

**AI válasz röviden**: Email regex, jelszó min hossz, poszt title/content hossz, komment nem üres; szerveroldali validáció elsődleges.

**Döntés**: **Elfogadva**  
**Indoklás**: Pontosan illeszkedett a rubrikához (kliens + szerver validáció).

### Prompt 7 (2026-05-03)
**Kérdés/prompt**: „Hogyan védekezzek XSS ellen, ha innerHTML-t használok komponensek renderelésére?”

**AI válasz röviden**: Escape-elni kell a felhasználói tartalmat (HTML entity encoding), ne renderelj nyers HTML-t user inputból.

**Döntés**: **Elfogadva (módosítással)**  
**Indoklás**: Az escape függvény került be, és a kritikus helyeken használva lett; néhány UI elemnél plusz ellenőrzés kellett.

### Prompt 8 (2026-05-04)
**Kérdés/prompt**: „Adj mintát route guardra: legyen legalább egy route (pl. /new), ami login nélkül nem elérhető.”

**AI válasz röviden**: Routerben `requiresAuth` flag, ha nincs token → redirect `#/login`.

**Döntés**: **Elfogadva**  
**Indoklás**: Gyors, tiszta megoldás; megfelelt a „védett útvonal” kritériumnak.

### Prompt 9 (2026-05-05)
**Kérdés/prompt**: „Hogyan teszteljem Express API-t Jest + Supertesttel úgy, hogy ne a valós adatbázist írja?”

**AI válasz röviden**: In-memory SQLite (`:memory:`), `require.main` guard a listen-hez, app exportálása a tesztekhez.

**Döntés**: **Elfogadva**  
**Indoklás**: Lehetővé tette 10+ unit teszt gyors futtatását és izolációját.

### Prompt 10 (2026-05-06)
**Kérdés/prompt**: „Kérek 1 E2E tesztet Playwrighttal: regisztráció → login → új poszt (happy path).”

**AI válasz röviden**: Playwright config `webServer`-rel, headless teszt, UI elemek kitöltése, assert a listában.

**Döntés**: **Elfogadva (módosítással)**  
**Indoklás**: A locatorokat finomítani kellett (strict mode) és a poszt címét egyedivé kellett tenni a stabil futásért.

## Elfogadás / módosítás / elutasítás — döntési példák (min. 5)

1) **Elfogadva**: Hash-router + dinamikus importok (gyors SPA navigáció)  
2) **Elfogadva (módosítással)**: CRUD váz — jogosultság és hibakezelés bővítve  
3) **Elfogadva**: Szerveroldali validáció elsődlegessége  
4) **Elfogadva (módosítással)**: XSS védelem — escape bevezetve, több komponensben átvezetve  
5) **Elfogadva (módosítással)**: E2E teszt — locator + egyedi title stabilitás miatt  

## Kritikus gondolkodás: 2 AI tévedés és kezelésük (min. 2)

### Eset 1 — E2E strict mode hiba (2026-05-07)
**Tévedés**: A teszt egy olyan szövegre assertelt, ami több elemben is megjelent (pl. cím + sr-only).  
**Hatás**: Playwright strict mode hibával megállt.  
**Kezelés**: Szűkebb locator (role alapú) és **egyedi** poszt cím generálása timestampből.

### Eset 2 — Unit tesztnél „Database handle is closed” (2026-05-08)
**Tévedés**: A teszt a DB-t tesztenként bezárta, miközben a seed callbackek még futhattak.  
**Hatás**: Időzítési hiba, flaky teszt.  
**Kezelés**: Teszt módban seed kihagyása (`NODE_ENV=test`) + DB zárás csak `afterAll`-ban.

## Megjegyzés
A napló a fejlesztés fő lépéseit követi (spec → adatmodell/backend → biztonság/tesztek), és a döntések/korrekciók indoklása is szerepel.
