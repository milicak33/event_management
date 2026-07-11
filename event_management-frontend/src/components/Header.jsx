export default function Header({
  currentUser,
  selectedEventId,
  loadData,
  loadRegistrations,
  logout
}) {
  return (
    <header>
      <div>
        <p>Master rad projekat</p>
        <h1>Upravljanje događajima</h1>
        <span>React + Spring Boot + PostgreSQL + JWT + WebSocket</span>
      </div>

      <div className="header-actions">
        <span>
          {currentUser.username} ({currentUser.role})
        </span>

        <button
          onClick={async () => {
            await loadData();
            await loadRegistrations(selectedEventId);
          }}
        >
          Osveži podatke
        </button>

        <button className="light" onClick={logout}>
          Odjavi se
        </button>
      </div>
    </header>
  );
}
