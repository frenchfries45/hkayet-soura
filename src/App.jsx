import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Supabase ───────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL  || "https://kdenyavpathupgzouvas.supabase.co";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_swXuHERnmpPafNqlCZwb4A_zBRnRjvK";
const supabase = createClient(SUPA_URL, SUPA_KEY);


// ── Sound Engine (Web Audio API — no dependencies) ────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _ctx = null;
const getCtx = () => { if(!_ctx) _ctx = new AudioCtx(); return _ctx; };

const sounds = {
  // Card flip/select: soft thud
  cardPick: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.setValueAtTime(320, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime+0.08);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.12);
    o.start(); o.stop(ctx.currentTime+0.12);
  },
  // Submit card: satisfying click
  cardSubmit: () => {
    const ctx = getCtx();
    [0, 0.05].forEach((delay, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(i===0?440:560, ctx.currentTime+delay);
      o.frequency.exponentialRampToValueAtTime(i===0?300:380, ctx.currentTime+delay+0.1);
      g.gain.setValueAtTime(0.15, ctx.currentTime+delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+delay+0.15);
      o.start(ctx.currentTime+delay); o.stop(ctx.currentTime+delay+0.15);
    });
  },
  // Clue given: warm chime
  clueGiven: () => {
    const ctx = getCtx();
    [523, 659, 784].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime+i*0.1);
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime+i*0.1+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+i*0.1+0.5);
      o.start(ctx.currentTime+i*0.1); o.stop(ctx.currentTime+i*0.1+0.5);
    });
  },
  // Vote cast: gentle pop
  vote: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.setValueAtTime(600, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime+0.1);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.15);
    o.start(); o.stop(ctx.currentTime+0.15);
  },
  // Cards revealed: dramatic whoosh + chord
  reveal: () => {
    const ctx = getCtx();
    // whoosh
    const buf = ctx.createBuffer(1, ctx.sampleRate*0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2)*0.3;
    const src = ctx.createBufferSource(), gw = ctx.createGain();
    src.buffer=buf; src.connect(gw); gw.connect(ctx.destination);
    gw.gain.setValueAtTime(0.4,ctx.currentTime);
    gw.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
    src.start();
    // chord
    [392, 494, 587].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime+0.1+i*0.05);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime+0.15+i*0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.9);
      o.start(ctx.currentTime+0.1+i*0.05); o.stop(ctx.currentTime+0.9);
    });
  },
  // Score/win: celebratory fanfare
  score: () => {
    const ctx = getCtx();
    [523,659,784,1047].forEach((freq,i)=>{
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime+i*0.08);
      g.gain.linearRampToValueAtTime(0.13, ctx.currentTime+i*0.08+0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+i*0.08+0.6);
      o.start(ctx.currentTime+i*0.08); o.stop(ctx.currentTime+i*0.08+0.6);
    });
  },
  // New round: soft bell reset
  newRound: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime+0.3);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
    o.start(); o.stop(ctx.currentTime+0.5);
  },
};

// Global mute state (outside React so it survives re-renders)
let _soundOn = true;
const play = (name) => { if(_soundOn && sounds[name]) { try { sounds[name](); } catch(e){} } };

const SCREENS = { LANDING:"landing", LOBBY:"lobby", WAITING:"waiting", GAME:"game" };

// ── Clipboard helper (works on all browsers + mobile) ─────────
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for http or unsupported browsers
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

// ── Themes ────────────────────────────────────────────────────
const THEMES = {
  dark:{
    bg:"#1A1612",surface:"rgba(255,255,255,0.04)",surfaceHi:"rgba(201,149,42,0.08)",
    border:"rgba(201,149,42,0.15)",borderHi:"#C9952A",text:"#F5EFE4",textMuted:"#7A6E62",
    gold:"#C9952A",overlay:"rgba(0,0,0,0.88)",overlayDk:"rgba(0,0,0,0.92)",
    fullBg:"#0A0806",inputBg:"rgba(255,255,255,0.06)",phaseBg:"rgba(0,0,0,0.2)",
    headerBg:"rgba(0,0,0,0.45)",radial:"radial-gradient(ellipse 60% 50% at 50% 40%,rgba(201,149,42,0.07) 0%,transparent 70%)",
  },
  light:{
    bg:"#F5EDE0",surface:"rgba(0,0,0,0.06)",surfaceHi:"rgba(150,100,10,0.10)",
    border:"rgba(150,100,20,0.25)",borderHi:"#9A6E10",text:"#1C1108",textMuted:"#6B5A40",
    gold:"#9A6E10",overlay:"rgba(235,220,198,0.95)",overlayDk:"rgba(225,208,182,0.97)",
    fullBg:"#EDE0CC",inputBg:"rgba(0,0,0,0.07)",phaseBg:"rgba(255,255,255,0.5)",
    headerBg:"rgba(235,220,198,0.92)",radial:"radial-gradient(ellipse 60% 50% at 50% 40%,rgba(150,100,10,0.10) 0%,transparent 70%)",
  },
};

