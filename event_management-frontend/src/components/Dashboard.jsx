import { Icon } from "./Icons";

function MetricCard({ icon, tone, label, value, helper }) {
  return <article className="metric-card reveal-card"><span className={`metric-icon ${tone}`}><Icon name={icon}/></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

export default function Dashboard({ currentUser, users, events, myEvents, registrations, isAdmin, setView, canManageEvents }) {
  const activeRegs = registrations.filter(r => r.status === "REGISTERED").length;
  const waiting = registrations.filter(r => r.status === "WAITING").length;
  const organizerCount = users.filter(u => u.role === "ORGANIZER").length;
  const fullEvents = events.filter(e => e.availableSpots === 0).length;
  const upcoming = [...events].filter(e => !e.startTime || new Date(e.startTime) >= new Date()).sort((a,b)=>new Date(a.startTime||0)-new Date(b.startTime||0)).slice(0,4);

  return (
    <div className="view-stack dashboard-view">
      <section className="welcome-panel reveal-card">
        <div><span className="eyebrow">{isAdmin ? "Administratorska kontrolna tabla" : "Kontrolna tabla"}</span><h1>Zdravo, {currentUser.username}!</h1><p>{isAdmin ? "Pratite korisnike, događaje, prijave i performanse sistema sa jednog mesta." : "Pregledajte događaje, prijave i najvažnije aktivnosti na jednom mestu."}</p></div>
        <div className="welcome-actions">{isAdmin && <button className="secondary-glass-btn" onClick={()=>setView("BENCHMARK")}><Icon name="chart"/>Pokreni benchmark</button>}{canManageEvents && <button className="primary-btn" onClick={() => setView("CREATE")}><Icon name="plus"/>Kreiraj događaj</button>}</div>
      </section>

      <section className="metric-grid">
        <MetricCard icon="calendar" tone="blue" label="Svi događaji" value={events.length} helper={`${fullEvents} popunjeno`}/>
        <MetricCard icon="users" tone="green" label={isAdmin ? "Korisnici" : "Moji događaji"} value={isAdmin ? users.length : myEvents.length} helper={isAdmin ? `${organizerCount} organizatora` : "Povezano sa nalogom"}/>
        <MetricCard icon="check" tone="violet" label="Potvrđene prijave" value={activeRegs} helper="Za otvoreni događaj"/>
        <MetricCard icon="wait" tone="amber" label="Lista čekanja" value={waiting} helper="Za otvoreni događaj"/>
      </section>

      <section className="dashboard-grid">
        <button className="navigation-card all reveal-card" onClick={() => setView("ALL")}><div className="nav-card-icon"><Icon name="calendar" size={30}/></div><div><h3>Svi događaji</h3><p>Pronađite događaje i pregledajte detalje.</p></div><Icon name="arrow"/></button>
        <button className="navigation-card mine reveal-card" onClick={() => setView("MINE")}><div className="nav-card-icon"><Icon name="users" size={30}/></div><div><h3>Moji događaji</h3><p>Pratite događaje koje organizujete ili posećujete.</p></div><Icon name="arrow"/></button>
        {canManageEvents && <button className="navigation-card create reveal-card" onClick={() => setView("CREATE")}><div className="nav-card-icon"><Icon name="plus" size={30}/></div><div><h3>Novi događaj</h3><p>Kreirajte događaj i podesite kapacitet.</p></div><Icon name="arrow"/></button>}
      </section>

      <section className="dashboard-lower-grid">
        <article className="panel-modern activity-panel reveal-card">
          <div className="panel-header"><div><h2>Naredni događaji</h2><p>Brzi pregled najbližih događaja.</p></div><button className="text-btn" onClick={()=>setView("ALL")}>Prikaži sve <Icon name="arrow" size={16}/></button></div>
          <div className="upcoming-list">{upcoming.length===0?<div className="empty-inline">Nema predstojećih događaja.</div>:upcoming.map(e=><div className="upcoming-row" key={e.id}><span className="upcoming-date">{e.startTime?new Date(e.startTime).toLocaleDateString("sr-RS",{day:"2-digit",month:"short"}):"—"}</span><div><b>{e.title}</b><small>{e.location}</small></div><span className={e.availableSpots>0?"capacity-pill open":"capacity-pill full"}>{e.availableSpots}/{e.capacity}</span></div>)}</div>
        </article>
        <article className="panel-modern system-health reveal-card">
          <div className="panel-header"><div><h2>Stanje sistema</h2><p>Sažetak ključnih funkcija.</p></div><span className="health-dot">Aktivno</span></div>
          <div className="health-list"><div><Icon name="shield"/><span><b>JWT zaštita</b><small>Autentifikacija je uključena</small></span></div><div><Icon name="chat"/><span><b>WebSocket chat</b><small>Real-time kanal je aktivan</small></span></div><div><Icon name="speed"/><span><b>Konkurentne prijave</b><small>Optimistic i pessimistic režim</small></span></div></div>
        </article>
      </section>
    </div>
  );
}
