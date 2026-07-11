export default function EventsList({
  events,
  allEventsCount,
  myEventsCount,
  eventView,
  setEventView,
  selectedEventId,
  setSelectedEventId,
  canEditEvent,
  editEvent,
  deleteEvent
}) {
  const selectedEvent = events.find(
    event => String(event.id) === String(selectedEventId)
  );

  return (
    <section className="card wide">
      <div className="section-header">
        <div>
          <h2>Događaji</h2>
          <p className="muted">
            {eventView === "ALL"
              ? "Izaberi događaj koji želiš da pregledaš."
              : "Prikazani su događaji povezani sa tvojim nalogom."}
          </p>
        </div>

        <div className="segmented">
          <button
            type="button"
            className={eventView === "ALL" ? "active" : ""}
            onClick={() => setEventView("ALL")}
          >
            Svi događaji ({allEventsCount})
          </button>

          <button
            type="button"
            className={eventView === "MINE" ? "active" : ""}
            onClick={() => setEventView("MINE")}
          >
            Moji događaji ({myEventsCount})
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="muted">
          {eventView === "ALL"
            ? "Nema događaja."
            : "Trenutno nema događaja u sekciji Moji događaji."}
        </p>
      ) : (
        <>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} — {event.location}
              </option>
            ))}
          </select>

          {selectedEvent && (
            <div className="event-summary-card">
              <h3>{selectedEvent.title}</h3>

              <div className="event-summary-grid">
                <div className="event-summary-item">
                  <span>Lokacija</span>
                  <b>{selectedEvent.location}</b>
                </div>

                <div className="event-summary-item">
                  <span>Organizator</span>
                  <b>{selectedEvent.organizerUsername || "Nije definisan"}</b>
                </div>

                <div className="event-summary-item">
                  <span>Slobodna mesta</span>
                  <b>{selectedEvent.availableSpots}/{selectedEvent.capacity}</b>
                </div>

                <div className="event-summary-item">
                  <span>Verzija</span>
                  <b>{selectedEvent.version}</b>
                </div>
              </div>

              {canEditEvent(selectedEvent) && (
                <div className="card-actions">
                  <button
                    type="button"
                    className="light"
                    onClick={() => editEvent(selectedEvent)}
                  >
                    Izmeni događaj
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteEvent(selectedEvent.id)}
                  >
                    Obriši događaj
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
