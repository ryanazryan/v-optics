"use client"

import { useState, useEffect } from "react"
import type { Translation } from "@/lib/translations"

export function HealthPanel({ t }: { t: Translation }) {
  const [bpm, setBpm] = useState(72)
  const [steps, setSteps] = useState(4231)
  const [cal, setCal] = useState(312)
  const [graph, setGraph] = useState(() =>
    Array.from({ length: 20 }, () => 50 + Math.random() * 30)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setBpm((v) => Math.max(60, Math.min(100, v + Math.round((Math.random() - 0.5) * 4))))
      setSteps((v) => v + Math.floor(Math.random() * 3))
      setCal((v) => v + (Math.random() > 0.7 ? 1 : 0))
      setGraph((g) => [...g.slice(1), 50 + Math.random() * 30])
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const metrics = [
    {
      label: t.stepLabel,
      value: steps.toLocaleString(),
      unit: t.stepUnit,
      icon: "\uD83D\uDC5F",
      color: "#0f8",
      pct: Math.min((steps / 10000) * 100, 100),
    },
    {
      label: t.calLabel,
      value: cal,
      unit: t.calUnit,
      icon: "\uD83D\uDD25",
      color: "#f80",
      pct: Math.min((cal / 500) * 100, 100),
    },
    {
      label: t.distLabel,
      value: (steps * 0.0007).toFixed(2),
      unit: t.distUnit,
      icon: "\uD83D\uDCCD",
      color: "#f0f",
      pct: Math.min(((steps * 0.0007) / 10) * 100, 100),
    },
  ]

  return (
    <div className="flex flex-col gap-2.5 h-full">
      {/* Heart rate */}
      <div
        className="flex items-center gap-3 rounded-lg p-2.5"
        style={{
          border: "1px solid rgba(255,0,64,0.27)",
          background: "rgba(255,0,80,0.05)",
        }}
      >
        <div className="relative w-9 h-9 shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid #f04",
              animation: "ripple 1.2s ease-out infinite",
              opacity: 0.5,
            }}
          />
          <div
            className="absolute rounded-full flex items-center justify-center text-sm"
            style={{
              inset: 4,
              background: "rgba(255,0,64,0.2)",
              animation: "heartbeat 1.2s ease-in-out infinite",
            }}
          >
            {"♥"}
          </div>
        </div>
        <div className="flex-1">
          <div
            className="text-[9px] tracking-widest mb-0.5"
            style={{ color: "#f04" }}
          >
            {t.heartRate}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="font-display text-[26px] font-black"
              style={{ color: "#f04", textShadow: "0 0 12px #f04" }}
            >
              {bpm}
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,0,64,0.4)" }}>
              BPM
            </span>
            <span
              className="ml-1.5 text-[9px] tracking-wider"
              style={{
                color: bpm < 80 ? "#0f8" : bpm < 95 ? "#ff0" : "#f04",
              }}
            >
              {bpm < 80 ? t.normal : bpm < 95 ? t.moderate : t.high}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[1.5px] h-7">
          {graph.map((v, i) => (
            <div
              key={i}
              className="w-[3px] rounded-sm transition-[height] duration-200 ease-out"
              style={{
                background: "#f04",
                opacity: 0.5 + i * 0.02,
                height: `${(v / 80) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex gap-2 flex-1">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col gap-1.5 rounded-lg p-2.5"
            style={{
              border: `1px solid ${m.color}33`,
              background: `${m.color}08`,
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="text-[9px] tracking-wider"
                style={{ color: `${m.color}99` }}
              >
                {m.label}
              </span>
              <span className="text-sm">{m.icon}</span>
            </div>
            <div>
              <span
                className="font-display text-base font-bold"
                style={{ color: m.color }}
              >
                {m.value}
              </span>
              <span
                className="text-[9px] ml-1"
                style={{ color: `${m.color}77` }}
              >
                {m.unit}
              </span>
            </div>
            <div
              className="h-[3px] rounded-sm"
              style={{ background: `${m.color}22` }}
            >
              <div
                className="h-full rounded-sm transition-[width] duration-700 ease-out"
                style={{
                  width: `${m.pct}%`,
                  background: m.color,
                  boxShadow: `0 0 4px ${m.color}`,
                }}
              />
            </div>
            <div className="text-[8px]" style={{ color: `${m.color}66` }}>
              {Math.round(m.pct)}
              {t.targetLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
