# Adatmodell

Az alkalmazás SQLite adatbázist használ, amely a következő 5 entitásból és egy N:M kapcsolótáblából áll.

## Entitások és mezők

### 1. Users (Felhasználók)
A regisztrált felhasználók adatait tárolja.
* `id` (INTEGER) - Elsődleges kulcs, auto-increment.
* `username` (TEXT) - Egyedi azonosító név.
* `password` (TEXT) - Titkosított (hash-elt) jelszó.
* `role` (TEXT) - Szerepkör (pl. 'user' vagy 'admin').

### 2. Categories (Kategóriák)
A posztok rendszerezésére szolgáló kategóriák.
* `id` (INTEGER) - Elsődleges kulcs, auto-increment.
* `name` (TEXT) - A kategória neve (pl. Szoftverfejlesztés).

### 3. Posts (Bejegyzések)
A fórum témái, amelyeket a felhasználók hoznak létre.
* `id` (INTEGER) - Elsődleges kulcs, auto-increment.
* `title` (TEXT) - A poszt címe.
* `content` (TEXT) - A poszt szöveges tartalma.
* `category_id` (INTEGER) - Külső kulcs a Categories táblához.
* `user_id` (INTEGER) - Külső kulcs a Users táblához (létrehozó).
* `created_at` (DATETIME) - Létrehozás ideje (alapértelmezett: aktuális időbélyeg).

### 4. Comments (Hozzászólások)
A posztokhoz írt felhasználói reakciók.
* `id` (INTEGER) - Elsődleges kulcs, auto-increment.
* `content` (TEXT) - A hozzászólás szövege.
* `post_id` (INTEGER) - Külső kulcs a Posts táblához.
* `user_id` (INTEGER) - Külső kulcs a Users táblához.
* `created_at` (DATETIME) - Létrehozás ideje.

### 5. Tags (Címkék)
A posztok további metaadatokkal való ellátására (szabadon bővíthető logikai entitás).
* `id` (INTEGER) - Elsődleges kulcs, auto-increment.
* `name` (TEXT) - A címke egyedi neve.

### 6. Post_Tags (Kapcsolótábla)
A Posts és Tags közötti N:M kapcsolat feloldására szolgáló tábla.
* `post_id` (INTEGER) - Külső kulcs a Posts táblához.
* `tag_id` (INTEGER) - Külső kulcs a Tags táblához.

## Kapcsolatok összefoglalása
* **Users (1) - (N) Posts:** Egy felhasználó több bejegyzést is írhat, de egy bejegyzéshez csak egy szerző tartozik.
* **Categories (1) - (N) Posts:** Egy kategóriába több bejegyzés is tartozhat, de egy bejegyzésnek csak egy kategóriája van.
* **Posts (1) - (N) Comments:** Egy bejegyzéshez több komment is tartozhat. (A bejegyzés törlésekor a kapcsolódó kommentek is törlődnek a `CASCADE` szabály miatt).
* **Users (1) - (N) Comments:** Egy felhasználó több hozzászólást is írhat.
* **Posts (N) - (M) Tags:** Több-a-többhöz kapcsolat. Egy poszthoz több címke is tartozhat, és egy címke több poszton is rajta lehet. A kapcsolatot a `Post_Tags` tábla biztosítja.
