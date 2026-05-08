# Komponens-terv

Az alkalmazás frontendje Vanilla JS alapú, lazán csatolt funkcionális komponensekre épül. Minden komponens felelős a saját HTML-ének generálásáért és a DOM események (kattintás, form submit) bekötéséért.

## Komponensfa (Hierarchia)

```text
App (index.html & app.js)
 ├── Navbar (navigációs sáv és bejelentkezési állapot megjelenítése)
 └── Main (Dinamikus Router konténer)
      ├── PostList (Kezdőlap: Kereső, szűrő és a posztok kártyás listája)
      ├── PostForm (Új poszt létrehozása)
      ├── PostDetail (Poszt részletes nézete)
      │    └── CommentSection (Beágyazott komponens a kommentek listázásához és írásához)
      ├── AuthForm (Bejelentkezési és regisztrációs űrlap újrafelhasználva)
      └── NotFound (404-es hibaoldal)
