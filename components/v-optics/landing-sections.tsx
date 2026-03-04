"use client"

import type { Translation } from "@/lib/translations"

export function LandingSection({
  onPreorder,
  t,
}: {
  onPreorder: () => void
  t: Translation
}) {
  return (
    <section className="text-center" style={{ padding: "60px 20px 40px" }}>
      <div
        className="font-mono text-[11px] tracking-[6px] mb-3"
        style={{ color: "rgba(0,255,255,0.27)" }}
      >
        {t.introducing}
      </div>
      <h1
        className="font-display font-black leading-tight mb-2 text-balance"
        style={{
          fontSize: "clamp(36px,8vw,72px)",
          background: "linear-gradient(135deg,#0ff,#08f,#f0f)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        V-OPTICS
      </h1>
      <p
        className="font-sans text-[17px] tracking-[3px] mb-2"
        style={{ color: "#8af" }}
      >
        {t.tagline}
      </p>
      <p
        className="font-mono text-xs leading-relaxed max-w-115 mx-auto mb-10"
        style={{ color: "#567" }}
      >
        {t.heroDesc}
      </p>
      <button
        onClick={onPreorder}
        className="font-display text-xs tracking-[3px] font-bold cursor-pointer rounded transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.4),inset_0_0_20px_rgba(0,255,255,0.2)]"
        style={{
          padding: "13px 36px",
          background: "transparent",
          border: "2px solid #0ff",
          color: "#0ff",
          boxShadow:
            "0 0 20px rgba(0,255,255,0.2),inset 0 0 20px rgba(0,255,255,0.07)",
        }}
      >
        {t.preorderBtn}
      </button>
    </section>
  )
}

export function FeaturesSection({ t }: { t: Translation }) {
  return (
    <section className="max-w-225 mx-auto" style={{ padding: "0 20px 50px" }}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {t.featureCards.map((f, i) => (
          <div
            key={i}
            className="rounded-lg cursor-default transition-all duration-300 hover:border-[rgba(0,255,255,0.33)] hover:bg-[rgba(0,255,255,0.07)]"
            style={{
              padding: "20px 16px",
              border: "1px solid rgba(0,255,255,0.13)",
              background: "rgba(0,255,255,0.03)",
            }}
          >
            <div
              className="text-2xl mb-2.5"
              style={{ color: "#0ff", textShadow: "0 0 8px #0ff" }}
            >
              {f.icon}
            </div>
            <div
              className="font-display text-[11px] font-bold tracking-wider mb-1.5"
              style={{ color: "#cde" }}
            >
              {f.title}
            </div>
            <div
              className="font-sans text-xs leading-relaxed"
              style={{ color: "#678" }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RoadmapSection({ t }: { t: Translation }) {
  const statusList = ["done", "done", "active", "upcoming", "upcoming"]
  return (
    <section className="max-w-225 mx-auto" style={{ padding: "0 20px 60px" }}>
      <div
        className="font-display text-[10px] tracking-[4px] text-center mb-7"
        style={{ color: "rgba(0,255,255,0.47)" }}
      >
        {t.roadmapTitle}
      </div>
      <div className="flex gap-0 overflow-x-auto pb-2">
        {t.roadmapSteps.map((s, i) => {
          const status = statusList[i]
          return (
            <div key={i} className="shrink-0 relative" style={{ flex: "0 0 160px", paddingRight: 16 }}>
              {i < t.roadmapSteps.length - 1 && (
                <div
                  className="absolute"
                  style={{
                    top: 16,
                    left: 90,
                    width: "70%",
                    height: 1,
                    background:
                      status !== "upcoming"
                        ? "rgba(0,255,255,0.27)"
                        : "rgba(0,255,255,0.07)",
                  }}
                />
              )}
              <div
                className="rounded-full mb-2.5 flex items-center justify-center text-xs"
                style={{
                  width: 32,
                  height: 32,
                  background:
                    status === "done"
                      ? "rgba(0,255,255,0.13)"
                      : status === "active"
                        ? "rgba(0,255,255,0.27)"
                        : "transparent",
                  border: `2px solid ${status === "upcoming" ? "rgba(0,255,255,0.13)" : "#0ff"}`,
                  color:
                    status === "done"
                      ? "#0ff"
                      : status === "active"
                        ? "#fff"
                        : "rgba(0,255,255,0.27)",
                  boxShadow:
                    status === "active" ? "0 0 12px #0ff" : "none",
                }}
              >
                {status === "done"
                  ? "\u2713"
                  : status === "active"
                    ? "\u25CF"
                    : "\u25CB"}
              </div>
              <div
                className="font-mono text-[9px] tracking-widest mb-0.5"
                style={{ color: "rgba(0,255,255,0.33)" }}
              >
                {s.month}
              </div>
              <div
                className="font-display text-[10px] font-bold mb-1 leading-tight"
                style={{
                  color: status === "upcoming" ? "#456" : "#cde",
                }}
              >
                {s.title}
              </div>
              <div
                className="font-sans text-[10px] leading-relaxed"
                style={{ color: "#456" }}
              >
                {s.desc}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
