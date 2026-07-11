import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { request } from "../api/client";
import { Icon } from "./Icons";

const HISTORY_KEY = "eventflow-benchmark-history";
const DEFAULT_SCENARIOS = [10, 50, 100, 200, 500];

function number(value, digits = 2) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "0.00";
}

function Metric({ icon, label, value, suffix = "", tone = "blue" }) {
  return (
    <div className={`benchmark-metric benchmark-tone-${tone}`}>
      <span className="benchmark-metric-icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
    </div>
  );
}

function ResultCard({ title, result, tone, winner }) {
  if (!result) return null;

  return (
    <section className={`benchmark-result-card ${tone} reveal-card`}>
      <div className="benchmark-card-title">
        <div>
          <span className="eyebrow">Strategija</span>
          <h2>{title}</h2>
          <p>
            {result.requestedUsers} zahteva · kapacitet {result.eventCapacity}
          </p>
        </div>

        <div className="benchmark-card-badges">
          {winner && <span className="winner-badge">Najbolji rezultat</span>}
          <span
            className={
              result.consistencyValid ? "consistency-ok" : "consistency-bad"
            }
          >
            <Icon name={result.consistencyValid ? "check" : "wait"} size={15} />
            {result.consistencyValid ? "Konzistentno" : "Problem"}
          </span>
        </div>
      </div>

      <div className="benchmark-hero-metrics">
        <div>
          <small>Ukupno vreme</small>
          <strong>
            {result.totalDurationMs}
            <span> ms</span>
          </strong>
        </div>
        <div>
          <small>Propusnost</small>
          <strong>
            {number(result.throughputPerSecond, 1)}
            <span> req/s</span>
          </strong>
        </div>
      </div>

      <div className="benchmark-metrics">
        <Metric icon="check" label="Registrovani" value={result.registered} tone="green" />
        <Metric icon="wait" label="Lista čekanja" value={result.waiting} tone="amber" />
        <Metric icon="close" label="Neuspešni" value={result.failed} tone="red" />
        <Metric icon="refresh" label="Konflikti" value={result.optimisticConflicts} tone="violet" />
        <Metric icon="clock" label="Prosečan odziv" value={number(result.averageResponseMs)} suffix=" ms" />
        <Metric icon="speed" label="Medijana" value={number(result.medianResponseMs)} suffix=" ms" />
        <Metric icon="clock" label="P95 odziv" value={number(result.p95ResponseMs)} suffix=" ms" />
        <Metric icon="speed" label="Min / max" value={`${result.minResponseMs} / ${result.maxResponseMs}`} suffix=" ms" />
      </div>
    </section>
  );
}

function ConsistencyPanel({ result }) {
  if (!result) return null;

  const checks = [
    {
      label: "Kapacitet nije prekoračen",
      optimistic: !result.optimistic.capacityExceeded,
      pessimistic: !result.pessimistic.capacityExceeded,
    },
    {
      label: "Broj slobodnih mesta nije negativan",
      optimistic: result.optimistic.finalAvailableSpots >= 0,
      pessimistic: result.pessimistic.finalAvailableSpots >= 0,
    },
    {
      label: "Registrovani + slobodna mesta = kapacitet",
      optimistic: result.optimistic.consistencyValid,
      pessimistic: result.pessimistic.consistencyValid,
    },
    {
      label: "Svi zahtevi imaju konačan status",
      optimistic:
        result.optimistic.registered +
          result.optimistic.waiting +
          result.optimistic.failed ===
        result.optimistic.requestedUsers,
      pessimistic:
        result.pessimistic.registered +
          result.pessimistic.waiting +
          result.pessimistic.failed ===
        result.pessimistic.requestedUsers,
    },
  ];

  return (
    <section className="panel-modern consistency-panel reveal-card">
      <div className="panel-header">
        <div>
          <h2>Provera konzistentnosti</h2>
          <p>Automatske provere najvažnijih invarijanti sistema.</p>
        </div>
      </div>

      <div className="consistency-grid">
        <div className="consistency-head">Provera</div>
        <div className="consistency-head">Optimističko</div>
        <div className="consistency-head">Pesimističko</div>

        {checks.map((check) => (
          <div className="consistency-row" key={check.label}>
            <span>{check.label}</span>
            <b className={check.optimistic ? "check-ok" : "check-bad"}>
              <Icon name={check.optimistic ? "check" : "close"} size={16} />
              {check.optimistic ? "Prošlo" : "Nije prošlo"}
            </b>
            <b className={check.pessimistic ? "check-ok" : "check-bad"}>
              <Icon name={check.pessimistic ? "check" : "close"} size={16} />
              {check.pessimistic ? "Prošlo" : "Nije prošlo"}
            </b>
          </div>
        ))}
      </div>
    </section>
  );
}

