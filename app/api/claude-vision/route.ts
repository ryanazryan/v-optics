// app/api/claude-vision/route.ts
// Gunakan Gemini Flash — GRATIS, tanpa kartu kredit
// Daftar API key di: https://aistudio.google.com

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json()

    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing image or prompt" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set in .env.local" }, { status: 500 })
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.4,
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message ?? "Gemini API error" }, { status: 500 })
    }

    const data = await res.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}