import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "https://kdenyavpathupgzouvas.supabase.co";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_swXuHERnmpPafNqlCZwb4A_zBRnRjvK";
const sb = createClient(SUPA_URL, SUPA_KEY);

// ─────────────────────────────────────────────────────────────
// SOUND ENGINE
// ─────────────────────────────────────────────────────────────
let _audioCtx = null;
let _soundOn = true;
const ac = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};
const osc = (freq, type, gain, start, end) => {
  const ctx = ac(), o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + end);
};
const SOUNDS = {
  pick:   () => { const ctx = ac(), o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type="sine"; o.frequency.setValueAtTime(320,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(180,ctx.currentTime+0.08); g.gain.setValueAtTime(0.15,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12); o.start(); o.stop(ctx.currentTime+0.12); },
  submit: () => { [0,0.05].forEach((d,i) => osc(i?560:440,"sine",0.12,d,d+0.15)); },
  clue:   () => { [523,659,784].forEach((f,i) => osc(f,"triangle",0.1,i*0.1,i*0.1+0.5)); },
  vote:   () => { const ctx = ac(), o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type="sine"; o.frequency.setValueAtTime(600,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+0.1); g.gain.setValueAtTime(0.1,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15); o.start(); o.stop(ctx.currentTime+0.15); },
  reveal: () => { const ctx = ac(); const buf = ctx.createBuffer(1,ctx.sampleRate*0.4,ctx.sampleRate); const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*0.25; const s=ctx.createBufferSource(),g=ctx.createGain(); s.buffer=buf; s.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.35,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4); s.start(); [392,494,587].forEach((f,i) => osc(f,"triangle",0.08,0.1+i*0.05,0.9)); },
  score:  () => { [523,659,784,1047].forEach((f,i) => osc(f,"triangle",0.11,i*0.08,i*0.08+0.6)); },
  next:   () => { osc(880,"sine",0.08,0,0.5); },
};
const snd = (name) => { if (_soundOn && SOUNDS[name]) try { SOUNDS[name](); } catch(e) {} };

// ─────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────
const SCREENS = { LANDING: "landing", LOBBY: "lobby", WAITING: "waiting", GAME: "game" };

const BG = [
  "linear-gradient(145deg,#2A1A0A,#7A4010)",
  "linear-gradient(145deg,#1E2D1E,#3A5E2A)",
  "linear-gradient(145deg,#0D1F2D,#1A4060)",
  "linear-gradient(145deg,#2A2A1A,#6A6A20)",
  "linear-gradient(145deg,#1A1A2D,#3A3A6B)",
  "linear-gradient(145deg,#2D1A2D,#6B2060)",
  "linear-gradient(145deg,#3D2B1F,#7A4A30)",
  "linear-gradient(145deg,#1A2010,#4A6020)",
];

// 48-card fallback deck
const FALLBACK = Array.from({length:48},(_,i)=>{
  const emojis = ["🕌","🌿","🌊","🏛️","🌙","⭐","🏔️","🌾","🦋","🌸","🏜️","🌋","🐚","🌀","🕯️","🗝️","🌲","🌌","🏺","🐉","🛸","🧿","🌍","🎼","💫","🧲","📜","🎠","🌏","🧊","🌳","🌕","🏰","🧸","💧","🍀","🎂","🎨","🧵","🔑","🌎","🧭","📷","🎶","🧋","🏖️","🦢","👁️"];
  return { id: `c${i+1}`, emoji: emojis[i], bg: BG[i % BG.length] };
});

