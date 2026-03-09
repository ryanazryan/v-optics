"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"
import type { VoiceAction } from "@/app/page"
import { HealthPanel } from "./health-panel"
import { VoicePanel } from "./voice-panel"

// ── HOME PANEL — News Feed ─────────────────────────────────────────────────
interface NewsArticle {
  id: string
  title: string
  summary: string
  category: string
  source: string
  time: string
  imageGradient: string
  emoji: string
  catColor?: string
  imageUrl?: string | null
  url?: string
}

// Placeholder news — in production, replace with NewsAPI / RSS feed via /api/news
function getPlaceholderNews(lang: string): NewsArticle[] {
  const isId = lang !== "en"
  return isId ? [
    { id:"1", title:"Teknologi AI Semakin Canggih di 2025", summary:"Model bahasa generasi terbaru mampu memahami konteks lebih dalam dan berinteraksi lebih natural dengan pengguna sehari-hari.", category:"Teknologi", source:"TechID", time:"5 mnt lalu", imageGradient:"linear-gradient(135deg,#0a2a4a,#1a4a8a)", emoji:"🤖" },
    { id:"2", title:"Pasar Saham Asia Menguat Pagi Ini", summary:"Bursa efek di kawasan Asia Pasifik mencatat kenaikan di tengah sentimen positif dari data ekonomi Amerika Serikat yang lebih baik.", category:"Ekonomi", source:"BisnisNews", time:"12 mnt lalu", imageGradient:"linear-gradient(135deg,#0a3a1a,#1a6a2a)", emoji:"📈" },
    { id:"3", title:"Gempa M5.2 Guncang Sulawesi Tengah", summary:"BMKG melaporkan gempa berkekuatan 5.2 SR mengguncang wilayah Palu pukul 07.34 WIB. Warga diminta tetap waspada.", category:"Nasional", source:"BMKG", time:"18 mnt lalu", imageGradient:"linear-gradient(135deg,#3a1a0a,#6a2a0a)", emoji:"🌍" },
    { id:"4", title:"Timnas Indonesia Menang 2-1 Lawan Vietnam", summary:"Skuad Garuda berhasil mengamankan tiga poin dalam laga kualifikasi Piala Asia di Stadion GBK Jakarta.", category:"Olahraga", source:"SportID", time:"1 jam lalu", imageGradient:"linear-gradient(135deg,#1a0a3a,#3a1a6a)", emoji:"⚽" },
    { id:"5", title:"BPJS Kesehatan Perluas Layanan Digital", summary:"Peserta BPJS kini bisa mengakses layanan lebih mudah melalui aplikasi Mobile JKN yang diperbarui.", category:"Kesehatan", source:"HealthID", time:"2 jam lalu", imageGradient:"linear-gradient(135deg,#2a0a2a,#4a1a4a)", emoji:"🏥" },
    { id:"6", title:"Bandara Soekarno-Hatta Ramai Pemudik", summary:"Volume penumpang di Bandara Soetta meningkat 40% jelang akhir pekan panjang. Pengelola imbau datang lebih awal.", category:"Transportasi", source:"AviationID", time:"3 jam lalu", imageGradient:"linear-gradient(135deg,#0a2a3a,#0a4a5a)", emoji:"✈️" },
  ] : [
    { id:"1", title:"AI Models Reach New Intelligence Milestone", summary:"The latest generation of language models demonstrates unprecedented reasoning abilities, changing how we interact with technology.", category:"Tech", source:"TechCrunch", time:"5 min ago", imageGradient:"linear-gradient(135deg,#0a2a4a,#1a4a8a)", emoji:"🤖" },
    { id:"2", title:"Global Markets Rally on Fed Optimism", summary:"Stock markets worldwide surged as investors welcomed signals that interest rate cuts may come sooner than expected.", category:"Finance", source:"Bloomberg", time:"12 min ago", imageGradient:"linear-gradient(135deg,#0a3a1a,#1a6a2a)", emoji:"📈" },
    { id:"3", title:"Climate Summit Reaches Historic Agreement", summary:"Over 190 countries signed a landmark deal to phase out fossil fuels by 2045, the most ambitious climate pact ever.", category:"World", source:"Reuters", time:"18 min ago", imageGradient:"linear-gradient(135deg,#1a2a0a,#2a4a0a)", emoji:"🌍" },
    { id:"4", title:"SpaceX Starship Completes 7th Test Flight", summary:"Elon Musk's company successfully landed both the booster and the spacecraft, marking a major milestone in space exploration.", category:"Space", source:"Space.com", time:"1 hr ago", imageGradient:"linear-gradient(135deg,#1a0a3a,#3a1a6a)", emoji:"🚀" },
    { id:"5", title:"New Study Links Sleep to Brain Health", summary:"Researchers found that 7-9 hours of quality sleep dramatically reduces the risk of cognitive decline in later life.", category:"Health", source:"WebMD", time:"2 hr ago", imageGradient:"linear-gradient(135deg,#2a0a2a,#4a1a4a)", emoji:"🧠" },
    { id:"6", title:"Electric Vehicle Sales Hit Record High", summary:"Global EV sales crossed 20 million units this quarter, driven by new affordable models from Chinese manufacturers.", category:"Auto", source:"AutoWeek", time:"3 hr ago", imageGradient:"linear-gradient(135deg,#0a2a3a,#0a4a5a)", emoji:"🚗" },
  ]
}


// ─────────────────────────────────────────────────────────────────────────────
// APPS PANEL — Mock Social App Hub with call notifications
// ─────────────────────────────────────────────────────────────────────────────

type MockMessage = {
  id: string; sender: string; text: string; time: string
  unread: boolean; avatar: string; app: string
}
type MockApp = {
  id: string; name: string; icon: string; color: string
  bgGrad: string; category: string; unread: number
}
type IncomingCall = {
  id: string; caller: string; app: string; avatar: string; duration: number
}

const MOCK_APPS: MockApp[] = [
  {id:"whatsapp", name:"WhatsApp",  icon:"💬", color:"#25D366", bgGrad:"linear-gradient(135deg,#075E54,#128C7E)", category:"Social", unread:3},
  {id:"instagram",name:"Instagram", icon:"📸", color:"#E1306C", bgGrad:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", category:"Social", unread:12},
  {id:"telegram", name:"Telegram",  icon:"✈", color:"#2AABEE", bgGrad:"linear-gradient(135deg,#0a4a7a,#2AABEE)", category:"Social", unread:5},
  {id:"twitter",  name:"X / Twitter",icon:"✖",color:"#1DA1F2", bgGrad:"linear-gradient(135deg,#14171A,#1DA1F2)", category:"Social", unread:0},
  {id:"gmail",    name:"Gmail",     icon:"✉", color:"#EA4335", bgGrad:"linear-gradient(135deg,#4a0a0a,#EA4335)", category:"Productivity", unread:8},
  {id:"maps",     name:"Maps",      icon:"🗺", color:"#4285F4", bgGrad:"linear-gradient(135deg,#0a1a4a,#4285F4)", category:"Tools", unread:0},
  {id:"spotify",  name:"Spotify",   icon:"♫", color:"#1DB954", bgGrad:"linear-gradient(135deg,#191414,#1DB954)", category:"Media", unread:0},
  {id:"youtube",  name:"YouTube",   icon:"▶", color:"#FF0000", bgGrad:"linear-gradient(135deg,#2a0a0a,#FF0000)", category:"Media", unread:2},
]

const MOCK_MESSAGES: Record<string,MockMessage[]> = {
  whatsapp: [
    {id:"wm1",sender:"Budi Santoso",  text:"Bro meeting jam 3 sore ya? Jangan lupa",time:"09:42",unread:true, avatar:"BS",app:"whatsapp"},
    {id:"wm2",sender:"Sarah Putri",   text:"Makasih ya kemarin udah bantuin 🙏",      time:"09:15",unread:true, avatar:"SP",app:"whatsapp"},
    {id:"wm3",sender:"Grup Proyek",   text:"File desainnya udah gue upload ke drive",  time:"08:30",unread:true, avatar:"GP",app:"whatsapp"},
    {id:"wm4",sender:"Mama",          text:"Pulang makan malem bareng ya nak",         time:"08:00",unread:false,avatar:"M", app:"whatsapp"},
    {id:"wm5",sender:"Rizky",         text:"Gw on the way ke kantor",                  time:"07:45",unread:false,avatar:"R", app:"whatsapp"},
  ],
  instagram: [
    {id:"im1",sender:"@designhub_id",text:"Liked your photo ❤️",                     time:"10:01",unread:true, avatar:"DH",app:"instagram"},
    {id:"im2",sender:"@naufal_dev",  text:"Mentioned you in a story",                time:"09:50",unread:true, avatar:"ND",app:"instagram"},
    {id:"im3",sender:"@techasia",    text:"New post: V-Optics featured! 🚀",         time:"09:20",unread:true, avatar:"TA",app:"instagram"},
  ],
  telegram: [
    {id:"tm1",sender:"Dev Indonesia", text:"📢 Update: Next.js 15.3 released",        time:"10:05",unread:true, avatar:"DI",app:"telegram"},
    {id:"tm2",sender:"Crypto Alert",  text:"BTC +3.2% in last hour",                  time:"09:55",unread:true, avatar:"CA",app:"telegram"},
    {id:"tm3",sender:"Hasan",         text:"Kapan kita lunch bareng?",                time:"09:10",unread:false,avatar:"H", app:"telegram"},
  ],
  gmail: [
    {id:"gm1",sender:"GitHub",        text:"[V-Optics] New pull request merged",      time:"09:58",unread:true, avatar:"GH",app:"gmail"},
    {id:"gm2",sender:"Anthropic",     text:"Your Claude API usage report for March",  time:"09:00",unread:true, avatar:"AN",app:"gmail"},
    {id:"gm3",sender:"Telkom Univ",   text:"Jadwal seminar skripsi - PENTING",        time:"08:20",unread:true, avatar:"TU",app:"gmail"},
  ],
  youtube: [
    {id:"ym1",sender:"Fireship",      text:"New: 100 seconds of V-Optics HUD",        time:"08:45",unread:true, avatar:"F", app:"youtube"},
    {id:"ym2",sender:"Theo",          text:"Why Smart Glasses Will Replace Phones",   time:"07:30",unread:true, avatar:"T", app:"youtube"},
  ],
}

// ── Brand-accurate app icons (inline SVG) ────────────────────────────────────
function AppIcon({id,size=22}:{id:string;size?:number}) {
  const s = size
  switch(id) {
    case "whatsapp": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#25D366"/>
        <path d="M16 6C10.477 6 6 10.477 6 16c0 1.89.523 3.655 1.432 5.163L6 26l4.98-1.408A9.95 9.95 0 0016 26c5.523 0 10-4.477 10-10S21.523 6 16 6z" fill="#fff"/>
        <path d="M21.5 18.5c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51-.17 0-.37-.02-.57-.02-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" fill="#25D366"/>
      </svg>
    )
    case "instagram": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <defs>
          <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497"/>
            <stop offset="5%" stopColor="#fdf497"/>
            <stop offset="45%" stopColor="#fd5949"/>
            <stop offset="60%" stopColor="#d6249f"/>
            <stop offset="90%" stopColor="#285AEB"/>
          </radialGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#ig1)"/>
        <rect x="8" y="8" width="16" height="16" rx="4.5" stroke="#fff" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="16" r="4" stroke="#fff" strokeWidth="2" fill="none"/>
        <circle cx="21.5" cy="10.5" r="1.2" fill="#fff"/>
      </svg>
    )
    case "telegram": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2AABEE"/>
        <path d="M7 15.5l3.5 1.3 1.4 4.3 1.7-2 3.7 2.7 4.7-12.1-15 5.8z" fill="#c8daea"/>
        <path d="M10.5 16.8l.5 4 1.7-2" fill="#a9c9dd"/>
        <path d="M10.5 16.8l8.5 6.3 3-14-11.5 7.7z" fill="#fff"/>
      </svg>
    )
    case "twitter": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#000"/>
        <path d="M17.75 14.77L24.16 7.5h-1.52l-5.56 6.47-4.44-6.47H7.5l6.72 9.79-6.72 7.71h1.52l5.88-6.84 4.7 6.84H24.5l-6.75-9.73zm-2.08 2.42l-.68-.98-5.43-7.76H11.8l4.37 6.25.68.98 5.68 8.12h-2.32l-4.64-6.61z" fill="#fff"/>
      </svg>
    )
    case "gmail": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="4" fill="#fff"/>
        <path d="M4 10v12h4V14l8 6 8-6v8h4V10l-12 9L4 10z" fill="#EA4335"/>
        <path d="M4 10l12 9 12-9H4z" fill="#FBBC05"/>
        <path d="M28 10h-4v12h4V10z" fill="#34A853"/>
        <path d="M4 10H8v12H4V10z" fill="#C5221F"/>
      </svg>
    )
    case "maps": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#fff"/>
        <path d="M10 8l6 2 6-2v16l-6 2-6-2V8z" fill="#34A853"/>
        <path d="M10 8l6 2V26l-6-2V8z" fill="#FBBC04"/>
        <path d="M16 10l6-2v16l-6 2V10z" fill="#4285F4"/>
        <circle cx="16" cy="14" r="2.5" fill="#EA4335"/>
        <path d="M16 16.5s-3.5-3.2-3.5-5.5a3.5 3.5 0 017 0c0 2.3-3.5 5.5-3.5 5.5z" fill="#EA4335" opacity=".3"/>
      </svg>
    )
    case "spotify": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#1DB954"/>
        <path d="M10 20.5c4.5-1.5 9-1 13 .5" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 17c5-1.8 10.5-1.3 14.5.7" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8.5 13.5c6-2.2 12-1.5 16 1" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    )
    case "youtube": return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="7" fill="#FF0000"/>
        <path d="M26 11.5s-.25-1.75-1-2.5c-.96-1-2.04-1.01-2.53-1.07C19.53 7.75 16 7.75 16 7.75s-3.53 0-6.47.18c-.49.06-1.57.07-2.53 1.07-.75.75-1 2.5-1 2.5S5.75 13.5 5.75 15.5v1.87c0 2 .25 4 .25 4s.25 1.75 1 2.5c.96 1 2.22.97 2.78 1.07C11.75 25.1 16 25.13 16 25.13s3.53 0 6.47-.21c.49-.06 1.57-.07 2.53-1.07.75-.75 1-2.5 1-2.5S26.25 19.37 26.25 17.37V15.5C26.25 13.5 26 11.5 26 11.5z" fill="#FF0000"/>
        <path d="M13.5 20l7-4.5-7-4.5V20z" fill="#fff"/>
      </svg>
    )
    default: return <span style={{fontSize:s*0.7}}>📱</span>
  }
}


// ── APPS PANEL — OAuth WebView + API Feed ─────────────────────────────────────
//
// Architecture:
//   1. User clicks app → we open a popup OAuth window (real login page)
//   2. After login, platform redirects to our /api/oauth/callback?app=xxx&token=yyy
//   3. We store the token in state and fetch the feed via platform APIs
//   4. For YouTube: uses Data API v3 (no OAuth needed for public content)
//   5. For WhatsApp Web: opens real web.whatsapp.com in popup (QR flow)
//
// SETUP (add to .env.local):
//   INSTAGRAM_CLIENT_ID=xxx   → https://developers.facebook.com/apps
//   SPOTIFY_CLIENT_ID=xxx     → https://developer.spotify.com/dashboard
//   YOUTUBE_API_KEY=xxx       → https://console.cloud.google.com
//   TWITTER_CLIENT_ID=xxx     → https://developer.twitter.com
//   NEXT_PUBLIC_BASE_URL=https://yourdomain.com

type AppSession = {
  app: string
  token: string
  user?: { name: string; avatar: string; username?: string }
}

