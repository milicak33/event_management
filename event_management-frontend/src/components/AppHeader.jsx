import { Icon } from "./Icons";

export default function AppHeader({ currentUser, view, setView, canManageEvents, refresh, logout }) {
  const roleLabel = { ADMIN: "Administrator", ORGANIZER: "Organizator", PARTICIPANT: "Učesnik" }[currentUser.role];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => setView("HOME")}>
        <span className="brand-mark small"><Icon name="calendar" size={22}/></span>
        <span><b>EventFlow</b><small>Upravljanje događajima</small></span>
      </button>

      <nav className="main-nav">
        <button className={view === "HOME" ? "active" : ""} onClick={() => setView("HOME")}><Icon name="home" size={18}/>Početna</button>
        <button className={view === "ALL" ? "active" : ""} onClick={() => setView("ALL")}><Icon name="calendar" size={18}/>Svi događaji</button>
        <button className={view === "MINE" ? "active" : ""} onClick={() => setView("MINE")}><Icon name="users" size={18}/>Moji događaji</button>
        {canManageEvents && <button className={view === "CREATE" ? "active" : ""} onClick={() => setView("CREATE")}><Icon name="plus" size={18}/>Novi događaj</button>}
      </nav>

      <div className="user-actions">
        <button className="icon-btn" title="Osveži" onClick={refresh}><Icon name="refresh"/></button>
        <div className="user-chip"><span className="avatar">{currentUser.username?.[0]?.toUpperCase()}</span><span><b>{currentUser.username}</b><small>{roleLabel}</small></span></div>
        <button className="icon-btn" title="Odjavi se" onClick={logout}><Icon name="logout"/></button>
      </div>
    </header>
  );
}
