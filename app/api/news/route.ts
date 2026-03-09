// app/api/news/route.ts
// NewsAPI.org — requires NEWS_API_KEY in .env.local
// Free tier: 100 requests/day, articles from last 30 days
// Register at: https://newsapi.org/register
import { NextRequest, NextResponse } from "next/server"

const CAT_META: Record<string, { grad: string; emoji: string; catColor: string }> = {
  technology:  { grad: "linear-gradient(135deg,#1e1b4b,#3730a3)", emoji: "🤖", catColor: "#818cf8" },
  business:    { grad: "linear-gradient(135deg,#052e16,#166534)", emoji: "📈", catColor: "#34d399" },
  health:      { grad: "linear-gradient(135deg,#4a044e,#7e22ce)", emoji: "🏥", catColor: "#e879f9" },
  science:     { grad: "linear-gradient(135deg,#0c4a6e,#0369a1)", emoji: "🔬", catColor: "#38bdf8" },
  sports:      { grad: "linear-gradient(135deg,#7c2d12,#c2410c)", emoji: "⚽", catColor: "#fb923c" },
  entertainment:{ grad: "linear-gradient(135deg,#4c1d95,#7c3aed)", emoji: "🎬", catColor: "#c084fc" },
  general:     { grad: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", emoji: "🌍", catColor: "#60a5fa" },
  default:     { grad: "linear-gradient(135deg,#1f1f2e,#2d2d42)", emoji: "📰", catColor: "#94a3b8" },
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return "" }
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEWS_API_KEY
  const lang   = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "id"

  // ── No API key → fallback to RSS feeds ────────────────────────────────────
  if (!apiKey) {
    return fetchRSSFallback(lang)
  }

  // ── NewsAPI fetch ─────────────────────────────────────────────────────────
  const queries = lang === "id"
    ? [
        { q: "indonesia", category: "general",    lang: "id" },
        { q: "teknologi",  category: "technology", lang: "id" },
        { q: "ekonomi",    category: "business",   lang: "id" },
      ]
    : [
        { category: "technology",    lang: "en" },
        { category: "business",      lang: "en" },
        { category: "general",       lang: "en" },
        { category: "science",       lang: "en" },
      ]

  const results = await Promise.allSettled(
    queries.map(async (q) => {
      const params = new URLSearchParams({
        apiKey,
        language: q.lang,
        pageSize: "5",
        sortBy: "publishedAt",
        ...(q.category ? { category: q.category } : {}),
        ...(q.q ? { q: q.q } : {}),
      })
      const endpoint = q.category && !q.q
        ? `https://newsapi.org/v2/top-headlines?${params}`
        : `https://newsapi.org/v2/everything?${params}`

      const res = await fetch(endpoint, {
        headers: { "User-Agent": "V-Optics/1.0" },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
      const data = await res.json()
      return { articles: data.articles || [], category: q.category || "general" }
    })
  )

  const articles = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .flatMap(({ value }) =>
      (value.articles as any[])
        .filter(a => a.title && a.title !== "[Removed]" && a.urlToImage)
        .map((a, i) => {
          const cat = value.category
          const meta = CAT_META[cat] ?? CAT_META.default
          return {
            id: `${cat}-${i}-${Date.now()}`,
            title: a.title?.slice(0, 140) ?? "",
            summary: a.description?.slice(0, 220) ?? a.title ?? "",
            category: cat.charAt(0).toUpperCase() + cat.slice(1),
            source: a.source?.name ?? "News",
            time: timeAgo(a.publishedAt),
            imageGradient: meta.grad,
            emoji: meta.emoji,
            catColor: meta.catColor,
            imageUrl: a.urlToImage ?? null,   // ← real thumbnail from NewsAPI
            url: a.url ?? null,
          }
        })
    )
    .filter(a => a.title.length > 10)
    .sort(() => Math.random() - 0.45)
    .slice(0, 20)

  if (articles.length === 0) return fetchRSSFallback(lang)
  return NextResponse.json({ articles, source: "newsapi", count: articles.length })
}

// ── RSS fallback (no API key needed) ─────────────────────────────────────────
const RSS_FEEDS = {
  id: [
    { url: "https://www.kompas.com/rss/feed/breaking-news", source: "Kompas",   cat: "general"    },
    { url: "https://rss.detik.com/index.php/detikcom",      source: "Detik",    cat: "general"    },
    { url: "https://teknologi.bisnis.com/rss",              source: "Bisnis",   cat: "technology" },
    { url: "https://www.cnbcindonesia.com/rss",             source: "CNBC ID",  cat: "business"   },
  ],
  en: [
    { url: "https://feeds.bbci.co.uk/news/rss.xml",              source: "BBC",     cat: "general"    },
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",   source: "BBC Tech",cat: "technology" },
    { url: "https://feeds.reuters.com/reuters/topNews",          source: "Reuters", cat: "business"   },
    { url: "https://www.theguardian.com/world/rss",              source: "Guardian",cat: "general"    },
  ],
}

async function fetchRSSFallback(lang: "id" | "en") {
  const feeds = RSS_FEEDS[lang]
  const results = await Promise.allSettled(
    feeds.map(async ({ url, source, cat }) => {
      const res = await fetch(url, {
        headers: { "User-Agent": "V-Optics/1.0 RSS" },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error(`RSS ${res.status}`)
      const xml = await res.text()
      return parseRSS(xml, source, cat)
    })
  )
  const articles = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
    .sort(() => Math.random() - 0.45)
    .slice(0, 18)
  return NextResponse.json({ articles, source: "rss", count: articles.length })
}

function parseRSS(xml: string, source: string, cat: string) {
  const items: any[] = []
  const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = rx.exec(xml)) !== null && items.length < 5) {
    const b = m[1]
    const get = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
      const mm = r.exec(b); return mm ? (mm[1] ?? mm[2] ?? "").trim() : ""
    }
    const title   = get("title").replace(/&amp;/g,"&").replace(/&#\d+;/g,"").trim().slice(0,140)
    const desc    = get("description").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").trim().slice(0,220)
    const pubDate = get("pubDate") || get("dc:date") || ""
    const link    = get("link")
    const imgMatch = b.match(/url="([^"]+\.(jpg|jpeg|png|webp))"/i) || b.match(/<media:content[^>]+url="([^"]+)"/i)
    if (!title || title.length < 8) continue
    const meta = CAT_META[cat] ?? CAT_META.default
    items.push({
      id: `${source}-${items.length}-${Date.now()}`,
      title, summary: desc || title,
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      source, time: timeAgo(pubDate),
      imageGradient: meta.grad, emoji: meta.emoji, catColor: meta.catColor,
      imageUrl: imgMatch ? imgMatch[1] : null,
      url: link,
    })
  }
  return items
}