// ── OAuth App Config ───────────────────────────────────────────────────────
// ── App Strategy:
// EMBED (iframe via /api/proxy) — works: YouTube, Maps, Telegram, X, Spotify
// DEEP LINK — opens native app on phone: WhatsApp, Instagram, Gmail
// OAUTH POPUP — opens in popup window: Gmail full web
// ── Proxy helper ──────────────────────────────────────────────────────────────
// Semua URL dilewatkan melalui /api/proxy agar X-Frame-Options di-strip server-side
// ── App Config ────────────────────────────────────────────────────────────────
// strategy:
//   "embed"    → official iframe embed (no X-Frame-Options issues)
//   "deeplink" → open native app / browser (WA, IG, Gmail, Telegram, X)
const APP_CONFIG = [
  {
    id: "youtube", name: "YouTube", color: "#FF0000", bgColor: "#0f0f0f",
    strategy: "embed",
    // Official YouTube embed — searches trending, no login needed
    embedUrl: "https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0&modestbranding=1",
    note_id: "Tonton video tanpa login. Gunakan search di dalam player.",
    note_en: "Watch videos without login. Use search inside the player.",
    desc_id: "Video & streaming",
    desc_en: "Videos & streaming",
  },
  {
    id: "spotify", name: "Spotify", color: "#1DB954", bgColor: "#121212",
    strategy: "embed",
    // Official Spotify embed — Top 50 Global playlist, no login for 30s previews
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF?utm_source=generator&theme=0&autoplay=0",
    note_id: "Preview 30 detik gratis. Login Spotify untuk lagu penuh.",
    note_en: "30-second free previews. Login Spotify for full tracks.",
    desc_id: "Musik & podcast",
    desc_en: "Music & podcasts",
  },
  {
    id: "maps", name: "Google Maps", color: "#4285F4", bgColor: "#1a1a2e",
    strategy: "embed",
    // Official Maps embed — requires NEXT_PUBLIC_MAPS_KEY in .env.local (free tier)
    embedUrl: "https://maps.google.com/maps?q=current+location&output=embed&hl=id",
    note_id: "Tambahkan NEXT_PUBLIC_MAPS_KEY di .env.local untuk Maps embed penuh.",
    note_en: "Add NEXT_PUBLIC_MAPS_KEY to .env.local for full Maps embed.",
    desc_id: "Navigasi & tempat",
    desc_en: "Navigate & find places",
  },
  {
    id: "whatsapp", name: "WhatsApp", color: "#25D366", bgColor:"#111b21",
    strategy: "deeplink",
    links: [
      { label_id:"Buka WhatsApp di HP",   label_en:"Open WhatsApp on phone", url:"whatsapp://",               icon:"📱" },
      { label_id:"WhatsApp Web",          label_en:"WhatsApp Web",           url:"https://web.whatsapp.com",  icon:"🌐" },
      { label_id:"Kirim Pesan Baru",      label_en:"Send New Message",       url:"https://wa.me/",            icon:"✉️" },
    ],
    note_id: "WhatsApp memblokir embedding di semua browser untuk keamanan E2E.",
    note_en: "WhatsApp blocks all iframe embedding for E2E security.",
    desc_id: "Pesan & panggilan",
    desc_en: "Messages & calls",
  },
  {
    id: "instagram", name: "Instagram", color: "#E1306C", bgColor:"#1a1a2e",
    strategy: "deeplink",
    links: [
      { label_id:"Buka Instagram di HP",  label_en:"Open Instagram on phone", url:"instagram://",               icon:"📱" },
      { label_id:"Instagram Web",         label_en:"Instagram Web",           url:"https://www.instagram.com",  icon:"🌐" },
    ],
    note_id: "Instagram memblokir embedding. Buka di app atau browser.",
    note_en: "Instagram blocks embedding. Open in app or browser.",
    desc_id: "Feed, Reels & Stories",
    desc_en: "Feed, Reels & Stories",
  },
  {
    id: "telegram", name: "Telegram", color: "#2AABEE", bgColor:"#1c2433",
    strategy: "deeplink",
    links: [
      { label_id:"Buka Telegram di HP",   label_en:"Open Telegram on phone",  url:"tg://",                         icon:"📱" },
      { label_id:"Telegram Web",          label_en:"Telegram Web",            url:"https://web.telegram.org/k/",   icon:"🌐" },
    ],
    note_id: "Telegram Web memblokir embedding sejak 2023.",
    note_en: "Telegram Web blocks embedding since 2023.",
    desc_id: "Pesan & channel",
    desc_en: "Messages & channels",
  },
  {
    id: "gmail", name: "Gmail", color: "#EA4335", bgColor:"#1e1e1e",
    strategy: "deeplink",
    links: [
      { label_id:"Buka Gmail di HP",      label_en:"Open Gmail on phone",     url:"googlegmail://",             icon:"📱" },
      { label_id:"Gmail Web",             label_en:"Gmail Web",               url:"https://mail.google.com",    icon:"🌐" },
    ],
    note_id: "Gmail memblokir embedding untuk keamanan akun Google.",
    note_en: "Gmail blocks embedding for Google account security.",
    desc_id: "Email & kotak masuk",
    desc_en: "Email & inbox",
  },
  {
    id: "twitter", name: "X / Twitter", color: "#e7e9ea", bgColor:"#15202b",
    strategy: "deeplink",
    links: [
      { label_id:"Buka X di HP",          label_en:"Open X on phone",         url:"twitter://",            icon:"📱" },
      { label_id:"X Web",                 label_en:"X Web",                   url:"https://x.com",         icon:"🌐" },
      { label_id:"Jelajahi Trending",     label_en:"Browse Trending",         url:"https://x.com/explore", icon:"🔥" },
    ],
    note_id: "X memblokir embedding untuk mencegah scraping.",
    note_en: "X blocks embedding to prevent scraping.",
    desc_id: "Tweet & trending",
    desc_en: "Tweets & trending",
  },
]

type AppLink = { label_id:string; label_en:string; url:string; icon:string }
type AppCfg  = typeof APP_CONFIG[0]

function AppsPanel({accent,accentDim,accentFaint,lang,theme,onIncomingCall}:{
  accent:string;accentDim:string;accentFaint:string;lang:string;theme:any;
  onIncomingCall:(c:any)=>void
}) {
  const [activeApp, setActiveApp] = useState<string|null>(null)
  const [loading,   setLoading]   = useState(true)
  const T = theme
  const current = APP_CONFIG.find(a => a.id === activeApp)

  // ── Embed View ─────────────────────────────────────────────────────────────
  const EmbedView = ({ app }: { app: AppCfg }) => {
    const url = (app as any).embedUrl || (app as any).embedUrlFallback || ""
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",gap:0}}>
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:6,
          paddingBottom:6,marginBottom:4,flexShrink:0,
          borderBottom:`1px solid ${accentDim}`}}>
          <button onClick={()=>setActiveApp(null)}
            style={{padding:"3px 9px",borderRadius:3,cursor:"pointer",
              border:`1px solid ${accentDim}`,background:"transparent",
              color:accentDim,fontSize:9,fontFamily:"monospace"}}>←</button>
          <div style={{width:18,height:18,borderRadius:5,overflow:"hidden",flexShrink:0}}>
            <AppIcon id={app.id} size={18}/>
          </div>
          <span style={{fontSize:9.5,fontWeight:"bold",color:T.textPrimary,flex:1}}>
            {app.name}
          </span>
          <span style={{fontSize:6.5,padding:"1px 7px",borderRadius:20,
            background:`${app.color}18`,color:app.color,
            border:`1px solid ${app.color}44`}}>
            ✓ {lang==="en"?"Official embed":"Embed resmi"}
          </span>
        </div>
        {/* iframe */}
        <div style={{flex:1,position:"relative",borderRadius:6,overflow:"hidden",
          border:`1px solid ${accentDim}`,minHeight:0}}>
          {loading && (
            <div style={{position:"absolute",inset:0,zIndex:10,
              display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",
              gap:10,background:T.bgCard}}>
              <div style={{width:32,height:32,borderRadius:10,overflow:"hidden"}}>
                <AppIcon id={app.id} size={32}/>
              </div>
              <div style={{width:16,height:16,border:`2px solid ${app.color}`,
                borderTopColor:"transparent",borderRadius:"50%",
                animation:"spin 0.8s linear infinite"}}/>
              <span style={{fontSize:8,color:accentDim}}>
                {lang==="en"?"Loading...":"Memuat..."}
              </span>
            </div>
          )}
          <iframe
              key={app.id}
              src={url}
              style={{width:"100%",height:"100%",border:"none",
                background:app.bgColor,colorScheme:"dark"}}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
              allowFullScreen
              title={app.name}
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={()=>setLoading(false)}
            />
        </div>
        {/* Note */}
        <div style={{marginTop:4,padding:"4px 8px",borderRadius:5,flexShrink:0,
          background:`${accent}08`,border:`1px solid ${accentDim}33`,
          fontSize:7,color:accentDim}}>
          💡 {lang==="en"?(app as any).note_en:(app as any).note_id}
        </div>
      </div>
    )
  }

  // ── Deep Link View ─────────────────────────────────────────────────────────
  const DeepLinkView = ({ app }: { app: AppCfg }) => (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:8,
        paddingBottom:8,marginBottom:8,flexShrink:0,
        borderBottom:`1px solid ${accentDim}`}}>
        <button onClick={()=>setActiveApp(null)}
          style={{padding:"3px 9px",borderRadius:3,cursor:"pointer",
            border:`1px solid ${accentDim}`,background:"transparent",
            color:accentDim,fontSize:9,fontFamily:"monospace"}}>←</button>
        <div style={{width:20,height:20,borderRadius:6,overflow:"hidden"}}>
          <AppIcon id={app.id} size={20}/>
        </div>
        <span style={{fontSize:10,fontWeight:"bold",color:T.textPrimary}}>{app.name}</span>
      </div>
      {/* Icon */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",
        padding:"16px 0 14px",gap:8}}>
        <div style={{width:64,height:64,borderRadius:18,overflow:"hidden",
          boxShadow:`0 4px 24px ${app.color}55`}}>
          <AppIcon id={app.id} size={64}/>
        </div>
        <div style={{fontSize:11,fontWeight:"bold",color:T.textPrimary}}>{app.name}</div>
        <div style={{fontSize:7.5,color:"#f88",textAlign:"center",lineHeight:1.6,
          maxWidth:"90%",padding:"5px 10px",borderRadius:5,
          background:"#ff444410",border:"1px solid #f8870030"}}>
          ⚠ {lang==="en"?(app as any).note_en:(app as any).note_id}
        </div>
      </div>
      {/* Buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:7,padding:"0 4px"}}>
        {((app as any).links as AppLink[]).map((lk, i) => (
          <button key={i}
            onClick={()=>window.open(lk.url,"_blank","noopener,noreferrer")}
            style={{display:"flex",alignItems:"center",gap:10,
              padding:"10px 14px",borderRadius:8,cursor:"pointer",
              border:`1px solid ${i===0?app.color:accentDim}`,
              background:i===0?`${app.color}18`:T.bgCard,
              color:i===0?app.color:T.textPrimary,
              fontSize:9,fontFamily:"monospace",textAlign:"left",
              transition:"all 0.15s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=app.color}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=i===0?app.color:accentDim}}>
            <span style={{fontSize:15,lineHeight:1}}>{lk.icon}</span>
            <span>{lang==="en"?lk.label_en:lk.label_id}</span>
            <span style={{marginLeft:"auto",fontSize:8,color:accentDim}}>↗</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Active app ─────────────────────────────────────────────────────────────
  if (activeApp && current) {
    return (current as any).strategy === "embed"
      ? <EmbedView  app={current}/>
      : <DeepLinkView app={current}/>
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{fontSize:11,fontWeight:"bold",color:accent,
        marginBottom:6,letterSpacing:0.5,textShadow:`0 0 8px ${accent}66`}}>
        ⊞ {lang==="en"?"APPLICATIONS":"APLIKASI"}
      </div>
      <div style={{flex:1,overflowY:"auto",scrollbarWidth:"thin",
        scrollbarColor:`${accentDim} transparent`}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {APP_CONFIG.map(app=>(
            <div key={app.id}
              onClick={()=>{setActiveApp(app.id);setLoading(true)}}
              style={{display:"flex",flexDirection:"column",alignItems:"center",
                padding:"10px 4px 8px",borderRadius:10,cursor:"pointer",
                border:`1px solid ${accentDim}`,background:T.bgCard,
                transition:"all 0.18s",position:"relative"}}
              onMouseEnter={e=>{
                const el=e.currentTarget as HTMLElement
                el.style.borderColor=app.color
                el.style.transform="scale(1.06)"
                el.style.background=`${app.color}14`
              }}
              onMouseLeave={e=>{
                const el=e.currentTarget as HTMLElement
                el.style.borderColor=accentDim
                el.style.transform="scale(1)"
                el.style.background=T.bgCard
              }}>
              <div style={{width:40,height:40,borderRadius:12,overflow:"hidden",
                marginBottom:5,boxShadow:`0 2px 14px ${app.color}55`}}>
                <AppIcon id={app.id} size={40}/>
              </div>
              <div style={{fontSize:7,color:T.textPrimary,textAlign:"center",
                fontWeight:"bold",lineHeight:1.2,
                overflow:"hidden",textOverflow:"ellipsis",
                whiteSpace:"nowrap",width:"100%",paddingInline:2}}>
                {app.name.split(" ")[0]}
              </div>
              <div style={{fontSize:6,color:accentDim,marginTop:1,textAlign:"center",
                overflow:"hidden",textOverflow:"ellipsis",
                whiteSpace:"nowrap",width:"100%",paddingInline:2}}>
                {lang==="en"?app.desc_en:app.desc_id}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

function IncomingCallBubble({call,accent,accentDim,lang,tk,onAnswer,onDecline}:{
  call:IncomingCall; accent:string; accentDim:string; lang:string; tk?:any
  onAnswer:()=>void; onDecline:()=>void
}) {
  const [elapsed, setElapsed] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [callTime, setCallTime] = useState(0)

  useEffect(()=>{
    if (answered) {
      const i = setInterval(()=>setCallTime(t=>t+1),1000)
      return ()=>clearInterval(i)
    }
    const i = setInterval(()=>setElapsed(t=>t+1),1000)
    return ()=>clearInterval(i)
  },[answered])

  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

  return (
    <div style={{
      position:"absolute",top:8,right:8,zIndex:50,
      width:190,borderRadius:14,overflow:"hidden",
      background:tk?.bgSurface??"rgba(9,9,11,0.95)",
      border:`1.5px solid ${answered?"#25D366":accent}`,
      boxShadow:`0 8px 32px rgba(0,0,0,0.7),0 0 20px ${answered?"#25D36644":`${accent}44`}`,
      backdropFilter:"blur(12px)",
      animation:"fadeIn 0.3s ease",
    }}>
      {/* Top gradient bar */}
      <div style={{height:3,background:answered?"linear-gradient(90deg,#25D366,#128C7E)":
        `linear-gradient(90deg,${accent},${accentDim})`}}/>

      <div style={{padding:"10px 12px"}}>
        {/* App badge */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:7.5,color:accentDim,letterSpacing:1}}>
            {call.app.toUpperCase()} {lang==="en"?"CALL":"TELEPON"}
          </div>
          <div style={{fontSize:7.5,color:answered?"#25D366":accent}}>
            {answered?fmt(callTime):elapsed>0?`${elapsed}s`:"Ringing..."}
          </div>
        </div>

        {/* Caller info */}
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
          <div style={{
            width:38,height:38,borderRadius:"50%",flexShrink:0,
            background:answered?"linear-gradient(135deg,#075E54,#25D366)":
              `linear-gradient(135deg,${accentDim},${accent})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:13,fontWeight:"bold",color:"#fff",
            boxShadow:answered?`0 0 12px #25D36666`:`0 0 12px ${accent}66`,
            animation:answered?"none":"pulse 1.5s ease infinite",
          }}>
            {call.avatar}
          </div>
          <div>
            <div style={{fontSize:11.5,fontWeight:"bold",color:tk?.text??"#fff",marginBottom:2}}>{call.caller}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.55)"}}>
              {answered?(lang==="en"?"Call in progress":"Sedang dalam panggilan"):(lang==="en"?"Incoming call":"Panggilan masuk")}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!answered ? (
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>{setAnswered(true);onAnswer()}}
              style={{flex:1,padding:"7px",borderRadius:8,cursor:"pointer",border:"none",
                background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",
                fontSize:9,fontWeight:"bold",
                boxShadow:"0 2px 8px rgba(37,211,102,0.4)",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
              📞 {lang==="en"?"Answer":"Angkat"}
            </button>
            <button onClick={onDecline}
              style={{flex:1,padding:"7px",borderRadius:8,cursor:"pointer",border:"none",
                background:"linear-gradient(135deg,#aa2222,#ff4444)",color:"#fff",
                fontSize:9,fontWeight:"bold",
                boxShadow:"0 2px 8px rgba(255,68,68,0.4)",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
              ✕ {lang==="en"?"Decline":"Tolak"}
            </button>
          </div>
        ) : (
          <button onClick={onDecline}
            style={{width:"100%",padding:"7px",borderRadius:8,cursor:"pointer",border:"none",
              background:"linear-gradient(135deg,#aa2222,#ff4444)",color:"#fff",
              fontSize:9,fontWeight:"bold",boxShadow:"0 2px 8px rgba(255,68,68,0.4)"}}>
            ✕ {lang==="en"?"End Call":"Tutup Telepon"} ({fmt(callTime)})
          </button>
        )}
      </div>
    </div>
  )
}

