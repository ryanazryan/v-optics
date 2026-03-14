"use client"

import { useEffect, useRef, useState } from "react"
import type { Translation } from "@/lib/translations"

// ── 3D Glasses via Three.js ───────────────────────────────────────────────────
export function GlassesHero({ onDemo }: { onDemo: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const [loaded,  setLoaded]  = useState(false)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState<{componentName:string;material:string;function:string}|null>(null)
  const isDragging = useRef(false)
  const lastMouse  = useRef({ x:0, y:0 })
  const rotation   = useRef({ x:0.15, y:0 })
  const autoRotate = useRef(true)

  useEffect(() => {
    if (!mountRef.current) return
    let THREE: any
    const loadThree = async () => {
      if (!(window as any).THREE) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
          s.onload = () => res(); s.onerror = rej
          document.head.appendChild(s)
        })
      }
      THREE = (window as any).THREE
      initScene(THREE)
    }
    const initScene = (THREE: any) => {
      const el = mountRef.current!
      const W = el.clientWidth, H = el.clientHeight

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, W/H, 0.1, 100)
      camera.position.set(0, 0.5, 7.5)

      // ── Lights ────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 2.5))
      const key = new THREE.DirectionalLight(0xffffff, 4.0)
      key.position.set(3, 5, 4); scene.add(key)
      const fill = new THREE.DirectionalLight(0xffffff, 2.5)
      fill.position.set(-4, 2, 3); scene.add(fill)
      const rim = new THREE.DirectionalLight(0xffffff, 2.0)
      rim.position.set(0, -4, -4); scene.add(rim)
      scene.add(new THREE.DirectionalLight(0xffffff, 1.5).position.set(0,10,0) && (() => {
        const l = new THREE.DirectionalLight(0xffffff, 1.5); l.position.set(0,10,0); return l
      })())

      // ── Materials ─────────────────────────────────────────────────────
      const frameMat = new THREE.MeshStandardMaterial({ color:0x1c1c1c, roughness:0.12, metalness:0.95 })
      const hingeAccent = new THREE.MeshStandardMaterial({ color:0x888888, roughness:0.05, metalness:1.0 })
      const lensMat = new THREE.MeshPhysicalMaterial({
        color:0x050a10, roughness:0.0, metalness:0.05,
        transmission:0.5, transparent:true, opacity:0.78, reflectivity:0.95,
      })
      const hudGlowMat = new THREE.MeshBasicMaterial({
        color:0x00ffcc, transparent:true, opacity:0.12, side:THREE.DoubleSide,
      })
      const dotMat = new THREE.MeshBasicMaterial({ color:0x00ffcc })

      const group = new THREE.Group()
      // Store named meshes for raycasting
      const namedMeshes: {mesh: any; name: string}[] = []

      // ── Rounded rect helper ──────────────────────────────────────────
      const rr = (w: number, h: number, r: number): any => {
        const s = new THREE.Shape()
        s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r)
        s.lineTo(w/2,h/2-r);   s.quadraticCurveTo(w/2,h/2,w/2-r,h/2)
        s.lineTo(-w/2+r,h/2);  s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r)
        s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2)
        return s
      }

      const LW=1.38, LH=0.64, LR=0.14
      const IW=1.18, IH=0.48, IR=0.09
      const xOff = 1.5

      // ── Lens frame ───────────────────────────────────────────────────
      const makeFrameWithLens = (x: number, side: string) => {
        const frameShape = rr(LW, LH, LR)
        const hole = new THREE.Path()
        hole.moveTo(-IW/2+IR,-IH/2); hole.lineTo(IW/2-IR,-IH/2); hole.quadraticCurveTo(IW/2,-IH/2,IW/2,-IH/2+IR)
        hole.lineTo(IW/2,IH/2-IR); hole.quadraticCurveTo(IW/2,IH/2,IW/2-IR,IH/2)
        hole.lineTo(-IW/2+IR,IH/2); hole.quadraticCurveTo(-IW/2,IH/2,-IW/2,IH/2-IR)
        hole.lineTo(-IW/2,-IH/2+IR); hole.quadraticCurveTo(-IW/2,-IH/2,-IW/2+IR,-IH/2)
        frameShape.holes.push(hole)

        const frame = new THREE.Mesh(
          new THREE.ExtrudeGeometry(frameShape, {depth:0.14,bevelEnabled:true,bevelSize:0.025,bevelThickness:0.025,bevelSegments:5}),
          frameMat.clone()
        )
        frame.position.set(x, 0, 0)
        frame.userData = { componentName: `${side} Lens Frame`, material: "Aircraft-grade aluminum alloy 7075", function: "Structural housing for optics. Lightweight yet rigid enough to maintain optical alignment under daily wear." }
        namedMeshes.push({ mesh: frame, name: `${side} Lens Frame` })

        const lens = new THREE.Mesh(
          new THREE.ExtrudeGeometry(rr(IW-0.02,IH-0.02,IR), {depth:0.05,bevelEnabled:false}),
          lensMat.clone()
        )
        lens.position.set(x, 0, 0.045)
        lens.userData = { componentName: `${side} Optical Lens`, material: "AR-coated polycarbonate (1.2mm)", function: "Beam-splitter waveguide lens. Projects HUD overlay onto real-world view at 30° FOV with 85% light transmission." }
        namedMeshes.push({ mesh: lens, name: `${side} Optical Lens` })

        const hud = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.28), hudGlowMat)
        hud.position.set(x, 0.02, 0.16)
        hud.userData = { componentName: "HUD Display Area", material: "Holographic waveguide coating", function: "Active display zone where AI-generated overlays appear. Supports 1080p equivalent at 60fps refresh rate." }
        namedMeshes.push({ mesh: hud, name: "HUD Display Area" })

        return [frame, lens, hud]
      }

      // ── Bridge ────────────────────────────────────────────────────────
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.055, 0.055), hingeAccent.clone())
      bridge.position.set(0, 0.07, 0.07)
      bridge.userData = { componentName: "Bridge", material: "Titanium alloy Ti-6Al-4V", function: "Connects both lens frames. Adjustable spring-loaded mechanism provides custom fit without tools." }
      namedMeshes.push({ mesh: bridge, name: "Bridge" })

      const wireGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8)
      wireGeo.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI/2))
      const wire = new THREE.Mesh(wireGeo, hingeAccent.clone())
      wire.position.set(0, 0.23, 0.07)
      wire.userData = { componentName: "Data Bus Wire", material: "Copper-clad kapton flex cable", function: "Carries power and data signals between left and right lens units. Embedded inside the frame housing." }
      namedMeshes.push({ mesh: wire, name: "Data Bus Wire" })

      // ── Temple arms — angled DOWN and BACK like real glasses ─────────
      const makeTemple = (side: number, label: string) => {
        const pts: any[] = []
        const startX = side * (xOff + LW/2 + 0.02)
        // Real glasses: start at frame level, angle back AND down sharply
        // Phase 1: horizontal-ish out to ear (first 60%)
        // Phase 2: bend down behind ear (last 40%)
        for (let i=0; i<=40; i++) {
          const tt = i/40
          let x, y, z
          if (tt < 0.6) {
            // Straight section going back
            const t2 = tt/0.6
            x = startX + side*(t2*2.2)
            y = 0.02 - t2*0.05
            z = 0.07 - t2*0.05
          } else {
            // Curved section bending DOWN behind ear
            const t2 = (tt-0.6)/0.4
            const baseX = startX + side*2.2
            x = baseX + side*(t2*0.7)
            y = -0.03 - t2*t2*0.55  // curves sharply down
            z = 0.02 - t2*0.12
          }
          pts.push(new THREE.Vector3(x, y, z))
        }
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.036, 8, false),
          frameMat.clone()
        )
        tube.userData = { componentName: `${label} Temple Arm`, material: "Carbon fiber reinforced nylon (PA12-CF)", function: "Hinged arm that rests over the ear. Contains embedded Raspberry Pi Zero 2W processor, 1000mAh LiPo battery, and wireless antenna." }
        namedMeshes.push({ mesh: tube, name: `${label} Temple Arm` })

        const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.09), hingeAccent.clone())
        hinge.position.set(side*(xOff+LW/2+0.01), 0.02, 0.08)
        hinge.userData = { componentName: `${label} Hinge`, material: "Stainless steel 316L", function: "Spring-loaded hinge allows 190° rotation. Click-stop mechanism holds open/closed position." }
        namedMeshes.push({ mesh: hinge, name: `${label} Hinge` })

        return [tube, hinge]
      }

      // ── Nose pads ─────────────────────────────────────────────────────
      const makeNosePad = (side: number, label: string) => {
        const pts: any[] = []
        for (let i=0; i<=10; i++) {
          const tt = i/10
          pts.push(new THREE.Vector3(side*0.06+side*tt*0.1, -0.25-tt*0.12, 0.1+tt*0.04))
        }
        const pad = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.018, 6, false),
          hingeAccent.clone()
        )
        pad.userData = { componentName: `${label} Nose Pad`, material: "Medical-grade silicone (Shore 40A)", function: "Adjustable nose pad with memory foam insert. Distributes 34g frame weight evenly. Hypoallergenic coating." }
        namedMeshes.push({ mesh: pad, name: `${label} Nose Pad` })
        return pad
      }

      // ── HUD indicator + camera ─────────────────────────────────────
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035,10,10), dotMat)
      dot.position.set(xOff+LW/2+0.28, 0.02, 0.08)
      dot.userData = { componentName: "Status LED", material: "Micro LED (0402 package)", function: "Multi-color status indicator. Green = active, Blue = BT connected, Red = charging, Pulsing = processing AI request." }
      namedMeshes.push({ mesh: dot, name: "Status LED" })

      const camMat = new THREE.MeshStandardMaterial({ color:0x222222, roughness:0.3, metalness:0.7 })
      const cam = new THREE.Mesh(new THREE.BoxGeometry(0.11,0.075,0.055), camMat)
      cam.position.set(xOff+LW/2+0.48, 0.02, 0.1)
      cam.userData = { componentName: "AI Camera Module", material: "OV5647 sensor + glass lens", function: "5MP camera at 30fps feeding real-time frames to V-AI Vision Intelligence. Powers object detection, translation, and scene analysis." }
      namedMeshes.push({ mesh: cam, name: "AI Camera Module" })

      // ── Assemble ──────────────────────────────────────────────────────
      makeFrameWithLens(-xOff, "Left").forEach(m => group.add(m))
      makeFrameWithLens( xOff, "Right").forEach(m => group.add(m))
      group.add(bridge, wire)
      makeTemple(-1, "Left").forEach(m => group.add(m))
      makeTemple( 1, "Right").forEach(m => group.add(m))
      group.add(makeNosePad(-1, "Left"), makeNosePad(1, "Right"))
      group.add(dot, cam)

      group.rotation.x = 0.15
      group.rotation.y = rotation.current.y
      scene.add(group)

      // ── Particles ─────────────────────────────────────────────────────
      const pGeo = new THREE.BufferGeometry()
      const N = 200, pos = new Float32Array(N*3)
      for (let i=0; i<N; i++) {
        pos[i*3]=(Math.random()-0.5)*20; pos[i*3+1]=(Math.random()-0.5)*14; pos[i*3+2]=(Math.random()-0.5)*10-3
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({color:0xffffff,size:0.04,transparent:true,opacity:0.35}))
      scene.add(particles)

      // ── Raycaster for click detection ─────────────────────────────────
      const raycaster = new THREE.Raycaster()
      const handleClick = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  * 2 - 1,
          -((e.clientY - rect.top)  / rect.height) * 2 + 1
        )
        raycaster.setFromCamera(mouse, camera)
        const meshes = namedMeshes.map(n => n.mesh)
        const hits = raycaster.intersectObjects(meshes, true)
        if (hits.length > 0) {
          // Walk up to find userData
          let obj: any = hits[0].object
          while (obj && !obj.userData?.componentName) obj = obj.parent
          if (obj?.userData?.componentName) {
            const ev = new CustomEvent('glasses-component-click', { detail: obj.userData })
            el.dispatchEvent(ev)
          }
        }
      }
      el.addEventListener('click', handleClick)

      // ── Animate ───────────────────────────────────────────────────────
      let t = 0
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate)
        t += 0.008
        if (autoRotate.current) rotation.current.y += 0.004
        group.rotation.x = rotation.current.x
        group.rotation.y = rotation.current.y
        group.position.y = Math.sin(t*0.7)*0.06
        hudGlowMat.opacity = 0.08 + Math.sin(t*2.8)*0.08
        dotMat.opacity = 0.4 + Math.sin(t*3.5)*0.6
        particles.rotation.y = t*0.02
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!el) return
        const W=el.clientWidth, H=el.clientHeight
        camera.aspect=W/H; camera.updateProjectionMatrix()
        renderer.setSize(W,H)
      }
      window.addEventListener("resize", onResize)

      // Cleanup click listener stored on renderer for cleanup
      ;(renderer as any)._clickHandler = handleClick
      ;(renderer as any)._el = el
    }  // end initScene

    loadThree().catch(console.error)
    return () => {
      cancelAnimationFrame(frameRef.current)
      if (mountRef.current) {
        const canvas = mountRef.current.querySelector("canvas")
        if (canvas) mountRef.current.removeChild(canvas)
      }
    }
  }, [])

  useEffect(() => {
    const el = mountRef.current
    if (!el || !loaded) return
    const handler = (e: Event) => {
      setClicked((e as CustomEvent).detail)
      autoRotate.current = false
    }
    el.addEventListener('glasses-component-click', handler)
    return () => el.removeEventListener('glasses-component-click', handler)
  }, [loaded])

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true; autoRotate.current = false
    lastMouse.current = { x:e.clientX, y:e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    rotation.current.y += dx * 0.008
    rotation.current.x = Math.max(-0.6, Math.min(0.6, rotation.current.x + dy*0.005))
    lastMouse.current = { x:e.clientX, y:e.clientY }
  }
  const onMouseUp = () => {
    isDragging.current = false
    setTimeout(() => { autoRotate.current = true }, 2000)
  }
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true; autoRotate.current = false
    lastMouse.current = { x:e.touches[0].clientX, y:e.touches[0].clientY }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - lastMouse.current.x
    const dy = e.touches[0].clientY - lastMouse.current.y
    rotation.current.y += dx * 0.008
    rotation.current.x = Math.max(-0.6, Math.min(0.6, rotation.current.x + dy*0.005))
    lastMouse.current = { x:e.touches[0].clientX, y:e.touches[0].clientY }
  }

  return (
    <section className="relative flex flex-col items-center overflow-hidden"
      style={{ background:"#000", minHeight:"100vh" }}>

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{ opacity:0.03,
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize:"200px" }}/>

      {/* Radial glow */}
      <div className="absolute pointer-events-none" style={{ bottom:"5%", left:"50%",
        transform:"translateX(-50%)", width:700, height:400,
        background:"radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 65%)" }}/>

      {/* Title */}
      <div className="relative z-20 text-center w-full" style={{ paddingTop:100 }}>
        <div className="font-mono tracking-[6px] text-[11px] mb-5"
          style={{ color:"rgba(255,255,255,0.6)", animation:"vFadeUp 1s ease 0.1s both" }}>
          SMART GLASSES · AI-POWERED HUD
        </div>
        <h1 className="font-black leading-none"
          style={{ fontSize:"clamp(72px,18vw,200px)", color:"#fff",
            letterSpacing:"-0.04em", fontFamily:"'Arial Black',Arial,sans-serif",
            lineHeight:0.9, animation:"vSlideIn 1.2s cubic-bezier(0.16,1,0.3,1) both" }}>
          V-OPTICS
        </h1>
        <p className="font-mono tracking-[5px] mt-5 mb-2"
          style={{ fontSize:"clamp(9px,1.5vw,13px)", color:"rgba(255,255,255,0.65)",
            animation:"vSubFade 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}>
          SEE THE WORLD DIFFERENTLY
        </p>
      </div>

      {/* 3D Canvas */}
      <div className="relative z-20 w-full" style={{ maxWidth:960, margin:"0 auto" }}>
        <div ref={mountRef}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove}
          onTouchEnd={() => { isDragging.current=false; setTimeout(()=>{autoRotate.current=true},2000) }}
          className="w-full cursor-grab active:cursor-grabbing relative"
          style={{ height:"min(52vw,400px)" }}>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-mono text-[10px] tracking-[4px]"
                style={{ color:"rgba(255,255,255,0.5)", animation:"cpPulse 1.5s ease infinite" }}>
                LOADING 3D MODEL...
              </div>
            </div>
          )}

          {/* Component popup */}
          {clicked && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div style={{
                background:"rgba(0,0,0,0.93)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:8, padding:"20px 24px", maxWidth:300, width:"85%",
                backdropFilter:"blur(12px)", animation:"vFadeUp 0.2s ease both", position:"relative",
              }}>
                <button onClick={()=>{setClicked(null);setTimeout(()=>{autoRotate.current=true},500)}}
                  style={{ position:"absolute",top:10,right:12,background:"none",border:"none",
                    color:"rgba(255,255,255,0.5)",fontSize:20,cursor:"pointer",lineHeight:1 }}>×</button>
                <div className="font-mono text-[9px] tracking-[3px] mb-1"
                  style={{ color:"rgba(255,255,255,0.45)" }}>COMPONENT</div>
                <div className="font-black text-[15px] mb-4 leading-tight"
                  style={{ color:"#fff", fontFamily:"'Arial Black',sans-serif" }}>
                  {clicked.componentName}
                </div>
                <div className="mb-3">
                  <div className="font-mono text-[8px] tracking-[2px] mb-1"
                    style={{ color:"rgba(255,255,255,0.4)" }}>MATERIAL</div>
                  <div className="font-mono text-[11px]"
                    style={{ color:"rgba(255,255,255,0.85)" }}>{clicked.material}</div>
                </div>
                <div>
                  <div className="font-mono text-[8px] tracking-[2px] mb-1"
                    style={{ color:"rgba(255,255,255,0.4)" }}>FUNCTION</div>
                  <div className="font-mono text-[10px] leading-relaxed"
                    style={{ color:"rgba(255,255,255,0.7)" }}>{clicked.function}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loaded && (
          <div className="text-center font-mono text-[9px] tracking-[3px] flex justify-center gap-6"
            style={{ marginTop:-4 }}>
            <span style={{ color:"rgba(255,255,255,0.5)" }}>DRAG TO ROTATE</span>
            <span style={{ color:"rgba(255,255,255,0.3)" }}>·</span>
            <span style={{ color:"rgba(255,255,255,0.5)" }}>CLICK PARTS TO EXPLORE</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="relative z-20 text-center" style={{ paddingTop:36, paddingBottom:72 }}>
        <button onClick={onDemo}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="font-mono font-bold tracking-[5px] transition-all duration-200"
          style={{ fontSize:"clamp(11px,1.5vw,14px)", padding:"15px 52px",
            animation:"vFadeUp 1s ease 0.6s both",
            background: hovered?"#fff":"transparent",
            border:"2px solid rgba(255,255,255,0.9)",
            color: hovered?"#000":"#fff", borderRadius:2, cursor:"pointer",
            transform: hovered?"scale(1.03)":"scale(1)",
            boxShadow: hovered?"0 0 60px rgba(255,255,255,0.3)":"0 0 20px rgba(255,255,255,0.06)",
            letterSpacing:"0.3em" }}>
          ▶ LAUNCH DEMO
        </button>
        <div className="font-mono text-[9px] tracking-[3px] mt-3"
          style={{ color:"rgba(255,255,255,0.5)" }}>
          NO DOWNLOAD · RUNS IN BROWSER
        </div>
      </div>

      {/* Scroll */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <div className="font-mono text-[8px] tracking-[3px]"
          style={{ color:"rgba(255,255,255,0.4)", animation:"cpPulse 2s ease infinite" }}>SCROLL</div>
        <div style={{ width:1, height:20, background:"rgba(255,255,255,0.2)" }}/>
      </div>

      <style>{`
        @keyframes cpPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes vFadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vSlideIn { from{opacity:0;letter-spacing:0.3em} to{opacity:1;letter-spacing:-0.04em} }
        @keyframes vSubFade { from{opacity:0;transform:translateY(10px)} to{opacity:0.65;transform:translateY(0)} }
      `}</style>
    </section>
  )
}

// ── Floating 3D Orb ───────────────────────────────────────────────────────────
function FloatingOrb({ size=120, style={} }: { size?:number; style?:React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext("2d")!
    canvas.width = size*2; canvas.height = size*2
    canvas.style.width = size+"px"; canvas.style.height = size+"px"
    ctx.scale(2,2)
    let t = 0
    const cx=size/2, cy=size/2, R=size*0.36
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw); t+=0.012
      ctx.clearRect(0,0,size,size)
      for (let i=0; i<12; i++) {
        const angle=(i/12)*Math.PI+t
        const rx=Math.cos(angle)*R, ry=Math.sin(angle)*R*0.35
        ctx.beginPath(); ctx.ellipse(cx,cy,Math.abs(rx),R,0,0,Math.PI*2)
        ctx.strokeStyle=`rgba(255,255,255,${0.1+Math.abs(Math.cos(angle))*0.18})`
        ctx.lineWidth=0.8; ctx.stroke()
      }
      for (let i=-3; i<=3; i++) {
        const fy=cy+(i/3)*R*0.85
        const fr=Math.sqrt(Math.max(0,R*R-(fy-cy)*(fy-cy)))*Math.abs(Math.cos(t*0.3+i*0.5))
        if (fr<1) continue
        ctx.beginPath(); ctx.ellipse(cx,fy,fr,fr*0.25,0,0,Math.PI*2)
        ctx.strokeStyle=`rgba(255,255,255,${0.07+Math.abs(i/3)*0.1})`
        ctx.lineWidth=0.7; ctx.stroke()
      }
      const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,R*0.5)
      grad.addColorStop(0,"rgba(255,255,255,0.07)"); grad.addColorStop(1,"rgba(255,255,255,0)")
      ctx.beginPath(); ctx.arc(cx,cy,R*0.5,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill()
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [size])
  return <canvas ref={ref} style={{ display:"block", ...style }}/>
}

