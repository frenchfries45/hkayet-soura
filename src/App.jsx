import { useState, useEffect } from "react";

const SCREENS = { LANDING: "landing", LOBBY: "lobby", WAITING: "waiting", GAME: "game" };

// ── Theme tokens ──────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:        "#1A1612",
    surface:   "rgba(255,255,255,0.04)",
    surfaceHi: "rgba(201,149,42,0.08)",
    border:    "rgba(201,149,42,0.15)",
    borderHi:  "#C9952A",
    text:      "#F5EFE4",
    textMuted: "#7A6E62",
    gold:      "#C9952A",
    overlay:   "rgba(0,0,0,0.88)",
    overlayDk: "rgba(0,0,0,0.92)",
    fullBg:    "#0A0806",
    inputBg:   "rgba(255,255,255,0.06)",
    phaseBg:   "rgba(0,0,0,0.2)",
    headerBg:  "rgba(0,0,0,0.45)",
    radial:    "radial-gradient(ellipse 60% 50% at 50% 40%,rgba(201,149,42,0.07) 0%,transparent 70%)",
  },
  light: {
    bg:        "#F5EDE0",
    surface:   "rgba(0,0,0,0.06)",
    surfaceHi: "rgba(150,100,10,0.10)",
    border:    "rgba(150,100,20,0.25)",
    borderHi:  "#9A6E10",
    text:      "#1C1108",
    textMuted: "#6B5A40",
    gold:      "#9A6E10",
    overlay:   "rgba(235,220,198,0.95)",
    overlayDk: "rgba(225,208,182,0.97)",
    fullBg:    "#EDE0CC",
    inputBg:   "rgba(0,0,0,0.07)",
    phaseBg:   "rgba(255,255,255,0.5)",
    headerBg:  "rgba(235,220,198,0.92)",
    radial:    "radial-gradient(ellipse 60% 50% at 50% 40%,rgba(150,100,10,0.10) 0%,transparent 70%)",
  },
};

