import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json()
    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing image or prompt" }, { status: 400 })
    }

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    })

    const result = msg.content.find((c) => c.type === "text")
    return NextResponse.json({ result: (result as any)?.text ?? "" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}