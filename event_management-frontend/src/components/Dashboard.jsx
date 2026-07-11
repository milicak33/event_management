import { Icon } from "./Icons";

export default function Dashboard({ currentUser, events, myEvents, registrations, setView, canManageEvents }) {
  const activeRegs = registrations.filter(r => r.status === "REGISTERED").length;
  const waiting = registrations.filter(r => r.status === "WAITING").length;
  return (
    <div className="view-stack">
      <section className="welcome-panel">
        <div><span className="eyebrow">Kontrolna tabla</span><h1>Zdravo, {currentUser.username}!</h1><p>Pregledajte događaje, prijave i najvažnije aktivnosti na jednom mestu.</p></div>
        {canManageEvents && <button className="primary-btn" onClick={() => setView("CREATE")}><Icon name="plus"/>Kreiraj događaj</button>}
      </section>

      <section className="metric-grid">
        <article className="metric-card"><span className="metric-icon blue"><Icon name="calendar"/></span><div><small>Svi događaji</small><strong>{events.length}</strong><p>Dostupno u sistemu</p></div></article>
        <article className="metric-card"><span className="metric-icon green"><Icon name="users"/></span><div><small>Moji događaji</small><strong>{myEvents.length}</strong><p>Povezano sa nalogom</p></div></article>
        <article className="metric-card"><span className="metric-icon violet"><Icon name="check"/></span><div><small>Potvrđene prijave</small><strong>{activeRegs}</strong><p>Za izabrani događaj</p></div></article>
        <article className="metric-card"><span className="metric-icon amber"><Icon name="wait"/></span><div><small>Lista čekanja</small><strong>{waiting}</strong><p>Za izabrani događaj</p></div></article>
      </section>

      <section className="dashboard-grid">
        <button className="navigation-card all" onClick={() => setView("ALL")}><div className="nav-card-icon"><Icon name="calendar" size={30}/></div><div><h3>Svi događaji</h3><p>Pronađite događaje i pregledajte detalje.</p></div><Icon name="arrow"/></button>
        <button className="navigation-card mine" onClick={() => setView("MINE")}><div className="nav-card-icon"><Icon name="users" size={30}/></div><div><h3>Moji događaji</h3><p>Pratite događaje koje organizujete ili posećujete.</p></div><Icon name="arrow"/></button>
        {canManageEvents && <button className="navigation-card create" onClick={() => setView("CREATE")}><div className="nav-card-icon"><Icon name="plus" size={30}/></div><div><h3>Novi događaj</h3><p>Kreirajte novi događaj i podesite kapacitet.</p></div><Icon name="arrow"/></button>}
      </section>
    </div>
  );
}
