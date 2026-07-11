export default function AuthPage({
  authMode,
  setAuthMode,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  login,
  registerAccount,
  message,
  error
}) {
  return (
    <div className="page">
      <header>
        <div>
          <p>Master rad projekat</p>
          <h1>Upravljanje događajima</h1>
          <span>Prijava i registracija korisnika</span>
        </div>
      </header>

      {message && <div className="alert ok">{message}</div>}
      {error && <div className="alert err">{error}</div>}

      <section className="card auth-card">
        <div className="auth-tabs">
          <button
            className={authMode === "login" ? "" : "light"}
            onClick={() => setAuthMode("login")}
          >
            Prijava
          </button>

          <button
            className={authMode === "register" ? "" : "light"}
            onClick={() => setAuthMode("register")}
          >
            Registracija
          </button>
        </div>

        {authMode === "login" ? (
          <form onSubmit={login}>
            <h2>Prijava</h2>

            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={e =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Lozinka"
              value={loginForm.password}
              onChange={e =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              required
            />

            <button>Uloguj se</button>
          </form>
        ) : (
          <form onSubmit={registerAccount}>
            <h2>Registracija</h2>

            <input
              placeholder="Korisničko ime"
              value={registerForm.username}
              onChange={e =>
                setRegisterForm({
                  ...registerForm,
                  username: e.target.value
                })
              }
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={e =>
                setRegisterForm({
                  ...registerForm,
                  email: e.target.value
                })
              }
              required
            />

            <input
              type="password"
              placeholder="Lozinka"
              value={registerForm.password}
              onChange={e =>
                setRegisterForm({
                  ...registerForm,
                  password: e.target.value
                })
              }
              required
            />

            <select
              value={registerForm.role}
              onChange={e =>
                setRegisterForm({
                  ...registerForm,
                  role: e.target.value
                })
              }
            >
              <option value="PARTICIPANT">PARTICIPANT</option>
              <option value="ORGANIZER">ORGANIZER</option>
            </select>

            <button>Registruj se</button>
          </form>
        )}
      </section>
    </div>
  );
}
