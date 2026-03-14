// lib/translations.ts — PATCH
// Replace your existing translations.ts with this file
// All UI text is now full English. Indonesian language option removed from HUD settings.

export type Translation = {
  brand: string
  navHome: string
  navDemo: string
  navPreorder: string
  introducing: string
  tagline: string
  heroDesc: string
  preorderBtn: string
  featureCards: { icon: string; title: string; desc: string }[]
  roadmapTitle: string
  roadmapSteps: { month: string; title: string; desc: string }[]
  footer: string
  hudTitle: string
  hudHint: string
  voiceTitle: string
  settingsTitle: string
  settingsHint: string
  tabHUD: string
  tabVoice: string
  tabSettings: string
  language: string
  // HUD internal strings
  navLabel: string
  notifLabel: string
  translateLabel: string
  aiLabel: string
  healthLabel: string
  detectLabel: string
  voiceLabel: string
  appsLabel: string
}

const en: Translation = {
  brand:        "V-OPTICS",
  navHome:      "HOME",
  navDemo:      "DEMO",
  navPreorder:  "DEMO",
  introducing:  "INTRODUCING",
  tagline:      "Smart Glasses · AI-Powered HUD",
  heroDesc:     "A wearable heads-up display that overlays real-time AI onto your field of vision. Navigation, translation, object detection, health monitoring — all without reaching for your phone.",
  preorderBtn:  "▶ LAUNCH DEMO",
  featureCards: [
    { icon:"🗺️", title:"Navigation",         desc:"Real-time GPS routing with Overpass maps. Turn-by-turn directions overlaid on your vision." },
    { icon:"🌐", title:"Live Translation",    desc:"Instant speech translation powered by V-AI. Speak in any language, read the translation in your HUD." },
    { icon:"🤖", title:"AI Vision",           desc:"V-AI analyzes your surroundings. Ask questions about what you see, get instant answers." },
    { icon:"❤️", title:"Health Monitor",      desc:"Real-time heart rate, SpO2, step counter and battery status from wearable sensors." },
    { icon:"🔍", title:"Object Detection",    desc:"AI identifies objects, people, and text in your field of view with bounding box overlays." },
    { icon:"🎙️", title:"Voice Control",       desc:"Hands-free control of every HUD feature. Natural language commands processed by AI." },
    { icon:"📰", title:"Live News Feed",      desc:"Curated news headlines from multiple sources, displayed directly in your HUD." },
    { icon:"⚙️", title:"Customizable HUD",   desc:"Adjust brightness, accent color, font size, and which features are active at any time." },
  ],
  roadmapTitle: "DEVELOPMENT ROADMAP",
  roadmapSteps: [
    { month:"Jan 2026", title:"Concept & Design",     desc:"Initial hardware design, component selection, and UI/UX prototyping." },
    { month:"Feb 2026", title:"Software Prototype",   desc:"HUD simulator, AI integration, voice control, and navigation system." },
    { month:"Mar 2026", title:"Hardware Assembly",    desc:"Raspberry Pi Zero 2W, beam splitter optics, and sensor integration." },
    { month:"Apr 2026", title:"Field Testing",        desc:"Real-world testing, latency optimization, and battery life improvements." },
    { month:"May 2026", title:"Public Demo",          desc:"Full prototype demonstration at Universitas Telkom." },
  ],
  footer:        "© 2026 V-OPTICS · NAUFAL FAIQ AZRYAN",
  hudTitle:      "HUD SIMULATOR",
  hudHint:       "Click the tabs below the HUD to switch features. All AI features require API keys in .env.local.",
  voiceTitle:    "VOICE CONTROL",
  settingsTitle: "SETTINGS",
  settingsHint:  "Settings are applied live to the HUD simulator above.",
  tabHUD:        "HUD",
  tabVoice:      "Voice",
  tabSettings:   "Settings",
  language:      "en",
  navLabel:      "Navigation",
  notifLabel:    "Notifications",
  translateLabel:"Translate",
  aiLabel:       "AI Vision",
  healthLabel:   "Health",
  detectLabel:   "Detect",
  voiceLabel:    "Voice",
  appsLabel:     "Apps",
}

// Export both as "en" and "id" so existing code that checks T["id"] still works
export const T: Record<string, Translation> = { en, id: en }
export default T