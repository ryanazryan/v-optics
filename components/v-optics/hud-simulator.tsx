"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"
import { HealthPanel } from "./health-panel"

interface HUDSimulatorProps {
  settings: HUDSettings
  t: Translation
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface NearbyPlace {
  name: string; dist: string; category: string; lat: number; lng: number
}
interface RealNotif {
  id: string; type: string; icon: string; msg: string; time: string
}
interface DetectedObject {
  label: string; score: number; bbox: [number, number, number, number]
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function calcDist(la1: number, lo1: number, la2: number, lo2: number): string {
  const R = 6371000, dLa = ((la2 - la1) * Math.PI) / 180, dLo = ((lo2 - lo1) * Math.PI) / 180
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2
  const m = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`
}
function getMapUrl(lat: number, lng: number) {
  const d = 0.003
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-d},${lat-d},${lng+d},${lat+d}&layer=mapnik&marker=${lat},${lng}`
}
function catIcon(c: string) {
  return c==="cafe"?"☕":c==="restaurant"||c==="fast_food"?"🍽":c==="hospital"||c==="pharmacy"?"🏥":
    c==="school"||c==="university"?"🎓":c==="bank"?"🏦":c==="fuel"?"⛽":
    c==="supermarket"||c==="convenience"?"🛒":c==="mosque"||c==="place_of_worship"?"🕌":"📍"
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: GPS + NEARBY
// ─────────────────────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null)
  const [address, setAddress] = useState("Mendapatkan lokasi...")
  const [accuracy, setAccuracy] = useState<number|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const lastRef = useRef<{lat:number;lng:number}|null>(null)

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    if (lastRef.current) {
      const d = calcDist(lat,lng,lastRef.current.lat,lastRef.current.lng)
      if (parseFloat(d) < 50) return
    }
    lastRef.current = {lat, lng}
    setLoadingNearby(true)
    try {
      const q = `[out:json][timeout:10];(node(around:600,${lat},${lng})[name][amenity];node(around:600,${lat},${lng})[name][shop];);out body 20;`
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.elements?.length > 0) {
        setNearby(
          data.elements.filter((e:any)=>e.tags?.name)
            .map((e:any)=>({name:e.tags.name,dist:calcDist(lat,lng,e.lat,e.lon),
              category:e.tags.amenity||e.tags.shop||"tempat",lat:e.lat,lng:e.lon}))
            .sort((a:NearbyPlace,b:NearbyPlace)=>{
              const m=(d:string)=>d.endsWith("km")?parseFloat(d)*1000:parseFloat(d)
              return m(a.dist)-m(b.dist)
            }).slice(0,5)
        )
      }
    } catch { setNearby([]) }
    finally { setLoadingNearby(false) }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) { setError("GPS tidak didukung"); setLoading(false); return }
    const id = navigator.geolocation.watchPosition(async pos => {
      const {latitude:lat, longitude:lng, accuracy:acc} = pos.coords
      setCoords({lat,lng}); setAccuracy(Math.round(acc)); setLoading(false); setError(null)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`)
        const d = await r.json()
        const parts = [d.address?.road||d.address?.suburb||"", d.address?.suburb||"", d.address?.city||d.address?.town||""].filter(Boolean)
        setAddress(parts.join(", ")||d.display_name?.split(",").slice(0,3).join(",")||"Lokasi tidak diketahui")
      } catch { setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`) }
      fetchNearby(lat, lng)
    }, err=>{
      setLoading(false)
      setError(err.code===1?"Izin GPS ditolak":err.code===2?"Sinyal GPS lemah":"Timeout GPS")
    }, {enableHighAccuracy:true,maximumAge:5000,timeout:15000})
    return () => navigator.geolocation.clearWatch(id)
  }, [fetchNearby])

  return {coords,address,accuracy,error,loading,nearby,loadingNearby}
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: REAL NOTIFICATIONS (battery, network, visibility, time)
// ─────────────────────────────────────────────────────────────────────────────
function useRealNotifs(coords: {lat:number;lng:number}|null) {
  const [notifs, setNotifs] = useState<RealNotif[]>([])
  const addNotif = useCallback((n: Omit<RealNotif,"id"|"time">) => {
    const id = Date.now().toString()
    const time = new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
    setNotifs(prev => [{...n,id,time},...prev.slice(0,7)])
  }, [])

  useEffect(() => {
    // Network status
    const onOnline  = () => addNotif({type:"net",icon:"📶",msg:"Koneksi internet tersambung kembali"})
    const onOffline = () => addNotif({type:"net",icon:"⚠",msg:"Koneksi internet terputus"})
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    // Visibility (saat user kembali ke tab)
    const onVisible = () => {
      if (document.visibilityState === "visible")
        addNotif({type:"app",icon:"◉",msg:"V-Optics aktif kembali"})
    }
    document.addEventListener("visibilitychange", onVisible)

    // Battery API
    ;(navigator as any).getBattery?.().then((bat: any) => {
      const checkBat = () => {
        const pct = Math.round(bat.level * 100)
        if (pct <= 20 && !bat.charging)
          addNotif({type:"battery",icon:"🔋",msg:`Baterai ${pct}% — segera cas perangkat`})
        else if (bat.charging && pct < 100)
          addNotif({type:"battery",icon:"⚡",msg:`Mengisi daya — ${pct}%`})
      }
      bat.addEventListener("levelchange", checkBat)
      bat.addEventListener("chargingchange", checkBat)
      checkBat()
    })

    // Waktu — notif setiap jam
    const now = new Date()
    const msToNextHour = (60 - now.getMinutes()) * 60000 - now.getSeconds() * 1000
    const hourTimer = setTimeout(() => {
      const h = new Date().getHours()
      addNotif({type:"time",icon:"🕐",msg:`${h}:00 — Pengingat waktu dari V-Optics`})
    }, msToNextHour)

    // Notif awal saat mount
    addNotif({type:"app",icon:"◈",msg:"V-Optics HUD aktif — semua sistem berjalan"})

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      document.removeEventListener("visibilitychange", onVisible)
      clearTimeout(hourTimer)
    }
  }, [addNotif])

  // GPS notif saat lokasi berubah
  useEffect(() => {
    if (!coords) return
    addNotif({type:"gps",icon:"📍",msg:`Lokasi diperbarui: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`})
  }, [coords?.lat.toFixed(3), coords?.lng.toFixed(3)])

  return notifs
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL: TERJEMAHAN — kamera + OCR + translate
// ─────────────────────────────────────────────────────────────────────────────
function TranslatePanel({accent,accentDim,accentFaint,targetLang}:{
  accent:string; accentDim:string; accentFaint:string; targetLang:string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [capturedText, setCapturedText] = useState("")
  const [translated, setTranslated] = useState("")
  const [detectedLang, setDetectedLang] = useState("")
  const [status, setStatus] = useState("Izinkan kamera untuk memulai")
  const streamRef = useRef<MediaStream|null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width:{ideal:1280}, height:{ideal:720} }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraOn(true)
      setStatus("Kamera aktif — arahkan ke teks, tekan Scan")
    } catch { setStatus("⚠ Akses kamera ditolak") }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setStatus("Kamera dimatikan")
  }

  const scanAndTranslate = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true); setStatus("Memindai teks...")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)

    try {
      // Muat Tesseract.js secara dinamis
      const Tesseract = await import("tesseract.js")
      setStatus("OCR — membaca teks dari gambar...")
      const { data: { text, confidence } } = await Tesseract.recognize(canvas, "eng+ind+jpn+kor+chi_sim+ara+fra+deu+spa")
      const cleaned = text.trim().replace(/\s+/g, " ")
      if (!cleaned || confidence < 30) {
        setStatus("Tidak ada teks terdeteksi. Coba dekatkan kamera ke teks.")
        setScanning(false); return
      }
      setCapturedText(cleaned.slice(0, 200))
      setStatus("Menerjemahkan...")

      // Translate via MyMemory API (gratis, tanpa key)
      const toLang = targetLang === "id" ? "id" : "en"
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned.slice(0,500))}&langpair=auto|${toLang}`)
      const d = await r.json()
      if (d.responseStatus === 200) {
        setTranslated(d.responseData.translatedText)
        setDetectedLang(d.responseData.detectedLanguage||"auto")
        setStatus(`Terjemahan selesai (${d.responseData.detectedLanguage||"auto"} → ${toLang.toUpperCase()})`)
      } else {
        setStatus("⚠ Gagal menerjemahkan. Coba lagi.")
      }
    } catch (e) {
      setStatus("⚠ Error OCR. Pastikan tesseract.js terinstall: npm install tesseract.js")
    }
    setScanning(false)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8,height:"100%"}}>
      {/* Video preview */}
      <div style={{flex:1,position:"relative",borderRadius:6,overflow:"hidden",
        border:`1px solid ${accentDim}`,background:"#000",minHeight:0}}>
        <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",
          display:cameraOn?"block":"none"}} muted playsInline/>
        {!cameraOn && (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:24}}>📷</span>
            <div style={{color:accentDim,fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 12px"}}>{status}</div>
          </div>
        )}
        {/* Corner brackets */}
        {cameraOn && ([[0,0],[1,0],[0,1],[1,1]] as const).map(([x,y],i)=>(
          <div key={i} style={{position:"absolute",width:12,height:12,
            top:y?"auto":6,bottom:y?6:"auto",left:x?"auto":6,right:x?6:"auto",
            borderTop:!y?`2px solid ${accent}`:"none",borderBottom:y?`2px solid ${accent}`:"none",
            borderLeft:!x?`2px solid ${accent}`:"none",borderRight:x?`2px solid ${accent}`:"none"}}/>
        ))}
        {scanning && (
          <div style={{position:"absolute",left:0,right:0,height:2,
            background:`linear-gradient(90deg,transparent,${accent},transparent)`,
            animation:"scanBeam 1.5s ease-in-out infinite"}}/>
        )}
        <canvas ref={canvasRef} style={{display:"none"}}/>
      </div>

      {/* Status */}
      <div style={{fontSize:9,color:accentDim,letterSpacing:1,textAlign:"center"}}>{status}</div>

      {/* Hasil terjemahan */}
      {translated && (
        <div style={{padding:"8px 10px",border:`1px solid ${accentDim}`,borderRadius:6,background:accentFaint}}>
          <div style={{fontSize:8,color:accentDim,letterSpacing:1,marginBottom:4}}>
            TEKS ASLI {detectedLang && `(${detectedLang.toUpperCase()})`}
          </div>
          <div style={{fontSize:10,color:"#fff6",marginBottom:6,lineHeight:1.4,
            textDecoration:"line-through"}}>{capturedText.slice(0,80)}{capturedText.length>80?"...":""}</div>
          <div style={{fontSize:8,color:accentDim,letterSpacing:1,marginBottom:4}}>
            TERJEMAHAN → {targetLang.toUpperCase()}
          </div>
          <div style={{fontSize:12,color:accent,fontWeight:"bold",
            textShadow:`0 0 8px ${accent}`,lineHeight:1.5}}>{translated}</div>
        </div>
      )}

      {/* Tombol */}
      <div style={{display:"flex",gap:6}}>
        {!cameraOn ? (
          <button onClick={startCamera} style={{flex:1,padding:"7px",
            fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,
            background:accentFaint,border:`1px solid ${accentDim}`,
            color:accent,borderRadius:4,cursor:"pointer"}}>
            📷 AKTIFKAN KAMERA
          </button>
        ) : (
          <>
            <button onClick={scanAndTranslate} disabled={scanning} style={{flex:2,padding:"7px",
              fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,
              background:scanning?`${accent}22`:accentFaint,border:`1px solid ${scanning?accentDim:accent}`,
              color:scanning?accentDim:accent,borderRadius:4,cursor:scanning?"not-allowed":"pointer"}}>
              {scanning?"⏳ MEMINDAI...":"◆ SCAN & TERJEMAH"}
            </button>
            <button onClick={stopCamera} style={{flex:1,padding:"7px",
              fontFamily:"'Share Tech Mono',monospace",fontSize:9,
              background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.3)",
              color:"#f66",borderRadius:4,cursor:"pointer"}}>STOP</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL: AI — kamera real + Claude Vision
// ─────────────────────────────────────────────────────────────────────────────
function AIPanel({accent,accentDim,accentFaint,lang}:{
  accent:string; accentDim:string; accentFaint:string; lang:string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiText, setAiText] = useState("")
  const [typedText, setTypedText] = useState("")
  const [status, setStatus] = useState("")
  const streamRef = useRef<MediaStream|null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width:{ideal:1280}, height:{ideal:720} }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraOn(true)
      setStatus(lang==="en" ? "Camera active. Press Analyze." : "Kamera aktif. Tekan Analisis.")
    } catch { setStatus("⚠ " + (lang==="en" ? "Camera access denied" : "Akses kamera ditolak")) }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setAiText(""); setTypedText(""); setStatus("")
  }

  // Typewriter effect
  useEffect(() => {
    if (!aiText) { setTypedText(""); return }
    let i = 0; setTypedText("")
    const iv = setInterval(() => {
      setTypedText(aiText.slice(0, i+1)); i++
      if (i >= aiText.length) clearInterval(iv)
    }, 20)
    return () => clearInterval(iv)
  }, [aiText])

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setAnalyzing(true)
    setStatus(lang==="en" ? "Capturing frame..." : "Mengambil gambar...")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    ctx.drawImage(videoRef.current, 0, 0)

    // Kompres jadi JPEG kualitas sedang untuk hemat token
    const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1]
    setStatus(lang==="en" ? "Sending to Claude AI..." : "Mengirim ke Claude AI...")

    try {
      const prompt = lang === "en"
        ? "You are V-Optics AI assistant integrated in smart glasses. Analyze this camera frame and describe: 1) What you see (objects, people, text, environment) 2) Any important information the wearer should know 3) Any safety concerns. Be concise, max 3 sentences."
        : "Kamu adalah asisten AI V-Optics yang terintegrasi di kacamata pintar. Analisis frame kamera ini dan deskripsikan: 1) Apa yang terlihat (objek, orang, teks, lingkungan) 2) Informasi penting yang perlu diketahui pengguna 3) Potensi bahaya. Singkat, maksimal 3 kalimat."

      const res = await fetch("/api/claude-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, prompt })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAiText(data.result || (lang==="en" ? "No response from AI." : "Tidak ada respons dari AI."))
      setStatus(lang==="en" ? "Analysis complete" : "Analisis selesai")
    } catch (e: any) {
      setStatus("⚠ " + (lang==="en" ? "Add /api/claude-vision route to use Claude Vision" : "Tambahkan route /api/claude-vision untuk Claude Vision"))
      setAiText(lang==="en"
        ? "API route not configured. Create /app/api/claude-vision/route.ts — see console for template."
        : "Route API belum dikonfigurasi. Buat /app/api/claude-vision/route.ts — lihat console untuk template.")
      // Log template ke console
      console.info(`
