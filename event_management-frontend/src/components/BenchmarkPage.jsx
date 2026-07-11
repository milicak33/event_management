import { useState } from "react";
import { request } from "../api/client";

function Metric({ label, value, suffix = "" }) {
  return <div className="benchmark-metric"><span>{label}</span><strong>{value}{suffix}</strong></div>;
}

function ResultCard({ title, result }) {
  if (!result) return null;
  return (
    <section className="benchmark-result-card">
      <div className="panel-header"><div><h2>{title}</h2><p>{result.requestedUsers} zahteva · kapacitet {result.eventCapacity}</p></div><span className={result.consistencyValid ? "consistency-ok" : "consistency-bad"}>{result.consistencyValid ? "Konzistentno" : "Problem"}</span></div>
      <div className="benchmark-metrics">
        <Metric label="Registrovani" value={result.registered}/>
        <Metric label="Lista čekanja" value={result.waiting}/>
        <Metric label="Neuspešni" value={result.failed}/>
        <Metric label="Konflikti" value={result.optimisticConflicts}/>
        <Metric label="Ukupno vreme" value={result.totalDurationMs} suffix=" ms"/>
        <Metric label="Prosečan odziv" value={result.averageResponseMs.toFixed(2)} suffix=" ms"/>
        <Metric label="P95 odziv" value={result.p95ResponseMs.toFixed(2)} suffix=" ms"/>
        <Metric label="Propusnost" value={result.throughputPerSecond.toFixed(2)} suffix=" req/s"/>
      </div>
    </section>
  );
}

export default function BenchmarkPage({ onBack }) {
  const [form, setForm] = useState({ users: 100, capacity: 10, cleanupAfterRun: true });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runComparison(e) {
    e.preventDefault(); setLoading(true); setError(""); setResult(null);
    try {
      const data = await request("/api/benchmark/compare", { method: "POST", body: JSON.stringify({ ...form, users: Number(form.users), capacity: Number(form.capacity) }) });
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <div className="benchmark-view">
    <div className="view-heading"><div><button className="text-btn" onClick={onBack}>← Nazad</button><h1>Benchmark zaključavanja</h1><p>Poređenje optimističkog i pesimističkog pristupa pri konkurentnim prijavama.</p></div></div>
    <section className="editor-card">
      <form className="modern-form benchmark-form" onSubmit={runComparison}>
        <label>Broj istovremenih korisnika<input type="number" min="1" max="2000" value={form.users} onChange={e=>setForm({...form,users:e.target.value})}/></label>
        <label>Kapacitet događaja<input type="number" min="1" max="10000" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/></label>
        <label className="benchmark-checkbox"><input type="checkbox" checked={form.cleanupAfterRun} onChange={e=>setForm({...form,cleanupAfterRun:e.target.checked})}/>Obriši test podatke posle izvršavanja</label>
        <button className="primary-btn" disabled={loading}>{loading ? "Benchmark je u toku..." : "Pokreni poređenje"}</button>
      </form>
      {error && <div className="toast error">{error}</div>}
    </section>
    {result && <div className="benchmark-results"><ResultCard title="Optimističko zaključavanje" result={result.optimistic}/><ResultCard title="Pesimističko zaključavanje" result={result.pessimistic}/></div>}
  </div>;
}
