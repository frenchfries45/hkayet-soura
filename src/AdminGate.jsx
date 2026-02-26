import { useState } from "react";
import AdminApp from "./Admin.jsx";

// ── Change this password to whatever you want ──
const ADMIN_PASSWORD = "hkayet2024";

export default function AdminGate() {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem("hs_admin") === "true"
  );
  const [error, setError] = useState(false);

  const attempt = () => {
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem("hs_admin", "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (unlocked) return <AdminApp />;

  return (
    <div style={{
      minHeight: "100vh", background: "#1A1612", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif"
    }}>
      <div style={{
        width: "100%", maxWidth: 380, padding: "40px 32px", borderRadius: 20,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,149,42,0.2)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20
      }}>
        <div style={{ fontSize: 32 }}>🔐</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "#C9952A" }}>
            Admin Portal
          </div>
          <div style={{ fontSize: 12, color: "#7A6E62", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
            Hkayet Soura
          </div>
        </div>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Enter admin password"
          style={{
            width: "100%", padding: "13px 18px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: error ? "1px solid #C4622D" : "1px solid rgba(201,149,42,0.3)",
            color: "#F5EFE4", fontSize: 15, fontFamily: "inherit",
            outline: "none", textAlign: "center",
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: "#C4622D", marginTop: -10 }}>
            Incorrect password. Try again.
          </div>
        )}
        <button
          onClick={attempt}
          style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: "#C9952A", color: "#1A1612", fontWeight: 700,
            fontSize: 15, cursor: "pointer", fontFamily: "inherit"
          }}>
          Enter
        </button>
      </div>
    </div>
  );
}
