import { subscribe } from "./state.js";

function isAuthed() {
  return Boolean(localStorage.getItem("token"));
}

// Az útvonalak definiálása a komponensek dinamikus importálásával
export const routes = {
  "/": { load: () => import("./components/PostList.js") },
  "/new": { load: () => import("./components/PostForm.js"), requiresAuth: true },
  "/post": { load: () => import("./components/PostDetail.js") },
  "/login": { load: () => import("./components/AuthForm.js").then(m => ({ default: () => m.default("login") })) },
  "/register": { load: () => import("./components/AuthForm.js").then(m => ({ default: () => m.default("register") })) },
  "/404": { load: () => import("./components/NotFound.js") }
};

/**
 * A fő router függvény, amely a hash alapján betölti a megfelelő komponenst
 */
export function router() {
  // Hash kinyerése (pl. #/post/123 -> /post/123), alapértelmezés a főoldal
  const hash = location.hash.slice(1) || "/";
  
  // Az URL felbontása: az első elem üres lesz a kezdő perjel miatt, 
  // a második a 'path' (pl. post), a harmadik az 'id' (pl. 123)
  const [, path, id] = hash.split("/");

  // Megkeressük a route-ot, ha nincs találat, jön a 404
  const routeDef = routes["/" + (path || "")] || routes["/404"];

  // Védett útvonalak (route guard)
  if (routeDef.requiresAuth && !isAuthed()) {
    location.hash = "/login";
    return;
  }

  // Betöltjük a komponens fájlját
  routeDef.load().then(async (m) => {
    try {
      // Megvárjuk, amíg a komponens (ami async) legenerálja a HTML-t
      // Ezzel javítjuk az [object Promise] hibát
      const html = await m.default(id);
      
      // Beillesztjük a HTML-t a fő konténerbe
      document.getElementById("main").innerHTML = html;
      
      // Értesítjük a rendszert (pl. a Navbart), hogy megváltozott az oldal
      document.dispatchEvent(new Event("routeChanged"));
      
      // Az oldal tetejére ugrunk navigációkor
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Hiba a komponens renderelésekor:", err);
      document.getElementById("main").innerHTML = "<h1>Hiba történt az oldal betöltésekor.</h1>";
    }
  });
}

/**
 * Reaktív állapotkezelés:
 * Ha a globális state változik (pl. keresésnél), és a főoldalon vagyunk, 
 * akkor a router automatikusan újrarendereli a listát.
 */
subscribe(() => {
  const hash = location.hash || "#/";
  if (hash === "#/") {
    router();
  }
});