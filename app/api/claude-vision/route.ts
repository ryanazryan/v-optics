// app/api/claude-vision/route.ts
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, messages: msgHistory, mode, textOnly } = await req.json()

    if (!prompt && !msgHistory) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const maxTokens = mode === "ocr" ? 1000 : mode === "voice" ? 500 : mode === "detect" ? 800 : 400
    const temperature = mode === "ocr" ? 0.1 : mode === "voice" ? 0.8 : mode === "detect" ? 0.1 : 0.5

    let messages: any[]

    if (msgHistory && Array.isArray(msgHistory) && msgHistory.length > 0) {

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        temperature,
        system: prompt,
        messages: msgHistory,
      } as any)
      const result = (response.content.find((c) => c.type === "text") as Anthropic.TextBlock | undefined)?.text ?? ""
      return NextResponse.json({ result })
    }

    if (textOnly || !image) {
      // Single-turn text (voice cmd, news analysis, etc.)
      messages = [{ role: "user", content: prompt }]
    } else {
      // Vision — with image
      messages = [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: prompt }
        ]
      }]
    }

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      temperature,
      messages,
    } as any)

    const result = (msg.content.find((c) => c.type === "text") as Anthropic.TextBlock | undefined)?.text ?? ""
    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}