export default function RegistrationPanel({
  isAdmin,
  isParticipant,
  selectedUserLabel,
  currentUser,
  users,
  selectedUserId,
  setSelectedUserId,
  selectedEvent,
  register
}) {
  return (
    <section className="card">
      <h2>{isParticipant ? "Prijava na događaj" : "Prijava učesnika"}</h2>

      {isAdmin && (
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
        >
          <option value="">Izaberi korisnika</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.username} ({u.role})
            </option>
          ))}
        </select>
      )}

      {!isAdmin && (
        <div className="info">
          <p className="muted">{selectedUserLabel}</p>
          <h3>{currentUser.username}</h3>
          <p>Uloga: <b>{currentUser.role}</b></p>
        </div>
      )}

      {selectedEvent ? (
        <>
          <p className="selected-event-note">
            Prijava se odnosi na izabrani događaj:
          </p>

          <div className="info">
            <h3>{selectedEvent.title}</h3>
            <p>Kapacitet: <b>{selectedEvent.capacity}</b></p>
            <p>Slobodna mesta: <b>{selectedEvent.availableSpots}</b></p>
            <p>Version: <b>{selectedEvent.version}</b></p>
          </div>

          <div className="registration-actions">
            <button onClick={() => register("optimistic")}>
              Optimistička prijava
            </button>

            <button className="light" onClick={() => register("pessimistic")}>
              Pesimistička prijava
            </button>
          </div>
        </>
      ) : (
        <p className="muted">Prvo izaberi događaj.</p>
      )}
    </section>
  );
}
