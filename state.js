// state.js
export const state = {
  posts: [],
  categories: [],
  loading: false,
  search: new URLSearchParams(location.search).get('q') || "", 
  sortBy: "newest",
  filterCategory: "",
  currentPage: 1, // ÚJ: Lapozáshoz
  itemsPerPage: 4 // ÚJ: Lapozáshoz (pl. 4 poszt egy oldalon)
};

const listeners = [];

export function subscribe(fn) {
  listeners.push(fn);
}

export function setState(newState) {
  Object.assign(state, newState);
  
  // URL szinkronizálása keresésnél
  if (newState.search !== undefined) {
    const url = new URL(location);
    newState.search ? url.searchParams.set('q', newState.search) : url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }

  listeners.forEach(fn => fn());
}

// Derived State: Kiszámolja a szűrt/rendezett és a lapozott posztokat
export const derived = {
  get filteredPosts() {
    let result = state.posts.filter(p => 
      p.title.toLowerCase().includes(state.search.toLowerCase()) &&
      (state.filterCategory ? p.category_id == state.filterCategory : true)
    );
    if (state.sortBy === "oldest") result.reverse();
    return result;
  },
  // ÚJ: Kiszámolja az aktuális oldalon megjelenő posztokat
  get paginatedPosts() {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    return this.filteredPosts.slice(start, end);
  },
  // ÚJ: Kiszámolja az összes oldal számát
  get totalPages() {
    return Math.ceil(this.filteredPosts.length / state.itemsPerPage) || 1;
  }
};