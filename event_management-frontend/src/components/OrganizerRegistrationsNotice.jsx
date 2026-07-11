export default function OrganizerRegistrationsNotice({ selectedEvent }) {
  return (
    <section className="card">
      <h2>Prijave i lista čekanja</h2>

      <div className="info">
        <h3>{selectedEvent.title}</h3>
        <p className="muted">
          Prijave su dostupne samo organizatoru koji je kreirao izabrani događaj.
        </p>

        {selectedEvent.organizerUsername && (
          <p>
            Organizator događaja: <b>{selectedEvent.organizerUsername}</b>
          </p>
        )}
      </div>
    </section>
  );
}
