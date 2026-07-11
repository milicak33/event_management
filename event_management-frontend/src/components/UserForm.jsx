export default function UserForm({ userForm, setUserForm, createUser }) {
  return (
    <section className="card">
      <h2>Novi korisnik</h2>

      <form onSubmit={createUser}>
        <input
          placeholder="Korisničko ime"
          value={userForm.username}
          onChange={e =>
            setUserForm({ ...userForm, username: e.target.value })
          }
          required
        />

        <input
          placeholder="Email"
          type="email"
          value={userForm.email}
          onChange={e =>
            setUserForm({ ...userForm, email: e.target.value })
          }
          required
        />

        <input
          placeholder="Lozinka"
          value={userForm.password}
          onChange={e =>
            setUserForm({ ...userForm, password: e.target.value })
          }
          required
        />

        <select
          value={userForm.role}
          onChange={e =>
            setUserForm({ ...userForm, role: e.target.value })
          }
        >
          <option value="PARTICIPANT">PARTICIPANT</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <button>Dodaj korisnika</button>
      </form>
    </section>
  );
}
