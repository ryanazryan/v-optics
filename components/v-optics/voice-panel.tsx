"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Translation } from "@/lib/translations"
import type { VoiceAction } from "@/app/page"

export {}

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean
    start(): void; stop(): void; abort(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onspeechstart: (() => void) | null
    onspeechend: (() => void) | null
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

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  action?: VoiceAction
  time: string
}

// Kirim transcript ke Claude untuk diproses sebagai perintah bebas
async function processWithClaude(transcript: string, lang: string): Promise<{
  reply: string
  action: VoiceAction
}> {
  const systemPrompt = lang === "en"
    ? `You are V-Optics, an AI assistant integrated in smart glasses HUD. 
The user speaks commands naturally. Your job:
1. Understand what they want
2. Reply briefly (max 2 sentences, conversational)
3. Return a JSON action to execute in the HUD

Available actions:
- {"type":"navigate","feature":"nav"} — open navigation/maps
- {"type":"navigate","feature":"notify"} — open notifications  
- {"type":"navigate","feature":"translate"} — open camera translator
- {"type":"navigate","feature":"ai"} — open AI vision camera
- {"type":"navigate","feature":"health"} — open health monitor
- {"type":"navigate","feature":"detect"} — open object detection
- {"type":"toggle_hide_ui"} — toggle clean mode (hide/show HUD)
- {"type":"search_nearby","query":"<search term>"} — search nearby places (cafe, hospital, gas station, etc)
- {"type":"none"} — just reply, no HUD action needed

Respond ONLY in this JSON format (no markdown):
{"reply":"<your response>","action":<action object>}`
    : `Kamu adalah V-Optics, asisten AI yang terintegrasi di HUD kacamata pintar.
Pengguna berbicara dengan perintah bebas. Tugasmu:
1. Pahami apa yang mereka inginkan
2. Balas singkat (maks 2 kalimat, seperti percakapan)
3. Return JSON action untuk dieksekusi di HUD

Aksi yang tersedia:
- {"type":"navigate","feature":"nav"} — buka navigasi/maps
- {"type":"navigate","feature":"notify"} — buka notifikasi
- {"type":"navigate","feature":"translate"} — buka kamera terjemahan
- {"type":"navigate","feature":"ai"} — buka AI vision kamera
- {"type":"navigate","feature":"health"} — buka monitor kesehatan
- {"type":"navigate","feature":"detect"} — buka deteksi objek
- {"type":"toggle_hide_ui"} — toggle clean mode (sembunyikan/tampilkan HUD)
- {"type":"search_nearby","query":"<kata pencarian>"} — cari tempat terdekat (cafe, rumah sakit, SPBU, dll)
- {"type":"none"} — hanya balas, tidak ada aksi HUD

Balas HANYA dalam format JSON ini (tanpa markdown):
{"reply":"<balasanmu>","action":<objek aksi>}`

  const res = await fetch("/api/claude-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${systemPrompt}\n\nUser said: "${transcript}"`,
      mode: "voice",
      textOnly: true, // signal ke route.ts bahwa tidak ada image
    })
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const raw = (data.result ?? "").replace(/```json|```/g, "").trim()

  try {
    const parsed = JSON.parse(raw)
    return {
      reply: parsed.reply ?? "Oke.",
      action: parsed.action ?? { type: "none" }
    }
  } catch {
    // Kalau Claude tidak return JSON valid, tetap tampilkan reply
    return { reply: raw || "Oke.", action: { type: "none" } }
  }
}

