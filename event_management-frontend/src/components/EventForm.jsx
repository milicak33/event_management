export default function EventForm({
  editingEventId,
  eventForm,
  setEventForm,
  createEvent,
  cancelEdit
}) {
  return (
    <section className="card">
      <h2>{editingEventId ? "Izmena događaja" : "Novi događaj"}</h2>

      <form onSubmit={createEvent}>
        <input
          placeholder="Naziv"
          value={eventForm.title}
          onChange={e =>
            setEventForm({ ...eventForm, title: e.target.value })
          }
          required
        />

        <textarea
          placeholder="Opis"
          value={eventForm.description}
          onChange={e =>
            setEventForm({ ...eventForm, description: e.target.value })
          }
        />

        <input
          placeholder="Lokacija"
          value={eventForm.location}
          onChange={e =>
            setEventForm({ ...eventForm, location: e.target.value })
          }
          required
        />

        <label>
          Početak
          <input
            type="datetime-local"
            value={eventForm.startTime}
            onChange={e =>
              setEventForm({ ...eventForm, startTime: e.target.value })
            }
            required
          />
        </label>

        <label>
          Kraj
          <input
            type="datetime-local"
            value={eventForm.endTime}
            onChange={e =>
              setEventForm({ ...eventForm, endTime: e.target.value })
            }
            required
          />
        </label>

        <input
          type="number"
          min="1"
          value={eventForm.capacity}
          onChange={e =>
            setEventForm({ ...eventForm, capacity: e.target.value })
          }
          required
        />

        <button>{editingEventId ? "Sačuvaj izmene" : "Dodaj događaj"}</button>

        {editingEventId && (
          <button type="button" className="light" onClick={cancelEdit}>
            Otkaži izmenu
          </button>
        )}
      </form>
    </section>
  );
}
