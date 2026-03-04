export type Language = "id" | "en"

export interface Translation {
  brand: string
  introducing: string
  tagline: string
  heroDesc: string
  preorderBtn: string
  navHome: string
  navDemo: string
  navPreorder: string
  hudTitle: string
  hudHint: string
  voiceTitle: string
  settingsTitle: string
  settingsHint: string
  tabNav: string
  tabNotif: string
  tabTranslate: string
  tabAI: string
  tabHealth: string
  tabDetect: string
  tabHUD: string
  tabVoice: string
  tabSettings: string
  active: string
  brightness: string
  language: string
  langID: string
  langEN: string
  settingToggles: string[]
  roadmapTitle: string
  footer: string
  preorderTitle: string
  preorderSub: string
  planBasicTitle: string
  planBasicSub: string
  planProTitle: string
  planProSub: string
  fieldName: string
  fieldNamePh: string
  fieldEmail: string
  fieldEmailPh: string
  confirmBtn: string
  cancelBtn: string
  successTitle: string
  successMsg: (n: string, e: string) => string
  closeBtn: string
  heartRate: string
  normal: string
  moderate: string
  high: string
  stepLabel: string
  stepUnit: string
  calLabel: string
  calUnit: string
  distLabel: string
  distUnit: string
  targetLabel: string
  cameraReady: string
  startScan: string
  scanning: string
  rescan: string
  detectedTitle: string
  confidence: string
  translating: string
  aiPrefix: string
  aiFullText: string
  aiQuickCmds: string[]
  turnRight: string
  voicePress: string
  voiceListening: string
  voiceDetected: string
  voiceResponse: string
  voiceQuickTitle: string
  voiceTip: string
  voiceTipCmds: string
  voiceNoSupport: string
  voicePermDenied: string
  voiceError: string
  notifCommandDetected: string
  featureCards: { icon: string; title: string; desc: string }[]
  roadmapSteps: { month: string; title: string; desc: string }[]
  navWaypoints: { label: string; dist: string; active: boolean }[]
  notifications: { id: number; type: string; icon: string; msg: string; time: string }[]
  voiceCommands: { cmd: string; display: string; response: string; icon: string }[]
  translations: { original: string; translated: string; lang: string }[]
  detectedObjects: { label: string; count: number; conf: number; color: string; x: number; y: number; w: number; h: number }[]
}

