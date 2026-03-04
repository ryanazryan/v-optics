"use client"

import { useState } from "react"
import type { Translation } from "@/lib/translations"

export function PreOrderModal({
  onClose,
  t,
}: {
  onClose: () => void
  t: Translation
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [plan, setPlan] = useState("basic")
  const [done, setDone] = useState(false)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-100"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-[90%] max-w-105 font-mono"
        style={{
          padding: "30px 26px",
          background: "linear-gradient(135deg,#060d1a,#0a1628)",
          border: "1px solid rgba(0,255,255,0.27)",
          borderRadius: 12,
          boxShadow: "0 0 60px rgba(0,255,255,0.13)",
        }}
      >
        {!done ? (
          <>
            <div
              className="font-display text-sm font-bold tracking-widest mb-1"
              style={{ color: "#0ff" }}
            >
              {t.preorderTitle}
            </div>
            <div
              className="text-[10px] tracking-wider mb-5"
              style={{ color: "#567" }}
            >
              {t.preorderSub}
            </div>

            {/* Plans */}
            {(
              [
                ["basic", t.planBasicTitle, t.planBasicSub],
                ["pro", t.planProTitle, t.planProSub],
              ] as const
            ).map(([p, title, sub]) => (
              <div
                key={p}
                onClick={() => setPlan(p)}
                className="rounded-[5px] mb-2 cursor-pointer transition-all duration-200"
                style={{
                  padding: "10px 14px",
                  border: `1px solid ${plan === p ? "#0ff" : "rgba(0,255,255,0.13)"}`,
                  background:
                    plan === p ? "rgba(0,255,255,0.08)" : "transparent",
                }}
              >
                <div
                  className="text-[11px] font-bold tracking-wider"
                  style={{ color: plan === p ? "#0ff" : "#789" }}
                >
                  {title}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: "#567" }}>
                  {sub}
                </div>
              </div>
            ))}

            {/* Fields */}
            {[
              {
                l: t.fieldName,
                v: name,
                fn: setName,
                ph: t.fieldNamePh,
              },
              {
                l: t.fieldEmail,
                v: email,
                fn: setEmail,
                ph: t.fieldEmailPh,
              },
            ].map((f) => (
              <div key={f.l} className="mb-3 mt-2.5">
                <div
                  className="text-[9px] tracking-widest mb-1"
                  style={{ color: "rgba(0,255,255,0.47)" }}
                >
                  {f.l}
                </div>
                <input
                  value={f.v}
                  onChange={(e) => f.fn(e.target.value)}
                  placeholder={f.ph}
                  className="w-full font-mono text-xs rounded"
                  style={{
                    background: "rgba(0,255,255,0.04)",
                    border: "1px solid rgba(0,255,255,0.2)",
                    padding: "9px 11px",
                    color: "#cde",
                  }}
                />
              </div>
            ))}

            <button
              onClick={() => {
                if (name && email) setDone(true)
              }}
              className="w-full font-display text-[11px] font-bold tracking-[3px] rounded cursor-pointer mt-1.5"
              style={{
                padding: "12px",
                background: "rgba(0,255,255,0.1)",
                border: "2px solid #0ff",
                color: "#0ff",
              }}
            >
              {t.confirmBtn}
            </button>
            <div
              onClick={onClose}
              className="text-center mt-3 text-[9px] tracking-wider cursor-pointer"
              style={{ color: "#456" }}
            >
              {t.cancelBtn}
            </div>
          </>
        ) : (
          <div className="text-center" style={{ padding: "16px 0" }}>
            <div className="text-4xl mb-3.5">{"\u25C8"}</div>
            <div
              className="font-display text-[13px] tracking-widest mb-2"
              style={{ color: "#0ff" }}
            >
              {t.successTitle}
            </div>
            <div
              className="text-[11px] leading-relaxed mb-5 whitespace-pre-line"
              style={{ color: "#678" }}
            >
              {t.successMsg(name, email)}
            </div>
            <button
              onClick={onClose}
              className="font-display text-[10px] tracking-widest rounded cursor-pointer"
              style={{
                padding: "9px 24px",
                background: "transparent",
                border: "1px solid rgba(0,255,255,0.2)",
                color: "rgba(0,255,255,0.47)",
              }}
            >
              {t.closeBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
