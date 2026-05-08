const API_URL = window.location.hostname === "localhost" ? "http://localhost:3000" : "";

// Segédfüggvény a belépőkártya (token) csatolásához
function getHeaders() {
  const token = localStorage.getItem("token");
  return { 
    "Content-Type": "application/json", 
    ...(token ? { "Authorization": `Bearer ${token}` } : {}) 
  };
}

// Univerzális kérés-küldő függvény
async function request(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers: getHeaders() });
  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(text || `Szerver hiba (${res.status})`);
    }
    throw new Error("A szerver nem JSON választ adott.");
  }
  if (!res.ok) {
    const details = data?.details ? `\nRészletek: ${data.details}` : "";
    throw new Error((data.error || `Hiba történt a szerverrel való kommunikációban! (${res.status})`) + details);
  }
  return data;
}

// --- POSZTOK ---
export const getPosts = () => request("/posts");
export const createPost = (data) => request("/posts", { method: "POST", body: JSON.stringify(data) });
export const updatePost = (id, data) => request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePost = (id) => request(`/posts/${id}`, { method: "DELETE" });

// --- KATEGÓRIÁK ---
export const getCategories = () => request("/categories");

// --- KOMMENTEK ---
export const getComments = (postId) => request(`/comments/${postId}`);
export const createComment = (data) => request("/comments", { method: "POST", body: JSON.stringify(data) });
export const deleteComment = (id) => request(`/comments/${id}`, { method: "DELETE" });
export const updateComment = (id, content) => request(`/comments/${id}`, { method: "PUT", body: JSON.stringify({ content }) });

// --- AUTENTIKÁCIÓ (BEJELENTKEZÉS) ---
export const login = async (username, password) => {
  const data = await request("/login", { method: "POST", body: JSON.stringify({ username, password }) });
  localStorage.setItem("token", data.token); 
  localStorage.setItem("role", data.role); 
  localStorage.setItem("username", data.username);
  if (data.userId != null) localStorage.setItem("userId", String(data.userId));
};

export const register = (username, password) => request("/register", { method: "POST", body: JSON.stringify({ username, password }) });

export const logout = () => { 
  localStorage.clear(); 
  location.hash = "/"; 
  location.reload(); 
};