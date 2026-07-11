export default function ParticipantRegistrationCard({
  selectedEvent,
  visibleRegistrations,
  cancelRegistration
}) {
  return (
    <section className="card">
      <h2>Moja prijava</h2>

      {visibleRegistrations.length === 0 && (
        <div className="info">
          <h3>{selectedEvent?.title || "Izabrani događaj"}</h3>
          <p className="muted">Niste prijavljeni na izabrani događaj.</p>
          {selectedEvent && (
            <>
              <p>Kapacitet: <b>{selectedEvent.capacity}</b></p>
              <p>Slobodna mesta: <b>{selectedEvent.availableSpots}</b></p>
            </>
          )}
        </div>
      )}

      {visibleRegistrations.length > 0 && (
        <div className="events">
          {visibleRegistrations.map(r => (
            <div className="info" key={r.id}>
              <h3>{selectedEvent?.title || "Događaj"}</h3>
              <p>
                Status:{" "}
                <span className={"status " + r.status.toLowerCase()}>
                  {r.status}
                </span>
              </p>

              {selectedEvent && (
                <>
                  <p>Kapacitet: <b>{selectedEvent.capacity}</b></p>
                  <p>Slobodna mesta: <b>{selectedEvent.availableSpots}</b></p>
                </>
              )}

              {r.status !== "CANCELLED" ? (
                <button
                  className="danger"
                  onClick={() => cancelRegistration(r.userId)}
                >
                  Otkaži prijavu
                </button>
              ) : (
                <p className="muted">Prijava je otkazana.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
