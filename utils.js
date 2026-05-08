export function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  setTimeout(() => t.innerText = "", 2000);
}

export function confirmDialog(msg) {
  return confirm(msg);
}

export function escapeHtml(value) {
  const s = String(value ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}