// app/api/claude-vision/route.ts
import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export async function POST(req: NextRequest) {
  const { image, prompt } = await req.json()
  const msg = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 300,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
      { type: "text", text: prompt }
    ]}]
  })
  const result = msg.content.find(c => c.type === "text")?.text ?? ""
  return NextResponse.json({ result })
}
      `)
    }
    setAnalyzing(false)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const quickCmds = lang==="en"
    ? ["What is around me?","Is it safe here?","Read this text","Describe the scene"]
    : ["Apa yang ada di sekitarku?","Apakah ini aman?","Baca teks ini","Deskripsikan pemandangan"]

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8,height:"100%"}}>
      {/* Video */}
      <div style={{flex:1,position:"relative",borderRadius:6,overflow:"hidden",
        border:`1px solid ${accentDim}`,background:"#000",minHeight:0}}>
        <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",
          display:cameraOn?"block":"none"}} muted playsInline/>
        {!cameraOn && (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:6}}>
            <div style={{width:40,height:40,borderRadius:"50%",border:`2px solid ${accentDim}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,animation:"orbPulse 2s ease-in-out infinite",color:accent}}>⬡</div>
            <div style={{color:accentDim,fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 8px"}}>
              {lang==="en"?"Enable camera for AI vision analysis":"Aktifkan kamera untuk analisis AI vision"}
            </div>
          </div>
        )}
        {analyzing && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{color:accent,fontSize:9,letterSpacing:2,textAlign:"center"}}>
              <div style={{width:24,height:24,border:`2px solid ${accent}`,borderTopColor:"transparent",
                borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 8px"}}/>
              {lang==="en"?"ANALYZING...":"MENGANALISIS..."}
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{display:"none"}}/>
      </div>

      {/* AI output */}
      {(typedText || status) && (
        <div style={{padding:"8px 10px",border:`1px solid ${accentDim}`,borderRadius:6,background:accentFaint}}>
          {status && <div style={{fontSize:8,color:accentDim,letterSpacing:1,marginBottom:4}}>{status}</div>}
          {typedText && (
            <div style={{fontSize:10,color:accent,lineHeight:1.6}}>
              <span style={{color:accentDim,marginRight:6}}>AI&gt;</span>
              {typedText}
              {analyzing && <span style={{animation:"blink 0.8s infinite"}}>▌</span>}
            </div>
          )}
        </div>
      )}

      {/* Quick commands */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {quickCmds.map(cmd=>(
          <div key={cmd} onClick={()=>cameraOn&&analyzeFrame()} style={{
            padding:"3px 8px",border:`1px solid ${accentDim}`,borderRadius:20,
            color:`${accent}88`,fontSize:8,cursor:cameraOn?"pointer":"default",
            background:accentFaint,letterSpacing:0.5}}>{cmd}</div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{display:"flex",gap:6}}>
        {!cameraOn ? (
          <button onClick={startCamera} style={{flex:1,padding:"7px",
            fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,
            background:accentFaint,border:`1px solid ${accentDim}`,color:accent,
            borderRadius:4,cursor:"pointer"}}>
            ⬡ AKTIFKAN AI VISION
          </button>
        ) : (
          <>
            <button onClick={analyzeFrame} disabled={analyzing} style={{flex:2,padding:"7px",
              fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,
              background:analyzing?`${accent}11`:accentFaint,
              border:`1px solid ${analyzing?accentDim:accent}`,
              color:analyzing?accentDim:accent,borderRadius:4,
              cursor:analyzing?"not-allowed":"pointer"}}>
              {analyzing?"⏳ MENGANALISIS...":"⬡ ANALISIS FRAME"}
            </button>
            <button onClick={stopCamera} style={{flex:1,padding:"7px",
              fontFamily:"'Share Tech Mono',monospace",fontSize:9,
              background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.3)",
              color:"#f66",borderRadius:4,cursor:"pointer"}}>STOP</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL: DETEKSI OBJEK — TensorFlow.js COCO-SSD
// ─────────────────────────────────────────────────────────────────────────────
function DetectPanel({accent,accentDim,accentFaint,lang}:{
  accent:string; accentDim:string; accentFaint:string; lang:string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [objects, setObjects] = useState<DetectedObject[]>([])
  const [status, setStatus] = useState("")
  const streamRef = useRef<MediaStream|null>(null)
  const modelRef = useRef<any>(null)
  const rafRef = useRef<number>(0)

  // Label Indonesia
  const labelID: Record<string,string> = {
    person:"Orang",bicycle:"Sepeda",car:"Mobil",motorcycle:"Motor",airplane:"Pesawat",
    bus:"Bus",train:"Kereta",truck:"Truk",boat:"Perahu",chair:"Kursi",
    "dining table":"Meja Makan",laptop:"Laptop",keyboard:"Keyboard",mouse:"Mouse",
    "cell phone":"HP",book:"Buku",bottle:"Botol",cup:"Cangkir",fork:"Garpu",
    knife:"Pisau",spoon:"Sendok",bowl:"Mangkuk",banana:"Pisang",apple:"Apel",
    backpack:"Ransel",umbrella:"Payung",handbag:"Tas",tie:"Dasi",suitcase:"Koper",
    dog:"Anjing",cat:"Kucing",bird:"Burung",horse:"Kuda",cow:"Sapi",
    "traffic light":"Lampu Merah","stop sign":"Rambu Stop",bench:"Bangku",
    tv:"TV",clock:"Jam",vase:"Vas",scissors:"Gunting","teddy bear":"Boneka",
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ideal:640}, height:{ideal:480} }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraOn(true)
      setStatus(lang==="en"?"Camera on. Loading AI model...":"Kamera aktif. Memuat model AI...")
      await loadModel()
    } catch { setStatus("⚠ " + (lang==="en"?"Camera denied":"Akses kamera ditolak")) }
  }

  const loadModel = async () => {
    if (modelRef.current) { setModelLoaded(true); startDetect(); return }
    try {
      setStatus(lang==="en"?"Loading COCO-SSD model (~5MB)...":"Memuat model COCO-SSD (~5MB)...")
      // Load TF + COCO-SSD via CDN
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js")
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js")
      const cocoSsd = (window as any).cocoSsd
      modelRef.current = await cocoSsd.load()
      setModelLoaded(true)
      setStatus(lang==="en"?"Model ready — detecting objects":"Model siap — mendeteksi objek")
      startDetect()
    } catch { setStatus("⚠ " + (lang==="en"?"Failed to load model":"Gagal memuat model")) }
  }

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
      const s = document.createElement("script")
      s.src = src; s.onload = () => resolve(); s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const startDetect = () => {
    setDetecting(true)
    const detect = async () => {
      if (!videoRef.current || !canvasRef.current || !modelRef.current) return
      if (videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(detect); return }
      try {
        const predictions = await modelRef.current.detect(videoRef.current)
        setObjects(predictions.map((p:any)=>({
          label: p.class,
          score: Math.round(p.score * 100),
          bbox: p.bbox as [number,number,number,number]
        })))
        // Draw bounding boxes
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")!
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx.clearRect(0,0,canvas.width,canvas.height)
        predictions.forEach((p:any) => {
          const [x,y,w,h] = p.bbox
          const color = p.score > 0.8 ? accent : `${accent}88`
          ctx.strokeStyle = color; ctx.lineWidth = 2
          ctx.strokeRect(x,y,w,h)
          ctx.fillStyle = `${accent}cc`
          ctx.font = "bold 12px monospace"
          const lbl = lang==="en" ? p.class : (labelID[p.class]||p.class)
          ctx.fillText(`${lbl} ${Math.round(p.score*100)}%`, x, y > 15 ? y-4 : y+15)
        })
      } catch {}
      rafRef.current = requestAnimationFrame(detect)
    }
    rafRef.current = requestAnimationFrame(detect)
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setDetecting(false); setObjects([])
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)
    }
    setStatus("")
  }

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return (
    <div style={{display:"flex",gap:10,height:"100%"}}>
      {/* Viewfinder + overlay */}
      <div style={{flex:1.4,position:"relative",border:`1px solid ${accentDim}`,
        borderRadius:6,overflow:"hidden",background:"#000"}}>
        <video ref={videoRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",
          objectFit:"cover",display:cameraOn?"block":"none"}} muted playsInline/>
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",
          objectFit:"cover",display:cameraOn?"block":"none"}}/>
        {/* Corner brackets */}
        {([[0,0],[1,0],[0,1],[1,1]] as const).map(([x,y],i)=>(
          <div key={i} style={{position:"absolute",width:14,height:14,zIndex:2,
            top:y?"auto":6,bottom:y?6:"auto",left:x?"auto":6,right:x?6:"auto",
            borderTop:!y?`2px solid ${accent}`:"none",borderBottom:y?`2px solid ${accent}`:"none",
            borderLeft:!x?`2px solid ${accent}`:"none",borderRight:x?`2px solid ${accent}`:"none"}}/>
        ))}
        {!cameraOn && (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:22,color:accentDim}}>⬢</span>
            <button onClick={startCamera} style={{padding:"7px 18px",
              fontFamily:"'Orbitron',monospace",fontSize:9,letterSpacing:2,
              background:accentFaint,border:`1px solid ${accentDim}`,color:accent,
              borderRadius:4,cursor:"pointer"}}>
              {lang==="en"?"START DETECTION":"MULAI DETEKSI"}
            </button>
          </div>
        )}
        {cameraOn && !modelLoaded && (
          <div style={{position:"absolute",bottom:6,left:0,right:0,textAlign:"center",zIndex:3}}>
            <div style={{color:accent,fontSize:8,letterSpacing:1}}>
              <span style={{display:"inline-block",animation:"spin 1s linear infinite",marginRight:4}}>↻</span>
              {lang==="en"?"Loading AI model...":"Memuat model AI..."}
            </div>
          </div>
        )}
        {cameraOn && (
          <button onClick={stopCamera} style={{position:"absolute",bottom:6,right:6,zIndex:3,
            padding:"3px 8px",fontFamily:"'Share Tech Mono',monospace",fontSize:8,
            background:"rgba(255,60,60,0.15)",border:"1px solid rgba(255,60,60,0.4)",
            color:"#f88",borderRadius:3,cursor:"pointer",letterSpacing:1}}>STOP</button>
        )}
      </div>

      {/* Object list */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5,overflowY:"auto"}}>
        <div style={{fontSize:9,color:accentDim,letterSpacing:2,marginBottom:2}}>
          {lang==="en"?"DETECTED OBJECTS":"OBJEK TERDETEKSI"}
          {objects.length>0 && ` (${objects.length})`}
          {detecting && modelLoaded && (
            <span style={{color:accent,marginLeft:6,animation:"pulse 1s infinite"}}>● LIVE</span>
          )}
        </div>

        {status && (
          <div style={{fontSize:8,color:accentDim,letterSpacing:0.5,lineHeight:1.5}}>{status}</div>
        )}

        {objects.length === 0 && cameraOn && modelLoaded && (
          <div style={{color:accentDim,fontSize:9,textAlign:"center",marginTop:10}}>
            {lang==="en"?"No objects detected":"Tidak ada objek terdeteksi"}
          </div>
        )}

        {objects.map((obj,i)=>{
          const lbl = lang==="en" ? obj.label : (labelID[obj.label]||obj.label)
          const color = obj.score>80?accent:obj.score>60?`${accent}bb`:`${accent}77`
          return (
            <div key={`${obj.label}-${i}`} style={{padding:"7px 9px",
              border:`1px solid ${color}33`,borderRadius:5,background:`${color}08`,
              animation:"slideIn 0.2s ease",animationFillMode:"both"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color,fontSize:11,fontWeight:"bold"}}>{lbl}</span>
                <span style={{color:`${color}99`,fontSize:9}}>
                  {obj.score > 90 ? "●●●" : obj.score > 70 ? "●●○" : "●○○"}
                </span>
              </div>
              <div style={{height:2,background:`${color}22`,borderRadius:2}}>
                <div style={{width:`${obj.score}%`,height:"100%",background:color,
                  borderRadius:2,transition:"width 0.3s ease"}}/>
              </div>
              <div style={{color:`${color}77`,fontSize:8,marginTop:2}}>
                {lang==="en"?"Confidence":"Konfiden"}: {obj.score}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function HUDSimulator({ settings, t }: HUDSimulatorProps) {
  const [time, setTime] = useState(new Date())
  const [scanLine, setScanLine] = useState(0)
  const [activeFeature, setActiveFeature] = useState("nav")

  const {coords,address,accuracy,error:gpsError,loading:gpsLoading,nearby,loadingNearby} = useGPS()
  const notifs = useRealNotifs(coords)

  const accent      = settings?.accentColor ?? "#00ffff"
  const accentDim   = `${accent}55`
  const accentFaint = `${accent}15`
  const hidden      = settings?.hideUI ?? false
  const lang        = settings?.language ?? "id"

  useEffect(() => { const i = setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(i) }, [])
  useEffect(() => { const i = setInterval(()=>setScanLine(p=>(p+1)%100),28); return()=>clearInterval(i) }, [])

  const fmt = (n:number) => String(n).padStart(2,"0")
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`

  const tabs = [
    {id:"nav",label:t.tabNav,icon:"◈"},
    {id:"notify",label:t.tabNotif,icon:"◉"},
    {id:"translate",label:t.tabTranslate,icon:"◆"},
    {id:"ai",label:t.tabAI,icon:"⬡"},
    {id:"health",label:t.tabHealth,icon:"♥"},
    {id:"detect",label:t.tabDetect,icon:"⬢"},
  ]

  return (
    <div className="relative w-full max-w-205 overflow-hidden font-mono"
      style={{
        aspectRatio:"16/9",
        background:"linear-gradient(135deg,#04080f 0%,#0a1628 50%,#060c18 100%)",
        borderRadius:16,border:`1px solid ${accentDim}`,
        boxShadow:`0 0 60px ${accentFaint},inset 0 0 80px rgba(0,0,0,0.13)`,
        filter:`brightness(${settings?.brightness??80}%)`,
      }}>
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        background:`linear-gradient(transparent ${scanLine-1}%,rgba(0,255,255,0.025) ${scanLine}%,transparent ${scanLine+1}%)`
      }}/>
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        background:"radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.75) 100%)"
      }}/>
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity:0.035,
        backgroundImage:`linear-gradient(${accent} 1px,transparent 1px),linear-gradient(90deg,${accent} 1px,transparent 1px)`,
        backgroundSize:"40px 40px"
      }}/>

      {/* TOP BAR */}
      {!hidden && (
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center z-5"
          style={{padding:"7px 14px",borderBottom:`1px solid ${accentDim}`,background:"rgba(4,8,15,0.5)"}}>
          <div className="text-[9px] tracking-[3px]" style={{color:accent}}>V-OPTICS HUD v2.0</div>
          <div className="text-xs font-bold tracking-[4px]" style={{color:accent,textShadow:`0 0 8px ${accent}`}}>{timeStr}</div>
          <div className="flex gap-2.5 items-center">
            <span className="text-[9px]" style={{color:"#0f8"}}>{t.active}</span>
            <span className="text-[9px]" style={{color:"#ff0"}}>⚡ 87%</span>
            <span className="text-[9px]" style={{color:gpsError?"#f44":coords?"#0f8":"#ff0"}}>
              {gpsError?"⚠ GPS":coords?"● GPS":"○ GPS"}
            </span>
            {notifs.length > 0 && (
              <span className="text-[9px]" style={{color:accent,animation:"pulse 2s infinite"}}>
                ◉ {notifs.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* TABS */}
      {!hidden && (
        <div className="absolute bottom-0 left-0 right-0 flex z-5"
          style={{borderTop:`1px solid ${accentDim}`}}>
          {tabs.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveFeature(tab.id)}
              className="flex-1 font-mono text-[8px] tracking-[0.5px] cursor-pointer transition-all duration-200"
              style={{
                padding:"6px 2px",
                background:activeFeature===tab.id?`${accent}1a`:"transparent",
                border:"none",borderRight:`1px solid ${accentDim}`,
                color:activeFeature===tab.id?accent:`${accent}55`,
                textShadow:activeFeature===tab.id?`0 0 6px ${accent}`:"none",
              }}>
              <div className="text-[11px]">{tab.icon}</div>{tab.label}
            </button>
          ))}
        </div>
      )}

      {hidden && (
        <div className="absolute top-2 right-2 z-20 text-[8px] tracking-widest" style={{color:accentDim}}>
          CLEAN MODE
        </div>
      )}

      {/* CONTENT */}
      <div className="absolute z-3 overflow-hidden"
        style={{top:hidden?0:38,bottom:hidden?0:44,left:0,right:0,padding:"12px 14px"}}>

        {/* ── NAV ── */}
        {activeFeature==="nav" && (
          <div className="flex gap-3.5 h-full items-center">
            <div className="flex-1 h-full max-h-50 relative overflow-hidden rounded-md"
              style={{border:`1px solid ${accentDim}`,background:"#040d1a"}}>
              {coords ? (
                <iframe src={getMapUrl(coords.lat,coords.lng)}
                  style={{width:"100%",height:"100%",border:"none",
                    filter:"invert(1) hue-rotate(180deg) brightness(0.75) saturate(1.2)"}}
                  title="GPS Map"/>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div style={{color:gpsError?"#f44":"#ff0",fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 8px"}}>
                    {gpsError?`⚠ ${gpsError}`:lang==="en"?"○ Getting GPS...":"○ Mendapatkan GPS..."}
                  </div>
                  {!gpsError&&<div style={{width:16,height:16,border:`2px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>}
                </div>
              )}
            </div>
            <div className="flex-[1.3] flex flex-col gap-0 overflow-y-auto h-full">
              <div className="flex items-center gap-2 py-1.5" style={{borderBottom:`1px solid ${accentDim}`}}>
                <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,
                  background:coords?accent:"#ff0",boxShadow:`0 0 6px ${coords?accent:"#ff0"}`,
                  animation:gpsLoading?"pulse 1s infinite":"none"}}/>
                <span className="flex-1 text-[10px]" style={{color:accent}}>
                  {gpsLoading?(lang==="en"?"Locating...":"Mencari..."):gpsError?gpsError:(lang==="en"?"You are here":"Kamu di sini")}
                </span>
              </div>
              {coords&&!gpsError&&(
                <div className="py-1.5" style={{borderBottom:`1px solid ${accentDim}`}}>
                  <div style={{fontSize:9,color:accentDim,letterSpacing:1,marginBottom:2}}>{lang==="en"?"LOCATION":"LOKASI"}</div>
                  <div style={{fontSize:10,color:"#cde",lineHeight:1.4}}>{address}</div>
                  <div style={{fontSize:8,color:`${accent}66`,marginTop:2,fontFamily:"monospace"}}>
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    {accuracy&&<span style={{color:"#ff0",marginLeft:4}}>±{accuracy}m</span>}
                  </div>
                </div>
              )}
              {coords&&(
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:accentDim,letterSpacing:1,padding:"4px 0"}}>
                    {loadingNearby?(lang==="en"?"↻ SEARCHING...":"↻ MENCARI..."):(lang==="en"?"NEARBY":"TERDEKAT")}
                  </div>
                  {loadingNearby&&<div style={{width:10,height:10,border:`1.5px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
                  {!loadingNearby&&nearby.map((p,i)=>(
                    <div key={i} className="flex items-center gap-2 py-1.5"
                      style={{borderBottom:`1px solid ${accent}11`,color:i===0?`${accent}cc`:`${accent}77`,
                        animation:"fadeIn 0.3s ease",animationDelay:`${i*0.08}s`,animationFillMode:"both"}}>
                      <span style={{fontSize:10,flexShrink:0}}>{catIcon(p.category)}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:i===0?"#cde":"#89a"}}>{p.name}</div>
                        <div style={{fontSize:8,color:`${accent}55`}}>{p.category}</div>
                      </div>
                      <span style={{fontSize:9,flexShrink:0,fontFamily:"monospace",color:i===0?"#ff0":"#ff08"}}>{p.dist}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:"auto",padding:"5px 8px",background:"rgba(0,255,0,0.07)",
                border:"1px solid rgba(0,255,136,0.2)",borderRadius:5,color:"#0f8",fontSize:9,letterSpacing:1}}>
                {gpsError?`⚠ ${gpsError}`:coords?(lang==="en"?"● GPS ACTIVE":"● GPS AKTIF"):(lang==="en"?"○ Waiting GPS":"○ Menunggu GPS")}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIF REAL ── */}
        {activeFeature==="notify" && (
          <div className="flex flex-col gap-1.75 overflow-y-auto h-full">
            {notifs.length === 0 && (
              <div style={{color:accentDim,fontSize:10,textAlign:"center",marginTop:20,letterSpacing:1}}>
                {lang==="en"?"Waiting for events...":"Menunggu event..."}
              </div>
            )}
            {notifs.map((n,i)=>(
              <div key={n.id} className="flex items-start gap-2.5 rounded-[5px]"
                style={{padding:"8px 10px",
                  background:i===0?accentFaint:"transparent",
                  border:`1px solid ${i===0?accentDim:`${accent}15`}`,
                  animation:"fadeIn 0.3s ease",animationFillMode:"both"}}>
                <span className="text-[13px]" style={{
                  color:n.type==="net"?"#0f8":n.type==="battery"?"#ff0":n.type==="gps"?accent:"#f0f"
                }}>{n.icon}</span>
                <span className="flex-1 text-[11px] leading-relaxed" style={{color:"#cde"}}>{n.msg}</span>
                <span className="text-[9px] whitespace-nowrap" style={{color:accentDim}}>{n.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── TERJEMAHAN KAMERA ── */}
        {activeFeature==="translate" && (
          <TranslatePanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} targetLang={lang}/>
        )}

        {/* ── AI VISION ── */}
        {activeFeature==="ai" && (
          <AIPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang}/>
        )}

        {/* ── HEALTH ── */}
        {activeFeature==="health" && <HealthPanel t={t}/>}

        {/* ── DETEKSI OBJEK REAL ── */}
        {activeFeature==="detect" && (
          <DetectPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang}/>
        )}
      </div>
    </div>
  )
}