import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Supabase ───────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL  || "https://kdenyavpathupgzouvas.supabase.co";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_swXuHERnmpPafNqlCZwb4A_zBRnRjvK";
const supabase = createClient(SUPA_URL, SUPA_KEY);

const SCREENS = { LANDING:"landing", LOBBY:"lobby", WAITING:"waiting", GAME:"game" };

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
        <img src={card.image_url} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
      ) : (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{card?.emoji || "🎴"}</span>
        </div>
      )}
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
function Lobby({ go, S, setRoomCode, setMyName }) {
  const [tab, setTab]     = useState("create");
  const [name, setName]   = useState("");
  const [code, setCode]   = useState("");
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
    setMyName(name.trim());setRoomCode(newCode);go(SCREENS.WAITING);setLoading(false);
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
      await supabase.from("room_players").update({is_active:true}).eq("id",existing.id);
    } else {
      const {data:all} = await supabase.from("room_players").select("*").eq("room_code",upper);
      if(all&&all.length>=8){setError("Room is full (max 8 players).");setLoading(false);return;}
      await supabase.from("room_players").insert({room_code:upper,name:name.trim(),score:0,is_active:true});
    }
    setMyName(name.trim());setRoomCode(upper);
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
          <div style={{textAlign:"center",color:"var(--textMuted)",fontSize:12,margin:"20px 0"}}>or</div>
          <button style={{...S.btnG,width:"100%",padding:12}} onClick={()=>{navigator.clipboard?.writeText(window.location.href);}}>Copy Link</button>
        </div>
        <button style={{...S.btnG,marginTop:16,fontSize:13,border:"none",color:"var(--textMuted)"}} onClick={()=>go(SCREENS.LANDING)}>Back</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════
