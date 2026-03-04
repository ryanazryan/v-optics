"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Translation } from "@/lib/translations"

export {}

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface MatchedCommand {
  cmd: string
  response: string
  icon: string
  display?: string
  noMatch?: boolean
}

export function VoicePanel({ t }: { t: Translation }) {
  const [status, setStatus] = useState<
    "idle" | "listening" | "processing" | "result" | "error"
  >("idle")
  const [transcript, setTranscript] = useState("")
  const [matchedCmd, setMatchedCmd] = useState<MatchedCommand | null>(null)
  const [typedRes, setTypedRes] = useState("")
  const [bars, setBars] = useState(Array(16).fill(4))
  const [errorMsg, setErrorMsg] = useState("")
  const recognitionRef = useRef<globalThis.SpeechRecognition | null>(null)
  const barsRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasSupport =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  const stopBars = useCallback(() => {
    if (barsRef.current) {
      clearInterval(barsRef.current)
      barsRef.current = null
    }
    setBars(Array(16).fill(4))
  }, [])

  const typeResponse = useCallback((cmd: MatchedCommand) => {
    setMatchedCmd(cmd)
    setTypedRes("")
    setStatus("result")
    let i = 0
    const interval = setInterval(() => {
      setTypedRes(cmd.response.slice(0, i + 1))
      i++
      if (i >= cmd.response.length) clearInterval(interval)
    }, 30)
  }, [])

  const matchCommand = useCallback(
    (text: string) => {
      const lower = text.toLowerCase()
      const matched = t.voiceCommands.find((vc) =>
        vc.cmd.split(" ").some((word) => word.length > 3 && lower.includes(word))
      )
      return matched || null
    },
    [t.voiceCommands]
  )

  const startListening = useCallback(() => {
    if (!hasSupport) {
      setStatus("error")
      setErrorMsg(t.voiceNoSupport)
      return
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_e) {
        // ignore
      }
    }

    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined

    if (!SR) return

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = t === (t as Translation) ? "id-ID" : "en-US"
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    setStatus("listening")
    setTranscript("")
    setMatchedCmd(null)
    setTypedRes("")
    setErrorMsg("")
    barsRef.current = setInterval(
      () => setBars(Array(16).fill(0).map(() => 4 + Math.random() * 28)),
      80
    )

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      setTranscript(final || interim)
    }

    recognition.onend = () => {
      stopBars()
      setStatus((s) => {
        if (s === "listening") {
          setTranscript((prev) => {
            if (prev) {
              const cmd = matchCommand(prev)
              if (cmd) {
                typeResponse(cmd)
              } else {
                setMatchedCmd({
                  cmd: prev,
                  response: prev,
                  icon: "\uD83C\uDFA4",
                  noMatch: true,
                })
                setStatus("result")
                setTypedRes(prev)
              }
            } else {
              setStatus("idle")
            }
            return prev
          })
        }
        return s
      })
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      stopBars()
      if (e.error === "not-allowed") {
        setStatus("error")
        setErrorMsg(t.voicePermDenied)
      } else if (e.error === "no-speech") {
        setStatus("idle")
      } else {
        setStatus("error")
        setErrorMsg(t.voiceError)
      }
    }

    try {
      recognition.start()
    } catch (_e) {
      stopBars()
      setStatus("error")
      setErrorMsg(t.voiceError)
    }
  }, [hasSupport, t, stopBars, matchCommand, typeResponse])

  const triggerCmd = useCallback(
    (cmd: Translation["voiceCommands"][number]) => {
      stopBars()
      setTranscript(cmd.display)
      typeResponse(cmd)
    },
    [stopBars, typeResponse]
  )

  useEffect(() => {
    return () => {
      stopBars()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (_e) {
          // ignore
        }
      }
    }
  }, [stopBars])

  return (
    <div className="flex flex-col gap-4">
      {/* Mic button */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={startListening}
          disabled={status === "listening"}
          className="w-18 h-18 rounded-full flex items-center justify-center relative transition-all duration-300"
          style={{
            cursor: status === "listening" ? "not-allowed" : "pointer",
            background:
              status === "listening"
                ? "rgba(0,255,255,0.18)"
                : "rgba(0,255,255,0.06)",
            border: `2px solid ${status === "listening" ? "#0ff" : status === "error" ? "#f44" : "rgba(0,255,255,0.33)"}`,
            boxShadow:
              status === "listening"
                ? "0 0 30px rgba(0,255,255,0.33)"
                : "0 0 10px rgba(0,255,255,0.13)",
          }}
        >
          {status === "listening" && (
            <div
              className="absolute rounded-full"
              style={{
                inset: -6,
                border: "2px solid rgba(0,255,255,0.2)",
                animation: "ripple 1s ease-out infinite",
              }}
            />
          )}
          <span
            className="text-[26px]"
            style={{
              filter:
                status === "listening" ? "drop-shadow(0 0 6px #0ff)" : "none",
            }}
          >
            {"\uD83C\uDFA4"}
          </span>
        </button>

        {/* Audio bars */}
        <div className="flex items-center gap-0.5 h-9">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-0.75 rounded-sm transition-[height] duration-75 ease-out"
              style={{
                background: "#0ff",
                height: status === "listening" ? h : 4,
                opacity: status === "listening" ? 0.7 : 0.2,
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <div
          className="text-[10px] tracking-widest"
          style={{
            color:
              status === "listening"
                ? "#0ff"
                : status === "error"
                  ? "#f44"
                  : "rgba(0,255,255,0.33)",
            textShadow:
              status === "listening" ? "0 0 8px #0ff" : "none",
          }}
        >
          {status === "listening"
            ? t.voiceListening
            : status === "error"
              ? "\u25CF ERROR"
              : t.voicePress}
        </div>
      </div>

      {/* Transcript in progress */}
      {status === "listening" && transcript && (
        <div
          className="rounded-md text-[11px] italic text-center font-mono"
          style={{
            padding: "8px 14px",
            border: "1px solid rgba(0,255,255,0.13)",
            background: "rgba(0,255,255,0.04)",
            color: "rgba(0,255,255,0.47)",
            animation: "pulse-glow 1s ease infinite",
          }}
        >
          {`"${transcript}"`}
        </div>
      )}

      {/* Error */}
      {status === "error" && errorMsg && (
        <div
          className="rounded-md text-[11px] leading-relaxed text-center"
          style={{
            padding: "10px 14px",
            border: "1px solid rgba(255,68,68,0.2)",
            background: "rgba(255,60,60,0.06)",
            color: "#f88",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Result */}
      {status === "result" && matchedCmd && (
        <div
          className="rounded-lg"
          style={{
            padding: "12px 14px",
            border: "1px solid rgba(0,255,255,0.2)",
            background: "rgba(0,255,255,0.04)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            className="text-[9px] tracking-widest mb-1.5"
            style={{ color: "rgba(0,255,255,0.33)" }}
          >
            {t.voiceDetected}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[15px]" style={{ color: "#0ff" }}>
              {matchedCmd.icon}
            </span>
            <span className="text-xs" style={{ color: "#cde" }}>
              {`"${matchedCmd.noMatch ? transcript : matchedCmd.display}"`}
            </span>
          </div>
          {!matchedCmd.noMatch && (
            <>
              <div
                className="text-[9px] tracking-widest mb-1"
                style={{ color: "rgba(0,255,255,0.33)" }}
              >
                {t.voiceResponse}
              </div>
              <div
                className="text-[11px] leading-relaxed"
                style={{ color: "#0f8" }}
              >
                {typedRes}
                <span style={{ animation: "blink 0.8s infinite" }}>
                  {"\u258C"}
                </span>
              </div>
            </>
          )}
          {matchedCmd.noMatch && (
            <div className="text-[10px] mt-1" style={{ color: "#f80" }}>
              {"⚠"} Perintah tidak dikenali. Coba salah satu perintah cepat di
              bawah.
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      {hasSupport && (
        <div
          className="text-[10px] text-center leading-relaxed font-mono"
          style={{ color: "#456" }}
        >
          {t.voiceTip}{" "}
          <span style={{ color: "rgba(0,255,255,0.33)" }}>
            {t.voiceTipCmds}
          </span>
        </div>
      )}

      {/* Quick commands */}
      <div>
        <div
          className="text-[9px] tracking-widest mb-2"
          style={{ color: "rgba(0,255,255,0.27)" }}
        >
          {t.voiceQuickTitle}
        </div>
        <div className="flex flex-col gap-1.5">
          {t.voiceCommands.map((cmd, i) => (
            <div
              key={i}
              onClick={() => triggerCmd(cmd)}
              className="flex items-center gap-2.5 rounded-[5px] cursor-pointer transition-all duration-200 hover:bg-[rgba(0,255,255,0.07)] hover:border-[rgba(0,255,255,0.33)]"
              style={{
                padding: "7px 10px",
                border: "1px solid rgba(0,255,255,0.13)",
                background: "rgba(0,255,255,0.03)",
              }}
            >
              <span className="text-[13px]" style={{ color: "#0ff" }}>
                {cmd.icon}
              </span>
              <span className="text-[11px]" style={{ color: "#89a" }}>
                {cmd.display}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
