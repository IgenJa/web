import { state, setState } from "../state.js";
import { createPost, getPosts } from "../api.js";
import { toast } from "../utils.js";

export default function render() {
  setTimeout(() => {
    const form = document.getElementById("form");
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();

      // ÚJ: Először minden korábbi hibaüzenetet eltüntetünk
      document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

      const title = e.target.title.value.trim();
      const content = e.target.content.value.trim();
      const category_id = e.target.category_id.value;

      let hasError = false;

      // ÚJ: Inline validáció - Cím ellenőrzése
      if (!title) {
        document.getElementById('title-error').innerText = "A cím megadása kötelező!";
        document.getElementById('title-error').style.display = 'block';
        e.target.title.classList.add('input-error');
        hasError = true;
      }

      // ÚJ: Inline validáció - Kategória ellenőrzése
      if (!category_id) {
        document.getElementById('category-error').innerText = "Kérlek válassz egy kategóriát a listából!";
        document.getElementById('category-error').style.display = 'block';
        e.target.category_id.classList.add('input-error');
        hasError = true;
      }

      // ÚJ: Inline validáció - Tartalom ellenőrzése
      if (!content || content.length < 10) {
        document.getElementById('content-error').innerText = "A tartalom kötelező és legalább 10 karakter hosszú kell legyen!";
        document.getElementById('content-error').style.display = 'block';
        e.target.content.classList.add('input-error');
        hasError = true;
      }

      // Ha volt hiba, megállítjuk a beküldést
      if (hasError) return;

      try {
        await createPost({ title, content, category_id });
        const posts = await getPosts();
        setState({ posts, currentPage: 1 }); // ÚJ: Visszaugrunk az első oldalra új poszt után
        
        toast("Poszt létrehozva!");
        location.hash = "/";
      } catch (err) {
        alert(err.message);
      }
    };
  });

  return `
    <div class="card" style="max-width: 600px; margin: 0 auto;">
      <h2>Új poszt létrehozása</h2>
      <form id="form" novalidate>
        
        <div style="margin-bottom: 1rem;">
          <input name="title" placeholder="A poszt címe" style="width: 100%; box-sizing: border-box;">
          <span id="title-error" class="error-msg" style="color: var(--danger); font-size: 0.85rem; font-weight: 600; display: none; margin-top: 4px;"></span>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <select name="category_id" style="width: 100%; box-sizing: border-box; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);">
            <option value="" disabled selected>Válassz kategóriát...</option>
            ${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
          </select>
          <span id="category-error" class="error-msg" style="color: var(--danger); font-size: 0.85rem; font-weight: 600; display: none; margin-top: 4px;"></span>
        </div>

        <div style="margin-bottom: 1rem;">
          <textarea name="content" placeholder="Miről szeretnél írni?" style="width: 100%; box-sizing: border-box; min-height: 200px;"></textarea>
          <span id="content-error" class="error-msg" style="color: var(--danger); font-size: 0.85rem; font-weight: 600; display: none; margin-top: 4px;"></span>
        </div>
        
        <button style="width: 100%;">Közzététel</button>
      </form>
    </div>
  `;
}