// ── Product Section ───────────────────────────────────────────────────────────
export function ProductSection({ t }: { t: Translation }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold:0.2 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  const specs = [
    { label:"Display",    value:"Beam-splitter waveguide HUD",   icon:"◈" },
    { label:"Processor",  value:"Raspberry Pi Zero 2W",           icon:"⬡" },
    { label:"AI Engine",  value:"V-AI Vision Intelligence",       icon:"◆" },
    { label:"Battery",    value:"INA219 real-time monitoring",    icon:"♥" },
    { label:"Navigation", value:"GPS + Overpass offline maps",    icon:"◉" },
    { label:"Interface",  value:"Voice + touch capacitive pad",   icon:"◍" },
  ]
  return (
    <section ref={ref} style={{ background:"#000", padding:"100px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-16" style={{ opacity:visible?1:0, transform:visible?"none":"translateY(30px)", transition:"all 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="font-mono text-[10px] tracking-[6px] mb-4" style={{ color:"rgba(255,255,255,0.55)" }}>ABOUT THE PRODUCT</div>
          <h2 className="font-black text-[clamp(32px,5vw,56px)] leading-tight"
            style={{ color:"#fff", letterSpacing:"-0.02em", fontFamily:"'Arial Black',sans-serif" }}>
            A HEADS-UP DISPLAY<br/><span style={{ color:"rgba(255,255,255,0.4)" }}>FOR THE REAL WORLD</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-12" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",
          opacity:visible?1:0, transform:visible?"none":"translateY(40px)", transition:"all 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s" }}>
          <div>
            <p className="text-[16px] leading-[1.85] mb-6" style={{ color:"rgba(255,255,255,0.7)", fontFamily:"Georgia,serif" }}>
              V-Optics is a smart glasses prototype built at Universitas Telkom.
              It overlays a real-time AI-powered HUD onto your field of vision —
              navigation, translation, object detection, health monitoring,
              and voice control, all without reaching for your phone.
            </p>
            <p className="text-[15px] leading-[1.85]" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"Georgia,serif" }}>
              Built on accessible hardware (Raspberry Pi Zero 2W + beam splitter),
              V-Optics proves that the future of wearable AI doesn't have to cost thousands.
            </p>
            <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"32px 0" }}/>
            <div className="grid grid-cols-3 gap-6">
              {[["< Rp 1.5jt","Est. BOM cost"],["7","AI features"],["60fps","HUD refresh"]].map(([val,lbl],i)=>(
                <div key={i}>
                  <div className="font-black text-[22px] leading-none mb-1" style={{ color:"#fff", fontFamily:"'Arial Black',sans-serif" }}>{val}</div>
                  <div className="font-mono text-[9px] tracking-[2px]" style={{ color:"rgba(255,255,255,0.55)" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {specs.map((s,i)=>(
              <div key={i} className="flex items-center gap-4" style={{ padding:"14px 16px",
                border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, background:"rgba(255,255,255,0.02)",
                opacity:visible?1:0, transform:visible?"none":"translateX(20px)",
                transition:`all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.2+i*0.07}s` }}>
                <div className="font-mono text-[16px] w-6 text-center shrink-0" style={{ color:"rgba(255,255,255,0.4)" }}>{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[9px] tracking-[2px] mb-0.5" style={{ color:"rgba(255,255,255,0.5)" }}>{s.label.toUpperCase()}</div>
                  <div className="font-mono text-[11px]" style={{ color:"rgba(255,255,255,0.9)" }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────
export function FeaturesSection({ t }: { t: Translation }) {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState<number|null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold:0.1 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  return (
    <section ref={ref} style={{ background:"#000", padding:"80px 20px 100px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12" style={{ opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:"all 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="font-mono text-[10px] tracking-[6px] mb-3" style={{ color:"rgba(255,255,255,0.5)" }}>CAPABILITIES</div>
          <h2 className="font-black text-[clamp(28px,4vw,48px)]" style={{ color:"#fff", letterSpacing:"-0.02em", fontFamily:"'Arial Black',sans-serif" }}>WHAT IT CAN DO</h2>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))" }}>
          {t.featureCards.map((f,i)=>(
            <div key={i} onClick={()=>setActive(active===i?null:i)} className="cursor-pointer"
              style={{ padding:active===i?"20px 18px 24px":"20px 18px",
                border:`1px solid ${active===i?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.07)"}`,
                borderRadius:4, background:active===i?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.01)",
                opacity:visible?1:0, transform:visible?"none":"translateY(20px)",
                transition:`opacity 0.5s ease ${i*0.05}s, transform 0.5s ease ${i*0.05}s, border 0.2s, background 0.2s, padding 0.2s` }}>
              <div className="text-[22px] mb-3" style={{ filter:"grayscale(1)", opacity:0.75 }}>{f.icon}</div>
              <div className="font-mono text-[11px] font-bold tracking-wider mb-2" style={{ color:active===i?"#fff":"rgba(255,255,255,0.85)" }}>{f.title}</div>
              <div className="font-mono text-[10px] leading-relaxed" style={{ color:"rgba(255,255,255,0.6)",
                maxHeight:active===i?"120px":"0px", overflow:"hidden", transition:"max-height 0.3s ease", opacity:active===i?1:0 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold:0.15 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  const steps = [
    { num:"01", title:"WEAR",     desc:"Put on V-Optics. The beam splitter overlays digital information directly onto your field of view.", icon:"👓" },
    { num:"02", title:"PERCEIVE", desc:"V-Optics reads your environment via GPS, camera, and sensors — in real time.", icon:"◈" },
    { num:"03", title:"PROCESS",  desc:"V-AI analyzes context, translates speech, detects objects, and generates insights.", icon:"⬡" },
    { num:"04", title:"DISPLAY",  desc:"Results appear as a transparent HUD overlay — navigation arrows, translations, alerts, health data.", icon:"◆" },
  ]
  return (
    <section ref={ref} style={{ background:"#050505", padding:"100px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 text-center" style={{ opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:"all 0.7s ease" }}>
          <div className="font-mono text-[10px] tracking-[6px] mb-3" style={{ color:"rgba(255,255,255,0.5)" }}>HOW IT WORKS</div>
          <h2 className="font-black text-[clamp(28px,4vw,48px)]" style={{ color:"#fff", letterSpacing:"-0.02em", fontFamily:"'Arial Black',sans-serif" }}>FOUR SIMPLE STEPS</h2>
        </div>
        <div className="flex justify-center mb-12" style={{ opacity:visible?1:0, transition:"opacity 0.8s ease 0.2s" }}>
          <FloatingOrb size={160}/>
        </div>
        <div className="grid gap-0" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))" }}>
          {steps.map((s,i)=>(
            <div key={i} className="relative" style={{ padding:"32px 24px",
              borderLeft:i>0?"1px solid rgba(255,255,255,0.06)":"none",
              opacity:visible?1:0, transform:visible?"none":`translateY(${24+i*8}px)`,
              transition:`all 0.7s cubic-bezier(0.16,1,0.3,1) ${i*0.12}s` }}>
              <div className="font-black text-[56px] leading-none mb-4"
                style={{ color:"rgba(255,255,255,0.04)", fontFamily:"'Arial Black',sans-serif", position:"absolute", top:20, right:20 }}>{s.num}</div>
              <div className="text-[24px] mb-4" style={{ filter:"grayscale(1)", opacity:0.6 }}>{s.icon}</div>
              <div className="font-mono text-[11px] tracking-[3px] font-bold mb-3" style={{ color:"rgba(255,255,255,0.85)" }}>{s.title}</div>
              <div className="font-mono text-[10px] leading-relaxed" style={{ color:"rgba(255,255,255,0.6)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Roadmap Section ───────────────────────────────────────────────────────────
export function RoadmapSection({ t }: { t: Translation }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold:0.1 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  const statusList = ["done","done","active","upcoming","upcoming"] as const
  return (
    <section ref={ref} style={{ background:"#000", padding:"100px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-14" style={{ opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:"all 0.7s ease" }}>
          <div className="font-mono text-[10px] tracking-[6px] mb-3" style={{ color:"rgba(255,255,255,0.5)" }}>TIMELINE</div>
          <h2 className="font-black text-[clamp(28px,4vw,48px)]" style={{ color:"#fff", letterSpacing:"-0.02em", fontFamily:"'Arial Black',sans-serif" }}>{t.roadmapTitle}</h2>
        </div>
        <div className="flex gap-0 overflow-x-auto pb-4" style={{ scrollbarWidth:"none" }}>
          {t.roadmapSteps.map((s,i)=>{
            const status=statusList[i]
            return (
              <div key={i} className="shrink-0 relative" style={{ flex:"0 0 200px", paddingRight:24 }}>
                {i<t.roadmapSteps.length-1&&(
                  <div className="absolute" style={{ top:15,left:30,width:"calc(100% - 12px)",height:1,
                    background:status!=="upcoming"?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.07)",
                    opacity:visible?1:0, transition:`opacity 0.6s ease ${i*0.15}s` }}/>
                )}
                <div className="flex items-center justify-center mb-5 relative z-10"
                  style={{ width:30,height:30,borderRadius:"50%",
                    border:`1px solid ${status==="upcoming"?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.7)"}`,
                    background:status==="active"?"rgba(255,255,255,0.15)":"transparent",
                    fontSize:11, color:status==="upcoming"?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.9)",
                    boxShadow:status==="active"?"0 0 16px rgba(255,255,255,0.25)":"none",
                    opacity:visible?1:0, transition:`all 0.5s ease ${i*0.12}s` }}>
                  {status==="done"?"✓":status==="active"?"●":"○"}
                </div>
                <div className="font-mono text-[8px] tracking-widest mb-1" style={{ color:"rgba(255,255,255,0.5)", opacity:visible?1:0, transition:`opacity 0.5s ease ${i*0.12+0.1}s` }}>{s.month}</div>
                <div className="font-mono text-[11px] font-bold mb-2 leading-tight" style={{ color:status==="upcoming"?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.9)", opacity:visible?1:0, transition:`opacity 0.5s ease ${i*0.12+0.15}s` }}>{s.title}</div>
                <div className="font-mono text-[10px] leading-relaxed" style={{ color:"rgba(255,255,255,0.55)", opacity:visible?1:0, transition:`opacity 0.5s ease ${i*0.12+0.2}s` }}>{s.desc}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── CTA Section ───────────────────────────────────────────────────────────────
export function CTASection({ onDemo }: { onDemo: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold:0.3 })
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect()
  }, [])
  return (
    <section ref={ref} className="text-center" style={{ background:"#000", padding:"120px 20px 80px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ opacity:visible?1:0, transform:visible?"none":"translateY(32px)", transition:"all 0.9s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="font-mono text-[10px] tracking-[6px] mb-6" style={{ color:"rgba(255,255,255,0.5)" }}>TRY IT NOW</div>
        <h2 className="font-black leading-tight mb-4"
          style={{ fontSize:"clamp(36px,7vw,80px)", color:"#fff", letterSpacing:"-0.03em", fontFamily:"'Arial Black',sans-serif" }}>
          EXPERIENCE<br/>V-OPTICS
        </h2>
        <p className="font-mono text-[12px] mb-10" style={{ color:"rgba(255,255,255,0.6)", letterSpacing:"0.05em" }}>
          Full prototype simulation · No hardware needed
        </p>
        <button onClick={onDemo}
          onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
          className="font-mono tracking-[5px] text-[12px] font-bold"
          style={{ padding:"18px 60px", background:hovered?"#fff":"transparent",
            border:"2px solid #fff", color:hovered?"#000":"#fff", borderRadius:2, cursor:"pointer",
            transition:"all 0.25s ease", boxShadow:hovered?"0 0 80px rgba(255,255,255,0.2)":"none" }}>
          ▶ LAUNCH DEMO
        </button>
      </div>
    </section>
  )
}

// Backward compat alias
export function LandingSection({ onPreorder, t }: { onPreorder:()=>void; t:Translation }) {
  return <GlassesHero onDemo={onPreorder}/>
}