// ── Inline Article Reader — fetches & strips article body inside HUD ─────────
function InlineArticleReader({url,accent,accentDim,T,lang}:{
  url:string; accent:string; accentDim:string; T:any; lang:string
}) {
  const [state, setState] = useState<"idle"|"loading"|"done"|"error">("idle")
  const [text, setText] = useState("")

  const fetchArticle = async () => {
    setState("loading")
    try {
      // Use allorigins.win CORS proxy to fetch article HTML
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const res = await fetch(proxy, {signal: AbortSignal.timeout(8000)})
      const data = await res.json()
      const html = data.contents ?? ""
      // Extract readable text: strip scripts/styles/tags, then clean up
      const noScript = html.replace(/<script[\s\S]*?<\/script>/gi,"")
        .replace(/<style[\s\S]*?<\/style>/gi,"")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi,"")
      // Try to find article/main body
      const bodyMatch = noScript.match(/<article[\s\S]*?<\/article>/i)
        || noScript.match(/<main[\s\S]*?<\/main>/i)
        || noScript.match(/<div[^>]+(?:article|content|story|post)[^>]*>([\s\S]{200,}?)<\/div>/i)
      const rawHtml = bodyMatch ? bodyMatch[0] : noScript
      // Strip all tags and decode entities
      const raw = rawHtml
        .replace(/<[^>]+>/g," ")
        .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
        .replace(/&nbsp;/g," ").replace(/&quot;/g,'"').replace(/&#\d+;/g," ")
        .replace(/\s{3,}/g,"\n\n").trim()
      if (raw.length < 100) throw new Error("Content not readable")
      setText(raw.slice(0, 3000))
      setState("done")
    } catch {
      setState("error")
    }
  }

  if (state === "idle") return (
    <button onClick={fetchArticle}
      style={{width:"100%",padding:"7px 10px",borderRadius:6,cursor:"pointer",
        border:`1px solid ${accentDim}`,background:`${accent}0f`,
        color:accent,fontSize:8.5,fontFamily:"monospace",letterSpacing:0.8,
        display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
      <span style={{fontSize:10}}>⬡</span>
      {lang==="en"?"LOAD FULL ARTICLE IN HUD":"BACA ARTIKEL LENGKAP DI SINI"}
    </button>
  )
  if (state === "loading") return (
    <div style={{padding:"10px",borderRadius:6,border:`1px solid ${accentDim}`,
      background:`${accent}08`,display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:12,height:12,border:`1.5px solid ${accent}`,
        borderTopColor:"transparent",borderRadius:"50%",flexShrink:0,
        animation:"spin 0.8s linear infinite"}}/>
      <span style={{fontSize:8,color:accentDim,letterSpacing:0.8}}>
        {lang==="en"?"FETCHING ARTICLE...":"MENGAMBIL ARTIKEL..."}
      </span>
    </div>
  )
  if (state === "error") return (
    <div style={{padding:"8px 10px",borderRadius:6,border:`1px solid #f8747444`,
      background:"#f8747408",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <span style={{fontSize:8,color:"#f87474"}}>
        {lang==="en"?"Could not load article content":"Gagal memuat konten artikel"}
      </span>
      <a href={url} target="_blank" rel="noreferrer"
        style={{fontSize:7.5,color:accent,textDecoration:"none",
          border:`1px solid ${accentDim}`,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>
        {lang==="en"?"Open →":"Buka →"}
      </a>
    </div>
  )
  // done
  return (
    <div style={{borderRadius:6,border:`1px solid ${accentDim}`,
      background:`${accent}08`,overflow:"hidden"}}>
      <div style={{padding:"5px 10px",borderBottom:`1px solid ${accentDim}`,
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:7.5,color:accent,letterSpacing:0.8}}>
          ⬡ {lang==="en"?"ARTICLE CONTENT":"ISI ARTIKEL"}
        </span>
        <span style={{fontSize:7,color:accentDim}}>{text.length} chars</span>
      </div>
      <div style={{maxHeight:180,overflowY:"auto",padding:"8px 10px",
        fontSize:9,color:T.textSecondary,lineHeight:1.75,whiteSpace:"pre-wrap",
        scrollbarWidth:"thin"}}>
        {text}
      </div>
    </div>
  )
}

function HomePanelNews({accent,accentDim,accentFaint,lang,theme}:{accent:string;accentDim:string;accentFaint:string;lang:string;theme:any}) {
  const [news,       setNews]       = useState<NewsArticle[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState("")
  const [selected,   setSelected]   = useState<NewsArticle|null>(null)
  const [category,   setCategory]   = useState("all")
  const [fetchingAI, setFetchingAI] = useState(false)
  const [aiSummary,  setAiSummary]  = useState("")
  const [lastFetch,  setLastFetch]  = useState(0)
  const [imgErrors,  setImgErrors]  = useState<Record<string,boolean>>({})
  const T = theme

  const fetchNews = async (force=false) => {
    if (!force && Date.now()-lastFetch < 5*60*1000 && news.length>0) return
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/news?lang=${lang}&t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.articles?.length>0) {
        setNews(data.articles); setLastFetch(Date.now())
      } else {
        setError(lang==="en"?"No articles found":"Berita tidak tersedia")
      }
    } catch(e:any) {
      setError(lang==="en"?`Failed: ${e.message}`:`Gagal: ${e.message}`)
    }
    setLoading(false)
  }

  useEffect(()=>{ fetchNews() },[lang])

  const allCats = ["all", ...Array.from(new Set(news.map(n=>n.category)))]
  const filtered = category==="all" ? news : news.filter(n=>n.category===category)

  const askAI = async (article: NewsArticle) => {
    setFetchingAI(true); setAiSummary("")
    try {
      const prompt = lang==="en"
        ? `2-sentence smart glasses analysis of: "${article.title}". Key insight?`
        : `Analisis 2 kalimat untuk kacamata pintar: "${article.title}". Dampak utamanya?`
      const res = await fetch("/api/claude-vision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,mode:"voice",textOnly:true})})
      const data = await res.json()
      setAiSummary(data.result?.replace(/```json|```/g,"").trim()||"")
    } catch { setAiSummary(lang==="en"?"AI unavailable":"AI tidak tersedia") }
    setFetchingAI(false)
  }

  const NewsImage = ({article, h: imgH=52, radius=6}: {article:NewsArticle; h?:number; radius?:number}) => {
    const hasErr = imgErrors[article.id]
    return (
      <div style={{position:"relative",height:imgH,flexShrink:0,overflow:"hidden",
        borderRadius:radius,background:article.imageGradient}}>
        {article.imageUrl && !hasErr && (
          <img src={article.imageUrl} alt=""
            style={{position:"absolute",inset:0,width:"100%",height:"100%",
              objectFit:"cover",transition:"opacity 0.3s"}}
            onError={()=>setImgErrors(p=>({...p,[article.id]:true}))}/>
        )}
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.55) 100%)"}}/>
        <div style={{position:"absolute",top:5,left:6,fontSize:9,
          padding:"1px 6px",borderRadius:20,
          background:`${accent}33`,color:accent,
          border:`1px solid ${accent}55`,letterSpacing:0.3,fontWeight:"bold"}}>
          {article.category}
        </div>
        <div style={{position:"absolute",bottom:5,right:6,
          fontSize:7,color:"rgba(255,255,255,0.7)",
          background:"rgba(0,0,0,0.4)",padding:"1px 5px",borderRadius:10}}>
          {article.source}
        </div>
        {(hasErr||!article.imageUrl)&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:22}}>{article.emoji}</div>
        )}
      </div>
    )
  }

  // ── Article Detail ──
  if (selected) return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:0}}>
      <div style={{flex:1,overflowY:"auto",padding:"0 2px"}}>
        <NewsImage article={selected} h={110} radius={8}/>
        <div style={{marginTop:8,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:7,padding:"2px 8px",borderRadius:20,
            background:`${accent}22`,color:accent,border:`1px solid ${accent}44`}}>
            {selected.category}
          </span>
          <span style={{fontSize:7,color:T.textMuted}}>{selected.source} · {selected.time}</span>
        </div>
        <div style={{fontSize:12,fontWeight:"bold",color:T.textPrimary,lineHeight:1.5,
          marginBottom:8,marginTop:4}}>{selected.title}</div>
        <div style={{fontSize:10,color:T.textSecondary,lineHeight:1.75,marginBottom:10}}>
          {selected.summary}
        </div>
        {/* AI Insight */}
        <div style={{padding:"8px 10px",borderRadius:6,background:`${accent}0c`,
          border:`1px solid ${accentDim}`,marginBottom:8}}>
          <div style={{fontSize:8,color:accentDim,letterSpacing:1,marginBottom:6,
            display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:accent}}>⬡</span> AI INSIGHT
          </div>
          {aiSummary
            ? <div style={{fontSize:9.5,color:T.textPrimary,lineHeight:1.7}}>{aiSummary}</div>
            : fetchingAI
              ? <div style={{display:"flex",gap:4,padding:"4px 0"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",
                    background:accent,animation:"bounce 1.2s ease infinite",
                    animationDelay:`${i*0.2}s`}}/>)}
                </div>
              : <button onClick={()=>askAI(selected)}
                  style={{fontSize:8,color:accent,background:"none",
                    border:`1px solid ${accentDim}`,borderRadius:20,
                    padding:"3px 10px",cursor:"pointer"}}>
                  ✦ {lang==="en"?"Get AI analysis":"Minta analisis AI"}
                </button>
          }
        </div>
        {selected.url&&<InlineArticleReader url={selected.url} accent={accent} accentDim={accentDim} T={T} lang={lang}/>}
      </div>
      <div style={{display:"flex",gap:5,flexShrink:0,paddingTop:6,
        borderTop:`1px solid ${accentDim}`}}>
        <button onClick={()=>{setSelected(null);setAiSummary("")}}
          style={{flex:1,padding:"6px",borderRadius:4,cursor:"pointer",
            border:`1px solid ${accentDim}`,background:T.bgInset,
            color:T.textSecondary,fontSize:9,fontFamily:"monospace"}}>
          ← {lang==="en"?"Back":"Kembali"}
        </button>
        {!aiSummary&&!fetchingAI&&(
          <button onClick={()=>askAI(selected)}
            style={{flex:2,padding:"6px",borderRadius:4,cursor:"pointer",
              border:`1px solid ${accent}`,background:`${accent}18`,
              color:accent,fontSize:9,fontFamily:"monospace",letterSpacing:1}}>
            ⬡ {lang==="en"?"AI Analysis":"Analisis AI"}
          </button>
        )}
      </div>
    </div>
  )

  // ── Feed View ──
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:0}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",marginBottom:5,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:"bold",color:accent,letterSpacing:0.5,
            textShadow:`0 0 8px ${accent}66`}}>
            {lang==="en"?"📰 LIVE FEED":"📰 BERITA LANGSUNG"}
          </div>
          <div style={{fontSize:7.5,color:accentDim}}>
            {loading?"memuat..."
             :error?"⚠ error"
             :`${filtered.length} artikel · ${new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}`}
          </div>
        </div>
        <button onClick={()=>fetchNews(true)}
          style={{padding:"3px 9px",borderRadius:20,fontSize:7.5,cursor:"pointer",
            border:`1px solid ${accentDim}`,background:accentFaint,
            color:accentDim,letterSpacing:0.5}}
          onMouseEnter={e=>{e.currentTarget.style.color=accent;e.currentTarget.style.borderColor=accent}}
          onMouseLeave={e=>{e.currentTarget.style.color=accentDim;e.currentTarget.style.borderColor=accentDim}}>
          ↻
        </button>
      </div>

      {/* Category pills */}
      <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:6,
        paddingBottom:3,flexShrink:0,scrollbarWidth:"none"}}>
        {allCats.map(c=>(
          <div key={c} onClick={()=>setCategory(c)}
            style={{padding:"2px 9px",borderRadius:20,fontSize:7.5,
              whiteSpace:"nowrap",cursor:"pointer",transition:"all 0.15s",letterSpacing:0.3,
              background:category===c?`${accent}22`:accentFaint,
              border:`1px solid ${category===c?accent:accentDim}`,
              color:category===c?accent:accentDim}}>
            {c==="all"?(lang==="en"?"All":"Semua"):c}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",
        gap:6,minHeight:0}}>
        {loading&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:8}}>
            <div style={{width:18,height:18,border:`2px solid ${accent}`,
              borderTopColor:"transparent",borderRadius:"50%",
              animation:"spin 0.8s linear infinite"}}/>
            <span style={{fontSize:9,color:accentDim,letterSpacing:1}}>
              {lang==="en"?"FETCHING NEWS...":"MENGAMBIL BERITA..."}
            </span>
          </div>
        )}
        {!loading&&error&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:8}}>
            <div style={{fontSize:9,color:"#f88",textAlign:"center",lineHeight:1.6}}>{error}</div>
            <button onClick={()=>fetchNews(true)}
              style={{padding:"5px 14px",borderRadius:20,fontSize:8,cursor:"pointer",
                border:`1px solid ${accent}`,background:`${accent}18`,color:accent}}>
              ↻ {lang==="en"?"Retry":"Coba lagi"}
            </button>
          </div>
        )}
        {!loading&&!error&&filtered.length>0&&(
          <>
            {/* Featured card — large image */}
            <div onClick={()=>{setSelected(filtered[0]);setAiSummary("")}}
              style={{borderRadius:8,overflow:"hidden",cursor:"pointer",flexShrink:0,
                border:`1.5px solid ${accentDim}`,transition:"all 0.2s",position:"relative"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.transform="scale(1.01)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=accentDim;e.currentTarget.style.transform="scale(1)"}}>
              <NewsImage article={filtered[0]} h={96} radius={0}/>
              <div style={{padding:"7px 10px",background:T.bgCard}}>
                <div style={{fontSize:7,color:accent,letterSpacing:0.5,marginBottom:3}}>
                  ★ {lang==="en"?"TOP STORY":"BERITA UTAMA"} · {filtered[0].time}
                </div>
                <div style={{fontSize:10.5,color:T.textPrimary,fontWeight:"bold",
                  lineHeight:1.4,overflow:"hidden",display:"-webkit-box",
                  WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                  {filtered[0].title}
                </div>
              </div>
            </div>

            {/* Horizontal scroll row — 3 medium cards */}
            <div style={{display:"flex",gap:5,overflowX:"auto",flexShrink:0,
              paddingBottom:2,scrollbarWidth:"none"}}>
              {filtered.slice(1,5).map(article=>(
                <div key={article.id} onClick={()=>{setSelected(article);setAiSummary("")}}
                  style={{minWidth:110,borderRadius:7,overflow:"hidden",cursor:"pointer",
                    border:`1px solid ${accentDim}`,transition:"all 0.18s",flexShrink:0,
                    background:T.bgCard}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=accent}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=accentDim}}>
                  <NewsImage article={article} h={56} radius={0}/>
                  <div style={{padding:"5px 6px"}}>
                    <div style={{fontSize:8,color:T.textPrimary,lineHeight:1.35,fontWeight:"bold",
                      overflow:"hidden",display:"-webkit-box",
                      WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      {article.title}
                    </div>
                    <div style={{fontSize:6.5,color:accentDim,marginTop:3}}>
                      {article.source} · {article.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vertical list — remaining articles with thumbnail */}
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {filtered.slice(5).map(article=>(
                <div key={article.id} onClick={()=>{setSelected(article);setAiSummary("")}}
                  style={{display:"flex",gap:8,borderRadius:7,overflow:"hidden",
                    cursor:"pointer",border:`1px solid ${accentDim}`,
                    transition:"all 0.18s",background:T.bgCard}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=accent}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=accentDim}}>
                  {/* Left thumbnail */}
                  <div style={{width:68,flexShrink:0}}>
                    <NewsImage article={article} h={68} radius={0}/>
                  </div>
                  {/* Right text */}
                  <div style={{flex:1,padding:"6px 8px 6px 0",minWidth:0}}>
                    <div style={{fontSize:8.5,color:T.textPrimary,fontWeight:"bold",
                      lineHeight:1.4,overflow:"hidden",display:"-webkit-box",
                      WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:3}}>
                      {article.title}
                    </div>
                    <div style={{fontSize:7,color:T.textSecondary,lineHeight:1.4,
                      overflow:"hidden",display:"-webkit-box",
                      WebkitLineClamp:1,WebkitBoxOrient:"vertical",marginBottom:4}}>
                      {article.summary}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:6.5,padding:"1px 5px",borderRadius:20,
                        background:`${accent}18`,color:accent,
                        border:`1px solid ${accent}33`}}>{article.category}</span>
                      <span style={{fontSize:6.5,color:accentDim}}>
                        {article.source} · {article.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function calcDist(la1: number, lo1: number, la2: number, lo2: number): string {
  const R = 6371000, dLa = ((la2-la1)*Math.PI)/180, dLo = ((lo2-lo1)*Math.PI)/180
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2
  const m = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`
}
// ── Leaflet Map Component with real routing ──────────────────────────────────
function LeafletMap({ lat, lng, destLat, destLng, accent, accentDim, isLight }: {
  lat: number; lng: number; destLat?: number; destLng?: number
  accent: string; accentDim: string; isLight?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const routeRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const loadScript = (src: string, integrity?: string): Promise<void> => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement("script"); s.src = src
    if (integrity) { s.integrity = integrity; s.crossOrigin = "anonymous" }
    s.onload = () => resolve(); s.onerror = reject
    document.head.appendChild(s)
  })
  const loadCSS = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href
    document.head.appendChild(l)
  }

  const initMap = useCallback(async () => {
    if (!mapRef.current) return
    try {
      loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
      const L = (window as any).L
      if (!L || leafletRef.current) return

      // Init map dengan Carto Dark tiles (mirip Google Maps dark mode)
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
      leafletRef.current = map

      L.tileLayer(isLight
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      , { maxZoom: 19 }).addTo(map)

      // Custom marker icons
      const pulseIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${accent};box-shadow:0 0 0 4px ${accent}44,0 0 12px ${accent};animation:none;border:2px solid #fff"></div>`,
        className: "", iconSize: [14, 14], iconAnchor: [7, 7]
      })
      const destIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;position:relative"><div style="width:16px;height:16px;background:#ff4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;position:absolute;top:0;left:2px"></div></div>`,
        className: "", iconSize: [20, 20], iconAnchor: [10, 18]
      })

      // Marker posisi user
      const userMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map)
      markersRef.current = [userMarker]
      map.setView([lat, lng], 16)

    } catch (e) { console.error("Leaflet init failed:", e) }
  }, [])

  // Update route saat destination berubah
  useEffect(() => {
    const L = (window as any).L
    if (!L || !leafletRef.current) return
    const map = leafletRef.current

    // Hapus marker destination lama
    markersRef.current.slice(1).forEach(m => map.removeLayer(m))
    markersRef.current = markersRef.current.slice(0, 1)
    // Hapus rute lama
    if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null }

    if (!destLat || !destLng) {
      map.setView([lat, lng], 16)
      return
    }

    // Marker destination
    const destIcon = L.divIcon({
      html: `<div style="width:20px;height:24px;position:relative"><div style="width:16px;height:16px;background:#ff4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;position:absolute;top:0;left:2px;box-shadow:0 0 8px #ff4444"></div></div>`,
      className: "", iconSize: [20, 24], iconAnchor: [10, 22]
    })
    const dm = L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
    markersRef.current.push(dm)

    // Fit bounds supaya kedua titik keliatan
    const bounds = L.latLngBounds([[lat, lng], [destLat, destLng]])
    map.fitBounds(bounds, { padding: [30, 30] })

    // Fetch rute dari OSRM
    fetch(`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${destLng},${destLat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]?.geometry) {
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]])
          routeRef.current = L.polyline(coords, {
            color: accent, weight: 4, opacity: 0.9,
            dashArray: undefined
          }).addTo(map)
          map.fitBounds(routeRef.current.getBounds(), { padding: [30, 30] })
        }
      })
      .catch(() => {
        // Fallback: garis lurus
        routeRef.current = L.polyline([[lat, lng], [destLat, destLng]], {
          color: accent, weight: 3, opacity: 0.7, dashArray: "6 4"
        }).addTo(map)
      })
  }, [destLat, destLng])

  // Update posisi user marker
  useEffect(() => {
    const L = (window as any).L
    if (!L || !leafletRef.current || !markersRef.current[0]) return
    markersRef.current[0].setLatLng([lat, lng])
  }, [lat, lng])

  useEffect(() => { initMap() }, [])
  useEffect(() => () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }, [])

  return <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: 6 }} />
}
function catIcon(c: string) {
  return c==="cafe"?"☕":c==="restaurant"||c==="fast_food"||c==="food_court"?"🍽":
    c==="hospital"||c==="pharmacy"||c==="clinic"?"🏥":
    c==="school"||c==="university"||c==="college"?"🎓":
    c==="bank"||c==="atm"?"🏦":c==="fuel"?"⛽":
    c==="supermarket"||c==="convenience"||c==="marketplace"?"🛒":
    c==="mosque"||c==="place_of_worship"||c==="church"?"🛐":
    c==="hotel"||c==="hostel"||c==="guest_house"?"🏨":
    c==="attraction"||c==="museum"||c==="viewpoint"?"🏛":
    c==="park"||c==="garden"||c==="pitch"?"🌳":
    c==="parking"?"🅿":c==="bus_station"||c==="bus_stop"?"🚌":
    c==="police"?"🚔":c==="post_office"?"📮":"📍"
}

// ── Country code helper ──────────────────────────────────────────────────────
const COUNTRY_CODES: Record<string,string> = {
  "indonesia":"id","malaysia":"my","singapore":"sg","thailand":"th",
  "philippines":"ph","vietnam":"vn","myanmar":"mm","cambodia":"kh",
  "laos":"la","brunei":"bn","timor-leste":"tl","australia":"au",
  "japan":"jp","china":"cn","south korea":"kr","india":"in",
  "united states":"us","united kingdom":"gb","germany":"de",
  "france":"fr","netherlands":"nl","spain":"es","italy":"it",
}
async function getCountryCode(countryName: string): Promise<string> {
  const key = countryName.toLowerCase().trim()
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key]
  // Fallback: ambil 2 huruf pertama nama negara tidak selalu benar,
  // tapi Nominatim juga terima nama lengkap via &countrycodes= kalau huruf 2 char ISO
  // Coba fetch dari restcountries
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=cca2`)
    const d = await r.json()
    return d[0]?.cca2?.toLowerCase() ?? ""
  } catch { return "" }
}

// ── Types ─────────────────────────────────────
type NearbyPlace = {
  name: string
  lat: number
  lon?: number
  lng?: number
  dist?: string
  category?: string
  tags?: Record<string, string>
}

// ── GPS HOOK ──────────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null)
  const [address, setAddress] = useState("Mendapatkan lokasi...")
  const [accuracy, setAccuracy] = useState<number|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const lastRef        = useRef<{lat:number;lng:number}|null>(null)
  const activeSearchRef = useRef(false) // true = user sedang search spesifik, block fetchNearby

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    // Jangan timpa hasil search spesifik user
    if (activeSearchRef.current) return
    if (lastRef.current) {
      const d = calcDist(lat,lng,lastRef.current.lat,lastRef.current.lng)
      if (parseFloat(d) < 50) return
    }
    lastRef.current = {lat,lng}
    setLoadingNearby(true)
    try {
      const q = `[out:json][timeout:15];(node(around:2000,${lat},${lng})[name][amenity];node(around:2000,${lat},${lng})[name][shop];node(around:2000,${lat},${lng})[name][tourism];node(around:2000,${lat},${lng})[name][leisure];);out body 40;`
      const res = await fetch(`https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.elements?.length > 0) {
        setNearby(
          data.elements.filter((e:any)=>e.tags?.name)
            .map((e:any)=>({name:e.tags.name,dist:calcDist(lat,lng,e.lat,e.lon),
              category:e.tags.amenity||e.tags.shop||"tempat",lat:e.lat,lon:e.lon,tags:e.tags}))
            .sort((a:NearbyPlace,b:NearbyPlace)=>{
              const m=(d?:string)=>!d?0:d.endsWith("km")?parseFloat(d)*1000:parseFloat(d)
              return m(a.dist)-m(b.dist)
            }).slice(0,8)
        )
      }
    } catch { setNearby([]) }
    finally { setLoadingNearby(false) }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) { setError("GPS tidak didukung"); setLoading(false); return }
    const id = navigator.geolocation.watchPosition(async pos => {
      const {latitude:lat,longitude:lng,accuracy:acc} = pos.coords
      setCoords({lat,lng}); setAccuracy(Math.round(acc)); setLoading(false); setError(null)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`)
        const d = await r.json()
        const parts = [d.address?.road||d.address?.suburb||"",d.address?.suburb||"",d.address?.city||d.address?.town||""].filter(Boolean)
        setAddress(parts.join(", ")||d.display_name?.split(",").slice(0,3).join(",")||"Lokasi tidak diketahui")
      } catch { setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`) }
      fetchNearby(lat,lng)
    }, err=>{
      setLoading(false)
      setError(err.code===1?"Izin GPS ditolak":err.code===2?"Sinyal GPS lemah":"Timeout GPS")
    }, {enableHighAccuracy:true,maximumAge:5000,timeout:15000})
    return () => navigator.geolocation.clearWatch(id)
  }, [fetchNearby])

  const [destination, setDestination] = useState<NearbyPlace|null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const searchNearbyByQuery = useCallback(async (query: string, lat: number, lng: number) => {
    if (!query) return
    setSearchQuery(query)
    setLoadingNearby(true)
    activeSearchRef.current = true

    try {
      // ── 1. Parse query ───────────────────────────────────────────────────────
      const cleanQ = query.toLowerCase().trim()
        .replace(/^(arahkan ke|navigasi ke|cari|pergi ke|tuju|ke|tunjukkan|bawa ke|mau ke|cariin|find|go to|navigate to|search)\s+/i, "")
        .replace(/\s+(terdekat|deket|dekat|nearby|sekitar sini|di sini|sini|near me|closest)$/i, "")
        .trim()

      const CATEGORY_MAP: Array<[RegExp, string]> = [
        [/^(cafe|kopi|coffee|kedai kopi|warung kopi|kafe)$/,      '[amenity~"cafe|coffee_shop"]'],
        [/^(restoran|restaurant|makan|warung|rumah makan|food)$/,  '[amenity~"restaurant|fast_food|food_court|cafe"]'],
        [/^(masjid|mosque|mushola|surau|mesjid)$/,                '[amenity=place_of_worship][religion=muslim]'],
        [/^(gereja|church|kapel)$/,                               '[amenity=place_of_worship][religion=christian]'],
        [/^(pura|temple|vihara)$/,                                '[amenity=place_of_worship]'],
        [/^(rumah sakit|rs|hospital|klinik|rsud|rsu|rsia)$/,      '[amenity~"hospital|clinic"]'],
        [/^(apotek|apotik|pharmacy|farmasi)$/,                    '[amenity=pharmacy]'],
        [/^(puskesmas)$/,                                         '[amenity~"clinic|health"]'],
        [/^(spbu|pom bensin|bensin|bbm|pertamina|fuel|gas)$/,     '[amenity=fuel]'],
        [/^(bank)$/,                                              '[amenity=bank]'],
        [/^(atm)$/,                                               '[amenity=atm]'],
        [/^(hotel|penginapan|hostel|resort|villa|inn)$/,          '[tourism~"hotel|hostel|guest_house"]'],
        [/^(mall|plaza|pusat perbelanjaan)$/,                     '[shop~"mall|supermarket|department_store"]'],
        [/^(supermarket|hypermarket)$/,                           '[shop~"supermarket|hypermarket"]'],
        [/^(minimarket|alfamart|indomaret)$/,                     '[shop~"convenience|supermarket"]'],
        [/^(taman|park|alun.?alun)$/,                             '[leisure~"park|garden"]'],
        [/^(sekolah|sd|smp|sma|smk|school)$/,                    '[amenity~"school"]'],
        [/^(universitas|kampus|univ|university|college)$/,        '[amenity~"university|college"]'],
        [/^(polisi|kantor polisi|police)$/,                       '[amenity=police]'],
        [/^(kantor pos|post office)$/,                            '[amenity=post_office]'],
        [/^(bandara|airport)$/,                                   '[aeroway=terminal]'],
        [/^(terminal|terminal bus|bus station)$/,                 '[amenity~"bus_station|bus_stop"]'],
        [/^(stasiun|train station|kereta)$/,                      '[railway~"station|halt"]'],
        [/^(parkir|parking)$/,                                    '[amenity=parking]'],
        [/^(gym|fitness|olahraga)$/,                              '[leisure~"fitness_centre|sports_centre"]'],
        [/^(salon|barbershop|pangkas)$/,                          '[shop~"hairdresser|beauty"]'],
        [/^(pasar|market)$/,                                      '[amenity~"marketplace|market"]'],
      ]

      let osmFilter = ""
      for (const [pattern, filter] of CATEGORY_MAP) {
        if (pattern.test(cleanQ)) { osmFilter = filter; break }
      }
      const specificName = osmFilter ? "" : (cleanQ || query)

      // ── 2. Reverse geocode untuk dapat country_code ─────────────────────────
      let userCountryCode = "id"
      try {
        const rg = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
          { signal: AbortSignal.timeout(5000) }
        )
        const rgd = await rg.json()
        userCountryCode = rgd.address?.country_code || "id"
      } catch {}

      // ── 3. Overpass — pakai node saja (cepat, tidak timeout) ────────────────
      const overpassSearch = async (radiusM: number): Promise<NearbyPlace[]> => {
        if (!osmFilter) return []
        // node saja — jauh lebih ringan dari node+way
        const oq = `[out:json][timeout:8];(node(around:${radiusM},${lat},${lng})${osmFilter}[name];);out body 15;`
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 7000)
        try {
          const res  = await fetch(
            `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(oq)}`,
            { signal: ctrl.signal }
          )
          if (!res.ok) return []
          const data = await res.json()
          return (data.elements ?? [])
            .filter((e: any) => e.tags?.name && e.lat && e.lon)
            .map((e: any) => ({
              name:     e.tags.name,
              dist:     calcDist(lat, lng, e.lat, e.lon),
              category: e.tags.amenity || e.tags.tourism || e.tags.leisure || e.tags.shop || "tempat",
              lat:      e.lat,
              lon:      e.lon,
              tags:     e.tags,
            }))
            .sort((a: NearbyPlace, b: NearbyPlace) => {
              const m = (d?: string) => !d ? 0 : d.endsWith("km") ? parseFloat(d)*1000 : parseFloat(d)
              return m(a.dist) - m(b.dist)
            })
            .slice(0, 8)
        } catch { return [] }
        finally { clearTimeout(timer) }
      }

      // ── 4. Nominatim dengan viewbox (kotak area sekitar GPS) ────────────────
      // viewbox memaksa hasil berada di dalam kotak koordinat — jauh lebih presisi
      const nominatimSearch = async (boxKm: number | null, countryOnly = false): Promise<NearbyPlace[]> => {
        const term = specificName || cleanQ || query
        const params = new URLSearchParams({
          q: term,
          format: "json",
          limit: "10",
          addressdetails: "1",
          "accept-language": "id,en",
          countrycodes: userCountryCode,
        })

        if (boxKm !== null) {
          // viewbox = [minLon, minLat, maxLon, maxLat]
          // 1 derajat lat ≈ 111km, 1 derajat lon ≈ 111km * cos(lat)
          const dLat = boxKm / 111
          const dLon = boxKm / (111 * Math.cos(lat * Math.PI / 180))
          const viewbox = `${lng-dLon},${lat-dLat},${lng+dLon},${lat+dLat}`
          params.set("viewbox", viewbox)
          params.set("bounded", "1") // WAJIB: hasil harus di dalam viewbox
        }

        if (countryOnly) {
          params.delete("bounded")   // kalau country, jangan bounded
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { signal: AbortSignal.timeout(8000) }
        )
        const data: any[] = await res.json()
        return data
          .filter(e => e.lat && e.lon)
          .map(e => ({
            name:     e.display_name.split(",").slice(0, 2).join(", "),
            dist:     calcDist(lat, lng, parseFloat(e.lat), parseFloat(e.lon)),
            category: e.type || e.class || "tempat",
            lat:      parseFloat(e.lat),
            lon:      parseFloat(e.lon),
          }))
          .sort((a: NearbyPlace, b: NearbyPlace) => {
            const m = (d?: string) => !d ? 0 : d.endsWith("km") ? parseFloat(d)*1000 : parseFloat(d)
            return m(a.dist) - m(b.dist)
          })
          .slice(0, 8)
      }

      // ── 5. Pipeline ──────────────────────────────────────────────────────────
      // Kategori generik: Overpass radius kecil → besar → Nominatim viewbox kota → kota besar
      // Nama spesifik:    Nominatim viewbox kecil → sedang → se-negara → global
      const PIPELINE = osmFilter
        ? [
            { label: `${query} (2km)`,   fn: () => overpassSearch(2_000)              },
            { label: `${query} (5km)`,   fn: () => overpassSearch(5_000)              },
            { label: `${query} (10km)`,  fn: () => overpassSearch(10_000)             },
            { label: `${query} (25km)`,  fn: () => overpassSearch(25_000)             },
            { label: `${query} (kota)`,  fn: () => nominatimSearch(30, false)         },
            { label: `${query} (negara)`,fn: () => nominatimSearch(null, true)        },
          ]
        : [
            { label: `${query} (10km)`,  fn: () => nominatimSearch(10, false)         },
            { label: `${query} (30km)`,  fn: () => nominatimSearch(30, false)         },
            { label: `${query} (100km)`, fn: () => nominatimSearch(100, false)        },
            { label: `${query} (negara)`,fn: () => nominatimSearch(null, true)        },
            { label: `${query} (global)`,fn: () => nominatimSearch(null, false)       },
          ]

      let results: NearbyPlace[] = []
      for (const step of PIPELINE) {
        setSearchQuery(step.label)
        try {
          results = await step.fn()
          if (results.length > 0) break
        } catch { continue }
      }

      // ── 6. Set hasil ─────────────────────────────────────────────────────────
      setSearchQuery(query)
      setNearby(results)
      if (results.length > 0) {
        if (specificName) {
          const nl = specificName.toLowerCase().split(" ")[0]
          const best = results.find(r => r.name.toLowerCase().includes(nl)) ?? results[0]
          setDestination(best)
        } else {
          setDestination(results[0])
        }
      } else {
        setDestination(null)
        activeSearchRef.current = false
        setSearchQuery(`"${query}" tidak ditemukan`)
      }

    } catch { setNearby([]); setDestination(null); activeSearchRef.current = false }
    finally { setLoadingNearby(false) }
  }, [])


  return {coords,address,accuracy,error,loading,nearby,loadingNearby,destination,setDestination,searchQuery,setSearchQuery,searchNearbyByQuery,activeSearchRef}
}

// ── BATTERY HOOK ─────────────────────────────────────────────────────────────
function useBattery() {
  const [level,    setLevel]    = useState<number|null>(null)
  const [charging, setCharging] = useState(false)

  useEffect(() => {
    if (typeof navigator === "undefined") return
    ;(navigator as any).getBattery?.().then((bat: any) => {
      setLevel(Math.round(bat.level * 100))
      setCharging(bat.charging)
      bat.addEventListener("levelchange",    () => setLevel(Math.round(bat.level * 100)))
      bat.addEventListener("chargingchange", () => setCharging(bat.charging))
    })
  }, [])

  return { level, charging }
}

// ── REAL NOTIFS HOOK ──────────────────────────────────────────────────────────
type RealNotif = {
  id: string
  type: "net" | "battery" | "gps" | "app" | "system"
  icon: string
  msg: string
  time: string
}

function useRealNotifs(coords: {lat:number;lng:number}|null) {
  const [notifs, setNotifs] = useState<RealNotif[]>([])
  const counterRef = useRef(0)
  const addNotif = useCallback((n: Omit<RealNotif,"id"|"time">) => {
    const id = `notif_${Date.now()}_${++counterRef.current}`
    const time = new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
    setNotifs(prev => [{...n,id,time},...prev.slice(0,7)])
  }, [])

  useEffect(() => {
    const onOnline  = () => addNotif({type:"net",icon:"📶",msg:"Koneksi internet tersambung kembali"})
    const onOffline = () => addNotif({type:"net",icon:"⚠",msg:"Koneksi internet terputus"})
    window.addEventListener("online",onOnline)
    window.addEventListener("offline",onOffline)
    const onVisible = () => { if(document.visibilityState==="visible") addNotif({type:"app",icon:"◉",msg:"V-Optics aktif kembali"}) }
    document.addEventListener("visibilitychange",onVisible)
    ;(navigator as any).getBattery?.().then((bat: any) => {
      const checkBat = () => {
        const pct = Math.round(bat.level*100)
        if (pct<=20&&!bat.charging) addNotif({type:"battery",icon:"🔋",msg:`Baterai ${pct}% — segera cas perangkat`})
        else if (bat.charging&&pct<100) addNotif({type:"battery",icon:"⚡",msg:`Mengisi daya — ${pct}%`})
      }
      bat.addEventListener("levelchange",checkBat)
      bat.addEventListener("chargingchange",checkBat)
      checkBat()
    })
    const now = new Date()
    const msToNextHour = (60-now.getMinutes())*60000 - now.getSeconds()*1000
    const hourTimer = setTimeout(() => {
      addNotif({type:"system",icon:"🕐",msg:`${new Date().getHours()}:00 — Pengingat waktu dari V-Optics`})
    }, msToNextHour)
    addNotif({type:"app",icon:"◈",msg:"V-Optics HUD aktif — semua sistem berjalan"})
    return () => {
      window.removeEventListener("online",onOnline)
      window.removeEventListener("offline",onOffline)
      document.removeEventListener("visibilitychange",onVisible)
      clearTimeout(hourTimer)
    }
  }, [addNotif])

  useEffect(() => {
    if (!coords) return
    addNotif({type:"gps",icon:"📍",msg:`Lokasi diperbarui: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`})
  }, [coords?.lat.toFixed(3), coords?.lng.toFixed(3)])

  return notifs
}

// ── TRANSLATE PANEL ───────────────────────────────────────────────────────────

// Semua bahasa yang didukung
const SUPPORTED_LANGS = [
  { code: "id", label: "Indonesia",   flag: "🇮🇩", tesseract: "ind" },
  { code: "en", label: "English",     flag: "🇬🇧", tesseract: "eng" },
  { code: "ja", label: "日本語",       flag: "🇯🇵", tesseract: "jpn" },
  { code: "zh", label: "中文",         flag: "🇨🇳", tesseract: "chi_sim" },
  { code: "ko", label: "한국어",       flag: "🇰🇷", tesseract: "kor" },
  { code: "ar", label: "العربية",     flag: "🇸🇦", tesseract: "ara" },
  { code: "fr", label: "Français",    flag: "🇫🇷", tesseract: "fra" },
  { code: "de", label: "Deutsch",     flag: "🇩🇪", tesseract: "deu" },
  { code: "es", label: "Español",     flag: "🇪🇸", tesseract: "spa" },
  { code: "ru", label: "Русский",     flag: "🇷🇺", tesseract: "rus" },
]

// Deteksi bahasa dari karakter
function detectLang(text: string): string {
  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) return "ja"
  if (/[\u4e00-\u9fff]/.test(text)) return "zh"
  if (/[\uac00-\ud7af]/.test(text)) return "ko"
  if (/[\u0600-\u06ff]/.test(text)) return "ar"
  if (/[\u0400-\u04ff]/.test(text)) return "ru"
  // Heuristic ID vs EN
  const idWords = ["dan","yang","di","ke","dari","ini","itu","dengan","untuk","pada",
    "adalah","tidak","saya","kami","akan","sudah","bisa","juga","ada","atau","jika","karena"]
  const words = text.toLowerCase().split(/\s+/)
  const idScore = words.filter(w => idWords.includes(w)).length
  if (idScore >= 2) return "id"
  // Cek karakter Latin aksen Eropa
  if (/[àâçéèêëîïôùûüæœ]/i.test(text)) return "fr"
  if (/[äöüß]/i.test(text)) return "de"
  if (/[áéíóúüñ¿¡]/i.test(text)) return "es"
  return "en"
}

// Preprocessing canvas untuk akurasi OCR
function preprocessCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const w = canvas.width, h = canvas.height
  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data

  // Step 1: Grayscale
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114
    d[i] = d[i+1] = d[i+2] = gray
  }

  // Step 2: Hitung rata-rata untuk adaptive threshold
  let sum = 0
  for (let i = 0; i < d.length; i += 4) sum += d[i]
  const avg = sum / (w * h)

  // Step 3: Adaptive contrast + binarisasi lunak
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i]
    // Boost teks gelap di background terang, atau sebaliknya
    const enhanced = v < avg
      ? Math.max(0,   v * 0.6)        // gelap → lebih gelap
      : Math.min(255, v * 1.25 + 20)  // terang → lebih terang
    d[i] = d[i+1] = d[i+2] = enhanced
  }

  ctx.putImageData(imgData, 0, 0)

  // Step 4: Scale up 2x untuk Tesseract lebih akurat
  const scaled = document.createElement("canvas")
  scaled.width = w * 2; scaled.height = h * 2
  const sCtx = scaled.getContext("2d")!
  sCtx.imageSmoothingEnabled = false
  sCtx.drawImage(canvas, 0, 0, w * 2, h * 2)
  return scaled
}

// Terjemahkan dengan 3 lapis fallback
async function translateText(
  text: string,
  fromLang: string,
  toLang: string,
  setStatus: (s: string) => void
): Promise<string> {
  if (fromLang === toLang) return text
  const short = text.slice(0, 500)

  // Coba 1: MyMemory dengan langpair eksplisit
  try {
    setStatus(`Menerjemahkan ${fromLang.toUpperCase()} → ${toLang.toUpperCase()} (MyMemory)...`)
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(short)}&langpair=${fromLang}|${toLang}`
    )
    const d = await r.json()
    const res = d.responseData?.translatedText ?? ""
    if (d.responseStatus === 200 && res && res !== text && !res.includes("MYMEMORY WARNING")) {
      return res
    }
  } catch {}

  // Coba 2: Google Translate non-official
  try {
    setStatus(`Menerjemahkan (Google Translate)...`)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(short)}`
    const r = await fetch(url)
    if (r.ok) {
      const d = await r.json()
      const result = (d[0] as any[])?.map((chunk: any) => chunk?.[0] ?? "").filter(Boolean).join("") ?? ""
      if (result && result !== text) return result
    }
  } catch {}

  // Coba 3: LibreTranslate
  try {
    setStatus(`Menerjemahkan (LibreTranslate)...`)
    const r = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: short, source: fromLang, target: toLang, format: "text" })
    })
    if (r.ok) {
      const d = await r.json()
      if (d.translatedText && d.translatedText !== text) return d.translatedText
    }
  } catch {}

  throw new Error("Semua API terjemahan gagal")
}

function TranslatePanel({accent,accentDim,accentFaint,targetLang,theme}:{
  accent:string; accentDim:string; accentFaint:string; targetLang:string; theme:any
}) {
  const T = theme
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null)

  // State bahasa — source & target bisa diswitch
  const [srcLang, setSrcLang] = useState("auto")          // "auto" = deteksi otomatis
  const [dstLang, setDstLang] = useState(targetLang === "id" ? "id" : "en")

  const [cameraOn,    setCameraOn]    = useState(false)
  const [scanning,    setScanning]    = useState(false)
  const [capturedText,setCapturedText]= useState("")
  const [translated,  setTranslated]  = useState("")
  const [detectedLang,setDetectedLang]= useState("")
  const [status,      setStatus]      = useState("")
  const [manualText,  setManualText]  = useState("")
  const [showManual,  setShowManual]  = useState(false)
  const [showLangPicker, setShowLangPicker] = useState<"src"|"dst"|null>(null)

  // Sync dstLang & status dengan setting bahasa interface
  const isEN = targetLang === "en"
  useEffect(() => { setDstLang(targetLang === "id" ? "id" : "en") }, [targetLang])
  useEffect(() => {
    if (!cameraOn) setStatus(isEN ? "Allow camera to start" : "Izinkan kamera untuk memulai")
  }, [targetLang])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ideal:1920}, height:{ideal:1080} }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); setShowManual(false)
      setStatus(targetLang==="en" ? "Camera active — point at text, press SCAN" : "Kamera aktif — arahkan ke teks, tekan SCAN")
    } catch { setStatus(targetLang==="en" ? "⚠ Camera access denied" : "⚠ Akses kamera ditolak") }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setStatus(targetLang==="en" ? "Camera off" : "Kamera dimatikan")
  }

  // Swap src ↔ dst
  const swapLangs = () => {
    if (srcLang === "auto") return
    const prev = dstLang
    setDstLang(srcLang)
    setSrcLang(prev)
    // Swap hasil juga kalau sudah ada terjemahan
    if (translated) {
      const prevCaptured = capturedText
      setCapturedText(translated)
      setTranslated(prevCaptured)
    }
  }

  // Proses teks hasil OCR atau manual
  const processText = async (rawText: string) => {
    const cleaned = rawText
      .replace(/\r?\n/g, " ")
      .replace(/[^\x20-\x7E\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()

    if (!cleaned || cleaned.length < 3) {
      setStatus(targetLang==="en" ? "⚠ Text too short. Try better lighting." : "⚠ Teks terlalu pendek. Coba lagi dengan pencahayaan lebih baik.")
      return
    }

    setCapturedText(cleaned.slice(0, 400))
    setTranslated("")

    const from = srcLang === "auto" ? detectLang(cleaned) : srcLang
    setDetectedLang(from)
    const to = dstLang

    if (from === to) {
      setTranslated(cleaned)
      setStatus(targetLang==="en" ? `✓ Text already in ${SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to}` : `✓ Teks sudah dalam bahasa ${SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to}`)
      return
    }

    try {
      const result = await translateText(cleaned, from, to, setStatus)
      setTranslated(result)
      const fromLabel = SUPPORTED_LANGS.find(l => l.code === from)?.label ?? from.toUpperCase()
      const toLabel   = SUPPORTED_LANGS.find(l => l.code === to)?.label   ?? to.toUpperCase()
      setStatus(`✓ ${fromLabel} → ${toLabel}`)
    } catch {
      setStatus(targetLang==="en" ? "⚠ Translation failed. Check internet." : "⚠ Terjemahan gagal. Cek koneksi internet.")
    }
  }

  const scanAndTranslate = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true); setTranslated(""); setStatus(targetLang==="en" ? "Capturing frame..." : "Mengambil frame kamera...")

    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")!
    canvas.width  = videoRef.current.videoWidth  || 1280
    canvas.height = videoRef.current.videoHeight || 720
    ctx.drawImage(videoRef.current, 0, 0)

    // Untuk Arab/China/Korea/Jepang → pakai AI Vision (jauh lebih akurat)
    const useVision = ["ar","zh","ja","ko"].includes(srcLang) ||
      (srcLang === "auto") // auto juga pakai vision supaya lebih akurat

    if (useVision) {
      // Preprocessing ringan saja (tidak perlu grayscale untuk Vision API)
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1]
      setStatus(targetLang==="en" ? "Sending to AI Vision..." : "Mengirim ke AI Vision...")

      try {
        const to = dstLang
        const toLangName = SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to

        const prompt = targetLang === "en"
          ? `You are an OCR and translation engine for V-Optics smart glasses. In this image:
