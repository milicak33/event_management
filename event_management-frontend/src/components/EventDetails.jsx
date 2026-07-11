import { Icon } from "./Icons";

function fmt(value) {
  return value
    ? new Date(value).toLocaleString("sr-RS", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Nije definisano";
}

export default function EventDetails({
  event,
  currentUser,
  isParticipant,
  canEdit,
  registrations,
  users,
  onBack,
  onEdit,
  onDelete,
  onRegister,
  onCancelRegistration,
}) {
  const mine = registrations.filter(
    (registration) => registration.userId === currentUser.userId
  );

  const activeMine = mine.find(
    (registration) => registration.status !== "CANCELLED"
  );

  const registered = registrations.filter(
    (registration) => registration.status === "REGISTERED"
  ).length;

  const waiting = registrations.filter(
    (registration) => registration.status === "WAITING"
  ).length;

  const occupancy = event.capacity
    ? Math.round(
        ((event.capacity - event.availableSpots) / event.capacity) * 100
      )
    : 0;

  return (
    <div className="view-stack event-detail-view">
      <button className="text-btn detail-back" onClick={onBack}>
        <Icon name="back" />
        Nazad na događaje
      </button>

      <section className="event-hero-detail reveal-card">
        <div className="event-hero-pattern" />

        <div className="detail-content">
          <div className="detail-badges">
            <span className="eyebrow">Detalji događaja</span>

            <span
              className={
                event.availableSpots > 0
                  ? "capacity-pill open"
                  : "capacity-pill full"
              }
            >
              {event.availableSpots > 0 ? "Prijave otvorene" : "Popunjeno"}
            </span>
          </div>

          <h1>{event.title}</h1>
          <p>{event.description || "Opis događaja nije unet."}</p>

          <div className="detail-meta">
            <span>
              <Icon name="map" />
              {event.location}
            </span>

            <span>
              <Icon name="clock" />
              {fmt(event.startTime)}
            </span>

            <span>
              <Icon name="users" />
              {event.organizerUsername || "Organizator nije naveden"}
            </span>
          </div>
        </div>

        <div className="capacity-card">
          <small>Popunjenost događaja</small>

          <strong>
            {occupancy}
            <span>%</span>
          </strong>

          <div className="progress">
            <i
              style={{
                width: `${Math.max(0, Math.min(100, occupancy))}%`,
              }}
            />
          </div>

          <div className="capacity-breakdown">
            <span>
              <b>{registered}</b> registrovanih
            </span>
            <span>
              <b>{waiting}</b> na čekanju
            </span>
            <span>
              <b>{event.availableSpots}</b> slobodnih
            </span>
          </div>
        </div>
      </section>

      <section className="detail-summary-grid reveal-card">
        <article>
          <span className="summary-icon blue">
            <Icon name="clock" />
          </span>
          <div>
            <small>Početak</small>
            <b>{fmt(event.startTime)}</b>
          </div>
        </article>

        <article>
          <span className="summary-icon green">
            <Icon name="map" />
          </span>
          <div>
            <small>Lokacija</small>
            <b>{event.location}</b>
          </div>
        </article>

        <article>
          <span className="summary-icon violet">
            <Icon name="users" />
          </span>
          <div>
            <small>Organizator</small>
            <b>{event.organizerUsername || "Nije naveden"}</b>
          </div>
        </article>

        <article>
          <span className="summary-icon amber">
            <Icon name="seats" />
          </span>
          <div>
            <small>Kapacitet</small>
            <b>{event.capacity} mesta</b>
          </div>
        </article>
      </section>

      <section className="detail-actions-bar reveal-card">
        <div className="detail-action-copy">
          <b>{isParticipant ? "Način prijave" : "Akcije za događaj"}</b>
          <small>
            {isParticipant
              ? "Izaberite način prijave na događaj."
              : "Upravljajte događajem i prijavama."}
          </small>
        </div>

        <div className="detail-action-buttons">
          {canEdit && (
            <>
              <button className="secondary-btn" onClick={onEdit}>
                <Icon name="edit" />
                Izmeni
              </button>

              <button className="danger-btn" onClick={onDelete}>
                <Icon name="trash" />
                Obriši
              </button>
            </>
          )}

          {isParticipant && !activeMine && (
            <>
              <button
                className="primary-btn"
                onClick={() => onRegister("optimistic")}
              >
                <Icon name="check" />
                Brza prijava (Optimistic)
              </button>

              <button
                className="secondary-btn"
                onClick={() => onRegister("pessimistic")}
              >
                <Icon name="shield" />
                Sigurna prijava (Pessimistic)
              </button>
            </>
          )}

          {isParticipant && activeMine && (
            <div className="registration-state">
              <span className={`status ${activeMine.status.toLowerCase()}`}>
                {activeMine.status}
              </span>

              <button
                className="danger-link"
                onClick={() => onCancelRegistration(activeMine.userId)}
              >
                Otkaži prijavu
              </button>
            </div>
          )}
        </div>
      </section>

      {!isParticipant && canEdit && (
        <section className="panel-modern reveal-card">
          <div className="panel-header">
            <div>
              <h2>Prijave i lista čekanja</h2>
              <p>Upravljajte prijavljenim učesnicima za ovaj događaj.</p>
            </div>

            <div className="panel-counts">
              <span className="count-badge">{registered} prijavljenih</span>
              <span className="count-badge waiting-count">{waiting} čeka</span>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="empty-inline">Još nema prijava.</div>
          ) : (
            <div className="registration-list">
              {registrations.map((registration) => {
                const user = users.find(
                  (item) => item.id === registration.userId
                );

                return (
                  <div className="registration-row" key={registration.id}>
                    <span className="avatar small-avatar">
                      {(user?.username || registration.userId)?.toString()[0]}
                    </span>

                    <div>
                      <b>
                        {user?.username || `Korisnik ${registration.userId}`}
                      </b>
                      <small>
                        {user?.email || `ID: ${registration.userId}`}
                      </small>
                    </div>

                    <span
                      className={`status ${registration.status.toLowerCase()}`}
                    >
                      {registration.status}
                    </span>

                    {registration.status !== "CANCELLED" && (
                      <button
                        className="icon-btn danger-icon"
                        onClick={() =>
                          onCancelRegistration(registration.userId)
                        }
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
