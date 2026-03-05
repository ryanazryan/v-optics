"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Translation } from "@/lib/translations"
import type { VoiceAction } from "@/app/page"

export {}

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string; interimResults: boolean; maxAlternatives: number
    start(): void; stop(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
  }
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number; readonly results: SpeechRecognitionResultList
  }
  interface SpeechRecognitionErrorEvent extends Event { readonly error: string }
  interface SpeechRecognitionConstructor { new(): SpeechRecognition }
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface VoicePanelProps {
  t: Translation
  accent?: string
  onAction?: (action: VoiceAction) => void
}

const COMMAND_MAP = [
  {
    keywords: ["navigasi","navigation","maps","peta","arah","navigate","lokasi","location","gps","map"],
    action: { type: "navigate", feature: "nav" } as VoiceAction,
    label: { id: "Buka Navigasi", en: "Open Navigation" },
    icon: "◈",
    response: { id: "Membuka navigasi GPS...", en: "Opening GPS navigation..." },
  },
  {
    keywords: ["notif","notification","pemberitahuan","notifikasi","pesan","alert"],
    action: { type: "navigate", feature: "notify" } as VoiceAction,
    label: { id: "Buka Notifikasi", en: "Open Notifications" },
    icon: "◉",
    response: { id: "Membuka panel notifikasi...", en: "Opening notifications panel..." },
  },
  {
    keywords: ["terjemah","translate","translation","scan teks","baca teks","read text","ocr","bahasa"],
    action: { type: "navigate", feature: "translate" } as VoiceAction,
    label: { id: "Buka Terjemahan", en: "Open Translator" },
    icon: "◆",
    response: { id: "Membuka mode terjemahan kamera...", en: "Opening camera translator..." },
  },
  {
    keywords: ["ai","asisten","assistant","analisis","analyze","kamera ai","vision","lihat","see","gemini"],
    action: { type: "navigate", feature: "ai" } as VoiceAction,
    label: { id: "Buka AI Vision", en: "Open AI Vision" },
    icon: "⬡",
    response: { id: "Membuka AI Vision...", en: "Opening AI Vision..." },
  },
  {
    keywords: ["kesehatan","health","detak","jantung","heart","nadi","pulse","monitor"],
    action: { type: "navigate", feature: "health" } as VoiceAction,
    label: { id: "Buka Kesehatan", en: "Open Health" },
    icon: "♥",
    response: { id: "Membuka monitor kesehatan...", en: "Opening health monitor..." },
  },
  {
    keywords: ["deteksi","detect","detection","objek","object","yolo","kamera","camera","scan","identifikasi"],
    action: { type: "navigate", feature: "detect" } as VoiceAction,
    label: { id: "Buka Deteksi Objek", en: "Open Object Detection" },
    icon: "⬢",
    response: { id: "Membuka deteksi objek YOLOv8...", en: "Opening YOLOv8 object detection..." },
  },
  {
    keywords: ["sembunyikan","hide","bersih","clean","tutup hud","hide hud","tampilkan","show hud"],
    action: { type: "toggle_hide_ui" } as VoiceAction,
    label: { id: "Toggle Clean Mode", en: "Toggle Clean Mode" },
    icon: "👁",
    response: { id: "Mengubah mode tampilan HUD...", en: "Toggling HUD display mode..." },
  },
  {
    keywords: ["cafe","kafe","coffee","kopi","resto","restaurant","makan","food","tempat","nearby","terdekat"],
    action: { type: "search_nearby", query: "cafe restaurant" } as VoiceAction,
    label: { id: "Cari Tempat Terdekat", en: "Search Nearby Places" },
    icon: "📍",
    response: { id: "Membuka navigasi — mencari tempat terdekat...", en: "Opening navigation — searching nearby..." },
  },
  {
    keywords: ["spbu","bensin","fuel","gas","pertamina","pompa"],
    action: { type: "search_nearby", query: "fuel gas station" } as VoiceAction,
    label: { id: "Cari SPBU Terdekat", en: "Find Nearest Gas Station" },
    icon: "⛽",
    response: { id: "Mencari SPBU terdekat...", en: "Searching nearest gas station..." },
  },
  {
    keywords: ["rumah sakit","hospital","klinik","clinic","apotek","pharmacy","dokter","rs"],
    action: { type: "search_nearby", query: "hospital pharmacy" } as VoiceAction,
    label: { id: "Cari Faskes Terdekat", en: "Find Nearest Medical" },
    icon: "🏥",
    response: { id: "Mencari fasilitas kesehatan terdekat...", en: "Searching nearest medical facility..." },
  },
]

