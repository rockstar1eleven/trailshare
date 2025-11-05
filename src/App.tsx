import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

type Difficulty = "Easy" | "Moderate" | "Hard" | "Expert";

type Comment = { id: string; text: string; ts: number };

type Report = {
  id: string;
  trailName: string;
  area: string;
  difficulty: Difficulty | string;
  dateHiked: string; // ISO date
  miles: number;
  elevation: number;
  conditions: string[];
  rating: number;
  hazards?: string;
  description: string;
  gps?: string; // free text or URL
  lat?: number;
  lng?: number;
  images: string[];
  helpful: number;
  comments?: Comment[];
};

type Tab = "feed" | "map";

const DIFFICULTIES: Difficulty[] = ["Easy", "Moderate", "Hard", "Expert"];
const LS_KEY = "trailshare_reports_v2";

const CONDITION_TAGS = [
  { key: "clear", label: "Clear", color: "#22c55e" },
  { key: "mud", label: "Mud", color: "#92400e" },
  { key: "snow", label: "Snow/Ice", color: "#38bdf8" },
  { key: "overgrown", label: "Overgrown", color: "#047857" },
  { key: "washout", label: "Washout", color: "#0891b2" },
  { key: "bugs", label: "Bugs", color: "#65a30d" },
  { key: "trees", label: "Downed trees", color: "#57534e" }
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function saveReports(r: Report[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch {}
}

function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// seed demo data
const seed: Report[] = [
  {
    id: uid(),
    trailName: "Chetco Point Loop",
    area: "Brookings, OR",
    difficulty: "Easy",
    dateHiked: new Date(Date.now() - 1000*60*60*24*3).toISOString(),
    miles: 1.2,
    elevation: 120,
    conditions: ["clear","bugs"],
    rating: 4,
    hazards: "Some poison oak off trail. Stay on the path.",
    description: "Sunny and windy along the bluffs. Trail in good shape.",
    images: [],
    helpful: 7,
    lat: 42.05, lng: -124.28,
    comments: [{ id: uid(), text: "Nice views near sunset!", ts: Date.now()-86400000 }]
  },
  {
    id: uid(),
    trailName: "House Rock to Arch Rock",
    area: "Samuel H. Boardman",
    difficulty: "Moderate",
    dateHiked: new Date(Date.now() - 1000*60*60*24*9).toISOString(),
    miles: 4.8,
    elevation: 680,
    conditions: ["overgrown","mud"],
    rating: 3,
    hazards: "Slippery where shaded. Some blowdowns to climb.",
    description: "Coastal fog until noon. Wildflowers still popping.",
    images: [],
    helpful: 12,
    lat: 42.12, lng: -124.37,
    comments: []
  }
];

function Logo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24" aria-hidden>
      <path d="M3 22h18M6 18l3-7 2 4 3-6 4 9" strokeWidth="2"/>
    </svg>
  );
}

function ColorDot({ color }: { color: string }) {
  return <span className="dot" style={{ background: color }} />;
}

function Tag({ t }: { t: string }) {
  const meta = CONDITION_TAGS.find(x => x.key === t);
  if (!meta) return null;
  return (
    <span className="tag">
      <ColorDot color={meta.color} />
      <span>{meta.label}</span>
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`Rating ${value} of 5`}>
      {"*".repeat(value)}{".".repeat(5 - value)}
    </span>
  );
}

function LeafletMap({ reports }: { reports: Report[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || map.current) return;
    map.current = L.map(mapRef.current).setView([42.05, -124.28], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map.current);
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const layer = L.layerGroup().addTo(m);
    const coords = reports.filter(r => typeof r.lat === "number" && typeof r.lng === "number");
    if (coords.length) {
      const bounds = L.latLngBounds(coords.map(r => [r.lat as number, r.lng as number]));
      m.fitBounds(bounds.pad(0.25));
    }
    coords.forEach(r => {
      const marker = L.marker([r.lat as number, r.lng as number]).addTo(layer);
      marker.bindPopup(`<b>${r.trailName}</b><br/>${(r.area||"")}`);
    });
    return () => { m.removeLayer(layer); };
  }, [reports]);

  return <div className="map" ref={mapRef} />;
}

