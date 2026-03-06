"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Translation } from "@/lib/translations"
import type { HUDSettings } from "@/lib/types"
import type { VoiceAction } from "@/app/page"
import { HealthPanel } from "./health-panel"

interface HUDSimulatorProps {
  settings: HUDSettings
  t: Translation
  activeFeature?: string
  setActiveFeature?: (f: string) => void
  voiceAction?: VoiceAction
  onVoiceActionDone?: () => void
}

interface NearbyPlace {
  name: string; dist: string; category: string; lat: number; lng: number
}
interface RealNotif {
  id: string; type: string; icon: string; msg: string; time: string
}
interface DetectedObject {
  label: string; score: number; bbox: [number, number, number, number]
}

function calcDist(la1: number, lo1: number, la2: number, lo2: number): string {
  const R = 6371000, dLa = ((la2-la1)*Math.PI)/180, dLo = ((lo2-lo1)*Math.PI)/180
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2
  const m = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`
}
// ── Leaflet Map Component with real routing ──────────────────────────────────
function LeafletMap({ lat, lng, destLat, destLng, accent, accentDim }: {
  lat: number; lng: number; destLat?: number; destLng?: number
  accent: string; accentDim: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const routeRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const loadScript = (src: string, integrity?: string): Promise<void> => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement("script"); s.src = src
    if (integrity) { s.integrity = integrity; s.crossOrigin = "anonymous" }
    s.onload = () => resolve(); s.onerror = reject
    document.head.appendChild(s)
  })
  const loadCSS = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href
    document.head.appendChild(l)
  }

  const initMap = useCallback(async () => {
    if (!mapRef.current) return
    try {
      loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
      const L = (window as any).L
      if (!L || leafletRef.current) return

      // Init map dengan Carto Dark tiles (mirip Google Maps dark mode)
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
      leafletRef.current = map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map)

      // Custom marker icons
      const pulseIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${accent};box-shadow:0 0 0 4px ${accent}44,0 0 12px ${accent};animation:none;border:2px solid #fff"></div>`,
        className: "", iconSize: [14, 14], iconAnchor: [7, 7]
      })
      const destIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;position:relative"><div style="width:16px;height:16px;background:#ff4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;position:absolute;top:0;left:2px"></div></div>`,
        className: "", iconSize: [20, 20], iconAnchor: [10, 18]
      })

      // Marker posisi user
      const userMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map)
      markersRef.current = [userMarker]
      map.setView([lat, lng], 16)

    } catch (e) { console.error("Leaflet init failed:", e) }
  }, [])

  // Update route saat destination berubah
  useEffect(() => {
    const L = (window as any).L
    if (!L || !leafletRef.current) return
    const map = leafletRef.current

    // Hapus marker destination lama
    markersRef.current.slice(1).forEach(m => map.removeLayer(m))
    markersRef.current = markersRef.current.slice(0, 1)
    // Hapus rute lama
    if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null }

    if (!destLat || !destLng) {
      map.setView([lat, lng], 16)
      return
    }

    // Marker destination
    const destIcon = L.divIcon({
      html: `<div style="width:20px;height:24px;position:relative"><div style="width:16px;height:16px;background:#ff4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;position:absolute;top:0;left:2px;box-shadow:0 0 8px #ff4444"></div></div>`,
      className: "", iconSize: [20, 24], iconAnchor: [10, 22]
    })
    const dm = L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
    markersRef.current.push(dm)

    // Fit bounds supaya kedua titik keliatan
    const bounds = L.latLngBounds([[lat, lng], [destLat, destLng]])
    map.fitBounds(bounds, { padding: [30, 30] })

    // Fetch rute dari OSRM
    fetch(`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${destLng},${destLat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]?.geometry) {
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]])
          routeRef.current = L.polyline(coords, {
            color: accent, weight: 4, opacity: 0.9,
            dashArray: undefined
          }).addTo(map)
          map.fitBounds(routeRef.current.getBounds(), { padding: [30, 30] })
        }
      })
      .catch(() => {
        // Fallback: garis lurus
        routeRef.current = L.polyline([[lat, lng], [destLat, destLng]], {
          color: accent, weight: 3, opacity: 0.7, dashArray: "6 4"
        }).addTo(map)
      })
  }, [destLat, destLng])

  // Update posisi user marker
  useEffect(() => {
    const L = (window as any).L
    if (!L || !leafletRef.current || !markersRef.current[0]) return
    markersRef.current[0].setLatLng([lat, lng])
  }, [lat, lng])

  useEffect(() => { initMap() }, [])
  useEffect(() => () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }, [])

  return <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: 6 }} />
}
function catIcon(c: string) {
  return c==="cafe"?"☕":c==="restaurant"||c==="fast_food"||c==="food_court"?"🍽":
    c==="hospital"||c==="pharmacy"||c==="clinic"?"🏥":
    c==="school"||c==="university"||c==="college"?"🎓":
    c==="bank"||c==="atm"?"🏦":c==="fuel"?"⛽":
    c==="supermarket"||c==="convenience"||c==="marketplace"?"🛒":
    c==="mosque"||c==="place_of_worship"||c==="church"?"🛐":
    c==="hotel"||c==="hostel"||c==="guest_house"?"🏨":
    c==="attraction"||c==="museum"||c==="viewpoint"?"🏛":
    c==="park"||c==="garden"||c==="pitch"?"🌳":
    c==="parking"?"🅿":c==="bus_station"||c==="bus_stop"?"🚌":
    c==="police"?"🚔":c==="post_office"?"📮":"📍"
}

// ── Country code helper ──────────────────────────────────────────────────────
const COUNTRY_CODES: Record<string,string> = {
  "indonesia":"id","malaysia":"my","singapore":"sg","thailand":"th",
  "philippines":"ph","vietnam":"vn","myanmar":"mm","cambodia":"kh",
  "laos":"la","brunei":"bn","timor-leste":"tl","australia":"au",
  "japan":"jp","china":"cn","south korea":"kr","india":"in",
  "united states":"us","united kingdom":"gb","germany":"de",
  "france":"fr","netherlands":"nl","spain":"es","italy":"it",
}
async function getCountryCode(countryName: string): Promise<string> {
  const key = countryName.toLowerCase().trim()
  if (COUNTRY_CODES[key]) return COUNTRY_CODES[key]
  // Fallback: ambil 2 huruf pertama nama negara tidak selalu benar,
  // tapi Nominatim juga terima nama lengkap via &countrycodes= kalau huruf 2 char ISO
  // Coba fetch dari restcountries
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=cca2`)
    const d = await r.json()
    return d[0]?.cca2?.toLowerCase() ?? ""
  } catch { return "" }
}

