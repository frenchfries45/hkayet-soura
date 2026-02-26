import { useState, useRef, useCallback } from "react";

// ─── PALETTE (matches main game) ───────────────────────────────
const C = {
  bg:       "#1A1612",
  surface:  "rgba(255,255,255,0.04)",
  border:   "rgba(201,149,42,0.18)",
  gold:     "#C9952A",
  goldFade: "rgba(201,149,42,0.12)",
  muted:    "#7A6E62",
  cream:    "#F5EFE4",
  red:      "#C4622D",
};

const S = {
  btn: (variant = "primary") => ({
    padding: "10px 22px", borderRadius: 6, fontSize: 13, cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, transition: "all 0.18s",
    ...(variant === "primary"  ? { background: C.gold,        color: "#1A1612", border: "none" } : {}),
    ...(variant === "outline"  ? { background: "transparent", color: C.gold,    border: `1px solid ${C.gold}` } : {}),
    ...(variant === "ghost"    ? { background: "transparent", color: C.muted,   border: `1px solid rgba(122,110,98,0.25)` } : {}),
    ...(variant === "danger"   ? { background: "transparent", color: C.red,     border: `1px solid ${C.red}` } : {}),
  }),
  tag: (color = C.gold) => ({
    display: "inline-block", fontSize: 10, letterSpacing: 3,
    textTransform: "uppercase", color, padding: "4px 12px",
    border: `1px solid ${color}33`, borderRadius: 20, marginBottom: 6,
  }),
};

// ─── MOCK INITIAL CARDS ────────────────────────────────────────
const MOCK = [
  { id: 1, name: "Cedar Morning",   pack: "Nature",   url: null, uploaded: "2026-02-10" },
  { id: 2, name: "Sea at Dusk",     pack: "Nature",   url: null, uploaded: "2026-02-10" },
  { id: 3, name: "Old Souk",        pack: "City",     url: null, uploaded: "2026-02-12" },
  { id: 4, name: "Mountain Path",   pack: "Nature",   url: null, uploaded: "2026-02-12" },
  { id: 5, name: "Rooftop at Night",pack: "City",     url: null, uploaded: "2026-02-14" },
  { id: 6, name: "The Harbour",     pack: "City",     url: null, uploaded: "2026-02-14" },
];

const PACKS = ["Nature", "City", "Folklore", "Memory", "Uncategorised"];

// ─── DRAG & DROP ZONE ──────────────────────────────────────────
function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handle = (files) => {
    const valid = Array.from(files).filter(f =>
      ["image/jpeg","image/webp","image/png"].includes(f.type)
    );
    if (valid.length) onFiles(valid);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current.click()}
      style={{
        border: `2px dashed ${dragging ? C.gold : "rgba(201,149,42,0.3)"}`,
        borderRadius: 14, padding: "48px 24px",
        textAlign: "center", cursor: "pointer",
        background: dragging ? C.goldFade : "rgba(0,0,0,0.2)",
        transition: "all 0.2s",
      }}
    >
      <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.webp,.png"
        style={{ display: "none" }} onChange={e => handle(e.target.files)} />
      <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.6 }}>🖼️</div>
      <div style={{ fontSize: 15, color: C.cream, fontWeight: 600, marginBottom: 6 }}>
        Drop card images here
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
        or click to browse · JPG, WebP, PNG<br />
        Ideal: <strong style={{ color: C.gold }}>800 × 1120 px · WebP · under 300 KB</strong>
      </div>
    </div>
  );
}

// ─── UPLOAD QUEUE ITEM ─────────────────────────────────────────
function QueueItem({ file, meta, onChange, onRemove }) {
  const preview = URL.createObjectURL(file);
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <img src={preview} alt="" style={{ width: 52, height: 73, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={meta.name}
          onChange={e => onChange({ ...meta, name: e.target.value })}
          placeholder="Card name..."
          style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 12px", color: C.cream, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" }}
        />
        <select
          value={meta.pack}
          onChange={e => onChange({ ...meta, pack: e.target.value })}
          style={{ background: "#1A1612", border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 12px", color: meta.pack ? C.cream : C.muted, fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer" }}
        >
          <option value="">Select pack...</option>
          {PACKS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ fontSize: 10, color: C.muted }}>
          {file.name} · {(file.size / 1024).toFixed(0)} KB
          {file.size > 300000 && <span style={{ color: C.red, marginLeft: 8 }}>⚠ Over 300 KB</span>}
          {!["image/jpeg","image/webp"].includes(file.type) && <span style={{ color: "#C9952A", marginLeft: 8 }}>💡 Convert to WebP for best results</span>}
        </div>
      </div>
      <button onClick={onRemove} style={{ ...S.btn("ghost"), padding: "6px 10px", fontSize: 16, color: C.muted, border: "none", flexShrink: 0 }}>✕</button>
    </div>
  );
}

