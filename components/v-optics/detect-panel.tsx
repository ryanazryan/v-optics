"use client"

import { useState } from "react"
import type { Translation } from "@/lib/translations"

export function DetectPanel({ t }: { t: Translation }) {
  const [active, setActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [detected, setDetected] = useState<Translation["detectedObjects"]>([])
  const [scanPct, setScanPct] = useState(0)

  const startScan = () => {
    if (scanning) return
    setScanning(true)
    setDetected([])
    setScanPct(0)
    setActive(false)
    let pct = 0
    const interval = setInterval(() => {
      pct += 5 + Math.random() * 3
      setScanPct(Math.min(pct, 100))
      if (pct >= 100) {
        clearInterval(interval)
        setDetected(t.detectedObjects)
        setScanning(false)
        setActive(true)
      }
    }, 80)
  }

  return (
    <div className="flex gap-3 h-full">
      {/* Camera viewport */}
      <div
        className="flex-[1.2] relative rounded-md overflow-hidden flex items-center justify-center"
        style={{
          border: "1px solid rgba(0,255,255,0.2)",
          background: "linear-gradient(135deg,#04080f,#081020)",
        }}
      >
        {/* Corner brackets */}
        {([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([x, y], i) => (
          <div
            key={i}
            className="absolute w-3.5 h-3.5"
            style={{
              top: y ? "auto" : 6,
              bottom: y ? 6 : "auto",
              left: x ? "auto" : 6,
              right: x ? 6 : "auto",
              borderTop: !y ? "2px solid #0ff" : "none",
              borderBottom: y ? "2px solid #0ff" : "none",
              borderLeft: !x ? "2px solid #0ff" : "none",
              borderRight: x ? "2px solid #0ff" : "none",
              opacity: 0.8,
            }}
          />
        ))}

        {/* Scan line */}
        {scanning && (
          <div
            className="absolute left-0 right-0 h-0.5"
            style={{
              background: "linear-gradient(90deg,transparent,#0ff,transparent)",
              top: `${scanPct}%`,
              transition: "top 0.08s linear",
              boxShadow: "0 0 8px #0ff",
            }}
          />
        )}

        {/* Detected bounding boxes */}
        {detected.map((obj, i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: `${obj.w}%`,
              height: `${obj.h}%`,
              border: `1.5px solid ${obj.color}`,
              animation: "fadeIn 0.3s ease",
              animationDelay: `${i * 0.15}s`,
              animationFillMode: "both",
            }}
          >
            <div
              className="absolute -top-4 left-0 px-1.5 py-px rounded-sm text-[8px] whitespace-nowrap"
              style={{
                background: obj.color + "22",
                border: `1px solid ${obj.color}`,
                color: obj.color,
              }}
            >
              {obj.label} {obj.conf}%
            </div>
          </div>
        ))}

        {/* Idle state */}
        {!active && !scanning && (
          <div className="text-center">
            <div
              className="text-[10px] tracking-widest mb-2"
              style={{ color: "rgba(0,255,255,0.2)" }}
            >
              {t.cameraReady}
            </div>
            <button
              onClick={startScan}
              className="font-display text-[10px] tracking-widest rounded cursor-pointer"
              style={{
                padding: "8px 20px",
                background: "rgba(0,255,255,0.08)",
                border: "1px solid rgba(0,255,255,0.33)",
                color: "#0ff",
              }}
            >
              {t.startScan}
            </button>
          </div>
        )}

        {/* Scanning indicator */}
        {scanning && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <div
              className="text-[9px] tracking-widest"
              style={{ color: "#0ff" }}
            >
              {t.scanning} {Math.round(scanPct)}%
            </div>
          </div>
        )}

        {/* Rescan button */}
        {active && (
          <div className="absolute bottom-1.5 right-1.5">
            <button
              onClick={startScan}
              className="font-mono text-[8px] tracking-wider rounded cursor-pointer"
              style={{
                padding: "4px 10px",
                background: "rgba(0,255,255,0.08)",
                border: "1px solid rgba(0,255,255,0.2)",
                color: "rgba(0,255,255,0.47)",
              }}
            >
              {t.rescan}
            </button>
          </div>
        )}
      </div>

      {/* Results sidebar */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        <div
          className="text-[9px] tracking-widest mb-0.5"
          style={{ color: "rgba(0,255,255,0.33)" }}
        >
          {t.detectedTitle}{" "}
          {detected.length > 0 &&
            `(${detected.reduce((a, o) => a + o.count, 0)})`}
        </div>
        {detected.length === 0 && !scanning && (
          <div
            className="text-[10px] text-center mt-5"
            style={{ color: "rgba(0,255,255,0.13)" }}
          >
            {"–"}
          </div>
        )}
        {detected.map((obj, i) => (
          <div
            key={i}
            className="rounded-[5px]"
            style={{
              padding: "8px 10px",
              border: `1px solid ${obj.color}33`,
              background: `${obj.color}07`,
              animation: "slideIn 0.3s ease",
              animationDelay: `${i * 0.12}s`,
              animationFillMode: "both",
            }}
          >
            <div className="flex justify-between mb-1">
              <span
                className="text-[11px] font-bold"
                style={{ color: obj.color }}
              >
                {obj.label}
              </span>
              <span
                className="text-[9px]"
                style={{ color: `${obj.color}99` }}
              >
                {"\u00D7"}
                {obj.count}
              </span>
            </div>
            <div
              className="h-0.5 rounded-sm"
              style={{ background: `${obj.color}22` }}
            >
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${obj.conf}%`,
                  background: obj.color,
                  boxShadow: `0 0 4px ${obj.color}`,
                }}
              />
            </div>
            <div
              className="text-[8px] mt-0.5"
              style={{ color: `${obj.color}77` }}
            >
              {t.confidence}: {obj.conf}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
