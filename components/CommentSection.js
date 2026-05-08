import { getComments, createComment, deleteComment, updateComment } from "../api.js";
import { toast, confirmDialog, escapeHtml } from "../utils.js";

export default async function CommentSection(postId) {
  const comments = await getComments(postId).catch(() => []);
  const username = localStorage.getItem("username");
  const isAdmin = localStorage.getItem("role") === "admin";
  const userId = Number(localStorage.getItem("userId"));

  setTimeout(() => {
    const form = document.getElementById("comment-form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await createComment({ content: e.target.content.value, postId });
        toast("Komment elküldve!");
        location.reload();
      };
    }

    // Törlés és Szerkesztés események (Delegálással)
    document.querySelectorAll(".del-comment").forEach(btn => {
      btn.onclick = async (e) => {
        if (confirmDialog("Biztos törlöd a kommentet?")) {
          await deleteComment(e.target.dataset.id);
          location.reload();
        }
      };
    });

    document.querySelectorAll(".edit-comment").forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.target.dataset.id;
        const newContent = prompt("Új tartalom:");
        if (newContent) {
          await updateComment(id, newContent);
          location.reload();
        }
      };
    });
  });

  return `
    <div style="margin-top: 3rem;">
      <h3>Hozzászólások (${comments.length})</h3>
      
      ${username ? `
        <form id="comment-form" style="box-shadow: none; padding: 0; margin-bottom: 2rem;">
          <textarea name="content" required placeholder="Írd le a véleményed..." style="min-height: 80px; width: 100%;"></textarea>
          <button style="margin-top: 0.5rem;">Küldés</button>
        </form>
      ` : `<p style="margin-bottom: 2rem;"><a href="#/login">Jelentkezz be</a> a hozzászóláshoz!</p>`}

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${comments.map(c => `
          <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
            <p style="margin: 0 0 0.5rem 0;">${escapeHtml(c.content)}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted);">
              <span>Dátum: ${new Date(c.created_at).toLocaleString()}</span>
              ${(isAdmin || Number(c.user_id) === userId) ? `
                <div>
                  <button data-id="${c.id}" class="edit-comment" style="padding: 2px 8px; background: var(--secondary);">Szerkeszt</button>
                  <button data-id="${c.id}" class="del-comment" style="padding: 2px 8px; background: var(--danger);">Töröl</button>
                </div>
              ` : ''}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}