// ─── CARD GRID ITEM ────────────────────────────────────────────
function CardItem({ card, onDelete, onEdit }) {
  const [hovering, setHovering] = useState(false);
  const colors = [
    "linear-gradient(145deg,#3D2B1F,#7A4A30)",
    "linear-gradient(145deg,#1E2D1E,#3A5E2A)",
    "linear-gradient(145deg,#0D1F2D,#1A4060)",
    "linear-gradient(145deg,#2A2040,#5A3080)",
    "linear-gradient(145deg,#2D1A10,#8B4513)",
    "linear-gradient(145deg,#2D1A2D,#6B2060)",
  ];
  const bg = colors[card.id % colors.length];
  return (
    <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
      style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${hovering ? C.gold : C.border}`, transition: "all 0.2s", cursor: "default", background: C.surface }}>
      {/* Card preview */}
      <div style={{ width: "100%", paddingBottom: "140%", position: "relative", background: bg }}>
        {card.url
          ? <img src={card.url} alt={card.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 32, opacity: 0.35 }}>🖼️</span>
              <span style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>NO IMAGE</span>
            </div>
        }
        {hovering && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            <button onClick={() => onEdit(card)} style={{ ...S.btn("outline"), fontSize: 11, padding: "6px 14px" }}>Edit</button>
            <button onClick={() => onDelete(card.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "6px 14px" }}>Delete</button>
          </div>
        )}
      </div>
      {/* Meta */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.cream, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
        <div style={{ fontSize: 10, color: C.muted }}>{card.pack} · {card.uploaded}</div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ────────────────────────────────────────────────
function EditModal({ card, onSave, onClose }) {
  const [name, setName] = useState(card.name);
  const [pack, setPack] = useState(card.pack);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#221E18", border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: C.gold, marginBottom: 20 }}>Edit Card</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Card Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`, color: C.cream, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Pack</label>
          <select value={pack} onChange={e => setPack(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "#1A1612", border: `1px solid ${C.border}`, color: C.cream, fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
            {PACKS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={S.btn("ghost")} onClick={onClose}>Cancel</button>
          <button style={S.btn("primary")} onClick={() => onSave({ ...card, name, pack })}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN APP ────────────────────────────────────────────
export default function App() {
  const [view, setView]         = useState("library"); // "library" | "upload"
  const [cards, setCards]       = useState(MOCK);
  const [queue, setQueue]       = useState([]);         // files staged for upload
  const [queueMeta, setQueueMeta] = useState([]);
  const [filterPack, setFilterPack] = useState("All");
  const [search, setSearch]     = useState("");
  const [editCard, setEditCard] = useState(null);
  const [toast, setToast]       = useState(null);
  const nextId = useRef(MOCK.length + 1);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addFiles = (files) => {
    const newMeta = files.map(f => ({
      name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      pack: "Uncategorised",
    }));
    setQueue(q => [...q, ...files]);
    setQueueMeta(m => [...m, ...newMeta]);
    setView("upload");
  };

  const removeFromQueue = (i) => {
    setQueue(q => q.filter((_, j) => j !== i));
    setQueueMeta(m => m.filter((_, j) => j !== i));
  };

  const uploadAll = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCards = queue.map((f, i) => ({
      id: nextId.current++,
      name: queueMeta[i].name || f.name,
      pack: queueMeta[i].pack || "Uncategorised",
      url: URL.createObjectURL(f),
      uploaded: today,
    }));
    setCards(c => [...c, ...newCards]);
    setQueue([]);
    setQueueMeta([]);
    setView("library");
    showToast(`${newCards.length} card${newCards.length > 1 ? "s" : ""} uploaded successfully`);
  };

  const deleteCard = (id) => {
    setCards(c => c.filter(card => card.id !== id));
    showToast("Card deleted", "danger");
  };

  const saveEdit = (updated) => {
    setCards(c => c.map(card => card.id === updated.id ? updated : card));
    setEditCard(null);
    showToast("Card updated");
  };

  const filtered = cards.filter(c => {
    const matchPack = filterPack === "All" || c.pack === filterPack;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchPack && matchSearch;
  });

  const packCounts = PACKS.reduce((acc, p) => {
    acc[p] = cards.filter(c => c.pack === p).length;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.bg, color: C.cream, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: "rgba(26,22,18,0.97)", position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: C.gold }}>Hikaye · حكاية</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 4, textTransform: "uppercase" }}>Admin — Card Manager</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: C.muted, marginRight: 8 }}>{cards.length} cards total</div>
          {["library","upload"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ ...S.btn(view === v ? "primary" : "ghost"), fontSize: 12, padding: "8px 18px" }}>
              {v === "library" ? "📚 Library" : `⬆ Upload${queue.length > 0 ? ` (${queue.length})` : ""}`}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", padding: "32px 24px", boxSizing: "border-box" }}>

        {/* ══════════════════════════
            UPLOAD VIEW
        ══════════════════════════ */}
        {view === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 680, margin: "0 auto" }}>
            <div>
              <div style={S.tag()}>Upload Cards</div>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, margin: "4px 0 6px" }}>Add New Cards</h2>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Recommended: <strong style={{ color: C.gold }}>800 × 1120 px · WebP format · under 300 KB per card</strong><br/>
                JPG and PNG are also accepted. Name each card and assign it to a pack before uploading.
              </p>
            </div>

            <DropZone onFiles={addFiles} />

            {queue.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, color: C.muted }}>{queue.length} file{queue.length > 1 ? "s" : ""} ready to upload</div>
                  <button style={{ ...S.btn("ghost"), fontSize: 11, padding: "5px 12px" }} onClick={() => { setQueue([]); setQueueMeta([]); }}>Clear all</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {queue.map((file, i) => (
                    <QueueItem key={i} file={file} meta={queueMeta[i]}
                      onChange={m => setQueueMeta(prev => prev.map((x, j) => j === i ? m : x))}
                      onRemove={() => removeFromQueue(i)} />
                  ))}
                </div>
                <button style={{ ...S.btn("primary"), padding: "14px", fontSize: 15, borderRadius: 10 }} onClick={uploadAll}>
                  Upload {queue.length} Card{queue.length > 1 ? "s" : ""} to Library
                </button>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════
            LIBRARY VIEW
        ══════════════════════════ */}
        {view === "library" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Total Cards", value: cards.length, target: 120 },
                { label: "Packs", value: PACKS.filter(p => packCounts[p] > 0).length, target: PACKS.length },
                { label: "Remaining", value: Math.max(0, 120 - cards.length), target: null },
              ].map(s => (
                <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 22px", flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "Georgia,serif", color: s.value === 0 && s.label === "Remaining" ? C.gold : C.cream }}>
                    {s.value}
                    {s.target && <span style={{ fontSize: 13, color: C.muted, marginLeft: 6 }}>/ {s.target}</span>}
                  </div>
                  {s.target && (
                    <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (s.value / s.target) * 100)}%`, background: C.gold, borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..." style={{ flex: 1, minWidth: 180, padding: "9px 14px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`, color: C.cream, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["All", ...PACKS].map(p => (
                  <button key={p} onClick={() => setFilterPack(p)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${filterPack === p ? C.gold : C.border}`, background: filterPack === p ? C.goldFade : "transparent", color: filterPack === p ? C.gold : C.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                    {p} {p !== "All" && packCounts[p] > 0 ? `(${packCounts[p]})` : ""}
                  </button>
                ))}
              </div>
              <button style={{ ...S.btn("primary"), padding: "9px 18px", fontSize: 12, marginLeft: "auto" }} onClick={() => setView("upload")}>
                + Add Cards
              </button>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🖼️</div>
                <div style={{ fontSize: 14 }}>No cards found</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14 }}>
                {filtered.map(card => (
                  <CardItem key={card.id} card={card} onDelete={deleteCard} onEdit={setEditCard} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editCard && <EditModal card={editCard} onSave={saveEdit} onClose={() => setEditCard(null)} />}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: toast.type === "danger" ? "#3D1A10" : "#1A2D1A", border: `1px solid ${toast.type === "danger" ? C.red : "#3A5E2A"}`, color: toast.type === "danger" ? "#E88060" : "#7AC87A", padding: "12px 24px", borderRadius: 30, fontSize: 13, fontWeight: 500, zIndex: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          {toast.type === "danger" ? "🗑 " : "✓ "}{toast.msg}
        </div>
      )}
    </div>
  );
}
