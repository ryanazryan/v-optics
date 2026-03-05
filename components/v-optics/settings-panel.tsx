"use client"

import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"

interface SettingsPanelProps {
  settings: HUDSettings
  setSettings: React.Dispatch<React.SetStateAction<HUDSettings>>
  t: Translation
}

const toggleKeys: (keyof HUDSettings)[] = [
  "notifications",
  "navigation",
  "translation",
  "healthMonitor",
  "objectDetect",
  "voiceControl",
  "nightMode",
]

const PRESET_COLORS = [
  { color: "#00ffff", name: "Cyan" },
  { color: "#00ff88", name: "Green" },
  { color: "#ff00ff", name: "Magenta" },
  { color: "#ffaa00", name: "Orange" },
  { color: "#4488ff", name: "Blue" },
  { color: "#ff4444", name: "Red" },
  { color: "#ffffff", name: "White" },
]

export function SettingsPanel({ settings, setSettings, t }: SettingsPanelProps) {
  const toggle = (key: keyof HUDSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  const set = (key: keyof HUDSettings, val: string | number | boolean) =>
    setSettings((s) => ({ ...s, [key]: val }))

  const accent      = settings.accentColor ?? "#00ffff"
  const accentDim   = `${accent}55`
  const accentFaint = `${accent}15`

  return (
    <div className="flex flex-col gap-3">

      {/* ── Brightness ── */}
      <div className="rounded-lg" style={{ padding:"12px 14px", border:`1px solid ${accentDim}`, background:accentFaint }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs" style={{ color:"#cde" }}>{t.brightness}</span>
          <span className="font-display text-[11px]" style={{ color:accent }}>{settings.brightness}%</span>
        </div>
        <input
          type="range" min="30" max="100" value={settings.brightness}
          onChange={(e) => set("brightness", Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>

      {/* ── Language ── */}
      <div className="rounded-lg" style={{ padding:"12px 14px", border:`1px solid ${accentDim}`, background:accentFaint }}>
        <div className="text-xs mb-2" style={{ color:"#cde" }}>{t.language}</div>
        <div className="flex gap-2">
          {([["id", t.langID], ["en", t.langEN]] as const).map(([val, label]) => (
            <button key={val} onClick={() => set("language", val)}
              className="flex-1 font-mono text-[10px] tracking-wider rounded cursor-pointer transition-all duration-200"
              style={{
                padding:"7px",
                background: settings.language === val ? `${accent}20` : "transparent",
                border: `1px solid ${settings.language === val ? accent : accentDim}`,
                color: settings.language === val ? accent : accentDim,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Accent Color ── */}
      <div className="rounded-lg" style={{ padding:"12px 14px", border:`1px solid ${accentDim}`, background:accentFaint }}>
        <div className="text-xs mb-3" style={{ color:"#cde" }}>
          🎨 {t.language === "en" ? "Accent Color" : "Warna Aksen UI"}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {PRESET_COLORS.map(({ color, name }) => (
            <div
              key={color}
              onClick={() => set("accentColor", color)}
              title={name}
              style={{
                width: 26, height: 26, borderRadius: "50%",
                background: color, cursor: "pointer",
                border: settings.accentColor === color
                  ? "3px solid white"
                  : "2px solid transparent",
                boxShadow: settings.accentColor === color
                  ? `0 0 10px ${color}`
                  : "none",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            />
          ))}
          {/* Custom color picker */}
          <div style={{ position:"relative", width:26, height:26, flexShrink:0 }}>
            <div style={{
              width:26, height:26, borderRadius:"50%",
              background: `conic-gradient(red,yellow,lime,cyan,blue,magenta,red)`,
              border: "2px solid rgba(255,255,255,0.3)",
              cursor:"pointer", overflow:"hidden",
            }}>
              <input
                type="color"
                value={accent}
                onChange={(e) => set("accentColor", e.target.value)}
                title={t.language === "en" ? "Custom color" : "Warna kustom"}
                style={{
                  opacity: 0, position:"absolute", inset:0,
                  width:"100%", height:"100%", cursor:"pointer",
                }}
              />
            </div>
          </div>
        </div>
        {/* Preview warna aktif */}
        <div className="mt-2 text-[9px] font-mono" style={{ color: accentDim, letterSpacing:1 }}>
          {t.language === "en" ? "ACTIVE" : "AKTIF"}: <span style={{ color: accent }}>{accent.toUpperCase()}</span>
        </div>
      </div>

      {/* ── Hide HUD / Clean Mode ── */}
      <div
        onClick={() => toggle("hideUI")}
        className="rounded-lg cursor-pointer transition-all duration-200"
        style={{
          padding:"12px 14px",
          border: `1px solid ${settings.hideUI ? accent : accentDim}`,
          background: settings.hideUI ? `${accent}10` : "transparent",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: settings.hideUI ? "#cde" : "#567" }}>
              👁 {t.language === "en" ? "Clean Mode (Hide HUD)" : "Mode Bersih (Sembunyikan HUD)"}
            </div>
            <div className="text-[9px] mt-1" style={{ color: "#456", lineHeight:1.4 }}>
              {t.language === "en"
                ? "Hide topbar & tabs — see through the lens normally"
                : "Sembunyikan topbar & tab — lihat lewat lensa secara normal"}
            </div>
          </div>
          {/* Toggle switch */}
          <div className="relative shrink-0 ml-3" style={{ width:28, height:14, borderRadius:7,
            background: settings.hideUI ? `${accent}33` : "rgba(255,255,255,0.07)" }}>
            <div className="absolute rounded-full transition-[left] duration-200" style={{
              width:10, height:10,
              background: settings.hideUI ? accent : "rgba(255,255,255,0.2)",
              top:2, left: settings.hideUI ? 16 : 2,
              boxShadow: settings.hideUI ? `0 0 4px ${accent}` : "none",
            }}/>
          </div>
        </div>
      </div>

      {/* ── Feature Toggles ── */}
      <div className="grid grid-cols-2 gap-1.75">
        {toggleKeys.map((key, i) => (
          <div key={key} onClick={() => toggle(key)}
            className="flex items-center justify-between rounded-md cursor-pointer transition-all duration-200"
            style={{
              padding:"9px 12px",
              border: `1px solid ${settings[key] ? accentDim : "rgba(0,255,255,0.07)"}`,
              background: settings[key] ? accentFaint : "transparent",
            }}>
            <span className="text-[10px]" style={{ color: settings[key] ? "#cde" : "#567" }}>
              {t.settingToggles[i]}
            </span>
            <div className="relative shrink-0" style={{ width:28, height:14, borderRadius:7,
              background: settings[key] ? `${accent}20` : "rgba(0,255,255,0.07)" }}>
              <div className="absolute rounded-full transition-[left] duration-200" style={{
                width:10, height:10,
                background: settings[key] ? accent : "rgba(0,255,255,0.27)",
                top:2, left: settings[key] ? 16 : 2,
                boxShadow: settings[key] ? `0 0 4px ${accent}` : "none",
              }}/>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-[9px] tracking-wider mt-1 font-mono" style={{ color:"#345" }}>
        V-OPTICS SOFTWARE v1.0 · BUILD 2026.03
      </div>
    </div>
  )
}