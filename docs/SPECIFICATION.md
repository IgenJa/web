# Fórum Alkalmazás Specifikáció

## Projekt leírás
Ez az alkalmazás egy modern, reszponzív, egyoldalas (SPA) webes fórum, ahol a felhasználók különböző kategóriákban oszthatják meg gondolataikat, és hozzászólhatnak mások bejegyzéseihez. A platform célja, hogy közösségi teret biztosítson szakmai és általános témák megvitatására.

## Funkcionális követelmények
* **Felhasználókezelés:**
  * Regisztráció és bejelentkezés (JWT alapú).
  * Kijelentkezés.
* **Posztok kezelése (CRUD):**
  * Posztok listázása kategóriák szerinti szűréssel, időrendi rendezéssel és szabadszavas kereséssel.
  * Új poszt létrehozása (cím, tartalom, kategória megadása).
  * Poszt részletes nézetének megtekintése.
  * Saját poszt szerkesztése és törlése.
* **Kommentek kezelése:**
  * Hozzászólás írása egy adott poszthoz.
  * Saját hozzászólás szerkesztése és törlése.
* **Jogosultságok:**
  * Vendég: Csak olvasási jog (posztok és kommentek megtekintése).
  * Regisztrált felhasználó: Posztolás, kommentelés, saját tartalmak módosítása/törlése.
  * Adminisztrátor: Teljes hozzáférés, bármely poszt és komment szerkesztése vagy törlése.

## Nem-funkcionális követelmények
* **Frontend:** Vanilla JavaScript (keretrendszer nélkül), komponens-alapú architektúra, kliens-oldali routing (Hash-alapú).
* **Megjelenés (UX/UI):** Mobile-first reszponzív design, CSS custom properties (design tokenek) a konzisztens megjelenésért. Akadálymentességi (accessibility) szempontok betartása (szemantikus HTML, fókuszkezelés, kontraszt, aria-attribútumok).
* **Backend:** Node.js környezet, Express keretrendszer, SQLite3 perzisztens adatbázis.

## Felhasználói szerepkörök
1. **Vendég (Guest):** Bejelentkezés nélkül böngészheti az oldalt, olvashatja a posztokat és a kommenteket, de nem hozhat létre új tartalmat.
2. **Felhasználó (User):** Bejelentkezett fiók. Létrehozhat bejegyzéseket, kommentelhet, valamint jogosult a saját tartalmainak szerkesztésére és törlésére.
3. **Adminisztrátor (Admin):** Kiemelt jogosultságú fiók, amely moderációs célból bármely felhasználó bejegyzését és hozzászólását szerkesztheti vagy törölheti.

## Képernyő-lista / Sitemap
* `/` (Főoldal) - Posztok listázása, kereső, szűrő és rendező felület.
* `/new` - Új poszt létrehozása űrlap.
* `/post/:id` - Egy konkrét poszt részletes nézete és a hozzá tartozó komment-szekció.
* `/login` - Bejelentkezési oldal.
* `/register` - Regisztrációs oldal.
* `/404` - Hibaoldal (nem található útvonal esetén).