1. Extract ALL text you can see (preserve original script/characters exactly)
2. Detect the language of the text
3. Translate the extracted text to ${toLangName}

Respond ONLY in this exact JSON format (no markdown, no extra text):
{"original":"<extracted text>","lang":"<detected language>","translated":"<translation to ${toLangName}>"}`
          : `Kamu adalah mesin OCR dan terjemahan untuk kacamata pintar V-Optics. Dari gambar ini:
1. Ekstrak SEMUA teks yang terlihat (pertahankan karakter asli persis)
2. Deteksi bahasa teks tersebut
3. Terjemahkan ke ${toLangName}

Balas HANYA dalam format JSON ini (tanpa markdown, tanpa teks lain):
{"original":"<teks yang diekstrak>","lang":"<bahasa terdeteksi>","translated":"<terjemahan ke ${toLangName}>"}`

        const res = await fetch("/api/claude-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, prompt, mode: "ocr" })
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const raw = data.result ?? ""

        // Parse JSON response
        try {
          const cleaned = raw.replace(/```json|```/g, "").trim()
          const parsed = JSON.parse(cleaned)
          if (parsed.original && parsed.translated) {
            setCapturedText(parsed.original)
            setTranslated(parsed.translated)
            const detLang = parsed.lang ?? "auto"
            setDetectedLang(detLang.toLowerCase().slice(0,2))
            const fromLabel = parsed.lang ?? detLang
            const toLabel = SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to
            setStatus(`✓ ${fromLabel} → ${toLabel}`)
          } else {
            throw new Error("Invalid JSON structure")
          }
        } catch {
          // Claude tidak return JSON — coba parse manual
          if (raw.length > 5) {
            setCapturedText(raw)
            setTranslated(raw)
            setStatus(targetLang==="en" ? "✓ Vision response received" : "✓ Respons Vision diterima")
          } else {
            setStatus(targetLang==="en" ? "⚠ Could not read text from image" : "⚠ Tidak ada teks terbaca dari gambar")
          }
        }
      } catch (e: any) {
        // Fallback ke Tesseract kalau Vision gagal
        setStatus(targetLang==="en" ? "Vision failed, trying Tesseract..." : "Vision gagal, mencoba Tesseract...")
        await runTesseract(canvas)
      }
    } else {
      // Latin script (EN/ID/FR/DE/ES/RU) → Tesseract sudah cukup akurat
      const processedCanvas = preprocessCanvas(canvas, ctx)
      await runTesseract(processedCanvas)
    }

    setScanning(false)
  }

  const runTesseract = async (canvasEl: HTMLCanvasElement) => {
    try {
      setStatus(targetLang==="en" ? "Loading Tesseract OCR..." : "Memuat Tesseract OCR...")
      const Tesseract = await import("tesseract.js")

      const ocrLangs = srcLang === "auto" ? "eng+ind+fra+deu+spa+rus"
        : (() => {
            const found = SUPPORTED_LANGS.find(l => l.code === srcLang)
            return found ? `${found.tesseract}+eng` : "eng"
          })()

      setStatus(`OCR: ${ocrLangs.split("+").length} langs...`)

      const { data: { text, confidence, words } } = await (Tesseract.recognize as any)(
        canvasEl, ocrLangs,
        { logger: (m: any) => { if (m.status==="recognizing text") setStatus(`OCR ${Math.round(m.progress*100)}%`) } }
      )

      const filteredWords = words
        ? (words as any[]).filter((w:any) => w.confidence > 40).map((w:any) => w.text).join(" ")
        : text

      if (!filteredWords.trim() || confidence < 15) {
        setStatus(targetLang==="en"
          ? "⚠ Text unreadable. Tips: ✓ Focus ✓ Good lighting ✓ Text not tilted"
          : "⚠ Teks tidak terbaca. Tips: ✓ Fokus ✓ Cahaya cukup ✓ Tidak miring")
        return
      }

      setStatus(targetLang==="en"
        ? `OCR done (${Math.round(confidence)}%) — translating...`
        : `OCR selesai (${Math.round(confidence)}%) — menerjemahkan...`)
      await processText(filteredWords)
    } catch (e: any) {
      setStatus("⚠ " + (e?.message?.includes("tesseract") ? "Run: npm install tesseract.js" : (e?.message ?? "OCR error")))
    }
  }
  const translateManual = async () => {
    if (!manualText.trim()) return
    setScanning(true); setTranslated("")
    setStatus(targetLang==="en"?"Translating...":"Menerjemahkan...")
    await processText(manualText)
    setScanning(false)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const srcInfo = srcLang === "auto"
    ? { label: "Auto Detect", flag: "🔍" }
    : SUPPORTED_LANGS.find(l => l.code === srcLang) ?? { label: srcLang, flag: "🌐" }
  const dstInfo = SUPPORTED_LANGS.find(l => l.code === dstLang) ?? { label: dstLang, flag: "🌐" }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:7,height:"100%"}}>

      {/* ── Language selector bar ── */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",
        border:`1px solid ${accentDim}`,borderRadius:6,background:`${accent}08`}}>

        {/* Source lang */}
        <div onClick={()=>setShowLangPicker(p=>p==="src"?null:"src")}
          style={{flex:1,display:"flex",alignItems:"center",gap:5,cursor:"pointer",
            padding:"3px 6px",borderRadius:4,
            background:showLangPicker==="src"?`${accent}20`:"transparent",
            border:`1px solid ${showLangPicker==="src"?accent:"transparent"}`}}>
          <span style={{fontSize:13}}>{srcInfo.flag}</span>
          <div>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>{targetLang==="en"?"FROM":"DARI"}</div>
            <div style={{fontSize:10,color:accent}}>{srcInfo.label}</div>
          </div>
          <span style={{fontSize:8,color:accentDim,marginLeft:"auto"}}>▾</span>
        </div>

        {/* Swap button */}
        <button onClick={swapLangs}
          style={{padding:"5px 8px",background:accentDim==="auto"?`${accent}22`:accentDim,
            border:`1px solid ${accentDim}`,borderRadius:4,color:accent,
            cursor:srcLang==="auto"?"not-allowed":"pointer",fontSize:13,
            opacity:srcLang==="auto"?0.4:1}}>
          ⇄
        </button>

        {/* Dest lang */}
        <div onClick={()=>setShowLangPicker(p=>p==="dst"?null:"dst")}
          style={{flex:1,display:"flex",alignItems:"center",gap:5,cursor:"pointer",
            padding:"3px 6px",borderRadius:4,
            background:showLangPicker==="dst"?`${accent}20`:"transparent",
            border:`1px solid ${showLangPicker==="dst"?accent:"transparent"}`}}>
          <span style={{fontSize:13}}>{dstInfo.flag}</span>
          <div>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>{targetLang==="en"?"TO":"KE"}</div>
            <div style={{fontSize:10,color:accent}}>{dstInfo.label}</div>
          </div>
          <span style={{fontSize:8,color:accentDim,marginLeft:"auto"}}>▾</span>
        </div>
      </div>

      {/* ── Language picker dropdown ── */}
      {showLangPicker && (
        <div style={{border:`1px solid ${accentDim}`,borderRadius:6,background:"#050e1c",
          padding:6,maxHeight:120,overflowY:"auto"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {/* Auto detect hanya untuk source */}
            {showLangPicker === "src" && (
              <div onClick={()=>{ setSrcLang("auto"); setShowLangPicker(null) }}
                style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",
                  borderRadius:4,cursor:"pointer",fontSize:9,
                  background:srcLang==="auto"?`${accent}25`:`${accent}08`,
                  border:`1px solid ${srcLang==="auto"?accent:accentDim}`,
                  color:srcLang==="auto"?accent:"#89a"}}>
                🔍 Auto
              </div>
            )}
            {SUPPORTED_LANGS.map(lang => {
              const isActive = showLangPicker==="src" ? srcLang===lang.code : dstLang===lang.code
              return (
                <div key={lang.code}
                  onClick={()=>{
                    if (showLangPicker==="src") setSrcLang(lang.code)
                    else setDstLang(lang.code)
                    setShowLangPicker(null)
                  }}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",
                    borderRadius:4,cursor:"pointer",fontSize:9,
                    background:isActive?`${accent}25`:`${accent}08`,
                    border:`1px solid ${isActive?accent:accentDim}`,
                    color:isActive?accent:"#89a"}}>
                  {lang.flag} {lang.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Video / Manual input ── */}
      {!showManual ? (
        <div style={{flex:1,position:"relative",borderRadius:6,overflow:"hidden",
          border:`1px solid ${accentDim}`,background:theme.isLight?"#e0e8f0":"#000",minHeight:0}}>
          <video ref={videoRef} muted playsInline
            style={{width:"100%",height:"100%",objectFit:"cover",display:cameraOn?"block":"none"}}/>
          {!cameraOn && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{fontSize:24}}>📷</span>
              <div style={{color:accentDim,fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 12px"}}>
                {status}
              </div>
            </div>
          )}
          {/* Corner brackets */}
          {cameraOn && ([[0,0],[1,0],[0,1],[1,1]] as const).map(([x,y],i) => (
            <div key={i} style={{position:"absolute",width:12,height:12,zIndex:2,
              top:y?"auto":6,bottom:y?6:"auto",left:x?"auto":6,right:x?6:"auto",
              borderTop:!y?`2px solid ${accent}`:"none",
              borderBottom:y?`2px solid ${accent}`:"none",
              borderLeft:!x?`2px solid ${accent}`:"none",
              borderRight:x?`2px solid ${accent}`:"none"}}/>
          ))}
          {/* Scan beam animasi */}
          {scanning && (
            <div style={{position:"absolute",left:0,right:0,top:0,height:"100%",
              background:`linear-gradient(180deg,transparent 0%,${accent}18 49%,${accent}30 50%,${accent}18 51%,transparent 100%)`,
              animation:"scanBeam 1.8s ease-in-out infinite"}}/>
          )}
          <canvas ref={canvasRef} style={{display:"none"}}/>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>{targetLang==="en"?"MANUAL TEXT INPUT":"INPUT TEKS MANUAL"}</div>
          <textarea value={manualText} onChange={e=>setManualText(e.target.value)}
            placeholder={targetLang==="en"?"Type or paste text here...":"Ketik atau paste teks di sini..."}
            style={{flex:1,background:"rgba(0,0,0,0.5)",border:`1px solid ${accentDim}`,
              borderRadius:6,color:theme.textPrimary,fontSize:11,padding:"8px 10px",
              fontFamily:"monospace",resize:"none",outline:"none",lineHeight:1.6}}/>
          <div style={{fontSize:8,color:accentDim,textAlign:"right"}}>{manualText.length}/500</div>
        </div>
      )}

      {/* ── Status ── */}
      <div style={{fontSize:9,letterSpacing:1,textAlign:"center",minHeight:13,
        color:scanning?accent:status.startsWith("✓")?`#0f8`:status.startsWith("⚠")?`#f80`:accentDim}}>
        {status}
      </div>

      {/* ── Hasil terjemahan ── */}
      {translated && (
        <div style={{padding:"8px 10px",border:`1px solid ${accentDim}`,
          borderRadius:6,background:`${accent}08`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>
              ASLI
              {detectedLang && (
                <span style={{marginLeft:4,color:accent}}>
                  {(SUPPORTED_LANGS.find(l=>l.code===detectedLang)?.flag??"")} {detectedLang.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>
              TERJEMAHAN
              <span style={{marginLeft:4,color:accent}}>
                {dstInfo.flag} {dstLang.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{flex:1,fontSize:9,color:"rgba(255,255,255,0.4)",
              lineHeight:1.5,fontStyle:"italic",borderLeft:`2px solid ${accentDim}`,paddingLeft:6}}>
              {capturedText.slice(0,150)}{capturedText.length>150?"...":""}
            </div>
            <div style={{fontSize:8,color:accentDim,alignSelf:"center"}}>→</div>
            <div style={{flex:1,fontSize:12,color:accent,fontWeight:"bold",
              textShadow:`0 0 8px ${accent}`,lineHeight:1.5}}>
              {translated}
            </div>
          </div>
        </div>
      )}

      {/* ── Tombol ── */}
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>{ setShowManual(v=>!v); if(cameraOn) stopCamera() }}
          style={{padding:"6px 8px",fontFamily:"monospace",fontSize:8,letterSpacing:1,
            background:showManual?`${accent}20`:accentDim,
            border:`1px solid ${showManual?accent:accentDim}`,
            color:showManual?accent:"#89a",borderRadius:4,cursor:"pointer"}}>
          {showManual?"📷":"⌨"}
        </button>

        {showManual ? (
          <button onClick={translateManual} disabled={scanning||!manualText.trim()}
            style={{flex:1,padding:"6px",fontFamily:"monospace",fontSize:9,letterSpacing:1,
              background:scanning?`${accent}11`:accentDim,
              border:`1px solid ${scanning||!manualText.trim()?accentDim:accent}`,
              color:scanning||!manualText.trim()?"#456":accent,
              borderRadius:4,cursor:"pointer"}}>
            {scanning?(targetLang==="en"?"⏳ TRANSLATING...":"⏳ MENERJEMAHKAN..."):(targetLang==="en"?"◆ TRANSLATE":"◆ TERJEMAHKAN")}
          </button>
        ) : !cameraOn ? (
          <button onClick={startCamera}
            style={{flex:1,padding:"6px",fontFamily:"monospace",fontSize:9,letterSpacing:1,
              background:`${accent}15`,border:`1px solid ${accentDim}`,
              color:accent,borderRadius:4,cursor:"pointer"}}>
            {targetLang==="en"?"📷 ENABLE CAMERA":"📷 AKTIFKAN KAMERA"}
          </button>
        ) : (
          <>
            <button onClick={scanAndTranslate} disabled={scanning}
              style={{flex:2,padding:"6px",fontFamily:"monospace",fontSize:9,letterSpacing:1,
                background:scanning?`${accent}11`:`${accent}15`,
                border:`1px solid ${scanning?accentDim:accent}`,
                color:scanning?accentDim:accent,borderRadius:4,
                cursor:scanning?"not-allowed":"pointer"}}>
              {scanning?(targetLang==="en"?"⏳ SCANNING...":"⏳ MEMINDAI..."):(targetLang==="en"?"◆ SCAN & TRANSLATE":"◆ SCAN & TERJEMAH")}
            </button>
            <button onClick={stopCamera}
              style={{padding:"6px 8px",fontFamily:"monospace",fontSize:9,
                background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.3)",
                color:"#f66",borderRadius:4,cursor:"pointer"}}>
              STOP
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── AI PANEL ──────────────────────────────────────────────────────────────────
function AIPanel({accent,accentDim,accentFaint,lang,theme}:{accent:string;accentDim:string;accentFaint:string;lang:string;theme:any}) {
  const T = theme
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [cameraOn,  setCameraOn]  = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [status,    setStatus]    = useState<"idle"|"capturing"|"analyzing"|"done"|"error">("idle")
  const [chatLog,   setChatLog]   = useState<{role:"user"|"ai",text:string,ts:string}[]>([])
  const [prompt,    setPrompt]    = useState("")
  const streamRef  = useRef<MediaStream|null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const ts = () => new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject=stream; videoRef.current.play() }
      setCameraOn(true); setStatus("idle")
    } catch { setStatus("error") }
  }
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop())
    setCameraOn(false); setStatus("idle")
  }
  useEffect(()=>()=>{ streamRef.current?.getTracks().forEach(t=>t.stop()) },[])
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}) },[chatLog,analyzing])

  const analyze = async (customPrompt?: string) => {
    if (!videoRef.current||!canvasRef.current||analyzing) return
    const userQ = customPrompt || prompt.trim() || (lang==="en"?"Analyze what you see":"Analisis apa yang terlihat")
    setAnalyzing(true); setStatus("capturing")
    setPrompt("")

    const canvas=canvasRef.current
    canvas.width=videoRef.current.videoWidth||640
    canvas.height=videoRef.current.videoHeight||480
    canvas.getContext("2d")!.drawImage(videoRef.current,0,0)
    const base64=canvas.toDataURL("image/jpeg",0.65).split(",")[1]

    setChatLog(prev=>[...prev,{role:"user",text:userQ,ts:ts()}])
    setStatus("analyzing")

    try {
      const sysPrompt = lang==="en"
        ? `You are V-Optics Vision AI embedded in smart glasses. The user is looking through their camera.
Be concise, warm, and useful. Structure your response naturally — no bullet lists, just flowing prose.
Focus on: what's visible, any important details the wearer should know, and answer their specific question.
Max 3 sentences unless a detailed explanation is requested.`
        : `Kamu adalah V-Optics Vision AI yang tertanam di kacamata pintar. Pengguna sedang melihat melalui kamera mereka.
Bersikaplah ringkas, hangat, dan berguna. Tulis responsmu secara alami — bukan daftar poin, tapi kalimat mengalir.
Fokus pada: apa yang terlihat, detail penting yang perlu diketahui pengguna, dan jawab pertanyaan spesifik mereka.
Maksimal 3 kalimat kecuali penjelasan detail diminta.`

      const res = await fetch("/api/claude-vision",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({image:base64, prompt:`${sysPrompt}\n\nUser: ${userQ}`})
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const reply = data.result || (lang==="en"?"No response.":"Tidak ada respons.")
      setChatLog(prev=>[...prev,{role:"ai",text:reply,ts:ts()}])
      setStatus("done")
    } catch {
      setChatLog(prev=>[...prev,{role:"ai",text:lang==="en"?"⚠ Could not reach AI. Check API.":"⚠ Gagal menghubungi AI. Cek API.",ts:ts()}])
      setStatus("error")
    }
    setAnalyzing(false)
  }

  const quickPrompts = lang==="en"
    ? ["What's in front of me?","Is it safe?","Read any text","Who's around?","Describe the scene"]
    : ["Apa yang ada di depanku?","Apakah aman?","Bacakan teks ini","Siapa di sekitar?","Deskripsikan pemandangan"]

  return (
    <div style={{display:"flex",height:"100%",gap:8,minHeight:0}}>

      {/* LEFT — Camera feed */}
      <div style={{width:"45%",display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
        {/* Viewfinder */}
        <div style={{flex:1,position:"relative",borderRadius:8,overflow:"hidden",
          border:`1.5px solid ${status==="analyzing"?accent:status==="error"?"#f55":accentDim}`,
          background:theme.isLight?"#e0e8f0":"#000",minHeight:0,transition:"border-color 0.3s"}}>
          <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",
            display:cameraOn?"block":"none"}} muted playsInline/>
          <canvas ref={canvasRef} style={{display:"none"}}/>

          {/* Offline placeholder */}
          {!cameraOn&&(
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:10,
              background:theme.isLight?"linear-gradient(180deg,#e8eff6,#d8e8f2)":"linear-gradient(180deg,#040d1a,#081828)"}}>
              <div style={{width:44,height:44,borderRadius:"50%",
                border:`1.5px solid ${accentDim}`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:20,color:accentDim,
                animation:"orbPulse 3s ease-in-out infinite"}}>⬡</div>
              <div style={{fontSize:9,color:accentDim,letterSpacing:1,textAlign:"center",
                lineHeight:1.7}}>
                {lang==="en"?"AI Vision\noffline":"AI Vision\nnonaktif"}
              </div>
            </div>
          )}

          {/* Scanning overlay */}
          {analyzing&&(
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
              <div style={{width:28,height:28,border:`2px solid ${accent}`,
                borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
              <div style={{fontSize:8,color:accent,letterSpacing:2}}>
                {status==="capturing"?"CAPTURING":"ANALYZING"}
              </div>
            </div>
          )}

          {/* Corner brackets */}
          {cameraOn&&!analyzing&&[
            {top:6,left:6,bt:"top",bl:"left"},{top:6,right:6,bt:"top",bl:"right"},
            {bottom:6,left:6,bt:"bottom",bl:"left"},{bottom:6,right:6,bt:"bottom",bl:"right"},
          ].map((c,i)=>(
            <div key={i} style={{position:"absolute",...c,width:12,height:12,
              borderTop:c.bt==="top"?`1.5px solid ${accent}`:"none",
              borderBottom:c.bt==="bottom"?`1.5px solid ${accent}`:"none",
              borderLeft:c.bl==="left"?`1.5px solid ${accent}`:"none",
              borderRight:c.bl==="right"?`1.5px solid ${accent}`:"none",
              opacity:0.7}}/>
          ))}

          {/* Status pill */}
          {cameraOn&&(
            <div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",
              padding:"2px 8px",borderRadius:20,fontSize:7,letterSpacing:1,
              background:"rgba(0,0,0,0.6)",border:`1px solid ${accentDim}`,
              color:status==="done"?accent:status==="error"?"#f55":accentDim}}>
              {status==="idle"?"● LIVE"
                :status==="capturing"?"◌ CAPTURE"
                :status==="analyzing"?"⟳ AI"
                :status==="done"?"✓ DONE"
                :"⚠ ERR"}
            </div>
          )}
        </div>

        {/* Camera controls */}
        {!cameraOn
          ? <button onClick={startCamera}
              style={{padding:"8px",borderRadius:6,border:`1px solid ${accentDim}`,
                background:accentFaint,color:accent,fontSize:9,letterSpacing:1.5,
                cursor:"pointer",fontFamily:"monospace",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.background=`${accent}18`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=accentDim;e.currentTarget.style.background=accentFaint}}>
              ⬡ AKTIFKAN KAMERA
            </button>
          : <div style={{display:"flex",gap:4}}>
              <button onClick={()=>analyze()} disabled={analyzing}
                style={{flex:2,padding:"7px",borderRadius:6,cursor:analyzing?"not-allowed":"pointer",
                  border:`1px solid ${analyzing?accentDim:accent}`,
                  background:analyzing?accentFaint:`${accent}18`,
                  color:analyzing?accentDim:accent,fontSize:9,letterSpacing:1,fontFamily:"monospace",
                  transition:"all 0.2s"}}>
                {analyzing?"⟳ AI...":"⬡ ANALISIS"}
              </button>
              <button onClick={stopCamera}
                style={{flex:1,padding:"7px",borderRadius:6,cursor:"pointer",
                  border:"1px solid rgba(255,80,80,0.4)",background:"rgba(255,60,60,0.07)",
                  color:"#f66",fontSize:9,fontFamily:"monospace"}}>
                STOP
              </button>
            </div>
        }

        {/* Quick prompts */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {quickPrompts.map(q=>(
            <div key={q} onClick={()=>cameraOn&&analyze(q)}
              style={{padding:"3px 8px",borderRadius:20,fontSize:7.5,letterSpacing:0.3,
                border:`1px solid ${cameraOn?accentDim:"#333"}`,
                background:cameraOn?accentFaint:"transparent",
                color:cameraOn?`${accent}88`:"#444",
                cursor:cameraOn?"pointer":"default",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(cameraOn)e.currentTarget.style.background=`${accent}20`}}
              onMouseLeave={e=>{e.currentTarget.style.background=cameraOn?accentFaint:"transparent"}}>
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Chat log */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:0,minWidth:0}}>
        {/* Header */}
        <div style={{padding:"4px 8px",borderBottom:`1px solid ${accentDim}`,flexShrink:0,
          display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:`${accent}20`,
            border:`1px solid ${accentDim}`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:9}}>⬡</div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:accent,fontWeight:"bold",letterSpacing:0.5}}>Vision AI</div>
            <div style={{fontSize:7,color:accentDim}}>
              {cameraOn
                ?(analyzing?"menganalisis...":"siap menganalisis")
                :"kamera mati"}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 6px",
          display:"flex",flexDirection:"column",gap:7,minHeight:0}}>

          {chatLog.length===0&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:8,
              color:accentDim,fontSize:9,textAlign:"center",lineHeight:1.8}}>
              <div style={{fontSize:22,opacity:0.3}}>⬡</div>
              {lang==="en"
                ?"Point your camera and\npress Analyze or ask a question"
                :"Arahkan kamera lalu\ntekan Analisis atau tanyakan sesuatu"}
            </div>
          )}

          {chatLog.map((msg,i)=>(
            <div key={i} style={{
              display:"flex",
              flexDirection:msg.role==="user"?"row-reverse":"row",
              alignItems:"flex-end",gap:4}}>
              {msg.role==="ai"&&(
                <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,
                  background:`${accent}20`,border:`1px solid ${accentDim}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:7,marginBottom:2}}>⬡</div>
              )}
              <div style={{maxWidth:"88%",display:"flex",flexDirection:"column",
                alignItems:msg.role==="user"?"flex-end":"flex-start",gap:2}}>
                <div style={{
                  padding:"6px 9px",
                  borderRadius:msg.role==="user"?"11px 11px 2px 11px":"11px 11px 11px 2px",
                  background:msg.role==="user"
                    ?`linear-gradient(135deg,${accent}28,${accent}14)`
                    :"rgba(255,255,255,0.04)",
                  border:`1px solid ${msg.role==="user"?accentDim:`${accent}18`}`,
                }}>
                  <div style={{fontSize:9.5,lineHeight:1.65,
                    color:msg.role==="user"?accent:"#d0e8f5",
                    whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                    {msg.text}
                  </div>
                </div>
                <div style={{fontSize:7,color:`${accentDim}`,
                  paddingLeft:msg.role==="user"?0:4,
                  paddingRight:msg.role==="user"?4:0}}>
                  {msg.role==="ai"?"Vision AI":"Kamu"} · {msg.ts}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {analyzing&&chatLog.length>0&&(
            <div style={{display:"flex",alignItems:"flex-end",gap:4}}>
              <div style={{width:16,height:16,borderRadius:"50%",
                background:`${accent}20`,border:`1px solid ${accentDim}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:7}}>⬡</div>
              <div style={{padding:"7px 10px",borderRadius:"11px 11px 11px 2px",
                background:theme.bgInset,border:`1px solid ${accent}18`}}>
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  {[0,1,2].map(j=>(
                    <div key={j} style={{width:4,height:4,borderRadius:"50%",
                      background:accent,opacity:0.6,
                      animation:"bounce 1.2s ease infinite",
                      animationDelay:`${j*0.2}s`}}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>

        {/* Input box */}
        {cameraOn&&(
          <div style={{padding:"6px 6px 4px",borderTop:`1px solid ${accentDim}`,flexShrink:0}}>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <input
                value={prompt}
                onChange={e=>setPrompt(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!analyzing&&analyze()}
                placeholder={lang==="en"?"Ask about what you see...":"Tanya tentang yang terlihat..."}
                style={{flex:1,padding:"5px 8px",borderRadius:6,fontSize:9,
                  background:theme.bgInset,
                  border:`1px solid ${accentDim}`,color:theme.textPrimary,
                  outline:"none",fontFamily:"monospace"}}/>
              <button onClick={()=>analyze()} disabled={analyzing}
                style={{padding:"5px 10px",borderRadius:6,cursor:analyzing?"not-allowed":"pointer",
                  border:`1px solid ${analyzing?accentDim:accent}`,
                  background:analyzing?accentFaint:`${accent}18`,
                  color:analyzing?accentDim:accent,fontSize:9,fontFamily:"monospace"}}>
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── DETECT PANEL — AI Vision ────────────────────────────────────────────
interface DetectedObject { label: string; score: number; bbox: [number,number,number,number] }

function DetectPanel({accent,accentDim,accentFaint,lang,theme}:{accent:string;accentDim:string;accentFaint:string;lang:string;theme?:any}) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream|null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval>|null>(null)

  const [cameraOn,  setCameraOn]  = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [objects,   setObjects]   = useState<DetectedObject[]>([])
  const [status,    setStatus]    = useState("")
  const [autoMode,  setAutoMode]  = useState(false)
  const [lastScan,  setLastScan]  = useState<Date|null>(null)

  // Warna per label
  const labelColor: Record<string,string> = {
    person:"#ff4444",car:"#ffaa00",motorcycle:"#ffaa00",bus:"#ffaa00",truck:"#ffaa00",
    bicycle:"#44ff88","cell phone":"#44aaff",laptop:"#44aaff",tv:"#44aaff",
    dog:"#ff88ff",cat:"#ff88ff",knife:"#ff2222",scissors:"#ff2222",
  }
  const getColor = (lbl: string) => labelColor[lbl.toLowerCase()] || accent

  const labelID: Record<string,string> = {
    person:"Orang",bicycle:"Sepeda",car:"Mobil",motorcycle:"Motor",airplane:"Pesawat",
    bus:"Bus",train:"Kereta",truck:"Truk",boat:"Perahu",chair:"Kursi",
    "dining table":"Meja Makan",laptop:"Laptop",keyboard:"Keyboard",mouse:"Mouse",
    "cell phone":"HP",book:"Buku",bottle:"Botol",cup:"Cangkir",
    knife:"Pisau",spoon:"Sendok",bowl:"Mangkuk",banana:"Pisang",apple:"Apel",
    backpack:"Ransel",umbrella:"Payung",handbag:"Tas",dog:"Anjing",cat:"Kucing",
    bird:"Burung",horse:"Kuda",cow:"Sapi","traffic light":"Lampu Merah",
    "stop sign":"Rambu Stop",bench:"Bangku",clock:"Jam",scissors:"Gunting",
    "potted plant":"Tanaman Pot",bed:"Kasur",toilet:"Toilet",
    "sports ball":"Bola","fire hydrant":"Hidran",refrigerator:"Kulkas",
    microwave:"Microwave",sink:"Wastafel",vase:"Vas","teddy bear":"Boneka",
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraOn(true)
      setStatus(lang==="en"?"Camera ready. Press SCAN or enable Auto.":"Kamera siap. Tekan SCAN atau aktifkan Auto.")
    } catch { setStatus("⚠ "+(lang==="en"?"Camera denied":"Akses kamera ditolak")) }
  }

  const stopCamera = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setDetecting(false); setObjects([])
    setAutoMode(false); setStatus("")
    // Clear overlay
    if (overlayRef.current) {
      overlayRef.current.getContext("2d")?.clearRect(0,0,overlayRef.current.width,overlayRef.current.height)
    }
  }

  // Capture frame → AI Vision → parse objects
  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || detecting) return
    setDetecting(true)
    setStatus(lang==="en"?"Scanning...":"Memindai...")

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    canvas.width  = videoRef.current.videoWidth  || 640
    canvas.height = videoRef.current.videoHeight || 480
    ctx.drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1]

    try {
      const prompt = lang === "en"
        ? `You are an object detection AI for V-Optics smart glasses. Analyze this camera image and detect ALL visible objects.

Return ONLY a JSON array like this (no markdown, no explanation):
[
  {"label":"person","confidence":95,"x":120,"y":80,"w":200,"h":350},
  {"label":"car","confidence":87,"x":400,"y":200,"w":180,"h":120}
]

Rules:
- label: English name (lowercase), use COCO dataset labels when possible
- confidence: 0-100 integer
- x,y,w,h: bounding box in pixels relative to the image dimensions (${canvas.width}x${canvas.height})
- Include ALL objects you can see with confidence > 40
- Be precise with bounding box coordinates
- If no objects detected, return []`
        : `Kamu adalah AI deteksi objek untuk kacamata pintar V-Optics. Analisis gambar kamera ini dan deteksi SEMUA objek yang terlihat.

Balas HANYA array JSON seperti ini (tanpa markdown, tanpa penjelasan):
[
  {"label":"person","confidence":95,"x":120,"y":80,"w":200,"h":350},
  {"label":"car","confidence":87,"x":400,"y":200,"w":180,"h":120}
]

Aturan:
- label: nama dalam bahasa Inggris (huruf kecil), gunakan label dataset COCO jika memungkinkan  
- confidence: integer 0-100
- x,y,w,h: bounding box dalam piksel relatif terhadap dimensi gambar (${canvas.width}x${canvas.height})
- Sertakan SEMUA objek yang terlihat dengan confidence > 40
- Jika tidak ada objek, kembalikan []`

      const res = await fetch("/api/claude-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, prompt, mode: "detect" })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw = (data.result ?? "").replace(/```json|```/g, "").trim()

      // Parse array JSON
      const parsed: any[] = JSON.parse(raw.startsWith("[") ? raw : raw.slice(raw.indexOf("[")))
      const detected: DetectedObject[] = parsed
        .filter(o => o.confidence >= 40)
        .sort((a,b) => b.confidence - a.confidence)
        .slice(0, 15)
        .map(o => ({
          label: String(o.label).toLowerCase(),
          score: Math.min(100, Math.max(0, Number(o.confidence))),
          bbox: [Number(o.x), Number(o.y), Number(o.w), Number(o.h)] as [number,number,number,number]
        }))

      setObjects(detected)
      setLastScan(new Date())
      setStatus(lang==="en"
        ? `✓ ${detected.length} object${detected.length!==1?"s":""} detected`
        : `✓ ${detected.length} objek terdeteksi`)

      // Draw bounding boxes
      drawBoxes(detected)

    } catch (e: any) {
      const msg = e?.message ?? ""
      if (msg.includes("JSON")) {
        setStatus(lang==="en"?"No objects detected":"Tidak ada objek terdeteksi")
        setObjects([])
        if (overlayRef.current) overlayRef.current.getContext("2d")?.clearRect(0,0,overlayRef.current.width,overlayRef.current.height)
      } else {
        setStatus("⚠ " + (lang==="en"?"API error — check route":"Error API — cek route"))
      }
    }
    setDetecting(false)
  }

  // Draw bounding boxes ke overlay canvas
  const drawBoxes = (objs: DetectedObject[]) => {
    if (!overlayRef.current || !videoRef.current) return
    const ov = overlayRef.current
    const ctx = ov.getContext("2d")!
    ov.width  = videoRef.current.videoWidth  || 640
    ov.height = videoRef.current.videoHeight || 480
    ctx.clearRect(0, 0, ov.width, ov.height)

    objs.forEach(obj => {
      const [x,y,w,h] = obj.bbox
      const color = getColor(obj.label)
      const lbl = lang==="en" ? obj.label : (labelID[obj.label] || obj.label)

      // Box
      ctx.strokeStyle = color; ctx.lineWidth = 2.5
      ctx.strokeRect(x, y, w, h)

      // Corner accents
      const cs = 10
      ctx.strokeStyle = color; ctx.lineWidth = 3
      ;[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy],i) => {
        ctx.beginPath()
        ctx.moveTo(cx + (i%2===0?cs:-cs), cy)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx, cy + (i<2?cs:-cs))
        ctx.stroke()
      })

      // Label background
      ctx.font = "bold 11px monospace"
      const tw = ctx.measureText(`${lbl} ${obj.score}%`).width + 10
      ctx.fillStyle = `${color}dd`
      const labelY = y > 20 ? y - 18 : y + h + 2
      ctx.fillRect(x, labelY, tw, 16)

      // Label text
      ctx.fillStyle = "#000"
      ctx.fillText(`${lbl} ${obj.score}%`, x + 5, labelY + 12)
    })
  }

  // Auto scan setiap 3 detik
  useEffect(() => {
    if (autoMode && cameraOn) {
      timerRef.current = setInterval(() => scanFrame(), 3000)
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoMode, cameraOn])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return (
    <div style={{display:"flex",gap:10,height:"100%"}}>
      {/* ── Video + overlay ── */}
      <div style={{flex:1.4,position:"relative",border:`1px solid ${accentDim}`,borderRadius:6,overflow:"hidden",background:theme.isLight?"#e0e8f0":"#000"}}>
        <video ref={videoRef} muted playsInline
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:cameraOn?"block":"none"}}/>
        <canvas ref={canvasRef} style={{display:"none"}}/>
        <canvas ref={overlayRef}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            display:cameraOn?"block":"none",pointerEvents:"none"}}/>

        {/* Corner brackets */}
        {([[0,0],[1,0],[0,1],[1,1]] as const).map(([x,y],i) => (
          <div key={i} style={{position:"absolute",width:14,height:14,zIndex:2,
            top:y?"auto":6,bottom:y?6:"auto",left:x?"auto":6,right:x?6:"auto",
            borderTop:!y?`2px solid ${accent}`:"none",borderBottom:y?`2px solid ${accent}`:"none",
            borderLeft:!x?`2px solid ${accent}`:"none",borderRight:x?`2px solid ${accent}`:"none"}}/>
        ))}

        {/* Scan animation */}
        {detecting && (
          <div style={{position:"absolute",left:0,right:0,top:0,height:"100%",zIndex:3,
            background:`linear-gradient(180deg,transparent 0%,${accent}15 49%,${accent}25 50%,${accent}15 51%,transparent 100%)`,
            animation:"scanBeam 1.2s ease-in-out infinite"}}/>
        )}

        {!cameraOn && (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:22,color:accentDim}}>⬢</span>
            <button onClick={startCamera}
              style={{padding:"7px 18px",fontFamily:"monospace",fontSize:9,letterSpacing:2,
                background:accentFaint,border:`1px solid ${accentDim}`,color:accent,borderRadius:4,cursor:"pointer"}}>
              {lang==="en"?"START DETECTION":"MULAI DETEKSI"}
            </button>
            <div style={{fontSize:8,color:accentDim,textAlign:"center",padding:"0 12px",lineHeight:1.6}}>
              {lang==="en"?"Powered by V-Optics AI":"Didukung V-Optics AI"}
            </div>
          </div>
        )}

        {/* Auto mode indicator */}
        {cameraOn && autoMode && (
          <div style={{position:"absolute",top:6,left:6,zIndex:4,
            padding:"2px 7px",background:`${accent}22`,border:`1px solid ${accent}`,
            borderRadius:3,fontSize:7,color:accent,letterSpacing:1,
            animation:"pulse 1s infinite"}}>
            ● AUTO {lang==="en"?"3s":"3d"}
          </div>
        )}

        {/* Model badge */}
        <div style={{position:"absolute",top:6,right:6,zIndex:4,
          padding:"2px 7px",background:"rgba(0,0,0,0.7)",border:`1px solid ${accentDim}`,
          borderRadius:3,fontSize:7,color:accentDim,letterSpacing:1}}>
          AI Vision
        </div>

        {cameraOn && (
          <button onClick={stopCamera}
            style={{position:"absolute",bottom:6,right:6,zIndex:4,
              padding:"3px 8px",fontFamily:"monospace",fontSize:8,
              background:"rgba(255,60,60,0.15)",border:"1px solid rgba(255,60,60,0.4)",
              color:"#f88",borderRadius:3,cursor:"pointer",letterSpacing:1}}>
            STOP
          </button>
        )}
      </div>

      {/* ── Panel kanan ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
        {/* Controls */}
        {cameraOn && (
          <div style={{display:"flex",gap:5}}>
            <button onClick={scanFrame} disabled={detecting}
              style={{flex:2,padding:"6px",fontFamily:"monospace",fontSize:8,letterSpacing:1,
                background:detecting?`${accent}11`:`${accent}18`,
                border:`1px solid ${detecting?accentDim:accent}`,
                color:detecting?accentDim:accent,borderRadius:4,cursor:detecting?"not-allowed":"pointer"}}>
              {detecting?"⏳ SCANNING...":"◆ SCAN"}
            </button>
            <button onClick={()=>setAutoMode(v=>!v)}
              style={{flex:1,padding:"6px",fontFamily:"monospace",fontSize:8,
                background:autoMode?`${accent}25`:accentDim,
                border:`1px solid ${autoMode?accent:accentDim}`,
                color:autoMode?accent:"#89a",borderRadius:4,cursor:"pointer",letterSpacing:1}}>
              {autoMode?"● AUTO":"AUTO"}
            </button>
          </div>
        )}

        {/* Status */}
        {status && (
          <div style={{fontSize:8,color:status.startsWith("✓")?"#0f8":status.startsWith("⚠")?"#f80":accentDim,
            letterSpacing:0.5,lineHeight:1.5}}>
            {status}
            {lastScan && <span style={{marginLeft:6,color:`${accentDim}`}}>
              {lastScan.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
            </span>}
          </div>
        )}

        {/* Header */}
        <div style={{fontSize:9,color:accentDim,letterSpacing:2}}>
          {lang==="en"?"DETECTED":"TERDETEKSI"}
          {objects.length>0&&<span style={{color:accent,marginLeft:4}}>({objects.length})</span>}
        </div>

        {/* Object list */}
        {objects.length===0 && cameraOn && !detecting && (
          <div style={{color:accentDim,fontSize:9,textAlign:"center",marginTop:8}}>
            {lang==="en"?"Press SCAN to detect":"Tekan SCAN untuk deteksi"}
          </div>
        )}

        {objects.map((obj, i) => {
          const lbl = lang==="en" ? obj.label : (labelID[obj.label] || obj.label)
          const color = getColor(obj.label)
          return (
            <div key={`${obj.label}-${i}`}
              style={{padding:"7px 9px",border:`1px solid ${color}33`,borderRadius:5,
                background:`${color}08`,animation:"slideIn 0.15s ease",animationFillMode:"both",
                animationDelay:`${i*0.04}s`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color,fontSize:11,fontWeight:"bold",textTransform:"capitalize"}}>{lbl}</span>
                <span style={{color:`${color}99`,fontSize:9}}>
                  {obj.score>=90?"●●●":obj.score>=70?"●●○":"●○○"}
                </span>
              </div>
              <div style={{height:2,background:`${color}22`,borderRadius:2}}>
                <div style={{width:`${obj.score}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.3s"}}/>
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
// ── MAIN ──────────────────────────────────────────────────────────────────────
// ── MAIN HUD SIMULATOR ────────────────────────────────────────────────────────
// ── MAIN HUD SIMULATOR ────────────────────────────────────────────────────────

interface HUDSimulatorProps {
  settings?: HUDSettings
  t: Translation
  activeFeature?: string
  setActiveFeature?: (f: string) => void
  voiceAction?: VoiceAction | null
  onVoiceActionDone?: () => void
}

export function HUDSimulator({ settings, t, activeFeature: activeFeatureProp, setActiveFeature: setActiveFeatureProp, voiceAction, onVoiceActionDone }: HUDSimulatorProps) {
  const [time, setTime] = useState(new Date())
  const [scanLine, setScanLine] = useState(0)
  const [internalFeature, setInternalFeature] = useState("home")
  const [incomingCall, setIncomingCall] = useState<IncomingCall|null>(null)
  const [pendingSearch, setPendingSearch] = useState<string|null>(null)

  const activeFeature = activeFeatureProp ?? internalFeature
  const setActiveFeature = (f:string) => { setInternalFeature(f); setActiveFeatureProp?.(f) }

  const {coords,address,accuracy,error:gpsError,nearby,loadingNearby,destination,setDestination,searchQuery,setSearchQuery,searchNearbyByQuery} = useGPS()
  const notifs  = useRealNotifs(coords)
  const battery = useBattery()

  // ── Cyberpunk Design Tokens ───────────────────────────────────────────────
  const isLight    = settings?.lightMode ?? false
  const userAccent = settings?.accentColor

  const darkTk = {
    bg:          "linear-gradient(135deg,#04080f 0%,#0a1628 50%,#060c18 100%)",
    bgSolid:     "#04080f",
    bgCard:      "rgba(0,255,200,0.03)",
    bgCardHov:   "rgba(0,255,200,0.06)",
    bgInset:     "rgba(0,255,200,0.05)",
    border:      `${userAccent??"#00ffcc"}33`,
    borderBright:`${userAccent??"#00ffcc"}88`,
    text:        "#d0f0e8",
    textSub:     "#7aabb0",
    textMuted:   "#3a6870",
    textFaint:   "#1a3840",
    accent:      userAccent ?? "#00ffcc",
    accentDim:   userAccent ? `${userAccent}88` : "#00ffcc88",
    accentFaint: userAccent ? `${userAccent}12` : "#00ffcc12",
    accentGlow:  userAccent ? `${userAccent}40` : "#00ffcc40",
    scanColor:   "rgba(0,255,200,0.025)",
    green:  "#00ff88", greenS: "rgba(0,255,136,0.15)",
    red:    "#ff4466", redS:   "rgba(255,68,102,0.15)",
    amber:  "#ffcc00", amberS: "rgba(255,204,0,0.15)",
    blue:   "#00aaff", blueS:  "rgba(0,170,255,0.15)",
  }
  const lightTk = {
    bg:          "linear-gradient(135deg,#f0f4f8 0%,#e8eef5 50%,#f2f6fa 100%)",
    bgSolid:     "#f0f4f8",
    bgCard:      "rgba(255,255,255,0.85)",
    bgCardHov:   "rgba(255,255,255,0.95)",
    bgInset:     "rgba(0,100,180,0.05)",
    border:      `${userAccent??"#0066cc"}44`,
    borderBright:`${userAccent??"#0066cc"}99`,
    text:        "#0a2030",
    textSub:     "#2a5070",
    textMuted:   "#5a8090",
    textFaint:   "#a0c0d0",
    accent:      userAccent ?? "#0066cc",
    accentDim:   userAccent ? `${userAccent}88` : "#0066cc88",
    accentFaint: userAccent ? `${userAccent}12` : "#0066cc12",
    accentGlow:  userAccent ? `${userAccent}30` : "#0066cc30",
    scanColor:   "rgba(0,100,200,0.03)",
    green:  "#00aa55", greenS: "rgba(0,170,85,0.12)",
    red:    "#cc2233", redS:   "rgba(204,34,51,0.12)",
    amber:  "#cc8800", amberS: "rgba(204,136,0,0.12)",
    blue:   "#0055cc", blueS:  "rgba(0,85,204,0.12)",
  }
  const tk = isLight ? lightTk : darkTk
  const accent      = tk.accent
  const accentDim   = tk.accentDim
  const accentFaint = tk.accentFaint

  // Legacy theme for sub-panels
  const theme = {
    isLight, accent, accentDim, accentFaint,
    bgMain:      tk.bgSolid,
    bgPanel:     "transparent",
    bgCard:      tk.bgCard,
    bgCardAlt:   tk.bgInset,
    bgInset:     tk.bgInset,
    textPrimary:   tk.text,
    textSecondary: tk.textSub,
    textMuted:     tk.textMuted,
    textFaint:     tk.textFaint,
    border:        tk.border,
    borderFaint:   tk.border,
    topbarBg:    isLight ? "rgba(230,240,250,0.95)" : "rgba(0,0,0,0.0)",
    tabBarBg:    isLight ? "rgba(225,238,252,0.98)" : "rgba(0,0,0,0.0)",
  }

  const hidden = settings?.hideUI ?? false
  const lang   = settings?.language ?? "id"

  const allTabs = [
    {id:"home",      label:lang==="en"?"Home":"Beranda",  icon:"⌂",  settingKey:null as null|string},
    {id:"nav",       label:lang==="en"?"Maps":"Peta",     icon:"◈",  settingKey:"navigation"},
    {id:"notify",    label:"Notif",                        icon:"◉",  settingKey:"notifications"},
    {id:"apps",      label:"Apps",                         icon:"⊞",  settingKey:null},
    {id:"translate", label:lang==="en"?"Lens":"Terjemah", icon:"◆",  settingKey:"translation"},
    {id:"ai",        label:"Vision",                       icon:"⬡",  settingKey:null},
    {id:"health",    label:lang==="en"?"Health":"Sehat",  icon:"♥",  settingKey:"healthMonitor"},
    {id:"detect",    label:"Scan",                         icon:"⬢",  settingKey:"objectDetect"},
    {id:"voice",     label:"AI",                           icon:"◍",  settingKey:"voiceControl"},
  ]
  const tabs = allTabs.filter(tab => tab.settingKey===null || (settings as any)?.[tab.settingKey]!==false)

  useEffect(()=>{
    const match = allTabs.find(tt=>tt.id===activeFeature)
    if(match?.settingKey && (settings as any)?.[match.settingKey]===false) setActiveFeature("home")
  },[settings])

  useEffect(()=>{ const i=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(i) },[])
  useEffect(()=>{ const i=setInterval(()=>setScanLine(p=>(p+1)%100),28); return()=>clearInterval(i) },[])

  useEffect(()=>{
    const id="voptics-cp-kf"; if(document.getElementById(id)) return
    const s=document.createElement("style"); s.id=id
    s.textContent=`
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
      @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.6}40%{transform:translateY(-4px);opacity:1}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes cpBlink{0%,100%{opacity:1}49%{opacity:1}50%{opacity:0}99%{opacity:0}}
      @keyframes cpGlow{0%,100%{text-shadow:0 0 6px currentColor}50%{text-shadow:0 0 14px currentColor,0 0 28px currentColor}}
    `
    document.head.appendChild(s)
  },[])

  useEffect(()=>{
    if(!voiceAction||voiceAction.type==="none") return
    if(voiceAction.type==="navigate") setActiveFeature((voiceAction as any).feature)
    else if(voiceAction.type==="search_nearby"){
      const q=(voiceAction as any).query??""
      setActiveFeature("nav")
      if(coords) searchNearbyByQuery(q,coords.lat,coords.lng)
      else setPendingSearch(q)
    }
    onVoiceActionDone?.()
  },[voiceAction])

  useEffect(()=>{
    if(pendingSearch&&coords){searchNearbyByQuery(pendingSearch,coords.lat,coords.lng);setPendingSearch(null)}
  },[coords,pendingSearch])

  const fmt=(n:number)=>String(n).padStart(2,"0")
  const timeStr=`${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`
  const brightness = settings?.brightness ?? 80

  return (
    <div className="relative w-full max-w-205 overflow-hidden select-none"
      style={{
        aspectRatio:"16/9",
        background:tk.bg,
        borderRadius:8,
        border:`1px solid ${tk.border}`,
        boxShadow: isLight
          ? `0 0 40px ${accent}22, inset 0 0 60px rgba(0,100,180,0.03)`
          : `0 0 60px ${accent}18, inset 0 0 120px rgba(0,20,40,0.8)`,
        filter:`brightness(${brightness}%)`,
        fontFamily:"'Courier New','Fira Code',monospace",
      }}>

      {/* Scan line effect */}
      {!isLight&&(
        <div style={{position:"absolute",left:0,right:0,zIndex:1,pointerEvents:"none",
          top:`${scanLine}%`,height:"2px",
          background:`linear-gradient(to bottom,transparent,${tk.scanColor},transparent)`,
          transition:"top 0.028s linear"}}/>
      )}

      {/* Corner brackets — cyberpunk frame */}
      {[["0","0","top","left"],["0","0","top","right"],["0","0","bottom","left"],["0","0","bottom","right"]].map(([t2,l2,vPos,hPos],i)=>(
        <div key={i} style={{position:"absolute",zIndex:5,pointerEvents:"none",
          [vPos]:4,[hPos]:4,width:12,height:12,
          borderTop:vPos==="top"?`1.5px solid ${accent}`:"none",
          borderBottom:vPos==="bottom"?`1.5px solid ${accent}`:"none",
          borderLeft:hPos==="left"?`1.5px solid ${accent}`:"none",
          borderRight:hPos==="right"?`1.5px solid ${accent}`:"none",
          opacity:0.6}}/>
      ))}

      {/* ── Top Bar ── */}
      {!hidden&&(
        <div style={{
          position:"absolute",top:0,left:0,right:0,zIndex:20,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 14px",height:36,
          background: isLight
            ? "rgba(232,242,252,0.96)"
            : "rgba(0,8,20,0.85)",
          borderBottom:`1px solid ${tk.border}`,
        }}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:18,height:18,border:`1.5px solid ${accent}`,
              borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:8,fontWeight:"bold",color:accent,letterSpacing:-0.5,
              boxShadow:`0 0 8px ${accent}66`,animation:"cpGlow 3s ease infinite"}}>V</div>
            <span style={{fontSize:10,fontWeight:"bold",color:accent,letterSpacing:3,
              textShadow:`0 0 10px ${accent}88`}}>V-OPTICS</span>
            <span style={{fontSize:7,color:tk.textMuted,letterSpacing:1,
              border:`1px solid ${tk.border}`,padding:"1px 5px",borderRadius:2}}>HUD</span>
          </div>

          {/* Clock */}
          <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",
            fontSize:13,fontWeight:"bold",color:accent,letterSpacing:4,
            textShadow:`0 0 12px ${accent}88`,fontVariantNumeric:"tabular-nums"}}>
            {timeStr}
            <span style={{fontSize:8,animation:"cpBlink 1s step-end infinite",marginLeft:2}}>_</span>
          </div>

          {/* Status */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4,
              border:`1px solid ${coords?tk.green:gpsError?tk.red:tk.amber}44`,
              padding:"2px 7px",borderRadius:2,
              background:coords?tk.greenS:gpsError?tk.redS:tk.amberS}}>
              <div style={{width:4,height:4,borderRadius:"50%",
                background:coords?tk.green:gpsError?tk.red:tk.amber,
                animation:!coords&&!gpsError?"pulse 2s infinite":undefined}}/>
              <span style={{fontSize:7,color:coords?tk.green:gpsError?tk.red:tk.amber,letterSpacing:1}}>GPS</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,
              border:`1px solid ${tk.border}`,padding:"2px 7px",borderRadius:2,
              background:battery.charging?tk.greenS:battery.level!==null&&battery.level<=15?tk.redS:"transparent"}}>
              <span style={{fontSize:9,color:battery.charging?tk.green:battery.level!==null&&battery.level<=15?tk.red:tk.textSub}}>
                {battery.charging?"⚡":"⬡"}
              </span>
              <span style={{fontSize:7.5,color:tk.textSub,fontVariantNumeric:"tabular-nums",letterSpacing:0.5}}>
                {battery.level!==null?`${battery.level}%`:"--"}
              </span>
            </div>
            {notifs.length>0&&(
              <div style={{minWidth:17,height:17,borderRadius:2,padding:"0 4px",
                background:`${accent}22`,border:`1px solid ${accent}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:8,fontWeight:"bold",color:accent,
                boxShadow:`0 0 8px ${accent}55`}}>
                {notifs.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{position:"absolute",top:hidden?0:36,bottom:hidden?0:38,
        left:0,right:0,overflow:"hidden",zIndex:10}}>
        <div style={{height:"100%",overflowY:"auto",padding:"10px 12px",scrollbarWidth:"thin",
          scrollbarColor:`${accentDim} transparent`}}>

          {activeFeature==="home"&&<HomePanelNews accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang} theme={theme}/>}
          {activeFeature==="voice"&&<VoicePanel t={t} accent={accent} onAction={(action:any)=>{
            if(action.type==="navigate") setActiveFeature(action.feature)
            else if(action.type==="search_nearby"){setActiveFeature("nav");if(coords)searchNearbyByQuery(action.query??"",coords.lat,coords.lng)}
          }}/>}
          {activeFeature==="apps"&&<AppsPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang} theme={theme} onIncomingCall={setIncomingCall}/>}
          {activeFeature==="translate"&&<TranslatePanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} targetLang={lang} theme={theme}/>}
          {activeFeature==="ai"&&<AIPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang} theme={theme}/>}
          {activeFeature==="health"&&<HealthPanel t={t}/>}
          {activeFeature==="detect"&&<DetectPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang} theme={theme}/>}

          {/* ── Nav Panel ── */}
          {activeFeature==="nav"&&(
            <div style={{display:"flex",flexDirection:"column",height:"100%",gap:8}}>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <div style={{flex:1,position:"relative"}}>
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&coords&&searchNearbyByQuery(searchQuery,coords.lat,coords.lng)}
                    placeholder={lang==="en"?"Search places...":"Cari tempat..."}
                    style={{width:"100%",padding:"6px 10px 6px 28px",borderRadius:4,fontSize:9.5,
                      background:tk.bgCard,border:`1px solid ${tk.border}`,color:tk.text,
                      outline:"none",fontFamily:"monospace",boxSizing:"border-box" as any}}/>
                  <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",
                    fontSize:11,color:tk.textMuted,pointerEvents:"none"}}>⌕</span>
                </div>
                <button onClick={()=>coords&&searchNearbyByQuery(searchQuery,coords.lat,coords.lng)}
                  style={{padding:"6px 12px",borderRadius:4,cursor:"pointer",border:`1px solid ${accent}`,
                    background:`${accent}18`,color:accent,fontSize:9,fontFamily:"monospace",letterSpacing:1}}>
                  ▶ {lang==="en"?"GO":"CARI"}
                </button>
              </div>
              <div style={{flex:"0 0 42%",borderRadius:4,overflow:"hidden",
                border:`1px solid ${tk.border}`}}>
                {coords
                  ? <LeafletMap lat={coords.lat} lng={coords.lng}
                      destLat={destination?.lat} destLng={destination?.lon ?? destination?.lng}
                      accent={accent} accentDim={accentDim} isLight={isLight}/>
                  : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
                      flexDirection:"column",gap:6,background:tk.bgCard}}>
                      {gpsError
                        ? <><span style={{fontSize:16}}>⚠️</span><span style={{fontSize:8,color:tk.red}}>{gpsError}</span></>
                        : <><div style={{width:16,height:16,border:`2px solid ${accent}`,borderTopColor:"transparent",
                            borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                          <span style={{fontSize:8,color:accentDim,letterSpacing:2}}>{lang==="en"?"LOCATING":"MENCARI LOKASI"}</span></>
                      }
                    </div>
                }
              </div>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,minHeight:0}}>
                {loadingNearby&&<div style={{padding:10,display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                  <div style={{width:12,height:12,border:`1.5px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  <span style={{fontSize:8,color:accentDim,letterSpacing:1}}>{lang==="en"?"SCANNING...":"MEMINDAI..."}</span>
                </div>}
                {nearby.map((p,i)=>(
                  <div key={i} onClick={()=>setDestination(p)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:4,
                      cursor:"pointer",transition:"all 0.15s",animation:`fadeIn 0.2s ease ${i*25}ms both`,
                      background:destination?.name===p.name?`${accent}18`:tk.bgCard,
                      border:`1px solid ${destination?.name===p.name?accent:tk.border}`}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=accent}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=destination?.name===p.name?accent:tk.border}}>
                    <span style={{fontSize:14,flexShrink:0}}>{catIcon(p.tags?.amenity||p.tags?.shop||p.tags?.tourism||"")}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9.5,fontWeight:"bold",color:tk.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name||"Unnamed"}</div>
                      <div style={{fontSize:7.5,color:accentDim,marginTop:1}}>
                        {p.tags?.amenity||p.tags?.shop||p.tags?.tourism||"place"}
                        {coords&&p.lat&&p.lon&&` · ${calcDist(coords.lat,coords.lng,p.lat,p.lon)} `}
                      </div>
                    </div>
                    {destination?.name===p.name&&<span style={{fontSize:10,color:accent}}>▶</span>}
                  </div>
                ))}
                <div style={{marginTop:"auto",padding:"6px 10px",borderRadius:4,
                  background:tk.bgCard,border:`1px solid ${tk.border}`,display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,
                    background:gpsError?tk.red:coords?tk.green:tk.amber}}/>
                  <span style={{fontSize:8,color:tk.textSub,flex:1,letterSpacing:0.5}}>
                    {destination?`▶ ${destination.name}`
                      :gpsError?`⚠ ${gpsError}`
                      :coords?`GPS ±${Math.round(accuracy||0)}m`
                      :"GPS..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Notify Panel ── */}
          {activeFeature==="notify"&&(
            <div style={{display:"flex",flexDirection:"column",height:"100%",gap:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                flexShrink:0,paddingBottom:6,borderBottom:`1px solid ${tk.border}`}}>
                <span style={{fontSize:11,fontWeight:"bold",color:accent,letterSpacing:2,
                  textShadow:`0 0 8px ${accent}66`}}>
                  {lang==="en"?"◉ ALERTS":"◉ NOTIFIKASI"}
                </span>
                {notifs.length>0&&<span style={{fontSize:7.5,padding:"2px 8px",borderRadius:2,
                  background:`${accent}18`,color:accent,border:`1px solid ${accent}`,letterSpacing:1}}>
                  {notifs.length} {lang==="en"?"NEW":"BARU"}
                </span>}
              </div>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
                {notifs.length===0&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,opacity:0.35}}>
                  <div style={{fontSize:24}}>◉</div>
                  <span style={{fontSize:8,color:accentDim,letterSpacing:3}}>{lang==="en"?"ALL CLEAR":"SEMUA BERSIH"}</span>
                </div>}
                {notifs.map((n,i)=>(
                  <div key={n.id}
                    style={{display:"flex",gap:10,padding:"8px 10px",borderRadius:4,
                      background:i===0?`${accent}10`:tk.bgCard,
                      border:`1px solid ${i===0?accentDim:tk.border}`,
                      animation:"fadeIn 0.3s ease"}}>
                    <div style={{width:28,height:28,borderRadius:4,flexShrink:0,
                      background:n.type==="net"?tk.greenS:n.type==="battery"?tk.amberS:tk.blueS,
                      border:`1px solid ${n.type==="net"?tk.green:n.type==="battery"?tk.amber:tk.blue}44`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>
                      {n.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9.5,color:tk.text,lineHeight:1.55}}>{n.msg}</div>
                      <div style={{fontSize:7.5,color:tk.textMuted,marginTop:2,letterSpacing:0.5}}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      {!hidden&&(
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,zIndex:20,
          display:"flex",alignItems:"stretch",height:38,
          background: isLight
            ? "rgba(222,236,252,0.98)"
            : "rgba(0,8,20,0.9)",
          borderTop:`1px solid ${tk.border}`,
        }}>
          {tabs.map((tab,i)=>{
            const active = activeFeature===tab.id
            return (
              <button key={tab.id} onClick={()=>setActiveFeature(tab.id)}
                style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                  justifyContent:"center",gap:2,border:"none",cursor:"pointer",
                  background:active?`${accent}18`:"transparent",
                  borderRight:i<tabs.length-1?`1px solid ${tk.border}`:"none",
                  borderTop:active?`1.5px solid ${accent}`:"1.5px solid transparent",
                  color:active?accent:tk.textMuted,
                  transition:"all 0.18s",
                }}>
                <div style={{fontSize:12,lineHeight:1,
                  textShadow:active?`0 0 8px ${accent}`:undefined}}>
                  {tab.icon}
                </div>
                <div style={{fontSize:6.5,letterSpacing:"0.04em",
                  fontWeight:active?"bold":"normal",lineHeight:1}}>
                  {tab.label}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {incomingCall&&(
        <IncomingCallBubble
          call={incomingCall} accent={accent} accentDim={accentDim} lang={lang} tk={tk}
          onAnswer={()=>{}} onDecline={()=>setIncomingCall(null)}
        />
      )}
    </div>
  )
}