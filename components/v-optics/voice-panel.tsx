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
async function processWithClaude(transcript: string, lang: string, chatHistory: {role:string,text:string}[]): Promise<{
  reply: string
  action: VoiceAction
}> {
  // Build conversation history untuk konteks
  const historyMessages = chatHistory.slice(-8).map(m => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text
  }))

  const systemPrompt = lang === "en"
    ? `You are V-Optics AI, a smart and friendly assistant integrated into smart glasses HUD.
You can do ANYTHING: answer questions, tell news, explain things, have conversations, give recommendations, tell jokes, help with tasks — just like ChatGPT but for smart glasses.

For HUD control, you ALSO return a JSON action. For normal conversation, use {"type":"none"}.

Available HUD actions:
- {"type":"navigate","feature":"home"} — open home/news feed
- {"type":"navigate","feature":"nav"} — open navigation/maps  
- {"type":"navigate","feature":"notify"} — open notifications
- {"type":"navigate","feature":"translate"} — open camera translator
- {"type":"navigate","feature":"ai"} — open AI vision camera
- {"type":"navigate","feature":"health"} — open health monitor
- {"type":"navigate","feature":"detect"} — open object detection
- {"type":"navigate","feature":"voice"} — open voice chat
- {"type":"toggle_hide_ui"} — toggle clean/HUD mode
- {"type":"search_nearby","query":"<place>"} — search nearby places
- {"type":"none"} — just chat, no HUD action

Personality: warm, smart, concise. Max 3 sentences per reply unless explaining something complex.
If asked about news/current events, give a brief informative answer based on your knowledge.
Reply in the same language the user uses.

Respond ONLY in this JSON (no markdown):
{"reply":"<your response>","action":<action object>}`
    : `Kamu adalah V-Optics AI, asisten cerdas dan ramah yang terintegrasi di HUD kacamata pintar.
Kamu BISA SEGALANYA: jawab pertanyaan, ceritakan berita, jelaskan hal-hal, ngobrol, beri rekomendasi, bercanda, bantu tugas — seperti ChatGPT tapi untuk kacamata pintar.

Untuk kontrol HUD, kamu juga return JSON action. Untuk percakapan biasa, gunakan {"type":"none"}.

Aksi HUD yang tersedia:
- {"type":"navigate","feature":"home"} — buka beranda/feed berita
- {"type":"navigate","feature":"nav"} — buka navigasi/peta
- {"type":"navigate","feature":"notify"} — buka notifikasi
- {"type":"navigate","feature":"translate"} — buka translator kamera
- {"type":"navigate","feature":"ai"} — buka AI vision kamera
- {"type":"navigate","feature":"health"} — buka monitor kesehatan
- {"type":"navigate","feature":"detect"} — buka deteksi objek
- {"type":"navigate","feature":"voice"} — buka voice chat
- {"type":"toggle_hide_ui"} — toggle clean mode
- {"type":"search_nearby","query":"<tempat>"} — cari tempat terdekat
- {"type":"none"} — hanya ngobrol, tidak ada aksi HUD

Kepribadian: hangat, cerdas, ringkas. Maks 3 kalimat per balasan kecuali menjelaskan sesuatu kompleks.
Kalau ditanya berita/kejadian terkini, jawab informatif berdasarkan pengetahuanmu.
Balas dalam bahasa yang sama dengan pengguna.

Balas HANYA dalam JSON ini (tanpa markdown):
{"reply":"<balasanmu>","action":<objek aksi>}`

  const messages: any[] = [
    ...historyMessages.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: transcript }
  ]

  const res = await fetch("/api/claude-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: systemPrompt,
      messages,
      mode: "voice",
      textOnly: true,
    })
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const raw = (data.result ?? "").replace(/```json|```/g, "").trim()

  try {
    const jsonStart = raw.indexOf("{")
    const parsed = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw)
    return {
      reply: parsed.reply ?? "Oke.",
      action: parsed.action ?? { type: "none" }
    }
  } catch {
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
  // silenceTimer dikelola sebagai local var di dalam startRecognition closure

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
      const { reply, action } = await processWithClaude(text, lang, chat)
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

    // Buffer untuk kumpulkan semua kata selama sesi bicara
    let sessionText = ""
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          sessionText += (sessionText ? " " : "") + t.trim()
        } else {
          interimText += t
        }
      }
      // Tampilkan interim + akumulasi sejauh ini
      setInterim(sessionText + (interimText ? " " + interimText : ""))

      // Reset silence timer — proses setelah 2 detik tidak bicara
      if (silenceTimeout) clearTimeout(silenceTimeout)
      if (sessionText) {
        silenceTimeout = setTimeout(() => {
          // Hentikan recognition → akan trigger onend → proses di sana
          try { recognition.stop() } catch {}
        }, 2000)
      }
    }

    recognition.onspeechstart = () => {
      startBars()
    }

    recognition.onspeechend = () => {
      // Extend grace period setelah speech end
      if (silenceTimeout) clearTimeout(silenceTimeout)
      silenceTimeout = setTimeout(() => {
        try { recognition.stop() } catch {}
      }, 1200)
    }

    recognition.onend = () => {
      if (silenceTimeout) clearTimeout(silenceTimeout)
      stopBars()
      setListening(false)
      setInterim("")

      // Proses teks yang terkumpul di sesi ini
      if (sessionText.trim()) {
        processTranscript(sessionText.trim())
        sessionText = ""
      }

      // Auto restart kalau mode auto masih aktif
      if (autoRef.current) {
        setTimeout(() => {
          if (autoRef.current) startRecognition()
        }, 600) // jeda sebelum restart
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
  }, [lang, processing, startBars, stopBars, processTranscript])

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
  }, [])

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,gap:0}}>

      {/* ── Header bar ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
        borderBottom:`1px solid ${accentDim}`,flexShrink:0}}>
        {/* Avatar */}
        <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,
          background:`linear-gradient(135deg,${accent}33,${accent}11)`,
          border:`1.5px solid ${accent}`,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:13,
          boxShadow:autoMode||listening?`0 0 10px ${accent}55`:"none"}}>
          ⬡
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:"bold",color:accent,letterSpacing:0.5}}>V-Optics AI</div>
          <div style={{fontSize:8,color:accentDim}}>
            {processing?"⏳ berpikir..."
              :listening?"● mendengarkan..."
              :autoMode?"◌ siap mendengar"
              :"siap"}
          </div>
        </div>
        {/* Auto mode pill */}
        <div onClick={toggleAuto} style={{
          display:"flex",alignItems:"center",gap:5,padding:"4px 10px",
          borderRadius:20,cursor:"pointer",transition:"all 0.2s",
          background:autoMode?`${accent}22`:accentFaint,
          border:`1px solid ${autoMode?accent:accentDim}`}}>
          <div style={{width:6,height:6,borderRadius:"50%",
            background:autoMode?accent:"#567",
            boxShadow:autoMode?`0 0 6px ${accent}`:"none",
            transition:"all 0.2s"}}/>
          <span style={{fontSize:8,color:autoMode?accent:"#89a",letterSpacing:1}}>
            {autoMode?"AUTO ON":"AUTO"}
          </span>
        </div>
        {/* Mic button */}
        <button onClick={tapToSpeak}
          style={{width:32,height:32,borderRadius:"50%",cursor:"pointer",flexShrink:0,
            background:listening?`${accent}30`:accentFaint,
            border:`1.5px solid ${listening?accent:accentDim}`,
            color:accent,fontSize:14,transition:"all 0.2s",
            boxShadow:listening?`0 0 14px ${accent}55`:"none",
            position:"relative",overflow:"hidden"}}>
          {listening&&<div style={{position:"absolute",inset:-2,borderRadius:"50%",
            border:`1.5px solid ${accent}44`,animation:"ripple 1s ease-out infinite"}}/>}
          🎤
        </button>
      </div>

      {/* ── Waveform bar (compact, only when listening) ── */}
      {(listening||autoMode)&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",
          gap:1.5,height:20,padding:"0 16px",flexShrink:0,
          background:`${accent}06`,borderBottom:`1px solid ${accentDim}`}}>
          {bars.map((h,i)=>(
            <div key={i} style={{
              width:2,borderRadius:2,
              background:listening?`${accent}`:`${accent}44`,
              height:listening?Math.max(2,h*0.5):3,
              transition:"height 0.07s ease",
              opacity:listening?0.9:0.4,
            }}/>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {errorMsg&&(
        <div style={{padding:"6px 12px",fontSize:9,color:"#f88",flexShrink:0,
          background:"rgba(255,60,60,0.06)",borderBottom:"1px solid rgba(255,80,80,0.2)"}}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── Chat messages ── */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",
        gap:8,padding:"10px 10px 6px",minHeight:0}}>

        {chat.length===0&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:12,padding:"20px 0"}}>
            <div style={{width:48,height:48,borderRadius:"50%",
              background:`linear-gradient(135deg,${accent}22,${accent}08)`,
              border:`1.5px solid ${accentDim}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22}}>⬡</div>
            <div style={{textAlign:"center",color:accentDim,fontSize:9,
              letterSpacing:0.5,lineHeight:1.9}}>
              {lang==="en"
                ?"Ask me anything — news, navigation,questions, commands, or just chat!"
                :"Tanya apa saja — berita, navigasi, pertanyaan, perintah, atau sekadar ngobrol!"}
            </div>
            {/* Quick suggestion chips */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginTop:4}}>
              {(lang==="en"
                ?["Today's news","Nearest cafe","Open maps","What time is it?","Tell me a joke"]
                :["Berita hari ini","Cafe terdekat","Buka peta","Jam berapa sekarang?","Ceritakan lelucon"]
              ).map(s=>(
                <div key={s} onClick={()=>processTranscript(s)}
                  style={{padding:"5px 12px",borderRadius:20,fontSize:8,cursor:"pointer",
                    border:`1px solid ${accentDim}`,background:accentFaint,
                    color:`${accent}99`,letterSpacing:0.3,transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${accent}20`;e.currentTarget.style.color=accent}}
                  onMouseLeave={e=>{e.currentTarget.style.background=accentFaint;e.currentTarget.style.color=`${accent}99`}}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {chat.map((msg,mi)=>(
          <div key={msg.id} style={{
            display:"flex",
            flexDirection:msg.role==="user"?"row-reverse":"row",
            alignItems:"flex-end",gap:6,
            animation:"fadeIn 0.2s ease",
          }}>
            {/* Avatar dot */}
            {msg.role==="assistant"&&(
              <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
                background:`${accent}22`,border:`1px solid ${accentDim}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:9,marginBottom:2}}>⬡</div>
            )}

            <div style={{maxWidth:"82%",display:"flex",flexDirection:"column",
              alignItems:msg.role==="user"?"flex-end":"flex-start",gap:2}}>
              {/* Bubble */}
              <div style={{
                padding:"8px 11px",
                borderRadius:msg.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px",
                background:msg.role==="user"
                  ?`linear-gradient(135deg,${accent}30,${accent}18)`
                  :`rgba(255,255,255,0.04)`,
                border:`1px solid ${msg.role==="user"?accentDim:`${accent}18`}`,
                backdropFilter:"blur(4px)",
              }}>
                <div style={{fontSize:10,lineHeight:1.6,
                  color:msg.role==="user"?accent:"#d8eaf5",
                  whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                  {msg.text}
                </div>
                {/* Action badge */}
                {msg.action&&msg.action.type!=="none"&&(
                  <div style={{marginTop:5,paddingTop:5,
                    borderTop:`1px solid ${accent}22`,
                    fontSize:7,color:`${accent}77`,
                    display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:accent,fontSize:8}}>▸</span>
                    {msg.action.type==="navigate"&&`→ ${(msg.action as any).feature?.toUpperCase()}`}
                    {msg.action.type==="search_nearby"&&`📍 ${(msg.action as any).query}`}
                    {msg.action.type==="toggle_hide_ui"&&"◐ clean mode"}
                  </div>
                )}
              </div>
              {/* Timestamp */}
              <div style={{fontSize:7,color:`${accentDim}`,
                paddingLeft:msg.role==="user"?0:4,paddingRight:msg.role==="user"?4:0}}>
                {msg.role==="assistant"?"V-Optics AI":"Kamu"} · {msg.time}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {processing&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
            <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
              background:`${accent}22`,border:`1px solid ${accentDim}`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>⬡</div>
            <div style={{padding:"8px 12px",borderRadius:"14px 14px 14px 3px",
              background:`rgba(255,255,255,0.04)`,border:`1px solid ${accent}18`}}>
              <div style={{display:"flex",gap:3,alignItems:"center"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:5,height:5,borderRadius:"50%",
                    background:accent,opacity:0.6,
                    animation:`bounce 1.2s ease infinite`,
                    animationDelay:`${i*0.2}s`}}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interim preview */}
        {interim&&(
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <div style={{maxWidth:"80%",padding:"6px 10px",
              borderRadius:"12px 12px 3px 12px",
              background:`${accent}10`,border:`1px dashed ${accentDim}`,
              fontSize:9,color:`${accent}77`,fontStyle:"italic"}}>
              "{interim}..."
            </div>
          </div>
        )}

        <div ref={chatEndRef}/>
      </div>
    </div>
  )
}