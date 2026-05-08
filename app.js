import { router } from "./router.js";
import { getPosts, getCategories } from "./api.js";
import { setState } from "./state.js";
import Navbar from "./components/navbar.js";

window.addEventListener("hashchange", router);

async function init() {
  // Menü betöltése
  document.getElementById("nav").innerHTML = Navbar();
  setState({ loading: true });
  
  try {
    // Párhuzamosan letöltjük a posztokat és a kategóriákat
    const [posts, categories] = await Promise.all([
      getPosts(),
      getCategories()
    ]);
    
    // Beállítjuk a közös state-et
    setState({ posts, categories, loading: false });
  } catch (err) {
    console.error("Hiba az inicializáláskor:", err);
    setState({ loading: false });
    alert("Nem sikerült kapcsolódni a szerverhez!");
  }
  
  router();
}

init();