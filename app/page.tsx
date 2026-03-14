"use client"

import { useState, useEffect, useCallback } from "react"
import { T } from "@/lib/translations"
import { defaultSettings, type HUDSettings } from "@/lib/types"
import { HUDSimulator } from "@/components/v-optics/hud-simulator"
import { VoicePanel } from "@/components/v-optics/voice-panel"
import { SettingsPanel } from "@/components/v-optics/settings-panel"
import {
  GlassesHero,
  ProductSection,
  FeaturesSection,
  HowItWorksSection,
  RoadmapSection,
  CTASection,
} from "@/components/v-optics/landing-sections"

export type VoiceAction =
  | { type: "navigate"; feature: "nav"|"notify"|"translate"|"ai"|"health"|"detect"|"voice" }
  | { type: "search_nearby"; query: string }
  | { type: "toggle_hide_ui" }
  | { type: "toggle_setting"; key: keyof HUDSettings }
  | { type: "none" }

export default function VOpticsApp() {
  const [page,          setPage]          = useState<"home"|"demo">("home")
  const [hudTab,        setHudTab]        = useState<"hud"|"voice"|"settings">("hud")
  const [settings,      setSettings]      = useState<HUDSettings>(defaultSettings)
  const [activeFeature, setActiveFeature] = useState<string>("nav")
  const [voiceAction,   setVoiceAction]   = useState<VoiceAction>({ type:"none" })
  const [scrolled,      setScrolled]      = useState(false)

  const t = T[settings.language] || T.id

  useEffect(() => {
    document.documentElement.style.filter = `brightness(${settings.brightness}%)`
    return () => { document.documentElement.style.filter = "" }
  }, [settings.brightness])

  useEffect(() => {
    const c = settings.accentColor ?? "#00ffff"
    document.documentElement.style.setProperty("--accent", c)
  }, [settings.accentColor])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn, { passive:true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const handleVoiceAction = useCallback((action: VoiceAction) => {
    setVoiceAction(action)
    switch (action.type) {
      case "navigate":
        setHudTab("hud"); setActiveFeature(action.feature); break
      case "toggle_hide_ui":
        setSettings(s => ({ ...s, hideUI: !s.hideUI })); break
      case "toggle_setting":
        setSettings(s => ({ ...s, [action.key]: !s[action.key] })); break
      case "search_nearby":
        setHudTab("hud"); setActiveFeature("nav"); break
    }
  }, [])

  const goDemo = () => { setPage("demo"); window.scrollTo(0,0) }

  const demoTabs = [
    { id:"hud"      as const, label: t.tabHUD      },
    { id:"voice"    as const, label: t.tabVoice    },
    { id:"settings" as const, label: t.tabSettings },
  ]

  return (
    <div className="min-h-screen" style={{ background:"#000", color:"#fff" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center"
        style={{
          padding:"12px 24px",
          background: scrolled?"rgba(0,0,0,0.92)":"transparent",
          borderBottom: scrolled?"1px solid rgba(255,255,255,0.06)":"none",
          backdropFilter: scrolled?"blur(12px)":"none",
          transition:"all 0.3s ease",
        }}>
        {/* Logo */}
        <button onClick={() => { setPage("home"); window.scrollTo(0,0) }}
          className="font-black tracking-[4px] text-[14px] cursor-pointer"
          style={{ color:"#fff", fontFamily:"'Arial Black',sans-serif",
            background:"none", border:"none" }}>
          V-OPTICS
        </button>

        {/* Nav links + Demo CTA */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setPage("home"); window.scrollTo(0,0) }}
            className="font-mono text-[9px] tracking-[3px] cursor-pointer transition-all"
            style={{ background:"none", border:"none",
              color: page==="home"?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)" }}>
            HOME
          </button>

          {/* DEMO — prominent CTA button */}
          <button onClick={goDemo}
            className="font-mono text-[10px] tracking-[3px] font-bold cursor-pointer transition-all duration-200"
            style={{
              padding:"8px 22px",
              background: page==="demo"?"#fff":"transparent",
              border:"1.5px solid #fff",
              color: page==="demo"?"#000":"#fff",
              borderRadius:2,
              boxShadow: page==="demo"?"0 0 30px rgba(255,255,255,0.2)":"none",
            }}
            onMouseEnter={e=>{
              if(page!=="demo"){
                (e.currentTarget as HTMLElement).style.background="#fff"
                ;(e.currentTarget as HTMLElement).style.color="#000"
              }
            }}
            onMouseLeave={e=>{
              if(page!=="demo"){
                (e.currentTarget as HTMLElement).style.background="transparent"
                ;(e.currentTarget as HTMLElement).style.color="#fff"
              }
            }}>
            ▶ DEMO
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main>
        {page === "home" && (
          <>
            <GlassesHero onDemo={goDemo}/>
            <ProductSection t={t}/>
            <FeaturesSection t={t}/>
            <HowItWorksSection/>
            <RoadmapSection t={t}/>
            <CTASection onDemo={goDemo}/>
            <footer className="text-center font-mono text-[9px] tracking-[3px]"
              style={{ padding:"24px", borderTop:"1px solid rgba(255,255,255,0.05)",
                color:"rgba(255,255,255,0.15)" }}>
              © 2025 V-OPTICS · NAUFAL FAIQ AZRYAN
            </footer>
          </>
        )}

        {page === "demo" && (
          <div className="flex flex-col items-center gap-4"
            style={{ padding:"88px 20px 40px", minHeight:"100vh" }}>

            {/* Demo tab switcher */}
            <div className="flex gap-1 rounded"
              style={{ background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.1)", padding:4 }}>
              {demoTabs.map(tab => (
                <button key={tab.id} onClick={() => setHudTab(tab.id)}
                  className="font-mono text-[9px] tracking-[3px] rounded cursor-pointer transition-all"
                  style={{
                    padding:"7px 18px",
                    background: hudTab===tab.id?"rgba(255,255,255,0.12)":"transparent",
                    border: hudTab===tab.id?"1px solid rgba(255,255,255,0.3)":"1px solid transparent",
                    color: hudTab===tab.id?"#fff":"rgba(255,255,255,0.35)",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {hudTab === "hud" && (
              <>
                <div className="font-mono text-[9px] tracking-[5px]"
                  style={{ color:"rgba(255,255,255,0.2)" }}>{t.hudTitle}</div>
                <HUDSimulator
                  settings={settings} t={t}
                  activeFeature={activeFeature}
                  setActiveFeature={setActiveFeature}
                  voiceAction={voiceAction}
                  onVoiceActionDone={() => setVoiceAction({ type:"none" })}
                />
                <div className="font-mono text-[10px] text-center max-w-130"
                  style={{ color:"rgba(255,255,255,0.2)" }}>{t.hudHint}</div>
              </>
            )}

            {hudTab === "voice" && (
              <div className="w-full max-w-125">
                <div className="font-mono text-[9px] tracking-[5px] text-center mb-4"
                  style={{ color:"rgba(255,255,255,0.2)" }}>{t.voiceTitle}</div>
                <div className="rounded"
                  style={{ padding:"24px",
                    border:"1px solid rgba(255,255,255,0.08)",
                    background:"rgba(255,255,255,0.02)" }}>
                  <VoicePanel t={t} accent={settings.accentColor??"#00ffff"} onAction={handleVoiceAction}
                    theme={{
                      isLight:    settings.lightMode ?? false,
                      accent:     settings.accentColor ?? "#00ffff",
                      textPrimary: settings.lightMode ? "#111" : "rgba(210,225,240,0.9)",
                      bgCard:     settings.lightMode ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)",
                    }}/>
                </div>
              </div>
            )}

            {hudTab === "settings" && (
              <div className="w-full max-w-140">
                <div className="font-mono text-[9px] tracking-[5px] text-center mb-4"
                  style={{ color:"rgba(255,255,255,0.2)" }}>{t.settingsTitle}</div>
                <div className="rounded"
                  style={{ padding:"20px",
                    border:"1px solid rgba(255,255,255,0.08)",
                    background:"rgba(255,255,255,0.02)" }}>
                  <SettingsPanel settings={settings} setSettings={setSettings} t={t}/>
                </div>
                <div className="font-mono text-[9px] text-center mt-3"
                  style={{ color:"rgba(255,255,255,0.15)" }}>{t.settingsHint}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}