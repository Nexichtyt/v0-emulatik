"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  Settings,
  Keyboard,
  Volume2,
  EyeOff,
  ChevronUp,
  Minus,
  Square,
  X,
  Sun,
  Moon,
  Users,
  ImageIcon,
  Link2,
  LayoutGrid,
  MessageCircle,
  AppWindow,
  Crosshair,
  Monitor,
  MousePointer2,
  Plus,
  Clock,
  Cloud,
  Calendar,
  Music,
  ImagePlus,
  Sparkles,
} from "lucide-react"

type IconItem = { id: string; name: string; icon: string; x: number; y: number }
type WidgetType = "clock" | "weather" | "calendar" | "music" | "photo"
type WidgetItem = { id: string; type: WidgetType; x: number; y: number; w: number; h: number; photo?: string }

const initialApps: Omit<IconItem, "x" | "y">[] = [
  { id: "play", name: "Google Play", icon: "/icons/google-play.png" },
  { id: "standoff", name: "Standoff 2", icon: "/icons/standoff2.png" },
  { id: "settings", name: "Настройки", icon: "/icons/settings.png" },
  { id: "files", name: "Файлы", icon: "/icons/files.png" },
]

const playerConfigs = [
  { name: "Aiman", tag: "PRO", resolution: "2400 x 1080", sens: "0.85", crosshair: "Точка · Зелёный" },
  { name: "Nesko", tag: "FaZe", resolution: "1920 x 1080", sens: "1.20", crosshair: "Крест · Жёлтый" },
  { name: "Solovey", tag: "TOP-1", resolution: "2340 x 1080", sens: "0.65", crosshair: "Точка · Голубой" },
  { name: "Murkesh", tag: "MVP", resolution: "2160 x 1080", sens: "0.95", crosshair: "Крест · Красный" },
]

const wallpapers = [
  { id: "aurora", label: "Aurora", value: "radial-gradient(120% 90% at 75% 60%, #a112d6 0%, #6312c4 28%, #2a1a8a 52%, #0a0a1f 100%)" },
  { id: "sunset", label: "Sunset", value: "radial-gradient(120% 100% at 30% 0%, #ffffff 0%, #f6c9f0 18%, #e779f5 42%, #b13cf0 62%, #4f37d8 100%)" },
  { id: "ocean", label: "Ocean", value: "radial-gradient(120% 90% at 50% 100%, #00d4ff 0%, #0072ff 35%, #1a1a8a 70%, #05051a 100%)" },
]

const widgetCatalog: { type: WidgetType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "clock", label: "Часы", icon: Clock },
  { type: "weather", label: "Погода", icon: Cloud },
  { type: "calendar", label: "Календарь", icon: Calendar },
  { type: "music", label: "Музыка", icon: Music },
  { type: "photo", label: "Фото", icon: ImagePlus },
]

const widgetDefaults: Record<WidgetType, { w: number; h: number }> = {
  clock: { w: 170, h: 96 },
  weather: { w: 170, h: 96 },
  calendar: { w: 170, h: 96 },
  music: { w: 200, h: 96 },
  photo: { w: 180, h: 180 },
}

