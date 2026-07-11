import { useState } from "react";
import { Icon } from "./Icons";

export default function AuthPage({ login, registerAccount, message, error }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "admin@test.com", password: "admin123" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", role: "PARTICIPANT" });

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="brand-mark"><Icon name="calendar" size={28}/></div>
        <div>
          <span className="eyebrow">EventFlow</span>
          <h1>Organizujte događaje bez komplikacija.</h1>
          <p>Jedna platforma za događaje, prijave, liste čekanja i komunikaciju u realnom vremenu.</p>
        </div>
        <div className="hero-points">
          <div><Icon name="check"/><span>Kontrola kapaciteta</span></div>
          <div><Icon name="chat"/><span>Chat u realnom vremenu</span></div>
          <div><Icon name="users"/><span>Tri korisničke uloge</span></div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card-modern">
          <div className="auth-toggle">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Prijava</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Registracija</button>
          </div>

          {message && <div className="toast success">{message}</div>}
          {error && <div className="toast error">{error}</div>}

          {mode === "login" ? (
            <form onSubmit={e => login(e, loginForm)}>
              <div className="form-heading"><h2>Dobro došli nazad</h2><p>Prijavite se na svoj nalog.</p></div>
              <label>Email adresa<input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email:e.target.value})} required /></label>
              <label>Lozinka<input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password:e.target.value})} required /></label>
              <button className="primary-btn full">Uloguj se</button>
            </form>
          ) : (
            <form onSubmit={e => registerAccount(e, registerForm, () => setMode("login"))}>
              <div className="form-heading"><h2>Kreirajte nalog</h2><p>Počnite da koristite EventFlow.</p></div>
              <label>Korisničko ime<input value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username:e.target.value})} required /></label>
              <label>Email adresa<input type="email" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email:e.target.value})} required /></label>
              <label>Lozinka<input type="password" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password:e.target.value})} required /></label>
              <label>Tip naloga<select value={registerForm.role} onChange={e => setRegisterForm({...registerForm, role:e.target.value})}><option value="PARTICIPANT">Učesnik</option><option value="ORGANIZER">Organizator</option></select></label>
              <button className="primary-btn full">Registruj se</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
