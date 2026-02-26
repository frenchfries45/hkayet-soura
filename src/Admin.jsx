import { useState, useRef, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL  || "https://kdenyavpathupgzouvas.supabase.co";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_swXuHERnmpPafNqlCZwb4A_zBRnRjvK";
const supabase = createClient(SUPA_URL, SUPA_KEY);

const C = {
  bg:"#1A1612", surface:"rgba(255,255,255,0.04)", border:"rgba(201,149,42,0.18)",
  gold:"#C9952A", goldFade:"rgba(201,149,42,0.12)", muted:"#7A6E62", cream:"#F5EFE4", red:"#C4622D",
};

const btn = (v="primary") => ({
  padding:"10px 22px", borderRadius:6, fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600,
  ...(v==="primary" ? {background:C.gold, color:"#1A1612", border:"none"} : {}),
  ...(v==="outline" ? {background:"transparent", color:C.gold, border:`1px solid ${C.gold}`} : {}),
  ...(v==="ghost"   ? {background:"transparent", color:C.muted, border:`1px solid rgba(122,110,98,0.25)`} : {}),
  ...(v==="danger"  ? {background:"transparent", color:C.red, border:`1px solid ${C.red}`} : {}),
});

const PACKS = ["Nature","City","Folklore","Memory","Uncategorised"];

const BG_COLORS = [
  "#2A1A0A","#1E2D1E","#0D1F2D","#2A2A1A","#1A1A2D",
  "#2D1A2D","#3D2B1F","#1A2010","#2D1020","#2D2010",
];

// ── Drop Zone ─────────────────────────────────────────────────
function DropZone({ onFiles }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const handle = files => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (valid.length) onFiles(valid);
  };
  return (
    <div
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files);}}
      onClick={()=>ref.current.click()}
      style={{border:`2px dashed ${drag?C.gold:"rgba(201,149,42,0.3)"}`,borderRadius:14,padding:"48px 24px",textAlign:"center",cursor:"pointer",background:drag?C.goldFade:"rgba(0,0,0,0.2)",transition:"all 0.2s"}}
    >
      <input ref={ref} type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      <div style={{fontSize:40,marginBottom:14,opacity:0.6}}>🖼️</div>
      <div style={{fontSize:15,color:C.cream,fontWeight:600,marginBottom:6}}>Drop card images here</div>
      <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>or click to browse · JPG, PNG, WebP<br/>Ideal: <strong style={{color:C.gold}}>800 × 1120 px · under 500 KB</strong></div>
    </div>
  );
}

