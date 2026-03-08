"use client"

import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"

interface SettingsPanelProps {
  settings: HUDSettings
  setSettings: React.Dispatch<React.SetStateAction<HUDSettings>>
  t: Translation
}

const PRESET_COLORS = [
  { color: "#00ffff", name: "Cyan"    },
  { color: "#00ff88", name: "Green"   },
  { color: "#ff00ff", name: "Magenta" },
  { color: "#ffaa00", name: "Orange"  },
  { color: "#4488ff", name: "Blue"    },
  { color: "#ff4444", name: "Red"     },
  { color: "#ffffff", name: "White"   },
]

const FEATURE_META: {
  key: keyof HUDSettings
  icon: string
  labelId: string
  labelEn: string
  descId: string
  descEn: string
  tabId?: string 
}[] = [
  {
    key: "navigation",
    icon: "◈", labelId: "Navigasi GPS", labelEn: "GPS Navigation",
    descId: "Peta & pencarian tempat terdekat", descEn: "Maps & nearby place search",
    tabId: "nav",
  },
  {
    key: "notifications",
    icon: "◉", labelId: "Notifikasi", labelEn: "Notifications",
    descId: "Panel notifikasi & pesan masuk", descEn: "Notification & message panel",
    tabId: "notify",
  },
  {
    key: "translation",
    icon: "◆", labelId: "Terjemahan", labelEn: "Translation",
    descId: "Terjemahan teks via kamera", descEn: "Camera text translation",
    tabId: "translate",
  },
  {
    key: "healthMonitor",
    icon: "♥", labelId: "Monitor Kesehatan", labelEn: "Health Monitor",
    descId: "Detak jantung, langkah, kalori", descEn: "Heart rate, steps, calories",
    tabId: "health",
  },
  {
    key: "objectDetect",
    icon: "⬢", labelId: "Deteksi Objek", labelEn: "Object Detection",
    descId: "AI deteksi & label objek real-time", descEn: "Real-time AI object labeling",
    tabId: "detect",
  },
  {
    key: "voiceControl",
    icon: "◍", labelId: "Chat AI / Voice", labelEn: "AI Chat / Voice",
    descId: "Kontrol suara & chatbot AI", descEn: "Voice control & AI chatbot",
    tabId: "voice",
  },
  {
    key: "nightMode",
    icon: "◐", labelId: "Mode Malam", labelEn: "Night Mode",
    descId: "Redupkan UI untuk malam hari", descEn: "Dim UI for night use",
  },
]

