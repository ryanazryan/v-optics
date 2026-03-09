// app/api/news/route.ts
// Taruh NEWS_API_KEY=xxx di .env.local untuk gambar editorial asli
// Tanpa key → pakai RSS fallback otomatis

import { NextRequest, NextResponse } from "next/server"

const CAT_META: Record<string, { grad: string; emoji: string; catColor: string }> = {
  technology:    { grad:"linear-gradient(135deg,#1e1b4b,#3730a3)", emoji:"🤖", catColor:"#818cf8" },
  business:      { grad:"linear-gradient(135deg,#052e16,#166534)", emoji:"📈", catColor:"#34d399" },
  health:        { grad:"linear-gradient(135deg,#4a044e,#7e22ce)", emoji:"🏥", catColor:"#e879f9" },
  science:       { grad:"linear-gradient(135deg,#0c4a6e,#0369a1)", emoji:"🔬", catColor:"#38bdf8" },
  sports:        { grad:"linear-gradient(135deg,#7c2d12,#c2410c)", emoji:"⚽", catColor:"#fb923c" },
  entertainment: { grad:"linear-gradient(135deg,#4c1d95,#7c3aed)", emoji:"🎬", catColor:"#c084fc" },
  general:       { grad:"linear-gradient(135deg,#1e3a5f,#1d4ed8)", emoji:"🌍", catColor:"#60a5fa" },
  nasional:      { grad:"linear-gradient(135deg,#1e3a5f,#2d6a9f)", emoji:"🇮🇩", catColor:"#4a9edd" },
  ekonomi:       { grad:"linear-gradient(135deg,#14532d,#166534)", emoji:"💰", catColor:"#22c55e" },
  olahraga:      { grad:"linear-gradient(135deg,#7c2d12,#c2410c)", emoji:"⚽", catColor:"#fb923c" },
  hiburan:       { grad:"linear-gradient(135deg,#4c1d95,#7c3aed)", emoji:"🎭", catColor:"#c084fc" },
  teknologi:     { grad:"linear-gradient(135deg,#1e1b4b,#3730a3)", emoji:"💻", catColor:"#818cf8" },
  politik:       { grad:"linear-gradient(135deg,#3b0764,#6d28d9)", emoji:"🏛️", catColor:"#a78bfa" },
  default:       { grad:"linear-gradient(135deg,#1f1f2e,#2d2d42)", emoji:"📰", catColor:"#94a3b8" },
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return "baru saja"
    if (m < 60) return `${m}m lalu`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}j lalu`
    return `${Math.floor(h / 24)}h lalu`
  } catch { return "" }
}

// Safe fetch with manual timeout (compatible with all Node versions)
async function safeFetch(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "V-Optics/1.0 (+https://github.com/v-optics)" },
      cache: "no-store",
    })
    return res
  } finally {
    clearTimeout(timer)
  }
}

// ── NewsAPI ───────────────────────────────────────────────────────────────────
async function fetchNewsAPI(lang: "id"|"en", apiKey: string) {
  const QUERIES_ID = [
    { q:"indonesia berita terkini", category:"nasional"   },
    { q:"ekonomi bisnis indonesia",  category:"ekonomi"   },
    { q:"teknologi digital startup", category:"teknologi" },
    { q:"olahraga sepakbola",        category:"olahraga"  },
    { q:"artis hiburan film",        category:"hiburan"   },
    { q:"kesehatan medis",           category:"health"    },
    { q:"politik pemerintah",        category:"politik"   },
  ]
  const QUERIES_EN = [
    { category:"technology"    },
    { category:"business"      },
    { category:"science"       },
    { category:"health"        },
    { category:"sports"        },
    { category:"entertainment" },
    { category:"general"       },
  ]
  const queries = lang === "id" ? QUERIES_ID : QUERIES_EN

  const results = await Promise.allSettled(
    queries.map(async (q: any) => {
      const p = new URLSearchParams({ apiKey, pageSize: "8", sortBy: "publishedAt" })
      let url: string
      if (q.q) {
        p.set("q", q.q); p.set("language", "id")
        url = `https://newsapi.org/v2/everything?${p}`
      } else {
        p.set("category", q.category); p.set("language", "en")
        url = `https://newsapi.org/v2/top-headlines?${p}`
      }
      const res = await safeFetch(url, 10000)
      if (!res.ok) throw new Error(`NewsAPI ${res.status}`)
      const data = await res.json()
      const cat  = q.category ?? "general"
      const meta = CAT_META[cat] ?? CAT_META.default
      return (data.articles ?? [])
        .filter((a: any) => a.title && a.title !== "[Removed]")
        .map((a: any, i: number) => ({
          id:            `${cat}-na-${i}-${Date.now()}`,
          title:         (a.title ?? "").replace(/ - [^-]+$/, "").slice(0, 160),
          summary:       (a.description ?? a.title ?? "").replace(/<[^>]+>/g,"").slice(0, 280),
          category:      cat.charAt(0).toUpperCase() + cat.slice(1),
          source:        a.source?.name ?? "News",
          time:          timeAgo(a.publishedAt ?? ""),
          imageGradient: meta.grad,
          emoji:         meta.emoji,
          catColor:      meta.catColor,
          imageUrl:      a.urlToImage ?? null,
          url:           a.url ?? null,
        }))
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
}

