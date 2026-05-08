import { state, setState, derived } from "../state.js";
import { escapeHtml } from "../utils.js";

let debounceTimer;

export default function render() {
  setTimeout(() => {
    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.focus();
      const val = searchInput.value; searchInput.value = ''; searchInput.value = val;
      
      // Debounce: csak akkor keres, ha megálltál a gépelésben
      searchInput.oninput = (e) => {
        clearTimeout(debounceTimer);
        // ÚJ: Keresésnél visszaugrunk az első oldalra
        debounceTimer = setTimeout(() => setState({ search: e.target.value, currentPage: 1 }), 300);
      };
    }

    // ÚJ: Szűrésnél/Rendezésnél is visszaugrunk az 1. oldalra
    document.getElementById("sort")?.addEventListener("change", (e) => setState({ sortBy: e.target.value, currentPage: 1 }));
    document.getElementById("filter")?.addEventListener("change", (e) => setState({ filterCategory: e.target.value, currentPage: 1 }));
    
    // ÚJ: Lapozó gombok eseménykezelői
    document.getElementById("prev-page")?.addEventListener("click", () => {
      if (state.currentPage > 1) setState({ currentPage: state.currentPage - 1 });
    });
    document.getElementById("next-page")?.addEventListener("click", () => {
      if (state.currentPage < derived.totalPages) setState({ currentPage: state.currentPage + 1 });
    });
  });

  if (state.loading) return `<div class="card"><p aria-live="polite">Betöltés folyamatban...</p></div>`;

  // ÚJ: A paginatedPosts-ot használjuk a megjelenítéshez
  const posts = derived.paginatedPosts;

  return `
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
      <input id="search" placeholder="Keresés..." value="${state.search}" aria-label="Keresés a posztok között" style="flex: 1;" />
      <select id="filter" aria-label="Kategória szűrése">
        <option value="">Összes kategória</option>
        ${state.categories.map(c => `<option value="${c.id}" ${state.filterCategory == c.id ? 'selected' : ''}>${c.name}</option>`).join("")}
      </select>
      <select id="sort" aria-label="Rendezés">
        <option value="newest" ${state.sortBy === 'newest' ? 'selected' : ''}>Legújabb elöl</option>
        <option value="oldest" ${state.sortBy === 'oldest' ? 'selected' : ''}>Legrégebbi elöl</option>
      </select>
    </div>

    <div class="container">
      ${derived.filteredPosts.length === 0 ? 
        `<div class="card" style="grid-column: 1 / -1; text-align: center;">
           <h2 aria-live="polite">Nincs találat</h2>
           <p>Próbáld megmódosítani a keresési feltételeket!</p>
         </div>` : 
        posts.map(p => `
          <article class="card">
            <h2>${escapeHtml(p.title)}</h2>
            <p>${escapeHtml(p.content.substring(0, 100))}...</p>
            <a href="#/post/${p.id}">Tovább olvasom <span class="sr-only">${escapeHtml(p.title)} posztot</span></a>
          </article>
        `).join("")
      }
    </div>

    ${derived.filteredPosts.length > 0 ? `
    <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
      <button id="prev-page" ${state.currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Előző oldal</button>
      <span>${state.currentPage} / ${derived.totalPages}. oldal</span>
      <button id="next-page" ${state.currentPage === derived.totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Következő oldal</button>
    </div>
    ` : ''}
  `;
}