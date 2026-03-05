import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, mode, textOnly } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const maxTokens = mode === "ocr" ? 1000 : mode === "voice" ? 300 : 400

    let messages: any[]

    if (textOnly || !image) {
      messages = [{
        role: "user",
        content: prompt
      }]
    } else {
      messages = [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: image }
          },
          { type: "text", text: prompt }
        ]
      }]
    }

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      temperature: mode === "ocr" ? 0.1 : mode === "voice" ? 0.7 : 0.4,
      messages,
    } as any)

    const result = (msg.content.find((c) => c.type === "text") as Anthropic.TextBlock | undefined)?.text ?? ""
    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}