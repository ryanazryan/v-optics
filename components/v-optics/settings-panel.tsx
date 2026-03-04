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

export function SettingsPanel({ settings, setSettings, t }: SettingsPanelProps) {
  const toggle = (key: keyof HUDSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  const set = (key: keyof HUDSettings, val: string | number | boolean) =>
    setSettings((s) => ({ ...s, [key]: val }))

  return (
    <div className="flex flex-col gap-3">
      {/* Brightness */}
      <div
        className="rounded-lg"
        style={{
          padding: "12px 14px",
          border: "1px solid rgba(0,255,255,0.13)",
          background: "rgba(0,255,255,0.03)",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs" style={{ color: "#cde" }}>
            {t.brightness}
          </span>
          <span
            className="font-display text-[11px]"
            style={{ color: "#0ff" }}
          >
            {settings.brightness}%
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="100"
          value={settings.brightness}
          onChange={(e) => set("brightness", Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>

      {/* Language */}
      <div
        className="rounded-lg"
        style={{
          padding: "12px 14px",
          border: "1px solid rgba(0,255,255,0.13)",
          background: "rgba(0,255,255,0.03)",
        }}
      >
        <div className="text-xs mb-2" style={{ color: "#cde" }}>
          {t.language}
        </div>
        <div className="flex gap-2">
          {([["id", t.langID], ["en", t.langEN]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => set("language", val)}
              className="flex-1 font-mono text-[10px] tracking-wider rounded cursor-pointer transition-all duration-200"
              style={{
                padding: "7px",
                background:
                  settings.language === val
                    ? "rgba(0,255,255,0.12)"
                    : "transparent",
                border: `1px solid ${settings.language === val ? "#0ff" : "rgba(0,255,255,0.2)"}`,
                color:
                  settings.language === val
                    ? "#0ff"
                    : "rgba(0,255,255,0.4)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-1.75">
        {toggleKeys.map((key, i) => (
          <div
            key={key}
            onClick={() => toggle(key)}
            className="flex items-center justify-between rounded-md cursor-pointer transition-all duration-200"
            style={{
              padding: "9px 12px",
              border: `1px solid ${settings[key] ? "rgba(0,255,255,0.2)" : "rgba(0,255,255,0.07)"}`,
              background: settings[key]
                ? "rgba(0,255,255,0.06)"
                : "transparent",
            }}
          >
            <span
              className="text-[10px]"
              style={{ color: settings[key] ? "#cde" : "#567" }}
            >
              {t.settingToggles[i]}
            </span>
            <div
              className="relative shrink-0"
              style={{
                width: 28,
                height: 14,
                borderRadius: 7,
                background: settings[key]
                  ? "rgba(0,255,255,0.2)"
                  : "rgba(0,255,255,0.07)",
              }}
            >
              <div
                className="absolute rounded-full transition-[left] duration-200"
                style={{
                  width: 10,
                  height: 10,
                  background: settings[key] ? "#0ff" : "rgba(0,255,255,0.27)",
                  top: 2,
                  left: settings[key] ? 16 : 2,
                  boxShadow: settings[key] ? "0 0 4px #0ff" : "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="text-center text-[9px] tracking-wider mt-1 font-mono"
        style={{ color: "#345" }}
      >
        V-OPTICS SOFTWARE v1.0 · BUILD 2026.03
      </div>
    </div>
  )
}