function useClock() {
  const [time, setTime] = useState("17:01")
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

/* Crops the S-Elite logo down to just the crowned "S" (removes the "Elite" wordmark) */
function SLogo({ size }: { size: number }) {
  return (
    <div className="relative overflow-hidden" style={{ width: size, height: size }}>
      <img
        src="/logo-s-elite.png"
        alt="S Elite"
        style={{
          position: "absolute",
          width: size * 2,
          height: size * 2,
          maxWidth: "none",
          left: -0.5 * size,
          top: -0.367 * size,
        }}
      />
    </div>
  )
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export function EmulatorWindow() {
  const [dark, setDark] = useState(true)
  const [os, setOs] = useState<"win" | "mac">("win")
  const [modal, setModal] = useState<null | "configs">(null)
  const [menu, setMenu] = useState<null | "wallpaper" | "link" | "widget" | "os">(null)
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null)
  const [linkValue, setLinkValue] = useState("")
  const [icons, setIcons] = useState<IconItem[]>(
    initialApps.map((a, i) => ({ ...a, x: 360 + i * 100, y: 250 })),
  )
  const [widgets, setWidgets] = useState<WidgetItem[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const deskRef = useRef<HTMLDivElement>(null)
  const time = useClock()

  const activeWallpaper = customWallpaper ?? (dark ? wallpapers[0].value : wallpapers[1].value)

  /* ---- drag & resize ---- */
  function startDragIcon(e: React.PointerEvent, id: string, w: number, h: number) {
    e.preventDefault()
    const rect = deskRef.current?.getBoundingClientRect()
    if (!rect) return
    const item = icons.find((i) => i.id === id)
    if (!item) return
    const sx = e.clientX
    const sy = e.clientY
    const ox = item.x
    const oy = item.y
    const move = (ev: PointerEvent) => {
      const nx = clamp(ox + ev.clientX - sx, 0, rect.width - w)
      const ny = clamp(oy + ev.clientY - sy, 0, rect.height - h)
      setIcons((prev) => prev.map((it) => (it.id === id ? { ...it, x: nx, y: ny } : it)))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function startDragWidget(e: React.PointerEvent, id: string) {
    e.preventDefault()
    const rect = deskRef.current?.getBoundingClientRect()
    if (!rect) return
    const item = widgets.find((i) => i.id === id)
    if (!item) return
    const sx = e.clientX
    const sy = e.clientY
    const ox = item.x
    const oy = item.y
    const move = (ev: PointerEvent) => {
      const nx = clamp(ox + ev.clientX - sx, 0, rect.width - item.w)
      const ny = clamp(oy + ev.clientY - sy, 0, rect.height - item.h)
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, x: nx, y: ny } : it)))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function startResize(e: React.PointerEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    const item = widgets.find((i) => i.id === id)
    if (!item) return
    const sx = e.clientX
    const sy = e.clientY
    const ow = item.w
    const oh = item.h
    const move = (ev: PointerEvent) => {
      const nw = clamp(ow + ev.clientX - sx, 140, 380)
      const nh = clamp(oh + ev.clientY - sy, 90, 340)
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, w: nw, h: nh } : it)))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function addWidget(type: WidgetType) {
    const def = widgetDefaults[type]
    const id = `${type}-${Date.now()}`
    const offset = widgets.length * 16
    setWidgets((prev) => [...prev, { id, type, x: 24 + offset, y: 24 + offset, w: def.w, h: def.h }])
    setMenu(null)
    if (type === "photo") setTimeout(() => pickPhoto(id), 50)
  }

  function pickPhoto(id: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = () => {
      const f = input.files?.[0]
      if (f) {
        const url = URL.createObjectURL(f)
        setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, photo: url } : w)))
      }
    }
    input.click()
  }

  const onUploadWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCustomWallpaper(`center / cover no-repeat url(${URL.createObjectURL(file)})`)
      setMenu(null)
    }
  }

  return (
    <div
      className={`relative flex h-[640px] w-full max-w-[1024px] flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 transition-colors duration-500 ${
        dark ? "ring-white/10" : "ring-black/10"
      }`}
    >
      {/* Title bar */}
      <div
        className={`relative z-30 flex h-9 items-center justify-between px-3 transition-colors duration-500 ${
          dark ? "bg-[#1a1a1c]" : "bg-[#f4f4f6]"
        }`}
      >
        <div className="flex items-center gap-3">
          {os === "mac" && (
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
          )}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#a112d6] to-[#4f37d8] shadow-sm">
            <SLogo size={22} />
          </span>
        </div>

        {os === "win" && (
          <div className={`flex items-center gap-4 ${dark ? "text-white/60" : "text-black/50"}`}>
            <ChevronUp className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
            <Minus className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
            <Square className="h-[14px] w-[14px] cursor-pointer transition-opacity hover:opacity-100" />
            <X className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
          </div>
        )}
      </div>

      {/* Desktop / wallpaper */}
      <div ref={deskRef} className="relative flex-1 touch-none overflow-hidden">
        <div className="absolute inset-0 transition-all duration-500" style={{ background: activeWallpaper }} />

        {/* Draggable app icons */}
        {icons.map((app) => (
          <button
            key={app.id}
            onPointerDown={(e) => startDragIcon(e, app.id, 80, 88)}
            style={{ left: app.x, top: app.y }}
            className="group absolute flex w-20 cursor-grab flex-col items-center gap-2 outline-none active:cursor-grabbing"
          >
            <span className="relative h-[60px] w-[60px] overflow-hidden rounded-[14px] shadow-lg transition-transform duration-150 group-active:scale-95">
              <Image src={app.icon || "/placeholder.svg"} alt={app.name} fill className="pointer-events-none object-cover" />
            </span>
            <span className="pointer-events-none text-center text-xs font-medium text-white drop-shadow">{app.name}</span>
          </button>
        ))}

        {/* Draggable / resizable widgets */}
        {widgets.map((w) => (
          <div
            key={w.id}
            onPointerDown={(e) => startDragWidget(e, w.id)}
            style={{ left: w.x, top: w.y, width: w.w, height: w.h }}
            className="group absolute cursor-grab overflow-hidden rounded-2xl bg-black/35 backdrop-blur-md ring-1 ring-white/10 active:cursor-grabbing"
          >
            {w.type === "clock" && (
              <div className="flex h-full flex-col justify-center p-4">
                <p className="text-3xl font-semibold tabular-nums text-white">{time}</p>
                <p className="text-xs text-white/60">Сегодня</p>
              </div>
            )}
            {w.type === "weather" && (
              <div className="flex h-full items-center gap-3 p-4">
                <Cloud className="h-8 w-8 shrink-0 text-white/80" />
                <div>
                  <p className="text-2xl font-semibold text-white">21°</p>
                  <p className="text-xs text-white/60">Облачно</p>
                </div>
              </div>
            )}
            {w.type === "calendar" && (
              <div className="flex h-full flex-col justify-center p-4">
                <p className="text-xs uppercase tracking-wide text-[#e779f5]">Сегодня</p>
                <p className="text-xl font-semibold text-white">
                  {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </p>
              </div>
            )}
            {w.type === "music" && (
              <div className="flex h-full items-center gap-3 p-4">
                <Music className="h-8 w-8 shrink-0 text-white/80" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">Now Playing</p>
                  <p className="truncate text-xs text-white/60">S Elite Radio</p>
                </div>
              </div>
            )}
            {w.type === "photo" && (
              <div className="relative h-full w-full">
                {w.photo ? (
                  <img src={w.photo || "/placeholder.svg"} alt="Виджет фото" className="pointer-events-none h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs">Добавить фото</span>
                  </div>
                )}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => pickPhoto(w.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/75 group-hover:opacity-100"
                  aria-label="Сменить фото"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
              </div>
            )}
            {/* resize handle */}
            <span
              onPointerDown={(e) => startResize(e, w.id)}
              className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span className="absolute bottom-1.5 right-1.5 h-2 w-2 border-b-2 border-r-2 border-white/70" />
            </span>
          </div>
        ))}

        {/* Control pill (static, top-right) */}
        <div className="absolute right-5 top-3 z-20 flex items-center gap-5 rounded-full bg-black/50 px-5 py-2.5 backdrop-blur-md">
          <Settings className="h-[18px] w-[18px] cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <Keyboard className="h-[18px] w-[18px] cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <Volume2 className="h-[18px] w-[18px] cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <EyeOff className="h-[18px] w-[18px] cursor-pointer text-white/90 transition-transform hover:scale-110" />
        </div>

        {/* Click-away layer for popovers (no blur) */}
        {menu && <button aria-label="Закрыть меню" onClick={() => setMenu(null)} className="absolute inset-0 z-30" />}

        {/* Bottom bar */}
        <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-4 px-6 pb-6">
          {/* Theme switch */}
          <div className="flex items-center gap-1 rounded-full bg-black/35 p-1.5 backdrop-blur-md">
            <button
              onClick={() => {
                setDark(false)
                setCustomWallpaper(null)
              }}
              aria-label="Светлая тема"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                !dark ? "bg-white/90 text-black" : "text-white/80"
              }`}
            >
              <Sun className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setDark(true)
                setCustomWallpaper(null)
              }}
              aria-label="Тёмная тема"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                dark ? "bg-white/90 text-black" : "text-white/80"
              }`}
            >
              <Moon className="h-5 w-5" />
            </button>
          </div>

          {/* Dock capsule */}
          <div className="flex h-14 items-center gap-2 rounded-full bg-black/35 px-3 backdrop-blur-md">
            <div className="flex items-center gap-1">
              <DockButton icon={Users} label="Конфиги игроков" onClick={() => setModal("configs")} />

              <DockButton
                icon={ImageIcon}
                label="Смена обоев"
                active={menu === "wallpaper"}
                onClick={() => setMenu((m) => (m === "wallpaper" ? null : "wallpaper"))}
              >
                {menu === "wallpaper" && (
                  <Popover title="Смена обоев">
                    <div className="grid grid-cols-4 gap-2">
                      {wallpapers.map((wp) => (
                        <button
                          key={wp.id}
                          onClick={() => {
                            setCustomWallpaper(wp.value)
                            setMenu(null)
                          }}
                          className="group/wp flex flex-col gap-1.5 outline-none"
                        >
                          <span
                            className="h-12 w-full rounded-lg ring-1 ring-white/10 transition-transform group-hover/wp:scale-105"
                            style={{ background: wp.value }}
                          />
                          <span className="text-center text-[10px] font-medium text-white/70">{wp.label}</span>
                        </button>
                      ))}
                      <button onClick={() => fileRef.current?.click()} className="group/wp flex flex-col gap-1.5 outline-none">
                        <span className="flex h-12 w-full items-center justify-center rounded-lg border border-dashed border-white/25 text-white/60 transition-colors group-hover/wp:border-white/50 group-hover/wp:text-white">
                          <Plus className="h-5 w-5" />
                        </span>
                        <span className="text-center text-[10px] font-medium text-white/70">Свои</span>
                      </button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUploadWallpaper} />
                  </Popover>
                )}
              </DockButton>

              <DockButton
                icon={Link2}
                label="Присоединиться по ссылке"
                active={menu === "link"}
                onClick={() => setMenu((m) => (m === "link" ? null : "link"))}
              >
                {menu === "link" && (
                  <Popover title="Присоединиться по ссылке" width={300}>
                    <div className="flex items-start gap-2.5 rounded-lg bg-white/5 p-2.5">
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
                        <Image src="/icons/standoff2.png" alt="Standoff 2" fill className="object-cover" />
                      </span>
                      <p className="text-[11px] leading-relaxed text-white/70">
                        Ссылка откроется в приложении <span className="font-semibold text-white">Standoff 2</span> внутри игры.
                      </p>
                    </div>
                    <input
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      placeholder="https://link.standoff2.com/..."
                      className="mt-2.5 w-full rounded-lg bg-white/5 px-3 py-2 text-xs text-white outline-none ring-1 ring-white/10 transition-colors placeholder:text-white/30 focus:ring-[#a112d6]"
                    />
                    <button
                      disabled={!linkValue.trim()}
                      onClick={() => setMenu(null)}
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-white/90 py-2 text-xs font-semibold text-black transition-colors enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Открыть в Standoff 2
                    </button>
                  </Popover>
                )}
              </DockButton>

              <DockButton
                icon={LayoutGrid}
                label="Добавить виджет"
                active={menu === "widget"}
                onClick={() => setMenu((m) => (m === "widget" ? null : "widget"))}
              >
                {menu === "widget" && (
                  <Popover title="Добавить виджет" width={250}>
                    <p className="mb-2.5 text-[11px] text-white/60">Виджет появится на рабочем столе.</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {widgetCatalog.map((w) => (
                        <button
                          key={w.type}
                          onClick={() => addWidget(w.type)}
                          className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2 text-left outline-none ring-1 ring-white/10 transition-colors hover:bg-white/10"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white">
                            <w.icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-medium text-white">{w.label}</span>
                          <Plus className="ml-auto h-3.5 w-3.5 text-white/40" />
                        </button>
                      ))}
                    </div>
                  </Popover>
                )}
              </DockButton>

              <DockButton icon={MessageCircle} label="Чат в Telegram" onClick={() => window.open("https://t.me/", "_blank")} />

              <DockButton
                icon={AppWindow}
                label="Интерфейс окна"
                active={menu === "os"}
                onClick={() => setMenu((m) => (m === "os" ? null : "os"))}
              >
                {menu === "os" && (
                  <Popover title="Интерфейс окна" width={260}>
                    <div className="grid grid-cols-2 gap-2.5">
                      <OsCard
                        kind="win"
                        active={os === "win"}
                        onClick={() => {
                          setOs("win")
                          setMenu(null)
                        }}
                      />
                      <OsCard
                        kind="mac"
                        active={os === "mac"}
                        onClick={() => {
                          setOs("mac")
                          setMenu(null)
                        }}
                      />
                    </div>
                  </Popover>
                )}
              </DockButton>
            </div>
            <span className="h-7 w-px bg-white/20" />
            <span className="flex items-center pr-1">
              <SLogo size={28} />
            </span>
          </div>

          {/* Clock */}
          <div className="rounded-2xl bg-black/35 px-5 py-2.5 text-2xl font-medium text-white backdrop-blur-md">
            <span className="font-mono tabular-nums">{time}</span>
          </div>
        </div>

        {/* Configs modal */}
        {modal === "configs" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <button aria-label="Закрыть" onClick={() => setModal(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-[#16161e]/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-white">Конфиги игроков</h2>
                <button
                  onClick={() => setModal(null)}
                  aria-label="Закрыть"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-5">
                {playerConfigs.map((p) => (
                  <div key={p.name} className="flex items-center gap-4 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a112d6] to-[#4f37d8] text-sm font-semibold text-white">
                      {p.name.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[#e779f5]">{p.tag}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3.5 w-3.5" /> {p.resolution}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer2 className="h-3.5 w-3.5" /> Сенса {p.sens}
                        </span>
                        <span className="flex items-center gap-1">
                          <Crosshair className="h-3.5 w-3.5" /> {p.crosshair}
                        </span>
                      </div>
                    </div>
                    <button className="shrink-0 rounded-lg bg-white/90 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white">
                      Выбрать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DockButton({
  icon: Icon,
  label,
  onClick,
  active,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  active?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="relative">
      {children}
      <button
        onClick={onClick}
        aria-label={label}
        className={`group relative flex h-10 w-10 items-center justify-center rounded-xl outline-none transition-all duration-200 hover:scale-110 active:scale-95 ${
          active ? "bg-white/15" : "hover:bg-white/10"
        }`}
      >
        <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
          {label}
        </span>
        <Icon className="h-[22px] w-[22px] text-white/85 transition-colors group-hover:text-white" />
      </button>
    </div>
  )
}

function Popover({ title, width = 280, children }: { title: string; width?: number; children: React.ReactNode }) {
  return (
    <div
      style={{ width }}
      className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 overflow-hidden rounded-2xl bg-[#16161e]/95 p-3.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
    >
      <p className="mb-2.5 text-xs font-semibold text-white">{title}</p>
      {children}
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#16161e]/95" />
    </div>
  )
}

function OsCard({ kind, active, onClick }: { kind: "win" | "mac"; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-xl p-2.5 outline-none ring-1 transition-colors ${
        active ? "bg-[#a112d6]/20 ring-[#a112d6]" : "bg-white/5 ring-white/10 hover:bg-white/10"
      }`}
    >
      <span className="relative flex h-12 w-full items-center overflow-hidden rounded-md bg-[#222]">
        {kind === "mac" ? (
          <span className="absolute left-1.5 top-1.5 flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
          </span>
        ) : (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 text-white/60">
            <Minus className="h-2 w-2" />
            <Square className="h-1.5 w-1.5" />
            <X className="h-2 w-2" />
          </span>
        )}
      </span>
      <span className="text-xs font-medium text-white">{kind === "win" ? "Windows" : "macOS"}</span>
    </button>
  )
}