function genCode() { return Math.random().toString(36).substring(2,6).toUpperCase(); }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function copyText(t) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
  const el = document.createElement("textarea"); el.value=t; el.style.cssText="position:fixed;opacity:0";
  document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el);
  return Promise.resolve();
}
// Sort players by join time — deterministic ordering for storyteller rotation
function sortedByJoin(ps) {
  return [...ps].sort((a,b) => new Date(a.created_at||0) - new Date(b.created_at||0));
}
function storytellerName(players, idx) {
  const s = sortedByJoin(players);
  if (!s.length) return "";
  return s[idx % s.length]?.name || "";
}

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
const DARK = {
  bg:"#1A1612", surf:"rgba(255,255,255,0.04)", surfHi:"rgba(201,149,42,0.08)",
  border:"rgba(201,149,42,0.15)", text:"#F5EFE4", muted:"#7A6E62",
  gold:"#C9952A", overlay:"rgba(0,0,0,0.88)", overlayDk:"rgba(0,0,0,0.94)",
  fullBg:"#0A0806", inputBg:"rgba(255,255,255,0.06)", phaseBg:"rgba(0,0,0,0.2)",
  hdr:"rgba(0,0,0,0.45)",
};
const LIGHT = {
  bg:"#F5EDE0", surf:"rgba(0,0,0,0.06)", surfHi:"rgba(150,100,10,0.10)",
  border:"rgba(150,100,20,0.25)", text:"#1C1108", muted:"#6B5A40",
  gold:"#9A6E10", overlay:"rgba(235,220,198,0.95)", overlayDk:"rgba(225,208,182,0.97)",
  fullBg:"#EDE0CC", inputBg:"rgba(0,0,0,0.07)", phaseBg:"rgba(255,255,255,0.5)",
  hdr:"rgba(235,220,198,0.92)",
};
function mkS(t) {
  return {
    root:{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:t.bg, color:t.text, minHeight:"100vh", display:"flex", flexDirection:"column" },
    btnP:{ padding:"10px 24px", borderRadius:6, border:"none", background:t.gold, color:t.bg, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", WebkitAppearance:"none", touchAction:"manipulation", userSelect:"none" },
    btnO:{ padding:"10px 24px", borderRadius:6, border:`1px solid ${t.gold}80`, background:"transparent", color:t.gold, fontWeight:500, fontSize:14, cursor:"pointer", fontFamily:"inherit", WebkitAppearance:"none", touchAction:"manipulation", userSelect:"none" },
    btnG:{ padding:"10px 24px", borderRadius:6, border:`1px solid ${t.text}25`, background:"transparent", color:t.text, fontSize:14, cursor:"pointer", fontFamily:"inherit", WebkitAppearance:"none", touchAction:"manipulation", userSelect:"none" },
    t,
  };
}
const CSS_VARS = (t) => ({
  "--bg":t.bg,"--surf":t.surf,"--surfHi":t.surfHi,"--border":t.border,
  "--text":t.text,"--muted":t.muted,"--gold":t.gold,
  "--overlay":t.overlay,"--overlayDk":t.overlayDk,"--fullBg":t.fullBg,
  "--inputBg":t.inputBg,"--phaseBg":t.phaseBg,"--hdr":t.hdr,
});

// ─────────────────────────────────────────────────────────────
// CARD COMPONENTS
// ─────────────────────────────────────────────────────────────
function Card({ card, size="lg", gold=false, voteCount=0 }) {
  const mini = size==="mini";
  const w = mini ? 52 : "min(230px,54vw)";
  const h = mini ? 72 : "min(324px,76vw)";
  const ef = mini ? 22 : "clamp(76px,17vw,114px)";
  const r = mini ? 8 : 20;
  const border = gold ? "3px solid #C9952A"
    : `${mini?1:2}px solid color-mix(in srgb,var(--gold) ${mini?15:28}%,transparent)`;

  return (
    <div style={{width:w,height:h,borderRadius:r,flexShrink:0,background:card?.bg||"#2A1A0A",border,position:"relative",overflow:"hidden",boxShadow:mini?"none":"0 32px 80px rgba(0,0,0,0.65)"}}>
      {card?.image_url && (
        <img src={card.image_url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";}} />
      )}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <span style={{fontSize:ef,lineHeight:1}}>{card?.emoji||"🎴"}</span>
      </div>
      {gold && (
        <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#C9952A",background:"rgba(0,0,0,0.75)",padding:"3px 10px",borderRadius:4,whiteSpace:"nowrap"}}>
          Storyteller's Card
        </div>
      )}
      {voteCount > 0 && (
        <div style={{position:"absolute",top:8,right:8,fontSize:12,fontWeight:700,color:"#7AC87A",background:"rgba(20,50,20,0.9)",borderRadius:8,padding:"2px 7px"}}>
          +{voteCount}
        </div>
      )}
    </div>
  );
}

function CardBack({ size="lg" }) {
  const mini = size==="mini";
  const w = mini ? 52 : "min(230px,54vw)";
  const h = mini ? 72 : "min(324px,76vw)";
  return (
    <div style={{width:w,height:h,borderRadius:mini?8:20,flexShrink:0,background:"linear-gradient(145deg,#1A1208,#2D2010)",border:`${mini?1:2}px solid rgba(201,149,42,0.2)`,position:"relative",overflow:"hidden",boxShadow:mini?"none":"0 32px 80px rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,opacity:0.1,backgroundImage:"repeating-linear-gradient(45deg,#C9952A 0,#C9952A 1px,transparent 1px,transparent 12px),repeating-linear-gradient(-45deg,#C9952A 0,#C9952A 1px,transparent 1px,transparent 12px)"}} />
      <span style={{fontSize:mini?16:36,opacity:0.35,position:"relative"}}>🎴</span>
    </div>
  );
}

function SoundBtn() {
  const [on, setOn] = useState(true);
  return (
    <button onClick={()=>{_soundOn=!_soundOn;setOn(_soundOn);if(_soundOn)snd("pick");}}
      style={{background:"transparent",border:"1px solid rgba(201,149,42,0.3)",borderRadius:8,cursor:"pointer",padding:"6px 10px",fontSize:16,lineHeight:1,minWidth:36,minHeight:36,color:on?"#C9952A":"#7A6E62"}}>
      {on?"🔊":"🔇"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING
// ─────────────────────────────────────────────────────────────
function Landing({ go, S, theme, setTheme }) {
  const [faq, setFaq] = useState(false);
  const fan = [
    {e:"🏔️",bg:"linear-gradient(135deg,#3D2B1F,#7A4A30)",r:-24,z:1},
    {e:"🌊",bg:"linear-gradient(135deg,#1A2D1A,#2D5016)",r:-12,z:2},
    {e:"🌙",bg:"linear-gradient(135deg,#2A1F0F,#7A5520)",r:0,z:3},
    {e:"🌿",bg:"linear-gradient(135deg,#1A1A2D,#2D2D6B)",r:12,z:2},
    {e:"🕌",bg:"linear-gradient(135deg,#2D1A1A,#6B2020)",r:24,z:1},
  ];
  const FAQ = [
    {q:"What is Hkayet Soura?",a:"A storytelling card game for 3–8 players. One player is the Storyteller each round — they pick a card from their hand and give a clue. Everyone else picks their best matching card. All cards go face-down, then everyone votes for which was the Storyteller's."},
    {q:"How do you score?",a:"If some but not all players guess the Storyteller's card: Storyteller gets 3, correct guessers get 3. If everyone or no one guesses correctly: everyone except the Storyteller gets 2. Any non-Storyteller card that gets voted on earns that player 1 point per vote."},
    {q:"How do you win?",a:"First player to reach 30 points (42 in an 8-player game) wins."},
    {q:"How do I create or join a room?",a:"Tap Play Now. Enter your name, then Create Room or Join Room with a code. Share the room code or invite link with friends."},
    {q:"Can I rejoin if I disconnect?",a:"Yes — use the same name and room code. Your score is preserved."},
    {q:"What makes a good clue?",a:"Something evocative — not too obvious, not too cryptic. You want SOME players to guess correctly, not all."},
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 40%,rgba(201,149,42,0.07) 0%,transparent 70%)",pointerEvents:"none"}} />

      <div style={{textAlign:"center",maxWidth:560,position:"relative",zIndex:1}}>
        <div style={{display:"inline-block",fontSize:11,letterSpacing:4,textTransform:"uppercase",color:"var(--gold)",border:"1px solid color-mix(in srgb,var(--gold) 30%,transparent)",padding:"6px 16px",borderRadius:20,marginBottom:28}}>
          Inspired by Dixit
        </div>
        <div style={{fontFamily:"Georgia,serif",fontSize:"clamp(44px,9vw,84px)",fontWeight:700,lineHeight:1,background:"linear-gradient(135deg,#C9952A,#E8C57A,#C4622D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:10}}>
          Hkayet Soura
        </div>
        <p style={{fontSize:15,color:"color-mix(in srgb,var(--text) 60%,transparent)",lineHeight:1.8,margin:"0 auto 40px",maxWidth:400}}>
          A storytelling card game of imagination, intuition, and shared memory.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"center",marginBottom:32}}>
          <button style={{...S.btnP,padding:"16px 48px",fontSize:17,borderRadius:8}} onClick={()=>go(SCREENS.LOBBY)}>Play Now</button>
          <button style={{...S.btnO,padding:"14px 20px",fontSize:14}} onClick={()=>setFaq(true)}>How to Play</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:S.t.muted}}>Appearance</div>
          <div style={{display:"flex",gap:0,background:S.t.surf,border:`1px solid ${S.t.border}`,borderRadius:30,padding:4}}>
            {["dark","light"].map(m=>(
              <button key={m} onClick={()=>setTheme(m)} style={{padding:"8px 24px",borderRadius:26,border:"none",cursor:"pointer",background:theme===m?S.t.gold:"transparent",color:theme===m?S.t.bg:S.t.muted,fontWeight:theme===m?700:400,fontSize:13,fontFamily:"inherit",transition:"all 0.2s"}}>
                {m==="dark"?"🌙 Dark":"☀️ Bright"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{position:"relative",width:110,height:160,marginTop:56}}>
        {fan.map((c,i)=>(
          <div key={i} style={{position:"absolute",bottom:0,left:0,width:100,height:148,borderRadius:12,background:c.bg,border:"1px solid rgba(201,149,42,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,zIndex:c.z,boxShadow:"0 16px 48px rgba(0,0,0,0.5)",transformOrigin:"50% 100%",transform:`rotate(${c.r}deg)`}}>
            {c.e}
          </div>
        ))}
      </div>

      {faq && (
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(16px)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"24px 16px"}}>
          <div style={{maxWidth:520,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,position:"sticky",top:0,background:"var(--overlayDk)",padding:"8px 0",zIndex:1}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"var(--gold)"}}>How to Play</div>
              <button onClick={()=>setFaq(false)} style={{...S.btnO,padding:"8px 20px",fontSize:13,borderRadius:20}}>Close ✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:32}}>
              {FAQ.map((f,i)=>(
                <div key={i} style={{background:"var(--surf)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:6}}>{f.q}</div>
                  <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{f.a}</div>
                </div>
              ))}
            </div>
            <button style={{...S.btnP,width:"100%",padding:"14px",fontSize:15,borderRadius:10,marginBottom:24}} onClick={()=>{setFaq(false);go(SCREENS.LOBBY);}}>
              Got it — Let's Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOBBY
// ─────────────────────────────────────────────────────────────
function Lobby({ go, S, setRoomCode, setMyName, setIsHost }) {
  const urlRoom = new URLSearchParams(window.location.search).get("room")||"";
  const [tab,setTab]       = useState(urlRoom?"join":"create");
  const [name,setName]     = useState("");
  const [code,setCode]     = useState(urlRoom);
  const [loading,setLoading] = useState(false);
  const [err,setErr]       = useState("");

  const inp = {width:"100%",padding:"12px 16px",borderRadius:8,background:"rgba(0,0,0,0.3)",border:"1px solid color-mix(in srgb,var(--gold) 20%,transparent)",color:"var(--text)",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const lbl = {display:"block",fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"var(--muted)",marginBottom:8};

  const create = async () => {
    if (!name.trim()) { setErr("Please enter your name"); return; }
    setLoading(true); setErr("");
    const rc = genCode();
    const {error:e1} = await sb.from("rooms").insert({code:rc,status:"waiting",storyteller_idx:0,phase:0,round:1});
    if (e1) { setErr("Could not create room. Try again."); setLoading(false); return; }
    await sb.from("room_players").insert({room_code:rc,name:name.trim(),score:0,is_active:true});
    setMyName(name.trim()); setRoomCode(rc); setIsHost(true);
    go(SCREENS.WAITING); setLoading(false);
  };

  const join = async () => {
    if (!name.trim()) { setErr("Please enter your name"); return; }
    if (!code.trim()) { setErr("Please enter a room code"); return; }
    setLoading(true); setErr("");
    const upper = code.trim().toUpperCase();
    const {data:room} = await sb.from("rooms").select("*").eq("code",upper).single();
    if (!room) { setErr("Room not found. Check the code and try again."); setLoading(false); return; }
    const {data:existing} = await sb.from("room_players").select("*").eq("room_code",upper).eq("name",name.trim()).single();
    if (existing) {
      await sb.from("room_players").update({is_active:true}).eq("id",existing.id);
    } else {
      if (room.status==="playing") { setErr("Game in progress. Rejoin with your original name."); setLoading(false); return; }
      const {data:all} = await sb.from("room_players").select("id").eq("room_code",upper);
      if (all && all.length>=8) { setErr("Room is full (max 8 players)."); setLoading(false); return; }
      await sb.from("room_players").insert({room_code:upper,name:name.trim(),score:0,is_active:true});
    }
    setMyName(name.trim()); setRoomCode(upper); setIsHost(false);
    go(room.status==="playing" ? SCREENS.GAME : SCREENS.WAITING);
    setLoading(false);
  };

  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:460}}>
        <div style={{textAlign:"center",fontSize:12,letterSpacing:3,textTransform:"uppercase",color:"var(--gold)",marginBottom:28}}>Start a Game</div>
        <div style={{background:"var(--surf)",border:"1px solid color-mix(in srgb,var(--gold) 15%,transparent)",borderRadius:16,padding:32}}>
          <div style={{display:"flex",background:"var(--surf)",borderRadius:8,padding:4,marginBottom:28}}>
            {["create","join"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{flex:1,padding:"10px 8px",borderRadius:6,border:"none",cursor:"pointer",background:tab===t?"var(--gold)":"transparent",color:tab===t?"var(--bg)":"var(--muted)",fontWeight:tab===t?700:500,fontSize:13,fontFamily:"inherit"}}>
                {t==="create"?"Create Room":"Join Room"}
              </button>
            ))}
          </div>
          {tab==="create" ? (
            <>
              <div style={{marginBottom:24}}><label style={lbl}>Your Name</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&create()} autoComplete="given-name" /></div>
              <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginBottom:20,lineHeight:1.6}}>Share the room code with friends. Max 8 players.</div>
              {err&&<div style={{fontSize:12,color:"#C4622D",textAlign:"center",marginBottom:12}}>{err}</div>}
              <button style={{...S.btnP,width:"100%",padding:14,fontSize:15,opacity:loading?0.6:1}} onClick={create} disabled={loading}>{loading?"Creating...":"Create Room"}</button>
            </>
          ):(
            <>
              <div style={{marginBottom:18}}><label style={lbl}>Your Name</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} autoComplete="given-name" /></div>
              <div style={{marginBottom:24}}><label style={lbl}>Room Code</label><input style={{...inp,textAlign:"center",fontSize:24,letterSpacing:8,fontWeight:700,textTransform:"uppercase"}} value={code} onChange={e=>setCode(e.target.value)} placeholder="ABCD" maxLength={6} /></div>
              <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginBottom:16,lineHeight:1.6}}>Disconnected? Rejoin with your original name and code.</div>
              {err&&<div style={{fontSize:12,color:"#C4622D",textAlign:"center",marginBottom:12}}>{err}</div>}
              <button style={{...S.btnP,width:"100%",padding:14,fontSize:15,opacity:loading?0.6:1}} onClick={join} disabled={loading}>{loading?"Joining...":"Join Room"}</button>
            </>
          )}
        </div>
        <button style={{...S.btnG,marginTop:16,fontSize:13,border:"none",color:"var(--muted)"}} onClick={()=>go(SCREENS.LANDING)}>← Back</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WAITING ROOM
// ─────────────────────────────────────────────────────────────
function Waiting({ go, S, roomCode, myName, isHost }) {
  const [players,setPlayers] = useState([]);
  const [copied,setCopied]   = useState(false);
  const [copiedL,setCopiedL] = useState(false);

  useEffect(()=>{
    if (!roomCode) return;
    const load = async () => {
      const {data} = await sb.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
      if (data) setPlayers(data);
    };
    load();
    const ch = sb.channel(`wait:${roomCode}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:`room_code=eq.${roomCode}`}, load)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"rooms",filter:`code=eq.${roomCode}`},(p)=>{
        if (p.new.status==="playing") go(SCREENS.GAME);
      })
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[roomCode]);

  const start = async ()=>{
    if (players.length<3) return;
    await sb.from("rooms").update({status:"playing"}).eq("code",roomCode);
    go(SCREENS.GAME);
  };

  const slots = [...players,...Array(Math.max(0,4-players.length)).fill(null)];

  return (
    <div style={{flex:1,padding:"40px 20px"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>Invite Friends</div>
          <div
            onClick={()=>copyText(roomCode).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);})}
            style={{display:"inline-flex",alignItems:"center",gap:16,background:copied?"color-mix(in srgb,#3A5E2A 30%,transparent)":"color-mix(in srgb,var(--gold) 8%,transparent)",border:copied?"2px solid #3A5E2A":"2px solid color-mix(in srgb,var(--gold) 40%,transparent)",borderRadius:16,padding:"18px 32px",cursor:"pointer",marginBottom:16,transition:"all 0.2s",userSelect:"none"}}>
            <div>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>Room Code</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:52,color:"var(--gold)",letterSpacing:12,fontWeight:700,lineHeight:1}}>{roomCode}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:48}}>
              <div style={{width:36,height:36,borderRadius:8,background:copied?"rgba(58,94,42,0.4)":"rgba(201,149,42,0.15)",border:`1px solid ${copied?"#3A5E2A":"rgba(201,149,42,0.4)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all 0.2s"}}>
                {copied?"✓":"⎘"}
              </div>
              <div style={{fontSize:10,letterSpacing:1,textTransform:"uppercase",color:copied?"#7AC87A":"var(--muted)",transition:"all 0.2s"}}>{copied?"Copied!":"Copy"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <button
              onClick={()=>copyText(window.location.origin+"?room="+roomCode).then(()=>{setCopiedL(true);setTimeout(()=>setCopiedL(false),2500);})}
              style={{...S.btnO,fontSize:13,padding:"10px 20px",borderRadius:10,background:copiedL?"color-mix(in srgb,#3A5E2A 20%,transparent)":"transparent",border:copiedL?"1px solid #3A5E2A":`1px solid ${S.t.gold}80`,color:copiedL?"#7AC87A":"var(--gold)"}}>
              {copiedL?"✓ Copied!":"🔗 Copy Invite Link"}
            </button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:32}}>
          {slots.map((p,i)=>(
            <div key={i} style={{background:p?(p.name===myName?"var(--surfHi)":"var(--surf)"):"transparent",border:p?(p.name===myName?"1px solid #C9952A":"1px solid color-mix(in srgb,var(--gold) 25%,transparent)"):"1px dashed color-mix(in srgb,var(--muted) 20%,transparent)",borderRadius:12,padding:"16px 10px",textAlign:"center"}}>
              <div style={{width:40,height:40,borderRadius:"50%",margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:p?16:20,background:p?"color-mix(in srgb,var(--gold) 15%,transparent)":"color-mix(in srgb,var(--muted) 8%,transparent)",color:p?"var(--text)":"var(--muted)",fontWeight:700}}>{p?p.name[0]:"+"}</div>
              <div style={{fontSize:12,fontWeight:p?500:400,color:p?"var(--text)":"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p?p.name:"Waiting..."}</div>
              {p?.name===myName&&<div style={{fontSize:9,color:"var(--gold)",letterSpacing:1,textTransform:"uppercase",marginTop:3}}>You</div>}
            </div>
          ))}
        </div>

        <div style={{textAlign:"center"}}>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:20}}>{players.length} player{players.length!==1?"s":""} joined · Need at least 3 to start</div>
          {isHost
            ? <button style={{...S.btnP,padding:"14px 40px",fontSize:15,opacity:players.length<3?0.4:1}} onClick={start} disabled={players.length<3}>Start Game</button>
            : <div style={{fontSize:13,color:"var(--muted)",padding:"14px 40px",background:"var(--surf)",borderRadius:10,display:"inline-block"}}>Waiting for the host to start...</div>
          }
        </div>
        <div style={{textAlign:"center",marginTop:16}}>
          <button style={{...S.btnG,border:"none",color:"var(--muted)",fontSize:13}} onClick={()=>go(SCREENS.LOBBY)}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GAME
//
// Design principles to eliminate glitches:
//
// 1. ALL values read inside realtime callbacks come from refs, never
//    from closed-over state. State is for rendering only.
//
// 2. The board shuffle order is seeded from the DB (room.board_seed),
//    so every client produces the same shuffle — no per-client randomness.
//
// 3. Phase transitions (1→2, 2→3) happen ONLY by listening to the
//    rooms UPDATE event. The clients that submit cards/votes call
//    checkAndAdvance which writes to rooms conditionally. Everyone else
//    sees the rooms update and re-renders. No client tries to advance
//    state from its own action — it always waits for the DB echo.
//
// 4. Hand cards are stored in dealt_hands (server). On init, every
//    client reads their own slice. On new round, the storyteller writes
//    new dealt_hands; every client reads from the rooms UPDATE event.
//    Only one client (earliest join) deals — others poll briefly.
//
// ─────────────────────────────────────────────────────────────
function Game({ go, S, roomCode, myName }) {

  // ── UI state (rendering only) ──────────────────────────────
  const [phase,       setPhase]       = useState(0);
  const [round,       setRound]       = useState(1);
  const [stIdx,       setStIdx]       = useState(0);
  const [clue,        setClue]        = useState("");
  const [players,     setPlayers]     = useState([]);   // sorted by join
  const [scores,      setScores]      = useState([]);
  const [handCards,   setHandCards]   = useState([]);
  const [boardCards,  setBoardCards]  = useState([]);
  const [submittedId, setSubmittedId] = useState(null);
  const [votedId,     setVotedId]     = useState(null);
  const [voteConfirmed,setVoteConfirmed] = useState(false);
  const [roundDeltas, setRoundDeltas] = useState(null);
  const [winner,      setWinner]      = useState(null);
  const [disbanded,   setDisbanded]   = useState(false);
  const [online,      setOnline]      = useState({});
  const [loading,     setLoading]     = useState(true);
  const [endLoading,  setEndLoading]  = useState(false);

  // ── UI interaction state ───────────────────────────────────
  const [clueInput,   setClueInput]   = useState("");
  const [selHand,     setSelHand]     = useState(0);
  const [tab,         setTab]         = useState("hand");
  const [focusBoard,  setFocusBoard]  = useState(0);
  const [overlay,     setOverlay]     = useState(null); // "clue" | "vote" | "full-hand-N" | "full-board-N"
  const [showScores,  setShowScores]  = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);

  // ── Refs — everything callbacks read ──────────────────────
  // These shadow their state counterparts so closures always read fresh values
  const roomCodeRef    = useRef(roomCode);
  const myNameRef      = useRef(myName);
  const phaseRef       = useRef(0);
  const roundRef       = useRef(1);
  const stIdxRef       = useRef(0);
  const playersRef     = useRef([]);    // sorted array
  const deckRef        = useRef([]);    // full card deck
  const handRef        = useRef([]);    // my current hand cards
  const submittedRef   = useRef(null);
  const votedRef       = useRef(null);
  const boardSeedRef   = useRef(null);  // stable per-round shuffle seed from DB

  // Keep refs in sync with state
  useEffect(()=>{ phaseRef.current = phase; },    [phase]);
  useEffect(()=>{ roundRef.current = round; },    [round]);
  useEffect(()=>{ stIdxRef.current = stIdx; },    [stIdx]);
  useEffect(()=>{ playersRef.current = players; },[players]);
  useEffect(()=>{ handRef.current = handCards; }, [handCards]);
  useEffect(()=>{ submittedRef.current = submittedId; },[submittedId]);
  useEffect(()=>{ votedRef.current = votedId; },  [votedId]);

  // ── Derived (read-time only, from state for render) ────────
  const stName      = storytellerName(players, stIdx);
  const isMe        = myName === stName;
  const winTarget   = players.length <= 6 ? 30 : 42;
  const gameRound   = Math.floor(stIdx / Math.max(players.length,1)) + 1;
  const turnInCycle = (stIdx % Math.max(players.length,1)) + 1;
  const nextSt      = storytellerName(players, stIdx + 1);

  // ── Card helpers (pure, no closure over state) ─────────────
  const cardMap = useCallback(()=>{
    const m = {};
    deckRef.current.forEach(c=>{ m[c.id]=c; });
    return m;
  },[]);

  const hydrateIds = useCallback((ids)=>{
    const m = cardMap();
    return ids.map(id=>m[id]).filter(Boolean);
  },[cardMap]);

  // Deterministic board order from a numeric seed (stored in DB as room.board_seed)
  // Using a simple seeded LCG so all clients produce identical shuffles
  const seededShuffle = (arr, seed) => {
    const a = [...arr];
    let s = seed;
    for (let i = a.length-1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i+1);
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  };

  // ── loadBoard: pure DB read, no closure over state ─────────
  // Takes explicit params so it can be called from callbacks safely
  const loadBoard = useCallback(async (rnd, currentPhase, stIdxVal, boardSeed) => {
    const {data:plays} = await sb.from("card_plays").select("*").eq("room_code",roomCodeRef.current).eq("round",rnd);
    if (!plays || plays.length===0) { setBoardCards([]); return; }

    const {data:votes}  = await sb.from("votes").select("*").eq("room_code",roomCodeRef.current).eq("round",rnd);
    const {data:psRows} = await sb.from("room_players").select("name,created_at,is_active").eq("room_code",roomCodeRef.current).eq("is_active",true);
    const {data:cdRows} = await sb.from("cards").select("*").in("id",plays.map(p=>p.card_id));

    const stN = storytellerName(psRows||[], stIdxVal);

    const cm = {};
    (cdRows||[]).forEach((c,i)=>{ cm[c.id]={...c,bg:c.bg||BG[i%BG.length],emoji:c.emoji||"🎴"}; });
    deckRef.current.forEach(c=>{ if (!cm[c.id]) cm[c.id]=c; });

    const cards = plays.map(play=>({
      ...(cm[play.card_id]||FALLBACK[0]),
      owner:       currentPhase>=3 ? play.player_name : "?",
      isStoryteller: currentPhase>=3 ? play.player_name===stN : false,
      isMyCard:    play.player_name===myNameRef.current,
      votes:       (votes||[]).filter(v=>v.voted_card_id===play.card_id).map(v=>v.voter_name),
    }));

    // Use server-provided seed for deterministic shuffle
    const seed = boardSeed ?? boardSeedRef.current ?? 1;
    const ordered = seededShuffle(cards, seed);
    setBoardCards(ordered);
  },[]);

  // ── checkAndAdvance: check whether all submissions/votes are in ──
  // Called after every card_plays or votes change.
  // Uses conditional update so only one winner.
  const checkAndAdvance = useCallback(async (rnd)=>{
    // Re-fetch current room phase fresh from DB to avoid stale closure
    const {data:room} = await sb.from("rooms").select("phase,storyteller_idx").eq("code",roomCodeRef.current).single();
    if (!room) return;

    const {data:ps} = await sb.from("room_players").select("name,created_at").eq("room_code",roomCodeRef.current).eq("is_active",true);
    if (!ps||ps.length===0) return;

    const stN = storytellerName(ps, room.storyteller_idx);

    if (room.phase===1) {
      const {data:plays} = await sb.from("card_plays").select("id").eq("room_code",roomCodeRef.current).eq("round",rnd);
      if ((plays?.length||0) >= ps.length) {
        await sb.from("rooms").update({phase:2}).eq("code",roomCodeRef.current).eq("phase",1);
      }
    } else if (room.phase===2) {
      const nonST = ps.filter(p=>p.name!==stN);
      const {data:vts} = await sb.from("votes").select("id").eq("room_code",roomCodeRef.current).eq("round",rnd);
      if (nonST.length>0 && (vts?.length||0) >= nonST.length) {
        await sb.from("rooms").update({phase:3}).eq("code",roomCodeRef.current).eq("phase",2);
      }
    }
  },[]);

  // ── dealHands: server-authoritative ──────────────────────
  // Earliest-joined player is the dealer. Others poll briefly then deal themselves as fallback.
  const dealHands = useCallback(async (deck, ps, room)=>{
    let hands = {};
    try { hands = JSON.parse(room?.dealt_hands||"{}"); } catch(e){}

    // Already have a hand
    if (hands[myNameRef.current]?.length > 0) {
      const h = hydrateIds(hands[myNameRef.current]);
      if (h.length > 0) { setHandCards(h); handRef.current=h; return; }
    }

    const sorted = sortedByJoin(ps);
    const isDealer = sorted[0]?.name === myNameRef.current;

    if (!isDealer) {
      // Poll up to 4 times for dealer to write
      for (let i=0; i<4; i++) {
        await new Promise(r=>setTimeout(r,1500+i*1000));
        const {data:fr} = await sb.from("rooms").select("dealt_hands").eq("code",roomCodeRef.current).single();
        let fh={};
        try { fh=JSON.parse(fr?.dealt_hands||"{}"); } catch(e){}
        if (fh[myNameRef.current]?.length>0) {
          const h = hydrateIds(fh[myNameRef.current]);
          if (h.length>0) { setHandCards(h); handRef.current=h; return; }
        }
      }
    }

    // Deal (dealer path, or fallback if dealer never wrote)
    let used=[];
    try { used=JSON.parse(room?.used_cards||"[]"); } catch(e){}
    const usedSet = new Set(used);
    let avail = deck.filter(c=>!usedSet.has(c.id));
    if (avail.length < sorted.length*6) avail=[...deck];
    const sh = shuffle(avail);
    const newHands={};
    sorted.forEach((p,i)=>{ newHands[p.name]=sh.slice(i*6,i*6+6).map(c=>c.id); });
    await sb.from("rooms").update({dealt_hands:JSON.stringify(newHands)}).eq("code",roomCodeRef.current);
    const mine = hydrateIds(newHands[myNameRef.current]||[]);
    setHandCards(mine); handRef.current=mine;
  },[hydrateIds]);

  // ── INIT + REALTIME ──────────────────────────────────────
  useEffect(()=>{
    if (!roomCode) return;
    roomCodeRef.current = roomCode;
    myNameRef.current   = myName;

    const init = async ()=>{
      const [{data:ps},{data:room},{data:cards}] = await Promise.all([
        sb.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true),
        sb.from("rooms").select("*").eq("code",roomCode).single(),
        sb.from("cards").select("*").eq("active",true),
      ]);

      const sorted = sortedByJoin(ps||[]);
      setPlayers(sorted); playersRef.current=sorted;
      setScores(sorted.map(p=>({name:p.name,score:p.score||0})));

      if (room) {
        setPhase(room.phase);   phaseRef.current=room.phase;
        setRound(room.round);   roundRef.current=room.round;
        setStIdx(room.storyteller_idx); stIdxRef.current=room.storyteller_idx;
        if (room.clue) setClue(room.clue);
        setTab(room.phase>=2?"board":"hand");
        if (room.board_seed) boardSeedRef.current=room.board_seed;
        if (room.round_deltas && room.round_deltas!=="null") {
          try { const d=JSON.parse(room.round_deltas); if(d&&typeof d==="object") setRoundDeltas(d); } catch(e){}
        }
      }

      const fullDeck = (cards&&cards.length>0)
        ? cards.map((c,i)=>({...c,bg:c.bg||BG[i%BG.length],emoji:c.emoji||"🎴"}))
        : FALLBACK;
      deckRef.current = fullDeck;

      await dealHands(fullDeck, sorted, room);
      await loadBoard(room?.round||1, room?.phase||0, room?.storyteller_idx||0, room?.board_seed);

      const [{data:myPlay},{data:myVote}] = await Promise.all([
        sb.from("card_plays").select("card_id").eq("room_code",roomCode).eq("round",room?.round||1).eq("player_name",myName).maybeSingle(),
        sb.from("votes").select("voted_card_id").eq("room_code",roomCode).eq("round",room?.round||1).eq("voter_name",myName).maybeSingle(),
      ]);
      if (myPlay) { setSubmittedId(myPlay.card_id); submittedRef.current=myPlay.card_id; }
      if (myVote) { setVotedId(myVote.voted_card_id); votedRef.current=myVote.voted_card_id; setVoteConfirmed(true); }

      setLoading(false);
    };

    init();

    // Presence
    const presenceCh = sb.channel(`presence:${roomCode}`,{config:{presence:{key:myName}}});
    presenceCh
      .on("presence",{event:"sync"},()=>{
        const o={};
        Object.keys(presenceCh.presenceState()).forEach(k=>{o[k]=true;});
        setOnline(o);
      })
      .subscribe(async s=>{ if(s==="SUBSCRIBED") await presenceCh.track({name:myName}); });

    // Main game channel
    const ch = sb.channel(`game:${roomCode}`)

      // rooms UPDATE — single source of truth for phase changes and new rounds
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"rooms",filter:`code=eq.${roomCode}`}, async (payload)=>{
        const r = payload.new;
        const prevRound = roundRef.current;
        const isNewRound = r.round !== prevRound;

        // Always update phase and storyteller from DB
        setPhase(r.phase);    phaseRef.current=r.phase;
        setStIdx(r.storyteller_idx); stIdxRef.current=r.storyteller_idx;
        if (r.clue) setClue(r.clue); else setClue("");

        if (isNewRound) {
          // Full round reset
          roundRef.current = r.round;
          if (r.board_seed) boardSeedRef.current = r.board_seed;
          setRound(r.round);
          setSubmittedId(null);  submittedRef.current=null;
          setVotedId(null);      votedRef.current=null;
          setVoteConfirmed(false);
          setRoundDeltas(null);
          setBoardCards([]);
          setFocusBoard(0);
          setSelHand(0);
          setClueInput("");
          setTab("hand");
          // Hydrate new hand from dealt_hands
          if (r.dealt_hands && r.dealt_hands!=="{}") {
            try {
              const nh = JSON.parse(r.dealt_hands);
              if (nh[myNameRef.current]?.length>0) {
                const h = hydrateIds(nh[myNameRef.current]);
                setHandCards(h); handRef.current=h;
              }
            } catch(e){}
          }
        } else {
          // Same round
          if (r.round_deltas && r.round_deltas!=="null") {
            try { const d=JSON.parse(r.round_deltas); if(d&&typeof d==="object") setRoundDeltas(d); } catch(e){}
          }
          if (!r.round_deltas || r.round_deltas==="null") {
            setTab(r.phase>=2?"board":"hand");
          }
        }

        await loadBoard(r.round, r.phase, r.storyteller_idx, r.board_seed||boardSeedRef.current);
      })

      // card_plays changes → reload board + maybe advance phase
      .on("postgres_changes",{event:"*",schema:"public",table:"card_plays",filter:`room_code=eq.${roomCode}`}, async ()=>{
        await loadBoard(roundRef.current, phaseRef.current, stIdxRef.current, boardSeedRef.current);
        await checkAndAdvance(roundRef.current);
      })

      // votes changes → reload board + maybe advance phase
      .on("postgres_changes",{event:"*",schema:"public",table:"votes",filter:`room_code=eq.${roomCode}`}, async ()=>{
        await loadBoard(roundRef.current, phaseRef.current, stIdxRef.current, boardSeedRef.current);
        await checkAndAdvance(roundRef.current);
      })

      // player list changes
      .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:`room_code=eq.${roomCode}`}, async ()=>{
        const {data:ps} = await sb.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
        if (ps) {
          const sorted = sortedByJoin(ps);
          setPlayers(sorted); playersRef.current=sorted;
          setScores(sorted.map(p=>({name:p.name,score:p.score||0})));
          setDisbanded(ps.length<3);
        }
      })

      .subscribe();

    return ()=>{
      sb.removeChannel(ch);
      sb.removeChannel(presenceCh);
    };
  },[roomCode, myName]); // eslint-disable-line

  // ── ACTIONS ───────────────────────────────────────────────

  const confirmClue = async ()=>{
    if (!clueInput.trim()) return;
    const card = handRef.current[selHand];
    if (!card) return;
    snd("clue");
    setClue(clueInput.trim());
    // Generate a deterministic board shuffle seed for this round
    const seed = Math.floor(Math.random()*2147483647);
    boardSeedRef.current = seed;
    await sb.from("rooms").update({clue:clueInput.trim(),phase:1,board_seed:seed}).eq("code",roomCodeRef.current);
    const {data:ex} = await sb.from("card_plays").select("id").eq("room_code",roomCodeRef.current).eq("round",roundRef.current).eq("player_name",myNameRef.current).maybeSingle();
    if (!ex) await sb.from("card_plays").insert({room_code:roomCodeRef.current,round:roundRef.current,player_name:myNameRef.current,card_id:card.id});
    setSubmittedId(card.id); submittedRef.current=card.id;
    setOverlay(null);
  };

  const submitCard = async ()=>{
    if (submittedRef.current) return; // guard using ref, not stale state
    const card = handRef.current[selHand];
    if (!card) return;
    snd("submit");
    const {data:ex} = await sb.from("card_plays").select("id,card_id").eq("room_code",roomCodeRef.current).eq("round",roundRef.current).eq("player_name",myNameRef.current).maybeSingle();
    if (ex) { setSubmittedId(ex.card_id); submittedRef.current=ex.card_id; return; }
    await sb.from("card_plays").insert({room_code:roomCodeRef.current,round:roundRef.current,player_name:myNameRef.current,card_id:card.id});
    setSubmittedId(card.id); submittedRef.current=card.id;
    // Phase advance is handled by card_plays listener + checkAndAdvance
  };

  const confirmVote = async (card)=>{
    if (!card || isMe) return;
    if (card.isMyCard) return;
    if (votedRef.current) return; // guard using ref
    snd("vote");
    const {data:ex} = await sb.from("votes").select("id,voted_card_id").eq("room_code",roomCodeRef.current).eq("round",roundRef.current).eq("voter_name",myNameRef.current).maybeSingle();
    if (ex) { setVotedId(ex.voted_card_id); votedRef.current=ex.voted_card_id; setVoteConfirmed(true); setOverlay(null); return; }
    const {error:e} = await sb.from("votes").insert({room_code:roomCodeRef.current,round:roundRef.current,voter_name:myNameRef.current,voted_card_id:card.id});
    if (e) { console.error("vote insert failed",e); return; }
    setVotedId(card.id); votedRef.current=card.id; setVoteConfirmed(true); setOverlay(null);
    // Phase advance is handled by votes listener + checkAndAdvance
  };

  const endRound = async ()=>{
    if (endLoading) return;
    setEndLoading(true);
    snd("reveal");
    try {
      const rnd = roundRef.current;
      const [{data:plays},{data:vts},{data:room},{data:ps}] = await Promise.all([
        sb.from("card_plays").select("*").eq("room_code",roomCodeRef.current).eq("round",rnd),
        sb.from("votes").select("*").eq("room_code",roomCodeRef.current).eq("round",rnd),
        sb.from("rooms").select("storyteller_idx").eq("code",roomCodeRef.current).single(),
        sb.from("room_players").select("name,score,created_at").eq("room_code",roomCodeRef.current).eq("is_active",true),
      ]);
      if (!plays||!room||!ps||!ps.length) { setEndLoading(false); return; }

      const sorted  = sortedByJoin(ps);
      const stN     = sorted[room.storyteller_idx % sorted.length]?.name||"";
      const nonST   = sorted.filter(p=>p.name!==stN).map(p=>p.name);
      const allVts  = vts||[];
      const stPlay  = plays.find(p=>p.player_name===stN);
      const correct = stPlay ? allVts.filter(v=>v.voted_card_id===stPlay.card_id).map(v=>v.voter_name) : [];
      const allOrNone = correct.length===0 || correct.length===nonST.length;

      const deltas={};
      sorted.forEach(p=>{ deltas[p.name]=0; });
      if (!allOrNone) {
        deltas[stN]=(deltas[stN]||0)+3;
        correct.forEach(v=>{ deltas[v]=(deltas[v]||0)+3; });
      } else {
        nonST.forEach(p=>{ deltas[p]=(deltas[p]||0)+2; });
      }
      plays.filter(p=>p.player_name!==stN).forEach(p=>{
        const vc = allVts.filter(v=>v.voted_card_id===p.card_id).length;
        if (vc>0) deltas[p.player_name]=(deltas[p.player_name]||0)+vc;
      });

      const newScores = ps.map(p=>({name:p.name,score:(p.score||0)+(deltas[p.name]||0)}));
      await Promise.all(newScores.map(s=>sb.from("room_players").update({score:s.score}).eq("room_code",roomCodeRef.current).eq("name",s.name)));
      setScores(newScores);
      setRoundDeltas(deltas);
      snd("score");
      await sb.from("rooms").update({round_deltas:JSON.stringify(deltas)}).eq("code",roomCodeRef.current);

      const top = Math.max(...newScores.map(s=>s.score));
      if (top>=winTarget) {
        setTimeout(()=>snd("score"),400);
        setWinner({names:newScores.filter(s=>s.score===top).map(s=>s.name),scores:newScores,top});
      }
    } catch(err) { console.error("endRound",err); }
    finally { setEndLoading(false); }
  };

  const nextRound = async ()=>{
    snd("next");
    const completedRound = roundRef.current;
    const newRound = completedRound + 1;
    const newIdx   = stIdxRef.current + 1;

    // Optimistic local reset so the calling player sees it immediately
    setRoundDeltas(null); setSubmittedId(null); submittedRef.current=null;
    setVotedId(null); votedRef.current=null; setVoteConfirmed(false);
    setClueInput(""); setClue(""); setBoardCards([]); setSelHand(0);
    setFocusBoard(0); setTab("hand");

    const [{data:plays},{data:curRoom},{data:ps}] = await Promise.all([
      sb.from("card_plays").select("*").eq("room_code",roomCodeRef.current).eq("round",completedRound),
      sb.from("rooms").select("used_cards,dealt_hands").eq("code",roomCodeRef.current).single(),
      sb.from("room_players").select("*").eq("room_code",roomCodeRef.current).eq("is_active",true),
    ]);

    let used=[];
    let hands={};
    try { used=JSON.parse(curRoom?.used_cards||"[]"); } catch(e){}
    try { hands=JSON.parse(curRoom?.dealt_hands||"{}"); } catch(e){}
    (plays||[]).forEach(p=>{ if(!used.includes(p.card_id)) used.push(p.card_id); });

    // Build replacement pool
    const inHands = new Set(Object.values(hands).flat());
    const usedSet = new Set(used);
    let avail = deckRef.current.filter(c=>!usedSet.has(c.id)&&!inHands.has(c.id));
    if (avail.length<(plays?.length||0)) avail=deckRef.current.filter(c=>!inHands.has(c.id));
    if (avail.length<(plays?.length||0)) avail=[...deckRef.current];
    const repl = shuffle(avail);
    let ri=0;

    const sorted = sortedByJoin(ps||[]);
    const newHands = {...hands};
    sorted.forEach(p=>{
      const played = plays?.find(pl=>pl.player_name===p.name);
      if (!played) return;
      const h = [...(newHands[p.name]||[])];
      const idx = h.indexOf(played.card_id);
      if (idx===-1) { h.push(repl[ri++]?.id); }
      else { h[idx] = repl[ri++]?.id || h[idx]; }
      newHands[p.name] = h.filter(Boolean);
    });

    const newSeed = Math.floor(Math.random()*2147483647);
    await sb.from("rooms").update({
      phase:0, round:newRound, storyteller_idx:newIdx, clue:null,
      used_cards:JSON.stringify(used), dealt_hands:JSON.stringify(newHands),
      round_deltas:null, board_seed:newSeed,
    }).eq("code",roomCodeRef.current);

    // Apply own new hand immediately
    if (newHands[myNameRef.current]?.length>0) {
      const h = hydrateIds(newHands[myNameRef.current]);
      setHandCards(h); handRef.current=h;
    }
    roundRef.current=newRound;
    boardSeedRef.current=newSeed;
  };

  const handleExit = async ()=>{
    await sb.from("room_players").update({is_active:false}).eq("room_code",roomCodeRef.current).eq("name",myNameRef.current);
    go(SCREENS.LOBBY);
  };

  const resetGame = async ()=>{
    setWinner(null); setPhase(0); setRound(1); setStIdx(0);
    setClue(""); setClueInput(""); setHandCards([]); handRef.current=[];
    setBoardCards([]); setSubmittedId(null); submittedRef.current=null;
    setVotedId(null); votedRef.current=null; setVoteConfirmed(false);
    setRoundDeltas(null); setSelHand(0); setFocusBoard(0); setTab("hand");
    setScores(playersRef.current.map(p=>({name:p.name,score:0})));
    await Promise.all(playersRef.current.map(p=>sb.from("room_players").update({score:0}).eq("room_code",roomCodeRef.current).eq("name",p.name)));
    roundRef.current=1; stIdxRef.current=0; phaseRef.current=0;
    const seed=Math.floor(Math.random()*2147483647);
    boardSeedRef.current=seed;
    await sb.from("rooms").update({phase:0,round:1,storyteller_idx:0,clue:null,dealt_hands:"{}",used_cards:"[]",round_deltas:null,board_seed:seed}).eq("code",roomCodeRef.current);
  };

  // ── RENDER ────────────────────────────────────────────────
  if (loading) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:32}}>🎴</div>
      <div style={{fontSize:14,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase"}}>Loading game...</div>
    </div>
  );

  const activeBoard = boardCards[focusBoard];
  const phaseLabels = ["Clue","Submit","Vote","Reveal"];

  // Overlay type helpers
  const showingClueOverlay  = overlay==="clue";
  const showingVoteOverlay  = typeof overlay==="object" && overlay?.type==="vote";
  const showingFullBoard    = typeof overlay==="object" && overlay?.type==="full-board";
  const showingFullHand     = typeof overlay==="object" && overlay?.type==="full-hand";
  const voteOverlayCard     = showingVoteOverlay ? boardCards[overlay.idx] : null;
  const fullBoardCard       = showingFullBoard   ? boardCards[overlay.idx] : null;
  const fullHandCard        = showingFullHand    ? handCards[overlay.idx]  : null;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative"}}>

      {/* ── HEADER ──────────────────────────────────────── */}
      <div style={{background:"var(--hdr)",borderBottom:"1px solid color-mix(in srgb,var(--gold) 12%,transparent)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",gap:8}}>
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            <div style={{display:"flex",alignItems:"baseline",gap:5}}>
              <span style={{fontSize:10,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase"}}>Game</span>
              <span style={{fontSize:17,fontWeight:700,fontFamily:"Georgia,serif",lineHeight:1}}>{gameRound}</span>
              <span style={{fontSize:10,color:"var(--muted)"}}>· turn {turnInCycle}/{players.length}</span>
            </div>
            <div style={{fontSize:9,color:"var(--muted)"}}>first to {winTarget} pts</div>
          </div>
          <button onClick={()=>setShowScores(v=>!v)} style={{...S.btnO,fontSize:10,padding:"4px 14px",borderRadius:20}}>{showScores?"Hide ▲":"Scores ▼"}</button>
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
            <SoundBtn/>
            {!exitConfirm
              ? <button style={{...S.btnG,fontSize:10,padding:"8px 14px",minWidth:44,minHeight:36}} onClick={()=>setExitConfirm(true)}>Exit</button>
              : <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <span style={{fontSize:10,color:"var(--muted)"}}>Sure?</span>
                  <button style={{...S.btnP,fontSize:11,padding:"8px 14px",background:"#C4622D"}} onClick={handleExit}>Yes</button>
                  <button style={{...S.btnG,fontSize:11,padding:"8px 14px"}} onClick={()=>setExitConfirm(false)}>No</button>
                </div>
            }
          </div>
        </div>
        {showScores && (
          <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"4px 12px 10px",borderTop:"1px solid color-mix(in srgb,var(--gold) 8%,transparent)"}}>
            {scores.map(s=>{
              const isST = s.name===stName;
              const d    = roundDeltas?.[s.name];
              return (
                <div key={s.name} style={{textAlign:"center",minWidth:36,padding:"2px 6px",borderRadius:6,background:isST?"color-mix(in srgb,var(--gold) 12%,transparent)":"transparent",border:isST?"1px solid color-mix(in srgb,var(--gold) 35%,transparent)":"1px solid transparent",position:"relative"}}>
                  <div style={{fontSize:8,letterSpacing:1,textTransform:"uppercase",color:isST?"var(--gold)":"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:52}}>{s.name}</div>
                  <div style={{fontSize:16,fontWeight:700,color:isST?"var(--gold)":"var(--text)",fontFamily:"Georgia,serif",lineHeight:1.2}}>{s.score}</div>
                  {d>0&&<div style={{position:"absolute",top:-6,right:-6,fontSize:9,fontWeight:700,color:"#7AC87A",background:"rgba(30,60,30,0.9)",borderRadius:8,padding:"1px 4px"}}>+{d}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PHASE BAR ───────────────────────────────────── */}
      <div style={{display:"flex",flexShrink:0,borderBottom:"1px solid rgba(201,149,42,0.08)"}}>
        {phaseLabels.map((lbl,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"10px 4px",background:i===phase?"var(--gold)":i<phase?"color-mix(in srgb,var(--gold) 7%,transparent)":"var(--phaseBg)",color:i===phase?"var(--bg)":i<phase?"color-mix(in srgb,var(--gold) 40%,transparent)":"var(--muted)",fontSize:11,fontWeight:i===phase?700:400,letterSpacing:1,textTransform:"uppercase",borderRight:i<3?"1px solid rgba(201,149,42,0.1)":"none",transition:"background 0.35s,color 0.35s"}}>
            <span style={{fontSize:8,marginRight:4,opacity:0.6}}>{i+1}</span>{lbl}
            {i<phase&&<span style={{marginLeft:4,fontSize:9}}>✓</span>}
          </div>
        ))}
      </div>

      {/* ── CLUE STRIP ──────────────────────────────────── */}
      {phase>=1 && (
        <div style={{textAlign:"center",padding:"9px 20px",borderBottom:"1px solid rgba(201,149,42,0.06)",background:"rgba(201,149,42,0.04)",flexShrink:0}}>
          <span style={{fontSize:10,letterSpacing:2,color:"var(--gold)",textTransform:"uppercase",marginRight:10}}>{stName} — Clue:</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:"clamp(14px,2.5vw,20px)",fontStyle:"italic"}}>"{clue}"</span>
        </div>
      )}

      {/* ── HAND / BOARD TABS ───────────────────────────── */}
      <div style={{display:"flex",flexShrink:0}}>
        {["hand","board"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",background:tab===t?"var(--surfHi)":"transparent",borderTop:"none",borderLeft:"none",borderRight:"none",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",color:tab===t?"var(--gold)":"var(--muted)",fontSize:12,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>{t}</button>
        ))}
      </div>

      {/* ── HAND TAB ────────────────────────────────────── */}
      {tab==="hand" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto",padding:"20px 16px",gap:16}}>
          {/* Context banner */}
          {phase===0 && isMe  && <div style={{textAlign:"center",padding:"12px 16px",background:"color-mix(in srgb,var(--gold) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--gold) 25%,transparent)",borderRadius:12,fontSize:13,lineHeight:1.6}}>You are the Storyteller. Pick a card and give a clue — mysterious but not impossible.</div>}
          {phase===0 && !isMe && <div style={{textAlign:"center",padding:"12px 16px",background:"var(--surf)",border:"1px solid var(--border)",borderRadius:12,fontSize:13,color:"var(--muted)",lineHeight:1.6}}>Waiting for <span style={{color:"var(--gold)",fontWeight:600}}>{stName}</span> to give a clue...</div>}
          {phase===1 && !isMe && !submittedId && <div style={{textAlign:"center",padding:"12px 16px",background:"color-mix(in srgb,var(--gold) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--gold) 25%,transparent)",borderRadius:12,fontSize:13}}>Pick the card that best matches: <em style={{color:"var(--gold)"}}>"{clue}"</em></div>}
          {phase===1 && submittedId && <div style={{textAlign:"center",padding:"12px",background:"var(--surf)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>Card submitted ✓ — waiting for others...</div>}
          {phase===1 && isMe && <div style={{textAlign:"center",padding:"12px",background:"var(--surf)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>Waiting for others to submit their cards...</div>}

          {/* Main card display */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
            <div style={{cursor:"pointer"}} onClick={()=>{
              if (phase===0&&isMe) setOverlay("clue");
              else setOverlay({type:"full-hand",idx:selHand});
            }}>
              <Card card={handCards[selHand]} size="lg" />
            </div>

            {/* Thumbnail strip */}
            <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 0",maxWidth:"100%"}}>
              {handCards.map((c,i)=>(
                <div key={c.id||i} onClick={()=>{snd("pick");setSelHand(i);}} style={{cursor:"pointer",flexShrink:0,transform:selHand===i?"translateY(-4px)":"none",transition:"transform 0.18s",outline:selHand===i?"2px solid #C9952A":"none",borderRadius:8}}>
                  <Card card={c} size="mini" />
                  <div style={{textAlign:"center",fontSize:9,color:selHand===i?"var(--gold)":"var(--muted)",marginTop:2,fontWeight:700}}>{i+1}</div>
                </div>
              ))}
            </div>

            {/* Action button */}
            {phase===0 && isMe && (
              <button style={{...S.btnP,padding:"12px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={()=>setOverlay("clue")}>
                Give a Clue for Card {selHand+1}
              </button>
            )}
            {phase===1 && !isMe && !submittedId && (
              <button style={{...S.btnP,padding:"12px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={submitCard}>
                Submit Card #{selHand+1}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── BOARD TAB ───────────────────────────────────── */}
      {tab==="board" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflowY:"auto",padding:"20px 16px",gap:16}}>
          {phase===1 && <div style={{textAlign:"center",padding:"12px",background:"var(--surf)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>Waiting for cards... ({boardCards.length}/{players.length} submitted)</div>}
          {phase===2 && isMe  && <div style={{textAlign:"center",padding:"12px",background:"var(--surf)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>Players are voting — you don't vote as Storyteller.</div>}
          {phase===2 && !isMe && !voteConfirmed && <div style={{textAlign:"center",padding:"12px",background:"color-mix(in srgb,var(--gold) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--gold) 25%,transparent)",borderRadius:12,fontSize:13}}>Which card do you think belongs to <span style={{color:"var(--gold)",fontWeight:600}}>{stName}</span>?</div>}
          {phase===2 && !isMe && voteConfirmed && <div style={{textAlign:"center",padding:"12px",background:"var(--surf)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>Vote cast ✓ — waiting for everyone...</div>}
          {phase===3 && <div style={{textAlign:"center",padding:"12px",background:"color-mix(in srgb,var(--gold) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--gold) 25%,transparent)",borderRadius:12,fontSize:13}}>Cards revealed! <span style={{color:"#C9952A",fontWeight:600}}>{stName}</span>'s card is highlighted.</div>}

          {boardCards.length===0 && <div style={{textAlign:"center",color:"var(--muted)",fontSize:13,marginTop:40}}>No cards yet.</div>}

          {boardCards.length>0 && activeBoard && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
              {/* Main focused card */}
              <div style={{cursor:"pointer"}} onClick={()=>setOverlay({type:"full-board",idx:focusBoard})}>
                {phase<=1
                  ? <CardBack size="lg"/>
                  : <Card card={activeBoard} size="lg" gold={activeBoard.isStoryteller&&phase===3} voteCount={phase===3?activeBoard.votes?.length||0:0}/>
                }
              </div>

              {/* Reveal info */}
              {phase===3 && (
                <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:14,fontWeight:700,color:activeBoard.isStoryteller?"#C9952A":"var(--text)"}}>
                    {activeBoard.owner}{activeBoard.isStoryteller?" ★":""}
                  </span>
                  {activeBoard.votes?.length>0
                    ? <span style={{fontSize:12,color:"#7AC87A",fontWeight:600}}>{activeBoard.votes.length} vote{activeBoard.votes.length!==1?"s":""} · {activeBoard.votes.join(", ")}</span>
                    : <span style={{fontSize:12,color:"var(--muted)"}}>No votes</span>
                  }
                </div>
              )}

              {/* Vote CTA */}
              {phase===2 && !voteConfirmed && !isMe && (
                activeBoard.isMyCard
                  ? <div style={{fontSize:13,color:"var(--muted)",textAlign:"center"}}>This is your card — you can't vote for it</div>
                  : <button style={{...S.btnP,padding:"12px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={()=>setOverlay({type:"vote",idx:focusBoard})}>Vote for this card</button>
              )}

              {/* End round button */}
              {phase===3 && isMe && !roundDeltas && (
                <button style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320,opacity:endLoading?0.6:1}} onClick={endRound} disabled={endLoading}>
                  {endLoading?"Calculating...":"End Round & See Scores"}
                </button>
              )}
              {phase===3 && !isMe && !roundDeltas && (
                <div style={{textAlign:"center",fontSize:12,color:"var(--muted)"}}>Waiting for {stName} to reveal scores...</div>
              )}

              {/* Thumbnail strip */}
              <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 0",maxWidth:"100%"}}>
                {boardCards.map((c,i)=>(
                  <div key={c.id||i} onClick={()=>setFocusBoard(i)} style={{cursor:"pointer",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{transform:focusBoard===i?"translateY(-4px)":"none",transition:"transform 0.18s",outline:c.isStoryteller&&phase===3?"3px solid #C9952A":focusBoard===i?"2px solid var(--gold)":"none",borderRadius:8,boxShadow:c.isStoryteller&&phase===3?"0 0 12px rgba(201,149,42,0.5)":"none"}}>
                      {phase<=1 ? <CardBack size="mini"/> : <Card card={c} size="mini"/>}
                    </div>
                    {phase===3 && (
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,maxWidth:60}}>
                        <span style={{fontSize:9,fontWeight:600,color:c.isStoryteller?"#C9952A":"var(--muted)",textAlign:"center",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{c.owner}{c.isStoryteller?" ★":""}</span>
                        {c.votes?.length>0
                          ? <span style={{fontSize:9,fontWeight:700,color:"#7AC87A",background:"rgba(20,50,20,0.9)",borderRadius:6,padding:"1px 5px"}}>{c.votes.length}v</span>
                          : <span style={{fontSize:8,color:"var(--muted)"}}>-</span>
                        }
                      </div>
                    )}
                    {votedId===c.id && phase===2 && <span style={{fontSize:9,color:"#7AC87A"}}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CLUE INPUT OVERLAY ──────────────────────────── */}
      {showingClueOverlay && (
        <div onClick={()=>setOverlay(null)} style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:300,padding:"20px 24px",gap:18,overflowY:"auto"}}>
          <div onClick={e=>e.stopPropagation()} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,width:"100%",maxWidth:380}}>
            <div onClick={()=>setOverlay({type:"full-hand",idx:selHand})} style={{cursor:"pointer"}}>
              <Card card={handCards[selHand]} size="lg"/>
            </div>
            <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"var(--gold)",textAlign:"center"}}>Your clue for this card</div>
            <input
              autoFocus
              style={{width:"100%",padding:"13px 18px",borderRadius:10,background:"var(--inputBg)",border:"1px solid color-mix(in srgb,var(--gold) 35%,transparent)",color:"var(--text)",fontSize:18,fontFamily:"Georgia,serif",textAlign:"center",outline:"none",boxSizing:"border-box"}}
              placeholder="Type your clue..."
              value={clueInput}
              onChange={e=>setClueInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&clueInput.trim()) confirmClue(); }}
            />
            <button onClick={confirmClue} style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10,width:"100%",opacity:clueInput.trim()?1:0.45,cursor:clueInput.trim()?"pointer":"default"}}>
              Confirm Clue
            </button>
            <div style={{fontSize:11,color:"var(--muted)"}}>Tap outside to cancel</div>
          </div>
        </div>
      )}

      {/* ── VOTE CONFIRM OVERLAY ────────────────────────── */}
      {showingVoteOverlay && voteOverlayCard && (
        <div onClick={()=>setOverlay(null)} style={{position:"fixed",inset:0,background:"var(--overlay)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:380,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
            <Card card={voteOverlayCard} size="lg"/>
            {voteOverlayCard.isMyCard
              ? <div style={{fontSize:14,color:"#C4622D",textAlign:"center"}}>This is your card — you can't vote for it</div>
              : <button style={{...S.btnP,padding:"14px",fontSize:15,borderRadius:10,width:"100%"}} onClick={()=>confirmVote(voteOverlayCard)}>Confirm Vote</button>
            }
            <div style={{fontSize:11,color:"var(--muted)"}}>Tap outside to cancel</div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN BOARD CARD ───────────────────────── */}
      {showingFullBoard && (
        <div onClick={()=>setOverlay(null)} style={{position:"fixed",inset:0,background:"var(--fullBg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:500,cursor:"pointer",gap:20,padding:24}}>
          <div style={{position:"absolute",bottom:20,fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Tap to close</div>
          {phase<=1
            ? <div style={{width:"min(68vw,calc(100vh*0.714))",height:"min(calc(68vw*1.4),100vh)",borderRadius:24,overflow:"hidden",background:"linear-gradient(145deg,#1A1208,#2D2010)",border:"2px solid rgba(201,149,42,0.15)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <div style={{position:"absolute",inset:0,opacity:0.1,backgroundImage:"repeating-linear-gradient(45deg,#C9952A 0,#C9952A 1px,transparent 1px,transparent 14px),repeating-linear-gradient(-45deg,#C9952A 0,#C9952A 1px,transparent 1px,transparent 14px)"}}/>
                <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                  <div style={{fontSize:64,opacity:0.3}}>🎴</div>
                  <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"rgba(201,149,42,0.35)"}}>Hidden</div>
                </div>
              </div>
            : <>
                <div style={{width:"min(68vw,calc(100vh*0.714))",height:"min(calc(68vw*1.4),100vh)",borderRadius:24,overflow:"hidden",background:fullBoardCard?.bg,border:fullBoardCard?.isStoryteller&&phase===3?"4px solid #C9952A":"2px solid rgba(201,149,42,0.2)",boxShadow:fullBoardCard?.isStoryteller&&phase===3?"0 0 40px rgba(201,149,42,0.4)":"none",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {fullBoardCard?.image_url
                      ? <img src={fullBoardCard.image_url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <span style={{fontSize:"clamp(100px,22vw,220px)",lineHeight:1}}>{fullBoardCard?.emoji}</span>
                    }
                  </div>
                  {phase===3 && fullBoardCard && (
                    <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <div style={{fontSize:18,fontWeight:700,color:fullBoardCard.isStoryteller?"#C9952A":"var(--text)"}}>{fullBoardCard.owner}{fullBoardCard.isStoryteller?" ★":""}</div>
                      {fullBoardCard.votes?.length>0
                        ? <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6,maxWidth:280}}>
                            {fullBoardCard.votes.map((v,i)=><span key={i} style={{fontSize:12,color:"var(--muted)",background:"var(--surf)",border:"1px solid var(--border)",borderRadius:20,padding:"3px 10px"}}>{v}</span>)}
                          </div>
                        : <div style={{fontSize:13,color:"var(--muted)"}}>No votes</div>
                      }
                    </div>
                  )}
              </>
          }
        </div>
      )}

      {/* ── FULLSCREEN HAND CARD ────────────────────────── */}
      {showingFullHand && fullHandCard && (
        <div onClick={()=>setOverlay(null)} style={{position:"fixed",inset:0,background:"var(--fullBg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:500,cursor:"pointer",gap:16,padding:24}}>
          <div style={{position:"absolute",bottom:20,fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Tap to close</div>
          <div style={{width:"min(68vw,calc(100vh*0.714))",height:"min(calc(68vw*1.4),100vh)",borderRadius:24,overflow:"hidden",background:fullHandCard.bg,border:"2px solid rgba(201,149,42,0.2)",boxShadow:"0 0 140px rgba(0,0,0,0.95)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            {fullHandCard.image_url
              ? <img src={fullHandCard.image_url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
              : <span style={{fontSize:"clamp(100px,22vw,220px)",lineHeight:1}}>{fullHandCard.emoji}</span>
            }
          </div>
          {phase===0 && isMe && (
            <button onClick={e=>{e.stopPropagation();setOverlay("clue");}} style={{...S.btnP,padding:"12px 32px",fontSize:15,borderRadius:10}}>Give a Clue for This Card</button>
          )}
        </div>
      )}

      {/* ── ROUND SUMMARY OVERLAY ───────────────────────── */}
      {roundDeltas && !winner && (
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:24}}>
          <div style={{maxWidth:420,width:"100%",display:"flex",flexDirection:"column",gap:16}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:"var(--gold)",textAlign:"center"}}>Round {round} Complete</div>
            <div style={{background:"var(--surf)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px",display:"flex",flexDirection:"column",gap:8}}>
              {[...scores].sort((a,b)=>b.score-a.score).map(s=>(
                <div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:14,color:s.name===stName?"var(--gold)":"var(--text)",fontWeight:s.name===stName?700:400}}>{s.name}{s.name===stName?" ★":""}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {roundDeltas[s.name]>0&&<span style={{fontSize:12,color:"#7AC87A",fontWeight:700}}>+{roundDeltas[s.name]}</span>}
                    <span style={{fontSize:16,fontWeight:700,fontFamily:"Georgia,serif",minWidth:28,textAlign:"right"}}>{s.score}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--muted)",textAlign:"center"}}>First to {winTarget} wins</div>
            <div style={{textAlign:"center"}}>
              <span style={{fontSize:12,color:"var(--muted)"}}>Next storyteller: </span>
              <span style={{fontSize:13,color:"var(--gold)",fontWeight:600}}>{nextSt}</span>
            </div>
            {isMe
              ? <button style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10}} onClick={nextRound}>
                  {turnInCycle===players.length?`Start Game Round ${gameRound+1}`:`Next Turn — ${nextSt}'s go`}
                </button>
              : <div style={{textAlign:"center",fontSize:12,color:"var(--muted)"}}>Waiting for {stName} to start the next turn...</div>
            }
          </div>
        </div>
      )}

      {/* ── WINNER ──────────────────────────────────────── */}
      {winner && (
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:450,padding:24}}>
          <div style={{maxWidth:420,width:"100%",display:"flex",flexDirection:"column",gap:20,alignItems:"center"}}>
            <div style={{fontSize:48}}>🏆</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:"var(--gold)",textAlign:"center"}}>{winner.names.join(" & ")} {winner.names.length>1?"win!":"wins!"}</div>
            <div style={{fontSize:14,color:"var(--muted)",textAlign:"center"}}>{winner.top} pts · First to {winTarget}</div>
            <div style={{background:"var(--surf)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px",width:"100%",display:"flex",flexDirection:"column",gap:8}}>
              {[...winner.scores].sort((a,b)=>b.score-a.score).map((s,i)=>(
                <div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:14,color:i===0?"var(--gold)":"var(--text)",fontWeight:i===0?700:400}}>{i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{s.name}</span>
                  <span style={{fontSize:16,fontWeight:700,fontFamily:"Georgia,serif",color:i===0?"var(--gold)":"var(--text)"}}>{s.score}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:12,width:"100%"}}>
              <button style={{...S.btnO,flex:1,padding:"12px"}} onClick={()=>go(SCREENS.LOBBY)}>Lobby</button>
              <button style={{...S.btnP,flex:1,padding:"12px"}} onClick={resetGame}>Play Again</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISBANDED ───────────────────────────────────── */}
      {disbanded && (
        <div style={{position:"fixed",inset:0,background:"var(--overlayDk)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:460,padding:24}}>
          <div style={{maxWidth:360,width:"100%",textAlign:"center",display:"flex",flexDirection:"column",gap:16,alignItems:"center"}}>
            <div style={{fontSize:40}}>😞</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:22,color:"var(--gold)"}}>Game Ended</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>Too many players left. Need at least 3 to continue.</div>
            <button style={{...S.btnP,padding:"13px 32px",fontSize:15}} onClick={()=>go(SCREENS.LANDING)}>Back to Home</button>
          </div>
        </div>
      )}

      {/* ── PLAYER BAR ──────────────────────────────────── */}
      <div style={{flexShrink:0,borderTop:"1px solid color-mix(in srgb,var(--gold) 8%,transparent)",background:"var(--hdr)",padding:"6px 16px",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--muted)",marginRight:4}}>Online</span>
        {scores.map(p=>(
          <div key={p.name} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:online[p.name]?"#4CAF50":"#C4622D",boxShadow:online[p.name]?"0 0 6px #4CAF5088":"none",flexShrink:0,transition:"all 0.5s"}}/>
            <span style={{fontSize:11,color:online[p.name]?"var(--text)":"var(--muted)",fontWeight:p.name===myName?600:400}}>{p.name}{p.name===myName?" (you)":""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [theme,    setTheme]    = useState("dark");
  const [isHost,   setIsHost]   = useState(false);
  const [screen,   setScreen]   = useState(sessionStorage.getItem("hk_screen")||SCREENS.LANDING);
  const [roomCode, setRoomCode] = useState(sessionStorage.getItem("hk_room")||"");
  const [myName,   setMyName]   = useState(sessionStorage.getItem("hk_name")||"");

  const go = (s) => {
    setScreen(s);
    sessionStorage.setItem("hk_screen",s);
    if (s===SCREENS.LANDING || s===SCREENS.LOBBY) {
      sessionStorage.removeItem("hk_room");
      sessionStorage.removeItem("hk_name");
      sessionStorage.removeItem("hk_screen");
    }
  };
  const saveCode = (c) => { setRoomCode(c); sessionStorage.setItem("hk_room",c); };
  const saveName = (n) => { setMyName(n);   sessionStorage.setItem("hk_name",n); };

  const t  = theme==="dark" ? DARK : LIGHT;
  const S  = mkS(t);
  const cv = CSS_VARS(t);

  return (
    <div style={{...S.root,...cv}}>
      {screen===SCREENS.LANDING && <Landing  go={go} S={S} theme={theme} setTheme={setTheme}/>}
      {screen===SCREENS.LOBBY   && <Lobby    go={go} S={S} setRoomCode={saveCode} setMyName={saveName} setIsHost={setIsHost}/>}
      {screen===SCREENS.WAITING && <Waiting  go={go} S={S} roomCode={roomCode} myName={myName} isHost={isHost}/>}
      {screen===SCREENS.GAME    && <Game     go={go} S={S} roomCode={roomCode} myName={myName}/>}
    </div>
  );
}
