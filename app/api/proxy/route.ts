// app/api/proxy/route.ts

import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = [
  "web.whatsapp.com",
  "www.instagram.com",
  "instagram.com",
  "web.telegram.org",
  "x.com",
  "twitter.com",
  "mail.google.com",
  "accounts.google.com",
  "www.google.com",
  "open.spotify.com",
  "www.youtube.com",
  "youtube.com",
  "maps.google.com",
]

const STRIP_REQ_HEADERS = [
  "host", "origin", "referer",
]

const STRIP_RES_HEADERS = [
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  // Remove encoding headers — we will re-encode as plain after decompressing
  "content-encoding",
  "transfer-encoding",
]

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url")
  if (!targetUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let parsed: URL
  try { parsed = new URL(targetUrl) }
  catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }) }

  const allowed = ALLOWED_ORIGINS.some(o =>
    parsed.hostname === o || parsed.hostname.endsWith(`.${o}`)
  )
  if (!allowed) return NextResponse.json({ error: "Origin not allowed" }, { status: 403 })

  try {
    // Forward original request headers except host/origin
    const forwardHeaders: Record<string, string> = {
      "User-Agent":      "Mozilla/5.0 (Linux; Android 11; V-Optics) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      // Do NOT send Accept-Encoding — let Node fetch get plain text
      "Accept-Encoding": "identity",
      "Cache-Control":   "no-cache",
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)

    const upstream = await fetch(targetUrl, {
      headers: forwardHeaders,
      redirect: "follow",
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    // Build response headers — strip blocking ones and content-encoding
    const resHeaders = new Headers()
    upstream.headers.forEach((val, key) => {
      if (!STRIP_RES_HEADERS.includes(key.toLowerCase())) {
        resHeaders.set(key, val)
      }
    })

    // Inject permissive headers
    resHeaders.set("X-Frame-Options",                  "ALLOWALL")
    resHeaders.set("Access-Control-Allow-Origin",      "*")
    resHeaders.set("Access-Control-Allow-Methods",     "GET, POST, OPTIONS")
    resHeaders.set("Access-Control-Allow-Headers",     "*")
    resHeaders.set("Access-Control-Allow-Credentials", "true")

    const contentType = upstream.headers.get("content-type") ?? ""

    if (contentType.includes("text/html")) {
      let html = await upstream.text()
      const base = `${parsed.protocol}//${parsed.host}`

      // Rewrite relative paths through proxy
      html = html
        .replace(/(src|href|action)="(\/[^/"\/][^"]*)"/gi, (_, attr, path) =>
          `${attr}="/api/proxy?url=${encodeURIComponent(base + path)}"`)
        .replace(/<base[^>]+>/gi, "")
        .replace(/<head([^>]*)>/i, `<head$1><base href="${base}/">`)
        // Neutralize JS frame-busting
        .replace(/top\.location\s*=/g,            "void(0);//")
        .replace(/window\.top\.location/g,        "window.location")
        .replace(/if\s*\(\s*top\s*!==?\s*self\s*\)/g,            "if(false)")
        .replace(/if\s*\(\s*window\s*!==?\s*window\.top\s*\)/g,  "if(false)")
        .replace(/if\s*\(\s*self\s*!==?\s*top\s*\)/g,            "if(false)")

      resHeaders.set("Content-Type", "text/html; charset=utf-8")
      // No content-encoding on our response — we send plain utf-8
      resHeaders.delete("content-encoding")

      return new NextResponse(html, { status: upstream.status, headers: resHeaders })
    }

    // Non-HTML: pass through body buffer as-is (already decompressed by fetch)
    const body = await upstream.arrayBuffer()
    resHeaders.delete("content-encoding")
    return new NextResponse(body, { status: upstream.status, headers: resHeaders })

  } catch (e: any) {
    if (e.name === "AbortError") {
      return NextResponse.json({ error: "Proxy timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: `Proxy error: ${e.message}` }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url")
  if (!targetUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  try {
    const body = await req.text()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)

    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type":  req.headers.get("content-type") ?? "application/x-www-form-urlencoded",
        "User-Agent":    "Mozilla/5.0 (Linux; Android 11; V-Optics) AppleWebKit/537.36 Chrome/120",
        "Accept-Encoding": "identity",
      },
      body,
      redirect: "follow",
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    const resHeaders = new Headers()
    upstream.headers.forEach((val, key) => {
      if (!STRIP_RES_HEADERS.includes(key.toLowerCase())) resHeaders.set(key, val)
    })
    resHeaders.set("Access-Control-Allow-Origin", "*")
    resHeaders.delete("content-encoding")

    const resBody = await upstream.arrayBuffer()
    return new NextResponse(resBody, { status: upstream.status, headers: resHeaders })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  })
}