export function VoicePanel({ t, accent: accentProp, onAction }: VoicePanelProps) {
  const accent      = accentProp ?? "#00ffff"
  const accentDim   = `${accent}55`
  const accentFaint = `${accent}15`
  const lang        = (t as any).language ?? "id"

  const [autoMode, setAutoMode]     = useState(false)
  const [listening, setListening]   = useState(false)
  const [processing, setProcessing] = useState(false)
  const [interim, setInterim]       = useState("")
  const [chat, setChat]             = useState<ChatMessage[]>([])
  const [bars, setBars]             = useState(Array(20).fill(4))
  const [errorMsg, setErrorMsg]     = useState("")
  const [silenceTimer, setSilenceTimer] = useState<ReturnType<typeof setTimeout>|null>(null)

  const recognitionRef = useRef<globalThis.SpeechRecognition | null>(null)
  const barsRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRef        = useRef(false) // ref untuk akses di closure
  const chatEndRef     = useRef<HTMLDivElement>(null)

  const hasSupport = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // Sync autoRef dengan state
  useEffect(() => { autoRef.current = autoMode }, [autoMode])

  // Auto scroll chat ke bawah
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat])

  const addChat = useCallback((msg: Omit<ChatMessage, "id"|"time">) => {
    const id   = Date.now().toString()
    const time = new Date().toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })
    setChat(prev => [...prev.slice(-20), { ...msg, id, time }])
  }, [])

  const stopBars = useCallback(() => {
    if (barsRef.current) { clearInterval(barsRef.current); barsRef.current = null }
    setBars(Array(20).fill(4))
  }, [])

  const startBars = useCallback(() => {
    barsRef.current = setInterval(
      () => setBars(Array(20).fill(0).map(() => 4 + Math.random() * 32)), 70
    )
  }, [])

  // Proses transcript yang sudah final
  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 2) return
    setInterim("")
    setProcessing(true)

    addChat({ role: "user", text })

    try {
      const { reply, action } = await processWithClaude(text, lang)
      addChat({ role: "assistant", text: reply, action })

      // Eksekusi aksi di HUD
      if (action.type !== "none") {
        setTimeout(() => onAction?.(action), 200)
      }
    } catch {
      addChat({
        role: "assistant",
        text: lang === "en"
          ? "Sorry, I couldn't process that. Check your API connection."
          : "Maaf, tidak bisa memproses. Cek koneksi API."
      })
    }

    setProcessing(false)
  }, [lang, addChat, onAction])

  // Start recognition session
  const startRecognition = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang            = lang === "en" ? "en-US" : "id-ID"
    recognition.interimResults  = true
    recognition.maxAlternatives = 3
    recognition.continuous      = false // restart manual supaya lebih stabil

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = "", interimText = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript
        else interimText += e.results[i][0].transcript
      }
      setInterim(interimText)

      // Reset silence timer setiap ada speech
      if (silenceTimer) clearTimeout(silenceTimer)
      if (finalText) {
        setSilenceTimer(setTimeout(() => {
          processTranscript(finalText)
        }, 600)) // tunggu 600ms sebelum proses (jeda bicara)
      }
    }

    recognition.onspeechstart = () => {
      startBars()
    }

    recognition.onend = () => {
      stopBars()
      setListening(false)
      setInterim("")
      // Auto restart kalau mode auto masih aktif
      if (autoRef.current && !processing) {
        setTimeout(() => {
          if (autoRef.current) startRecognition()
        }, 300)
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      stopBars()
      if (e.error === "not-allowed") {
        setErrorMsg(lang === "en" ? "Microphone permission denied" : "Izin mikrofon ditolak")
        setAutoMode(false); autoRef.current = false
      } else if (e.error === "no-speech") {
        // Restart langsung kalau tidak ada suara
        if (autoRef.current) {
          setTimeout(() => { if (autoRef.current) startRecognition() }, 200)
        }
      }
      // Errors lain: restart
    }

    try {
      recognition.start()
      setListening(true)
      setErrorMsg("")
    } catch {
      setListening(false)
    }
  }, [lang, processing, startBars, stopBars, processTranscript, silenceTimer])

  // Toggle auto mode
  const toggleAuto = useCallback(() => {
    if (!hasSupport) {
      setErrorMsg(lang === "en"
        ? "Browser doesn't support voice. Use Chrome/Edge."
        : "Browser tidak support voice. Gunakan Chrome/Edge.")
      return
    }
    if (autoMode) {
      // Matikan
      autoRef.current = false
      setAutoMode(false)
      try { recognitionRef.current?.stop() } catch {}
      stopBars()
      setListening(false)
    } else {
      // Nyalakan
      setAutoMode(true)
      autoRef.current = true
      startRecognition()
    }
  }, [autoMode, hasSupport, lang, startRecognition, stopBars])

  // Manual tap to speak (single shot)
  const tapToSpeak = useCallback(() => {
    if (!hasSupport) return
    if (listening) {
      try { recognitionRef.current?.stop() } catch {}
      return
    }
    // Single shot — tidak auto restart
    autoRef.current = false
    startRecognition()
  }, [hasSupport, listening, startRecognition])

  // Cleanup
  useEffect(() => () => {
    autoRef.current = false
    stopBars()
    try { recognitionRef.current?.stop() } catch {}
    if (silenceTimer) clearTimeout(silenceTimer)
  }, [])

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%",minHeight:0}}>

      {/* ── Auto mode toggle ── */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {/* Auto listen toggle */}
        <div onClick={toggleAuto}
          style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"10px 14px",borderRadius:8,cursor:"pointer",transition:"all 0.2s",
            background:autoMode?`${accent}20`:accentFaint,
            border:`1px solid ${autoMode?accent:accentDim}`}}>
          <div>
            <div style={{fontSize:10,fontWeight:"bold",color:autoMode?accent:"#89a",letterSpacing:1}}>
              {autoMode
                ? (lang==="en"?"● AUTO LISTENING":"● AUTO MENDENGARKAN")
                : (lang==="en"?"AUTO LISTEN":"AUTO DENGARKAN")}
            </div>
            <div style={{fontSize:8,color:accentDim,marginTop:2}}>
              {autoMode
                ? (lang==="en"?"Tap to stop":"Ketuk untuk berhenti")
                : (lang==="en"?"Always on, no button needed":"Selalu aktif, tanpa tombol")}
            </div>
          </div>
          {/* Toggle switch */}
          <div style={{width:36,height:18,borderRadius:9,
            background:autoMode?`${accent}44`:accentDim,
            position:"relative",transition:"background 0.2s"}}>
            <div style={{position:"absolute",width:14,height:14,borderRadius:"50%",top:2,
              left:autoMode?20:2,transition:"left 0.2s",
              background:autoMode?accent:"#567",
              boxShadow:autoMode?`0 0 6px ${accent}`:"none"}}/>
          </div>
        </div>

        {/* Manual tap button */}
        <button onClick={tapToSpeak}
          style={{width:48,height:48,borderRadius:"50%",cursor:"pointer",
            background:listening?`${accent}30`:accentFaint,
            border:`2px solid ${listening?accent:accentDim}`,
            color:accent,fontSize:18,transition:"all 0.2s",flexShrink:0,
            boxShadow:listening?`0 0 20px ${accent}55`:"none",
            position:"relative",overflow:"hidden"}}>
          {listening && (
            <div style={{position:"absolute",inset:-4,borderRadius:"50%",
              border:`2px solid ${accent}44`,animation:"ripple 1s ease-out infinite"}}/>
          )}
          🎤
        </button>
      </div>

      {/* ── Waveform ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",
        gap:2,height:32,padding:"0 8px"}}>
        {bars.map((h,i) => (
          <div key={i} style={{
            width:3,borderRadius:2,transition:"height 0.07s ease",
            background:`linear-gradient(to top,${accent}88,${accent})`,
            height: listening ? h : autoMode ? 4 + Math.sin(Date.now()/300+i)*2 : 4,
            opacity: listening ? 0.8 : autoMode ? 0.3 : 0.15,
          }}/>
        ))}
      </div>

      {/* ── Status ── */}
      <div style={{textAlign:"center",fontSize:9,letterSpacing:2,minHeight:12,
        color: processing?"#ff0":listening?accent:autoMode?`${accent}66`:accentDim}}>
        {processing
          ? (lang==="en"?"⏳ PROCESSING...":"⏳ MEMPROSES...")
          : listening
            ? (lang==="en"?"● LISTENING — speak now":"● MENDENGARKAN — bicara sekarang")
            : autoMode
              ? (lang==="en"?"◌ WAITING FOR SPEECH...":"◌ MENUNGGU SUARA...")
              : (lang==="en"?"TAP MIC OR ENABLE AUTO":"KETUK MIC ATAU AKTIFKAN AUTO")}
      </div>

      {/* ── Interim transcript ── */}
      {interim && (
        <div style={{padding:"6px 10px",borderRadius:6,fontSize:10,fontStyle:"italic",
          color:`${accent}88`,border:`1px solid ${accentDim}`,background:accentFaint,
          textAlign:"center"}}>
          "{interim}..."
        </div>
      )}

      {/* ── Error ── */}
      {errorMsg && (
        <div style={{padding:"8px 12px",borderRadius:6,fontSize:10,color:"#f88",
          border:"1px solid rgba(255,80,80,0.3)",background:"rgba(255,60,60,0.06)"}}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── Chat history ── */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",
        gap:6,minHeight:0,paddingRight:2}}>
        {chat.length === 0 && (
          <div style={{textAlign:"center",color:accentDim,fontSize:9,
            letterSpacing:1,marginTop:12,lineHeight:1.8}}>
            {lang==="en"
              ? "Say anything — commands, questions, places nearby...\nV-Optics AI will understand and act."
              : "Ucapkan apa saja — perintah, pertanyaan, tempat terdekat...\nV-Optics AI akan memahami dan bertindak."}
          </div>
        )}

        {chat.map(msg => (
          <div key={msg.id} style={{
            display:"flex",flexDirection:"column",
            alignItems:msg.role==="user"?"flex-end":"flex-start",
            animation:"fadeIn 0.2s ease",
          }}>
            <div style={{
              maxWidth:"85%",padding:"7px 11px",borderRadius:msg.role==="user"?
                "12px 12px 2px 12px":"12px 12px 12px 2px",
              background:msg.role==="user"?`${accent}22`:accentFaint,
              border:`1px solid ${msg.role==="user"?accentDim:`${accent}22`}`,
            }}>
              <div style={{fontSize:10,lineHeight:1.5,
                color:msg.role==="user"?accent:"#cde"}}>
                {msg.text}
              </div>
              {/* Action badge */}
              {msg.action && msg.action.type !== "none" && (
                <div style={{marginTop:4,fontSize:7,letterSpacing:1,
                  color:`${accent}66`,display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:accent}}>▸</span>
                  {msg.action.type==="navigate" && `HUD → ${(msg.action as any).feature.toUpperCase()}`}
                  {msg.action.type==="search_nearby" && `NEARBY → ${(msg.action as any).query}`}
                  {msg.action.type==="toggle_hide_ui" && "TOGGLE CLEAN MODE"}
                </div>
              )}
            </div>
            <div style={{fontSize:7,color:accentDim,marginTop:2,
              marginLeft:msg.role==="user"?0:6,marginRight:msg.role==="user"?6:0}}>
              {msg.role==="user"?"You":"V-Optics AI"} · {msg.time}
            </div>
          </div>
        ))}
        <div ref={chatEndRef}/>
      </div>

      {/* ── Contoh perintah ── */}
      {chat.length === 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {(lang==="en"
            ? ["nearest cafe","open navigation","translate this text","detect objects","hide HUD","how's my health?"]
            : ["cafe terdekat","buka navigasi","terjemahkan teks ini","deteksi objek","sembunyikan HUD","cek kesehatan"]
          ).map(ex => (
            <div key={ex} onClick={() => processTranscript(ex)}
              style={{padding:"4px 10px",borderRadius:20,fontSize:8,cursor:"pointer",
                border:`1px solid ${accentDim}`,background:accentFaint,color:`${accent}88`,
                letterSpacing:0.5,transition:"all 0.15s"}}
              onMouseEnter={e=>(e.currentTarget.style.background=`${accent}20`)}
              onMouseLeave={e=>(e.currentTarget.style.background=accentFaint)}>
              {ex}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}