function makeS(t) {
  return {
    root:{ fontFamily:"'DM Sans','Segoe UI',sans-serif",background:t.bg,color:t.text,minHeight:"100vh",display:"flex",flexDirection:"column" },
    btnP:{ padding:"10px 24px",borderRadius:6,border:"none",background:t.gold,color:t.bg,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",WebkitAppearance:"none",touchAction:"manipulation",userSelect:"none" },
    btnO:{ padding:"10px 24px",borderRadius:6,border:`1px solid ${t.gold}80`,background:"transparent",color:t.gold,fontWeight:500,fontSize:14,cursor:"pointer",fontFamily:"inherit",WebkitAppearance:"none",touchAction:"manipulation",userSelect:"none" },
    btnG:{ padding:"10px 24px",borderRadius:6,border:`1px solid ${t.text}25`,background:"transparent",color:t.text,fontSize:14,cursor:"pointer",fontFamily:"inherit",WebkitAppearance:"none",touchAction:"manipulation",userSelect:"none" },
    t,
  };
}

// ── Helpers ───────────────────────────────────────────────────
function genCode() { return Math.random().toString(36).substring(2,6).toUpperCase(); }
function shuffle(arr) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

const FALLBACK_DECK = [
  {id:"c1",emoji:"\u{1F54C}",bg:"linear-gradient(145deg,#2A1A0A,#7A4010)"},
  {id:"c2",emoji:"\u{1F33F}",bg:"linear-gradient(145deg,#1E2D1E,#3A5E2A)"},
  {id:"c3",emoji:"\u{1F30A}",bg:"linear-gradient(145deg,#0D1F2D,#1A4060)"},
  {id:"c4",emoji:"\u{1F3DB}\uFE0F",bg:"linear-gradient(145deg,#2A2A1A,#6A6A20)"},
  {id:"c5",emoji:"\u{1F319}",bg:"linear-gradient(145deg,#1A1A2D,#3A3A6B)"},
  {id:"c6",emoji:"\u2B50",bg:"linear-gradient(145deg,#2D1A2D,#6B2060)"},
  {id:"c7",emoji:"\u{1F3D4}\uFE0F",bg:"linear-gradient(145deg,#3D2B1F,#7A4A30)"},
  {id:"c8",emoji:"\u{1F33E}",bg:"linear-gradient(145deg,#1A2010,#4A6020)"},
  {id:"c9",emoji:"\u{1F98B}",bg:"linear-gradient(145deg,#2D1A2D,#6B3080)"},
  {id:"c10",emoji:"\u{1F338}",bg:"linear-gradient(145deg,#2D1020,#6B2040)"},
  {id:"c11",emoji:"\u{1F3DC}\uFE0F",bg:"linear-gradient(145deg,#2D2010,#7A5020)"},
  {id:"c12",emoji:"\u{1F30B}",bg:"linear-gradient(145deg,#2D1010,#6B2020)"},
  {id:"c13",emoji:"\u{1F41A}",bg:"linear-gradient(145deg,#102D2D,#206B6B)"},
  {id:"c14",emoji:"\u{1F300}",bg:"linear-gradient(145deg,#101A2D,#203A6B)"},
  {id:"c15",emoji:"\u{1F56F}\uFE0F",bg:"linear-gradient(145deg,#2D2010,#6B5020)"},
  {id:"c16",emoji:"\u{1F5DD}\uFE0F",bg:"linear-gradient(145deg,#1A1A10,#4A4A20)"},
  {id:"c17",emoji:"\u{1F332}",bg:"linear-gradient(145deg,#1A2D1A,#3A6B3A)"},
  {id:"c18",emoji:"\u{1F30C}",bg:"linear-gradient(145deg,#0D0D2D,#1A1A6B)"},
  {id:"c19",emoji:"\u{1F3FA}",bg:"linear-gradient(145deg,#2D1A0A,#7A5020)"},
  {id:"c20",emoji:"\u{1F409}",bg:"linear-gradient(145deg,#0D2D1A,#1A6B40)"},
  {id:"c21",emoji:"\u{1F6F8}",bg:"linear-gradient(145deg,#1A1A2D,#4A4A7A)"},
  {id:"c22",emoji:"\u{1F9FF}",bg:"linear-gradient(145deg,#2D1A1A,#7A4040)"},
  {id:"c23",emoji:"\u{1F30D}",bg:"linear-gradient(145deg,#0D2D0D,#1A6B1A)"},
  {id:"c24",emoji:"\u{1F3BC}",bg:"linear-gradient(145deg,#2D0D2D,#7A207A)"},
  {id:"c25",emoji:"\u{1F4AB}",bg:"linear-gradient(145deg,#2D2D0D,#7A7A20)"},
  {id:"c26",emoji:"\u{1F9F2}",bg:"linear-gradient(145deg,#1A2D2D,#3A7A7A)"},
  {id:"c27",emoji:"\u{1F4DC}",bg:"linear-gradient(145deg,#2D2A1A,#6B6030)"},
  {id:"c28",emoji:"\u{1F3A0}",bg:"linear-gradient(145deg,#2D1A2D,#7A3A7A)"},
  {id:"c29",emoji:"\u{1F30F}",bg:"linear-gradient(145deg,#0D1A2D,#203A6B)"},
  {id:"c30",emoji:"\u{1F9CA}",bg:"linear-gradient(145deg,#1A2D2D,#4A7A7A)"},
  {id:"c31",emoji:"\u{1F333}",bg:"linear-gradient(145deg,#1A2D1A,#4A6B4A)"},
  {id:"c32",emoji:"\u{1F315}",bg:"linear-gradient(145deg,#2D2D1A,#7A7A3A)"},
  {id:"c33",emoji:"\u{1F3F0}",bg:"linear-gradient(145deg,#2D1A0D,#7A4A20)"},
  {id:"c34",emoji:"\u{1F9F8}",bg:"linear-gradient(145deg,#2D1A2D,#6B406B)"},
  {id:"c35",emoji:"\u{1F4A7}",bg:"linear-gradient(145deg,#0D1A2D,#1A4A6B)"},
  {id:"c36",emoji:"\u{1F340}",bg:"linear-gradient(145deg,#1A2D1A,#406B40)"},
  {id:"c37",emoji:"\u{1F382}",bg:"linear-gradient(145deg,#2D1A1A,#7A4040)"},
  {id:"c38",emoji:"\u{1F3A8}",bg:"linear-gradient(145deg,#2D1A0D,#7A5030)"},
  {id:"c39",emoji:"\u{1F9F5}",bg:"linear-gradient(145deg,#2D0D1A,#7A2040)"},
  {id:"c40",emoji:"\u{1F511}",bg:"linear-gradient(145deg,#2D2A0D,#7A6A20)"},
  {id:"c41",emoji:"\u{1F30E}",bg:"linear-gradient(145deg,#0D2D1A,#206B40)"},
  {id:"c42",emoji:"\u{1F9ED}",bg:"linear-gradient(145deg,#1A1A2D,#404A7A)"},
  {id:"c43",emoji:"\u{1F4F7}",bg:"linear-gradient(145deg,#1A1A1A,#4A4A4A)"},
  {id:"c44",emoji:"\u{1F3B6}",bg:"linear-gradient(145deg,#2D0D2D,#6B206B)"},
  {id:"c45",emoji:"\u{1F9C9}",bg:"linear-gradient(145deg,#2D1A0D,#6B4020)"},
  {id:"c46",emoji:"\u{1F3D6}\uFE0F",bg:"linear-gradient(145deg,#2D2A0D,#6B6020)"},
  {id:"c47",emoji:"\u{1F9A2}",bg:"linear-gradient(145deg,#0D1A2D,#204A6B)"},
  {id:"c48",emoji:"\u{1F441}\uFE0F",bg:"linear-gradient(145deg,#1A0D2D,#4A206B)"},
];

// ── CardFace: renders real image if available, else emoji fallback ─
function CardFace({ card, size = "large", label = null, highlight = false, voteCount = null }) {
  const isLarge = size === "large";
  const isMini  = size === "mini";
  const w = isMini ? 52  : isLarge ? "min(230px,54vw)" : 220;
  const h = isMini ? 72  : isLarge ? "min(324px,76vw)" : "min(308px,77vw)";
  const emojiSize = isMini ? 22 : isLarge ? "clamp(76px,17vw,114px)" : "clamp(72px,16vw,108px)";
  const radius = isMini ? 8 : isLarge ? 20 : 18;
  const border = highlight
    ? "3px solid #C9952A"
    : `${isMini ? 1 : 2}px solid color-mix(in srgb, var(--gold) ${isMini ? 15 : 30}%, transparent)`;

  return (
    <div style={{
      width: w, height: h, borderRadius: radius, flexShrink: 0,
      background: card?.bg || "#2A1A0A",
      border, position: "relative", overflow: "hidden",
      boxShadow: isMini ? "none" : "0 40px 100px rgba(0,0,0,0.7)",
    }}>
      {card?.image_url ? (
        <img
          src={card.image_url}
          alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
          onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
        />
      ) : null}
      <div style={{ position:"absolute", inset:0, display: card?.image_url ? "none" : "flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{card?.emoji || "🎴"}</span>
      </div>
      {label && (
        <div style={{ position:"absolute", bottom: isMini ? 4 : 14, left:0, right:0, textAlign:"center", fontSize: isMini ? 8 : 10, letterSpacing:2, color:"color-mix(in srgb, var(--gold) 45%, transparent)", textTransform:"uppercase", padding:"0 4px", background: isMini ? "transparent" : "none" }}>{label}</div>
      )}
      {highlight && (
        <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", fontSize:9, letterSpacing:2, textTransform:"uppercase", color:"var(--gold)", background:"rgba(0,0,0,0.7)", padding:"3px 10px", borderRadius:4, whiteSpace:"nowrap" }}>Storyteller's Card</div>
      )}
      {voteCount > 0 && (
        <div style={{ position:"absolute", top:10, right:10, fontSize:12, fontWeight:700, color:"#7AC87A", background:"rgba(30,60,30,0.9)", borderRadius:8, padding:"2px 8px" }}>+{voteCount}</div>
      )}
    </div>
  );
}


// ── FaceDown: back of a card shown before reveal ──────────────
function FaceDown({ size="large" }) {
  const isMini = size==="mini";
  const w = isMini ? 52 : size==="medium" ? 220 : "min(230px,54vw)";
  const h = isMini ? 72 : size==="medium" ? "min(308px,77vw)" : "min(324px,76vw)";
  return (
    <div style={{
      width:w, height:h, borderRadius:isMini?8:20, flexShrink:0, position:"relative",
      background:"linear-gradient(145deg,#1A1208,#2D2010)",
      border:`${isMini?1:2}px solid rgba(201,149,42,0.2)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      overflow:"hidden",
      boxShadow: isMini ? "none" : "0 40px 100px rgba(0,0,0,0.7)",
    }}>
      {/* Card back pattern */}
      <div style={{position:"absolute",inset:0,opacity:0.12,backgroundImage:"repeating-linear-gradient(45deg,#C9952A 0px,#C9952A 1px,transparent 1px,transparent 12px),repeating-linear-gradient(-45deg,#C9952A 0px,#C9952A 1px,transparent 1px,transparent 12px)"}}/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:isMini?2:8}}>
        <div style={{fontSize:isMini?16:36,opacity:0.4}}>🎴</div>
        {!isMini&&<div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"rgba(201,149,42,0.4)"}}>Hidden</div>}
      </div>
    </div>
  );
}

// ── Sound Toggle ──────────────────────────────────────────────
function SoundToggle() {
  const [on, setOn] = useState(true);
  const toggle = () => {
    _soundOn = !_soundOn;
    setOn(_soundOn);
    if(_soundOn) play("cardPick");
  };
  return (
    <button
      onClick={toggle}
      title={on?"Mute sounds":"Enable sounds"}
      style={{
        background:"transparent", border:"1px solid rgba(201,149,42,0.3)",
        borderRadius:8, cursor:"pointer", padding:"6px 10px",
        fontSize:16, lineHeight:1, minWidth:36, minHeight:36,
        color: on ? "#C9952A" : "#7A6E62",
        transition:"all 0.2s",
      }}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}

// ═════════════════════════════════════
// LANDING
// ═════════════════════════════════════
function Landing({ go, S, themeName, setThemeName }) {
  const [showFaq, setShowFaq] = useState(false);
  const fan = [
    {e:"\u{1F3D4}\uFE0F",bg:"linear-gradient(135deg,#3D2B1F,#7A4A30)",r:-24,z:1},
    {e:"\u{1F30A}",bg:"linear-gradient(135deg,#1A2D1A,#2D5016)",r:-12,z:2},
    {e:"\u{1F319}",bg:"linear-gradient(135deg,#2A1F0F,#7A5520)",r:0,z:3},
    {e:"\u{1F33F}",bg:"linear-gradient(135deg,#1A1A2D,#2D2D6B)",r:12,z:2},
    {e:"\u{1F54C}",bg:"linear-gradient(135deg,#2D1A1A,#6B2020)",r:24,z:1},
  ];
  const FAQ = [
    {section:"How to Play",items:[
      {q:"What is Hkayet Soura?",a:"A storytelling card game for 3-8 players. Each round, one player is the Storyteller. They pick a card and give a clue. Everyone else picks their best matching card. All cards go face-down, then everyone votes for which was the Storyteller's."},
      {q:"How do you score?",a:"Storyteller scores 3 points if some but not all players find their card. Correct voters earn 3 points. Each non-storyteller card that gets voted on earns 1 point per vote."},
      {q:"How do you win?",a:"First to reach 30 points wins (42 points in an 8-player game)."},
      {q:"How long does a game take?",a:"Roughly 30-45 minutes."},
    ]},
    {section:"Setup",items:[
      {q:"How many players?",a:"Between 3 and 8."},
      {q:"How do I create a room?",a:"Tap Play Now, enter your name, share the room code with friends."},
      {q:"How do I join?",a:"Tap Play Now then Join Room and enter the code."},
      {q:"What if someone leaves?",a:"Game continues if 3+ players remain. Below 3, it ends."},
    ]},
    {section:"During the Game",items:[
      {q:"Can I see my cards anytime?",a:"Yes, the Hand tab is always available."},
      {q:"What makes a good clue?",a:"Slightly mysterious. Not too obvious, not too cryptic. The goal is for SOME people to guess right, not all."},
      {q:"Can I change my vote?",a:"No, votes are final once submitted."},
    ]},
    {section:"Technical",items:[
      {q:"Works on mobile?",a:"Yes, designed mobile-first."},
      {q:"Need an account?",a:"No. Just a name and room code."},
      {q:"Connection dropped?",a:"Rejoin with your same name and room code. Score is preserved."},
    ]},
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:S.t.radial,pointerEvents:"none"}}/>
      <div style={{textAlign:"center",maxWidth:600,position:"relative",zIndex:1}}>
        <div style={{display:"inline-block",fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"var(--gold)",border:"1px solid color-mix(in srgb, var(--gold) 30%, transparent)",padding:"6px 16px",borderRadius:20,marginBottom:28}}>Inspired by Dixit</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:"clamp(48px,9vw,88px)",fontWeight:700,lineHeight:1,background:"linear-gradient(135deg,#C9952A,#E8C57A,#C4622D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>Hkayet Soura</div>
        <p style={{fontSize:15,color:"color-mix(in srgb, var(--text) 60%, transparent)",lineHeight:1.8,margin:"0 auto 40px",maxWidth:420}}>A storytelling card game of imagination, intuition, and shared memory.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"center",marginBottom:32}}>
          
          <button style={{...S.btnP,padding:"16px 48px",fontSize:17,borderRadius:8}} onClick={()=>go(SCREENS.LOBBY)}>Play Now</button>
          <button style={{...S.btnO,padding:"14px 20px",fontSize:14}} onClick={()=>setShowFaq(true)}>FAQ</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:S.t.textMuted}}>Appearance</div>
          <div style={{display:"flex",gap:0,background:S.t.surface,border:`1px solid ${S.t.border}`,borderRadius:30,padding:4}}>
            {["dark","light"].map(mode=>(
              <button key={mode} onClick={()=>setThemeName(mode)} style={{padding:"8px 24px",borderRadius:26,border:"none",cursor:"pointer",background:themeName===mode?S.t.gold:"transparent",color:themeName===mode?S.t.bg:S.t.textMuted,fontWeight:themeName===mode?700:400,fontSize:13,fontFamily:"inherit",transition:"all 0.2s"}}>
                {mode==="dark"?"🌙 Dark":"☀️ Bright"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ overlay */}
      {showFaq&&(
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(16px)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"24px 16px"}}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:560,width:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,position:"sticky",top:0,background:"var(--overlayDk)",padding:"8px 0",zIndex:1}}>
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"var(--gold)"}}>How to Play</div>
                <div style={{fontSize:11,color:"var(--textMuted)",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Hkayet Soura</div>
              </div>
              <button onClick={()=>setShowFaq(false)} style={{...S.btnO,padding:"8px 20px",fontSize:13,borderRadius:20}}>Close</button>
            </div>
            {FAQ.map(sec=>(
              <div key={sec.section} style={{marginBottom:28}}>
                <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"var(--gold)",marginBottom:12,paddingBottom:6,borderBottom:"1px solid color-mix(in srgb, var(--gold) 15%, transparent)"}}>{sec.section}</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {sec.items.map((item,i)=>(
                    <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px"}}>
                      <div style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:6}}>{item.q}</div>
                      <div style={{fontSize:13,color:"var(--textMuted)",lineHeight:1.6}}>{item.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button style={{...S.btnP,padding:"14px",fontSize:15,borderRadius:10,marginTop:8,marginBottom:24}} onClick={()=>{setShowFaq(false);go(SCREENS.LOBBY);}}>Got it — Let's Play</button>
          </div>
        </div>
      )}

      {/* Card fan */}
      <div style={{position:"relative",width:110,height:160,marginTop:60}}>
        {fan.map((c,i)=>(
          <div key={i} style={{position:"absolute",bottom:0,left:0,width:100,height:148,borderRadius:12,background:c.bg,border:"1px solid color-mix(in srgb, var(--gold) 20%, transparent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,zIndex:c.z,boxShadow:"0 16px 48px rgba(0,0,0,0.5)",transformOrigin:"50% 100%",transform:`rotate(${c.r}deg)`}}>{c.e}</div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════
// LOBBY
// ═════════════════════════════════════
function Lobby({ go, S, setRoomCode, setMyName, setIsHost }) {
  const urlRoom = new URLSearchParams(window.location.search).get("room")||"";
  const [tab, setTab]     = useState(urlRoom?"join":"create");
  const [name, setName]   = useState("");
  const [code, setCode]   = useState(urlRoom);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const inp = {width:"100%",padding:"12px 16px",borderRadius:8,background:"rgba(0,0,0,0.3)",border:"1px solid color-mix(in srgb, var(--gold) 20%, transparent)",color:S.t.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const lbl = {display:"block",fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"var(--textMuted)",marginBottom:8};

  const handleCreate = async () => {
    if(!name.trim()){setError("Please enter your name");return;}
    setLoading(true);setError("");
    const newCode = genCode();
    const {error:e1} = await supabase.from("rooms").insert({code:newCode,status:"waiting",storyteller_idx:0,phase:0,round:1});
    if(e1){setError("Could not create room. Try again.");setLoading(false);return;}
    await supabase.from("room_players").insert({room_code:newCode,name:name.trim(),score:0,is_active:true});
    setMyName(name.trim());setRoomCode(newCode);setIsHost(true);go(SCREENS.WAITING);setLoading(false);
  };

  const handleJoin = async () => {
    if(!name.trim()){setError("Please enter your name");return;}
    if(!code.trim()){setError("Please enter a room code");return;}
    setLoading(true);setError("");
    const upper = code.trim().toUpperCase();
    const {data:room} = await supabase.from("rooms").select("*").eq("code",upper).single();
    if(!room){setError("Room not found. Check the code and try again.");setLoading(false);return;}
    const {data:existing} = await supabase.from("room_players").select("*").eq("room_code",upper).eq("name",name.trim()).single();
    if(existing){
      // Rejoin: allowed even mid-game
      await supabase.from("room_players").update({is_active:true}).eq("id",existing.id);
    } else {
      // New player: only allowed if game hasn't started
      if(room.status==="playing"){setError("Game already in progress. You can only rejoin with your original name.");setLoading(false);return;}
      const {data:all} = await supabase.from("room_players").select("*").eq("room_code",upper);
      if(all&&all.length>=8){setError("Room is full (max 8 players).");setLoading(false);return;}
      await supabase.from("room_players").insert({room_code:upper,name:name.trim(),score:0,is_active:true});
    }
    setMyName(name.trim());setRoomCode(upper);setIsHost(false);
    if(room.status==="playing"){go(SCREENS.GAME);}else{go(SCREENS.WAITING);}
    setLoading(false);
  };

  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:460}}>
        <div style={{textAlign:"center",fontSize:12,letterSpacing:3,textTransform:"uppercase",color:"var(--gold)",marginBottom:28}}>Start a Game</div>
        <div style={{background:"var(--surface)",border:"1px solid color-mix(in srgb, var(--gold) 15%, transparent)",borderRadius:16,padding:32}}>
          <div style={{display:"flex",background:"var(--surface)",borderRadius:8,padding:4,marginBottom:28}}>
            {["create","join"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setError("");}} style={{flex:1,padding:"10px 8px",borderRadius:6,border:"none",cursor:"pointer",background:tab===t?"var(--gold)":"transparent",color:tab===t?"var(--bg)":"var(--textMuted)",fontWeight:tab===t?700:500,fontSize:13,fontFamily:"inherit"}}>
                {t==="create"?"Create Room":"Join Room"}
              </button>
            ))}
          </div>
          {tab==="create"?(
            <>
              <div style={{marginBottom:24}}><label style={lbl}>Your Name</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCreate()}/></div>
              <div style={{fontSize:11,color:"var(--textMuted)",textAlign:"center",marginBottom:20,lineHeight:1.6}}>Share the room code with friends. Maximum 8 players. Game starts when you hit Start.</div>
              {error&&<div style={{fontSize:12,color:"#C4622D",textAlign:"center",marginBottom:12}}>{error}</div>}
              <button style={{...S.btnP,width:"100%",padding:14,fontSize:15,opacity:loading?0.6:1}} onClick={handleCreate} disabled={loading}>{loading?"Creating...":"Create Room"}</button>
            </>
          ):(
            <>
              <div style={{marginBottom:18}}><label style={lbl}>Your Name</label><input style={inp} value={name} onChange={e=>setName(e.target.value)}/></div>
              <div style={{marginBottom:24}}><label style={lbl}>Room Code</label><input style={{...inp,textAlign:"center",fontSize:24,letterSpacing:8,fontWeight:700,textTransform:"uppercase"}} value={code} onChange={e=>setCode(e.target.value)} placeholder="ABCD" maxLength={6}/></div>
              <div style={{fontSize:11,color:"var(--textMuted)",textAlign:"center",marginBottom:16,lineHeight:1.6}}>Left a game by mistake? Use your same name and room code to rejoin.</div>
              {error&&<div style={{fontSize:12,color:"#C4622D",textAlign:"center",marginBottom:12}}>{error}</div>}
              <button style={{...S.btnP,width:"100%",padding:14,fontSize:15,opacity:loading?0.6:1}} onClick={handleJoin} disabled={loading}>{loading?"Joining...":"Join Room"}</button>
            </>
          )}
        </div>
        <button style={{...S.btnG,marginTop:16,fontSize:13,border:"none",color:"var(--textMuted)"}} onClick={()=>go(SCREENS.LANDING)}>Back</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════
// WAITING ROOM
// ═════════════════════════════════════
function Waiting({ go, S, roomCode, myName, isHost }) {
  const [players, setPlayers]     = useState([]);
  const [copied, setCopied]       = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const load = async () => {
    const {data} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
    if(data) setPlayers(data);
  };

  useEffect(()=>{
    if(!roomCode) return;
    load();
    const ch = supabase.channel(`wait:${roomCode}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:`room_code=eq.${roomCode}`},load)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"rooms",filter:`code=eq.${roomCode}`},(payload)=>{
        if(payload.new.status==="playing") go(SCREENS.GAME);
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[roomCode]);

  const handleStart = async () => {
    if(players.length<3) return;
    await supabase.from("rooms").update({status:"playing"}).eq("code",roomCode);
    go(SCREENS.GAME);
  };

  const slots = [...players,...Array(Math.max(0,4-players.length)).fill(null)];

  return (
    <div style={{flex:1,padding:"40px 20px"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"var(--textMuted)",marginBottom:14}}>Invite Friends</div>

          {/* Big room code — tap to copy */}
          <div
            onClick={()=>{ copyText(roomCode).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500); }); }}
            style={{display:"inline-flex",alignItems:"center",gap:16,background:copied?"color-mix(in srgb, #3A5E2A 30%, transparent)":"color-mix(in srgb, var(--gold) 8%, transparent)",border:copied?"2px solid #3A5E2A":"2px solid color-mix(in srgb, var(--gold) 40%, transparent)",borderRadius:16,padding:"18px 32px",cursor:"pointer",marginBottom:16,transition:"all 0.2s",userSelect:"none"}}
          >
            <div>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"var(--textMuted)",marginBottom:4}}>Room Code</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:52,color:"var(--gold)",letterSpacing:12,fontWeight:700,lineHeight:1}}>{roomCode}</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:48}}>
              <div style={{width:36,height:36,borderRadius:8,background:copied?"rgba(58,94,42,0.4)":"rgba(201,149,42,0.15)",border:`1px solid ${copied?"#3A5E2A":"rgba(201,149,42,0.4)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all 0.2s"}}>
                {copied ? "✓" : "⎘"}
              </div>
              <div style={{fontSize:10,letterSpacing:1,textTransform:"uppercase",color:copied?"#7AC87A":"var(--textMuted)",transition:"all 0.2s"}}>{copied?"Copied!":"Copy"}</div>
            </div>
          </div>

          {/* Copy invite link button */}
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button
              onClick={()=>{
                const url = window.location.origin+"?room="+roomCode;
                copyText(url).then(()=>{ setCopiedLink(true); setTimeout(()=>setCopiedLink(false),2500); });
              }}
              style={{...S.btnO,fontSize:13,padding:"11px 24px",display:"flex",alignItems:"center",gap:8,borderRadius:10,background:copiedLink?"color-mix(in srgb, #3A5E2A 20%, transparent)":"transparent",border:copiedLink?"1px solid #3A5E2A":`1px solid ${S.t.gold}80`,color:copiedLink?"#7AC87A":"var(--gold)",transition:"all 0.2s"}}
            >
              <span>{copiedLink?"✓ Link Copied!":"🔗 Copy Invite Link"}</span>
            </button>
          </div>
          <div style={{fontSize:11,color:"var(--textMuted)",marginTop:10}}>
            Share the code or the link — friends can join instantly
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:32}}>
          {slots.map((p,i)=>(
            <div key={i} style={{background:p?(p.name===myName?"var(--surfaceHi)":"var(--surface)"):"transparent",border:p?(p.name===myName?"1px solid #C9952A":"1px solid color-mix(in srgb, var(--gold) 25%, transparent)"):"1px dashed color-mix(in srgb, var(--textMuted) 20%, transparent)",borderRadius:12,padding:"16px 10px",textAlign:"center"}}>
              <div style={{width:40,height:40,borderRadius:"50%",margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:p?16:20,background:p?"color-mix(in srgb, var(--gold) 15%, transparent)":"color-mix(in srgb, var(--textMuted) 8%, transparent)",color:p?"var(--text)":"var(--textMuted)",fontWeight:700}}>{p?p.name[0]:"+"}</div>
              <div style={{fontSize:12,fontWeight:p?500:400,color:p?"var(--text)":"var(--textMuted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p?p.name:"Waiting..."}</div>
              {p?.name===myName&&<div style={{fontSize:9,color:"var(--gold)",letterSpacing:1,textTransform:"uppercase",marginTop:3}}>You</div>}
            </div>
          ))}
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--textMuted)",marginBottom:20}}>{players.length} player{players.length!==1?"s":""} joined · Need at least 3 to start</div>
          {isHost ? (
            <button style={{...S.btnP,padding:"14px 40px",fontSize:15,opacity:players.length<3?0.4:1}} onClick={handleStart} disabled={players.length<3}>Start Game</button>
          ) : (
            <div style={{fontSize:13,color:"var(--textMuted)",padding:"14px 40px",background:"var(--surface)",borderRadius:10,display:"inline-block"}}>Waiting for the host to start...</div>
          )}
        </div>
        <div style={{textAlign:"center",marginTop:16}}>
          <button style={{...S.btnG,border:"none",color:"var(--textMuted)",fontSize:13}} onClick={()=>go(SCREENS.LOBBY)}>Back</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════
// GAME
// ═════════════════════════════════════
function Game({ go, S, roomCode, myName }) {
  const [phase, setPhase]               = useState(0);
  const [gameTab, setGameTab]           = useState("hand");
  const [clueText, setClueText]         = useState("");
  const [confirmedClue, setConfirmedClue] = useState("");
  const [selHand, setSelHand]           = useState(0);
  const [focusedHand, setFocusedHand]   = useState(null);
  const [focusedBoard, setFocusedBoard] = useState(0);
  const [boardOverlay, setBoardOverlay] = useState(null);
  const [votedFor, setVotedFor]         = useState(null); // stores card_id string
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [confirmExit, setConfirmExit]   = useState(false);
  const [showScores, setShowScores]     = useState(false);
  const [fullscreen, setFullscreen]     = useState(null);
  const [winner, setWinner]             = useState(null);
  const [roundDeltas, setRoundDeltas]   = useState(null);
  const [gameDisbanded, setGameDisbanded] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState({});
  const [players, setPlayers]           = useState([]);
  const [scores, setScores]             = useState([]);
  const [storytellerIdx, setStorytellerIdx] = useState(0);
  const [round, setRound]               = useState(1);
  const [handCards, setHandCards]       = useState([]);
  const [boardCards, setBoardCards]     = useState([]);
  const [submittedCardId, setSubmittedCardId] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [debugMsg, setDebugMsg]         = useState("");
  const [endRoundLoading, setEndRoundLoading] = useState(false);

  const PLAYER_LIST  = players.map(p=>p.name);
  // WIN_TARGET: use loaded player count; fall back to 30 (safe) before players load
  const WIN_TARGET   = PLAYER_LIST.length===0 ? 30 : PLAYER_LIST.length<=6 ? 30 : 42;
  const STORYTELLER  = PLAYER_LIST[storytellerIdx%Math.max(PLAYER_LIST.length,1)]||"";
  const isStoryteller = myName===STORYTELLER;
  const gameRound    = Math.floor(storytellerIdx/Math.max(PLAYER_LIST.length,1))+1;
  const turnInCycle  = (storytellerIdx%Math.max(PLAYER_LIST.length,1))+1;
  const nextStoryteller = PLAYER_LIST[(storytellerIdx+1)%Math.max(PLAYER_LIST.length,1)]||"";
  const phaseLabels  = ["Clue","Submit","Vote","Reveal"];

  const deckRef = useRef([]);
  const roundRef = useRef(1); // tracks current round without closure staleness
  const boardOrderRef = useRef({}); // { [round]: [card_id, ...] } — stable shuffle per round

  // ── Hand dealing (server-authoritative) ───────────────────────
  // hands stored in rooms.dealt_hands as JSON: { playerName: [cardId,...] }
  // used_cards stored in rooms.used_cards as JSON: [cardId,...]
  const loadOrDealHand = async (fullDeck, playerList, currentRound, room) => {
    // Parse existing dealt hands from room
    let dealtHands = {};
    let usedCards = [];
    try { dealtHands = JSON.parse(room?.dealt_hands||"{}"); } catch(e){}
    try { usedCards  = JSON.parse(room?.used_cards||"[]");  } catch(e){}

    // If I already have a hand dealt, just restore it
    if (dealtHands[myName] && dealtHands[myName].length > 0) {
      const myCardIds = dealtHands[myName];
      const cardMap = {};
      fullDeck.forEach(c => { cardMap[c.id] = c; });
      const hand = myCardIds.map(id => cardMap[id]).filter(Boolean);
      if (hand.length > 0) { setHandCards(hand); return; }
    }

    // Only the first-joined player (by created_at) does the deal to avoid race conditions
    const sortedByJoin = [...playerList].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
    const isDealer = sortedByJoin[0]?.name === myName;
    if (!isDealer) {
      // Retry up to 4 times (waiting for dealer to write hands)
      for (let attempt = 0; attempt < 4; attempt++) {
        await new Promise(r => setTimeout(r, 1500 + attempt * 1000));
        const {data:freshRoom2} = await supabase.from("rooms").select("dealt_hands,used_cards").eq("code",roomCode).single();
        let freshHands = {};
        try { freshHands = JSON.parse(freshRoom2?.dealt_hands||"{}"); } catch(e){}
        if (freshHands[myName]?.length > 0) {
          const cardMap = {};
          fullDeck.forEach(c => { cardMap[c.id] = c; });
          const hand = freshHands[myName].map(id => cardMap[id]).filter(Boolean);
          if (hand.length > 0) { setHandCards(hand); return; }
        }
      }
      // If still no hand after retries, fall through and deal as if dealer
      // Refresh usedCards from the latest DB state before dealing
      try {
        const {data:latestRoom} = await supabase.from("rooms").select("used_cards").eq("code",roomCode).single();
        usedCards = JSON.parse(latestRoom?.used_cards||"[]");
      } catch(e){}
    }

    // Deal fresh hands for all players
    // Cards already played in previous rounds cannot be reused unless deck is exhausted
    const allPlayedIds = new Set(usedCards);
    let available = fullDeck.filter(c => !allPlayedIds.has(c.id));
    // If not enough cards, reset used pool (deck exhausted)
    const needed = playerList.length * 6;
    if (available.length < needed) available = [...fullDeck];
    const shuffled = shuffle(available);

    const newHands = {};
    playerList.forEach((p, i) => {
      newHands[p.name] = shuffled.slice(i * 6, i * 6 + 6).map(c => c.id);
    });

    // Save dealt hands to room
    await supabase.from("rooms").update({
      dealt_hands: JSON.stringify(newHands),
    }).eq("code", roomCode);

    // Set my hand
    const cardMap = {};
    fullDeck.forEach(c => { cardMap[c.id] = c; });
    const myCardIds = newHands[myName] || [];
    const hand = myCardIds.map(id => cardMap[id]).filter(Boolean);
    setHandCards(hand);
  };

  const loadBoard = async (currentRound) => {
    const r = currentRound||round;
    const {data:plays} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",r);
    if(!plays||plays.length===0){setBoardCards([]);return;}
    const {data:vs}   = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",r);
    // Single rooms query for both storyteller_idx and phase (avoids race between two queries)
    const {data:room} = await supabase.from("rooms").select("storyteller_idx,phase").eq("code",roomCode).single();
    const {data:ps}   = await supabase.from("room_players").select("name,id,created_at").eq("room_code",roomCode).eq("is_active",true);
    // Sort players by join time (created_at) to get stable insertion-order list
    const sortedPs = ps ? [...ps].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0)) : [];
    const stIdx = room?.storyteller_idx||0;
    const stName = sortedPs[stIdx%Math.max(sortedPs.length,1)]?.name||"";
    const currentPhase = room?.phase ?? 0;
    // Fetch full card data from Supabase for each card_id on the board
    const cardIds = plays.map(p=>p.card_id);
    const {data:cardData} = await supabase.from("cards").select("*").in("id",cardIds);
    const BG_POOL2 = [
      "linear-gradient(145deg,#2A1A0A,#7A4010)","linear-gradient(145deg,#1E2D1E,#3A5E2A)",
      "linear-gradient(145deg,#0D1F2D,#1A4060)","linear-gradient(145deg,#2A2A1A,#6A6A20)",
      "linear-gradient(145deg,#1A1A2D,#3A3A6B)","linear-gradient(145deg,#2D1A2D,#6B2060)",
    ];
    const cardMap = {};
    if(cardData) cardData.forEach((c,i)=>{ cardMap[c.id]={ ...c, bg: c.bg||BG_POOL2[i%BG_POOL2.length], emoji: c.emoji||"🎴" }; });
    FALLBACK_DECK.forEach(c=>{ if(!cardMap[c.id]) cardMap[c.id]=c; });
    const cards = plays.map(play=>{
      const cd = cardMap[play.card_id] || FALLBACK_DECK[0];
      // Only expose isStoryteller flag in reveal phase (3)
      const isStCard = play.player_name===stName;
      return {
        ...cd,
        owner: currentPhase>=3 ? play.player_name : "?",
        isStoryteller: currentPhase>=3 ? isStCard : false,
        isMyCard: play.player_name === myName, // safe: only used client-side to block own vote
        votes: vs ? vs.filter(v=>v.voted_card_id===play.card_id).map(v=>v.voter_name) : [],
      };
    });
    // Use a stable shuffle order per round — don't re-shuffle on every update
    const roundKey = r;
    if(!boardOrderRef.current[roundKey]) {
      // First time we see cards for this round — shuffle and lock in the order
      boardOrderRef.current[roundKey] = shuffle(cards).map(c=>c.id);
    }
    const order = boardOrderRef.current[roundKey];
    // Sort cards according to the locked order; new cards (not yet in order) go at end
    const cardById = {};
    cards.forEach(c=>{ cardById[c.id]=c; });
    const ordered = [
      ...order.map(id=>cardById[id]).filter(Boolean),
      ...cards.filter(c=>!order.includes(c.id)),
    ];
    // Update order ref to include any new cards
    boardOrderRef.current[roundKey] = ordered.map(c=>c.id);
    setBoardCards(ordered);
  };

  useEffect(()=>{
    if(!roomCode) return;
    const init = async ()=>{
      const {data:ps} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
      if(ps){ const sorted=[...ps].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0)); setPlayers(sorted);setScores(sorted.map(p=>({name:p.name,score:p.score}))); }
      const {data:room} = await supabase.from("rooms").select("*").eq("code",roomCode).single();
      if(room){
        setPhase(room.phase);setRound(room.round);roundRef.current=room.round;setStorytellerIdx(room.storyteller_idx);
        if(room.clue) setConfirmedClue(room.clue);
        setGameTab(room.phase>=2?"board":"hand");
      }
      const {data:cards} = await supabase.from("cards").select("*").eq("active",true);
      const BG_POOL = [
        "linear-gradient(145deg,#2A1A0A,#7A4010)","linear-gradient(145deg,#1E2D1E,#3A5E2A)",
        "linear-gradient(145deg,#0D1F2D,#1A4060)","linear-gradient(145deg,#2A2A1A,#6A6A20)",
        "linear-gradient(145deg,#1A1A2D,#3A3A6B)","linear-gradient(145deg,#2D1A2D,#6B2060)",
        "linear-gradient(145deg,#3D2B1F,#7A4A30)","linear-gradient(145deg,#1A2010,#4A6020)",
      ];
      const realCards = cards ? cards.map((c,i)=>({...c,bg:c.bg||BG_POOL[i%BG_POOL.length],emoji:c.emoji||"🎴"})) : [];
      const fullDeck = realCards.length>0 ? realCards : FALLBACK_DECK;
      deckRef.current = fullDeck;

      // Load dealt hands from DB (server-authoritative)
      const myHand = await loadOrDealHand(fullDeck, ps||[], room?.round||1, room);
      await loadBoard(room?.round||1);
      const {data:myPlay} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",room?.round||1).eq("player_name",myName).single();
      if(myPlay) setSubmittedCardId(myPlay.card_id);
      const {data:myVote} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",room?.round||1).eq("voter_name",myName).single();
      if(myVote){setVoteConfirmed(true);setVotedFor(myVote.voted_card_id);}
      if(room?.round_deltas && room.round_deltas!=="null"){
        try { const d=JSON.parse(room.round_deltas); if(d&&typeof d==="object") setRoundDeltas(d); } catch(e){}
      }
      setDebugMsg(fullDeck.length + " cards loaded from " + (realCards.length>0?"Supabase":"fallback deck"));
      setLoading(false);
      setTimeout(()=>setDebugMsg(""), 3000); // clear after load
    };
    init();

    // Presence tracking
    const presenceCh = supabase.channel(`presence:${roomCode}`, {config:{presence:{key:myName}}});
    presenceCh
      .on("presence",{event:"sync"},()=>{
        const state = presenceCh.presenceState();
        const online = {};
        Object.keys(state).forEach(key=>{ online[key]=true; });
        setOnlinePlayers(online);
      })
      .subscribe(async(status)=>{
        if(status==="SUBSCRIBED") await presenceCh.track({name:myName, online_at:new Date().toISOString()});
      });

    const ch = supabase.channel(`game:${roomCode}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"rooms",filter:`code=eq.${roomCode}`},async(payload)=>{
        const r=payload.new;
        const isNewRound = r.round !== roundRef.current;
        if(isNewRound) { roundRef.current = r.round; }
        setPhase(r.phase);setStorytellerIdx(r.storyteller_idx);
        if(isNewRound){setRound(r.round);setSubmittedCardId(null);setVoteConfirmed(false);setVotedFor(null);setRoundDeltas(null);setBoardCards([]);setFocusedBoard(0);boardOrderRef.current={};}
        if(r.clue) setConfirmedClue(r.clue); else setConfirmedClue("");
        // Show round summary overlay on all clients when round_deltas is set
        if(r.round_deltas && r.round_deltas!=="null" && !isNewRound){
          try { const d=JSON.parse(r.round_deltas); if(d&&typeof d==="object") setRoundDeltas(d); } catch(e){}
        }
        // Deterministic tab: board for voting/reveal, hand otherwise
        if(!r.round_deltas || r.round_deltas==="null") setGameTab(r.phase>=2?"board":"hand");
        await loadBoard(r.round);
        // New round: restore updated hand from dealt_hands (storyteller already replaced played cards)
        if(isNewRound && r.dealt_hands && r.dealt_hands!=="{}") {
          let newHands={};
          try { newHands=JSON.parse(r.dealt_hands); } catch(e){}
          if(newHands[myName]?.length>0){
            const cardMap={};
            deckRef.current.forEach(c=>{cardMap[c.id]=c;});
            const hand=newHands[myName].map(id=>cardMap[id]).filter(Boolean);
            if(hand.length>0) setHandCards(hand);
          }
          setSelHand(0);setClueText("");setConfirmedClue("");setGameTab("hand");
        }
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"card_plays",filter:`room_code=eq.${roomCode}`},async()=>{ const {data:rr}=await supabase.from("rooms").select("round").eq("code",roomCode).single(); loadBoard(rr?.round||roundRef.current); })
      .on("postgres_changes",{event:"*",schema:"public",table:"votes",filter:`room_code=eq.${roomCode}`},async()=>{ const {data:rr}=await supabase.from("rooms").select("round").eq("code",roomCode).single(); loadBoard(rr?.round||roundRef.current); })
      .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:`room_code=eq.${roomCode}`},async()=>{
        const {data:ps} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
        if(ps){ const sorted=[...ps].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0)); setPlayers(sorted);setScores(sorted.map(p=>({name:p.name,score:p.score})));if(ps.length<3)setGameDisbanded(true);else setGameDisbanded(false);}
      })
      .subscribe();
    return ()=>{ supabase.removeChannel(ch); supabase.removeChannel(presenceCh); };
  },[roomCode,myName]);

  // ── Actions ─────────────────────────────────────────────────
  const confirmClue = async ()=>{
    if(!clueText.trim()) return;
    const card = handCards[selHand];
    if(!card) return;
    play("clueGiven");
    setConfirmedClue(clueText.trim()); // set immediately before async to avoid flash
    await supabase.from("rooms").update({clue:clueText.trim(),phase:1}).eq("code",roomCode);
    const {data:existing} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",roundRef.current).eq("player_name",myName).single();
    if(!existing) await supabase.from("card_plays").insert({room_code:roomCode,round:roundRef.current,player_name:myName,card_id:card.id});
    setSubmittedCardId(card.id);
  };

  const submitCard = async ()=>{
    const card = handCards[selHand];
    if(!card||submittedCardId) return;
    play("cardSubmit");
    const {data:existing} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",roundRef.current).eq("player_name",myName).single();
    if(existing){setSubmittedCardId(existing.card_id);return;}
    await supabase.from("card_plays").insert({room_code:roomCode,round:roundRef.current,player_name:myName,card_id:card.id});
    setSubmittedCardId(card.id);
    const {data:plays} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",roundRef.current);
    // Always use fresh player count from DB
    const {data:freshPsCount} = await supabase.from("room_players").select("id").eq("room_code",roomCode).eq("is_active",true);
    const activeCount = freshPsCount?.length || 0;
    if(activeCount>0 && plays&&plays.length>=activeCount) await supabase.from("rooms").update({phase:2}).eq("code",roomCode);
  };

  const confirmVote = async ()=>{
    if(boardOverlay===null) return;
    const card = boardCards[boardOverlay];
    if(!card) return;
    // Storyteller cannot vote
    if(isStoryteller) return;
    // Block own card: use isMyCard flag (set in loadBoard from player_name) or card_id match
    if(card.isMyCard || card.id===submittedCardId) return;
    play("vote");
    const {data:existing} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",round).eq("voter_name",myName).single();
    if(existing) return;
    await supabase.from("votes").insert({room_code:roomCode,round,voter_name:myName,voted_card_id:card.id});
    setVotedFor(card.id); // store card_id, not index — index changes if board reshuffles
    setVoteConfirmed(true);setBoardOverlay(null);
    const {data:vs} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",roundRef.current);
    // Fetch fresh player list and storyteller from DB — don't use stale React state
    const {data:freshRoomVote} = await supabase.from("rooms").select("storyteller_idx").eq("code",roomCode).single();
    const {data:freshPsVote}   = await supabase.from("room_players").select("name,created_at").eq("room_code",roomCode).eq("is_active",true);
    const sortedVotePs = freshPsVote ? [...freshPsVote].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0)) : [];
    const stIdxVote = freshRoomVote?.storyteller_idx||0;
    const stNameVote = sortedVotePs[stIdxVote%Math.max(sortedVotePs.length,1)]?.name||"";
    const nonSTVote = sortedVotePs.filter(p=>p.name!==stNameVote);
    if(vs&&vs.length>=nonSTVote.length){
      // Only advance if still in phase 2 — prevents race between simultaneous voters
      await supabase.from("rooms").update({phase:3}).eq("code",roomCode).eq("phase",2);
    }
  };

  const endRound = async ()=>{
    if(endRoundLoading) return; // prevent double-click
    setEndRoundLoading(true);
    play("reveal");
    try {
    // Fetch ALL fresh data from DB — never use stale React state for scoring
    const {data:freshPlays, error:e1} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",roundRef.current);
    const {data:freshVotes, error:e2} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",roundRef.current);
    const {data:freshRoom,  error:e3} = await supabase.from("rooms").select("storyteller_idx").eq("code",roomCode).single();
    const {data:freshPs,    error:e4} = await supabase.from("room_players").select("name,score,created_at").eq("room_code",roomCode).eq("is_active",true);
    if(e1||e2||e3||e4||!freshPlays||!freshRoom||!freshPs) { setEndRoundLoading(false); return; }
    // freshVotes can be empty array (valid: nobody voted yet or 0 votes) — treat null as []
    const votes = freshVotes || [];

    // Resolve storyteller from fresh sorted player list
    const sortedFreshPs = [...freshPs].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
    const stIdx2 = freshRoom.storyteller_idx||0;
    const stName2 = sortedFreshPs[stIdx2%Math.max(sortedFreshPs.length,1)]?.name||"";
    const freshPlayerNames = sortedFreshPs.map(p=>p.name);
    const freshNonST = freshPlayerNames.filter(n=>n!==stName2);

    // Find storyteller card and who voted for it
    const stPlay = freshPlays.find(p=>p.player_name===stName2);
    const correctVoters = stPlay
      ? votes.filter(v=>v.voted_card_id===stPlay.card_id).map(v=>v.voter_name)
      : [];

    // Score calculation (Dixit rules)
    const allOrNone = correctVoters.length===0 || correctVoters.length===freshNonST.length;
    const deltas={};
    freshPlayerNames.forEach(p=>{ deltas[p]=0; });

    if(!allOrNone){
      // Some but not all guessed: storyteller +3, correct guessers +3
      deltas[stName2]=(deltas[stName2]||0)+3;
      correctVoters.forEach(v=>{ deltas[v]=(deltas[v]||0)+3; });
    } else {
      // All or none guessed: non-storytellers each +2 (storyteller gets nothing)
      freshNonST.forEach(p=>{ deltas[p]=(deltas[p]||0)+2; });
    }
    // Bonus: +1 per vote on any non-storyteller card
    freshPlays.filter(p=>p.player_name!==stName2).forEach(p=>{
      const voteCount = votes.filter(v=>v.voted_card_id===p.card_id).length;
      if(voteCount>0) deltas[p.player_name]=(deltas[p.player_name]||0)+voteCount;
    });

    // Apply deltas to FRESH scores from DB (not stale React state)
    const newScores = freshPs.map(p=>({name:p.name, score:(p.score||0)+(deltas[p.name]||0)}));
    setRoundDeltas(deltas);
    setScores(newScores);

    // Write new scores to DB
    for(const s of newScores){
      await supabase.from("room_players").update({score:s.score}).eq("room_code",roomCode).eq("name",s.name);
    }

    // Broadcast round_deltas via rooms table so ALL clients show the summary overlay
    await supabase.from("rooms").update({round_deltas: JSON.stringify(deltas)}).eq("code",roomCode);

    const top = Math.max(...newScores.map(s=>s.score));
    if(top>=WIN_TARGET){
      play("score"); setTimeout(()=>play("score"),400);
      setWinner({names:newScores.filter(s=>s.score===top).map(w=>w.name),scores:newScores,topScore:top});
    }
    } catch(err){ console.error("endRound error:", err); }
    finally { setEndRoundLoading(false); }
  };

  const nextRound = async ()=>{
    play("newRound");
    const newIdx = storytellerIdx+1;
    const newRound = round+1;
    roundRef.current = newRound;
    boardOrderRef.current = {};
    setRoundDeltas(null);setSubmittedCardId(null);setVotedFor(null);setVoteConfirmed(false);setClueText("");setConfirmedClue("");setBoardCards([]);setSelHand(0);setFocusedBoard(0);setGameTab("hand");

    // Fetch played cards this round and current room state
    // Use roundRef.current (not stale React state) for the correct round number
    const currentRoundNum = roundRef.current - 1; // roundRef was already incremented above
    const {data:plays} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",currentRoundNum);
    const {data:currentRoom} = await supabase.from("rooms").select("used_cards,dealt_hands").eq("code",roomCode).single();
    let usedCards = [];
    let dealtHands = {};
    try { usedCards  = JSON.parse(currentRoom?.used_cards||"[]");  } catch(e){}
    try { dealtHands = JSON.parse(currentRoom?.dealt_hands||"{}"); } catch(e){}

    // Mark played cards as used
    if(plays) plays.forEach(p=>{ if(!usedCards.includes(p.card_id)) usedCards.push(p.card_id); });

    // Build set of all cards currently in any hand so we don't re-deal them
    const allHandCardIds = new Set();
    Object.values(dealtHands).forEach(ids => ids.forEach(id => allHandCardIds.add(id)));

    // Pick pool of replacement cards: not used and not currently in any hand
    const usedSet = new Set(usedCards);
    let available = deckRef.current.filter(c => !usedSet.has(c.id) && !allHandCardIds.has(c.id));
    // If pool is too small, fall back to just not-in-hand
    if (available.length < (plays?.length||0)) available = deckRef.current.filter(c => !allHandCardIds.has(c.id));
    // Last resort: use full deck
    if (available.length < (plays?.length||0)) available = [...deckRef.current];
    const replacements = shuffle(available);
    let replIdx = 0;

    // For each player, replace only the card they played with a new one
    const newDealtHands = {...dealtHands};
    const {data:ps} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
    // Sort consistently by created_at so player order is stable across all clients
    const sortedPsNext = ps ? [...ps].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0)) : [];
    sortedPsNext.forEach(p => {
      const playedCard = plays?.find(pl=>pl.player_name===p.name);
      if (!playedCard) return; // player didn't submit — keep hand as-is
      const currentHand = newDealtHands[p.name] || [];
      const playedIdx = currentHand.indexOf(playedCard.card_id);
      if (playedIdx === -1) {
        // Card not found in hand (edge case) — just append new card
        newDealtHands[p.name] = [...currentHand, replacements[replIdx++]?.id].filter(Boolean);
      } else {
        // Replace the played card with a new one in the same slot
        const newHand = [...currentHand];
        newHand[playedIdx] = replacements[replIdx++]?.id || currentHand[playedIdx];
        newDealtHands[p.name] = newHand;
      }
    });

    // Save updated hands and advance round (clear round_deltas)
    await supabase.from("rooms").update({
      phase:0, round:newRound, storyteller_idx:newIdx, clue:null,
      used_cards: JSON.stringify(usedCards),
      dealt_hands: JSON.stringify(newDealtHands),
      round_deltas: null,
    }).eq("code",roomCode);

    // Restore my hand immediately from new dealt_hands
    const cardMap = {};
    deckRef.current.forEach(c => { cardMap[c.id] = c; });
    const myNewIds = newDealtHands[myName] || [];
    const myNewHand = myNewIds.map(id => cardMap[id]).filter(Boolean);
    if (myNewHand.length > 0) setHandCards(myNewHand);
  };

  const handleExit = async ()=>{
    await supabase.from("room_players").update({is_active:false}).eq("room_code",roomCode).eq("name",myName);
    go(SCREENS.LOBBY);
  };

  const activeBoardCard = boardCards[focusedBoard];

  if(loading) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:32}}>🎴</div>
      <div style={{fontSize:14,color:"var(--textMuted)",letterSpacing:2,textTransform:"uppercase"}}>Loading game...</div>
      {debugMsg&&<div style={{fontSize:11,color:"var(--textMuted)",maxWidth:300,textAlign:"center"}}>{debugMsg}</div>}
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative"}}>

      {/* HEADER */}
      <div style={{background:"var(--headerBg)",borderBottom:"1px solid color-mix(in srgb, var(--gold) 12%, transparent)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",gap:8}}>
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{display:"flex",alignItems:"baseline",gap:5}}>
              <span style={{fontSize:10,color:"var(--textMuted)",letterSpacing:1,textTransform:"uppercase"}}>Game</span>
              <span style={{fontSize:17,fontWeight:700,fontFamily:"Georgia,serif",color:"var(--text)",lineHeight:1}}>{gameRound}</span>
              <span style={{fontSize:10,color:"var(--textMuted)"}}>· turn {turnInCycle}/{PLAYER_LIST.length}</span>
            </div>
            <div style={{fontSize:9,color:"var(--textMuted)"}}>first to {WIN_TARGET} pts</div>
          </div>
          <button onClick={()=>setShowScores(v=>!v)} style={{...S.btnO,fontSize:10,padding:"4px 14px",borderRadius:20}}>
            {showScores?"Hide ▲":"Scores ▼"}
          </button>
          <div style={{display:"flex",gap:6,flexShrink:0,position:"relative",zIndex:10,alignItems:"center"}}>
            <SoundToggle/>
            {!confirmExit
              ?<button style={{...S.btnG,fontSize:10,padding:"8px 14px",minWidth:44,minHeight:36}} onClick={()=>setConfirmExit(true)}>Exit</button>
              :<div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:"var(--textMuted)"}}>Sure?</span>
                <button style={{...S.btnP,fontSize:11,padding:"8px 14px",minWidth:44,minHeight:36,background:"#C4622D"}} onClick={handleExit}>Yes, Exit</button>
                <button style={{...S.btnG,fontSize:11,padding:"8px 14px",minWidth:44,minHeight:36}} onClick={()=>setConfirmExit(false)}>Cancel</button>
              </div>
            }
          </div>
        </div>
        {showScores&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"4px 12px 10px",borderTop:"1px solid color-mix(in srgb, var(--gold) 8%, transparent)"}}>
            {scores.map(s=>{
              const isST=s.name===STORYTELLER;
              const delta=roundDeltas?roundDeltas[s.name]:null;
              return(
                <div key={s.name} style={{textAlign:"center",minWidth:36,padding:"2px 6px",borderRadius:6,background:isST?"color-mix(in srgb, var(--gold) 12%, transparent)":"transparent",border:isST?"1px solid color-mix(in srgb, var(--gold) 35%, transparent)":"1px solid transparent",position:"relative"}}>
                  <div style={{fontSize:8,letterSpacing:1,textTransform:"uppercase",color:isST?"var(--gold)":"var(--textMuted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:52}}>{s.name}</div>
                  <div style={{fontSize:16,fontWeight:700,color:isST?"var(--gold)":"var(--text)",fontFamily:"Georgia,serif",lineHeight:1.2}}>{s.score}</div>
                  {delta>0&&<div style={{position:"absolute",top:-6,right:-6,fontSize:9,fontWeight:700,color:"#7AC87A",background:"rgba(40,80,40,0.9)",borderRadius:8,padding:"1px 4px"}}>+{delta}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PHASE TABS */}
      <div style={{display:"flex",flexShrink:0,borderBottom:"1px solid rgba(201,149,42,0.08)"}}>
        {phaseLabels.map((label,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"10px 4px",background:i===phase?"var(--gold)":i<phase?"color-mix(in srgb, var(--gold) 7%, transparent)":"var(--phaseBg)",color:i===phase?"var(--bg)":i<phase?"color-mix(in srgb, var(--gold) 40%, transparent)":"var(--textMuted)",fontSize:11,fontWeight:i===phase?700:400,letterSpacing:1,textTransform:"uppercase",borderRight:i<3?"1px solid rgba(201,149,42,0.1)":"none",transition:"all 0.35s"}}>
            <span style={{fontSize:8,marginRight:4,opacity:0.6}}>{i+1}</span>{label}
            {i<phase&&<span style={{marginLeft:4,fontSize:9}}>✓</span>}
          </div>
        ))}
      </div>

      {/* CLUE STRIP */}
      {phase>=1&&(
        <div style={{textAlign:"center",padding:"9px 20px",borderBottom:"1px solid rgba(201,149,42,0.06)",background:"rgba(201,149,42,0.04)",flexShrink:0}}>
          <span style={{fontSize:10,letterSpacing:2,color:"var(--gold)",textTransform:"uppercase",marginRight:10}}>{STORYTELLER} — Clue:</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:"clamp(14px,2.5vw,20px)",fontStyle:"italic"}}>"{confirmedClue}"</span>
        </div>
      )}

      {/* GAME TABS */}
      <div style={{display:"flex",flexShrink:0}}>
        {["hand","board"].map(tab=>(
          <button key={tab} onClick={()=>setGameTab(tab)} style={{flex:1,padding:"10px 0",background:gameTab===tab?"var(--surfaceHi)":"transparent",borderTop:"none",borderLeft:"none",borderRight:"none",borderBottom:gameTab===tab?"2px solid var(--gold)":"2px solid transparent",color:gameTab===tab?"var(--gold)":"var(--textMuted)",fontSize:12,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>{tab}</button>
        ))}
      </div>

      {/* HAND TAB */}
      {gameTab==="hand"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto",padding:"20px 16px",gap:20}}>
          {phase===0&&isStoryteller&&<div style={{textAlign:"center",padding:"14px 20px",background:"color-mix(in srgb, var(--gold) 8%, transparent)",border:"1px solid color-mix(in srgb, var(--gold) 25%, transparent)",borderRadius:12,fontSize:13,color:"var(--text)",lineHeight:1.6}}>You are the Storyteller. Pick a card and give a clue that is not too obvious and not too cryptic.</div>}
          {phase===0&&!isStoryteller&&<div style={{textAlign:"center",padding:"14px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,fontSize:13,color:"var(--textMuted)",lineHeight:1.6}}>Waiting for <span style={{color:"var(--gold)",fontWeight:600}}>{STORYTELLER}</span> to give a clue...</div>}
          {phase===1&&!isStoryteller&&!submittedCardId&&<div style={{textAlign:"center",padding:"14px 20px",background:"color-mix(in srgb, var(--gold) 8%, transparent)",border:"1px solid color-mix(in srgb, var(--gold) 25%, transparent)",borderRadius:12,fontSize:13,color:"var(--text)"}}>Pick the card that best matches: <span style={{fontStyle:"italic",color:"var(--gold)"}}>"{confirmedClue}"</span></div>}
          {phase===1&&submittedCardId&&<div style={{textAlign:"center",padding:"14px",background:"var(--surface)",borderRadius:12,fontSize:13,color:"var(--textMuted)"}}>Card submitted ✓ — waiting for other players...</div>}
          {phase===1&&isStoryteller&&<div style={{textAlign:"center",padding:"14px",background:"var(--surface)",borderRadius:12,fontSize:13,color:"var(--textMuted)"}}>Waiting for others to submit their cards...</div>}

          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div onClick={()=>{if(phase===0&&isStoryteller)setFocusedHand(selHand);else setFullscreen({type:"hand",idx:selHand});}} style={{cursor:"pointer",position:"relative"}}>
              <CardFace card={handCards[selHand]} size="large" label={phase===0&&isStoryteller?"Tap to give a clue":"Tap to expand"} />
            </div>
            <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 0",maxWidth:"100%"}}>
              {handCards.map((c,i)=>(
                <div key={i} onClick={()=>{play("cardPick");setSelHand(i);if(phase===0&&isStoryteller)setFocusedHand(i);else setFullscreen({type:"hand",idx:i});}} style={{cursor:"pointer",flexShrink:0,transform:selHand===i?"translateY(-4px)":"none",transition:"transform 0.2s",outline:selHand===i?"2px solid #C9952A":"none",borderRadius:8,boxShadow:selHand===i?"0 4px 18px rgba(201,149,42,0.35)":"none"}}>
                  <CardFace card={c} size="mini" />
                  <div style={{textAlign:"center",fontSize:9,color:selHand===i?"var(--gold)":"var(--textMuted)",fontWeight:700,marginTop:2}}>{i+1}</div>
                </div>
              ))}
            </div>
            {phase===1&&!isStoryteller&&!submittedCardId&&(
              <button style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={submitCard}>Submit Card #{selHand+1}</button>
            )}
          </div>
        </div>
      )}

      {/* BOARD TAB */}
      {gameTab==="board"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto",padding:"20px 16px",gap:20}}>
          {phase===1&&<div style={{textAlign:"center",padding:"14px",background:"var(--surface)",borderRadius:12,fontSize:13,color:"var(--textMuted)"}}>Waiting for all players to submit... ({boardCards.length}/{players.length})</div>}
          {phase===2&&isStoryteller&&<div style={{textAlign:"center",padding:"14px",background:"var(--surface)",borderRadius:12,fontSize:13,color:"var(--textMuted)"}}>Players are voting — you don't vote as Storyteller.</div>}
          {phase===2&&!isStoryteller&&!voteConfirmed&&<div style={{textAlign:"center",padding:"14px",background:"color-mix(in srgb, var(--gold) 8%, transparent)",border:"1px solid color-mix(in srgb, var(--gold) 25%, transparent)",borderRadius:12,fontSize:13,color:"var(--text)"}}>Vote for the card you think belongs to {STORYTELLER}.</div>}
          {phase===2&&!isStoryteller&&voteConfirmed&&<div style={{textAlign:"center",padding:"14px",background:"var(--surface)",borderRadius:12,fontSize:13,color:"var(--textMuted)"}}>Vote cast ✓ — waiting for everyone...</div>}
          {phase===3&&<div style={{textAlign:"center",padding:"14px",background:"color-mix(in srgb, var(--gold) 8%, transparent)",border:"1px solid color-mix(in srgb, var(--gold) 25%, transparent)",borderRadius:12,fontSize:13,color:"var(--text)"}}><span>Cards revealed! </span><span style={{color:"#C9952A",fontWeight:600}}>{STORYTELLER}</span><span>'s card is highlighted in gold.</span></div>}

          {boardCards.length===0?(
            <div style={{textAlign:"center",color:"var(--textMuted)",fontSize:13,marginTop:40}}>No cards on the board yet.</div>
          ):(
            <>
              {activeBoardCard&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                  <div onClick={()=>setFullscreen({type:"board",idx:focusedBoard})} style={{cursor:"pointer",position:"relative"}}>
                    {phase===1
                      ? <FaceDown size="large"/>
                      : <CardFace card={activeBoardCard} size="large"
                          highlight={activeBoardCard.isStoryteller&&phase===3}
                          voteCount={phase===3?activeBoardCard.votes?.length:0}
                        />
                    }
                  </div>

                  {phase===3&&(
                    <div style={{textAlign:"center",marginTop:6,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <span style={{
                        fontSize:14,fontWeight:700,
                        color:activeBoardCard.isStoryteller?"#C9952A":"var(--text)",
                        letterSpacing:activeBoardCard.isStoryteller?1:0,
                      }}>
                        {activeBoardCard.owner||"?"}{activeBoardCard.isStoryteller?" ★":""}
                      </span>
                      {activeBoardCard.votes?.length>0?(
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                          <span style={{fontSize:11,fontWeight:700,color:"#7AC87A"}}>{activeBoardCard.votes.length} vote{activeBoardCard.votes.length!==1?"s":""}</span>
                          <span style={{fontSize:11,color:"var(--textMuted)"}}>{activeBoardCard.votes.join(", ")}</span>
                        </div>
                      ):(
                        <span style={{fontSize:11,color:"var(--textMuted)"}}>No votes</span>
                      )}
                    </div>
                  )}
                  {phase===2&&!voteConfirmed&&(
                    isStoryteller
                      ? <div style={{fontSize:13,color:"var(--textMuted)",padding:"10px",textAlign:"center"}}>You're the Storyteller — you don't vote this round</div>
                      : (activeBoardCard.isMyCard||activeBoardCard.id===submittedCardId)
                        ? <div style={{fontSize:13,color:"var(--textMuted)",padding:"10px",textAlign:"center"}}>This is your card — you can't vote for it</div>
                        : <button style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={()=>setBoardOverlay(focusedBoard)}>Vote for this card</button>
                  )}
                  <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 0",maxWidth:"100%"}}>
                    {boardCards.map((c,i)=>(
                      <div key={i} onClick={()=>{setFocusedBoard(i);setFullscreen({type:"board",idx:i});}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",flexShrink:0}}>
                        <div style={{
                          transform:focusedBoard===i?"translateY(-4px)":"none",
                          transition:"transform 0.2s",
                          outline: c.isStoryteller&&phase===3
                            ? "3px solid #C9952A"
                            : focusedBoard===i ? "2px solid var(--gold)" : "none",
                          borderRadius:8,
                          boxShadow: c.isStoryteller&&phase===3 ? "0 0 14px rgba(201,149,42,0.6)" : "none",
                        }}>
                          {/* Face-down in phase 2 — all cards look the same */}
                          {phase===1 ? <FaceDown size="mini"/> : <CardFace card={c} size="mini" />}
                        </div>
                        {phase===3&&(
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,maxWidth:64}}>
                            <span style={{fontSize:9,fontWeight:600,color:c.isStoryteller?"#C9952A":"var(--textMuted)",textAlign:"center",maxWidth:64,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>
                              {c.owner||"?"}{c.isStoryteller?" ★":""}
                            </span>
                            {c.votes?.length>0?(
                              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                                <span style={{fontSize:9,fontWeight:700,color:"#7AC87A",background:"rgba(30,60,30,0.9)",borderRadius:6,padding:"1px 5px",display:"block",textAlign:"center"}}>
                                  {c.votes.length} vote{c.votes.length!==1?"s":""}
                                </span>
                                <span style={{fontSize:8,color:"var(--textMuted)",textAlign:"center",maxWidth:64,wordBreak:"break-all",lineHeight:1.3}}>
                                  {c.votes.join(", ")}
                                </span>
                              </div>
                            ):(
                              <span style={{fontSize:8,color:"var(--textMuted)",textAlign:"center"}}>no votes</span>
                            )}
                          </div>
                        )}
                        {votedFor===c.id&&phase!==3&&<span style={{fontSize:9,color:"#7AC87A",display:"block",textAlign:"center"}}>✓</span>}
                      </div>
                    ))}
                  </div>
                  {phase===3&&isStoryteller&&!roundDeltas&&(
                    <button style={{...S.btnP,padding:"14px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320,opacity:endRoundLoading?0.6:1,cursor:endRoundLoading?"wait":"pointer"}} onClick={endRound} disabled={endRoundLoading}>{endRoundLoading?"Calculating scores...":"End Round and See Scores"}</button>
                  )}
                  {phase===3&&!isStoryteller&&!roundDeltas&&(
                    <div style={{textAlign:"center",fontSize:12,color:"var(--textMuted)",padding:"10px"}}>Waiting for {STORYTELLER} to reveal the scores...</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VOTE CONFIRM OVERLAY */}
      {boardOverlay!==null&&!fullscreen&&(
        <div onClick={()=>setBoardOverlay(null)} style={{position:"fixed",inset:0,background:"var(--overlay)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:380,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
            <div style={{cursor:"pointer"}}>
              {phase===1 ? <FaceDown size="medium"/> : <CardFace card={boardCards[boardOverlay]} size="medium"/>}
            </div>
            {phase===2&&(
              isStoryteller
                ? <div style={{fontSize:13,color:"var(--textMuted)",textAlign:"center",padding:"10px"}}>You're the Storyteller — you don't vote this round</div>
                : (boardCards[boardOverlay]?.isMyCard||boardCards[boardOverlay]?.id===submittedCardId)
                  ? <div style={{fontSize:13,color:"#C4622D",textAlign:"center",padding:"10px"}}>This is your card — you can't vote for it</div>
                  : <button style={{...S.btnP,padding:"14px",fontSize:15,borderRadius:10,width:"100%"}} onClick={confirmVote}>Confirm Vote</button>
            )}
            <div style={{fontSize:11,color:"var(--textMuted)"}}>Tap outside to close</div>
          </div>
        </div>
      )}

      {/* CLUE INPUT OVERLAY */}
      {focusedHand!==null&&!fullscreen&&(
        <div onClick={()=>setFocusedHand(null)} style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:300,padding:"20px 24px",gap:18,overflowY:"auto"}}>
          <div onClick={e=>{e.stopPropagation();setFullscreen({type:"hand",idx:focusedHand});}} style={{cursor:"pointer"}}>
            <CardFace card={handCards[focusedHand]} size="medium" label="Tap to expand" />
          </div>
          {phase===0&&isStoryteller&&(
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"var(--gold)",textAlign:"center"}}>Give this card a clue</div>
              <input style={{width:"100%",padding:"13px 18px",borderRadius:10,background:"var(--inputBg)",border:"1px solid color-mix(in srgb, var(--gold) 35%, transparent)",color:"var(--text)",fontSize:18,fontFamily:"Georgia,serif",textAlign:"center",outline:"none",boxSizing:"border-box"}} placeholder="Type your clue..." value={clueText} onChange={e=>setClueText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&clueText.trim()){setSelHand(focusedHand);setFocusedHand(null);confirmClue();}}}/>
              <button onClick={e=>{e.stopPropagation();if(clueText.trim()){setSelHand(focusedHand);setFocusedHand(null);confirmClue();}}} style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10,opacity:clueText.trim()?1:0.45,cursor:clueText.trim()?"pointer":"default"}}>Confirm Clue</button>
            </div>
          )}
          <div style={{fontSize:11,color:"var(--textMuted)"}}>Tap outside to cancel</div>
        </div>
      )}

      {/* FULLSCREEN */}
      {fullscreen&&(
        <div onClick={()=>setFullscreen(null)} style={{position:"fixed",inset:0,background:"var(--fullBg)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,cursor:"pointer"}}>
          <div style={{position:"absolute",bottom:20,fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Tap anywhere to close</div>
          {fullscreen.type==="board"?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
              {phase===1 ? (
                <div style={{width:"min(68vw, calc(100vh * 0.714))",height:"min(calc(68vw * 1.4), 100vh)",borderRadius:24,overflow:"hidden",background:"linear-gradient(145deg,#1A1208,#2D2010)",border:"2px solid rgba(201,149,42,0.15)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 140px rgba(0,0,0,0.95)",zIndex:2,position:"relative"}}>
                  <div style={{position:"absolute",inset:0,opacity:0.1,backgroundImage:"repeating-linear-gradient(45deg,#C9952A 0px,#C9952A 1px,transparent 1px,transparent 14px),repeating-linear-gradient(-45deg,#C9952A 0px,#C9952A 1px,transparent 1px,transparent 14px)"}}/>
                  <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                    <div style={{fontSize:64,opacity:0.3}}>🎴</div>
                    <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"rgba(201,149,42,0.35)"}}>Hidden until reveal</div>
                  </div>
                </div>
              ) : (
                <div style={{width:"min(68vw, calc(100vh * 0.714))",height:"min(calc(68vw * 1.4), 100vh)",borderRadius:24,overflow:"hidden",background:boardCards[fullscreen.idx]?.bg,border:boardCards[fullscreen.idx]?.isStoryteller&&phase===3?"4px solid #C9952A":"2px solid rgba(201,149,42,0.2)",boxShadow:boardCards[fullscreen.idx]?.isStoryteller&&phase===3?"0 0 140px rgba(0,0,0,0.95),0 0 30px rgba(201,149,42,0.4)":"0 0 140px rgba(0,0,0,0.95)",zIndex:2,position:"relative"}}>
                  {boardCards[fullscreen.idx]?.image_url
                    ?<img src={boardCards[fullscreen.idx].image_url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<span style={{fontSize:"clamp(100px,22vw,220px)",lineHeight:1,position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}>{boardCards[fullscreen.idx]?.emoji}</span>
                  }
                </div>
              )}
              {phase===3&&boardCards[fullscreen.idx]&&(
                <div style={{textAlign:"center",marginTop:12,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{fontSize:18,fontWeight:700,color:boardCards[fullscreen.idx].isStoryteller?"#C9952A":"var(--text)",letterSpacing:boardCards[fullscreen.idx].isStoryteller?1:0}}>
                    {boardCards[fullscreen.idx].owner||"?"}{boardCards[fullscreen.idx].isStoryteller?" ★":""}
                  </div>
                  {boardCards[fullscreen.idx].votes?.length>0?(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#7AC87A"}}>{boardCards[fullscreen.idx].votes.length} vote{boardCards[fullscreen.idx].votes.length!==1?"s":""}</div>
                      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6,maxWidth:280}}>
                        {boardCards[fullscreen.idx].votes.map((voter,vi)=>(
                          <span key={vi} style={{fontSize:12,color:"var(--textMuted)",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:"3px 10px"}}>{voter}</span>
                        ))}
                      </div>
                    </div>
                  ):(
                    <div style={{fontSize:13,color:"var(--textMuted)"}}>No votes</div>
                  )}
                </div>
              )}
            </div>
          ):(
            <div style={{width:"min(68vw, calc(100vh * 0.714))",height:"min(calc(68vw * 1.4), 100vh)",borderRadius:24,overflow:"hidden",background:handCards[fullscreen.idx]?.bg,border:"2px solid rgba(201,149,42,0.2)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 140px rgba(0,0,0,0.95)",zIndex:2,position:"relative"}}>
              {handCards[fullscreen.idx]?.image_url
                ?<img src={handCards[fullscreen.idx].image_url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                :<span style={{fontSize:"clamp(100px,22vw,220px)",lineHeight:1}}>{handCards[fullscreen.idx]?.emoji}</span>
              }
            </div>
          )}
        </div>
      )}

      {/* ROUND SUMMARY */}
      {roundDeltas&&!winner&&(
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:24}}>
          <div style={{maxWidth:420,width:"100%",display:"flex",flexDirection:"column",gap:16}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"var(--gold)",textAlign:"center"}}>Round {round} Complete</div>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px",display:"flex",flexDirection:"column",gap:8}}>
              {[...scores].sort((a,b)=>b.score-a.score).map(s=>(
                <div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:14,color:s.name===STORYTELLER?"var(--gold)":"var(--text)",fontWeight:s.name===STORYTELLER?700:400}}>{s.name}{s.name===STORYTELLER?" ★":""}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {roundDeltas[s.name]>0&&<span style={{fontSize:12,color:"#7AC87A",fontWeight:700}}>+{roundDeltas[s.name]}</span>}
                    <span style={{fontSize:16,fontWeight:700,color:"var(--text)",fontFamily:"Georgia,serif",minWidth:28,textAlign:"right"}}>{s.score}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--textMuted)",textAlign:"center"}}>First to {WIN_TARGET} wins</div>
            <div style={{textAlign:"center",padding:"4px 0"}}>
              <span style={{fontSize:12,color:"var(--textMuted)"}}>Next storyteller: </span>
              <span style={{fontSize:13,color:"var(--gold)",fontWeight:600}}>{nextStoryteller}</span>
              {turnInCycle===PLAYER_LIST.length&&<div style={{fontSize:10,color:"var(--textMuted)",marginTop:3}}>Everyone has had a turn — Game Round {gameRound+1} begins</div>}
            </div>
            {isStoryteller?(
              <button style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10}} onClick={nextRound}>
                {turnInCycle===PLAYER_LIST.length?`Start Game Round ${gameRound+1}`:`Next Turn — ${nextStoryteller}'s go`}
              </button>
            ):(
              <div style={{textAlign:"center",fontSize:12,color:"var(--textMuted)"}}>Waiting for {STORYTELLER} to start the next turn...</div>
            )}
          </div>
        </div>
      )}

      {/* WINNER */}
      {winner&&(
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:450,padding:24}}>
          <div style={{maxWidth:420,width:"100%",display:"flex",flexDirection:"column",gap:20,alignItems:"center"}}>
            <div style={{fontSize:48}}>🏆</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:"var(--gold)",textAlign:"center"}}>{winner.names.join(" & ")} {winner.names.length>1?"win!":"wins!"}</div>
            <div style={{fontSize:14,color:"var(--textMuted)",textAlign:"center"}}>{winner.topScore} points · First to {WIN_TARGET}</div>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px",width:"100%",display:"flex",flexDirection:"column",gap:8}}>
              {[...winner.scores].sort((a,b)=>b.score-a.score).map((s,i)=>(
                <div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:14,color:i===0?"var(--gold)":"var(--text)",fontWeight:i===0?700:400}}>{i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{s.name}</span>
                  <span style={{fontSize:16,fontWeight:700,fontFamily:"Georgia,serif",color:i===0?"var(--gold)":"var(--text)"}}>{s.score}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:12,width:"100%"}}>
              <button style={{...S.btnO,flex:1,padding:"12px"}} onClick={()=>go(SCREENS.LOBBY)}>Lobby</button>
              <button style={{...S.btnP,flex:1,padding:"12px"}} onClick={async()=>{
                // Reset all local state first
                setWinner(null);
                roundRef.current = 1;
                boardOrderRef.current = {};
                setPhase(0);setRound(1);setStorytellerIdx(0);
                setConfirmedClue("");setClueText("");
                setHandCards([]);setBoardCards([]);
                setSubmittedCardId(null);setVoteConfirmed(false);setVotedFor(null);
                setRoundDeltas(null);setSelHand(0);setFocusedBoard(0);
                setGameTab("hand");
                const reset=players.map(p=>({...p,score:0}));
                setScores(reset.map(p=>({name:p.name,score:0})));
                for(const p of reset) await supabase.from("room_players").update({score:0}).eq("room_code",roomCode).eq("name",p.name);
                await supabase.from("rooms").update({phase:0,round:1,storyteller_idx:0,clue:null,dealt_hands:"{}",used_cards:"[]",round_deltas:null}).eq("code",roomCode);
              }}>Play Again</button>
            </div>
          </div>
        </div>
      )}

      {/* DISBANDED */}
      {gameDisbanded&&(
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:460,padding:24}}>
          <div style={{maxWidth:380,width:"100%",textAlign:"center",display:"flex",flexDirection:"column",gap:16,alignItems:"center"}}>
            <div style={{fontSize:40}}>😞</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:22,color:"var(--gold)"}}>Game Ended</div>
            <div style={{fontSize:13,color:"var(--textMuted)",lineHeight:1.6}}>Too many players left. The game needs at least 3 players to continue.</div>
            <button style={{...S.btnP,padding:"13px 32px",fontSize:15}} onClick={()=>go(SCREENS.LANDING)}>Back to Home</button>
          </div>
        </div>
      )}
      {/* CONNECTIVITY BAR */}
      <div style={{flexShrink:0,borderTop:"1px solid color-mix(in srgb, var(--gold) 8%, transparent)",background:"var(--headerBg)",padding:"6px 16px",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--textMuted)",marginRight:4}}>Players</span>
        {scores.map(p=>{
          const isOnline = onlinePlayers[p.name] || false;
          return (
            <div key={p.name} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:isOnline?"#4CAF50":"#C4622D",boxShadow:isOnline?"0 0 6px #4CAF5088":"none",flexShrink:0,transition:"all 0.5s"}}/>
              <span style={{fontSize:11,color:isOnline?"var(--text)":"var(--textMuted)",fontWeight:p.name===myName?600:400}}>{p.name}{p.name===myName?" (you)":""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════
// APP ROOT
// ═════════════════════════════════════
export default function App() {
  const [themeName, setThemeName] = useState("dark");
  const [isHost, setIsHost]       = useState(false);

  // Restore session from sessionStorage on refresh
  const savedCode   = sessionStorage.getItem("hk_room") || "";
  const savedName   = sessionStorage.getItem("hk_name") || "";
  const savedScreen = sessionStorage.getItem("hk_screen") || SCREENS.LANDING;

  const [screen, setScreen]   = useState(savedScreen);
  const [roomCode, setRoomCode] = useState(savedCode);
  const [myName, setMyName]     = useState(savedName);

  // Persist session state on every change
  const go = (s) => {
    setScreen(s);
    sessionStorage.setItem("hk_screen", s);
    // Clear session when going back to landing or lobby
    if(s===SCREENS.LANDING || s===SCREENS.LOBBY) {
      sessionStorage.removeItem("hk_room");
      sessionStorage.removeItem("hk_name");
      sessionStorage.removeItem("hk_screen");
    }
  };

  const setCode = (c) => { setRoomCode(c); sessionStorage.setItem("hk_room", c); };
  const setName = (n) => { setMyName(n);   sessionStorage.setItem("hk_name", n); };

  const S = makeS(THEMES[themeName]);
  return (
    <div style={{...S.root,"--bg":S.t.bg,"--surface":S.t.surface,"--surfaceHi":S.t.surfaceHi,"--border":S.t.border,"--borderHi":S.t.borderHi,"--text":S.t.text,"--textMuted":S.t.textMuted,"--gold":S.t.gold,"--overlay":S.t.overlay,"--overlayDk":S.t.overlayDk,"--fullBg":S.t.fullBg,"--inputBg":S.t.inputBg,"--phaseBg":S.t.phaseBg,"--headerBg":S.t.headerBg}}>
      {screen===SCREENS.LANDING&&<Landing  go={go} S={S} themeName={themeName} setThemeName={setThemeName}/>}
      {screen===SCREENS.LOBBY  &&<Lobby    go={go} S={S} setRoomCode={setCode} setMyName={setName} setIsHost={setIsHost}/>}
      {screen===SCREENS.WAITING&&<Waiting  go={go} S={S} roomCode={roomCode} myName={myName} isHost={isHost}/>}
      {screen===SCREENS.GAME   &&<Game     go={go} S={S} roomCode={roomCode} myName={myName}/>}
    </div>
  );
}