// ── GPS HOOK ──────────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null)
  const [address, setAddress] = useState("Mendapatkan lokasi...")
  const [accuracy, setAccuracy] = useState<number|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const lastRef        = useRef<{lat:number;lng:number}|null>(null)
  const activeSearchRef = useRef(false) // true = user sedang search spesifik, block fetchNearby

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    // Jangan timpa hasil search spesifik user
    if (activeSearchRef.current) return
    if (lastRef.current) {
      const d = calcDist(lat,lng,lastRef.current.lat,lastRef.current.lng)
      if (parseFloat(d) < 50) return
    }
    lastRef.current = {lat,lng}
    setLoadingNearby(true)
    try {
      const q = `[out:json][timeout:15];(node(around:2000,${lat},${lng})[name][amenity];node(around:2000,${lat},${lng})[name][shop];node(around:2000,${lat},${lng})[name][tourism];node(around:2000,${lat},${lng})[name][leisure];);out body 40;`
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.elements?.length > 0) {
        setNearby(
          data.elements.filter((e:any)=>e.tags?.name)
            .map((e:any)=>({name:e.tags.name,dist:calcDist(lat,lng,e.lat,e.lon),
              category:e.tags.amenity||e.tags.shop||"tempat",lat:e.lat,lng:e.lon}))
            .sort((a:NearbyPlace,b:NearbyPlace)=>{
              const m=(d:string)=>d.endsWith("km")?parseFloat(d)*1000:parseFloat(d)
              return m(a.dist)-m(b.dist)
            }).slice(0,8)
        )
      }
    } catch { setNearby([]) }
    finally { setLoadingNearby(false) }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) { setError("GPS tidak didukung"); setLoading(false); return }
    const id = navigator.geolocation.watchPosition(async pos => {
      const {latitude:lat,longitude:lng,accuracy:acc} = pos.coords
      setCoords({lat,lng}); setAccuracy(Math.round(acc)); setLoading(false); setError(null)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`)
        const d = await r.json()
        const parts = [d.address?.road||d.address?.suburb||"",d.address?.suburb||"",d.address?.city||d.address?.town||""].filter(Boolean)
        setAddress(parts.join(", ")||d.display_name?.split(",").slice(0,3).join(",")||"Lokasi tidak diketahui")
      } catch { setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`) }
      fetchNearby(lat,lng)
    }, err=>{
      setLoading(false)
      setError(err.code===1?"Izin GPS ditolak":err.code===2?"Sinyal GPS lemah":"Timeout GPS")
    }, {enableHighAccuracy:true,maximumAge:5000,timeout:15000})
    return () => navigator.geolocation.clearWatch(id)
  }, [fetchNearby])

  const [destination, setDestination] = useState<NearbyPlace|null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const searchNearbyByQuery = useCallback(async (query: string, lat: number, lng: number) => {
    if (!query) return
    setSearchQuery(query)
    setLoadingNearby(true)
    activeSearchRef.current = true

    try {
      // ── 1. Parse query ───────────────────────────────────────────────────────
      const cleanQ = query.toLowerCase().trim()
        .replace(/^(arahkan ke|navigasi ke|cari|pergi ke|tuju|ke|tunjukkan|bawa ke|mau ke|cariin|find|go to|navigate to|search)\s+/i, "")
        .replace(/\s+(terdekat|deket|dekat|nearby|sekitar sini|di sini|sini|near me|closest)$/i, "")
        .trim()

      const CATEGORY_MAP: Array<[RegExp, string]> = [
        [/^(cafe|kopi|coffee|kedai kopi|warung kopi|kafe)$/,      '[amenity~"cafe|coffee_shop"]'],
        [/^(restoran|restaurant|makan|warung|rumah makan|food)$/,  '[amenity~"restaurant|fast_food|food_court|cafe"]'],
        [/^(masjid|mosque|mushola|surau|mesjid)$/,                '[amenity=place_of_worship][religion=muslim]'],
        [/^(gereja|church|kapel)$/,                               '[amenity=place_of_worship][religion=christian]'],
        [/^(pura|temple|vihara)$/,                                '[amenity=place_of_worship]'],
        [/^(rumah sakit|rs|hospital|klinik|rsud|rsu|rsia)$/,      '[amenity~"hospital|clinic"]'],
        [/^(apotek|apotik|pharmacy|farmasi)$/,                    '[amenity=pharmacy]'],
        [/^(puskesmas)$/,                                         '[amenity~"clinic|health"]'],
        [/^(spbu|pom bensin|bensin|bbm|pertamina|fuel|gas)$/,     '[amenity=fuel]'],
        [/^(bank)$/,                                              '[amenity=bank]'],
        [/^(atm)$/,                                               '[amenity=atm]'],
        [/^(hotel|penginapan|hostel|resort|villa|inn)$/,          '[tourism~"hotel|hostel|guest_house"]'],
        [/^(mall|plaza|pusat perbelanjaan)$/,                     '[shop~"mall|supermarket|department_store"]'],
        [/^(supermarket|hypermarket)$/,                           '[shop~"supermarket|hypermarket"]'],
        [/^(minimarket|alfamart|indomaret)$/,                     '[shop~"convenience|supermarket"]'],
        [/^(taman|park|alun.?alun)$/,                             '[leisure~"park|garden"]'],
        [/^(sekolah|sd|smp|sma|smk|school)$/,                    '[amenity~"school"]'],
        [/^(universitas|kampus|univ|university|college)$/,        '[amenity~"university|college"]'],
        [/^(polisi|kantor polisi|police)$/,                       '[amenity=police]'],
        [/^(kantor pos|post office)$/,                            '[amenity=post_office]'],
        [/^(bandara|airport)$/,                                   '[aeroway=terminal]'],
        [/^(terminal|terminal bus|bus station)$/,                 '[amenity~"bus_station|bus_stop"]'],
        [/^(stasiun|train station|kereta)$/,                      '[railway~"station|halt"]'],
        [/^(parkir|parking)$/,                                    '[amenity=parking]'],
        [/^(gym|fitness|olahraga)$/,                              '[leisure~"fitness_centre|sports_centre"]'],
        [/^(salon|barbershop|pangkas)$/,                          '[shop~"hairdresser|beauty"]'],
        [/^(pasar|market)$/,                                      '[amenity~"marketplace|market"]'],
      ]

      let osmFilter = ""
      for (const [pattern, filter] of CATEGORY_MAP) {
        if (pattern.test(cleanQ)) { osmFilter = filter; break }
      }
      const specificName = osmFilter ? "" : (cleanQ || query)

      // ── 2. Reverse geocode untuk dapat country_code ─────────────────────────
      let userCountryCode = "id"
      try {
        const rg = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
          { signal: AbortSignal.timeout(5000) }
        )
        const rgd = await rg.json()
        userCountryCode = rgd.address?.country_code || "id"
      } catch {}

      // ── 3. Overpass — pakai node saja (cepat, tidak timeout) ────────────────
      const overpassSearch = async (radiusM: number): Promise<NearbyPlace[]> => {
        if (!osmFilter) return []
        // node saja — jauh lebih ringan dari node+way
        const oq = `[out:json][timeout:8];(node(around:${radiusM},${lat},${lng})${osmFilter}[name];);out body 15;`
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 7000)
        try {
          const res  = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(oq)}`,
            { signal: ctrl.signal }
          )
          if (!res.ok) return []
          const data = await res.json()
          return (data.elements ?? [])
            .filter((e: any) => e.tags?.name && e.lat && e.lon)
            .map((e: any) => ({
              name:     e.tags.name,
              dist:     calcDist(lat, lng, e.lat, e.lon),
              category: e.tags.amenity || e.tags.tourism || e.tags.leisure || e.tags.shop || "tempat",
              lat:      e.lat,
              lng:      e.lon,
            }))
            .sort((a: NearbyPlace, b: NearbyPlace) => {
              const m = (d: string) => d.endsWith("km") ? parseFloat(d)*1000 : parseFloat(d)
              return m(a.dist) - m(b.dist)
            })
            .slice(0, 8)
        } catch { return [] }
        finally { clearTimeout(timer) }
      }

      // ── 4. Nominatim dengan viewbox (kotak area sekitar GPS) ────────────────
      // viewbox memaksa hasil berada di dalam kotak koordinat — jauh lebih presisi
      const nominatimSearch = async (boxKm: number | null, countryOnly = false): Promise<NearbyPlace[]> => {
        const term = specificName || cleanQ || query
        const params = new URLSearchParams({
          q: term,
          format: "json",
          limit: "10",
          addressdetails: "1",
          "accept-language": "id,en",
          countrycodes: userCountryCode,
        })

        if (boxKm !== null) {
          // viewbox = [minLon, minLat, maxLon, maxLat]
          // 1 derajat lat ≈ 111km, 1 derajat lon ≈ 111km * cos(lat)
          const dLat = boxKm / 111
          const dLon = boxKm / (111 * Math.cos(lat * Math.PI / 180))
          const viewbox = `${lng-dLon},${lat-dLat},${lng+dLon},${lat+dLat}`
          params.set("viewbox", viewbox)
          params.set("bounded", "1") // WAJIB: hasil harus di dalam viewbox
        }

        if (countryOnly) {
          params.delete("bounded")   // kalau country, jangan bounded
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { signal: AbortSignal.timeout(8000) }
        )
        const data: any[] = await res.json()
        return data
          .filter(e => e.lat && e.lon)
          .map(e => ({
            name:     e.display_name.split(",").slice(0, 2).join(", "),
            dist:     calcDist(lat, lng, parseFloat(e.lat), parseFloat(e.lon)),
            category: e.type || e.class || "tempat",
            lat:      parseFloat(e.lat),
            lng:      parseFloat(e.lon),
          }))
          .sort((a: NearbyPlace, b: NearbyPlace) => {
            const m = (d: string) => d.endsWith("km") ? parseFloat(d)*1000 : parseFloat(d)
            return m(a.dist) - m(b.dist)
          })
          .slice(0, 8)
      }

      // ── 5. Pipeline ──────────────────────────────────────────────────────────
      // Kategori generik: Overpass radius kecil → besar → Nominatim viewbox kota → kota besar
      // Nama spesifik:    Nominatim viewbox kecil → sedang → se-negara → global
      const PIPELINE = osmFilter
        ? [
            { label: `${query} (2km)`,   fn: () => overpassSearch(2_000)              },
            { label: `${query} (5km)`,   fn: () => overpassSearch(5_000)              },
            { label: `${query} (10km)`,  fn: () => overpassSearch(10_000)             },
            { label: `${query} (25km)`,  fn: () => overpassSearch(25_000)             },
            { label: `${query} (kota)`,  fn: () => nominatimSearch(30, false)         },
            { label: `${query} (negara)`,fn: () => nominatimSearch(null, true)        },
          ]
        : [
            { label: `${query} (10km)`,  fn: () => nominatimSearch(10, false)         },
            { label: `${query} (30km)`,  fn: () => nominatimSearch(30, false)         },
            { label: `${query} (100km)`, fn: () => nominatimSearch(100, false)        },
            { label: `${query} (negara)`,fn: () => nominatimSearch(null, true)        },
            { label: `${query} (global)`,fn: () => nominatimSearch(null, false)       },
          ]

      let results: NearbyPlace[] = []
      for (const step of PIPELINE) {
        setSearchQuery(step.label)
        try {
          results = await step.fn()
          if (results.length > 0) break
        } catch { continue }
      }

      // ── 6. Set hasil ─────────────────────────────────────────────────────────
      setSearchQuery(query)
      setNearby(results)
      if (results.length > 0) {
        if (specificName) {
          const nl = specificName.toLowerCase().split(" ")[0]
          const best = results.find(r => r.name.toLowerCase().includes(nl)) ?? results[0]
          setDestination(best)
        } else {
          setDestination(results[0])
        }
      } else {
        setDestination(null)
        activeSearchRef.current = false
        setSearchQuery(`"${query}" tidak ditemukan`)
      }

    } catch { setNearby([]); setDestination(null); activeSearchRef.current = false }
    finally { setLoadingNearby(false) }
  }, [])


  return {coords,address,accuracy,error,loading,nearby,loadingNearby,destination,setDestination,searchQuery,setSearchQuery,searchNearbyByQuery,activeSearchRef}
}

// ── BATTERY HOOK ─────────────────────────────────────────────────────────────
function useBattery() {
  const [level,    setLevel]    = useState<number|null>(null)
  const [charging, setCharging] = useState(false)

  useEffect(() => {
    if (typeof navigator === "undefined") return
    ;(navigator as any).getBattery?.().then((bat: any) => {
      setLevel(Math.round(bat.level * 100))
      setCharging(bat.charging)
      bat.addEventListener("levelchange",    () => setLevel(Math.round(bat.level * 100)))
      bat.addEventListener("chargingchange", () => setCharging(bat.charging))
    })
  }, [])

  return { level, charging }
}

// ── REAL NOTIFS HOOK ──────────────────────────────────────────────────────────
function useRealNotifs(coords: {lat:number;lng:number}|null) {
  const [notifs, setNotifs] = useState<RealNotif[]>([])
  const addNotif = useCallback((n: Omit<RealNotif,"id"|"time">) => {
    const id = Date.now().toString()
    const time = new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
    setNotifs(prev => [{...n,id,time},...prev.slice(0,7)])
  }, [])

  useEffect(() => {
    const onOnline  = () => addNotif({type:"net",icon:"📶",msg:"Koneksi internet tersambung kembali"})
    const onOffline = () => addNotif({type:"net",icon:"⚠",msg:"Koneksi internet terputus"})
    window.addEventListener("online",onOnline)
    window.addEventListener("offline",onOffline)
    const onVisible = () => { if(document.visibilityState==="visible") addNotif({type:"app",icon:"◉",msg:"V-Optics aktif kembali"}) }
    document.addEventListener("visibilitychange",onVisible)
    ;(navigator as any).getBattery?.().then((bat: any) => {
      const checkBat = () => {
        const pct = Math.round(bat.level*100)
        if (pct<=20&&!bat.charging) addNotif({type:"battery",icon:"🔋",msg:`Baterai ${pct}% — segera cas perangkat`})
        else if (bat.charging&&pct<100) addNotif({type:"battery",icon:"⚡",msg:`Mengisi daya — ${pct}%`})
      }
      bat.addEventListener("levelchange",checkBat)
      bat.addEventListener("chargingchange",checkBat)
      checkBat()
    })
    const now = new Date()
    const msToNextHour = (60-now.getMinutes())*60000 - now.getSeconds()*1000
    const hourTimer = setTimeout(() => {
      addNotif({type:"time",icon:"🕐",msg:`${new Date().getHours()}:00 — Pengingat waktu dari V-Optics`})
    }, msToNextHour)
    addNotif({type:"app",icon:"◈",msg:"V-Optics HUD aktif — semua sistem berjalan"})
    return () => {
      window.removeEventListener("online",onOnline)
      window.removeEventListener("offline",onOffline)
      document.removeEventListener("visibilitychange",onVisible)
      clearTimeout(hourTimer)
    }
  }, [addNotif])

  useEffect(() => {
    if (!coords) return
    addNotif({type:"gps",icon:"📍",msg:`Lokasi diperbarui: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`})
  }, [coords?.lat.toFixed(3), coords?.lng.toFixed(3)])

  return notifs
}

// ── TRANSLATE PANEL ───────────────────────────────────────────────────────────

// Semua bahasa yang didukung
const SUPPORTED_LANGS = [
  { code: "id", label: "Indonesia",   flag: "🇮🇩", tesseract: "ind" },
  { code: "en", label: "English",     flag: "🇬🇧", tesseract: "eng" },
  { code: "ja", label: "日本語",       flag: "🇯🇵", tesseract: "jpn" },
  { code: "zh", label: "中文",         flag: "🇨🇳", tesseract: "chi_sim" },
  { code: "ko", label: "한국어",       flag: "🇰🇷", tesseract: "kor" },
  { code: "ar", label: "العربية",     flag: "🇸🇦", tesseract: "ara" },
  { code: "fr", label: "Français",    flag: "🇫🇷", tesseract: "fra" },
  { code: "de", label: "Deutsch",     flag: "🇩🇪", tesseract: "deu" },
  { code: "es", label: "Español",     flag: "🇪🇸", tesseract: "spa" },
  { code: "ru", label: "Русский",     flag: "🇷🇺", tesseract: "rus" },
]

// Deteksi bahasa dari karakter
function detectLang(text: string): string {
  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) return "ja"
  if (/[\u4e00-\u9fff]/.test(text)) return "zh"
  if (/[\uac00-\ud7af]/.test(text)) return "ko"
  if (/[\u0600-\u06ff]/.test(text)) return "ar"
  if (/[\u0400-\u04ff]/.test(text)) return "ru"
  // Heuristic ID vs EN
  const idWords = ["dan","yang","di","ke","dari","ini","itu","dengan","untuk","pada",
    "adalah","tidak","saya","kami","akan","sudah","bisa","juga","ada","atau","jika","karena"]
  const words = text.toLowerCase().split(/\s+/)
  const idScore = words.filter(w => idWords.includes(w)).length
  if (idScore >= 2) return "id"
  // Cek karakter Latin aksen Eropa
  if (/[àâçéèêëîïôùûüæœ]/i.test(text)) return "fr"
  if (/[äöüß]/i.test(text)) return "de"
  if (/[áéíóúüñ¿¡]/i.test(text)) return "es"
  return "en"
}

// Preprocessing canvas untuk akurasi OCR
function preprocessCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const w = canvas.width, h = canvas.height
  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data

  // Step 1: Grayscale
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114
    d[i] = d[i+1] = d[i+2] = gray
  }

  // Step 2: Hitung rata-rata untuk adaptive threshold
  let sum = 0
  for (let i = 0; i < d.length; i += 4) sum += d[i]
  const avg = sum / (w * h)

  // Step 3: Adaptive contrast + binarisasi lunak
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i]
    // Boost teks gelap di background terang, atau sebaliknya
    const enhanced = v < avg
      ? Math.max(0,   v * 0.6)        // gelap → lebih gelap
      : Math.min(255, v * 1.25 + 20)  // terang → lebih terang
    d[i] = d[i+1] = d[i+2] = enhanced
  }

  ctx.putImageData(imgData, 0, 0)

  // Step 4: Scale up 2x untuk Tesseract lebih akurat
  const scaled = document.createElement("canvas")
  scaled.width = w * 2; scaled.height = h * 2
  const sCtx = scaled.getContext("2d")!
  sCtx.imageSmoothingEnabled = false
  sCtx.drawImage(canvas, 0, 0, w * 2, h * 2)
  return scaled
}

// Terjemahkan dengan 3 lapis fallback
async function translateText(
  text: string,
  fromLang: string,
  toLang: string,
  setStatus: (s: string) => void
): Promise<string> {
  if (fromLang === toLang) return text
  const short = text.slice(0, 500)

  // Coba 1: MyMemory dengan langpair eksplisit
  try {
    setStatus(`Menerjemahkan ${fromLang.toUpperCase()} → ${toLang.toUpperCase()} (MyMemory)...`)
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(short)}&langpair=${fromLang}|${toLang}`
    )
    const d = await r.json()
    const res = d.responseData?.translatedText ?? ""
    if (d.responseStatus === 200 && res && res !== text && !res.includes("MYMEMORY WARNING")) {
      return res
    }
  } catch {}

  // Coba 2: Google Translate non-official
  try {
    setStatus(`Menerjemahkan (Google Translate)...`)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(short)}`
    const r = await fetch(url)
    if (r.ok) {
      const d = await r.json()
      const result = (d[0] as any[])?.map((chunk: any) => chunk?.[0] ?? "").filter(Boolean).join("") ?? ""
      if (result && result !== text) return result
    }
  } catch {}

  // Coba 3: LibreTranslate
  try {
    setStatus(`Menerjemahkan (LibreTranslate)...`)
    const r = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: short, source: fromLang, target: toLang, format: "text" })
    })
    if (r.ok) {
      const d = await r.json()
      if (d.translatedText && d.translatedText !== text) return d.translatedText
    }
  } catch {}

  throw new Error("Semua API terjemahan gagal")
}

function TranslatePanel({accent,accentDim,accentFaint,targetLang}:{
  accent:string; accentDim:string; accentFaint:string; targetLang:string
}) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream|null>(null)

  // State bahasa — source & target bisa diswitch
  const [srcLang, setSrcLang] = useState("auto")          // "auto" = deteksi otomatis
  const [dstLang, setDstLang] = useState(targetLang === "id" ? "id" : "en")

  const [cameraOn,    setCameraOn]    = useState(false)
  const [scanning,    setScanning]    = useState(false)
  const [capturedText,setCapturedText]= useState("")
  const [translated,  setTranslated]  = useState("")
  const [detectedLang,setDetectedLang]= useState("")
  const [status,      setStatus]      = useState("")
  const [manualText,  setManualText]  = useState("")
  const [showManual,  setShowManual]  = useState(false)
  const [showLangPicker, setShowLangPicker] = useState<"src"|"dst"|null>(null)

  // Sync dstLang & status dengan setting bahasa interface
  const isEN = targetLang === "en"
  useEffect(() => { setDstLang(targetLang === "id" ? "id" : "en") }, [targetLang])
  useEffect(() => {
    if (!cameraOn) setStatus(isEN ? "Allow camera to start" : "Izinkan kamera untuk memulai")
  }, [targetLang])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ideal:1920}, height:{ideal:1080} }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); setShowManual(false)
      setStatus(targetLang==="en" ? "Camera active — point at text, press SCAN" : "Kamera aktif — arahkan ke teks, tekan SCAN")
    } catch { setStatus(targetLang==="en" ? "⚠ Camera access denied" : "⚠ Akses kamera ditolak") }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setStatus(targetLang==="en" ? "Camera off" : "Kamera dimatikan")
  }

  // Swap src ↔ dst
  const swapLangs = () => {
    if (srcLang === "auto") return
    const prev = dstLang
    setDstLang(srcLang)
    setSrcLang(prev)
    // Swap hasil juga kalau sudah ada terjemahan
    if (translated) {
      const prevCaptured = capturedText
      setCapturedText(translated)
      setTranslated(prevCaptured)
    }
  }

  // Proses teks hasil OCR atau manual
  const processText = async (rawText: string) => {
    const cleaned = rawText
      .replace(/\r?\n/g, " ")
      .replace(/[^\x20-\x7E\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()

    if (!cleaned || cleaned.length < 3) {
      setStatus(targetLang==="en" ? "⚠ Text too short. Try better lighting." : "⚠ Teks terlalu pendek. Coba lagi dengan pencahayaan lebih baik.")
      return
    }

    setCapturedText(cleaned.slice(0, 400))
    setTranslated("")

    const from = srcLang === "auto" ? detectLang(cleaned) : srcLang
    setDetectedLang(from)
    const to = dstLang

    if (from === to) {
      setTranslated(cleaned)
      setStatus(targetLang==="en" ? `✓ Text already in ${SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to}` : `✓ Teks sudah dalam bahasa ${SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to}`)
      return
    }

    try {
      const result = await translateText(cleaned, from, to, setStatus)
      setTranslated(result)
      const fromLabel = SUPPORTED_LANGS.find(l => l.code === from)?.label ?? from.toUpperCase()
      const toLabel   = SUPPORTED_LANGS.find(l => l.code === to)?.label   ?? to.toUpperCase()
      setStatus(`✓ ${fromLabel} → ${toLabel}`)
    } catch {
      setStatus(targetLang==="en" ? "⚠ Translation failed. Check internet." : "⚠ Terjemahan gagal. Cek koneksi internet.")
    }
  }

  const scanAndTranslate = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true); setTranslated(""); setStatus(targetLang==="en" ? "Capturing frame..." : "Mengambil frame kamera...")

    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")!
    canvas.width  = videoRef.current.videoWidth  || 1280
    canvas.height = videoRef.current.videoHeight || 720
    ctx.drawImage(videoRef.current, 0, 0)

    // Untuk Arab/China/Korea/Jepang → pakai AI Vision (jauh lebih akurat)
    const useVision = ["ar","zh","ja","ko"].includes(srcLang) ||
      (srcLang === "auto") // auto juga pakai vision supaya lebih akurat

    if (useVision) {
      // Preprocessing ringan saja (tidak perlu grayscale untuk Vision API)
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1]
      setStatus(targetLang==="en" ? "Sending to AI Vision..." : "Mengirim ke AI Vision...")

      try {
        const to = dstLang
        const toLangName = SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to

        const prompt = targetLang === "en"
          ? `You are an OCR and translation engine for V-Optics smart glasses. In this image:
