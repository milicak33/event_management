import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { Client } from "@stomp/stompjs";


const API = "http://localhost:8080";


async function request(path, options = {}) {
  const response = await fetch(API + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Došlo je do greške.");
  }
  return data;
}

function App() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "123456",
    role: "PARTICIPANT"
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    capacity: 1
  });

  const selectedEvent = useMemo(
    () => events.find(e => String(e.id) === String(selectedEventId)),
    [events, selectedEventId]
  );

  async function loadData() {
    setError("");
    try {
      const loadedUsers = await request("/api/users");
      const loadedEvents = await request("/api/events");
      setUsers(loadedUsers || []);
      setEvents(loadedEvents || []);
      if (!selectedEventId && loadedEvents?.length) {
        setSelectedEventId(String(loadedEvents[0].id));
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadRegistrations(eventId = selectedEventId) {
    if (!eventId) return;
    try {
      const data = await request(`/api/events/${eventId}/registrations`);
      setRegistrations(data || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadRegistrations(); }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
  
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/websocket",
      reconnectDelay: 5000,
  
      onConnect: () => {
        console.log("WebSocket connected");
  
        client.subscribe(`/topic/events/${selectedEventId}`, async () => {
          console.log("Received WebSocket update");
  
          await loadData();
          await loadRegistrations(selectedEventId);
  
          setMessage("Podaci su automatski osveženi.");
        });
      },
  
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
  
      onWebSocketError: (error) => {
        console.error("WebSocket error:", error);
      }
    });
  
    client.activate();
  
    return () => {
      client.deactivate();
    };
  }, [selectedEventId]);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const created = await request("/api/users", {
        method: "POST",
        body: JSON.stringify(userForm)
      });

      setMessage(`Korisnik ${created.username} je kreiran.`);
      setUserForm({
        username: "",
        email: "",
        password: "123456",
        role: "PARTICIPANT"
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createEvent(e) {
    e.preventDefault();
    setError("");
    setMessage("");
  
    try {
      let result;
  
      if (editingEventId) {
        result = await request(`/api/events/${editingEventId}`, {
          method: "PUT",
          body: JSON.stringify({
            ...eventForm,
            capacity: Number(eventForm.capacity)
          })
        });
  
        setMessage(`Događaj "${result.title}" je izmenjen.`);
        setEditingEventId(null);
      } else {
        result = await request("/api/events", {
          method: "POST",
          body: JSON.stringify({
            ...eventForm,
            capacity: Number(eventForm.capacity)
          })
        });
  
        setMessage(`Događaj "${result.title}" je kreiran.`);
      }
  
      setEventForm({
        title: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        capacity: 1
      });
  
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function register(type) {
    if (!selectedUserId || !selectedEventId) {
      setError("Izaberi korisnika i događaj.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const path = `/api/events/${selectedEventId}/registrations/${type}?userId=${selectedUserId}`;
      const reg = await request(path, { method: "POST" });

      setMessage(`Prijava uspešna. Status: ${reg.status}`);

      await loadData();
      await loadRegistrations(selectedEventId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelRegistration(userId) {
    if (!selectedEventId) {
      setError("Izaberi događaj.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const cancelled = await request(
        `/api/events/${selectedEventId}/registrations?userId=${userId}`,
        {
          method: "DELETE"
        }
      );

      setMessage(`Prijava korisnika ID ${cancelled.userId} je otkazana.`);

      await loadData();
      await loadRegistrations(selectedEventId);
    } catch (err) {
      setError(err.message);
    }
  }

  function editEvent(event) {
    setEditingEventId(event.id);
  
    setEventForm({
      title: event.title,
      description: event.description || "",
      location: event.location,
      startTime: event.startTime.slice(0, 16),
      endTime: event.endTime.slice(0, 16),
      capacity: event.capacity
    });
  
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function deleteEvent(id) {
    if (!confirm("Da li želiš da obrišeš događaj?")) {
      return;
    }
  
    try {
      await request(`/api/events/${id}`, {
        method: "DELETE"
      });
  
      setMessage("Događaj je obrisan.");
  
      await loadData();
  
      if (String(selectedEventId) === String(id)) {
        setSelectedEventId("");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  

  return (
    <div className="page">
      <header>
        <div>
          <p>Master rad projekat</p>
          <h1>Upravljanje događajima</h1>
          <span>React + Spring Boot + PostgreSQL</span>
        </div>
        <button
          onClick={async () => {
            await loadData();
            await loadRegistrations(selectedEventId);
          }}
        >
          Osveži podatke
        </button>
      </header>

      {message && <div className="alert ok">{message}</div>}
      {error && <div className="alert err">{error}</div>}

      <main className="grid">
      	<section className="card wide">
  	 <h2>Statistika sistema</h2>

	   <div className="stats-grid">
	    <div className="stat-card">
	      <span>Korisnici</span>
	      <h3>{users.length}</h3>
	      <p>Registrovani korisnici</p>
	   </div>

	    <div className="stat-card">
	      <span>Događaji</span>
	      <h3>{events.length}</h3>
	      <p>Kreirani događaji</p>
	    </div>

	    <div className="stat-card">
	      <span>Registrovani</span>
	      <h3>{registrations.filter(r => r.status === "REGISTERED").length}</h3>
	      <p>Učesnici sa potvrđenom prijavom</p>
	    </div>

	    <div className="stat-card">
	      <span>Slobodna mesta</span>
	      <h3>{selectedEvent ? selectedEvent.availableSpots : 0}</h3>
	      <p>Za trenutno izabrani događaj</p>
	    </div>

	    <div className="stat-card waiting">
	      <span>Lista čekanja</span>
	      <h3>
		{registrations.filter(r => r.status === "WAITING").length}
	      </h3>
	      <p>Korisnici na čekanju</p>
	    </div>
  	</div>
	</section>
        <section className="card">
          <h2>Novi korisnik</h2>
          <form onSubmit={createUser}>
            <input
              placeholder="Korisničko ime"
              value={userForm.username}
              onChange={e => setUserForm({ ...userForm, username: e.target.value })}
              required
            />

            <input
              placeholder="Email"
              type="email"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              required
            />

            <input
              placeholder="Lozinka"
              value={userForm.password}
              onChange={e => setUserForm({ ...userForm, password: e.target.value })}
              required
            />

            <select
              value={userForm.role}
              onChange={e => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="PARTICIPANT">PARTICIPANT</option>
              <option value="ORGANIZER">ORGANIZER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <button>Dodaj korisnika</button>
          </form>
        </section>

        <section className="card">
          <h2>Novi događaj</h2>
          <form onSubmit={createEvent}>
            <input
              placeholder="Naziv"
              value={eventForm.title}
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />

            <textarea
              placeholder="Opis"
              value={eventForm.description}
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
            />

            <input
              placeholder="Lokacija"
              value={eventForm.location}
              onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
              required
            />

            <label>
              Početak
              <input
                type="datetime-local"
                value={eventForm.startTime}
                onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })}
                required
              />
            </label>

            <label>
              Kraj
              <input
                type="datetime-local"
                value={eventForm.endTime}
                onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                required
              />
            </label>

            <input
              type="number"
              min="1"
              value={eventForm.capacity}
              onChange={e => setEventForm({ ...eventForm, capacity: e.target.value })}
              required
            />

            <button>
              {editingEventId ? "Sačuvaj izmene" : "Dodaj događaj"}
            </button>
          </form>
        </section>

        <section className="card wide">
          <h2>Događaji</h2>
          {events.length === 0 && <p className="muted">Nema događaja.</p>}

          <div className="events">
            {events.map(ev => (
              <div
                key={ev.id}
                className={String(ev.id) === String(selectedEventId) ? "event active" : "event"}
                onClick={() => setSelectedEventId(String(ev.id))}
              >
                <strong>{ev.title}</strong>
                <span>{ev.location}</span>
                <b>{ev.availableSpots}/{ev.capacity} mesta</b>

                <div className="row">
                  <button
                    type="button"
                    className="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      editEvent(ev);
                    }}
                  >
                    Izmeni
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(ev.id);
                    }}
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Prijava učesnika</h2>

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

          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="">Izaberi događaj</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          <div className="row">
            <button onClick={() => register("optimistic")}>
              Optimistička prijava
            </button>

            <button className="light" onClick={() => register("pessimistic")}>
              Pesimistička prijava
            </button>
          </div>

          {selectedEvent && (
            <div className="info">
              <h3>{selectedEvent.title}</h3>
              <p>Kapacitet: {selectedEvent.capacity}</p>
              <p>Slobodna mesta: {selectedEvent.availableSpots}</p>
              <p>Version: {selectedEvent.version}</p>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Prijave i lista čekanja</h2>

          {registrations.length === 0 && (
            <p className="muted">Nema prijava.</p>
          )}

          <table>
            <tbody>
              {registrations.map(r => {
                const user = users.find(u => u.id === r.userId);

                return (
                  <tr key={r.id}>
                    <td>{user?.username || r.userId}</td>

                    <td>
                      <span className={"status " + r.status.toLowerCase()}>
                        {r.status}
                      </span>
                    </td>

                    <td>
                      {r.status !== "CANCELLED" ? (
                        <button
                          className="danger"
                          onClick={() => cancelRegistration(r.userId)}
                        >
                          Otkaži
                        </button>
                      ) : (
                        <span className="muted">Otkazano</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);