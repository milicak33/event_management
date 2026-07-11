export default function Statistics({
  isParticipant,
  isAdmin,
  users,
  events,
  visibleRegistrations,
  registeredCount,
  waitingCount,
  selectedEvent
}) {
  return (
    <section className="card wide">
      <h2>Statistika sistema</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <span>{isParticipant ? "Moje prijave" : "Korisnici"}</span>
          <h3>{isParticipant ? visibleRegistrations.length : isAdmin ? users.length : "-"}</h3>
          <p>{isParticipant ? "Za izabrani događaj" : isAdmin ? "Registrovani korisnici" : "Dostupno administratoru"}</p>
        </div>

        <div className="stat-card">
          <span>Događaji</span>
          <h3>{events.length}</h3>
          <p>Dostupni događaji</p>
        </div>

        <div className="stat-card">
          <span>{isParticipant ? "Moj status: registrovan" : "Registrovani"}</span>
          <h3>{registeredCount}</h3>
          <p>{isParticipant ? "Potvrđene moje prijave" : "Učesnici sa potvrđenom prijavom"}</p>
        </div>

        <div className="stat-card">
          <span>Slobodna mesta</span>
          <h3>{selectedEvent ? selectedEvent.availableSpots : 0}</h3>
          <p>Za trenutno izabrani događaj</p>
        </div>

        <div className="stat-card waiting">
          <span>{isParticipant ? "Moj status: čekanje" : "Lista čekanja"}</span>
          <h3>{waitingCount}</h3>
          <p>{isParticipant ? "Moje prijave na čekanju" : "Korisnici na čekanju"}</p>
        </div>
      </div>
    </section>
  );
}
