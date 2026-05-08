import { logout } from "../api.js";
import { escapeHtml } from "../utils.js";

export default function Navbar() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  
  // Megnézzük, mi az aktuális útvonal a kiemeléshez
  const path = location.hash.slice(1).split("/")[1] || "";
  const isActive = (route) => path === route ? 'style="color: var(--primary); border-bottom: 2px solid var(--primary);"' : '';

  setTimeout(() => {
    const btn = document.getElementById("logout-btn");
    if (btn) btn.onclick = logout;
  });

  return `
    <div style="display:flex; gap: 1rem; width: 100%; justify-content: space-between;">
      <div style="display:flex; gap: 1rem;">
        <a href="#/" ${isActive("")}>Főoldal</a>
        ${username ? `<a href="#/new" ${isActive("new")}>Új poszt</a>` : ''}
      </div>
      <div>
        ${username 
          ? `<span>Szia, <b>${escapeHtml(username)}</b> (${escapeHtml(role || "")})</span> <button id="logout-btn" style="padding: 4px 8px;">Kilépés</button>` 
          : `<a href="#/login" ${isActive("login")}>Bejelentkezés</a> | <a href="#/register" ${isActive("register")}>Regisztráció</a>`
        }
      </div>
    </div>
  `;
}

// Újrarajzoljuk a menüt, ha megváltozik az URL
document.addEventListener("routeChanged", () => {
  document.getElementById("nav").innerHTML = Navbar();
});