export function SettingsPanel({ settings, setSettings, t }: SettingsPanelProps) {
  const toggle = (key: keyof HUDSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  const set = (key: keyof HUDSettings, val: string | number | boolean) =>
    setSettings((s) => ({ ...s, [key]: val }))

  const lang        = settings.language ?? "id"
  const accent      = settings.accentColor ?? "#00ffff"
  const accentDim   = `${accent}55`
  const accentFaint = `${accent}15`

  const isOn = (key: keyof HUDSettings) => settings[key] as boolean

  return (
    <div className="flex flex-col gap-3" style={{ fontSize: 12 }}>
      <div style={{ padding:"11px 13px", border:`1px solid ${accentDim}`, borderRadius:8, background:accentFaint }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ color:"#cde", fontSize:11 }}>
            {lang === "en" ? "🔆 Brightness" : "🔆 Kecerahan"}
          </span>
          <span style={{ color:accent, fontSize:11, fontFamily:"monospace" }}>{settings.brightness}%</span>
        </div>
        <input
          type="range" min="30" max="100" value={settings.brightness}
          onChange={(e) => set("brightness", Number(e.target.value))}
          style={{ width:"100%", accentColor: accent, cursor:"pointer" }}
        />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          {[30,50,70,85,100].map(v => (
            <button key={v} onClick={() => set("brightness", v)}
              style={{
                fontSize:8, padding:"2px 5px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${settings.brightness === v ? accent : accentDim}`,
                background: settings.brightness === v ? `${accent}22` : "transparent",
                color: settings.brightness === v ? accent : accentDim,
              }}>
              {v}%
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"11px 13px", border:`1px solid ${accentDim}`, borderRadius:8, background:accentFaint }}>
        <div style={{ color:"#cde", fontSize:11, marginBottom:8 }}>
          {lang === "en" ? "🌐 Language" : "🌐 Bahasa"}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {([ ["id","🇮🇩 Indonesia"], ["en","🇬🇧 English"] ] as const).map(([val, label]) => (
            <button key={val} onClick={() => set("language", val)}
              style={{
                flex:1, padding:"7px 4px", borderRadius:6, cursor:"pointer",
                fontSize:10, fontFamily:"monospace", letterSpacing:0.5,
                background: settings.language === val ? `${accent}22` : "transparent",
                border:`1px solid ${settings.language === val ? accent : accentDim}`,
                color: settings.language === val ? accent : accentDim,
                transition:"all 0.15s",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"11px 13px", border:`1px solid ${accentDim}`, borderRadius:8, background:accentFaint }}>
        <div style={{ color:"#cde", fontSize:11, marginBottom:10 }}>
          {lang === "en" ? "🎨 Accent Color" : "🎨 Warna Aksen UI"}
        </div>
        <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
          {PRESET_COLORS.map(({ color, name }) => (
            <div key={color} onClick={() => set("accentColor", color)} title={name}
              style={{
                width:24, height:24, borderRadius:"50%", background:color,
                cursor:"pointer", flexShrink:0, transition:"all 0.15s",
                border: settings.accentColor === color ? "2.5px solid white" : "2px solid transparent",
                boxShadow: settings.accentColor === color ? `0 0 10px ${color}88` : "none",
              }}/>
          ))}
          <div style={{ position:"relative", width:24, height:24, flexShrink:0 }}>
            <div style={{
              width:24, height:24, borderRadius:"50%", overflow:"hidden", cursor:"pointer",
              background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
              border:"2px solid rgba(255,255,255,0.25)",
            }}>
              <input type="color" value={accent}
                onChange={(e) => set("accentColor", e.target.value)}
                title={lang === "en" ? "Custom color" : "Warna kustom"}
                style={{ opacity:0, position:"absolute", inset:0, width:"100%", height:"100%", cursor:"pointer" }}
              />
            </div>
          </div>
        </div>
        <div style={{ marginTop:8, fontSize:9, fontFamily:"monospace", color:accentDim, letterSpacing:1 }}>
          {lang === "en" ? "ACTIVE" : "AKTIF"}: <span style={{ color:accent }}>{accent.toUpperCase()}</span>
          <span style={{ marginLeft:12, padding:"1px 6px", borderRadius:20,
            background:`${accent}22`, color:accent, border:`1px solid ${accentDim}` }}>
            preview
          </span>
        </div>
      </div>

      <div onClick={() => toggle("hideUI")} style={{
        padding:"11px 13px", borderRadius:8, cursor:"pointer", transition:"all 0.2s",
        border:`1px solid ${settings.hideUI ? accent : accentDim}`,
        background: settings.hideUI ? `${accent}12` : "transparent",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color: settings.hideUI ? "#cde" : "#789",
              display:"flex", alignItems:"center", gap:6 }}>
              <span>👁</span>
              <span>{lang === "en" ? "Clean Mode" : "Mode Bersih"}</span>
              {settings.hideUI && (
                <span style={{ fontSize:8, padding:"1px 6px", borderRadius:20,
                  background:`${accent}22`, color:accent, border:`1px solid ${accentDim}`, marginLeft:4 }}>
                  ON
                </span>
              )}
            </div>
            <div style={{ fontSize:9, color:"#567", marginTop:3, lineHeight:1.5 }}>
              {lang === "en"
                ? "Hide topbar & tabs — full transparent view"
                : "Sembunyikan topbar & tab — tampilan transparan penuh"}
            </div>
          </div>
          <ToggleSwitch on={settings.hideUI} accent={accent} />
        </div>
      </div>

      <div style={{ color:"#789", fontSize:9, letterSpacing:1.5, marginBottom:-6, paddingLeft:2 }}>
        {lang === "en" ? "HUD FEATURES" : "FITUR HUD"} —
        <span style={{ color: accent, marginLeft:4 }}>
          {FEATURE_META.filter(f => isOn(f.key)).length}/{FEATURE_META.length} {lang === "en" ? "active" : "aktif"}
        </span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {FEATURE_META.map((feat) => {
          const on = isOn(feat.key)
          return (
            <div key={feat.key} onClick={() => toggle(feat.key)}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 13px", borderRadius:8, cursor:"pointer",
                transition:"all 0.18s",
                border:`1px solid ${on ? accentDim : "rgba(255,255,255,0.06)"}`,
                background: on ? accentFaint : "rgba(255,255,255,0.01)",
              }}>
              <div style={{
                width:30, height:30, borderRadius:8, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, transition:"all 0.18s",
                background: on ? `${accent}20` : "rgba(255,255,255,0.04)",
                border:`1px solid ${on ? accentDim : "rgba(255,255,255,0.07)"}`,
                color: on ? accent : "#456",
              }}>
                {feat.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color: on ? "#cde" : "#567",
                  fontWeight: on ? "600" : "normal", transition:"all 0.18s" }}>
                  {lang === "en" ? feat.labelEn : feat.labelId}
                </div>
                <div style={{ fontSize:8.5, color: on ? accentDim : "#345",
                  marginTop:1, lineHeight:1.4, transition:"all 0.18s" }}>
                  {lang === "en" ? feat.descEn : feat.descId}
                  {feat.tabId && !on && (
                    <span style={{ marginLeft:5, color:"#f87" }}>
                      · {lang === "en" ? "tab hidden" : "tab tersembunyi"}
                    </span>
                  )}
                </div>
              </div>
              <ToggleSwitch on={on} accent={accent} />
            </div>
          )
        })}
      </div>

      {settings.nightMode && (
        <div style={{ padding:"8px 12px", borderRadius:6, fontSize:9,
          background:"rgba(255,150,0,0.07)", border:"1px solid rgba(255,150,0,0.2)",
          color:"#fb7", lineHeight:1.5 }}>
          🌙 {lang === "en"
            ? "Night Mode is ON — UI dimmed for low-light use."
            : "Mode Malam aktif — UI diredupkan untuk penggunaan cahaya rendah."}
        </div>
      )}

      <div style={{ textAlign:"center", fontSize:8, letterSpacing:1.5,
        color:"#345", fontFamily:"monospace", marginTop:4 }}>
        V-OPTICS SOFTWARE v1.0 · BUILD 2026.03
      </div>
    </div>
  )
}

function ToggleSwitch({ on, accent }: { on: boolean; accent: string }) {
  return (
    <div style={{
      width:34, height:18, borderRadius:9, flexShrink:0,
      background: on ? `${accent}44` : "rgba(255,255,255,0.08)",
      border:`1px solid ${on ? accent : "rgba(255,255,255,0.1)"}`,
      position:"relative", transition:"all 0.2s",
    }}>
      <div style={{
        position:"absolute", width:12, height:12, borderRadius:"50%",
        top:2, left: on ? 18 : 2, transition:"left 0.2s",
        background: on ? accent : "rgba(255,255,255,0.25)",
        boxShadow: on ? `0 0 6px ${accent}` : "none",
      }}/>
    </div>
  )
}