"use client"
import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"

interface SettingsPanelProps {
  settings: HUDSettings
  setSettings: React.Dispatch<React.SetStateAction<HUDSettings>>
  t: Translation
}

const PRESET_COLORS = [
  { color:"#00ffcc", name:"Cyan"    },
  { color:"#00aaff", name:"Blue"    },
  { color:"#a855f7", name:"Purple"  },
  { color:"#ff2266", name:"Red"     },
  { color:"#ffcc00", name:"Amber"   },
  { color:"#00ff88", name:"Green"   },
  { color:"#ff6622", name:"Orange"  },
]

const FEATURES = [
  { key:"navigation",    icon:"◈", en:"GPS Navigation",   id:"Navigasi GPS",      descEn:"Maps & search",          descId:"Peta & pencarian"         },
  { key:"notifications", icon:"◉", en:"Notifications",    id:"Notifikasi",         descEn:"System alerts",          descId:"Notifikasi sistem"        },
  { key:"translation",   icon:"◆", en:"Lens Translate",   id:"Terjemahan",         descEn:"Camera translate",       descId:"Terjemah via kamera"      },
  { key:"healthMonitor", icon:"♥", en:"Health Monitor",   id:"Monitor Kesehatan",  descEn:"Heart rate & activity",  descId:"Detak jantung & aktivitas"},
  { key:"objectDetect",  icon:"⬢", en:"Object Detection", id:"Deteksi Objek",      descEn:"AI object scan",         descId:"Scan objek AI"            },
  { key:"voiceControl",  icon:"◍", en:"AI Chat & Voice",  id:"Chat AI & Suara",    descEn:"Voice + chatbot",        descId:"Suara + chatbot"          },
] as const