// ── RSS feeds ─────────────────────────────────────────────────────────────────
const RSS_FEEDS_ID = [
  { url:"https://www.kompas.com/rss/feed/breaking-news",  source:"Kompas",        cat:"nasional"   },
  { url:"https://rss.detik.com/index.php/detikcom",       source:"Detik",         cat:"nasional"   },
  { url:"https://www.cnbcindonesia.com/rss",              source:"CNBC ID",       cat:"ekonomi"    },
  { url:"https://teknologi.bisnis.com/rss",               source:"Bisnis Tech",   cat:"teknologi"  },
  { url:"https://sport.detik.com/rss.xml",                source:"Detik Sport",   cat:"olahraga"   },
  { url:"https://hot.detik.com/rss.xml",                  source:"Detik Hot",     cat:"hiburan"    },
  { url:"https://health.detik.com/rss.xml",               source:"Detik Health",  cat:"health"     },
  { url:"https://inet.detik.com/rss.xml",                 source:"Detik Inet",    cat:"teknologi"  },
  { url:"https://finance.detik.com/rss.xml",              source:"Detik Finance", cat:"ekonomi"    },
  { url:"https://www.tribunnews.com/rss",                 source:"Tribun",        cat:"nasional"   },
]
const RSS_FEEDS_EN = [
  { url:"https://feeds.bbci.co.uk/news/rss.xml",                            source:"BBC",           cat:"general"       },
  { url:"https://feeds.bbci.co.uk/news/technology/rss.xml",                 source:"BBC Tech",      cat:"technology"    },
  { url:"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",    source:"BBC Science",   cat:"science"       },
  { url:"https://feeds.bbci.co.uk/news/health/rss.xml",                     source:"BBC Health",    cat:"health"        },
  { url:"https://feeds.bbci.co.uk/sport/rss.xml",                           source:"BBC Sport",     cat:"sports"        },
  { url:"https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",     source:"BBC Ent",       cat:"entertainment" },
  { url:"https://feeds.reuters.com/reuters/topNews",                         source:"Reuters",       cat:"general"       },
  { url:"https://feeds.reuters.com/reuters/businessNews",                    source:"Reuters Biz",   cat:"business"      },
  { url:"https://feeds.reuters.com/reuters/technologyNews",                  source:"Reuters Tech",  cat:"technology"    },
  { url:"https://www.theguardian.com/technology/rss",                        source:"Guardian Tech", cat:"technology"    },
  { url:"https://www.theguardian.com/science/rss",                           source:"Guardian Sci",  cat:"science"       },
  { url:"https://www.theguardian.com/sport/rss",                             source:"Guardian Sport",cat:"sports"        },
]

function parseRSS(xml: string, source: string, cat: string): any[] {
  const items: any[] = []
  const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = rx.exec(xml)) !== null && items.length < 6) {
    const b = m[1]
    const get = (tag: string) => {
      const r = new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"
      )
      const mm = r.exec(b); return mm ? (mm[1]??mm[2]??"").trim() : ""
    }
    const title   = get("title")
      .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/&#\d+;/g,"").replace(/&[a-z]+;/g," ").trim().slice(0, 160)
    const desc    = get("description")
      .replace(/<[^>]+>/g,"").replace(/&[a-z]+;/g," ")
      .replace(/&#\d+;/g,"").trim().slice(0, 280)
    const pubDate = get("pubDate") || get("dc:date") || ""
    const link    = get("link")
    const imgM    = b.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i)
                 || b.match(/<media:content[^>]+url="([^"]+)"/i)
                 || b.match(/<enclosure[^>]+url="([^"]+\.(jpg|jpeg|png|webp))"/i)
    if (!title || title.length < 8) continue
    const meta = CAT_META[cat] ?? CAT_META.default
    items.push({
      id:            `${source}-${items.length}-${Date.now()}`,
      title,
      summary:       desc || title,
      category:      cat.charAt(0).toUpperCase() + cat.slice(1),
      source,
      time:          timeAgo(pubDate),
      imageGradient: meta.grad,
      emoji:         meta.emoji,
      catColor:      meta.catColor,
      imageUrl:      imgM ? imgM[1] : null,
      url:           link || null,
    })
  }
  return items
}

async function fetchRSS(lang: "id"|"en") {
  const feeds = lang === "id" ? RSS_FEEDS_ID : RSS_FEEDS_EN
  const results = await Promise.allSettled(
    feeds.map(async ({ url, source, cat }) => {
      const res = await safeFetch(url, 7000)
      if (!res.ok) throw new Error(`RSS ${res.status}`)
      const text = await res.text()
      return parseRSS(text, source, cat)
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const lang   = (req.nextUrl.searchParams.get("lang") === "en" ? "en" : "id") as "id"|"en"
  const apiKey = process.env.NEWS_API_KEY

  let articles: any[] = []
  let sourceName = "rss"

  try {
    if (apiKey) {
      articles   = await fetchNewsAPI(lang, apiKey)
      sourceName = "newsapi"
      if (articles.length < 12) {
        const rss  = await fetchRSS(lang)
        articles   = [...articles, ...rss]
        sourceName = "newsapi+rss"
      }
    } else {
      articles   = await fetchRSS(lang)
      sourceName = "rss"
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: `Fetch failed: ${e.message}`, articles: [], count: 0 },
      { status: 500 }
    )
  }

  if (articles.length === 0) {
    return NextResponse.json(
      { error: "No articles fetched — check RSS feeds or add NEWS_API_KEY", articles: [], count: 0 },
      { status: 503 }
    )
  }

  // Deduplicate
  const seen = new Set<string>()
  const deduped = articles.filter(a => {
    const k = a.title.slice(0, 45).toLowerCase().replace(/\s+/g, "")
    if (seen.has(k)) return false
    seen.add(k); return true
  })

  const final = deduped.sort(() => Math.random() - 0.42).slice(0, 30)

  return NextResponse.json(
    { articles: final, source: sourceName, count: final.length, lang },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  )
}