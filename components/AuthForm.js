import { login, register } from "../api.js";
import { toast } from "../utils.js";

export default function render(type) {
  const isLogin = type === "login";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  setTimeout(() => {
    document.getElementById("auth-form").onsubmit = async (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim();
      const pass = e.target.password.value;

      // inline validáció
      const emailErr = document.getElementById("email-error");
      const passErr = document.getElementById("password-error");
      emailErr.innerText = "";
      passErr.innerText = "";

      let hasError = false;
      if (!emailRegex.test(email)) {
        emailErr.innerText = "Kérlek valós email címet adj meg!";
        hasError = true;
      }
      if (!pass || pass.length < 8) {
        passErr.innerText = "A jelszó legalább 8 karakter legyen!";
        hasError = true;
      }
      if (hasError) return;

      try {
        if (isLogin) {
          await login(email, pass);
          toast("Sikeres bejelentkezés!");
          location.hash = "/";
        } else {
          await register(email, pass);
          toast("Sikeres regisztráció! Most jelentkezz be.");
          location.hash = "/login";
        }
      } catch (err) {
        toast(err.message);
      }
    };
  });

  return `
    <div class="card" style="max-width: 400px; margin: 0 auto;">
      <h2>${isLogin ? 'Bejelentkezés' : 'Regisztráció'}</h2>
      <form id="auth-form">
        <div style="margin-bottom: 10px;">
          <input name="email" required placeholder="Email" autocomplete="email" style="width: 100%; box-sizing: border-box;">
          <div id="email-error" style="color: var(--danger); font-size: 0.85rem; font-weight: 600; margin-top: 4px;"></div>
        </div>
        <div style="margin-bottom: 10px;">
          <input name="password" type="password" required placeholder="Jelszó" autocomplete="${isLogin ? "current-password" : "new-password"}" style="width: 100%; box-sizing: border-box;">
          <div id="password-error" style="color: var(--danger); font-size: 0.85rem; font-weight: 600; margin-top: 4px;"></div>
        </div>
        <button style="width: 100%;">${isLogin ? 'Belépés' : 'Regisztráció'}</button>
      </form>
    </div>
  `;
}