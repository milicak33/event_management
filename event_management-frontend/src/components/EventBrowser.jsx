import { useMemo, useState } from "react";
import { Icon } from "./Icons";

function formatDate(value) { if (!value) return "Datum nije unet"; return new Date(value).toLocaleString("sr-RS", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }); }

export default function EventBrowser({ title, subtitle, events, onOpen, onBack }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => events.filter(e => `${e.title} ${e.location} ${e.description || ""}`.toLowerCase().includes(query.toLowerCase())), [events, query]);
  return (
    <div className="view-stack">
      <div className="view-heading"><div><button className="text-btn" onClick={onBack}><Icon name="back"/>Početna</button><h1>{title}</h1><p>{subtitle}</p></div><label className="search-box">⌕<input placeholder="Pretraži događaje..." value={query} onChange={e => setQuery(e.target.value)}/></label></div>
      {filtered.length === 0 ? <div className="empty-modern"><Icon name="calendar" size={42}/><h3>Nema događaja</h3><p>Nema rezultata koji odgovaraju pretrazi.</p></div> : <div className="event-card-grid">{filtered.map(event => <article className="event-card-modern" key={event.id}><div className="event-card-top"><span className="event-date-badge">{event.startTime ? new Date(event.startTime).toLocaleDateString("sr-RS", {day:"2-digit", month:"short"}) : "DOG"}</span><span className={event.availableSpots > 0 ? "capacity-pill open" : "capacity-pill full"}>{event.availableSpots > 0 ? `${event.availableSpots} slobodno` : "Popunjeno"}</span></div><div className="event-card-body"><h3>{event.title}</h3><p className="event-description">{event.description || "Opis događaja nije unet."}</p><div className="event-meta"><span><Icon name="map" size={17}/>{event.location}</span><span><Icon name="clock" size={17}/>{formatDate(event.startTime)}</span><span><Icon name="users" size={17}/>{event.organizerUsername || "Organizator"}</span></div></div><button className="card-open-btn" onClick={() => onOpen(event.id)}>Pogledaj detalje <Icon name="arrow" size={18}/></button></article>)}</div>}
    </div>
  );
}