export const T: Record<Language, Translation> = {
  id: {
    brand: "V-OPTICS",
    introducing: "MEMPERKENALKAN",
    tagline: "KACAMATA PINTAR \u00B7 ANTARMUKA AI WEARABLE",
    heroDesc: "Dunia digital langsung di bidang pandangmu. Bebas genggam. Bebas gangguan.",
    preorderBtn: "DAFTAR PRE-ORDER \u2192",
    navHome: "BERANDA",
    navDemo: "DEMO LENGKAP",
    navPreorder: "PRE-ORDER",
    hudTitle: "SIMULASI HUD INTERAKTIF",
    hudHint: "Klik 6 tab di bawah \u2014 Navigasi, Notif, Terjemahan, AI, Kesehatan, dan Deteksi Objek.",
    voiceTitle: "SIMULASI VOICE CONTROL",
    settingsTitle: "PENGATURAN HUD",
    settingsHint: "Ubah brightness \u2192 langsung terlihat di HUD Simulator.",
    tabNav: "NAVIGASI", tabNotif: "NOTIF", tabTranslate: "TERJEMAH",
    tabAI: "AI", tabHealth: "KESEHATAN", tabDetect: "DETEKSI",
    tabHUD: "HUD SIMULATOR", tabVoice: "VOICE CONTROL", tabSettings: "PENGATURAN",
    active: "\u25CF AKTIF",
    brightness: "\u2600 Kecerahan HUD",
    language: "\uD83C\uDF10 Bahasa Antarmuka",
    langID: "Indonesia", langEN: "English",
    settingToggles: ["Notifikasi HUD","Navigasi AR","Terjemah Otomatis","Monitor Kesehatan","Deteksi Objek","Kontrol Suara","Mode Malam"],
    roadmapTitle: "ROADMAP PENGEMBANGAN",
    footer: "V-OPTICS \u00A9 2026 \u00B7 Naufal Faiq Azryan \u00B7 Universitas Telkom",
    preorderTitle: "PRE-ORDER V-OPTICS",
    preorderSub: "Jadilah yang pertama merasakan masa depan",
    planBasicTitle: "\u25C8 V-OPTICS BASIC", planBasicSub: "Gratis AI Dasar \u00B7 Rp 2.999.000",
    planProTitle: "\u2B21 V-OPTICS PRO", planProSub: "AI Premium \u00B7 Rp 3.499.000 + Rp 49.000/bln",
    fieldName: "NAMA LENGKAP", fieldNamePh: "Naufal Faiq...",
    fieldEmail: "EMAIL", fieldEmailPh: "kamu@email.com",
    confirmBtn: "KONFIRMASI PRE-ORDER", cancelBtn: "BATAL",
    successTitle: "TERDAFTAR!", successMsg: (n, e) => `Terima kasih, ${n}.\nNotifikasi ke ${e}.`,
    closeBtn: "TUTUP",
    heartRate: "DETAK JANTUNG", normal: "\u25CF NORMAL", moderate: "\u25CF SEDANG", high: "\u25CF TINGGI",
    stepLabel: "LANGKAH", stepUnit: "langkah", calLabel: "KALORI", calUnit: "kcal",
    distLabel: "JARAK", distUnit: "km", targetLabel: "% target",
    cameraReady: "KAMERA SIAP", startScan: "MULAI SCAN", scanning: "MEMINDAI...",
    rescan: "RESCAN", detectedTitle: "OBJEK TERDETEKSI", confidence: "Konfiden",
    translating: "MEMINDAI TEKS...",
    aiPrefix: "AI>",
    aiFullText: "Memindai lingkungan... objek terdeteksi: 12 \u00B7 Jarak aman: optimal \u00B7 Cuaca: berawan",
    aiQuickCmds: ["Navigasi ke rumah","Terjemahkan papan ini","Cari kafe terdekat"],
    turnRight: "\u25B2 BELOK KANAN 200M",
    voicePress: "TEKAN UNTUK BICARA", voiceListening: "MENDENGARKAN...",
    voiceDetected: "PERINTAH TERDETEKSI", voiceResponse: "RESPONS AI",
    voiceQuickTitle: "PERINTAH CEPAT",
    voiceTip: "Tip: Bicara jelas setelah tekan tombol mic. Coba perintah seperti",
    voiceTipCmds: '"navigasi", "terjemahkan", "kesehatan"',
    voiceNoSupport: "Browser tidak mendukung Web Speech API. Gunakan Chrome/Edge untuk fitur ini.",
    voicePermDenied: "Akses mikrofon ditolak. Izinkan mikrofon di pengaturan browser.",
    voiceError: "Gagal mendeteksi suara. Coba lagi.",
    notifCommandDetected: "Perintah dikenali dari daftar cepat:",
    featureCards: [
      {icon:"\u25C8",title:"Navigasi AR",desc:"Arah real-time langsung di pandangan."},
      {icon:"\u25C6",title:"Terjemah Visual",desc:"Terjemahan teks asing dalam 0.3 detik."},
      {icon:"\u25C9",title:"Notifikasi HUD",desc:"Alert muncul di sudut pandang secara halus."},
      {icon:"\u2B21",title:"AI Asisten",desc:"Asisten AI dengan perintah suara."},
      {icon:"\uD83C\uDFA4",title:"Voice Control",desc:"Kontrol semua fitur tanpa menyentuh apapun."},
      {icon:"\u2665",title:"Health Monitor",desc:"Pantau BPM, langkah, dan kalori real-time."},
      {icon:"\u2B22",title:"Deteksi Objek",desc:"AI kenali dan labeli objek sekitarmu."},
      {icon:"\u2699",title:"Kustomisasi",desc:"Atur kecerahan, bahasa, dan fitur sesuai kebutuhan."},
    ],
    roadmapSteps: [
      {month:"BLN 1",title:"Riset & Desain UI/UX",desc:"Antarmuka AR + navigasi"},
      {month:"BLN 2",title:"Simulasi & Video POV",desc:"Demo HUD interaktif"},
      {month:"BLN 3",title:"Mockup Fisik 3D",desc:"Cetak sasis kacamata"},
      {month:"BLN 4",title:"Kampanye Pre-Order",desc:"Kumpulkan early adopters"},
      {month:"BLN 5",title:"Pitching Investor",desc:"Presentasi pendanaan"},
    ],
    navWaypoints: [
      {label:"Kamu di sini",dist:"",active:true},
      {label:"Jl. Gatot Subroto",dist:"200m",active:false},
      {label:"Persimpangan Semanggi",dist:"1.2km",active:false},
      {label:"Telkom University",dist:"3.4km",active:false},
    ],
    notifications: [
      {id:1,type:"nav",icon:"\u25C8",msg:"Belok kanan 200m \u2192 Jl. Sudirman",time:"now"},
      {id:2,type:"msg",icon:"\u25C9",msg:"Pesan dari Budi: 'Sudah sampai mana?'",time:"2m"},
      {id:3,type:"ai",icon:"\u25C6",msg:"AI: Kedai kopi favorit kamu 50m di kiri",time:"5m"},
      {id:4,type:"alert",icon:"\u25B2",msg:"Cuaca: Hujan ringan dalam 20 menit",time:"8m"},
    ],
    voiceCommands: [
      {cmd:"navigasi ke telkom university",display:"Navigasi ke Telkom University",response:"Memulai navigasi \u2192 Telkom University. ETA 18 menit.",icon:"\u25C8"},
      {cmd:"terjemahkan teks ini",display:"Terjemahkan teks ini",response:"Mode terjemahan aktif. Arahkan pandangan ke teks.",icon:"\u25C6"},
      {cmd:"tampilkan kesehatan saya",display:"Tampilkan kesehatan saya",response:"Detak jantung: 72 BPM \u00B7 Langkah hari ini: 4.231",icon:"\u2665"},
      {cmd:"matikan notifikasi",display:"Matikan notifikasi",response:"Mode senyap aktif selama 1 jam.",icon:"\u25C9"},
      {cmd:"cari kafe terdekat",display:"Cari kafe terdekat",response:"Ditemukan 3 kafe dalam radius 500m. Menampilkan di HUD.",icon:"\u2B21"},
      {cmd:"deteksi objek sekitar",display:"Deteksi objek sekitar",response:"Mode deteksi aktif. Memindai lingkungan...",icon:"\u2B22"},
    ],
    translations: [
      {original:"WELCOME",translated:"SELAMAT DATANG",lang:"EN \u2192 ID"},
      {original:"Exit",translated:"Keluar",lang:"EN \u2192 ID"},
      {original:"\uC9C0\uAE08 \uC8FC\uBB38\uD558\uC138\uC694",translated:"Pesan Sekarang",lang:"KR \u2192 ID"},
      {original:"Toilette",translated:"Toilet",lang:"FR \u2192 ID"},
    ],
    detectedObjects: [
      {label:"Manusia",count:3,conf:98,color:"#0ff",x:30,y:25,w:18,h:35},
      {label:"Sepeda Motor",count:1,conf:94,color:"#ff0",x:62,y:45,w:22,h:20},
      {label:"Rambu Jalan",count:2,conf:89,color:"#f0f",x:10,y:10,w:12,h:18},
      {label:"Toko",count:1,conf:76,color:"#0f8",x:70,y:15,w:25,h:30},
    ],
  },
  en: {
    brand: "V-OPTICS",
    introducing: "INTRODUCING",
    tagline: "SMART GLASSES \u00B7 WEARABLE AI INTERFACE",
    heroDesc: "The digital world directly in your field of view. Hands-free. Distraction-free.",
    preorderBtn: "REGISTER PRE-ORDER \u2192",
    navHome: "HOME",
    navDemo: "FULL DEMO",
    navPreorder: "PRE-ORDER",
    hudTitle: "INTERACTIVE HUD SIMULATION",
    hudHint: "Click the 6 tabs below \u2014 Navigation, Notifications, Translation, AI, Health, and Object Detection.",
    voiceTitle: "VOICE CONTROL SIMULATION",
    settingsTitle: "HUD SETTINGS",
    settingsHint: "Change brightness \u2192 instantly reflected in the HUD Simulator.",
    tabNav: "NAVIGATE", tabNotif: "NOTIF", tabTranslate: "TRANSLATE",
    tabAI: "AI", tabHealth: "HEALTH", tabDetect: "DETECT",
    tabHUD: "HUD SIMULATOR", tabVoice: "VOICE CONTROL", tabSettings: "SETTINGS",
    active: "\u25CF ACTIVE",
    brightness: "\u2600 HUD Brightness",
    language: "\uD83C\uDF10 Interface Language",
    langID: "Indonesia", langEN: "English",
    settingToggles: ["HUD Notifications","AR Navigation","Auto Translate","Health Monitor","Object Detection","Voice Control","Night Mode"],
    roadmapTitle: "DEVELOPMENT ROADMAP",
    footer: "V-OPTICS \u00A9 2026 \u00B7 Naufal Faiq Azryan \u00B7 Telkom University",
    preorderTitle: "PRE-ORDER V-OPTICS",
    preorderSub: "Be the first to experience the future",
    planBasicTitle: "\u25C8 V-OPTICS BASIC", planBasicSub: "Free Basic AI \u00B7 IDR 2,999,000",
    planProTitle: "\u2B21 V-OPTICS PRO", planProSub: "Premium AI \u00B7 IDR 3,499,000 + IDR 49,000/mo",
    fieldName: "FULL NAME", fieldNamePh: "Your name...",
    fieldEmail: "EMAIL", fieldEmailPh: "you@email.com",
    confirmBtn: "CONFIRM PRE-ORDER", cancelBtn: "CANCEL",
    successTitle: "REGISTERED!", successMsg: (n, e) => `Thank you, ${n}.\nNotification will be sent to ${e}.`,
    closeBtn: "CLOSE",
    heartRate: "HEART RATE", normal: "\u25CF NORMAL", moderate: "\u25CF MODERATE", high: "\u25CF HIGH",
    stepLabel: "STEPS", stepUnit: "steps", calLabel: "CALORIES", calUnit: "kcal",
    distLabel: "DISTANCE", distUnit: "km", targetLabel: "% of target",
    cameraReady: "CAMERA READY", startScan: "START SCAN", scanning: "SCANNING...",
    rescan: "RESCAN", detectedTitle: "DETECTED OBJECTS", confidence: "Confidence",
    translating: "SCANNING TEXT...",
    aiPrefix: "AI>",
    aiFullText: "Scanning environment... objects detected: 12 \u00B7 Safe distance: optimal \u00B7 Weather: cloudy",
    aiQuickCmds: ["Navigate home","Translate this sign","Find nearest cafe"],
    turnRight: "\u25B2 TURN RIGHT IN 200M",
    voicePress: "PRESS TO SPEAK", voiceListening: "LISTENING...",
    voiceDetected: "COMMAND DETECTED", voiceResponse: "AI RESPONSE",
    voiceQuickTitle: "QUICK COMMANDS",
    voiceTip: "Tip: Speak clearly after pressing the mic. Try commands like",
    voiceTipCmds: '"navigate", "translate", "health"',
    voiceNoSupport: "Browser does not support Web Speech API. Use Chrome/Edge for this feature.",
    voicePermDenied: "Microphone access denied. Allow microphone in browser settings.",
    voiceError: "Failed to detect voice. Please try again.",
    notifCommandDetected: "Command recognized from quick list:",
    featureCards: [
      {icon:"\u25C8",title:"AR Navigation",desc:"Real-time directions projected directly in your view."},
      {icon:"\u25C6",title:"Visual Translate",desc:"Foreign text translation appears instantly in 0.3s."},
      {icon:"\u25C9",title:"HUD Notifications",desc:"Messages and alerts appear in your field of view subtly."},
      {icon:"\u2B21",title:"AI Assistant",desc:"AI assistant that responds to voice commands all day."},
      {icon:"\uD83C\uDFA4",title:"Voice Control",desc:"Control all features without touching anything."},
      {icon:"\u2665",title:"Health Monitor",desc:"Monitor BPM, steps, and calories in real-time."},
      {icon:"\u2B22",title:"Object Detection",desc:"AI recognizes and labels objects around you."},
      {icon:"\u2699",title:"Customization",desc:"Adjust brightness, language, and features as needed."},
    ],
    roadmapSteps: [
      {month:"MO 1",title:"Research & UI/UX Design",desc:"AR interface + navigation"},
      {month:"MO 2",title:"Simulation & POV Video",desc:"Interactive HUD demo"},
      {month:"MO 3",title:"3D Physical Mockup",desc:"Print glasses chassis"},
      {month:"MO 4",title:"Pre-Order Campaign",desc:"Gather early adopters"},
      {month:"MO 5",title:"Investor Pitch",desc:"Funding presentation"},
    ],
    navWaypoints: [
      {label:"You are here",dist:"",active:true},
      {label:"Gatot Subroto St.",dist:"200m",active:false},
      {label:"Semanggi Intersection",dist:"1.2km",active:false},
      {label:"Telkom University",dist:"3.4km",active:false},
    ],
    notifications: [
      {id:1,type:"nav",icon:"\u25C8",msg:"Turn right in 200m \u2192 Sudirman St.",time:"now"},
      {id:2,type:"msg",icon:"\u25C9",msg:"Message from Budi: 'Where are you?'",time:"2m"},
      {id:3,type:"ai",icon:"\u25C6",msg:"AI: Your favorite cafe is 50m to the left",time:"5m"},
      {id:4,type:"alert",icon:"\u25B2",msg:"Weather: Light rain in 20 minutes",time:"8m"},
    ],
    voiceCommands: [
      {cmd:"navigate to telkom university",display:"Navigate to Telkom University",response:"Starting navigation \u2192 Telkom University. ETA 18 minutes.",icon:"\u25C8"},
      {cmd:"translate this text",display:"Translate this text",response:"Translation mode active. Look at the text to translate.",icon:"\u25C6"},
      {cmd:"show my health",display:"Show my health",response:"Heart rate: 72 BPM \u00B7 Steps today: 4,231",icon:"\u2665"},
      {cmd:"mute notifications",display:"Mute notifications",response:"Silent mode active for 1 hour.",icon:"\u25C9"},
      {cmd:"find nearest cafe",display:"Find nearest cafe",response:"Found 3 cafes within 500m radius. Displaying on HUD.",icon:"\u2B21"},
      {cmd:"detect nearby objects",display:"Detect nearby objects",response:"Detection mode active. Scanning environment...",icon:"\u2B22"},
    ],
    translations: [
      {original:"SELAMAT DATANG",translated:"WELCOME",lang:"ID \u2192 EN"},
      {original:"Keluar",translated:"Exit",lang:"ID \u2192 EN"},
      {original:"\uC9C0\uAE08 \uC8FC\uBB38\uD558\uC138\uC694",translated:"Order Now",lang:"KR \u2192 EN"},
      {original:"Toilette",translated:"Restroom",lang:"FR \u2192 EN"},
    ],
    detectedObjects: [
      {label:"Person",count:3,conf:98,color:"#0ff",x:30,y:25,w:18,h:35},
      {label:"Motorcycle",count:1,conf:94,color:"#ff0",x:62,y:45,w:22,h:20},
      {label:"Road Sign",count:2,conf:89,color:"#f0f",x:10,y:10,w:12,h:18},
      {label:"Store",count:1,conf:76,color:"#0f8",x:70,y:15,w:25,h:30},
    ],
  },
}