// ── Queue Item ─────────────────────────────────────────────────
function QueueItem({ file, meta, onChange, onRemove, status, errorMsg }) {
  const [preview] = useState(() => URL.createObjectURL(file));
  return (
    <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.surface,border:`1px solid ${status==="done"?"#3A5E2A":status==="error"?C.red:status==="uploading"?C.gold:C.border}`,borderRadius:12,padding:"14px 16px"}}>
      <img src={preview} alt="" style={{width:52,height:73,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`,flexShrink:0}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
        <input value={meta.name} onChange={e=>onChange({...meta,name:e.target.value})} placeholder="Card name..."
          style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 12px",color:C.cream,fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}/>
        <select value={meta.pack} onChange={e=>onChange({...meta,pack:e.target.value})}
          style={{background:"#1A1612",border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 12px",color:C.cream,fontSize:12,fontFamily:"inherit",outline:"none",cursor:"pointer"}}>
          {PACKS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{fontSize:10,color:C.muted}}>{file.name} · {(file.size/1024).toFixed(0)} KB</div>
        {status==="uploading" && <div style={{fontSize:11,color:C.gold}}>⏳ Uploading...</div>}
        {status==="done"      && <div style={{fontSize:11,color:"#7AC87A"}}>✓ Saved successfully</div>}
        {status==="error"     && <div style={{fontSize:11,color:C.red}}>✕ {errorMsg||"Upload failed"}</div>}
      </div>
      {status!=="uploading" && <button onClick={onRemove} style={{...btn("ghost"),padding:"6px 10px",fontSize:16,border:"none",flexShrink:0}}>✕</button>}
    </div>
  );
}

// ── Card Item ──────────────────────────────────────────────────
function CardItem({ card, onDelete, onToggle }) {
  const [hov, setHov] = useState(false);
  const bg = BG_COLORS[Math.abs((card.id||"").charCodeAt(0)||0) % BG_COLORS.length];
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{borderRadius:12,overflow:"hidden",border:`1px solid ${hov?C.gold:C.border}`,transition:"all 0.2s",background:C.surface,opacity:card.active?1:0.5}}>
      <div style={{width:"100%",paddingBottom:"140%",position:"relative",background:bg}}>
        {card.image_url
          ? <img src={card.image_url} alt={card.name||""} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
              onError={e=>{e.target.style.display="none";}}/>
          : <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
              <span style={{fontSize:32,opacity:0.35}}>🖼️</span>
              <span style={{fontSize:9,color:C.muted,letterSpacing:1}}>NO IMAGE</span>
            </div>
        }
        {hov && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",gap:6,alignItems:"center",justifyContent:"center",flexWrap:"wrap",padding:8}}>
            <button onClick={()=>onToggle(card)} style={{...btn("ghost"),fontSize:11,padding:"5px 12px"}}>{card.active?"Hide":"Show"}</button>
            <button onClick={()=>onDelete(card)} style={{...btn("danger"),fontSize:11,padding:"5px 12px"}}>Delete</button>
          </div>
        )}
        {!card.active && <div style={{position:"absolute",top:8,right:8,fontSize:9,background:"rgba(0,0,0,0.8)",color:C.muted,padding:"2px 8px",borderRadius:4,letterSpacing:1}}>HIDDEN</div>}
      </div>
      <div style={{padding:"10px 12px"}}>
        <div style={{fontSize:12,fontWeight:600,color:C.cream,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{card.name||"Untitled"}</div>
        <div style={{fontSize:10,color:C.muted}}>{card.category||"Uncategorised"}</div>
      </div>
    </div>
  );
}

// ── Main Admin ─────────────────────────────────────────────────
export default function Admin() {
  const [view, setView]           = useState("library");
  const [cards, setCards]         = useState([]);
  const [queue, setQueue]         = useState([]);
  const [queueMeta, setQueueMeta] = useState([]);
  const [queueStatus, setQueueStatus] = useState([]);
  const [queueErrors, setQueueErrors] = useState([]);
  const [filterPack, setFilterPack]   = useState("All");
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [loading, setLoading]         = useState(true);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 4000);
  };

  const loadCards = async () => {
    const {data, error} = await supabase
      .from("cards")
      .select("id,name,image_url,category,active,created_at")
      .order("created_at", {ascending:false});
    if (error) {
      console.error("loadCards error:", error);
      showToast("Could not load cards: " + error.message, "danger");
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  useEffect(()=>{ loadCards(); }, []);

  const addFiles = files => {
    setQueue(q=>[...q,...files]);
    setQueueMeta(m=>[...m,...files.map(f=>({name:f.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," "), pack:"Uncategorised"}))]);
    setQueueStatus(s=>[...s,...files.map(()=>"idle")]);
    setQueueErrors(e=>[...e,...files.map(()=>"")]);
    setView("upload");
  };

  const removeFromQueue = i => {
    setQueue(q=>q.filter((_,j)=>j!==i));
    setQueueMeta(m=>m.filter((_,j)=>j!==i));
    setQueueStatus(s=>s.filter((_,j)=>j!==i));
    setQueueErrors(e=>e.filter((_,j)=>j!==i));
  };

  const setStatus = (i, status, errMsg="") => {
    setQueueStatus(s=>s.map((x,j)=>j===i?status:x));
    setQueueErrors(e=>e.map((x,j)=>j===i?errMsg:x));
  };

  const uploadAll = async () => {
    if (uploading) return;
    setUploading(true);
    let ok = 0;

    for (let i = 0; i < queue.length; i++) {
      if (queueStatus[i] === "done") { ok++; continue; }
      setStatus(i, "uploading");

      const file = queue[i];
      const ext  = file.name.split(".").pop().toLowerCase() || "jpg";
      const filename = Date.now() + "_" + Math.random().toString(36).slice(2,8) + "." + ext;

      // 1. Upload file to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from("cards")
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (storageErr) {
        console.error("Storage error:", storageErr);
        setStatus(i, "error", "Storage: " + storageErr.message);
        continue;
      }

      // 2. Get the public URL
      const { data: urlData } = supabase.storage.from("cards").getPublicUrl(filename);
      const imageUrl = urlData?.publicUrl;

      if (!imageUrl) {
        setStatus(i, "error", "Could not get image URL");
        continue;
      }

      // 3. Save to cards table
      const { error: dbErr } = await supabase.from("cards").insert({
        name:      queueMeta[i].name || file.name.replace(/\.[^.]+$/,""),
        image_url: imageUrl,
        category:  queueMeta[i].pack || "Uncategorised",
        active:    true,
      });

      if (dbErr) {
        console.error("DB error:", dbErr);
        setStatus(i, "error", "DB: " + dbErr.message);
        continue;
      }

      setStatus(i, "done");
      ok++;
    }

    setUploading(false);

    if (ok > 0) {
      showToast(ok + " card" + (ok > 1 ? "s" : "") + " saved to library");
      await loadCards();
      setTimeout(() => {
        setQueue([]); setQueueMeta([]); setQueueStatus([]); setQueueErrors([]);
        setView("library");
      }, 2000);
    } else {
      showToast("No cards saved — check errors above", "danger");
    }
  };

  const deleteCard = async card => {
    if (!window.confirm("Delete \"" + (card.name||"this card") + "\"? Cannot be undone.")) return;
    // Remove from storage
    if (card.image_url) {
      const parts = card.image_url.split("/object/public/cards/");
      if (parts[1]) await supabase.storage.from("cards").remove([parts[1]]);
    }
    const { error } = await supabase.from("cards").delete().eq("id", card.id);
    if (error) { showToast("Delete failed: " + error.message, "danger"); return; }
    setCards(c=>c.filter(x=>x.id!==card.id));
    showToast("Card deleted", "danger");
  };

  const toggleCard = async card => {
    const { error } = await supabase.from("cards").update({active:!card.active}).eq("id", card.id);
    if (error) { showToast("Update failed", "danger"); return; }
    setCards(c=>c.map(x=>x.id===card.id?{...x,active:!x.active}:x));
    showToast(card.active ? "Card hidden from game" : "Card visible in game");
  };

  const filtered = cards.filter(c =>
    (filterPack==="All" || c.category===filterPack) &&
    (c.name||"").toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = cards.filter(c=>c.active).length;
  const packCounts  = PACKS.reduce((a,p)=>{ a[p]=cards.filter(c=>c.category===p).length; return a; }, {});

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:C.bg,color:C.cream,minHeight:"100vh",display:"flex",flexDirection:"column"}}>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",borderBottom:`1px solid ${C.border}`,background:"rgba(26,22,18,0.97)",position:"sticky",top:0,zIndex:50,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:C.gold}}>Hikaye · حكاية</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:4,textTransform:"uppercase"}}>Admin — Card Manager</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{fontSize:12,color:C.muted,marginRight:8}}>{activeCount} active · {cards.length} total</div>
          <button onClick={()=>setView("library")} style={{...btn(view==="library"?"primary":"ghost"),fontSize:12,padding:"8px 18px"}}>📚 Library</button>
          <button onClick={()=>setView("upload")}  style={{...btn(view==="upload" ?"primary":"ghost"),fontSize:12,padding:"8px 18px"}}>
            ⬆ Upload{queue.length>0?" ("+queue.length+")":""}
          </button>
        </div>
      </nav>

      <div style={{flex:1,maxWidth:1100,width:"100%",margin:"0 auto",padding:"32px 24px",boxSizing:"border-box"}}>

        {/* UPLOAD VIEW */}
        {view==="upload" && (
          <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:680,margin:"0 auto"}}>
            <div>
              <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:8}}>Upload Cards</div>
              <h2 style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,margin:"4px 0 6px"}}>Add New Cards</h2>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Name each card and assign a pack before uploading.</p>
            </div>
            <DropZone onFiles={addFiles}/>
            {queue.length > 0 && (
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:13,color:C.muted}}>{queue.length} file{queue.length!==1?"s":""} ready</div>
                  {!uploading && <button style={{...btn("ghost"),fontSize:11,padding:"5px 12px"}} onClick={()=>{setQueue([]);setQueueMeta([]);setQueueStatus([]);setQueueErrors([]); }}>Clear all</button>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {queue.map((file,i)=>(
                    <QueueItem key={i} file={file} meta={queueMeta[i]} status={queueStatus[i]} errorMsg={queueErrors[i]}
                      onChange={m=>setQueueMeta(p=>p.map((x,j)=>j===i?m:x))}
                      onRemove={()=>removeFromQueue(i)}/>
                  ))}
                </div>
                <button
                  style={{...btn("primary"),padding:"14px",fontSize:15,borderRadius:10,opacity:uploading?0.7:1}}
                  onClick={uploadAll}
                  disabled={uploading}
                >
                  {uploading ? "Uploading... please wait" : "Upload " + queue.filter((_,i)=>queueStatus[i]!=="done").length + " Cards to Library"}
                </button>
              </>
            )}
          </div>
        )}

        {/* LIBRARY VIEW */}
        {view==="library" && (
          <div style={{display:"flex",flexDirection:"column",gap:24}}>
            {/* Stats */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                {label:"Total Cards",   value:cards.length,  target:120},
                {label:"Active in Game",value:activeCount,   target:cards.length},
                {label:"To Go",         value:Math.max(0,120-cards.length), target:null},
              ].map(s=>(
                <div key={s.label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 22px",flex:1,minWidth:120}}>
                  <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.muted,marginBottom:4}}>{s.label}</div>
                  <div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",color:C.cream}}>
                    {s.value}{s.target?<span style={{fontSize:13,color:C.muted,marginLeft:6}}>/ {s.target}</span>:null}
                  </div>
                  {s.target && <div style={{marginTop:8,height:3,borderRadius:2,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}><div style={{height:"100%",width:Math.min(100,(s.value/s.target)*100)+"%",background:C.gold,borderRadius:2}}/></div>}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search cards..."
                style={{flex:1,minWidth:180,padding:"9px 14px",borderRadius:8,background:"rgba(0,0,0,0.3)",border:`1px solid ${C.border}`,color:C.cream,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["All",...PACKS].map(p=>(
                  <button key={p} onClick={()=>setFilterPack(p)} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${filterPack===p?C.gold:C.border}`,background:filterPack===p?C.goldFade:"transparent",color:filterPack===p?C.gold:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                    {p}{p!=="All"&&packCounts[p]>0?" ("+packCounts[p]+")":""}
                  </button>
                ))}
              </div>
              <button style={{...btn("primary"),padding:"9px 18px",fontSize:12,marginLeft:"auto"}} onClick={()=>setView("upload")}>+ Add Cards</button>
            </div>

            {/* Grid */}
            {loading ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
                <div style={{fontSize:36,marginBottom:12,opacity:0.4}}>🎴</div>
                <div>Loading cards...</div>
              </div>
            ) : filtered.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
                <div style={{fontSize:36,marginBottom:12,opacity:0.4}}>🖼️</div>
                <div style={{fontSize:14}}>{cards.length===0?"No cards yet — upload your first card above":"No cards match your search"}</div>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:14}}>
                {filtered.map(card=>(
                  <CardItem key={card.id} card={card} onDelete={deleteCard} onToggle={toggleCard}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:toast.type==="danger"?"#3D1A10":"#1A2D1A",border:`1px solid ${toast.type==="danger"?C.red:"#3A5E2A"}`,color:toast.type==="danger"?"#E88060":"#7AC87A",padding:"12px 24px",borderRadius:30,fontSize:13,fontWeight:500,zIndex:600,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",whiteSpace:"nowrap"}}>
          {toast.type==="danger"?"✕ ":"✓ "}{toast.msg}
        </div>
      )}
    </div>
  );
}
