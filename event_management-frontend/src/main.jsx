import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Client } from "@stomp/stompjs";
import "./style.css";

const API = "http://localhost:8080";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Došlo je do greške.");
  }

  return data;
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({
    email: "admin@test.com",
    password: "admin123"
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "PARTICIPANT"
  });

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

  const isAdmin = currentUser?.role === "ADMIN";
  const isOrganizer = currentUser?.role === "ORGANIZER";
  const isParticipant = currentUser?.role === "PARTICIPANT";
  const canManageEvents = isAdmin || isOrganizer;

  function canEditEvent(event) {
    return isAdmin || (isOrganizer && event.organizerId === currentUser.userId);
  }

  const canViewSelectedEventRegistrations =
    isAdmin ||
    (isOrganizer && selectedEvent?.organizerId === currentUser.userId);

  const visibleRegistrations = isParticipant
    ? registrations.filter(r => r.userId === currentUser.userId)
    : registrations;

  const registeredCount = visibleRegistrations.filter(
    r => r.status === "REGISTERED"
  ).length;

  const waitingCount = visibleRegistrations.filter(
    r => r.status === "WAITING"
  ).length;

  const cancelledCount = visibleRegistrations.filter(
    r => r.status === "CANCELLED"
  ).length;

  const selectedUserLabel = isAdmin
    ? "Izaberi korisnika za prijavu"
    : "Prijavljeni korisnik";

  async function login(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      setCurrentUser(data);
      setSelectedUserId(String(data.userId));
      setMessage(`Uspešno ste se prijavili kao ${data.username}.`);
    } catch {
      setError("Pogrešan email ili lozinka.");
    }
  }

  async function registerAccount(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm)
      });

      setMessage("Registracija je uspešna. Sada se prijavi.");
      setAuthMode("login");
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password
      });

      setRegisterForm({
        username: "",
        email: "",
        password: "",
        role: "PARTICIPANT"
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setCurrentUser(null);
    setUsers([]);
    setEvents([]);
    setRegistrations([]);
    setSelectedUserId("");
    setSelectedEventId("");
    setMessage("");
    setError("");
  }

  async function loadData() {
    setError("");

    try {
      const loadedEvents = await request("/api/events");
      setEvents(loadedEvents || []);

      if (!selectedEventId && loadedEvents?.length) {
        setSelectedEventId(String(loadedEvents[0].id));
      }

      if (isAdmin) {
        const loadedUsers = await request("/api/users");
        setUsers(loadedUsers || []);
      } else {
        setUsers([
          {
            id: currentUser.userId,
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role
          }
        ]);
        setSelectedUserId(String(currentUser.userId));
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

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && selectedEventId) {
      loadRegistrations(selectedEventId);
    }
  }, [currentUser, selectedEventId]);

  useEffect(() => {
    if (!currentUser || !selectedEventId) return;

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/websocket",
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/events/${selectedEventId}`, async () => {
          await loadData();
          await loadRegistrations(selectedEventId);
          setMessage("Podaci su automatski osveženi.");
        });
      },

      onStompError: frame => {
        console.error("STOMP error:", frame);
      },

      onWebSocketError: error => {
        console.error("WebSocket error:", error);
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [currentUser, selectedEventId]);

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
    const userId = isAdmin ? selectedUserId : currentUser.userId;

    if (!userId || !selectedEventId) {
      setError("Izaberi korisnika i događaj.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const path = `/api/events/${selectedEventId}/registrations/${type}?userId=${userId}`;
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
        { method: "DELETE" }
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEvent(id) {
    if (!confirm("Da li želiš da obrišeš događaj?")) return;

    try {
      await request(`/api/events/${id}`, { method: "DELETE" });

      setMessage("Događaj je obrisan.");

      await loadData();

      if (String(selectedEventId) === String(id)) {
        setSelectedEventId("");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (!currentUser) {
    return (
      <div className="page">
        <header>
          <div>
            <p>Master rad projekat</p>
            <h1>Upravljanje događajima</h1>
            <span>Prijava i registracija korisnika</span>
          </div>
        </header>

        {message && <div className="alert ok">{message}</div>}
        {error && <div className="alert err">{error}</div>}

        <section className="card auth-card">
          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "" : "light"}
              onClick={() => setAuthMode("login")}
            >
              Prijava
            </button>

            <button
              className={authMode === "register" ? "" : "light"}
              onClick={() => setAuthMode("register")}
            >
              Registracija
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={login}>
              <h2>Prijava</h2>

              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={e =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                required
              />

              <input
                type="password"
                placeholder="Lozinka"
                value={loginForm.password}
                onChange={e =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />

              <button>Uloguj se</button>
            </form>
          ) : (
            <form onSubmit={registerAccount}>
              <h2>Registracija</h2>

              <input
                placeholder="Korisničko ime"
                value={registerForm.username}
                onChange={e =>
                  setRegisterForm({
                    ...registerForm,
                    username: e.target.value
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={e =>
                  setRegisterForm({
                    ...registerForm,
                    email: e.target.value
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Lozinka"
                value={registerForm.password}
                onChange={e =>
                  setRegisterForm({
                    ...registerForm,
                    password: e.target.value
                  })
                }
                required
              />

              <select
                value={registerForm.role}
                onChange={e =>
                  setRegisterForm({
                    ...registerForm,
                    role: e.target.value
                  })
                }
              >
                <option value="PARTICIPANT">PARTICIPANT</option>
                <option value="ORGANIZER">ORGANIZER</option>
              </select>

              <button>Registruj se</button>
            </form>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header>
        <div>
          <p>Master rad projekat</p>
          <h1>Upravljanje događajima</h1>
          <span>React + Spring Boot + PostgreSQL + JWT</span>
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

      {message && <div className="alert ok">{message}</div>}
      {error && <div className="alert err">{error}</div>}

      <main className="grid">
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

        {isAdmin && (
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
        )}

        {canManageEvents && (
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
                <button
                  type="button"
                  className="light"
                  onClick={() => {
                    setEditingEventId(null);
                    setEventForm({
                      title: "",
                      description: "",
                      location: "",
                      startTime: "",
                      endTime: "",
                      capacity: 1
                    });
                  }}
                >
                  Otkaži izmenu
                </button>
              )}
            </form>
          </section>
        )}

        <section className="card wide">
          <h2>Događaji</h2>

          {events.length === 0 && <p className="muted">Nema događaja.</p>}

          <div className="events">
            {events.map(ev => (
              <div
                key={ev.id}
                className={
                  String(ev.id) === String(selectedEventId)
                    ? "event active"
                    : "event"
                }
                onClick={() => setSelectedEventId(String(ev.id))}
              >
                <strong>{ev.title}</strong>
                <span>
                  {ev.location}
                  {ev.organizerUsername && (
                    <small>Organizator: {ev.organizerUsername}</small>
                  )}
                </span>
                <b>{ev.availableSpots}/{ev.capacity} mesta</b>

                {canEditEvent(ev) && (
                  <div className="row">
                    <button
                      type="button"
                      className="light"
                      onClick={e => {
                        e.stopPropagation();
                        editEvent(ev);
                      }}
                    >
                      Izmeni
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={e => {
                        e.stopPropagation();
                        deleteEvent(ev.id);
                      }}
                    >
                      Obriši
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

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

        {isParticipant && (
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
                      Status: {" "}
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
        )}

        {!isParticipant && canViewSelectedEventRegistrations && (
          <section className="card">
            <h2>Prijave i lista čekanja</h2>

            {visibleRegistrations.length === 0 && (
              <p className="muted">Nema prijava.</p>
            )}

            {visibleRegistrations.length > 0 && (
              <table>
                <tbody>
                  {visibleRegistrations.map(r => {
                    const user = users.find(u => u.id === r.userId);
                    const canCancel = isAdmin || (isOrganizer && selectedEvent?.organizerId === currentUser.userId);

                    return (
                      <tr key={r.id}>
                        <td>{user?.username || r.userId}</td>

                        <td>
                          <span className={"status " + r.status.toLowerCase()}>
                            {r.status}
                          </span>
                        </td>

                        <td>
                          {r.status !== "CANCELLED" && canCancel ? (
                            <button
                              className="danger"
                              onClick={() => cancelRegistration(r.userId)}
                            >
                              Otkaži
                            </button>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {isOrganizer && selectedEvent && !canViewSelectedEventRegistrations && (
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
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
