import { state } from "../state.js";
import { updatePost, deletePost } from "../api.js";
import { confirmDialog, toast, escapeHtml } from "../utils.js";
import CommentSection from "./CommentSection.js";

export default async function render(id) {
  const post = state.posts.find(p => p.id == id);
  if (!post) return "<p>Nincs ilyen poszt</p>";

  const isAdmin = localStorage.getItem("role") === "admin";
  const userId = Number(localStorage.getItem("userId"));
  const isOwner = Number(post.user_id) === userId;
  const canEdit = isAdmin || isOwner;

  // 1. ELŐBB letöltjük a kommenteket (Hálózati várakozás)
  const commentsHTML = await CommentSection(id);

  // 2. CSAK EZUTÁN kötjük be a gombokat, amikor már biztosan kikerülnek a DOM-ba
  setTimeout(() => {
    const delBtn = document.getElementById("delete-post");
    if (delBtn) {
      delBtn.onclick = async () => {
        if (confirmDialog("Biztos törlöd a teljes posztot?")) {
          try {
            await deletePost(id);
            toast("Poszt törölve");
            location.hash = "/";
          } catch (err) {
            alert("Hiba a törlésnél: " + err.message);
          }
        }
      };
    }

    const editBtn = document.getElementById("edit-post");
    if (editBtn) {
      editBtn.onclick = async () => {
        const title = prompt("Új cím", post.title);
        if (!title) return;
        
        const content = prompt("Új tartalom", post.content);
        if (!content) return;
        
        try {
          await updatePost(id, { title, content });
          toast("Sikeres frissítés!");
          location.reload();
        } catch (err) {
          alert("Hiba a szerkesztésnél: " + err.message);
        }
      };
    }
  }, 50); // 50ms extra ráhagyás, hogy a böngésző biztosan megrajzolja a HTML-t

  return `
    <article class="card">
      <header style="margin-bottom: 2rem;">
        <h1 style="margin-bottom: 0.5rem;">${escapeHtml(post.title)}</h1>
        <small style="color: var(--text-muted);">Posztolva: ${new Date(post.created_at).toLocaleString()}</small>
      </header>
      
      <p style="font-size: 1.1rem; line-height: 1.8;">${escapeHtml(post.content)}</p>

      <div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem;">
        <a href="#/">Vissza a listához</a>
        
        ${canEdit ? `
          <div>
            <button id="edit-post" style="background: var(--secondary);">Szerkesztés</button>
            <button id="delete-post" style="background: var(--danger); color: white; border: none; margin-left: 0.5rem;">Törlés</button>
          </div>
        ` : ''}
      </div>
    </article>

    ${commentsHTML}
  `;
}