// WAITING ROOM
// ═════════════════════════════════════
function Waiting({ go, S, roomCode, myName }) {
  const [players, setPlayers] = useState([]);
  const [copied, setCopied]   = useState(false);

  const load = async () => {
    const {data} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
    if(data) setPlayers(data);
  };

  useEffect(()=>{
    if(!roomCode) return;
    load();
    const ch = supabase.channel(`wait:${roomCode}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:`room_code=eq.${roomCode}`},load)
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
          <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"var(--textMuted)",marginBottom:10}}>Room Code</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:48,color:"var(--gold)",letterSpacing:10,fontWeight:700,cursor:"pointer"}} onClick={()=>{navigator.clipboard?.writeText(roomCode);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>{roomCode}</div>
          <div style={{fontSize:12,color:"var(--textMuted)",marginTop:8}}>{copied?"Copied!":"Tap to copy · Share with friends"}</div>
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
          <button style={{...S.btnP,padding:"14px 40px",fontSize:15,opacity:players.length<3?0.4:1}} onClick={handleStart} disabled={players.length<3}>Start Game</button>
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
  const [votedFor, setVotedFor]         = useState(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [confirmExit, setConfirmExit]   = useState(false);
  const [showScores, setShowScores]     = useState(false);
  const [fullscreen, setFullscreen]     = useState(null);
  const [winner, setWinner]             = useState(null);
  const [roundDeltas, setRoundDeltas]   = useState(null);
  const [gameDisbanded, setGameDisbanded] = useState(false);
  const [players, setPlayers]           = useState([]);
  const [scores, setScores]             = useState([]);
  const [storytellerIdx, setStorytellerIdx] = useState(0);
  const [round, setRound]               = useState(1);
  const [handCards, setHandCards]       = useState([]);
  const [boardCards, setBoardCards]     = useState([]);
  const [submittedCardId, setSubmittedCardId] = useState(null);
  const [loading, setLoading]           = useState(true);

  const PLAYER_LIST  = players.map(p=>p.name);
  const WIN_TARGET   = PLAYER_LIST.length<=6?30:42;
  const STORYTELLER  = PLAYER_LIST[storytellerIdx%Math.max(PLAYER_LIST.length,1)]||"";
  const isStoryteller = myName===STORYTELLER;
  const gameRound    = Math.floor(storytellerIdx/Math.max(PLAYER_LIST.length,1))+1;
  const turnInCycle  = (storytellerIdx%Math.max(PLAYER_LIST.length,1))+1;
  const nextStoryteller = PLAYER_LIST[(storytellerIdx+1)%Math.max(PLAYER_LIST.length,1)]||"";
  const phaseLabels  = ["Clue","Submit","Vote","Reveal"];

  const loadBoard = async (currentRound) => {
    const r = currentRound||round;
    const {data:plays} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",r);
    if(!plays||plays.length===0){setBoardCards([]);return;}
    const {data:vs}   = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",r);
    const {data:room} = await supabase.from("rooms").select("storyteller_idx").eq("code",roomCode).single();
    const {data:ps}   = await supabase.from("room_players").select("name").eq("room_code",roomCode).eq("is_active",true);
    const stIdx = room?.storyteller_idx||0;
    const stName = ps?.[stIdx%Math.max(ps.length,1)]?.name||"";
    const cards = plays.map(play=>{
      const cd = FALLBACK_DECK.find(c=>c.id===play.card_id)||FALLBACK_DECK[0];
      return {...cd,owner:play.player_name,isStoryteller:play.player_name===stName,votes:vs?vs.filter(v=>v.voted_card_id===play.card_id).map(v=>v.voter_name):[]};
    });
    setBoardCards(shuffle(cards));
  };

  useEffect(()=>{
    if(!roomCode) return;
    const init = async ()=>{
      const {data:ps} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
      if(ps){setPlayers(ps);setScores(ps.map(p=>({name:p.name,score:p.score})));}
      const {data:room} = await supabase.from("rooms").select("*").eq("code",roomCode).single();
      if(room){
        setPhase(room.phase);setRound(room.round);setStorytellerIdx(room.storyteller_idx);
        if(room.clue) setConfirmedClue(room.clue);
        setGameTab(room.phase>=2?"board":"hand");
      }
      const {data:cards} = await supabase.from("cards").select("*").eq("active",true);
      const deck = (cards&&cards.length>=48)?cards:FALLBACK_DECK;
      const sdeck = shuffle(deck);
      const pIdx = ps?ps.findIndex(p=>p.name===myName):0;
      const start = Math.max(pIdx,0)*6;
      setHandCards(sdeck.slice(start,start+6));
      await loadBoard(room?.round||1);
      const {data:myPlay} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",room?.round||1).eq("player_name",myName).single();
      if(myPlay) setSubmittedCardId(myPlay.card_id);
      const {data:myVote} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",room?.round||1).eq("voter_name",myName).single();
      if(myVote){setVoteConfirmed(true);}
      setLoading(false);
    };
    init();

    const ch = supabase.channel(`game:${roomCode}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"rooms",filter:`code=eq.${roomCode}`},async(payload)=>{
        const r=payload.new;
        setPhase(r.phase);setStorytellerIdx(r.storyteller_idx);
        if(r.round!==round){setRound(r.round);setSubmittedCardId(null);setVoteConfirmed(false);setVotedFor(null);setRoundDeltas(null);setBoardCards([]);}
        if(r.clue) setConfirmedClue(r.clue); else setConfirmedClue("");
        setGameTab(r.phase>=2?"board":r.phase===0?"hand":gameTab);
        await loadBoard(r.round);
      })
      .on("postgres_changes",{event:"*",schema:"public",table:"card_plays",filter:`room_code=eq.${roomCode}`},()=>loadBoard())
      .on("postgres_changes",{event:"*",schema:"public",table:"votes",filter:`room_code=eq.${roomCode}`},()=>loadBoard())
      .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:`room_code=eq.${roomCode}`},async()=>{
        const {data:ps} = await supabase.from("room_players").select("*").eq("room_code",roomCode).eq("is_active",true);
        if(ps){setPlayers(ps);setScores(ps.map(p=>({name:p.name,score:p.score})));if(ps.length<3)setGameDisbanded(true);}
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[roomCode,myName]);

  // ── Actions ─────────────────────────────────────────────────
  const confirmClue = async ()=>{
    if(!clueText.trim()) return;
    const card = handCards[selHand];
    if(!card) return;
    await supabase.from("rooms").update({clue:clueText.trim(),phase:1}).eq("code",roomCode);
    const {data:existing} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",round).eq("player_name",myName).single();
    if(!existing) await supabase.from("card_plays").insert({room_code:roomCode,round,player_name:myName,card_id:card.id});
    setSubmittedCardId(card.id);
    setConfirmedClue(clueText);
  };

  const submitCard = async ()=>{
    const card = handCards[selHand];
    if(!card||submittedCardId) return;
    const {data:existing} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",round).eq("player_name",myName).single();
    if(existing){setSubmittedCardId(existing.card_id);return;}
    await supabase.from("card_plays").insert({room_code:roomCode,round,player_name:myName,card_id:card.id});
    setSubmittedCardId(card.id);
    const {data:plays} = await supabase.from("card_plays").select("*").eq("room_code",roomCode).eq("round",round);
    if(plays&&plays.length>=players.length) await supabase.from("rooms").update({phase:2}).eq("code",roomCode);
  };

  const confirmVote = async ()=>{
    if(boardOverlay===null) return;
    const card = boardCards[boardOverlay];
    if(!card||card.owner===myName) return;
    const {data:existing} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",round).eq("voter_name",myName).single();
    if(existing) return;
    await supabase.from("votes").insert({room_code:roomCode,round,voter_name:myName,voted_card_id:card.id});
    setVotedFor(boardOverlay);setVoteConfirmed(true);setBoardOverlay(null);
    const {data:vs} = await supabase.from("votes").select("*").eq("room_code",roomCode).eq("round",round);
    const nonST = players.filter(p=>p.name!==STORYTELLER);
    if(vs&&vs.length>=nonST.length) await supabase.from("rooms").update({phase:3}).eq("code",roomCode);
  };

  const endRound = async ()=>{
    const storytellerCard = boardCards.find(c=>c.isStoryteller);
    const correctVoters   = storytellerCard?storytellerCard.votes:[];
    const nonST = PLAYER_LIST.filter(p=>p!==STORYTELLER);
    const allOrNone = correctVoters.length===0||correctVoters.length===nonST.length;
    const deltas={};
    PLAYER_LIST.forEach(p=>{deltas[p]=0;});
    if(!allOrNone){
      deltas[STORYTELLER]=3;
      correctVoters.forEach(v=>{deltas[v]=(deltas[v]||0)+3;});
    } else {
      nonST.forEach(p=>{deltas[p]=(deltas[p]||0)+2;});
    }
    boardCards.filter(c=>!c.isStoryteller).forEach(c=>{if(c.votes.length>0)deltas[c.owner]=(deltas[c.owner]||0)+c.votes.length;});
    setRoundDeltas(deltas);
    const newScores = scores.map(s=>({...s,score:s.score+(deltas[s.name]||0)}));
    setScores(newScores);
    for(const s of newScores) await supabase.from("room_players").update({score:s.score}).eq("room_code",roomCode).eq("name",s.name);
    const top = Math.max(...newScores.map(s=>s.score));
    if(top>=WIN_TARGET) setWinner({names:newScores.filter(s=>s.score===top).map(w=>w.name),scores:newScores,topScore:top});
  };

  const nextRound = async ()=>{
    const newIdx = storytellerIdx+1;
    setRoundDeltas(null);setSubmittedCardId(null);setVotedFor(null);setVoteConfirmed(false);setClueText("");setBoardCards([]);
    await supabase.from("rooms").update({phase:0,round:round+1,storyteller_idx:newIdx,clue:null}).eq("code",roomCode);
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
          <div style={{display:"flex",gap:6,flexShrink:0,position:"relative",zIndex:10}}>
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
          <button key={tab} onClick={()=>setGameTab(tab)} style={{flex:1,padding:"10px 0",background:gameTab===tab?"var(--surfaceHi)":"transparent",borderBottom:gameTab===tab?"2px solid var(--gold)":"2px solid transparent",color:gameTab===tab?"var(--gold)":"var(--textMuted)",fontSize:12,letterSpacing:1,textTransform:"uppercase",border:"none",borderBottom:gameTab===tab?"2px solid var(--gold)":"2px solid transparent",cursor:"pointer",fontFamily:"inherit"}}>{tab}</button>
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
                <div key={i} onClick={()=>{setSelHand(i);if(phase===0&&isStoryteller)setFocusedHand(i);else setFullscreen({type:"hand",idx:i});}} style={{cursor:"pointer",flexShrink:0,transform:selHand===i?"translateY(-4px)":"none",transition:"transform 0.2s",outline:selHand===i?"2px solid #C9952A":"none",borderRadius:8,boxShadow:selHand===i?"0 4px 18px rgba(201,149,42,0.35)":"none"}}>
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
          {phase===2&&!voteConfirmed&&<div style={{textAlign:"center",padding:"14px",background:"color-mix(in srgb, var(--gold) 8%, transparent)",border:"1px solid color-mix(in srgb, var(--gold) 25%, transparent)",borderRadius:12,fontSize:13,color:"var(--text)"}}>Vote for the card you think belongs to {STORYTELLER}.</div>}
          {phase===2&&voteConfirmed&&<div style={{textAlign:"center",padding:"14px",background:"var(--surface)",borderRadius:12,fontSize:13,color:"var(--textMuted)"}}>Vote cast ✓ — waiting for everyone...</div>}
          {phase===3&&<div style={{textAlign:"center",padding:"14px",background:"color-mix(in srgb, var(--gold) 8%, transparent)",border:"1px solid color-mix(in srgb, var(--gold) 25%, transparent)",borderRadius:12,fontSize:13,color:"var(--text)"}}>Cards revealed! {STORYTELLER}'s card is highlighted in gold.</div>}

          {boardCards.length===0?(
            <div style={{textAlign:"center",color:"var(--textMuted)",fontSize:13,marginTop:40}}>No cards on the board yet.</div>
          ):(
            <>
              {activeBoardCard&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                  <div onClick={()=>setFullscreen({type:"board",idx:focusedBoard})} style={{cursor:"pointer",position:"relative"}}>
                    <CardFace card={activeBoardCard} size="large"
                      highlight={activeBoardCard.isStoryteller&&phase===3}
                      label={phase===3?activeBoardCard.owner:"Tap to expand"}
                      voteCount={phase===3?activeBoardCard.votes?.length:0}
                    />
                  </div>
                  {phase===2&&!voteConfirmed&&activeBoardCard.owner!==myName&&(
                    <button style={{...S.btnP,padding:"13px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={()=>setBoardOverlay(focusedBoard)}>Vote for this card</button>
                  )}
                  <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 0",maxWidth:"100%"}}>
                    {boardCards.map((c,i)=>(
                      <div key={i} onClick={()=>{setFocusedBoard(i);setFullscreen({type:"board",idx:i});}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",flexShrink:0}}>
                        <div style={{transform:focusedBoard===i?"translateY(-4px)":"none",transition:"transform 0.2s",outline:focusedBoard===i?(c.isStoryteller&&phase===3?"2px solid #C9952A":"2px solid var(--gold)"):"none",borderRadius:8}}>
                          <CardFace card={c} size="mini" />
                        </div>
                        {phase===3&&<span style={{fontSize:8,color:c.isStoryteller?"var(--gold)":"var(--textMuted)",textAlign:"center",maxWidth:52,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.owner}</span>}
                        {votedFor===i&&<span style={{fontSize:9,color:"#7AC87A"}}>✓</span>}
                      </div>
                    ))}
                  </div>
                  {phase===3&&isStoryteller&&!roundDeltas&&(
                    <button style={{...S.btnP,padding:"14px",fontSize:15,borderRadius:10,width:"100%",maxWidth:320}} onClick={endRound}>End Round and See Scores</button>
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
            <div onClick={()=>setFullscreen({type:"board",idx:boardOverlay})} style={{cursor:"pointer"}}>
              <CardFace card={boardCards[boardOverlay]} size="medium" label="Tap to expand" />
            </div>
            {phase===2&&boardCards[boardOverlay]?.owner!==myName&&(
              <button style={{...S.btnP,padding:"14px",fontSize:15,borderRadius:10,width:"100%"}} onClick={confirmVote}>Confirm Vote</button>
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
            <div style={{width:"min(68vw, calc(100vh * 0.714))",height:"min(calc(68vw * 1.4), 100vh)",borderRadius:24,overflow:"hidden",background:boardCards[fullscreen.idx]?.bg,border:boardCards[fullscreen.idx]?.isStoryteller?"3px solid #C9952A":"2px solid rgba(201,149,42,0.2)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 140px rgba(0,0,0,0.95)",zIndex:2,position:"relative"}}>
              {boardCards[fullscreen.idx]?.image_url
                ?<img src={boardCards[fullscreen.idx].image_url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                :<span style={{fontSize:"clamp(100px,22vw,220px)",lineHeight:1}}>{boardCards[fullscreen.idx]?.emoji}</span>
              }
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
                setWinner(null);
                const reset=players.map(p=>({...p,score:0}));
                for(const p of reset) await supabase.from("room_players").update({score:0}).eq("room_code",roomCode).eq("name",p.name);
                await supabase.from("rooms").update({phase:0,round:1,storyteller_idx:0,clue:null}).eq("code",roomCode);
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
    </div>
  );
}

// ═════════════════════════════════════
// APP ROOT
// ═════════════════════════════════════
export default function App() {
  const [screen, setScreen]       = useState(SCREENS.LANDING);
  const [themeName, setThemeName] = useState("dark");
  const [roomCode, setRoomCode]   = useState("");
  const [myName, setMyName]       = useState("");
  const S = makeS(THEMES[themeName]);
  return (
    <div style={{...S.root,"--bg":S.t.bg,"--surface":S.t.surface,"--surfaceHi":S.t.surfaceHi,"--border":S.t.border,"--borderHi":S.t.borderHi,"--text":S.t.text,"--textMuted":S.t.textMuted,"--gold":S.t.gold,"--overlay":S.t.overlay,"--overlayDk":S.t.overlayDk,"--fullBg":S.t.fullBg,"--inputBg":S.t.inputBg,"--phaseBg":S.t.phaseBg,"--headerBg":S.t.headerBg}}>
      {screen===SCREENS.LANDING&&<Landing  go={setScreen} S={S} themeName={themeName} setThemeName={setThemeName}/>}
      {screen===SCREENS.LOBBY  &&<Lobby    go={setScreen} S={S} setRoomCode={setRoomCode} setMyName={setMyName}/>}
      {screen===SCREENS.WAITING&&<Waiting  go={setScreen} S={S} roomCode={roomCode} myName={myName}/>}
      {screen===SCREENS.GAME   &&<Game     go={setScreen} S={S} roomCode={roomCode} myName={myName}/>}
    </div>
  );
}
