import { useEffect, useMemo, useState } from "react";
import { Client } from "@stomp/stompjs";
import { request } from "./api/client";
import AuthPage from "./components/AuthPage";
import Header from "./components/Header";
import Statistics from "./components/Statistics";
import UserForm from "./components/UserForm";
import EventForm from "./components/EventForm";
import EventsList from "./components/EventsList";
import RegistrationPanel from "./components/RegistrationPanel";
import ParticipantRegistrationCard from "./components/ParticipantRegistrationCard";
import RegistrationsList from "./components/RegistrationsList";
import OrganizerRegistrationsNotice from "./components/OrganizerRegistrationsNotice";
import ChatPanel from "./components/ChatPanel";

const emptyEventForm = {
  title: "",
  description: "",
  location: "",
  startTime: "",
  endTime: "",
  capacity: 1
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem("user");
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

  const [eventForm, setEventForm] = useState(emptyEventForm);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatForm, setChatForm] = useState({
    content: "",
    type: "PUBLIC"
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

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data));

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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setCurrentUser(null);
    setUsers([]);
    setEvents([]);
    setRegistrations([]);
    setSelectedUserId("");
    setSelectedEventId("");
    setChatMessages([]);
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

  async function loadChatMessages(eventId = selectedEventId) {
    if (!eventId) return;

    try {
      const data = await request(`/api/events/${eventId}/chat`);
      setChatMessages(data || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function sendChatMessage(e) {
  e.preventDefault();
  setError("");
  setMessage("");

  if (!selectedEventId) {
    setError("Izaberi događaj pre slanja poruke.");
    return;
  }

  if (!chatForm.content.trim()) {
    setError("Unesi tekst poruke.");
    return;
  }

  try {
    await request(`/api/events/${selectedEventId}/chat`, {
      method: "POST",
      body: JSON.stringify({
        content: chatForm.content.trim(),
        type: chatForm.type
      })
    });

    setChatForm({
      content: "",
      type: "PUBLIC"
    });

    await loadChatMessages(selectedEventId);
  } catch (err) {
    setError(err.message);
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
      loadChatMessages(selectedEventId);
    }
  }, [currentUser, selectedEventId]);

  useEffect(() => {
    if (!currentUser || !selectedEventId) return;

    const token = sessionStorage.getItem("token");

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/websocket",
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},

      onConnect: () => {
        client.subscribe(`/topic/events/${selectedEventId}`, async () => {
          await loadData();
          await loadRegistrations(selectedEventId);
          setMessage("Podaci su automatski osveženi.");
        });

        client.subscribe(`/topic/events/${selectedEventId}/chat/public`, message => {
          const newMessage = JSON.parse(message.body);

          setChatMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }

            return [...prev, newMessage];
          });
        });

        client.subscribe(`/user/queue/events/${selectedEventId}/chat/private`, message => {
          const newMessage = JSON.parse(message.body);

          setChatMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }

            return [...prev, newMessage];
          });
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

      setEventForm(emptyEventForm);
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

  function cancelEdit() {
    setEditingEventId(null);
    setEventForm(emptyEventForm);
  }

  if (!currentUser) {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        login={login}
        registerAccount={registerAccount}
        message={message}
        error={error}
      />
    );
  }

  return (
    <div className="page">
      <Header
        currentUser={currentUser}
        selectedEventId={selectedEventId}
        loadData={loadData}
        loadRegistrations={loadRegistrations}
        logout={logout}
      />

      {message && <div className="alert ok">{message}</div>}
      {error && <div className="alert err">{error}</div>}

      <main className="grid">
        <Statistics
          isParticipant={isParticipant}
          isAdmin={isAdmin}
          users={users}
          events={events}
          visibleRegistrations={visibleRegistrations}
          registeredCount={registeredCount}
          waitingCount={waitingCount}
          selectedEvent={selectedEvent}
        />

        {isAdmin && (
          <UserForm
            userForm={userForm}
            setUserForm={setUserForm}
            createUser={createUser}
          />
        )}

        {canManageEvents && (
          <EventForm
            editingEventId={editingEventId}
            eventForm={eventForm}
            setEventForm={setEventForm}
            createEvent={createEvent}
            cancelEdit={cancelEdit}
          />
        )}

        <EventsList
          events={events}
          selectedEventId={selectedEventId}
          setSelectedEventId={setSelectedEventId}
          canEditEvent={canEditEvent}
          editEvent={editEvent}
          deleteEvent={deleteEvent}
        />

        <RegistrationPanel
          isAdmin={isAdmin}
          isParticipant={isParticipant}
          selectedUserLabel={selectedUserLabel}
          currentUser={currentUser}
          users={users}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          selectedEvent={selectedEvent}
          register={register}
        />

        {isParticipant && (
          <ParticipantRegistrationCard
            selectedEvent={selectedEvent}
            visibleRegistrations={visibleRegistrations}
            cancelRegistration={cancelRegistration}
          />
        )}

        {!isParticipant && canViewSelectedEventRegistrations && (
          <RegistrationsList
            visibleRegistrations={visibleRegistrations}
            users={users}
            isAdmin={isAdmin}
            isOrganizer={isOrganizer}
            selectedEvent={selectedEvent}
            currentUser={currentUser}
            cancelRegistration={cancelRegistration}
          />
        )}

        {isOrganizer && selectedEvent && !canViewSelectedEventRegistrations && (
          <OrganizerRegistrationsNotice selectedEvent={selectedEvent} />
        )}

        <ChatPanel
          selectedEvent={selectedEvent}
          chatMessages={chatMessages}
          currentUser={currentUser}
          chatForm={chatForm}
          setChatForm={setChatForm}
          sendChatMessage={sendChatMessage}
        />
      </main>
    </div>
  );
}