export function VoicePanel({ t, accent: accentProp, onAction }: VoicePanelProps) {
  const accent      = accentProp ?? "#00ffff"
  const accentDim   = `${accent}55`
  const accentFaint = `${accent}15`
  const lang        = (t as any).language ?? "id"

  const [status, setStatus] = useState<"idle"|"listening"|"result"|"error">("idle")
  const [transcript, setTranscript] = useState("")
  const [matchedEntry, setMatchedEntry] = useState<typeof COMMAND_MAP[0] | null>(null)
  const [typedRes, setTypedRes] = useState("")
  const [bars, setBars] = useState(Array(16).fill(4))
  const [errorMsg, setErrorMsg] = useState("")
  const [noMatch, setNoMatch] = useState(false)
  const recognitionRef = useRef<globalThis.SpeechRecognition | null>(null)
  const barsRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasSupport = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  const stopBars = useCallback(() => {
    if (barsRef.current) { clearInterval(barsRef.current); barsRef.current = null }
    setBars(Array(16).fill(4))
  }, [])

  const typeText = useCallback((text: string) => {
    setTypedRes(""); let i = 0
    const iv = setInterval(() => {
      setTypedRes(text.slice(0, i + 1)); i++
      if (i >= text.length) clearInterval(iv)
    }, 25)
  }, [])

  const matchCommand = useCallback((text: string) => {
    const lower = text.toLowerCase()
    let best: typeof COMMAND_MAP[0] | null = null; let bestScore = 0
    for (const entry of COMMAND_MAP) {
      const score = entry.keywords.filter(k => lower.includes(k)).length
      if (score > bestScore) { bestScore = score; best = entry }
    }
    return bestScore > 0 ? best : null
  }, [])

  const processTranscript = useCallback((text: string) => {
    const match = matchCommand(text)
    if (match) {
      setMatchedEntry(match); setNoMatch(false); setStatus("result")
      typeText(lang === "en" ? match.response.en : match.response.id)
      setTimeout(() => onAction?.(match.action), 300)
    } else {
      setMatchedEntry(null); setNoMatch(true); setStatus("result"); setTypedRes(text)
    }
  }, [matchCommand, typeText, onAction, lang])

  const startListening = useCallback(() => {
    if (!hasSupport) { setStatus("error"); setErrorMsg("Browser tidak mendukung voice recognition"); return }
    try { recognitionRef.current?.stop() } catch {}
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = lang === "en" ? "en-US" : "id-ID"
    recognition.interimResults = true; recognition.maxAlternatives = 5
    setStatus("listening"); setTranscript(""); setMatchedEntry(null); setTypedRes(""); setErrorMsg(""); setNoMatch(false)
    barsRef.current = setInterval(() => setBars(Array(16).fill(0).map(() => 4 + Math.random() * 28)), 80)
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      setTranscript(final || interim)
    }
    recognition.onend = () => {
      stopBars()
      setTranscript(prev => { if (prev) processTranscript(prev); else setStatus("idle"); return prev })
    }
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      stopBars()
      if (e.error === "not-allowed") { setStatus("error"); setErrorMsg("Izin mikrofon ditolak — aktifkan di browser") }
      else if (e.error === "no-speech") setStatus("idle")
      else { setStatus("error"); setErrorMsg("Terjadi kesalahan. Coba lagi.") }
    }
    try { recognition.start() } catch { stopBars(); setStatus("error"); setErrorMsg("Gagal memulai voice recognition") }
  }, [hasSupport, lang, stopBars, processTranscript])

  const triggerQuick = useCallback((entry: typeof COMMAND_MAP[0]) => {
    stopBars()
    setTranscript(lang === "en" ? entry.label.en : entry.label.id)
    setMatchedEntry(entry); setNoMatch(false); setStatus("result")
    typeText(lang === "en" ? entry.response.en : entry.response.id)
    setTimeout(() => onAction?.(entry.action), 300)
  }, [stopBars, typeText, onAction, lang])

  useEffect(() => () => { stopBars(); try { recognitionRef.current?.stop() } catch {} }, [stopBars])

  return (
    <div className="flex flex-col gap-4">

      {/* Mic button */}
      <div className="flex flex-col items-center gap-2.5">
        <button onClick={startListening} disabled={status === "listening"}
          className="w-18 h-18 rounded-full flex items-center justify-center relative transition-all duration-300"
          style={{
            cursor: status === "listening" ? "not-allowed" : "pointer",
            background: status === "listening" ? `${accent}30` : accentFaint,
            border: `2px solid ${status === "listening" ? accent : status === "error" ? "#f44" : accentDim}`,
            boxShadow: status === "listening" ? `0 0 30px ${accent}55` : `0 0 10px ${accent}22`,
          }}>
          {status === "listening" && (
            <div className="absolute rounded-full" style={{ inset:-6, border:`2px solid ${accent}33`, animation:"ripple 1s ease-out infinite" }}/>
          )}
          <span className="text-[26px]" style={{ filter: status==="listening" ? `drop-shadow(0 0 6px ${accent})` : "none" }}>🎤</span>
        </button>

        <div className="flex items-center gap-0.5 h-9">
          {bars.map((h, i) => (
            <div key={i} className="w-0.75 rounded-sm transition-[height] duration-75"
              style={{ background: accent, height: status==="listening" ? h : 4, opacity: status==="listening" ? 0.7 : 0.2 }}/>
          ))}
        </div>

        <div className="text-[10px] tracking-widest" style={{
          color: status==="listening" ? accent : status==="error" ? "#f44" : accentDim,
          textShadow: status==="listening" ? `0 0 8px ${accent}` : "none",
        }}>
          {status==="listening" ? (lang==="en"?"● LISTENING...":"● MENDENGARKAN...")
            : status==="error" ? "● ERROR"
            : (lang==="en"?"PRESS TO SPEAK":"TEKAN UNTUK BICARA")}
        </div>
      </div>

      {status==="listening" && transcript && (
        <div className="rounded-md text-[11px] italic text-center font-mono"
          style={{ padding:"8px 14px", border:`1px solid ${accentDim}`, background:accentFaint, color:`${accent}88` }}>
          {`"${transcript}"`}
        </div>
      )}

      {status==="error" && errorMsg && (
        <div className="rounded-md text-[11px] text-center" style={{ padding:"10px 14px", border:"1px solid rgba(255,68,68,0.2)", background:"rgba(255,60,60,0.06)", color:"#f88" }}>
          {errorMsg}
        </div>
      )}

      {status==="result" && (
        <div className="rounded-lg" style={{ padding:"12px 14px", border:`1px solid ${accentDim}`, background:accentFaint, animation:"fadeIn 0.3s ease" }}>
          {!noMatch ? (
            <>
              <div className="text-[9px] tracking-widest mb-2" style={{ color:accentDim }}>
                {lang==="en"?"COMMAND RECOGNIZED":"PERINTAH DIKENALI"}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize:18 }}>{matchedEntry?.icon}</span>
                <span className="text-xs font-bold" style={{ color:accent }}>
                  {lang==="en" ? matchedEntry?.label.en : matchedEntry?.label.id}
                </span>
              </div>
              <div className="text-[11px] leading-relaxed" style={{ color:"#0f8" }}>
                {typedRes}<span style={{ animation:"blink 0.8s infinite" }}>▌</span>
              </div>
              <div className="mt-2 text-[8px] tracking-widest" style={{ color:`${accent}55` }}>
                {(matchedEntry?.action as any)?.feature && `→ NAVIGASI KE: ${(matchedEntry?.action as any).feature.toUpperCase()}`}
                {(matchedEntry?.action as any)?.query && `→ MENCARI: ${(matchedEntry?.action as any).query}`}
                {matchedEntry?.action.type === "toggle_hide_ui" && "→ TOGGLE CLEAN MODE"}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs mb-1" style={{ color:"#cde" }}>{`"${transcript}"`}</div>
              <div className="text-[10px]" style={{ color:"#f80" }}>
                ⚠ {lang==="en"?"Not recognized. Try quick commands below.":"Tidak dikenali. Coba perintah cepat di bawah."}
              </div>
            </>
          )}
        </div>
      )}

      <div className="text-[9px] text-center font-mono" style={{ color:"#456" }}>
        {lang==="en"?"Say a command or tap below to control HUD directly":"Ucapkan atau ketuk perintah untuk kontrol HUD langsung"}
      </div>

      <div>
        <div className="text-[9px] tracking-widest mb-2" style={{ color:`${accent}44` }}>
          {lang==="en"?"QUICK COMMANDS":"PERINTAH CEPAT"}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {COMMAND_MAP.map((entry, i) => (
            <div key={i} onClick={() => triggerQuick(entry)}
              className="flex items-center gap-2 rounded-[5px] cursor-pointer transition-all duration-200"
              style={{ padding:"7px 10px", border:`1px solid ${accentDim}`, background:accentFaint }}
              onMouseEnter={e => (e.currentTarget.style.background = `${accent}20`)}
              onMouseLeave={e => (e.currentTarget.style.background = accentFaint)}>
              <span style={{ fontSize:13 }}>{entry.icon}</span>
              <span className="text-[10px] leading-tight" style={{ color:"#89a" }}>
                {lang==="en" ? entry.label.en : entry.label.id}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}