function makeS(t) {
  return {
    root: { fontFamily: "'DM Sans','Segoe UI',sans-serif", background: t.bg, color: t.text, minHeight: "100vh", display: "flex", flexDirection: "column" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: `1px solid ${t.border}`, background: t.headerBg, position: "sticky", top: 0, zIndex: 50 },
    logoA: { fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: t.gold, letterSpacing: 2 },
    logoE: { fontSize: 11, color: t.textMuted, letterSpacing: 4, textTransform: "uppercase" },
    btnP: { padding: "10px 24px", borderRadius: 6, border: "none", background: t.gold, color: t.bg, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
    btnO: { padding: "10px 24px", borderRadius: 6, border: `1px solid ${t.gold}80`, background: "transparent", color: t.gold, fontWeight: 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
    btnG: { padding: "10px 24px", borderRadius: 6, border: `1px solid ${t.text}25`, background: "transparent", color: t.text, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
    t,
  };
}

// Default S — will be overridden per-component via props
const S = makeS(THEMES.dark);

// ─────────────────────────────────────
// LANDING
// ─────────────────────────────────────
function Landing({ go, S, themeName, setThemeName }) {
  const [showFaq, setShowFaq] = useState(false);

  const FAQ = [
    {
      section: "How to Play",
      items: [
        { q: "What is Hkayet Soura?", a: "A storytelling card game for 3–8 players. Each round, one player is the Storyteller — they pick a card from their hand and give a clue: a word, a feeling, a sound, anything. Everyone else picks the card from their own hand that best matches that clue. All cards are shuffled face-down, then everyone votes for which card they think was the Storyteller's." },
        { q: "How do you score points?", a: "The Storyteller scores 3 points if some — but not all — players find their card. Too obvious or too cryptic and nobody scores. Every non-storyteller whose card gets voted on earns 1 point per vote. Voters who correctly identify the Storyteller's card earn 3 points." },
        { q: "How do you win?", a: "First player to reach 30 points wins (42 points in an 8-player game)." },
        { q: "How long does a game take?", a: "Roughly 30–45 minutes for a full game." },
      ]
    },
    {
      section: "Setup",
      items: [
        { q: "How many players do you need?", a: "Between 3 and 8 players." },
        { q: "How do I create a room?", a: `Tap 'Play Now', enter your name, then share the room code with friends. The game fits whoever joins, up to 8 players.` },
        { q: "How do I join a room?", a: `Tap 'Play Now' then 'Join Room' and enter the code your friend shared with you.` },
        { q: "What happens if someone leaves mid-game?", a: "The game continues as long as at least 3 players remain. If it drops below 3, the session ends and final scores are shown." },
      ]
    },
    {
      section: "During the Game",
      items: [
        { q: "Can I see my cards before it's my turn as Storyteller?", a: "Yes — your hand is always visible in the Hand tab. You can browse and fullscreen any card at any time." },
        { q: "What makes a good clue?", a: "The best clues are slightly mysterious — not too obvious, not too abstract. A single word, a movie title, a sound, an emotion, a memory. The goal is for some people to guess right, not all of them." },
        { q: "Can I change my vote?", a: "No — once submitted, votes are final." },
        { q: "What if two players tie?", a: "Both are declared winners." },
      ]
    },
    {
      section: "Technical",
      items: [
        { q: "Does the game work on mobile?", a: "Yes — it is designed mobile-first." },
        { q: "Do I need an account?", a: "No. Just a name and a room code." },
        { q: "What if my connection drops?", a: "Your status will show as disconnected to other players. Rejoin using the same room code and your score will be preserved." },
      ]
    },
  ];

  // Fan: all cards pivot from the same bottom-center point
  const fan = [
    { e: "🏔️", bg: "linear-gradient(135deg,#3D2B1F,#7A4A30)", r: -24, z: 1 },
    { e: "🌊", bg: "linear-gradient(135deg,#1A2D1A,#2D5016)", r: -12, z: 2 },
    { e: "🌙", bg: "linear-gradient(135deg,#2A1F0F,#7A5520)", r:   0, z: 3 },
    { e: "🌿", bg: "linear-gradient(135deg,#1A1A2D,#2D2D6B)", r:  12, z: 2 },
    { e: "🕌", bg: "linear-gradient(135deg,#2D1A1A,#6B2020)", r:  24, z: 1 },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: S.t.radial, pointerEvents: "none" }} />
      <div style={{ textAlign: "center", maxWidth: 600, position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-block", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--gold)", border: "1px solid color-mix(in srgb, var(--gold) 30%, transparent)", padding: "6px 16px", borderRadius: 20, marginBottom: 28 }}>
          Inspired by Dixit
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(48px,9vw,88px)", fontWeight: 700, lineHeight: 1, background: "linear-gradient(135deg,#C9952A,#E8C57A,#C4622D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
          Hkayet Soura
        </div>
        <p style={{ fontSize: 15, color: "color-mix(in srgb, var(--text) 60%, transparent)", lineHeight: 1.8, marginBottom: 40, maxWidth: 420, margin: "0 auto 40px" }}>
          A storytelling card game of imagination, intuition, and shared memory.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginBottom: 32 }}>
          <button style={{ ...S.btnO, padding: "14px 20px", fontSize: 14 }} onClick={() => go(SCREENS.GAME)}>Preview Game</button>
          <button style={{ ...S.btnP, padding: "16px 48px", fontSize: 17, borderRadius: 8 }} onClick={() => go(SCREENS.LOBBY)}>Play Now</button>
          <button style={{ ...S.btnO, padding: "14px 20px", fontSize: 14 }} onClick={() => setShowFaq(true)}>FAQ</button>
        </div>

        {/* Theme picker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: S.t.textMuted }}>Appearance</div>
          <div style={{ display: "flex", gap: 0, background: S.t.surface, border: `1px solid ${S.t.border}`, borderRadius: 30, padding: 4 }}>
            {["dark", "light"].map(mode => (
              <button key={mode} onClick={() => setThemeName(mode)} style={{
                padding: "8px 24px", borderRadius: 26, border: "none", cursor: "pointer",
                background: themeName === mode ? S.t.gold : "transparent",
                color: themeName === mode ? S.t.bg : S.t.textMuted,
                fontWeight: themeName === mode ? 700 : 400, fontSize: 13,
                fontFamily: "inherit", letterSpacing: 0.5, transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {mode === "dark" ? "🌙 Dark" : "☀️ Bright"}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* FAQ Overlay */}
      {showFaq && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlayDk)", backdropFilter: "blur(16px)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, position: "sticky", top: 0, background: "var(--overlayDk)", padding: "8px 0", zIndex: 1 }}>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>How to Play</div>
                <div style={{ fontSize: 11, color: "var(--textMuted)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Hkayet Soura</div>
              </div>
              <button onClick={() => setShowFaq(false)} style={{ ...S.btnO, padding: "8px 20px", fontSize: 13, borderRadius: 20 }}>Close ✕</button>
            </div>

            {/* FAQ sections */}
            {FAQ.map(section => (
              <div key={section.section} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid color-mix(in srgb, var(--gold) 15%, transparent)" }}>
                  {section.section}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.items.map((item, i) => (
                    <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{item.q}</div>
                      <div style={{ fontSize: 13, color: "var(--textMuted)", lineHeight: 1.6 }}>{item.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom CTA */}
            <button style={{ ...S.btnP, padding: "14px", fontSize: 15, borderRadius: 10, marginTop: 8, marginBottom: 24 }} onClick={() => { setShowFaq(false); go(SCREENS.LOBBY); }}>
              Got it — Let's Play
            </button>
          </div>
        </div>
      )}

      {/* Fan: cards share a single pivot at bottom-center */}
      <div style={{ position: "relative", width: 110, height: 160, marginTop: 60 }}>
        {fan.map((c, i) => (
          <div key={i} style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 100,
            height: 148,
            borderRadius: 12,
            background: c.bg,
            border: "1px solid color-mix(in srgb, var(--gold) 20%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            zIndex: c.z,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            transformOrigin: "50% 100%",
            transform: `rotate(${c.r}deg)`,
          }}>
            {c.e}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// LOBBY
// ─────────────────────────────────────
function Lobby({ go, S, exitedPlayers = [], setExitedPlayers, activePlayers, setActivePlayers }) {
  const [tab, setTab] = useState("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const inp = { width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid color-mix(in srgb, var(--gold) 20%, transparent)", color: S.t.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--textMuted)", marginBottom: 8 };
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 28 }}>Start a Game</div>
        <div style={{ background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--gold) 15%, transparent)", borderRadius: 16, padding: 32 }}>
          <div style={{ display: "flex", background: "var(--surface)", borderRadius: 8, padding: 4, marginBottom: 28 }}>
            {["create", "join"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: tab === t ? "var(--gold)" : "transparent", color: tab === t ? "var(--bg)" : "var(--textMuted)", fontWeight: tab === t ? 700 : 500, fontSize: 13, fontFamily: "inherit" }}>
                {t === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>
          {tab === "create" ? (
            <>
              <div style={{ marginBottom: 24 }}><label style={lbl}>Your Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} /></div>
              <div style={{ fontSize: 11, color: "var(--textMuted)", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>
                Share the room code with friends — the game starts when everyone has joined. Maximum 8 players.
              </div>
              <button style={{ ...S.btnP, width: "100%", padding: 14, fontSize: 15 }} onClick={() => go(SCREENS.WAITING)}>Create Room</button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}><label style={lbl}>Your Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} /></div>
              <div style={{ marginBottom: 24 }}><label style={lbl}>Room Code</label><input style={{ ...inp, textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700, textTransform: "uppercase" }} value={code} onChange={e => setCode(e.target.value)} placeholder="ABCD" maxLength={6} /></div>
              <div style={{ fontSize: 11, color: "var(--textMuted)", textAlign: "center", marginBottom: 16, lineHeight: 1.6 }}>
                Left a game by mistake? Use your same name and room code to rejoin.
              </div>
              <button style={{ ...S.btnP, width: "100%", padding: 14, fontSize: 15 }} onClick={() => {
                const isRejoin = exitedPlayers.includes(name.trim());
                if (isRejoin) {
                  setActivePlayers(prev => prev.includes(name.trim()) ? prev : [...prev, name.trim()]);
                  setExitedPlayers(prev => prev.filter(p => p !== name.trim()));
                  go(SCREENS.GAME);
                } else {
                  go(SCREENS.WAITING);
                }
              }}>Join Room</button>
            </>
          )}
          <div style={{ textAlign: "center", color: "var(--textMuted)", fontSize: 12, margin: "20px 0" }}>or</div>
          <button style={{ ...S.btnG, width: "100%", padding: 12 }}>Share Link</button>
        </div>
        <button style={{ ...S.btnG, marginTop: 16, fontSize: 13, border: "none", color: "var(--textMuted)" }} onClick={() => go(SCREENS.LANDING)}>← Back</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// WAITING ROOM
// ─────────────────────────────────────
function Waiting({ go, S }) {
  const players = [
    { name: "Layla", you: true },
    { name: "Karim" },
    { name: "Nadia" },
    { name: "Sara" },
    null, null, null, null,
  ];
  return (
    <div style={{ flex: 1, padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--textMuted)", marginBottom: 10 }}>Room Code</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 48, color: "var(--gold)", letterSpacing: 10, fontWeight: 700 }}>BYBLOS</div>
          <div style={{ fontSize: 12, color: "var(--textMuted)", marginTop: 8 }}>Share this code with your friends</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 32 }}>
          {players.map((p, i) => (
            <div key={i} style={{ background: p ? (p.you ? "var(--surfaceHi)" : "var(--surface)") : "transparent", border: p ? (p.you ? "1px solid #C9952A" : "1px solid color-mix(in srgb, var(--gold) 25%, transparent)") : "1px dashed color-mix(in srgb, var(--textMuted) 20%, transparent)", borderRadius: 12, padding: "16px 10px", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: p ? 16 : 20, background: p ? "color-mix(in srgb, var(--gold) 15%, transparent)" : "color-mix(in srgb, var(--textMuted) 8%, transparent)", color: p ? "var(--text)" : "var(--textMuted)", fontWeight: 700 }}>
                {p ? p.name[0] : "+"}
              </div>
              <div style={{ fontSize: 12, fontWeight: p ? 500 : 400, color: p ? "var(--text)" : "var(--textMuted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p ? p.name : "Waiting..."}</div>
              {p?.you && <div style={{ fontSize: 9, color: "var(--gold)", letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>You</div>}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--textMuted)", marginBottom: 20 }}>4 of 8 players joined</div>
          <button style={{ ...S.btnP, padding: "14px 40px", fontSize: 15 }} onClick={() => go(SCREENS.GAME)}>Start Game</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button style={{ ...S.btnG, border: "none", color: "var(--textMuted)", fontSize: 13 }} onClick={() => go(SCREENS.LOBBY)}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// GAME
// ─────────────────────────────────────
function Game({ go, S }) {
  // ── Core state ──────────────────────────────────
  const [phase, setPhase] = useState(0); // 0=clue 1=submit 2=vote 3=reveal
  const [gameTab, setGameTab] = useState("hand");
  const [clueText, setClueText] = useState("");
  const [confirmedClue, setConfirmedClue] = useState("");
  const [selHand, setSelHand] = useState(0);
  const [focusedHand, setFocusedHand] = useState(null);
  const [focusedBoard, setFocusedBoard] = useState(0);
  const [boardOverlay, setBoardOverlay] = useState(null);
  const [votedFor, setVotedFor] = useState(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [fullscreen, setFullscreen] = useState(null); // { type: "board"|"hand", idx: number }
  const [winner, setWinner] = useState(null); // null | { names, scores }
  const [roundDeltas, setRoundDeltas] = useState(null); // points earned this round
  const [round, setRound] = useState(1);
  const [storytellerIdx, setStorytellerIdx] = useState(0);
  const [gameDisbanded, setGameDisbanded] = useState(false);

  // ── Players & config ────────────────────────────
  const FULL_PLAYER_LIST = ["Layla", "Karim", "Nadia", "Sara", "Rami", "Lara", "Hassan", "Dima"];
  const [activePlayers, setActivePlayers] = useState(FULL_PLAYER_LIST);
  const PLAYER_LIST = activePlayers;
  const ME = "Layla";
  const STORYTELLER = PLAYER_LIST[storytellerIdx % Math.max(PLAYER_LIST.length, 1)];
  const isStoryteller = ME === STORYTELLER;
  // Which full cycle (game round) we're on, and which turn within it
  const gameRound = Math.floor(storytellerIdx / Math.max(PLAYER_LIST.length, 1)) + 1;
  const turnInCycle = (storytellerIdx % Math.max(PLAYER_LIST.length, 1)) + 1;
  const nextStoryteller = PLAYER_LIST[(storytellerIdx + 1) % Math.max(PLAYER_LIST.length, 1)];
  const WIN_TARGET = PLAYER_LIST.length <= 6 ? 30 : 42;

  // ── Handle a player leaving ──────────────────────
  const handlePlayerExit = (playerName) => {
    const remaining = activePlayers.filter(p => p !== playerName);
    setExitedPlayers(prev => [...prev, playerName]); // mark as rejoinable
    if (remaining.length < 3) {
      setGameDisbanded(true);
    } else {
      setActivePlayers(remaining);
      if (playerName === STORYTELLER) {
        setStorytellerIdx(i => (i % remaining.length));
      }
    }
    setScores(prev => prev.filter(s => s.name !== playerName));
  };

  // ── Scores (live state) ─────────────────────────
  const [scores, setScores] = useState([
    { name: "Layla",   score: 5 },
    { name: "Karim",   score: 3 },
    { name: "Nadia",   score: 7 },
    { name: "Sara",    score: 4 },
    { name: "Rami",    score: 2 },
    { name: "Lara",    score: 6 },
    { name: "Hassan",  score: 1 },
    { name: "Dima",    score: 5 },
  ]);

  // ── Full card deck (mock — in production fetched from Supabase) ──
  const FULL_DECK = [
    { emoji: "\u{1F54C}", bg: "linear-gradient(145deg,#2A1A0A,#7A4010)" },
    { emoji: "\u{1F33F}", bg: "linear-gradient(145deg,#1E2D1E,#3A5E2A)" },
    { emoji: "\u{1F30A}", bg: "linear-gradient(145deg,#0D1F2D,#1A4060)" },
    { emoji: "\u{1F3DB}\uFE0F", bg: "linear-gradient(145deg,#2A2A1A,#6A6A20)" },
    { emoji: "\u{1F319}", bg: "linear-gradient(145deg,#1A1A2D,#3A3A6B)" },
    { emoji: "\u2B50",  bg: "linear-gradient(145deg,#2D1A2D,#6B2060)" },
    { emoji: "\u{1F3D4}\uFE0F", bg: "linear-gradient(145deg,#3D2B1F,#7A4A30)" },
    { emoji: "\u{1F33E}", bg: "linear-gradient(145deg,#1A2010,#4A6020)" },
    { emoji: "\u{1F98B}", bg: "linear-gradient(145deg,#2D1A2D,#6B3080)" },
    { emoji: "\u{1F338}", bg: "linear-gradient(145deg,#2D1020,#6B2040)" },
    { emoji: "\u{1F3DC}\uFE0F", bg: "linear-gradient(145deg,#2D2010,#7A5020)" },
    { emoji: "\u{1F30B}", bg: "linear-gradient(145deg,#2D1010,#6B2020)" },
    { emoji: "\u{1F41A}", bg: "linear-gradient(145deg,#102D2D,#206B6B)" },
    { emoji: "\u{1F300}", bg: "linear-gradient(145deg,#101A2D,#203A6B)" },
    { emoji: "\u{1F56F}\uFE0F", bg: "linear-gradient(145deg,#2D2010,#6B5020)" },
    { emoji: "\u{1F5DD}\uFE0F", bg: "linear-gradient(145deg,#1A1A10,#4A4A20)" },
  ];

  // Fisher-Yates shuffle — returns a new shuffled array
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Shuffle deck once on mount, slice out each player's hand
  const [shuffledDeck] = useState(() => shuffle(FULL_DECK));
  const HAND_SIZE = 6;
  const handCards = shuffledDeck.slice(0, HAND_SIZE);

  // Board: one card per active player, board order shuffled to hide storyteller position
  const [boardCards] = useState(() => {
    const owners = ["Karim", "Layla", "Nadia", "Sara", "Rami", "Lara", "Hassan", "Dima"];
    const pool = shuffle(FULL_DECK);
    const cards = owners.map((owner, i) => ({
      ...pool[i % pool.length],
      owner,
      isStoryteller: owner === "Layla",
      votes: [],
    }));
    return shuffle(cards);
  });


  const phaseLabels = ["Clue", "Submit", "Vote", "Reveal"];

  const goToPhase = (p) => {
    setPhase(p);
    if (p === 2 || p === 3) setGameTab("board");
    else setGameTab("hand");
  };

  const confirmClue = () => {
    if (!clueText.trim()) return;
    setConfirmedClue(clueText);
    goToPhase(1);
  };

  const handleVoteConfirm = () => {
    setVotedFor(boardOverlay);
    setVoteConfirmed(true);
    setBoardOverlay(null);
  };

  // ── Score calculation ────────────────────────────
  const calculateRoundScores = () => {
    const storytellerCard = boardCards.find(c => c.isStoryteller);
    const correctVoters = storytellerCard ? storytellerCard.votes : [];
    const nonStorytellers = PLAYER_LIST.filter(p => p !== STORYTELLER);
    const totalVoters = nonStorytellers.length;
    const correctCount = correctVoters.length;

    // All found it or nobody found it → storyteller gets 0, others get 2
    const allOrNone = correctCount === 0 || correctCount === totalVoters;

    const deltas = {};
    PLAYER_LIST.forEach(p => { deltas[p] = 0; });

    if (!allOrNone) {
      // Storyteller gets 3
      deltas[STORYTELLER] = 3;
      // Correct voters get 3
      correctVoters.forEach(voter => { deltas[voter] = (deltas[voter] || 0) + 3; });
    } else {
      // Non-storytellers get 2
      nonStorytellers.forEach(p => { deltas[p] = (deltas[p] || 0) + 2; });
    }

    // +1 per vote each non-storyteller card received
    boardCards.filter(c => !c.isStoryteller).forEach(c => {
      if (c.votes.length > 0) {
        deltas[c.owner] = (deltas[c.owner] || 0) + c.votes.length;
      }
    });

    return deltas;
  };

  const endRound = () => {
    const deltas = calculateRoundScores();
    setRoundDeltas(deltas);

    const newScores = scores.map(s => ({
      ...s,
      score: s.score + (deltas[s.name] || 0),
    }));
    setScores(newScores);

    // Check win condition — complete the round first
    const topScore = Math.max(...newScores.map(s => s.score));
    if (topScore >= WIN_TARGET) {
      const winners = newScores.filter(s => s.score === topScore);
      setWinner({ names: winners.map(w => w.name), scores: newScores, topScore });
    }
  };

  const nextRound = () => {
    setRoundDeltas(null);
    setPhase(0);
    setGameTab("hand");
    setClueText("");
    setConfirmedClue("");
    setVotedFor(null);
    setVoteConfirmed(false);
    setFocusedBoard(0);
    setRound(r => r + 1);
    setStorytellerIdx(i => (i + 1) % PLAYER_LIST.length);
  };

  const activeBoardCard = boardCards[focusedBoard];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>

      {/* ── HEADER ── */}
      {/* ── HEADER: compact bar with toggle ── */}
      <div style={{ background: "var(--headerBg)", borderBottom: "1px solid color-mix(in srgb, var(--gold) 12%, transparent)", flexShrink: 0 }}>

        {/* Always-visible top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", gap: 8 }}>
          {/* Left: round info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 10, color: "var(--textMuted)", letterSpacing: 1, textTransform: "uppercase" }}>Game</span>
              <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "Georgia,serif", color: "var(--text)", lineHeight: 1 }}>{gameRound}</span>
              <span style={{ fontSize: 10, color: "var(--textMuted)" }}>· turn {turnInCycle}/{PLAYER_LIST.length}</span>
            </div>
            <div style={{ fontSize: 9, color: "var(--textMuted)" }}>first to {WIN_TARGET} pts</div>
          </div>

          {/* Centre: show/hide scores button */}
          <button onClick={() => setShowScores(v => !v)} style={{ ...S.btnO, fontSize: 10, padding: "4px 14px", borderRadius: 20, letterSpacing: 0.5 }}>
            {showScores ? "Hide Scores ▲" : "Show Scores ▼"}
          </button>

          {/* Right: actions */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button style={{ ...S.btnG, fontSize: 10, padding: "5px 10px" }} onClick={() => goToPhase((phase + 1) % 4)}>Next Phase →</button>
            {!confirmExit
              ? <button style={{ ...S.btnG, fontSize: 10, padding: "5px 10px" }} onClick={() => setConfirmExit(true)}>Exit</button>
              : <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--textMuted)" }}>Sure?</span>
                  <button style={{ ...S.btnP, fontSize: 10, padding: "5px 10px" }} onClick={() => { handlePlayerExit(ME); go(SCREENS.LANDING); }}>Yes, Exit</button>
                  <button style={{ ...S.btnG, fontSize: 10, padding: "5px 10px" }} onClick={() => setConfirmExit(false)}>Cancel</button>
                </div>
            }
          </div>
        </div>

        {/* Collapsible scores row */}
        {showScores && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "4px 12px 10px", borderTop: "1px solid color-mix(in srgb, var(--gold) 8%, transparent)" }}>
            {scores.map(s => {
              const isActiveStoryteller = s.name === STORYTELLER;
              const delta = roundDeltas ? roundDeltas[s.name] : null;
              const isActive = activePlayers.includes(s.name);
              return (
                <div key={s.name} style={{ textAlign: "center", minWidth: 36, padding: "2px 6px", borderRadius: 6, background: isActiveStoryteller ? "color-mix(in srgb, var(--gold) 12%, transparent)" : "transparent", border: isActiveStoryteller ? "1px solid color-mix(in srgb, var(--gold) 35%, transparent)" : "1px solid transparent", position: "relative", opacity: isActive ? 1 : 0.4 }}>
                  <div style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: isActiveStoryteller ? "var(--gold)" : "var(--textMuted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 52 }}>{s.name}{!isActive ? " 🚪" : ""}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isActiveStoryteller ? "var(--gold)" : "var(--text)", fontFamily: "Georgia,serif", lineHeight: 1.2 }}>{s.score}</div>
                  {delta > 0 && <div style={{ position: "absolute", top: -6, right: -6, fontSize: 9, fontWeight: 700, color: "#7AC87A", background: "rgba(40,80,40,0.9)", borderRadius: 8, padding: "1px 4px", whiteSpace: "nowrap" }}>+{delta}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PHASE BOXES ── */}
      <div style={{ display: "flex", flexShrink: 0, borderBottom: "1px solid rgba(201,149,42,0.08)" }}>
        {phaseLabels.map((label, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "10px 4px",
            background: i === phase ? "var(--gold)" : i < phase ? "color-mix(in srgb, var(--gold) 7%, transparent)" : "var(--phaseBg)",
            color: i === phase ? "var(--bg)" : i < phase ? "color-mix(in srgb, var(--gold) 40%, transparent)" : "var(--textMuted)",
            fontSize: 11, fontWeight: i === phase ? 700 : 400,
            letterSpacing: 1, textTransform: "uppercase",
            borderRight: i < 3 ? "1px solid rgba(201,149,42,0.1)" : "none",
            transition: "all 0.35s",
            userSelect: "none",
          }}>
            <span style={{ fontSize: 8, marginRight: 4, opacity: 0.6 }}>{i + 1}</span>
            {label}
            {i < phase && <span style={{ marginLeft: 4, fontSize: 9 }}>✓</span>}
          </div>
        ))}
      </div>

      {/* ── CLUE STRIP (phases 1–3) ── */}
      {phase >= 1 && (
        <div style={{ textAlign: "center", padding: "9px 20px", borderBottom: "1px solid rgba(201,149,42,0.06)", background: "rgba(201,149,42,0.04)", flexShrink: 0 }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "var(--gold)", textTransform: "uppercase", marginRight: 10 }}>{STORYTELLER} — Clue:</span>
          <span style={{ fontFamily: "Georgia,serif", fontSize: "clamp(14px,2.5vw,20px)", fontStyle: "italic" }}>"{confirmedClue || "Like Beirut after rain"}"</span>
        </div>
      )}

      {/* ══════════════════════════
          PHASE 0 — CLUE
      ══════════════════════════ */}
      {phase === 0 && isStoryteller && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)" }}>Your turn to tell a story</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontStyle: "italic", color: "color-mix(in srgb, var(--text) 60%, transparent)", textAlign: "center", maxWidth: 320 }}>
            Tap a card to pick it and give your clue
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {handCards.map((c, i) => (
              <div key={i} onClick={() => { setSelHand(i); if (phase === 0) setFocusedHand(i); else setFullscreen({ type: "hand", idx: i }); }} style={{ width: 70, height: 100, borderRadius: 10, cursor: "pointer", background: c.bg, border: "1px solid color-mix(in srgb, var(--gold) 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                {c.emoji}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--textMuted)" }}>Tap any card to enlarge and give a clue</div>
        </div>
      )}

      {phase === 0 && !isStoryteller && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 36 }}>⏳</div>
          <div style={{ fontSize: 14, color: "var(--textMuted)", fontStyle: "italic" }}>Waiting for {STORYTELLER} to give a clue...</div>
        </div>
      )}

      {/* ══════════════════════════
          PHASES 1–3
      ══════════════════════════ */}
      {phase >= 1 && (
        <>
          {/* Storyteller waiting (phases 1 & 2) */}
          {isStoryteller && phase <= 2 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24 }}>
              <div style={{ width: 120, height: 174, borderRadius: 14, background: handCards[selHand].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "2px solid #C9952A" }}>
                {handCards[selHand].emoji}
              </div>
              <div style={{ fontSize: 13, color: "var(--textMuted)" }}>
                {phase === 1 ? "Waiting for players to submit their cards..." : "Waiting for players to vote..."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, width: "100%", maxWidth: 400 }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const nonStorytellers = PLAYER_LIST.filter(p => p !== STORYTELLER);
                  const p = nonStorytellers[i];
                  const submitted = p && i < 2;
                  return (
                    <div key={i} style={{ textAlign: "center", background: p ? (submitted ? "color-mix(in srgb, var(--gold) 7%, transparent)" : "var(--surface)") : "var(--surface)", border: p ? (submitted ? "1px solid color-mix(in srgb, var(--gold) 30%, transparent)" : "1px solid rgba(255,255,255,0.07)") : "1px dashed color-mix(in srgb, var(--textMuted) 15%, transparent)", borderRadius: 10, padding: "12px 8px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: p ? (submitted ? "var(--text)" : "var(--textMuted)") : "color-mix(in srgb, var(--textMuted) 30%, transparent)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p ? p : "—"}
                      </div>
                      <div style={{ fontSize: 16, color: submitted ? "var(--gold)" : "color-mix(in srgb, var(--textMuted) 25%, transparent)" }}>
                        {submitted ? "✓" : "·"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* ── TAB SWITCHER ── */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 20px 0", flexShrink: 0 }}>
                <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 4, gap: 4 }}>
                  {[
                    { id: "board", label: "Board", sub: phase === 2 ? "Vote here" : phase === 3 ? "Reveal" : `${boardCards.length} cards` },
                    { id: "hand",  label: "Your Hand", sub: phase === 1 ? "Pick a card" : "6 cards" },
                  ].map(t => (
                    <button key={t.id} onClick={() => setGameTab(t.id)} style={{ padding: "9px 24px", borderRadius: 7, border: "none", cursor: "pointer", background: gameTab === t.id ? "var(--gold)" : "transparent", color: gameTab === t.id ? "var(--bg)" : "var(--textMuted)", fontWeight: gameTab === t.id ? 700 : 400, fontSize: 13, fontFamily: "inherit", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span>{t.label}</span>
                      <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: 1 }}>{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── BOARD TAB ── */}
              {gameTab === "board" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 20px", gap: 20, overflow: "auto" }}>
                  {/* Big card */}
                  <div onClick={() => setFullscreen({ type: "board", idx: focusedBoard })} style={{ width: "min(230px,54vw)", height: "min(324px,76vw)", borderRadius: 20, flexShrink: 0, background: activeBoardCard.bg, boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 50px rgba(201,149,42,0.12)", border: activeBoardCard.isStoryteller && phase === 3 ? "3px solid #C9952A" : "2px solid color-mix(in srgb, var(--gold) 30%, transparent)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", transition: "background 0.3s" }}>
                    <span style={{ fontSize: "clamp(76px,17vw,114px)", lineHeight: 1 }}>{activeBoardCard.emoji}</span>
                    {activeBoardCard.isStoryteller && phase === 3 && (
                      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 18%, transparent)", padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap" }}>Storyteller</div>
                    )}
                    {phase !== 3 && <div style={{ position: "absolute", bottom: 14, fontSize: 10, letterSpacing: 3, color: "color-mix(in srgb, var(--gold) 45%, transparent)", textTransform: "uppercase" }}>Card {focusedBoard + 1}</div>}
                    {phase === 3 && activeBoardCard.votes.length > 0 && (
                      <div style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: "50%", background: "#C4622D", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{activeBoardCard.votes.length}</div>
                    )}
                  </div>

                  {/* Chips — single horizontal scrollable row, names written bottom-up */}
                  <div style={{ width: "100%", overflowX: "auto", overflowY: "visible", paddingBottom: 4 }}>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", minWidth: "max-content", padding: "4px 16px 0" }}>
                      {boardCards.map((c, i) => {
                        const isActive = focusedBoard === i;
                        const isVoted = votedFor === i;
                        return (
                          <div key={i} onClick={() => { setFocusedBoard(i); setFullscreen({ type: "board", idx: i }); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
                            {/* Vote badge (reveal only) */}
                            {phase === 3 && c.votes.length > 0 && (
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#C4622D", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{c.votes.length}</div>
                            )}
                            {phase === 3 && c.votes.length === 0 && <div style={{ height: 20 }} />}

                            {/* Card chip */}
                            <div style={{
                              width: 52, height: 72, borderRadius: 8, flexShrink: 0,
                              background: isActive ? c.bg : "var(--surface)",
                              border: c.isStoryteller && phase === 3
                                ? "2px solid var(--gold)"
                                : isActive
                                ? "2px solid color-mix(in srgb, var(--gold) 70%, transparent)"
                                : isVoted
                                ? "2px solid #C4622D"
                                : "1px solid color-mix(in srgb, var(--gold) 15%, transparent)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: isActive ? "0 4px 18px rgba(201,149,42,0.3)" : "none",
                              transition: "all 0.2s",
                              transform: isActive ? "translateY(-4px)" : "none",
                              position: "relative",
                            }}>
                              <span style={{ fontSize: 22 }}>{c.emoji}</span>
                              {c.isStoryteller && phase === 3 && (
                                <div style={{ position: "absolute", top: -5, left: -5, width: 13, height: 13, borderRadius: "50%", background: "var(--gold)", fontSize: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg)" }}>★</div>
                              )}
                              {isVoted && phase !== 3 && (
                                <div style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#C4622D", fontSize: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>✓</div>
                              )}
                            </div>

                            {/* Player name — written bottom-up vertically */}
                            <div style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                              fontSize: 10,
                              fontWeight: isActive ? 600 : 400,
                              color: c.isStoryteller && phase === 3 ? "var(--gold)" : isActive ? "var(--text)" : "var(--textMuted)",
                              letterSpacing: 0.5,
                              lineHeight: 1,
                              maxHeight: 70,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              transition: "color 0.2s",
                            }}>
                              {phase === 3 ? c.owner : `Card ${i + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {phase === 2 && !voteConfirmed && (
                    <button style={{ ...S.btnP, padding: "12px 36px", fontSize: 14, borderRadius: 8 }} onClick={() => setBoardOverlay(focusedBoard)}>
                      Vote for this Card
                    </button>
                  )}
                  {phase === 2 && voteConfirmed && (
                    <div style={{ fontSize: 13, color: "var(--gold)", fontStyle: "italic" }}>Vote submitted — waiting for others...</div>
                  )}
                  {phase === 3 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--textMuted)", letterSpacing: 1 }}>Tap any card to see voters</div>
                      {!roundDeltas ? (
                        <button style={{ ...S.btnP, padding: "12px 36px", fontSize: 14, borderRadius: 8 }} onClick={endRound}>
                          End Round & Calculate Scores
                        </button>
                      ) : (
                        <button style={{ ...S.btnP, padding: "12px 36px", fontSize: 14, borderRadius: 8 }} onClick={nextRound}>
                          Next Round →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── HAND TAB ── */}
              {gameTab === "hand" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 20px", gap: 20, overflow: "auto" }}>
                  <div onClick={() => { if (phase === 0) setFocusedHand(selHand); else setFullscreen({ type: "hand", idx: selHand }); }} style={{ width: "min(230px,54vw)", height: "min(324px,76vw)", borderRadius: 20, flexShrink: 0, background: handCards[selHand].bg, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", border: "2px solid color-mix(in srgb, var(--gold) 35%, transparent)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
                    <span style={{ fontSize: "clamp(76px,17vw,114px)", lineHeight: 1 }}>{handCards[selHand].emoji}</span>
                    <div style={{ position: "absolute", bottom: 14, fontSize: 10, letterSpacing: 3, color: "color-mix(in srgb, var(--gold) 45%, transparent)", textTransform: "uppercase" }}>Card #{selHand + 1}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    {handCards.map((c, i) => (
                      <div key={i} onClick={() => { setSelHand(i); if (phase === 0) setFocusedHand(i); else setFullscreen({ type: "hand", idx: i }); }} style={{ width: 52, height: 52, borderRadius: 10, cursor: "pointer", flexShrink: 0, background: selHand === i ? c.bg : "rgba(255,255,255,0.04)", border: selHand === i ? "2px solid #C9952A" : "1px solid color-mix(in srgb, var(--gold) 12%, transparent)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: selHand === i ? "0 4px 18px rgba(201,149,42,0.35)" : "none", transition: "all 0.2s", transform: selHand === i ? "translateY(-4px)" : "none" }}>
                        <span style={{ fontSize: 20 }}>{c.emoji}</span>
                        <span style={{ fontSize: 9, color: selHand === i ? "var(--gold)" : "var(--textMuted)", fontWeight: 700 }}>{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  {phase === 1 && (
                    <button style={{ ...S.btnP, padding: "12px 36px", fontSize: 14, borderRadius: 8 }} onClick={() => goToPhase(2)}>
                      Submit Card #{selHand + 1}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════
          OVERLAY: Board card (vote confirm + reveal)
      ══════════════════════════ */}
      {boardOverlay !== null && !fullscreen && (
        <div onClick={() => setBoardOverlay(null)} style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 380, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

            {/* Card + Full Screen button side by side */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: "min(220px,55vw)", height: "min(308px,77vw)", borderRadius: 18, background: boardCards[boardOverlay].bg, border: boardCards[boardOverlay].isStoryteller ? "3px solid #C9952A" : "2px solid color-mix(in srgb, var(--gold) 30%, transparent)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", flexShrink: 0 }}>
                <span style={{ fontSize: "clamp(72px,16vw,108px)", lineHeight: 1 }}>{boardCards[boardOverlay].emoji}</span>
                {boardCards[boardOverlay].isStoryteller && (
                  <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 18%, transparent)", padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap" }}>Storyteller's Card</div>
                )}
                <div style={{ position: "absolute", bottom: 12, fontSize: 9, letterSpacing: 3, color: "color-mix(in srgb, var(--gold) 45%, transparent)", textTransform: "uppercase" }}>Card {boardOverlay + 1}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFullscreen({ type: "board", idx: boardOverlay }); }}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid color-mix(in srgb, var(--gold) 30%, transparent)", borderRadius: 8, color: "var(--gold)", fontSize: 10, padding: "8px 10px", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1.5, writingMode: "vertical-rl", transform: "rotate(180deg)", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", textTransform: "uppercase" }}>
                Full Screen
              </button>
            </div>

            {/* Reveal info */}
            {phase === 3 && (
              <div style={{ width: "100%", background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--gold) 15%, transparent)", borderRadius: 14, padding: "16px 20px" }}>
                {boardCards[boardOverlay].votes.length > 0 ? (
                  <>
                    <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--textMuted)", marginBottom: 10 }}>Voted by</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {boardCards[boardOverlay].votes.map(voter => (
                        <div key={voter} style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--gold) 25%, transparent)", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{voter}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 10 }}>
                      +{boardCards[boardOverlay].votes.length} point{boardCards[boardOverlay].votes.length > 1 ? "s" : ""} to {boardCards[boardOverlay].owner}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--textMuted)", fontStyle: "italic", textAlign: "center" }}>No votes for this card</div>
                )}
              </div>
            )}

            {/* Vote confirm */}
            {phase === 2 && !voteConfirmed && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--text) 70%, transparent)", textAlign: "center" }}>Vote for this card?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ ...S.btnG, flex: 1, padding: "11px", fontSize: 14 }} onClick={() => setBoardOverlay(null)}>Cancel</button>
                  <button style={{ ...S.btnP, flex: 1, padding: "11px", fontSize: 14 }} onClick={handleVoteConfirm}>Yes, Vote</button>
                </div>
              </div>
            )}
            {phase === 2 && voteConfirmed && (
              <div style={{ fontSize: 13, color: "var(--gold)" }}>You already voted!</div>
            )}

            <div style={{ fontSize: 11, color: "var(--textMuted)" }}>Tap outside to close</div>
          </div>
        </div>
      )}

      {/* ══════════════════════════
          OVERLAY: Hand card
          Phase 0 = card + clue in one screen
          Other phases = enlarge only
      ══════════════════════════ */}
      {focusedHand !== null && !fullscreen && (
        <div onClick={() => setFocusedHand(null)}
          style={{ position: "fixed", inset: 0, background: "var(--overlayDk)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px 24px", gap: 18, overflowY: "auto" }}>

          {/* Card — tap to fullscreen */}
          <div onClick={e => { e.stopPropagation(); setFullscreen({ type: "hand", idx: focusedHand }); }} style={{ width: "min(220px,55vw)", height: "min(308px,77vw)", borderRadius: 18, background: handCards[focusedHand].bg, border: "2px solid color-mix(in srgb, var(--gold) 50%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.8)", flexShrink: 0, cursor: "pointer" }}>
            <span style={{ fontSize: "clamp(72px,16vw,108px)", lineHeight: 1 }}>{handCards[focusedHand].emoji}</span>
            <div style={{ position: "absolute", bottom: 12, fontSize: 9, letterSpacing: 3, color: "color-mix(in srgb, var(--gold) 45%, transparent)", textTransform: "uppercase" }}>Tap to expand</div>
          </div>

          {/* Phase 0: clue input right below the card */}
          {phase === 0 && (
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", textAlign: "center" }}>Give this card a clue</div>
              <input
                style={{ width: "100%", padding: "13px 18px", borderRadius: 10, background: "var(--inputBg)", border: "1px solid color-mix(in srgb, var(--gold) 35%, transparent)", color: "var(--text)", fontSize: 18, fontFamily: "Georgia,serif", textAlign: "center", outline: "none", boxSizing: "border-box" }}
                placeholder="Tap to type a clue..."
                value={clueText}
                onChange={e => setClueText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && clueText.trim()) { setFocusedHand(null); confirmClue(); }}}
              />
              <button
                onClick={e => { e.stopPropagation(); if (clueText.trim()) { setFocusedHand(null); confirmClue(); }}}
                style={{ ...S.btnP, padding: "13px", fontSize: 15, borderRadius: 10, opacity: clueText.trim() ? 1 : 0.45, cursor: clueText.trim() ? "pointer" : "default" }}>
                Confirm Clue
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--textMuted)" }}>Tap outside to {phase === 0 ? "cancel" : "close"}</div>
        </div>
      )}

      {/* ══════════════════════════
          FULLSCREEN card view
      ══════════════════════════ */}
      {fullscreen && (
        <div style={{ position: "fixed", inset: 0, background: "var(--fullBg)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Left tap zone */}
          <div onClick={() => setFullscreen(null)} style={{ position: "absolute", left: 0, top: 0, width: "20%", height: "100%", cursor: "pointer", zIndex: 1 }} />
          {/* Right tap zone */}
          <div onClick={() => setFullscreen(null)} style={{ position: "absolute", right: 0, top: 0, width: "20%", height: "100%", cursor: "pointer", zIndex: 1 }} />

          {/* Card centred, filling as much space as possible */}
          <div style={{ position: "absolute", bottom: 20, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Tap anywhere to close</div>
          <div style={{ position: "absolute", bottom: 20, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Tap anywhere to close</div>
          {fullscreen.type === "board" ? (
            <div style={{ width: "min(68vw, calc(100vh * 0.714))", height: "min(calc(68vw * 1.4), 100vh)", borderRadius: 24, background: boardCards[fullscreen.idx].bg, border: boardCards[fullscreen.idx].isStoryteller ? "3px solid #C9952A" : "2px solid rgba(201,149,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 0 140px rgba(0,0,0,0.95)", zIndex: 2 }}>
              <span style={{ fontSize: "clamp(100px,22vw,220px)", lineHeight: 1 }}>{boardCards[fullscreen.idx].emoji}</span>
              {boardCards[fullscreen.idx].isStoryteller && (
                <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 18%, transparent)", padding: "5px 16px", borderRadius: 6, whiteSpace: "nowrap" }}>Storyteller's Card</div>
              )}
            </div>
          ) : (
            <div style={{ width: "min(68vw, calc(100vh * 0.714))", height: "min(calc(68vw * 1.4), 100vh)", borderRadius: 24, background: handCards[fullscreen.idx].bg, border: "2px solid rgba(201,149,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 140px rgba(0,0,0,0.95)", zIndex: 2 }}>
              <span style={{ fontSize: "clamp(100px,22vw,220px)", lineHeight: 1 }}>{handCards[fullscreen.idx].emoji}</span>
            </div>
          )}
        </div>
      )}


      {/* ══════════════════════════
          OVERLAY: Game disbanded (< 3 players left)
      ══════════════════════════ */}
      {gameDisbanded && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlayDk)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, padding: 24 }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 52 }}>🚪</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--textMuted)", marginBottom: 8 }}>Game Ended</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>Not enough players</div>
              <div style={{ fontSize: 14, color: "var(--textMuted)", marginTop: 10, lineHeight: 1.6 }}>
                A player left and the game dropped below 3 players. The session has ended.
              </div>
            </div>
            <div style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--textMuted)", marginBottom: 4 }}>Final Scores</div>
              {scores.sort((a, b) => b.score - a.score).map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--textMuted)", width: 18 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</div>
                  <div style={{ flex: 1, fontSize: 14, color: "var(--text)", textAlign: "left" }}>{s.name}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "Georgia,serif", color: "var(--gold)" }}>{s.score}</div>
                </div>
              ))}
            </div>
            <button style={{ ...S.btnP, padding: "13px 36px", fontSize: 15, borderRadius: 10 }} onClick={() => go(SCREENS.LANDING)}>Back to Home</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════
          OVERLAY: Round score summary
      ══════════════════════════ */}
      {roundDeltas && !winner && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(18px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 24 }}>
          <div style={{ maxWidth: 400, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Round {round - 1} Results</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 20, color: "var(--text)" }}>Scores Updated</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scores.sort((a, b) => b.score - a.score).map(s => {
                const delta = roundDeltas[s.name] || 0;
                return (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", flex: 1 }}>{s.name}</div>
                    {delta > 0 && <div style={{ fontSize: 12, color: "#7AC87A", fontWeight: 600 }}>+{delta}</div>}
                    {delta === 0 && <div style={{ fontSize: 12, color: "var(--textMuted)" }}>+0</div>}
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif", color: "var(--gold)", minWidth: 32, textAlign: "right" }}>{s.score}</div>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100,(s.score / WIN_TARGET) * 100)}%`, background: s.score >= WIN_TARGET * 0.8 ? "#C4622D" : "var(--gold)", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "var(--textMuted)", textAlign: "center" }}>First to {WIN_TARGET} wins</div>
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 12, color: "var(--textMuted)" }}>Next storyteller: </span>
              <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>{nextStoryteller}</span>
              {turnInCycle === PLAYER_LIST.length && (
                <div style={{ fontSize: 10, color: "var(--textMuted)", marginTop: 3, letterSpacing: 1 }}>· Everyone has had a turn · Game Round {gameRound + 1} begins</div>
              )}
            </div>
            <button style={{ ...S.btnP, padding: "13px", fontSize: 15, borderRadius: 10 }} onClick={nextRound}>
              {turnInCycle === PLAYER_LIST.length ? `Start Game Round ${gameRound + 1} →` : `Next Turn — ${nextStoryteller}'s go →`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════
          OVERLAY: Winner screen
      ══════════════════════════ */}
      {winner && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlayDk)", backdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 24 }}>
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 60, lineHeight: 1 }}>🏆</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
                {winner.names.length > 1 ? "It's a Tie!" : "Winner!"}
              </div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px,7vw,44px)", fontWeight: 700, background: "linear-gradient(135deg,#C9952A,#E8C57A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
                {winner.names.join(" & ")}
              </div>
              <div style={{ fontSize: 14, color: "var(--textMuted)", marginTop: 8 }}>reached {winner.topScore} points</div>
            </div>

            {/* Final leaderboard */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--gold) 15%, transparent)", borderRadius: 14, padding: "16px 20px" }}>
              {winner.scores.sort((a, b) => b.score - a.score).map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: i === 0 ? "var(--gold)" : "var(--textMuted)", width: 18, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</div>
                  <div style={{ fontSize: 14, color: winner.names.includes(s.name) ? "var(--gold)" : "var(--text)", fontWeight: winner.names.includes(s.name) ? 700 : 400, flex: 1, textAlign: "left" }}>{s.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif", color: winner.names.includes(s.name) ? "var(--gold)" : "var(--text)" }}>{s.score}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button style={{ ...S.btnO, padding: "12px 28px" }} onClick={() => go(SCREENS.LANDING)}>Back to Home</button>
              <button style={{ ...S.btnP, padding: "12px 28px" }} onClick={() => { setWinner(null); setScores(PLAYER_LIST.map(n => ({ name: n, score: 0 }))); setRound(1); setStorytellerIdx(0); nextRound(); }}>Play Again</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────
// ─────────────────────────────────────
// CONNECTION STATUS BAR
// ─────────────────────────────────────
function ConnectionBar({ S, players, activePlayers }) {
  const [statuses, setStatuses] = useState(() => {
    const s = {};
    players.forEach(p => { s[p] = true; });
    return s;
  });

  // Simulate realistic connection fluctuations
  useEffect(() => {
    const flicker = setInterval(() => {
      setStatuses(prev => {
        const next = { ...prev };
        players.forEach(p => {
          if (!activePlayers.includes(p)) { next[p] = false; return; }
          if (next[p] && Math.random() < 0.04) next[p] = false;
          else if (!next[p] && Math.random() < 0.96) next[p] = true;
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(flicker);
  }, [activePlayers]);

  const connected = players.filter(p => statuses[p] && activePlayers.includes(p)).length;
  const total = activePlayers.length;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
      background: "var(--headerBg)", borderTop: "1px solid var(--border)",
      backdropFilter: "blur(12px)", padding: "6px 16px",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--textMuted)", flexShrink: 0 }}>
        Players
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
        {players.map(p => {
          const isActive = activePlayers.includes(p);
          const online = isActive && statuses[p];
          return (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 4, opacity: isActive ? 1 : 0.4 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: !isActive ? "#888" : online ? "#4CAF50" : "#F44336",
                boxShadow: online && isActive ? "0 0 5px #4CAF5088" : "none",
                transition: "background 0.4s, box-shadow 0.4s",
              }} />
              <span style={{ fontSize: 10, color: isActive ? "var(--text)" : "var(--textMuted)", whiteSpace: "nowrap" }}>{p}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: connected === total ? "#4CAF50" : connected === 0 ? "#F44336" : "var(--textMuted)", flexShrink: 0, letterSpacing: 1 }}>
        {connected}/{total} online
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [themeName, setThemeName] = useState("dark");
  const S = makeS(THEMES[themeName]);
  const ALL_PLAYERS = ["Layla", "Karim", "Nadia", "Sara", "Rami", "Lara", "Hassan", "Dima"];
  const [activePlayers, setActivePlayers] = useState(ALL_PLAYERS);
  const [exitedPlayers, setExitedPlayers] = useState([]); // players who left but can rejoin
  const showBar = screen === SCREENS.GAME || screen === SCREENS.WAITING;
  return (
    <div style={{ ...S.root,
      "--bg": S.t.bg, "--surface": S.t.surface, "--surfaceHi": S.t.surfaceHi,
      "--border": S.t.border, "--borderHi": S.t.borderHi,
      "--text": S.t.text, "--textMuted": S.t.textMuted, "--gold": S.t.gold,
      "--overlay": S.t.overlay, "--overlayDk": S.t.overlayDk,
      "--fullBg": S.t.fullBg, "--inputBg": S.t.inputBg,
      "--phaseBg": S.t.phaseBg, "--headerBg": S.t.headerBg,
      paddingBottom: showBar ? 36 : 0,
    }}>
      {screen === SCREENS.LANDING  && <Landing  go={setScreen} S={S} themeName={themeName} setThemeName={setThemeName} />}
      {screen === SCREENS.LOBBY    && <Lobby    go={setScreen} S={S} exitedPlayers={exitedPlayers} setExitedPlayers={setExitedPlayers} activePlayers={activePlayers} setActivePlayers={setActivePlayers} />}
      {screen === SCREENS.WAITING  && <Waiting  go={setScreen} S={S} />}
      {screen === SCREENS.GAME     && <Game     go={setScreen} S={S} activePlayers={activePlayers} setActivePlayers={setActivePlayers} setExitedPlayers={setExitedPlayers} exitedPlayers={exitedPlayers} />}
      {showBar && <ConnectionBar S={S} players={ALL_PLAYERS} activePlayers={activePlayers} />}
    </div>
  );
}