function downloadCsv(rows) {
  if (!rows.length) return;

  const header = [
    "timestamp",
    "scenario",
    "strategy",
    "users",
    "capacity",
    "registered",
    "waiting",
    "failed",
    "conflicts",
    "totalDurationMs",
    "averageResponseMs",
    "medianResponseMs",
    "p95ResponseMs",
    "minResponseMs",
    "maxResponseMs",
    "throughputPerSecond",
    "finalAvailableSpots",
    "capacityExceeded",
    "consistencyValid",
  ];

  const csvRows = [header.join(",")];

  rows.forEach((entry) => {
    [
      ["OPTIMISTIC", entry.optimistic],
      ["PESSIMISTIC", entry.pessimistic],
    ].forEach(([strategy, value]) => {
      csvRows.push(
        [
          entry.timestamp,
          entry.scenario,
          strategy,
          value.requestedUsers,
          value.eventCapacity,
          value.registered,
          value.waiting,
          value.failed,
          value.optimisticConflicts,
          value.totalDurationMs,
          number(value.averageResponseMs),
          number(value.medianResponseMs),
          number(value.p95ResponseMs),
          value.minResponseMs,
          value.maxResponseMs,
          number(value.throughputPerSecond),
          value.finalAvailableSpots,
          value.capacityExceeded,
          value.consistencyValid,
        ].join(",")
      );
    });
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `benchmark-results-${new Date().toISOString().slice(0, 19)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BenchmarkPage({ onBack }) {
  const [form, setForm] = useState({
    users: 100,
    capacity: 10,
    cleanupAfterRun: true,
  });
  const [result, setResult] = useState(null);
  const [suiteResults, setSuiteResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suiteLoading, setSuiteLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(Array.isArray(saved) ? saved.slice(0, 20) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  function remember(entry) {
    setHistory((previous) => {
      const next = [entry, ...previous].slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function compare(users, capacity) {
    return request("/api/benchmark/compare", {
      method: "POST",
      body: JSON.stringify({
        users: Number(users),
        capacity: Number(capacity),
        cleanupAfterRun: form.cleanupAfterRun,
      }),
    });
  }

  async function runComparison(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setSuiteResults([]);
    setProgress(15);
    setProgressLabel("Priprema test podataka...");

    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(92, value + Math.max(1, (92 - value) * 0.08)));
    }, 300);

    try {
      setProgressLabel("Pokretanje konkurentnih prijava...");
      const data = await compare(form.users, form.capacity);
      setProgress(100);
      setProgressLabel("Poređenje je završeno.");
      setResult(data);

      remember({
        id: `${Date.now()}-${form.users}-${form.capacity}`,
        timestamp: new Date().toISOString(),
        scenario: "Pojedinačni test",
        ...data,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      window.clearInterval(timer);
      window.setTimeout(() => setProgress(0), 700);
      setLoading(false);
    }
  }

  async function runFullSuite() {
    setSuiteLoading(true);
    setLoading(false);
    setError("");
    setResult(null);
    setSuiteResults([]);
    setProgress(0);

    const results = [];

    try {
      for (let index = 0; index < DEFAULT_SCENARIOS.length; index += 1) {
        const users = DEFAULT_SCENARIOS[index];
        setProgressLabel(`Scenario ${index + 1}/${DEFAULT_SCENARIOS.length}: ${users} korisnika`);
        setProgress((index / DEFAULT_SCENARIOS.length) * 100);

        const data = await compare(users, form.capacity);
        const entry = {
          id: `${Date.now()}-${users}-${form.capacity}`,
          timestamp: new Date().toISOString(),
          scenario: `${users} korisnika`,
          ...data,
        };

        results.push(entry);
        setSuiteResults([...results]);
        remember(entry);
        setProgress(((index + 1) / DEFAULT_SCENARIOS.length) * 100);
      }

      setProgressLabel("Kompletan benchmark je završen.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSuiteLoading(false);
      window.setTimeout(() => setProgress(0), 900);
    }
  }

  const activeRows = useMemo(() => {
    if (suiteResults.length) return suiteResults;
    if (!result) return [];
    return [
      {
        id: "current",
        timestamp: new Date().toISOString(),
        scenario: "Pojedinačni test",
        ...result,
      },
    ];
  }, [result, suiteResults]);

  const responseChartData = result
    ? [
        {
          metric: "Ukupno vreme",
          optimistic: result.optimistic.totalDurationMs,
          pessimistic: result.pessimistic.totalDurationMs,
        },
        {
          metric: "Prosečan odziv",
          optimistic: Number(number(result.optimistic.averageResponseMs)),
          pessimistic: Number(number(result.pessimistic.averageResponseMs)),
        },
        {
          metric: "P95 odziv",
          optimistic: Number(number(result.optimistic.p95ResponseMs)),
          pessimistic: Number(number(result.pessimistic.p95ResponseMs)),
        },
        {
          metric: "Konflikti",
          optimistic: result.optimistic.optimisticConflicts,
          pessimistic: result.pessimistic.optimisticConflicts,
        },
      ]
    : [];

  const throughputData = result
    ? [
        {
          metric: "Propusnost",
          optimistic: Number(number(result.optimistic.throughputPerSecond)),
          pessimistic: Number(number(result.pessimistic.throughputPerSecond)),
        },
      ]
    : [];

  const distributionData = result
    ? [
        { name: "Registrovani", value: result.optimistic.registered },
        { name: "Lista čekanja", value: result.optimistic.waiting },
        { name: "Neuspešni", value: result.optimistic.failed },
      ]
    : [];

  const suiteChartData = suiteResults.map((entry) => ({
    users: entry.requestedUsers,
    optimistic: Number(number(entry.optimistic.throughputPerSecond)),
    pessimistic: Number(number(entry.pessimistic.throughputPerSecond)),
  }));

  const optimisticWins =
    result &&
    result.optimistic.throughputPerSecond >= result.pessimistic.throughputPerSecond;

  return (
    <div className="benchmark-view">
      <div className="view-heading benchmark-heading">
        <div>
          <button className="text-btn" onClick={onBack}>
            <Icon name="back" />
            Nazad
          </button>
          <span className="eyebrow">Eksperimentalni modul</span>
          <h1>Benchmark zaključavanja</h1>
          <p>
            Poređenje optimističkog i pesimističkog pristupa pri konkurentnim
            prijavama.
          </p>
        </div>

        <div className="benchmark-heading-badge">
          <Icon name="speed" size={30} />
          <span>
            <b>Real-time test</b>
            <small>Do 2.000 virtuelnih korisnika</small>
          </span>
        </div>
      </div>

      <section className="editor-card benchmark-control reveal-card">
        <div className="benchmark-control-copy">
          <h2>Parametri testa</h2>
          <p>
            Pokrenite pojedinačno poređenje ili kompletnu seriju scenarija sa
            identičnim kapacitetom događaja.
          </p>
        </div>

        <form className="modern-form benchmark-form" onSubmit={runComparison}>
          <label>
            Broj istovremenih korisnika
            <input
              type="number"
              min="1"
              max="2000"
              value={form.users}
              onChange={(event) => setForm({ ...form, users: event.target.value })}
            />
          </label>

          <label>
            Kapacitet događaja
            <input
              type="number"
              min="1"
              max="10000"
              value={form.capacity}
              onChange={(event) =>
                setForm({ ...form, capacity: event.target.value })
              }
            />
          </label>

          <label className="benchmark-checkbox">
            <input
              type="checkbox"
              checked={form.cleanupAfterRun}
              onChange={(event) =>
                setForm({ ...form, cleanupAfterRun: event.target.checked })
              }
            />
            <span>Obriši test podatke posle izvršavanja</span>
          </label>

          <div className="benchmark-actions">
            <button
              className="primary-btn benchmark-run"
              disabled={loading || suiteLoading}
            >
              <Icon name={loading ? "refresh" : "speed"} />
              {loading ? "Test je u toku..." : "Pokreni poređenje"}
            </button>

            <button
              type="button"
              className="secondary-btn benchmark-run"
              disabled={loading || suiteLoading}
              onClick={runFullSuite}
            >
              <Icon name={suiteLoading ? "refresh" : "chart"} />
              {suiteLoading ? "Serija je u toku..." : "Pokreni sve scenarije"}
            </button>
          </div>
        </form>

        {error && <div className="toast error">{error}</div>}

        {(loading || suiteLoading || progress > 0) && (
          <div className="benchmark-progress-wrap">
            <div className="benchmark-progress-copy">
              <span>{progressLabel}</span>
              <b>{Math.round(progress)}%</b>
            </div>
            <div className="benchmark-progress">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      {result && (
        <>
          <div className="benchmark-summary-strip reveal-card">
            <div>
              <span>Brži pristup</span>
              <b>{optimisticWins ? "Optimističko" : "Pesimističko"}</b>
            </div>
            <div>
              <span>Veća propusnost</span>
              <b>
                {Math.max(
                  result.optimistic.throughputPerSecond,
                  result.pessimistic.throughputPerSecond
                ).toFixed(1)}{" "}
                req/s
              </b>
            </div>
            <div>
              <span>Najmanje konflikata</span>
              <b>
                {result.optimistic.optimisticConflicts <=
                result.pessimistic.optimisticConflicts
                  ? "Optimističko"
                  : "Pesimističko"}
              </b>
            </div>
            <button className="secondary-btn" onClick={() => downloadCsv(activeRows)}>
              <Icon name="chart" />
              Preuzmi CSV
            </button>
          </div>

          <div className="benchmark-results">
            <ResultCard
              title="Optimističko zaključavanje"
              result={result.optimistic}
              tone="optimistic"
              winner={optimisticWins}
            />
            <ResultCard
              title="Pesimističko zaključavanje"
              result={result.pessimistic}
              tone="pessimistic"
              winner={!optimisticWins}
            />
          </div>

          <section className="benchmark-chart-grid">
            <article className="panel-modern chart-panel reveal-card">
              <div className="panel-header">
                <div>
                  <h2>Odziv i konflikti</h2>
                  <p>Niža vrednost je bolja.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={responseChartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="optimistic" name="Optimističko" fill="#356fc0" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pessimistic" name="Pesimističko" fill="#12a594" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </article>

            <article className="panel-modern chart-panel reveal-card">
              <div className="panel-header">
                <div>
                  <h2>Propusnost</h2>
                  <p>Broj obrađenih zahteva u sekundi.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={throughputData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="optimistic" name="Optimističko" fill="#356fc0" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="pessimistic" name="Pesimističko" fill="#12a594" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </article>

            <article className="panel-modern chart-panel reveal-card">
              <div className="panel-header">
                <div>
                  <h2>Raspodela zahteva</h2>
                  <p>Rezultat optimističkog scenarija.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={4}>
                    {distributionData.map((entry, index) => (
                      <Cell key={entry.name} fill={["#12a594", "#e8a51f", "#d64545"][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </article>
          </section>

          <ConsistencyPanel result={result} />
        </>
      )}

      {suiteResults.length > 0 && (
        <>
          <section className="panel-modern reveal-card suite-panel">
            <div className="panel-header">
              <div>
                <h2>Rezultati svih scenarija</h2>
                <p>Poređenje propusnosti za 10, 50, 100, 200 i 500 korisnika.</p>
              </div>
              <button className="secondary-btn" onClick={() => downloadCsv(suiteResults)}>
                <Icon name="chart" />
                Preuzmi CSV
              </button>
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={suiteChartData} margin={{ top: 25, right: 25, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="users" label={{ value: "Broj korisnika", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "req/s", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="optimistic" name="Optimističko" stroke="#356fc0" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pessimistic" name="Pesimističko" stroke="#12a594" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="panel-modern reveal-card suite-table-panel">
            <div className="panel-header">
              <div>
                <h2>Tabela scenarija</h2>
                <p>Sažetak metrika spreman za analizu u master radu.</p>
              </div>
            </div>

            <div className="benchmark-table-wrap">
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th>Korisnici</th>
                    <th>Strategija</th>
                    <th>Ukupno vreme</th>
                    <th>Avg</th>
                    <th>P95</th>
                    <th>Throughput</th>
                    <th>Konflikti</th>
                    <th>Konzistentno</th>
                  </tr>
                </thead>
                <tbody>
                  {suiteResults.flatMap((entry) =>
                    [
                      ["Optimističko", entry.optimistic],
                      ["Pesimističko", entry.pessimistic],
                    ].map(([strategy, value]) => (
                      <tr key={`${entry.id}-${strategy}`}>
                        <td>{entry.requestedUsers}</td>
                        <td>{strategy}</td>
                        <td>{value.totalDurationMs} ms</td>
                        <td>{number(value.averageResponseMs)} ms</td>
                        <td>{number(value.p95ResponseMs)} ms</td>
                        <td>{number(value.throughputPerSecond, 1)} req/s</td>
                        <td>{value.optimisticConflicts}</td>
                        <td>
                          <span className={value.consistencyValid ? "check-ok" : "check-bad"}>
                            {value.consistencyValid ? "DA" : "NE"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="panel-modern benchmark-history reveal-card">
        <div className="panel-header">
          <div>
            <h2>Istorija benchmark testova</h2>
            <p>Poslednjih 20 izvršavanja čuva se lokalno u browseru.</p>
          </div>
          <div className="benchmark-history-actions">
            <button className="secondary-btn" disabled={!history.length} onClick={() => downloadCsv(history)}>
              <Icon name="chart" />
              Izvezi istoriju
            </button>
            <button
              className="danger-btn"
              disabled={!history.length}
              onClick={() => {
                localStorage.removeItem(HISTORY_KEY);
                setHistory([]);
              }}
            >
              <Icon name="trash" />
              Obriši istoriju
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-inline">Još nema sačuvanih benchmark testova.</div>
        ) : (
          <div className="history-list">
            {history.map((entry) => (
              <article className="history-row" key={entry.id}>
                <div>
                  <b>{entry.scenario}</b>
                  <small>{new Date(entry.timestamp).toLocaleString("sr-RS")}</small>
                </div>
                <span>{entry.requestedUsers} korisnika</span>
                <span>Kapacitet {entry.eventCapacity}</span>
                <span>{number(entry.optimistic.throughputPerSecond, 1)} / {number(entry.pessimistic.throughputPerSecond, 1)} req/s</span>
              </article>
            ))}
          </div>
        )}
      </section>

      {!result && !suiteResults.length && !loading && !suiteLoading && (
        <section className="benchmark-empty reveal-card">
          <Icon name="chart" size={46} />
          <h3>Rezultati će se pojaviti ovde</h3>
          <p>
            Pokrenite pojedinačni test ili kompletan benchmark da biste dobili
            kartice, grafikone, tabelu i proveru konzistentnosti.
          </p>
        </section>
      )}
    </div>
  );
}
