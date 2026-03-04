"use client"

import { useState, useEffect } from "react"
import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"
import { HealthPanel } from "./health-panel"
import { DetectPanel } from "./detect-panel"

interface HUDSimulatorProps {
  settings: HUDSettings
  t: Translation
}

export function HUDSimulator({ settings, t }: HUDSimulatorProps) {
  const [time, setTime] = useState(new Date())
  const [scanLine, setScanLine] = useState(0)
  const [activeFeature, setActiveFeature] = useState("nav")
  const [transIdx, setTransIdx] = useState(0)
  const [aiText, setAiText] = useState("")

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const i = setInterval(() => setScanLine((p) => (p + 1) % 100), 28)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (activeFeature !== "translate") return
    const i = setInterval(
      () => setTransIdx((p) => (p + 1) % t.translations.length),
      2500
    )
    return () => clearInterval(i)
  }, [activeFeature, t])

  useEffect(() => {
    if (activeFeature !== "ai") {
      setAiText("")
      return
    }
    let i = 0
    setAiText("")
    const interval = setInterval(() => {
      setAiText(t.aiFullText.slice(0, i + 1))
      i++
      if (i >= t.aiFullText.length) clearInterval(interval)
    }, 35)
    return () => clearInterval(interval)
  }, [activeFeature, t])

  const fmt = (n: number) => String(n).padStart(2, "0")
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`

  const tabs = [
    { id: "nav", label: t.tabNav, icon: "\u25C8" },
    { id: "notify", label: t.tabNotif, icon: "\u25C9" },
    { id: "translate", label: t.tabTranslate, icon: "\u25C6" },
    { id: "ai", label: t.tabAI, icon: "\u2B21" },
    { id: "health", label: t.tabHealth, icon: "\u2665" },
    { id: "detect", label: t.tabDetect, icon: "\u2B22" },
  ]

  return (
    <div
      className="relative w-full max-w-205 overflow-hidden font-mono"
      style={{
        aspectRatio: "16/9",
        background:
          "linear-gradient(135deg,#04080f 0%,#0a1628 50%,#060c18 100%)",
        borderRadius: 16,
        border: "1px solid rgba(0,255,255,0.2)",
        boxShadow: "0 0 60px rgba(0,255,255,0.13),inset 0 0 80px rgba(0,0,0,0.13)",
        filter: `brightness(${settings?.brightness ?? 80}%)`,
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `linear-gradient(transparent ${scanLine - 1}%,rgba(0,255,255,0.025) ${scanLine}%,transparent ${scanLine + 1}%)`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.75) 100%)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          opacity: 0.035,
          backgroundImage:
            "linear-gradient(#0ff 1px,transparent 1px),linear-gradient(90deg,#0ff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-between items-center z-5"
        style={{
          padding: "7px 14px",
          borderBottom: "1px solid rgba(0,255,255,0.13)",
          background: "rgba(4,8,15,0.5)",
        }}
      >
        <div
          className="text-[9px] tracking-[3px]"
          style={{ color: "#0ff" }}
        >
          V-OPTICS HUD v1.0
        </div>
        <div
          className="text-xs font-bold tracking-[4px]"
          style={{ color: "#0ff", textShadow: "0 0 8px #0ff" }}
        >
          {timeStr}
        </div>
        <div className="flex gap-2.5 items-center">
          <span className="text-[9px] tracking-widest" style={{ color: "#0f8" }}>
            {t.active}
          </span>
          <span className="text-[9px]" style={{ color: "#ff0" }}>
            {"⚡"} 87%
          </span>
          <span className="text-[9px]" style={{ color: "rgba(0,255,255,0.4)" }}>
            {settings?.language === "en" ? "EN" : "ID"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="absolute bottom-0 left-0 right-0 flex z-5"
        style={{ borderTop: "1px solid rgba(0,255,255,0.13)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFeature(tab.id)}
            className="flex-1 font-mono text-[8px] tracking-[0.5px] cursor-pointer transition-all duration-200"
            style={{
              padding: "6px 2px",
              background:
                activeFeature === tab.id
                  ? "rgba(0,255,255,0.1)"
                  : "transparent",
              border: "none",
              borderRight: "1px solid rgba(0,255,255,0.07)",
              color: activeFeature === tab.id ? "#0ff" : "rgba(0,255,255,0.33)",
              textShadow:
                activeFeature === tab.id ? "0 0 6px #0ff" : "none",
            }}
          >
            <div className="text-[11px]">{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div
        className="absolute z-3 overflow-hidden"
        style={{
          top: 38,
          bottom: 44,
          left: 0,
          right: 0,
          padding: "12px 14px",
        }}
      >
        {/* Navigation */}
        {activeFeature === "nav" && (
          <div className="flex gap-3.5 h-full items-center">
            <div
              className="flex-1 h-full max-h-50 relative overflow-hidden rounded-md"
              style={{
                border: "1px solid rgba(0,255,255,0.2)",
                background: "linear-gradient(135deg,#040d1a,#081428)",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 200 200">
                <defs>
                  <pattern
                    id="mg4"
                    x="0"
                    y="0"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M20 0L0 0 0 20"
                      fill="none"
                      stroke="#0ff"
                      strokeWidth=".3"
                      opacity=".3"
                    />
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#mg4)" />
                <line x1="0" y1="100" x2="200" y2="100" stroke="#0ff" strokeWidth="2" opacity=".35" />
                <line x1="100" y1="0" x2="100" y2="200" stroke="#0ff" strokeWidth="2" opacity=".35" />
                <line x1="60" y1="0" x2="60" y2="200" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
                <line x1="140" y1="0" x2="140" y2="200" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
                <line x1="0" y1="60" x2="200" y2="60" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
                <line x1="0" y1="140" x2="200" y2="140" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
                <polyline
                  points="100,160 100,100 160,100 160,40"
                  fill="none"
                  stroke="#0f8"
                  strokeWidth="2.5"
                  opacity=".85"
                  strokeDasharray="6 3"
                >
                  <animate
                    attributeName="strokeDashoffset"
                    from="0"
                    to="-18"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </polyline>
                <circle cx="100" cy="160" r="6" fill="#0ff" opacity=".9">
                  <animate
                    attributeName="opacity"
                    values=".9;.4;.9"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx="100"
                  cy="160"
                  r="14"
                  fill="none"
                  stroke="#0ff"
                  strokeWidth="1"
                  opacity=".4"
                >
                  <animate
                    attributeName="r"
                    from="8"
                    to="22"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from=".5"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <polygon points="160,32 155,44 165,44" fill="#ff0" opacity=".9" />
              </svg>
            </div>
            <div className="flex-[1.3]">
              {t.navWaypoints.map((wp, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1.75"
                  style={{
                    borderBottom: "1px solid rgba(0,255,255,0.07)",
                    color: wp.active ? "#0ff" : "rgba(0,255,255,0.4)",
                  }}
                >
                  <div
                    className="w-1.75 h-1.75 rounded-full shrink-0"
                    style={{
                      background: wp.active ? "#0ff" : "rgba(0,255,255,0.2)",
                      boxShadow: wp.active ? "0 0 8px #0ff" : "none",
                    }}
                  />
                  <span className="flex-1 text-[11px]">{wp.label}</span>
                  {wp.dist && (
                    <span className="text-[10px]" style={{ color: "#ff0" }}>
                      {wp.dist}
                    </span>
                  )}
                </div>
              ))}
              <div
                className="mt-2.5 rounded-[5px] text-[10px] tracking-wider"
                style={{
                  padding: "7px 10px",
                  background: "rgba(0,255,0,0.07)",
                  border: "1px solid rgba(0,255,136,0.2)",
                  color: "#0f8",
                }}
              >
                {t.turnRight}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeFeature === "notify" && (
          <div className="flex flex-col gap-1.75 overflow-y-auto h-full">
            {t.notifications.map((n, i) => (
              <div
                key={n.id}
                className="flex items-start gap-2.5 rounded-[5px]"
                style={{
                  padding: "8px 10px",
                  background:
                    i === 0 ? "rgba(0,255,255,0.07)" : "transparent",
                  border: `1px solid ${i === 0 ? "rgba(0,255,255,0.27)" : "rgba(0,255,255,0.07)"}`,
                  animation: "fadeIn 0.3s ease",
                  animationDelay: `${i * 0.1}s`,
                  animationFillMode: "both",
                }}
              >
                <span
                  className="text-[13px]"
                  style={{
                    color:
                      n.type === "nav"
                        ? "#0ff"
                        : n.type === "ai"
                          ? "#f0f"
                          : n.type === "alert"
                            ? "#ff0"
                            : "#0f8",
                  }}
                >
                  {n.icon}
                </span>
                <span
                  className="flex-1 text-[11px] leading-relaxed"
                  style={{ color: "#cde" }}
                >
                  {n.msg}
                </span>
                <span
                  className="text-[9px] whitespace-nowrap"
                  style={{ color: "rgba(0,255,255,0.33)" }}
                >
                  {n.time}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Translate */}
        {activeFeature === "translate" && (
          <div className="flex flex-col items-center justify-center gap-3.5 h-full">
            <div
              className="w-[65%] relative flex items-center justify-center"
              style={{
                aspectRatio: "16/7",
                border: "2px solid rgba(0,255,255,0.33)",
                borderRadius: 5,
                background: "rgba(0,255,255,0.02)",
              }}
            >
              {([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([x, y], i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3"
                  style={{
                    top: y ? "auto" : 3,
                    bottom: y ? 3 : "auto",
                    left: x ? "auto" : 3,
                    right: x ? 3 : "auto",
                    borderTop: !y ? "2px solid #0ff" : "none",
                    borderBottom: y ? "2px solid #0ff" : "none",
                    borderLeft: !x ? "2px solid #0ff" : "none",
                    borderRight: x ? "2px solid #0ff" : "none",
                  }}
                />
              ))}
              <div
                className="absolute left-0 right-0 h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,#0ff,transparent)",
                  animation: "scanBeam 2s ease-in-out infinite",
                }}
              />
              <div
                className="text-[10px] tracking-widest"
                style={{ color: "rgba(0,255,255,0.4)" }}
              >
                {t.translating}
              </div>
            </div>
            <div
              className="w-[65%] text-center rounded-lg"
              style={{
                padding: "12px 16px",
                background: "rgba(0,255,255,0.05)",
                border: "1px solid rgba(0,255,255,0.2)",
              }}
            >
              <div
                className="text-[9px] tracking-widest mb-1.5"
                style={{ color: "rgba(0,255,255,0.33)" }}
              >
                {t.translations[transIdx].lang}
              </div>
              <div
                className="text-xs line-through mb-1"
                style={{ color: "rgba(255,255,255,0.33)" }}
              >
                {t.translations[transIdx].original}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: "#0ff", textShadow: "0 0 10px #0ff" }}
              >
                {t.translations[transIdx].translated}
              </div>
            </div>
          </div>
        )}

        {/* AI */}
        {activeFeature === "ai" && (
          <div className="flex flex-col gap-3 items-center justify-center h-full">
            <div
              className="w-14.5 h-14.5 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle,rgba(0,255,255,0.13) 0%,transparent 70%)",
              }}
            >
              <div
                className="w-11.5 h-11.5 rounded-full flex items-center justify-center"
                style={{
                  border: "2px solid #0ff",
                  boxShadow:
                    "0 0 20px #0ff,inset 0 0 20px rgba(0,255,255,0.13)",
                  animation: "orbPulse 2s ease-in-out infinite",
                }}
              >
                <span className="text-xl" style={{ color: "#0ff" }}>
                  {"\u2B21"}
                </span>
              </div>
            </div>
            <div
              className="w-[90%] min-h-12 rounded-lg text-[11px] leading-relaxed"
              style={{
                padding: "10px 14px",
                border: "1px solid rgba(0,255,255,0.2)",
                background: "rgba(0,255,255,0.04)",
                color: "#0ff",
              }}
            >
              <span className="mr-1.5" style={{ color: "rgba(0,255,255,0.33)" }}>
                {t.aiPrefix}
              </span>
              {aiText}
              <span style={{ animation: "blink 0.8s infinite" }}>{"\u258C"}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {t.aiQuickCmds.map((cmd) => (
                <div
                  key={cmd}
                  className="rounded-full text-[9px] cursor-pointer"
                  style={{
                    padding: "4px 10px",
                    border: "1px solid rgba(0,255,255,0.2)",
                    color: "rgba(0,255,255,0.53)",
                    background: "rgba(0,255,255,0.05)",
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health */}
        {activeFeature === "health" && <HealthPanel t={t} />}

        {/* Detect */}
        {activeFeature === "detect" && <DetectPanel t={t} />}
      </div>
    </div>
  )
}