1. Extract ALL text you can see (preserve original script/characters exactly)
2. Detect the language of the text
3. Translate the extracted text to ${toLangName}

Respond ONLY in this exact JSON format (no markdown, no extra text):
{"original":"<extracted text>","lang":"<detected language>","translated":"<translation to ${toLangName}>"}`
          : `Kamu adalah mesin OCR dan terjemahan untuk kacamata pintar V-Optics. Dari gambar ini:
1. Ekstrak SEMUA teks yang terlihat (pertahankan karakter asli persis)
2. Deteksi bahasa teks tersebut
3. Terjemahkan ke ${toLangName}

Balas HANYA dalam format JSON ini (tanpa markdown, tanpa teks lain):
{"original":"<teks yang diekstrak>","lang":"<bahasa terdeteksi>","translated":"<terjemahan ke ${toLangName}>"}`

        const res = await fetch("/api/claude-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, prompt, mode: "ocr" })
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const raw = data.result ?? ""

        // Parse JSON response
        try {
          const cleaned = raw.replace(/```json|```/g, "").trim()
          const parsed = JSON.parse(cleaned)
          if (parsed.original && parsed.translated) {
            setCapturedText(parsed.original)
            setTranslated(parsed.translated)
            const detLang = parsed.lang ?? "auto"
            setDetectedLang(detLang.toLowerCase().slice(0,2))
            const fromLabel = parsed.lang ?? detLang
            const toLabel = SUPPORTED_LANGS.find(l=>l.code===to)?.label ?? to
            setStatus(`✓ ${fromLabel} → ${toLabel}`)
          } else {
            throw new Error("Invalid JSON structure")
          }
        } catch {
          // Claude tidak return JSON — coba parse manual
          if (raw.length > 5) {
            setCapturedText(raw)
            setTranslated(raw)
            setStatus(targetLang==="en" ? "✓ Vision response received" : "✓ Respons Vision diterima")
          } else {
            setStatus(targetLang==="en" ? "⚠ Could not read text from image" : "⚠ Tidak ada teks terbaca dari gambar")
          }
        }
      } catch (e: any) {
        // Fallback ke Tesseract kalau Vision gagal
        setStatus(targetLang==="en" ? "Vision failed, trying Tesseract..." : "Vision gagal, mencoba Tesseract...")
        await runTesseract(canvas)
      }
    } else {
      // Latin script (EN/ID/FR/DE/ES/RU) → Tesseract sudah cukup akurat
      const processedCanvas = preprocessCanvas(canvas, ctx)
      await runTesseract(processedCanvas)
    }

    setScanning(false)
  }

  const runTesseract = async (canvasEl: HTMLCanvasElement) => {
    try {
      setStatus(targetLang==="en" ? "Loading Tesseract OCR..." : "Memuat Tesseract OCR...")
      const Tesseract = await import("tesseract.js")

      const ocrLangs = srcLang === "auto" ? "eng+ind+fra+deu+spa+rus"
        : (() => {
            const found = SUPPORTED_LANGS.find(l => l.code === srcLang)
            return found ? `${found.tesseract}+eng` : "eng"
          })()

      setStatus(`OCR: ${ocrLangs.split("+").length} langs...`)

      const { data: { text, confidence, words } } = await (Tesseract.recognize as any)(
        canvasEl, ocrLangs,
        { logger: (m: any) => { if (m.status==="recognizing text") setStatus(`OCR ${Math.round(m.progress*100)}%`) } }
      )

      const filteredWords = words
        ? (words as any[]).filter((w:any) => w.confidence > 40).map((w:any) => w.text).join(" ")
        : text

      if (!filteredWords.trim() || confidence < 15) {
        setStatus(targetLang==="en"
          ? "⚠ Text unreadable. Tips: ✓ Focus ✓ Good lighting ✓ Text not tilted"
          : "⚠ Teks tidak terbaca. Tips: ✓ Fokus ✓ Cahaya cukup ✓ Tidak miring")
        return
      }

      setStatus(targetLang==="en"
        ? `OCR done (${Math.round(confidence)}%) — translating...`
        : `OCR selesai (${Math.round(confidence)}%) — menerjemahkan...`)
      await processText(filteredWords)
    } catch (e: any) {
      setStatus("⚠ " + (e?.message?.includes("tesseract") ? "Run: npm install tesseract.js" : (e?.message ?? "OCR error")))
    }
  }
  const translateManual = async () => {
    if (!manualText.trim()) return
    setScanning(true); setTranslated("")
    setStatus(targetLang==="en"?"Translating...":"Menerjemahkan...")
    await processText(manualText)
    setScanning(false)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const srcInfo = srcLang === "auto"
    ? { label: "Auto Detect", flag: "🔍" }
    : SUPPORTED_LANGS.find(l => l.code === srcLang) ?? { label: srcLang, flag: "🌐" }
  const dstInfo = SUPPORTED_LANGS.find(l => l.code === dstLang) ?? { label: dstLang, flag: "🌐" }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:7,height:"100%"}}>

      {/* ── Language selector bar ── */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",
        border:`1px solid ${accentDim}`,borderRadius:6,background:`${accent}08`}}>

        {/* Source lang */}
        <div onClick={()=>setShowLangPicker(p=>p==="src"?null:"src")}
          style={{flex:1,display:"flex",alignItems:"center",gap:5,cursor:"pointer",
            padding:"3px 6px",borderRadius:4,
            background:showLangPicker==="src"?`${accent}20`:"transparent",
            border:`1px solid ${showLangPicker==="src"?accent:"transparent"}`}}>
          <span style={{fontSize:13}}>{srcInfo.flag}</span>
          <div>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>{targetLang==="en"?"FROM":"DARI"}</div>
            <div style={{fontSize:10,color:accent}}>{srcInfo.label}</div>
          </div>
          <span style={{fontSize:8,color:accentDim,marginLeft:"auto"}}>▾</span>
        </div>

        {/* Swap button */}
        <button onClick={swapLangs}
          style={{padding:"5px 8px",background:accentDim==="auto"?`${accent}22`:accentDim,
            border:`1px solid ${accentDim}`,borderRadius:4,color:accent,
            cursor:srcLang==="auto"?"not-allowed":"pointer",fontSize:13,
            opacity:srcLang==="auto"?0.4:1}}>
          ⇄
        </button>

        {/* Dest lang */}
        <div onClick={()=>setShowLangPicker(p=>p==="dst"?null:"dst")}
          style={{flex:1,display:"flex",alignItems:"center",gap:5,cursor:"pointer",
            padding:"3px 6px",borderRadius:4,
            background:showLangPicker==="dst"?`${accent}20`:"transparent",
            border:`1px solid ${showLangPicker==="dst"?accent:"transparent"}`}}>
          <span style={{fontSize:13}}>{dstInfo.flag}</span>
          <div>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>{targetLang==="en"?"TO":"KE"}</div>
            <div style={{fontSize:10,color:accent}}>{dstInfo.label}</div>
          </div>
          <span style={{fontSize:8,color:accentDim,marginLeft:"auto"}}>▾</span>
        </div>
      </div>

      {/* ── Language picker dropdown ── */}
      {showLangPicker && (
        <div style={{border:`1px solid ${accentDim}`,borderRadius:6,background:"#050e1c",
          padding:6,maxHeight:120,overflowY:"auto"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {/* Auto detect hanya untuk source */}
            {showLangPicker === "src" && (
              <div onClick={()=>{ setSrcLang("auto"); setShowLangPicker(null) }}
                style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",
                  borderRadius:4,cursor:"pointer",fontSize:9,
                  background:srcLang==="auto"?`${accent}25`:`${accent}08`,
                  border:`1px solid ${srcLang==="auto"?accent:accentDim}`,
                  color:srcLang==="auto"?accent:"#89a"}}>
                🔍 Auto
              </div>
            )}
            {SUPPORTED_LANGS.map(lang => {
              const isActive = showLangPicker==="src" ? srcLang===lang.code : dstLang===lang.code
              return (
                <div key={lang.code}
                  onClick={()=>{
                    if (showLangPicker==="src") setSrcLang(lang.code)
                    else setDstLang(lang.code)
                    setShowLangPicker(null)
                  }}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",
                    borderRadius:4,cursor:"pointer",fontSize:9,
                    background:isActive?`${accent}25`:`${accent}08`,
                    border:`1px solid ${isActive?accent:accentDim}`,
                    color:isActive?accent:"#89a"}}>
                  {lang.flag} {lang.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Video / Manual input ── */}
      {!showManual ? (
        <div style={{flex:1,position:"relative",borderRadius:6,overflow:"hidden",
          border:`1px solid ${accentDim}`,background:"#000",minHeight:0}}>
          <video ref={videoRef} muted playsInline
            style={{width:"100%",height:"100%",objectFit:"cover",display:cameraOn?"block":"none"}}/>
          {!cameraOn && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{fontSize:24}}>📷</span>
              <div style={{color:accentDim,fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 12px"}}>
                {status}
              </div>
            </div>
          )}
          {/* Corner brackets */}
          {cameraOn && ([[0,0],[1,0],[0,1],[1,1]] as const).map(([x,y],i) => (
            <div key={i} style={{position:"absolute",width:12,height:12,zIndex:2,
              top:y?"auto":6,bottom:y?6:"auto",left:x?"auto":6,right:x?6:"auto",
              borderTop:!y?`2px solid ${accent}`:"none",
              borderBottom:y?`2px solid ${accent}`:"none",
              borderLeft:!x?`2px solid ${accent}`:"none",
              borderRight:x?`2px solid ${accent}`:"none"}}/>
          ))}
          {/* Scan beam animasi */}
          {scanning && (
            <div style={{position:"absolute",left:0,right:0,top:0,height:"100%",
              background:`linear-gradient(180deg,transparent 0%,${accent}18 49%,${accent}30 50%,${accent}18 51%,transparent 100%)`,
              animation:"scanBeam 1.8s ease-in-out infinite"}}/>
          )}
          <canvas ref={canvasRef} style={{display:"none"}}/>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>{targetLang==="en"?"MANUAL TEXT INPUT":"INPUT TEKS MANUAL"}</div>
          <textarea value={manualText} onChange={e=>setManualText(e.target.value)}
            placeholder={targetLang==="en"?"Type or paste text here...":"Ketik atau paste teks di sini..."}
            style={{flex:1,background:"rgba(0,0,0,0.5)",border:`1px solid ${accentDim}`,
              borderRadius:6,color:"#cde",fontSize:11,padding:"8px 10px",
              fontFamily:"monospace",resize:"none",outline:"none",lineHeight:1.6}}/>
          <div style={{fontSize:8,color:accentDim,textAlign:"right"}}>{manualText.length}/500</div>
        </div>
      )}

      {/* ── Status ── */}
      <div style={{fontSize:9,letterSpacing:1,textAlign:"center",minHeight:13,
        color:scanning?accent:status.startsWith("✓")?`#0f8`:status.startsWith("⚠")?`#f80`:accentDim}}>
        {status}
      </div>

      {/* ── Hasil terjemahan ── */}
      {translated && (
        <div style={{padding:"8px 10px",border:`1px solid ${accentDim}`,
          borderRadius:6,background:`${accent}08`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>
              ASLI
              {detectedLang && (
                <span style={{marginLeft:4,color:accent}}>
                  {(SUPPORTED_LANGS.find(l=>l.code===detectedLang)?.flag??"")} {detectedLang.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{fontSize:8,color:accentDim,letterSpacing:1}}>
              TERJEMAHAN
              <span style={{marginLeft:4,color:accent}}>
                {dstInfo.flag} {dstLang.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{flex:1,fontSize:9,color:"rgba(255,255,255,0.4)",
              lineHeight:1.5,fontStyle:"italic",borderLeft:`2px solid ${accentDim}`,paddingLeft:6}}>
              {capturedText.slice(0,150)}{capturedText.length>150?"...":""}
            </div>
            <div style={{fontSize:8,color:accentDim,alignSelf:"center"}}>→</div>
            <div style={{flex:1,fontSize:12,color:accent,fontWeight:"bold",
              textShadow:`0 0 8px ${accent}`,lineHeight:1.5}}>
              {translated}
            </div>
          </div>
        </div>
      )}

      {/* ── Tombol ── */}
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>{ setShowManual(v=>!v); if(cameraOn) stopCamera() }}
          style={{padding:"6px 8px",fontFamily:"monospace",fontSize:8,letterSpacing:1,
            background:showManual?`${accent}20`:accentDim,
            border:`1px solid ${showManual?accent:accentDim}`,
            color:showManual?accent:"#89a",borderRadius:4,cursor:"pointer"}}>
          {showManual?"📷":"⌨"}
        </button>

        {showManual ? (
          <button onClick={translateManual} disabled={scanning||!manualText.trim()}
            style={{flex:1,padding:"6px",fontFamily:"monospace",fontSize:9,letterSpacing:1,
              background:scanning?`${accent}11`:accentDim,
              border:`1px solid ${scanning||!manualText.trim()?accentDim:accent}`,
              color:scanning||!manualText.trim()?"#456":accent,
              borderRadius:4,cursor:"pointer"}}>
            {scanning?(targetLang==="en"?"⏳ TRANSLATING...":"⏳ MENERJEMAHKAN..."):(targetLang==="en"?"◆ TRANSLATE":"◆ TERJEMAHKAN")}
          </button>
        ) : !cameraOn ? (
          <button onClick={startCamera}
            style={{flex:1,padding:"6px",fontFamily:"monospace",fontSize:9,letterSpacing:1,
              background:`${accent}15`,border:`1px solid ${accentDim}`,
              color:accent,borderRadius:4,cursor:"pointer"}}>
            {targetLang==="en"?"📷 ENABLE CAMERA":"📷 AKTIFKAN KAMERA"}
          </button>
        ) : (
          <>
            <button onClick={scanAndTranslate} disabled={scanning}
              style={{flex:2,padding:"6px",fontFamily:"monospace",fontSize:9,letterSpacing:1,
                background:scanning?`${accent}11`:`${accent}15`,
                border:`1px solid ${scanning?accentDim:accent}`,
                color:scanning?accentDim:accent,borderRadius:4,
                cursor:scanning?"not-allowed":"pointer"}}>
              {scanning?(targetLang==="en"?"⏳ SCANNING...":"⏳ MEMINDAI..."):(targetLang==="en"?"◆ SCAN & TRANSLATE":"◆ SCAN & TERJEMAH")}
            </button>
            <button onClick={stopCamera}
              style={{padding:"6px 8px",fontFamily:"monospace",fontSize:9,
                background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.3)",
                color:"#f66",borderRadius:4,cursor:"pointer"}}>
              STOP
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── AI PANEL ──────────────────────────────────────────────────────────────────
function AIPanel({accent,accentDim,accentFaint,lang}:{accent:string;accentDim:string;accentFaint:string;lang:string}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiText, setAiText] = useState("")
  const [typedText, setTypedText] = useState("")
  const [status, setStatus] = useState("")
  const streamRef = useRef<MediaStream|null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}})
      streamRef.current=stream
      if (videoRef.current) { videoRef.current.srcObject=stream; videoRef.current.play() }
      setCameraOn(true); setStatus(lang==="en"?"Camera active. Press Analyze.":"Kamera aktif. Tekan Analisis.")
    } catch { setStatus("⚠ "+(lang==="en"?"Camera access denied":"Akses kamera ditolak")) }
  }
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop())
    setCameraOn(false); setAiText(""); setTypedText(""); setStatus("")
  }
  useEffect(()=>{
    if (!aiText) { setTypedText(""); return }
    let i=0; setTypedText("")
    const iv=setInterval(()=>{ setTypedText(aiText.slice(0,i+1)); i++; if(i>=aiText.length) clearInterval(iv) },20)
    return ()=>clearInterval(iv)
  },[aiText])
  const analyzeFrame = async () => {
    if (!videoRef.current||!canvasRef.current) return
    setAnalyzing(true); setStatus(lang==="en"?"Capturing frame...":"Mengambil gambar...")
    const canvas=canvasRef.current; const ctx=canvas.getContext("2d")!
    canvas.width=videoRef.current.videoWidth||640; canvas.height=videoRef.current.videoHeight||480
    ctx.drawImage(videoRef.current,0,0)
    const base64=canvas.toDataURL("image/jpeg",0.6).split(",")[1]
    setStatus(lang==="en"?"Sending to AI...":"Mengirim ke AI...")
    try {
      const prompt=lang==="en"
        ?"You are V-Optics AI assistant in smart glasses. Analyze this camera frame: 1) What you see 2) Important info for the wearer 3) Safety concerns. Max 3 sentences."
        :"Kamu adalah asisten AI V-Optics di kacamata pintar. Analisis frame kamera: 1) Apa yang terlihat 2) Info penting untuk pengguna 3) Potensi bahaya. Maksimal 3 kalimat."
      const res=await fetch("/api/claude-vision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:base64,prompt})})
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data=await res.json()
      setAiText(data.result||(lang==="en"?"No response.":"Tidak ada respons."))
      setStatus(lang==="en"?"Analysis complete":"Analisis selesai")
    } catch {
      setStatus("⚠ API error"); setAiText(lang==="en"?"Check /api/claude-vision route.":"Cek route /api/claude-vision.")
    }
    setAnalyzing(false)
  }
  useEffect(()=>()=>{ streamRef.current?.getTracks().forEach(t=>t.stop()) },[])
  const quickCmds=lang==="en"?["What is around me?","Is it safe here?","Read this text","Describe the scene"]:["Apa yang ada di sekitarku?","Apakah ini aman?","Baca teks ini","Deskripsikan pemandangan"]

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8,height:"100%"}}>
      <div style={{flex:1,position:"relative",borderRadius:6,overflow:"hidden",border:`1px solid ${accentDim}`,background:"#000",minHeight:0}}>
        <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",display:cameraOn?"block":"none"}} muted playsInline/>
        {!cameraOn&&(<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}><div style={{width:40,height:40,borderRadius:"50%",border:`2px solid ${accentDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,animation:"orbPulse 2s ease-in-out infinite",color:accent}}>⬡</div><div style={{color:accentDim,fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 8px"}}>{lang==="en"?"Enable camera for AI vision":"Aktifkan kamera untuk analisis AI"}</div></div>)}
        {analyzing&&(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:accent,fontSize:9,letterSpacing:2,textAlign:"center"}}><div style={{width:24,height:24,border:`2px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 8px"}}/>{lang==="en"?"ANALYZING...":"MENGANALISIS..."}</div></div>)}
        <canvas ref={canvasRef} style={{display:"none"}}/>
      </div>
      {(typedText||status)&&(<div style={{padding:"8px 10px",border:`1px solid ${accentDim}`,borderRadius:6,background:accentFaint}}>{status&&<div style={{fontSize:8,color:accentDim,letterSpacing:1,marginBottom:4}}>{status}</div>}{typedText&&<div style={{fontSize:10,color:accent,lineHeight:1.6}}><span style={{color:accentDim,marginRight:6}}>AI&gt;</span>{typedText}{analyzing&&<span style={{animation:"blink 0.8s infinite"}}>▌</span>}</div>}</div>)}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{quickCmds.map(cmd=>(<div key={cmd} onClick={()=>cameraOn&&analyzeFrame()} style={{padding:"3px 8px",border:`1px solid ${accentDim}`,borderRadius:20,color:`${accent}88`,fontSize:8,cursor:cameraOn?"pointer":"default",background:accentFaint,letterSpacing:0.5}}>{cmd}</div>))}</div>
      <div style={{display:"flex",gap:6}}>
        {!cameraOn?(<button onClick={startCamera} style={{flex:1,padding:"7px",fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,background:accentFaint,border:`1px solid ${accentDim}`,color:accent,borderRadius:4,cursor:"pointer"}}>⬡ AKTIFKAN AI VISION</button>):(<><button onClick={analyzeFrame} disabled={analyzing} style={{flex:2,padding:"7px",fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,background:analyzing?`${accent}11`:accentFaint,border:`1px solid ${analyzing?accentDim:accent}`,color:analyzing?accentDim:accent,borderRadius:4,cursor:analyzing?"not-allowed":"pointer"}}>{analyzing?"⏳ MENGANALISIS...":"⬡ ANALISIS FRAME"}</button><button onClick={stopCamera} style={{flex:1,padding:"7px",fontFamily:"'Share Tech Mono',monospace",fontSize:9,background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.3)",color:"#f66",borderRadius:4,cursor:"pointer"}}>STOP</button></>)}
      </div>
    </div>
  )
}

// ── DETECT PANEL — AI Vision ────────────────────────────────────────────
interface DetectedObject { label: string; score: number; bbox: [number,number,number,number] }

function DetectPanel({accent,accentDim,accentFaint,lang}:{accent:string;accentDim:string;accentFaint:string;lang:string}) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream|null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval>|null>(null)

  const [cameraOn,  setCameraOn]  = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [objects,   setObjects]   = useState<DetectedObject[]>([])
  const [status,    setStatus]    = useState("")
  const [autoMode,  setAutoMode]  = useState(false)
  const [lastScan,  setLastScan]  = useState<Date|null>(null)

  // Warna per label
  const labelColor: Record<string,string> = {
    person:"#ff4444",car:"#ffaa00",motorcycle:"#ffaa00",bus:"#ffaa00",truck:"#ffaa00",
    bicycle:"#44ff88","cell phone":"#44aaff",laptop:"#44aaff",tv:"#44aaff",
    dog:"#ff88ff",cat:"#ff88ff",knife:"#ff2222",scissors:"#ff2222",
  }
  const getColor = (lbl: string) => labelColor[lbl.toLowerCase()] || accent

  const labelID: Record<string,string> = {
    person:"Orang",bicycle:"Sepeda",car:"Mobil",motorcycle:"Motor",airplane:"Pesawat",
    bus:"Bus",train:"Kereta",truck:"Truk",boat:"Perahu",chair:"Kursi",
    "dining table":"Meja Makan",laptop:"Laptop",keyboard:"Keyboard",mouse:"Mouse",
    "cell phone":"HP",book:"Buku",bottle:"Botol",cup:"Cangkir",
    knife:"Pisau",spoon:"Sendok",bowl:"Mangkuk",banana:"Pisang",apple:"Apel",
    backpack:"Ransel",umbrella:"Payung",handbag:"Tas",dog:"Anjing",cat:"Kucing",
    bird:"Burung",horse:"Kuda",cow:"Sapi","traffic light":"Lampu Merah",
    "stop sign":"Rambu Stop",bench:"Bangku",clock:"Jam",scissors:"Gunting",
    "potted plant":"Tanaman Pot",bed:"Kasur",toilet:"Toilet",
    "sports ball":"Bola","fire hydrant":"Hidran",refrigerator:"Kulkas",
    microwave:"Microwave",sink:"Wastafel",vase:"Vas","teddy bear":"Boneka",
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setCameraOn(true)
      setStatus(lang==="en"?"Camera ready. Press SCAN or enable Auto.":"Kamera siap. Tekan SCAN atau aktifkan Auto.")
    } catch { setStatus("⚠ "+(lang==="en"?"Camera denied":"Akses kamera ditolak")) }
  }

  const stopCamera = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false); setDetecting(false); setObjects([])
    setAutoMode(false); setStatus("")
    // Clear overlay
    if (overlayRef.current) {
      overlayRef.current.getContext("2d")?.clearRect(0,0,overlayRef.current.width,overlayRef.current.height)
    }
  }

  // Capture frame → AI Vision → parse objects
  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || detecting) return
    setDetecting(true)
    setStatus(lang==="en"?"Scanning...":"Memindai...")

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    canvas.width  = videoRef.current.videoWidth  || 640
    canvas.height = videoRef.current.videoHeight || 480
    ctx.drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1]

    try {
      const prompt = lang === "en"
        ? `You are an object detection AI for V-Optics smart glasses. Analyze this camera image and detect ALL visible objects.

Return ONLY a JSON array like this (no markdown, no explanation):
[
  {"label":"person","confidence":95,"x":120,"y":80,"w":200,"h":350},
  {"label":"car","confidence":87,"x":400,"y":200,"w":180,"h":120}
]

Rules:
- label: English name (lowercase), use COCO dataset labels when possible
- confidence: 0-100 integer
- x,y,w,h: bounding box in pixels relative to the image dimensions (${canvas.width}x${canvas.height})
- Include ALL objects you can see with confidence > 40
- Be precise with bounding box coordinates
- If no objects detected, return []`
        : `Kamu adalah AI deteksi objek untuk kacamata pintar V-Optics. Analisis gambar kamera ini dan deteksi SEMUA objek yang terlihat.

Balas HANYA array JSON seperti ini (tanpa markdown, tanpa penjelasan):
[
  {"label":"person","confidence":95,"x":120,"y":80,"w":200,"h":350},
  {"label":"car","confidence":87,"x":400,"y":200,"w":180,"h":120}
]

Aturan:
- label: nama dalam bahasa Inggris (huruf kecil), gunakan label dataset COCO jika memungkinkan  
- confidence: integer 0-100
- x,y,w,h: bounding box dalam piksel relatif terhadap dimensi gambar (${canvas.width}x${canvas.height})
- Sertakan SEMUA objek yang terlihat dengan confidence > 40
- Jika tidak ada objek, kembalikan []`

      const res = await fetch("/api/claude-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, prompt, mode: "detect" })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw = (data.result ?? "").replace(/```json|```/g, "").trim()

      // Parse array JSON
      const parsed: any[] = JSON.parse(raw.startsWith("[") ? raw : raw.slice(raw.indexOf("[")))
      const detected: DetectedObject[] = parsed
        .filter(o => o.confidence >= 40)
        .sort((a,b) => b.confidence - a.confidence)
        .slice(0, 15)
        .map(o => ({
          label: String(o.label).toLowerCase(),
          score: Math.min(100, Math.max(0, Number(o.confidence))),
          bbox: [Number(o.x), Number(o.y), Number(o.w), Number(o.h)] as [number,number,number,number]
        }))

      setObjects(detected)
      setLastScan(new Date())
      setStatus(lang==="en"
        ? `✓ ${detected.length} object${detected.length!==1?"s":""} detected`
        : `✓ ${detected.length} objek terdeteksi`)

      // Draw bounding boxes
      drawBoxes(detected)

    } catch (e: any) {
      const msg = e?.message ?? ""
      if (msg.includes("JSON")) {
        setStatus(lang==="en"?"No objects detected":"Tidak ada objek terdeteksi")
        setObjects([])
        if (overlayRef.current) overlayRef.current.getContext("2d")?.clearRect(0,0,overlayRef.current.width,overlayRef.current.height)
      } else {
        setStatus("⚠ " + (lang==="en"?"API error — check route":"Error API — cek route"))
      }
    }
    setDetecting(false)
  }

  // Draw bounding boxes ke overlay canvas
  const drawBoxes = (objs: DetectedObject[]) => {
    if (!overlayRef.current || !videoRef.current) return
    const ov = overlayRef.current
    const ctx = ov.getContext("2d")!
    ov.width  = videoRef.current.videoWidth  || 640
    ov.height = videoRef.current.videoHeight || 480
    ctx.clearRect(0, 0, ov.width, ov.height)

    objs.forEach(obj => {
      const [x,y,w,h] = obj.bbox
      const color = getColor(obj.label)
      const lbl = lang==="en" ? obj.label : (labelID[obj.label] || obj.label)

      // Box
      ctx.strokeStyle = color; ctx.lineWidth = 2.5
      ctx.strokeRect(x, y, w, h)

      // Corner accents
      const cs = 10
      ctx.strokeStyle = color; ctx.lineWidth = 3
      ;[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy],i) => {
        ctx.beginPath()
        ctx.moveTo(cx + (i%2===0?cs:-cs), cy)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx, cy + (i<2?cs:-cs))
        ctx.stroke()
      })

      // Label background
      ctx.font = "bold 11px monospace"
      const tw = ctx.measureText(`${lbl} ${obj.score}%`).width + 10
      ctx.fillStyle = `${color}dd`
      const labelY = y > 20 ? y - 18 : y + h + 2
      ctx.fillRect(x, labelY, tw, 16)

      // Label text
      ctx.fillStyle = "#000"
      ctx.fillText(`${lbl} ${obj.score}%`, x + 5, labelY + 12)
    })
  }

  // Auto scan setiap 3 detik
  useEffect(() => {
    if (autoMode && cameraOn) {
      timerRef.current = setInterval(() => scanFrame(), 3000)
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoMode, cameraOn])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return (
    <div style={{display:"flex",gap:10,height:"100%"}}>
      {/* ── Video + overlay ── */}
      <div style={{flex:1.4,position:"relative",border:`1px solid ${accentDim}`,borderRadius:6,overflow:"hidden",background:"#000"}}>
        <video ref={videoRef} muted playsInline
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:cameraOn?"block":"none"}}/>
        <canvas ref={canvasRef} style={{display:"none"}}/>
        <canvas ref={overlayRef}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            display:cameraOn?"block":"none",pointerEvents:"none"}}/>

        {/* Corner brackets */}
        {([[0,0],[1,0],[0,1],[1,1]] as const).map(([x,y],i) => (
          <div key={i} style={{position:"absolute",width:14,height:14,zIndex:2,
            top:y?"auto":6,bottom:y?6:"auto",left:x?"auto":6,right:x?6:"auto",
            borderTop:!y?`2px solid ${accent}`:"none",borderBottom:y?`2px solid ${accent}`:"none",
            borderLeft:!x?`2px solid ${accent}`:"none",borderRight:x?`2px solid ${accent}`:"none"}}/>
        ))}

        {/* Scan animation */}
        {detecting && (
          <div style={{position:"absolute",left:0,right:0,top:0,height:"100%",zIndex:3,
            background:`linear-gradient(180deg,transparent 0%,${accent}15 49%,${accent}25 50%,${accent}15 51%,transparent 100%)`,
            animation:"scanBeam 1.2s ease-in-out infinite"}}/>
        )}

        {!cameraOn && (
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:22,color:accentDim}}>⬢</span>
            <button onClick={startCamera}
              style={{padding:"7px 18px",fontFamily:"monospace",fontSize:9,letterSpacing:2,
                background:accentFaint,border:`1px solid ${accentDim}`,color:accent,borderRadius:4,cursor:"pointer"}}>
              {lang==="en"?"START DETECTION":"MULAI DETEKSI"}
            </button>
            <div style={{fontSize:8,color:accentDim,textAlign:"center",padding:"0 12px",lineHeight:1.6}}>
              {lang==="en"?"Powered by V-Optics AI":"Didukung V-Optics AI"}
            </div>
          </div>
        )}

        {/* Auto mode indicator */}
        {cameraOn && autoMode && (
          <div style={{position:"absolute",top:6,left:6,zIndex:4,
            padding:"2px 7px",background:`${accent}22`,border:`1px solid ${accent}`,
            borderRadius:3,fontSize:7,color:accent,letterSpacing:1,
            animation:"pulse 1s infinite"}}>
            ● AUTO {lang==="en"?"3s":"3d"}
          </div>
        )}

        {/* Model badge */}
        <div style={{position:"absolute",top:6,right:6,zIndex:4,
          padding:"2px 7px",background:"rgba(0,0,0,0.7)",border:`1px solid ${accentDim}`,
          borderRadius:3,fontSize:7,color:accentDim,letterSpacing:1}}>
          AI Vision
        </div>

        {cameraOn && (
          <button onClick={stopCamera}
            style={{position:"absolute",bottom:6,right:6,zIndex:4,
              padding:"3px 8px",fontFamily:"monospace",fontSize:8,
              background:"rgba(255,60,60,0.15)",border:"1px solid rgba(255,60,60,0.4)",
              color:"#f88",borderRadius:3,cursor:"pointer",letterSpacing:1}}>
            STOP
          </button>
        )}
      </div>

      {/* ── Panel kanan ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
        {/* Controls */}
        {cameraOn && (
          <div style={{display:"flex",gap:5}}>
            <button onClick={scanFrame} disabled={detecting}
              style={{flex:2,padding:"6px",fontFamily:"monospace",fontSize:8,letterSpacing:1,
                background:detecting?`${accent}11`:`${accent}18`,
                border:`1px solid ${detecting?accentDim:accent}`,
                color:detecting?accentDim:accent,borderRadius:4,cursor:detecting?"not-allowed":"pointer"}}>
              {detecting?"⏳ SCANNING...":"◆ SCAN"}
            </button>
            <button onClick={()=>setAutoMode(v=>!v)}
              style={{flex:1,padding:"6px",fontFamily:"monospace",fontSize:8,
                background:autoMode?`${accent}25`:accentDim,
                border:`1px solid ${autoMode?accent:accentDim}`,
                color:autoMode?accent:"#89a",borderRadius:4,cursor:"pointer",letterSpacing:1}}>
              {autoMode?"● AUTO":"AUTO"}
            </button>
          </div>
        )}

        {/* Status */}
        {status && (
          <div style={{fontSize:8,color:status.startsWith("✓")?"#0f8":status.startsWith("⚠")?"#f80":accentDim,
            letterSpacing:0.5,lineHeight:1.5}}>
            {status}
            {lastScan && <span style={{marginLeft:6,color:`${accentDim}`}}>
              {lastScan.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
            </span>}
          </div>
        )}

        {/* Header */}
        <div style={{fontSize:9,color:accentDim,letterSpacing:2}}>
          {lang==="en"?"DETECTED":"TERDETEKSI"}
          {objects.length>0&&<span style={{color:accent,marginLeft:4}}>({objects.length})</span>}
        </div>

        {/* Object list */}
        {objects.length===0 && cameraOn && !detecting && (
          <div style={{color:accentDim,fontSize:9,textAlign:"center",marginTop:8}}>
            {lang==="en"?"Press SCAN to detect":"Tekan SCAN untuk deteksi"}
          </div>
        )}

        {objects.map((obj, i) => {
          const lbl = lang==="en" ? obj.label : (labelID[obj.label] || obj.label)
          const color = getColor(obj.label)
          return (
            <div key={`${obj.label}-${i}`}
              style={{padding:"7px 9px",border:`1px solid ${color}33`,borderRadius:5,
                background:`${color}08`,animation:"slideIn 0.15s ease",animationFillMode:"both",
                animationDelay:`${i*0.04}s`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color,fontSize:11,fontWeight:"bold",textTransform:"capitalize"}}>{lbl}</span>
                <span style={{color:`${color}99`,fontSize:9}}>
                  {obj.score>=90?"●●●":obj.score>=70?"●●○":"●○○"}
                </span>
              </div>
              <div style={{height:2,background:`${color}22`,borderRadius:2}}>
                <div style={{width:`${obj.score}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.3s"}}/>
              </div>
              <div style={{color:`${color}77`,fontSize:8,marginTop:2}}>
                {lang==="en"?"Confidence":"Konfiden"}: {obj.score}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
// ── MAIN ──────────────────────────────────────────────────────────────────────
export function HUDSimulator({ settings, t, activeFeature: activeFeatureProp, setActiveFeature: setActiveFeatureProp, voiceAction, onVoiceActionDone }: HUDSimulatorProps) {
  const [time, setTime] = useState(new Date())
  const [scanLine, setScanLine] = useState(0)
  const [internalFeature, setInternalFeature] = useState("nav")

  // Gunakan controlled (dari voice) atau internal state
  const activeFeature = activeFeatureProp ?? internalFeature
  const setActiveFeature = (f: string) => {
    setInternalFeature(f)
    setActiveFeatureProp?.(f)
  }

  const {coords,address,accuracy,error:gpsError,loading:gpsLoading,nearby,loadingNearby,destination,setDestination,searchQuery,setSearchQuery,searchNearbyByQuery,activeSearchRef} = useGPS()
  const notifs  = useRealNotifs(coords)
  const battery = useBattery()

  // Pending search query dari voice — menunggu coords tersedia
  const [pendingSearch, setPendingSearch] = useState<string|null>(null)

  // Eksekusi voiceAction saat berubah
  useEffect(() => {
    if (!voiceAction || voiceAction.type === "none") return
    if (voiceAction.type === "navigate") {
      setActiveFeature(voiceAction.feature)
    } else if (voiceAction.type === "search_nearby") {
      const query = (voiceAction as any).query ?? ""
      setActiveFeature("nav")
      if (coords) {
        searchNearbyByQuery(query, coords.lat, coords.lng)
      } else {
        setPendingSearch(query)
      }
    } else if (voiceAction.type === "toggle_hide_ui") {
      // handled di parent
    }
    onVoiceActionDone?.()
  }, [voiceAction])

  // Proses pending search saat coords baru tersedia
  useEffect(() => {
    if (pendingSearch && coords) {
      searchNearbyByQuery(pendingSearch, coords.lat, coords.lng)
      setPendingSearch(null)
    }
  }, [coords, pendingSearch])

  const accent      = settings?.accentColor ?? "#00ffff"
  const accentDim   = `${accent}55`
  const accentFaint = `${accent}15`
  const hidden      = settings?.hideUI ?? false
  const lang        = settings?.language ?? "id"

  useEffect(()=>{ const i=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(i) },[])
  useEffect(()=>{ const i=setInterval(()=>setScanLine(p=>(p+1)%100),28); return()=>clearInterval(i) },[])

  const fmt=(n:number)=>String(n).padStart(2,"0")
  const timeStr=`${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`

  const tabs=[
    {id:"nav",label:t.tabNav,icon:"◈"},{id:"notify",label:t.tabNotif,icon:"◉"},
    {id:"translate",label:t.tabTranslate,icon:"◆"},{id:"ai",label:t.tabAI,icon:"⬡"},
    {id:"health",label:t.tabHealth,icon:"♥"},{id:"detect",label:t.tabDetect,icon:"⬢"},
  ]

  return (
    <div className="relative w-full max-w-205 overflow-hidden font-mono"
      style={{aspectRatio:"16/9",background:"linear-gradient(135deg,#04080f 0%,#0a1628 50%,#060c18 100%)",borderRadius:16,border:`1px solid ${accentDim}`,boxShadow:`0 0 60px ${accentFaint},inset 0 0 80px rgba(0,0,0,0.13)`,filter:`brightness(${settings?.brightness??80}%)`}}>
      <div className="absolute inset-0 pointer-events-none z-10" style={{background:`linear-gradient(transparent ${scanLine-1}%,rgba(0,255,255,0.025) ${scanLine}%,transparent ${scanLine+1}%)`}}/>
      <div className="absolute inset-0 pointer-events-none z-10" style={{background:"radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.75) 100%)"}}/>
      <div className="absolute inset-0 pointer-events-none" style={{opacity:0.035,backgroundImage:`linear-gradient(${accent} 1px,transparent 1px),linear-gradient(90deg,${accent} 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>

      {!hidden&&(
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center z-5"
          style={{padding:"7px 14px",borderBottom:`1px solid ${accentDim}`,background:"rgba(4,8,15,0.5)"}}>
          <div className="text-[9px] tracking-[3px]" style={{color:accent}}>V-OPTICS HUD v2.0</div>
          <div className="text-xs font-bold tracking-[4px]" style={{color:accent,textShadow:`0 0 8px ${accent}`}}>{timeStr}</div>
          <div className="flex gap-2.5 items-center">
            <span className="text-[9px]" style={{color:"#0f8"}}>{t.active}</span>
            <span className="text-[9px]" style={{
              color: battery.level === null ? "#888"
                   : battery.charging ? "#0f8"
                   : battery.level <= 15 ? "#f44"
                   : battery.level <= 30 ? "#f80"
                   : "#ff0"
            }}>
              {battery.charging ? "⚡" : battery.level !== null && battery.level <= 20 ? "🪫" : "🔋"}
              {battery.level !== null ? ` ${battery.level}%` : " --"}
            </span>
            <span className="text-[9px]" style={{color:gpsError?"#f44":coords?"#0f8":"#ff0"}}>{gpsError?"⚠ GPS":coords?"● GPS":"○ GPS"}</span>
            {notifs.length>0&&<span className="text-[9px]" style={{color:accent,animation:"pulse 2s infinite"}}>◉ {notifs.length}</span>}
          </div>
        </div>
      )}

      {!hidden&&(
        <div className="absolute bottom-0 left-0 right-0 flex z-5" style={{borderTop:`1px solid ${accentDim}`}}>
          {tabs.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveFeature(tab.id)}
              className="flex-1 font-mono text-[8px] tracking-[0.5px] cursor-pointer transition-all duration-200"
              style={{padding:"6px 2px",background:activeFeature===tab.id?`${accent}1a`:"transparent",border:"none",borderRight:`1px solid ${accentDim}`,color:activeFeature===tab.id?accent:`${accent}55`,textShadow:activeFeature===tab.id?`0 0 6px ${accent}`:"none"}}>
              <div className="text-[11px]">{tab.icon}</div>{tab.label}
            </button>
          ))}
        </div>
      )}

      {hidden&&<div className="absolute top-2 right-2 z-20 text-[8px] tracking-widest" style={{color:accentDim}}>CLEAN MODE</div>}

      <div className="absolute z-3 overflow-hidden" style={{top:hidden?0:38,bottom:hidden?0:44,left:0,right:0,padding:"12px 14px"}}>

        {activeFeature==="nav"&&(
          <div className="flex gap-3.5 h-full items-center">
            {/* ── Peta — routing ke destination kalau ada ── */}
            <div className="flex-1 h-full max-h-50 relative overflow-hidden rounded-md" style={{border:`1px solid ${destination?accent:accentDim}`,background:"#040d1a",transition:"border-color 0.3s"}}>
              {coords
                ? (<LeafletMap
                    lat={coords.lat} lng={coords.lng}
                    destLat={destination?.lat} destLng={destination?.lng}
                    accent={accent} accentDim={accentDim}/>)
                : (<div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div style={{color:gpsError?"#f44":"#ff0",fontSize:9,letterSpacing:1,textAlign:"center",padding:"0 8px"}}>
                      {gpsError?`⚠ ${gpsError}`:lang==="en"?"○ Getting GPS...":"○ Mendapatkan GPS..."}
                    </div>
                    {!gpsError&&<div style={{width:16,height:16,border:`2px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>}
                  </div>)
              }
              {/* Badge destination aktif */}
              {destination&&(
                <div style={{position:"absolute",bottom:6,left:6,right:6,padding:"4px 8px",
                  background:"rgba(0,0,0,0.75)",border:`1px solid ${accent}`,borderRadius:4,
                  display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10}}>{catIcon(destination.category)}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:accent,fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{destination.name}</div>
                    <div style={{fontSize:7,color:"#ff0"}}>▶ {destination.dist}</div>
                  </div>
                  <button onClick={()=>{ setDestination(null); activeSearchRef.current = false; setSearchQuery("") }}
                    style={{fontSize:8,color:"#f66",background:"none",border:"none",cursor:"pointer",padding:"0 2px"}}>✕</button>
                </div>
              )}
            </div>

            {/* ── Panel kanan ── */}
            <div className="flex-[1.3] flex flex-col gap-0 overflow-y-auto h-full">
              <div className="flex items-center gap-2 py-1.5" style={{borderBottom:`1px solid ${accentDim}`}}>
                <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,background:coords?accent:"#ff0",boxShadow:`0 0 6px ${coords?accent:"#ff0"}`,animation:gpsLoading?"pulse 1s infinite":"none"}}/>
                <span className="flex-1 text-[10px]" style={{color:accent}}>
                  {gpsLoading?(lang==="en"?"Locating...":"Mencari..."):gpsError?gpsError:(lang==="en"?"You are here":"Kamu di sini")}
                </span>
              </div>

              {coords&&!gpsError&&(
                <div className="py-1.5" style={{borderBottom:`1px solid ${accentDim}`}}>
                  <div style={{fontSize:9,color:accentDim,letterSpacing:1,marginBottom:2}}>{lang==="en"?"LOCATION":"LOKASI"}</div>
                  <div style={{fontSize:10,color:"#cde",lineHeight:1.4}}>{address}</div>
                  <div style={{fontSize:8,color:`${accent}66`,marginTop:2,fontFamily:"monospace"}}>
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    {accuracy&&<span style={{color:"#ff0",marginLeft:4}}>±{accuracy}m</span>}
                  </div>
                </div>
              )}

              {/* Label search query kalau dari voice */}
              {searchQuery&&(
                <div style={{padding:"3px 6px",fontSize:8,color:accent,letterSpacing:1,
                  background:`${accent}10`,borderBottom:`1px solid ${accentDim}`}}>
                  🔍 {searchQuery}
                  <span onClick={()=>{ setDestination(null); activeSearchRef.current = false; setSearchQuery("") }} style={{float:"right",cursor:"pointer",color:"#f66"}}>✕</span>
                </div>
              )}

              {coords&&(
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:accentDim,letterSpacing:1,padding:"4px 0"}}>
                    {loadingNearby?(lang==="en"?"↻ SEARCHING...":"↻ MENCARI..."):(lang==="en"?"NEARBY":"TERDEKAT")}
                  </div>
                  {loadingNearby&&<div style={{width:10,height:10,border:`1.5px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
                  {!loadingNearby&&nearby.map((p,i)=>{
                    const isActive = destination?.name===p.name && destination?.lat===p.lat
                    return (
                      <div key={i} onClick={()=>{ if(isActive){ setDestination(null); activeSearchRef.current=false; setSearchQuery("") } else { setDestination(p) } }}
                        className="flex items-center gap-2 py-1.5"
                        style={{borderBottom:`1px solid ${isActive?accent+"44":accent+"11"}`,
                          cursor:"pointer",
                          background:isActive?`${accent}12`:"transparent",
                          borderRadius:isActive?4:0,padding:isActive?"4px 6px":"6px 0",
                          animation:"fadeIn 0.3s ease",animationDelay:`${i*0.08}s`,animationFillMode:"both"}}>
                        <span style={{fontSize:10,flexShrink:0}}>{catIcon(p.category)}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                            color:isActive?accent:i===0?"#cde":"#89a",
                            fontWeight:isActive?"bold":"normal"}}>
                            {p.name}
                          </div>
                          <div style={{fontSize:8,color:`${accent}55`}}>{p.category}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}>
                          <span style={{fontSize:9,flexShrink:0,fontFamily:"monospace",color:isActive?"#0f8":i===0?"#ff0":"#ff08"}}>{p.dist}</span>
                          {isActive&&<span style={{fontSize:7,color:"#0f8",letterSpacing:0.5}}>▶ AKTIF</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div style={{marginTop:"auto",padding:"5px 8px",background:"rgba(0,255,0,0.07)",
                border:"1px solid rgba(0,255,136,0.2)",borderRadius:5,color:"#0f8",fontSize:9,letterSpacing:1}}>
                {destination
                  ? `▶ ${lang==="en"?"Routing to":"Menuju"}: ${destination.name}`
                  : gpsError?`⚠ ${gpsError}`:coords?(lang==="en"?"● GPS ACTIVE":"● GPS AKTIF"):(lang==="en"?"○ Waiting GPS":"○ Menunggu GPS")}
              </div>
            </div>
          </div>
        )}

        {activeFeature==="notify"&&(
          <div className="flex flex-col gap-1.75 overflow-y-auto h-full">
            {notifs.length===0&&<div style={{color:accentDim,fontSize:10,textAlign:"center",marginTop:20,letterSpacing:1}}>{lang==="en"?"Waiting for events...":"Menunggu event..."}</div>}
            {notifs.map((n,i)=>(<div key={n.id} className="flex items-start gap-2.5 rounded-[5px]" style={{padding:"8px 10px",background:i===0?accentFaint:"transparent",border:`1px solid ${i===0?accentDim:`${accent}15`}`,animation:"fadeIn 0.3s ease",animationFillMode:"both"}}><span className="text-[13px]" style={{color:n.type==="net"?"#0f8":n.type==="battery"?"#ff0":n.type==="gps"?accent:"#f0f"}}>{n.icon}</span><span className="flex-1 text-[11px] leading-relaxed" style={{color:"#cde"}}>{n.msg}</span><span className="text-[9px] whitespace-nowrap" style={{color:accentDim}}>{n.time}</span></div>))}
          </div>
        )}

        {activeFeature==="translate"&&<TranslatePanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} targetLang={lang}/>}
        {activeFeature==="ai"&&<AIPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang}/>}
        {activeFeature==="health"&&<HealthPanel t={t}/>}
        {activeFeature==="detect"&&<DetectPanel accent={accent} accentDim={accentDim} accentFaint={accentFaint} lang={lang}/>}
      </div>
    </div>
  )
}