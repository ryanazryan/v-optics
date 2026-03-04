"use client"

import { useState, useEffect } from "react"
import { T } from "@/lib/translations"
import { defaultSettings, type HUDSettings } from "@/lib/types"
import { HUDSimulator } from "@/components/v-optics/hud-simulator"
import { VoicePanel } from "@/components/v-optics/voice-panel"
import { SettingsPanel } from "@/components/v-optics/settings-panel"
import {
  LandingSection,
  FeaturesSection,
  RoadmapSection,
} from "@/components/v-optics/landing-sections"
import { PreOrderModal } from "@/components/v-optics/preorder-modal"

function StarField() {
  const [stars, setStars] = useState<
    { id: number; left: string; top: string; size: number; opacity: number }[]
  >([])

  useEffect(() => {
    const generated = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() > 0.8 ? 2 : 1,
      opacity: Math.random() * 0.35 + 0.05,
    }))
    setStars(generated)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: "#0ff",
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  )
}

export default function VOpticsApp() {
  const [page, setPage] = useState<"home" | "demo">("home")
  const [hudTab, setHudTab] = useState<"hud" | "voice" | "settings">("hud")
  const [showPreorder, setShowPreorder] = useState(false)
  const [settings, setSettings] = useState<HUDSettings>(defaultSettings)

  const t = T[settings.language] || T.id

  const demoTabs = [
    { id: "hud" as const, label: t.tabHUD },
    { id: "voice" as const, label: t.tabVoice },
    { id: "settings" as const, label: t.tabSettings },
  ]

  return (
    <div
      className="min-h-screen relative font-sans"
      style={{ background: "#04080f", color: "#cde" }}
    >
      <StarField />

      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 flex justify-between items-center"
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid rgba(0,255,255,0.07)",
          background: "rgba(4,8,15,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="font-display font-black text-[15px] tracking-widest"
          style={{ color: "#0ff" }}
        >
          {t.brand}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(
            [
              ["home", t.navHome],
              ["demo", t.navDemo],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="font-mono text-[9px] tracking-widest rounded-sm cursor-pointer transition-all duration-200"
              style={{
                padding: "6px 14px",
                background: "transparent",
                border:
                  page === id
                    ? "1px solid #0ff"
                    : "1px solid transparent",
                color: page === id ? "#0ff" : "rgba(0,255,255,0.4)",
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowPreorder(true)}
            className="font-display text-[9px] tracking-widest rounded-sm cursor-pointer ml-1.5"
            style={{
              padding: "6px 14px",
              background: "rgba(0,255,255,0.1)",
              border: "1px solid #0ff",
              color: "#0ff",
            }}
          >
            {t.navPreorder}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-1">
        {page === "home" && (
          <>
            <LandingSection onPreorder={() => setShowPreorder(true)} t={t} />
            <FeaturesSection t={t} />
            <RoadmapSection t={t} />
            <footer
              className="text-center font-mono text-[10px]"
              style={{
                padding: "16px",
                borderTop: "1px solid rgba(0,255,255,0.07)",
                color: "#345",
              }}
            >
              {t.footer}
            </footer>
          </>
        )}

        {page === "demo" && (
          <div
            className="flex flex-col items-center gap-4"
            style={{ padding: "28px 20px" }}
          >
            {/* Demo tab switcher */}
            <div
              className="flex gap-1.5 rounded-md"
              style={{
                background: "rgba(0,255,255,0.04)",
                border: "1px solid rgba(0,255,255,0.13)",
                padding: 4,
              }}
            >
              {demoTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHudTab(tab.id)}
                  className="font-mono text-[9px] tracking-widest rounded cursor-pointer transition-all duration-200"
                  style={{
                    padding: "7px 18px",
                    background:
                      hudTab === tab.id
                        ? "rgba(0,255,255,0.12)"
                        : "transparent",
                    border:
                      hudTab === tab.id
                        ? "1px solid #0ff"
                        : "1px solid transparent",
                    color:
                      hudTab === tab.id
                        ? "#0ff"
                        : "rgba(0,255,255,0.4)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* HUD Tab */}
            {hudTab === "hud" && (
              <>
                <div
                  className="font-display text-[10px] tracking-[4px]"
                  style={{ color: "rgba(0,255,255,0.4)" }}
                >
                  {t.hudTitle}
                </div>
                <HUDSimulator settings={settings} t={t} />
                <div
                  className="font-mono text-[11px] text-center max-w-130"
                  style={{ color: "#456" }}
                >
                  {t.hudHint}
                </div>
              </>
            )}

            {/* Voice Tab */}
            {hudTab === "voice" && (
              <div className="w-full max-w-125">
                <div
                  className="font-display text-[10px] tracking-[4px] text-center mb-4"
                  style={{ color: "rgba(0,255,255,0.4)" }}
                >
                  {t.voiceTitle}
                </div>
                <div
                  className="rounded-xl"
                  style={{
                    padding: "24px",
                    border: "1px solid rgba(0,255,255,0.13)",
                    background: "rgba(0,255,255,0.02)",
                  }}
                >
                  <VoicePanel t={t} />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {hudTab === "settings" && (
              <div className="w-full max-w-140">
                <div
                  className="font-display text-[10px] tracking-[4px] text-center mb-4"
                  style={{ color: "rgba(0,255,255,0.4)" }}
                >
                  {t.settingsTitle}
                </div>
                <div
                  className="rounded-xl"
                  style={{
                    padding: "20px",
                    border: "1px solid rgba(0,255,255,0.13)",
                    background: "rgba(0,255,255,0.02)",
                  }}
                >
                  <SettingsPanel
                    settings={settings}
                    setSettings={setSettings}
                    t={t}
                  />
                </div>
                <div
                  className="font-mono text-[10px] text-center mt-2.5"
                  style={{ color: "#456" }}
                >
                  {t.settingsHint}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pre-order Modal */}
      {showPreorder && (
        <PreOrderModal onClose={() => setShowPreorder(false)} t={t} />
      )}
    </div>
  )
}