export function SettingsPanel({ settings, setSettings, t }: SettingsPanelProps) {
  const toggle = (key: keyof HUDSettings) => setSettings(s=>({...s,[key]:!s[key]}))
  const set    = (key: keyof HUDSettings, val: any) => setSettings(s=>({...s,[key]:val}))

  const isLight = settings.lightMode ?? false
  const lang    = settings.language ?? "id"
  const ua      = settings.accentColor
  const accent  = ua ?? (isLight ? "#0066cc" : "#00ffcc")
  const accentDim  = `${accent}88`
  const accentFaint= `${accent}15`

  const bg    = isLight ? "#f0f4f8" : "#04080f"
  const bgCard= isLight ? "rgba(255,255,255,0.8)" : "rgba(0,255,200,0.03)"
  const bgInset= isLight? "rgba(0,100,180,0.06)" : "rgba(0,255,200,0.06)"
  const border= isLight ? `${accent}44` : `${accent}33`
  const text  = isLight ? "#0a2030" : "#d0f0e8"
  const textSub= isLight? "#2a5070" : "#7aabb0"
  const textMuted= isLight?"#5a8090":"#3a6870"

  const Section = ({title, children}:{title:string;children:React.ReactNode}) => (
    <div style={{marginBottom:8}}>
      <div style={{fontSize:7.5,color:accentDim,letterSpacing:3,padding:"4px 0 6px",
        fontFamily:"monospace"}}>{title}</div>
      <div style={{border:`1px solid ${border}`,borderRadius:4,overflow:"hidden",
        background:bgCard}}>
        {children}
      </div>
    </div>
  )

  const Row = ({label,sub,right,onClick}:{label:string;sub?:string;right:React.ReactNode;onClick?:()=>void}) => (
    <div onClick={onClick}
      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
        cursor:onClick?"pointer":"default",
        borderBottom:`1px solid ${border}`,transition:"background 0.15s"}}
      onMouseEnter={e=>onClick&&((e.currentTarget as HTMLElement).style.background=bgInset)}
      onMouseLeave={e=>onClick&&((e.currentTarget as HTMLElement).style.background="transparent")}>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:text,fontFamily:"monospace"}}>{label}</div>
        {sub&&<div style={{fontSize:7.5,color:textMuted,marginTop:2,letterSpacing:0.3}}>{sub}</div>}
      </div>
      {right}
    </div>
  )

  const Toggle = ({on}:{on:boolean}) => (
    <div style={{width:32,height:16,borderRadius:2,flexShrink:0,position:"relative",
      background:on?`${accent}33`:"transparent",
      border:`1px solid ${on?accent:border}`,
      boxShadow:on?`0 0 6px ${accent}55`:undefined,
      transition:"all 0.18s"}}>
      <div style={{position:"absolute",width:10,height:10,borderRadius:1,top:2,
        left:on?18:2,transition:"left 0.18s",
        background:on?accent:textMuted}}/>
    </div>
  )

  return (
    <div style={{
      fontFamily:"'Courier New',monospace",
      color:text,fontSize:10,
    }}>
      {/* ── Theme ── */}
      <Section title={lang==="en"?"DISPLAY":"TAMPILAN"}>
        <div style={{display:"flex",borderBottom:`1px solid ${border}`}}>
          {[["dark","🌙",lang==="en"?"DARK":"GELAP"],["light","☀️",lang==="en"?"LIGHT":"TERANG"]].map(([key,icon,label],i)=>{
            const active = key==="dark" ? !isLight : isLight
            return (
              <div key={key} onClick={()=>set("lightMode",key==="light")}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                  gap:4,padding:"12px 8px",cursor:"pointer",
                  background:active?accentFaint:"transparent",
                  borderRight:i===0?`1px solid ${border}`:"none",
                  borderBottom:active?`2px solid ${accent}`:"2px solid transparent",
                  transition:"all 0.15s"}}>
                <span style={{fontSize:16}}>{icon}</span>
                <span style={{fontSize:8,fontWeight:"bold",letterSpacing:2,
                  color:active?accent:textMuted}}>{label}</span>
              </div>
            )
          })}
        </div>
        <Row
          label={lang==="en"?"Brightness":"Kecerahan"}
          sub={`${settings.brightness}%`}
          right={
            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
              <input type="range" min="20" max="100" value={settings.brightness}
                onChange={e=>set("brightness",Number(e.target.value))}
                style={{width:90,accentColor:accent,cursor:"pointer"}}/>
              <div style={{display:"flex",gap:3}}>
                {[20,50,80,100].map(v=>(
                  <button key={v} onClick={e=>{e.stopPropagation();set("brightness",v)}}
                    style={{fontSize:6.5,padding:"1px 5px",borderRadius:2,cursor:"pointer",
                      border:`1px solid ${settings.brightness===v?accent:border}`,
                      background:settings.brightness===v?accentFaint:"transparent",
                      color:settings.brightness===v?accent:textMuted,fontFamily:"monospace"}}>{v}%</button>
                ))}
              </div>
            </div>
          }
        />
      </Section>

      {/* ── Language ── */}
      <Section title={lang==="en"?"LANGUAGE":"BAHASA"}>
        <div style={{display:"flex"}}>
          {([["id","🇮🇩","INDONESIA"],["en","🇬🇧","ENGLISH"]] as const).map(([v,flag,label],i)=>(
            <div key={v} onClick={()=>set("language",v)}
              style={{flex:1,display:"flex",alignItems:"center",gap:7,padding:"9px 12px",cursor:"pointer",
                background:settings.language===v?accentFaint:"transparent",
                borderRight:i===0?`1px solid ${border}`:"none",
                borderBottom:settings.language===v?`2px solid ${accent}`:"2px solid transparent",
                transition:"all 0.15s"}}>
              <span style={{fontSize:14}}>{flag}</span>
              <span style={{fontSize:9,color:settings.language===v?accent:textSub,
                fontWeight:settings.language===v?"bold":"normal",letterSpacing:1}}>{label}</span>
              {settings.language===v&&<div style={{marginLeft:"auto",
                fontSize:8,color:accent}}>◉</div>}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Accent ── */}
      <Section title={lang==="en"?"ACCENT COLOR":"WARNA AKSEN"}>
        <div style={{padding:"10px 12px"}}>
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
            {PRESET_COLORS.map(({color,name})=>(
              <div key={color} onClick={()=>set("accentColor",color)} title={name}
                style={{width:22,height:22,borderRadius:2,background:color,cursor:"pointer",flexShrink:0,
                  border:settings.accentColor===color?`2px solid #fff`:`1px solid ${color}88`,
                  boxShadow:settings.accentColor===color?`0 0 10px ${color}`:undefined,
                  transform:settings.accentColor===color?"scale(1.2)":"scale(1)",
                  transition:"all 0.15s"}}/>
            ))}
            <div style={{position:"relative",width:22,height:22,flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:2,overflow:"hidden",cursor:"pointer",
                background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
                border:`1px solid ${border}`}}>
                <input type="color" value={accent} onChange={e=>set("accentColor",e.target.value)}
                  style={{opacity:0,position:"absolute",inset:0,width:"100%",height:"100%",cursor:"pointer"}}/>
              </div>
            </div>
          </div>
          <div style={{fontSize:8,fontFamily:"monospace",letterSpacing:1,color:textMuted}}>
            {lang==="en"?"ACTIVE":"AKTIF"}{" "}
            <span style={{color:accent,textShadow:`0 0 8px ${accent}`}}>{accent.toUpperCase()}</span>
          </div>
        </div>
      </Section>

      {/* ── Visibility ── */}
      <Section title={lang==="en"?"DISPLAY MODE":"MODE TAMPILAN"}>
        <Row
          label={lang==="en"?"Clean Mode":"Mode Bersih"}
          sub={lang==="en"?"Hide topbar & tabs":"Sembunyikan topbar & tab"}
          right={<Toggle on={settings.hideUI??false}/>}
          onClick={()=>toggle("hideUI")}
        />
      </Section>

      {/* ── Features ── */}
      <Section title={lang==="en"?"HUD FEATURES":"FITUR HUD"}>
        {FEATURES.map((f,i)=>{
          const on = (settings as any)[f.key] !== false
          return (
            <div key={f.key} onClick={()=>toggle(f.key as keyof HUDSettings)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",
                borderBottom:i<FEATURES.length-1?`1px solid ${border}`:"none",
                background:"transparent",opacity:on?1:0.5,transition:"all 0.15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=bgInset}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent"}}>
              <div style={{width:24,height:24,borderRadius:2,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,
                background:on?accentFaint:bgInset,
                border:`1px solid ${on?accent:border}`,
                color:on?accent:textMuted,
                boxShadow:on?`0 0 6px ${accent}44`:undefined}}>
                {f.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9.5,color:on?text:textMuted,
                  fontWeight:on?"bold":"normal"}}>{lang==="en"?f.en:f.id}</div>
                <div style={{fontSize:7.5,color:textMuted,marginTop:1}}>
                  {lang==="en"?f.descEn:f.descId}
                  {!on&&<span style={{color:"#ff4466",marginLeft:5}}>· tab hidden</span>}
                </div>
              </div>
              <Toggle on={on}/>
            </div>
          )
        })}
      </Section>

      <div style={{textAlign:"center",fontSize:7,letterSpacing:3,
        color:textMuted,padding:"6px 0 2px",fontFamily:"monospace"}}>
        V-OPTICS · BUILD 2026.03 · UNIVERSITAS TELKOM
      </div>
    </div>
  )
}