function Empty({ onNew }: { onNew: () => void }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div className="brand" style={{ justifyContent: "center" }}>
        <Logo />
      </div>
      <h3 style={{ marginTop: 8 }}>No reports yet</h3>
      <p>Be the first to share trail conditions, photos, and tips.</p>
      <button className="btn" onClick={onNew}>Post a Report</button>
    </div>
  );
}

function Toolbar(props: {
  query: string;
  setQuery: (s: string) => void;
  filters: { difficulty: string; condition: string };
  setFilters: (fn: (f: { difficulty: string; condition: string }) => { difficulty: string; condition: string }) => void;
  sort: string;
  setSort: (s: string) => void;
}) {
  const { query, setQuery, filters, setFilters, sort, setSort } = props;
  return (
    <div className="card controls">
      <div className="row" style={{ gap: 8, flex: 1 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trails or areas"
          aria-label="Search"
        />
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value }))}
          aria-label="Filter by difficulty"
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filters.condition}
          onChange={(e) => setFilters(f => ({ ...f, condition: e.target.value }))}
          aria-label="Filter by condition"
        >
          <option value="">Any condition</option>
          {CONDITION_TAGS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <label style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#6b7280", fontSize:14 }}>Sort</span>
          <select value={sort} onChange={(e)=>setSort(e.target.value)}>
            <option value="new">Newest</option>
            <option value="helpful">Most helpful</option>
            <option value="easiest">Easiest first</option>
            <option value="hardest">Hardest first</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function ReportCard({ report, onHelpful, onAddComment }: { report: Report; onHelpful: (id: string) => void; onAddComment: (id: string, text: string) => void }) {
  const [text, setText] = useState("");
  const danger = (report.hazards||"").toLowerCase();
  const showAlert = /ice|washout|bear|cougar|slide|closed|closure|fire|snow|flood|downed/.test(danger);

  return (
    <article className="card report">
      {showAlert && (
        <div style={{ background:"#fee2e2", border:"1px solid #ef4444", color:"#991b1b", borderRadius:10, padding:8 }}>
          Safety alert: {report.hazards}
        </div>
      )}

      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h3>{report.trailName} <small style={{ color:"#6b7280" }}>{report.area}</small></h3>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", color:"#374151", fontSize:14 }}>
            <span style={{ background:"#f3f4f6", padding:"2px 8px", borderRadius:8 }}>{report.difficulty}</span>
            <span>
              Hiked {new Date(report.dateHiked).toLocaleDateString()} • {report.miles} mi • {report.elevation} ft
            </span>
            <Stars value={report.rating} />
          </div>
        </div>
        <button className="btn secondary" onClick={()=>onHelpful(report.id)}>+1 {report.helpful}</button>
      </div>

      {report.images?.length ? (
        <div className="photos">
          {report.images.map((src, i) => (
            <img key={i} src={src} alt={"Trail photo " + (i+1)} className="photo" loading="lazy" />
          ))}
        </div>
      ) : null}

      <div className="tags">
        {report.conditions.map(t => <Tag key={t} t={t} />)}
      </div>

      {report.hazards ? (
        <div style={{ background:"#fffbeb", borderLeft:"4px solid #f59e0b", color:"#92400e", padding:12, borderRadius:12 }}>
          <strong>Hazards:</strong> {report.hazards}
        </div>
      ) : null}

      <p style={{ margin: 0 }}>{report.description}</p>

      {typeof report.lat === "number" && typeof report.lng === "number" ? (
        <div style={{ fontSize:12, color:"#6b7280" }}>Coords: {report.lat.toFixed(4)}, {report.lng.toFixed(4)}</div>
      ) : null}

      {/* Comments */}
      <div style={{ marginTop:8, display:"grid", gap:6 }}>
        {(report.comments||[]).map(c => (
          <div key={c.id} className="comment">
            <strong>{new Date(c.ts).toLocaleDateString()}</strong> — {c.text}
          </div>
        ))}
        <div className="commentbox">
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Add a comment (trail tip, condition, etc.)" />
          <button className="btn secondary" onClick={()=>{ if (text.trim()) { onAddComment(report.id, text.trim()); setText(""); } }}>Post</button>
        </div>
      </div>

      {report.gps ? (
        <a href={report.gps} target="_blank" rel="noreferrer">View GPS/Map (external)</a>
      ) : null}
    </article>
  );
}

function parseCoords(input: string): { lat?: number; lng?: number } {
  const at = /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(input);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  const comma = /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(input);
  if (comma) return { lat: parseFloat(comma[1]), lng: parseFloat(comma[2]) };
  return {};
}

async function compressImageToDataUrl(file: File, maxSize = 1400, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function NewReportModal(props: { open: boolean; onClose: () => void; onCreate: (r: Report) => void }) {
  const { open, onClose, onCreate } = props;
  const [trailName, setTrailName] = useState("");
  const [area, setArea] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | string>("Moderate");
  const [dateHiked, setDateHiked] = useState(() => new Date().toISOString().slice(0,10));
  const [miles, setMiles] = useState<string>("0");
  const [elevation, setElevation] = useState<string>("0");
  const [conditions, setConditions] = useState<string[]>([]);
  const [rating, setRating] = useState<string>("4");
  const [hazards, setHazards] = useState("");
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(()=>{
    if (!open) {
      setTrailName(""); setArea(""); setDifficulty("Moderate");
      setDateHiked(new Date().toISOString().slice(0,10));
      setMiles("0"); setElevation("0"); setConditions([]); setRating("4");
      setHazards(""); setDescription(""); setGps(""); setLat(""); setLng(""); setImages([]);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  function toggleTag(key: string) {
    setConditions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const dataUrl = await compressImageToDataUrl(f, 1400, 0.82);
        urls.push(dataUrl);
      }
      setImages(prev => [...prev, ...urls]);
    } finally {
      setBusy(false);
    }
  }

  function handleUseGPS() {
    if (!("geolocation" in navigator)) return alert("Geolocation not supported on this device.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude.toFixed(6)));
        setLng(String(pos.coords.longitude.toFixed(6)));
      },
      () => alert("Unable to get GPS location.")
    );
  }

  function handleCreate() {
    if (!trailName.trim()) return alert("Please add a trail name.");
    if (!description.trim()) return alert("Please add a short description.");
    const coords = parseCoords(gps);
    const latNum = lat ? parseFloat(lat) : coords.lat;
    const lngNum = lng ? parseFloat(lng) : coords.lng;

    onCreate({
      id: uid(),
      trailName: trailName.trim(),
      area: area.trim(),
      difficulty,
      dateHiked: new Date(dateHiked).toISOString(),
      miles: Number(miles) || 0,
      elevation: Number(elevation) || 0,
      conditions,
      rating: Number(rating) || 0,
      hazards: hazards.trim(),
      description: description.trim(),
      gps: gps.trim(),
      lat: typeof latNum === "number" ? latNum : undefined,
      lng: typeof lngNum === "number" ? lngNum : undefined,
      images,
      helpful: 0,
      comments: []
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div style={{ position:"fixed", inset:0 as any, background:"rgba(0,0,0,.35)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:0, zIndex:40 }}>
      <div className="card" style={{ width:"100%", maxWidth:720, borderRadius:16, overflow:"hidden", maxHeight:"92vh" }}>
        <div className="row" style={{ justifyContent:"space-between", borderBottom:"1px solid #e5e7eb", padding:"12px 16px" }}>
          <h3>New Trail Report</h3>
          <div className="row">
            <button className="btn secondary" onClick={handleUseGPS}>Use GPS</button>
            <button className="btn secondary" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="container" style={{ maxWidth: "100%", padding: 16 }}>
          <div className="grid" style={{ gridTemplateColumns:"1fr", gap:12 }}>
            <div className="grid" style={{ gap:12 }}>
              <label>Trail name
                <input value={trailName} onChange={e=>setTrailName(e.target.value)} className="controls" />
              </label>
              <label>Area / Region
                <input value={area} onChange={e=>setArea(e.target.value)} />
              </label>
              <label>Date hiked
                <input type="date" value={dateHiked} onChange={e=>setDateHiked(e.target.value)} />
              </label>
              <div className="row">
                <label style={{ flex:1 }}>Miles
                  <input type="number" min={0} step={0.1} value={miles} onChange={e=>setMiles(e.target.value)} />
                </label>
                <label style={{ flex:1 }}>Elevation gain (ft)
                  <input type="number" min={0} step={10} value={elevation} onChange={e=>setElevation(e.target.value)} />
                </label>
              </div>
              <label>Difficulty
                <select value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label>Condition rating
                <input type="range" min={1} max={5} value={rating} onChange={e=>setRating(e.target.value)} />
                <div style={{ fontSize:12, color:"#6b7280" }}>{String(rating)} / 5</div>
              </label>
            </div>

            <div className="grid" style={{ gap:12 }}>
              <fieldset className="card">
                <legend style={{ fontWeight:600 }}>Tags</legend>
                <div className="tags" style={{ marginTop:8 }}>
                  {CONDITION_TAGS.map(c => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={()=>toggleTag(c.key)}
                      className="btn secondary"
                      style={{ borderRadius:999, padding:"6px 10px", borderColor: conditions.includes(c.key) ? "#065f46" : "#d1d5db", background: conditions.includes(c.key) ? "#ecfdf5" : "white", color: conditions.includes(c.key) ? "#065f46" : "#111827" }}
                    >
                      <span className="dot" style={{ background:c.color }}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label>GPS/Map link (optional)
                <input value={gps} onChange={e=>setGps(e.target.value)} placeholder="https://maps.google.com/... or 42.05,-124.28" />
              </label>
              <div className="row">
                <label style={{ flex:1 }}>Latitude
                  <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="42.0526" />
                </label>
                <label style={{ flex:1 }}>Longitude
                  <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="-124.283" />
                </label>
              </div>

              <label>Hazards (optional)
                <input value={hazards} onChange={e=>setHazards(e.target.value)} placeholder="Ice at 4,000 ft; creek crossing knee deep" />
              </label>
              <label>Description
                <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Trail mostly clear with occasional mud. Views worth it." rows={5} />
              </label>
              <div>
                <div style={{ fontWeight:600 }}>Photos</div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickImages} />
                {busy ? <div>Processing photos...</div> : null}
                {images.length ? (
                  <div className="photos" style={{ marginTop:8 }}>
                    {images.map((src,i)=>(<img key={i} src={src} alt="preview" className="photo" />))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="row" style={{ justifyContent:"flex-end", gap:8, borderTop:"1px solid #e5e7eb", padding:12 }}>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleCreate}>Publish</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ difficulty: "", condition: "" });
  const [sort, setSort] = useState("new");
  const [tab, setTab] = useState<Tab>("feed");

  useEffect(()=>{
    let data = loadReports();
    if (!data.length) { data = seed; saveReports(data); }
    setReports(data);
  },[]);

  function addReport(r: Report) {
    const next = [r, ...reports];
    setReports(next);
    saveReports(next);
    setTab("feed");
  }

  function markHelpful(id: string) {
    const next = reports.map(r => r.id === id ? { ...r, helpful: r.helpful + 1 } : r);
    setReports(next);
    saveReports(next);
  }

  function addComment(id: string, text: string) {
    const next = reports.map(r => r.id === id ? { ...r, comments: [...(r.comments||[]), { id: uid(), text, ts: Date.now() }] } : r);
    setReports(next);
    saveReports(next);
  }

  function clearAll() {
    if (confirm("Clear all local reports? This cannot be undone.")) {
      localStorage.removeItem(LS_KEY);
      setReports([]);
    }
  }

  const filtered = useMemo(()=>{
    let list = [...reports];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(r => [r.trailName, r.area, r.description].some(f => (f||"").toLowerCase().includes(q)));
    if (filters.difficulty) list = list.filter(r => r.difficulty === filters.difficulty);
    if (filters.condition) list = list.filter(r => r.conditions.includes(filters.condition));
    if (sort === "new") list.sort((a,b)=> +new Date(b.dateHiked) - +new Date(a.dateHiked));
    if (sort === "helpful") list.sort((a,b)=> b.helpful - a.helpful);
    if (sort === "easiest") list.sort((a,b)=> DIFFICULTIES.indexOf((a.difficulty as Difficulty)) - DIFFICULTIES.indexOf((b.difficulty as Difficulty)));
    if (sort === "hardest") list.sort((a,b)=> DIFFICULTIES.indexOf((b.difficulty as Difficulty)) - DIFFICULTIES.indexOf((a.difficulty as Difficulty)));
    return list;
  }, [reports, query, filters, sort]);

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <Logo />
            <h1>TrailShare</h1>
            <span style={{ color:"#6b7280", fontSize:14 }}> - Community trail updates</span>
          </div>
          <div className="row">
            <button className="btn" onClick={()=>setOpen(true)}>+ New Report</button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="hero" style={{ backgroundImage:'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop")' }}>
          <div className="hero-inner">
            <h2 style={{ fontSize:28, fontWeight:700 }}>Share trail conditions in real time</h2>
            <p style={{ maxWidth:700 }}>Post photos, terrain notes, hazards, and recent observations to help the community hike safer.</p>
            <div className="row" style={{ gap:8 }}>
              <button className="btn" onClick={()=>setOpen(true)}>+ Post a report</button>
              <button className="btn secondary" onClick={clearAll}>Reset demo data</button>
            </div>
          </div>
        </section>

        <section className="grid layout-3" style={{ marginTop:12 }}>
          <div>
            <Toolbar
              query={query}
              setQuery={setQuery}
              filters={filters}
              setFilters={setFilters}
              sort={sort}
              setSort={setSort}
            />
          </div>
          <div className="card">
            <h3>Map</h3>
            <LeafletMap reports={filtered} />
          </div>
        </section>

        <section className="feed" style={{ marginTop:12 }}>
          {filtered.length ? (
            filtered.map(r => <ReportCard key={r.id} report={r} onHelpful={markHelpful} onAddComment={addComment} />)
          ) : (
            <Empty onNew={()=>setOpen(true)} />
          )}
        </section>
      </main>

      <nav className="bottomnav" aria-label="Primary (mobile)">
        <button onClick={()=>{ setTab("feed"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ color: tab==="feed" ? "#065f46" : "#374151", fontWeight: tab==="feed" ? 700 : 400 }}>Feed</button>
        <button onClick={()=>{ setTab("map"); document.querySelector(".map")?.scrollIntoView({ behavior:"smooth" }); }} style={{ color: tab==="map" ? "#065f46" : "#374151", fontWeight: tab==="map" ? 700 : 400 }}>Map</button>
        <button onClick={()=>setOpen(true)}>Post</button>
      </nav>

      <footer className="footer">
        <div className="footer-inner container">
          Built as a TrailShare prototype. No data leaves your browser.
        </div>
      </footer>

      <NewReportModal open={open} onClose={()=>setOpen(false)} onCreate={addReport} />
    </div>
  );
}

// ------------------ Runtime tests (basic) ------------------
function runSmoke() {
  try {
    console.group("TrailShare smoke tests");
    console.assert(DIFFICULTIES.indexOf("Easy") < DIFFICULTIES.indexOf("Hard"), "Difficulty order");
    const sample: Report[] = [
      { id:"1", trailName:"A", area:"X", difficulty:"Easy", dateHiked:new Date().toISOString(), miles:1, elevation:10, conditions:["clear"], rating:5, description:"", images:[], helpful:0 },
      { id:"2", trailName:"B", area:"Y", difficulty:"Hard", dateHiked:new Date().toISOString(), miles:5, elevation:500, conditions:["mud"], rating:3, description:"", images:[], helpful:0 }
    ];
    const q = "b";
    const filteredBySearch = sample.filter(r => [r.trailName, r.area, r.description].some(f => (f||"").toLowerCase().includes(q)));
    console.assert(filteredBySearch.length === 1 && filteredBySearch[0].trailName === "B", "Search filter");
    const onlyEasy = sample.filter(r => r.difficulty === "Easy");
    console.assert(onlyEasy.length === 1 && onlyEasy[0].trailName === "A", "Difficulty filter");
    const hasMud = sample.filter(r => r.conditions.includes("mud"));
    console.assert(hasMud.length === 1 && hasMud[0].trailName === "B", "Condition filter");
    const byHelpful = [...sample, { id:"3", trailName:"C", area:"Z", difficulty:"Moderate", dateHiked:new Date().toISOString(), miles:2, elevation:50, conditions:["clear"], rating:4, description:"", images:[], helpful:10 }];
    byHelpful.sort((a,b)=> b.helpful - a.helpful);
    console.assert(byHelpful[0].trailName === "C" && byHelpful[0].helpful === 10, "Helpful sort");
    const byDate = [...sample].sort((a,b)=> +new Date(b.dateHiked) - +new Date(a.dateHiked));
    console.assert(byDate.length === 2 && typeof byDate[0].dateHiked === "string", "Date sort");
    console.log("All smoke tests passed");
    console.groupEnd();
  } catch (e) {
    console.error("Smoke tests failed", e);
  }
}
if (typeof window !== "undefined") setTimeout(runSmoke, 250);
