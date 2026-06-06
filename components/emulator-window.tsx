"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  Settings,
  Keyboard,
  Volume2,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Minus,
  Square,
  X,
  Sun,
  Moon,
  Users,
  ImageIcon,
  Link2,
  Blocks,
  MessageCircle,
  AppWindow,
  Crosshair,
  Monitor,
  MousePointer2,
  Plus,
  Upload,
  Cloud,
  Calendar,
  Music,
  Check,
  Sparkles,
} from "lucide-react"

const apps = [
  { name: "Google Play", icon: "/icons/google-play.png" },
  { name: "Standoff 2", icon: "/icons/standoff2.png" },
  { name: "Настройки", icon: "/icons/settings.png" },
  { name: "Файлы", icon: "/icons/files.png" },
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

const widgetCatalog = [
  { id: "clock", label: "Часы", icon: Settings },
  { id: "weather", label: "Погода", icon: Cloud },
  { id: "calendar", label: "Календарь", icon: Calendar },
  { id: "music", label: "Музыка", icon: Music },
]

function useClock() {
  const [time, setTime] = useState("17:01")
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, "0")
      const m = String(now.getMinutes()).padStart(2, "0")
      setTime(`${h}:${m}`)
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

type DockItemProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  active?: boolean
}

function DockItem({ icon: Icon, label, onClick, active }: DockItemProps) {
  return (
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
  )
}

function Modal({
  title,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
      <button aria-label="Закрыть" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative z-10 w-full ${width} overflow-hidden rounded-2xl bg-[#16161e]/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function EmulatorWindow() {
  const [dark, setDark] = useState(true)
  const [os, setOs] = useState<"win" | "mac">("win")
  const [modal, setModal] = useState<null | "configs" | "wallpaper" | "link" | "widget">(null)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<string[]>([])
  const [linkValue, setLinkValue] = useState("")
  const [volume, setVolume] = useState(70)
  const [brightness, setBrightness] = useState(85)
  const fileRef = useRef<HTMLInputElement>(null)
  const time = useClock()

  const activeWallpaper =
    customWallpaper ?? (dark ? wallpapers[0].value : wallpapers[1].value)

  const dockItems: DockItemProps[] = [
    { icon: Users, label: "Конфиги игроков", onClick: () => setModal("configs") },
    { icon: ImageIcon, label: "Смена обоев", onClick: () => setModal("wallpaper") },
    { icon: Link2, label: "Присоединиться по ссылке", onClick: () => setModal("link") },
    { icon: Blocks, label: "Добавить виджет", onClick: () => setModal("widget") },
    { icon: MessageCircle, label: "Чат в Telegram", onClick: () => window.open("https://t.me/", "_blank") },
    {
      icon: AppWindow,
      label: os === "win" ? "Интерфейс: Windows" : "Интерфейс: macOS",
      onClick: () => setOs((o) => (o === "win" ? "mac" : "win")),
      active: os === "mac",
    },
  ]

  const toggleWidget = (id: string) =>
    setWidgets((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomWallpaper(`center / cover no-repeat url(${url})`)
      setModal(null)
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
          {/* Brand logo in filled circle */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#a112d6] to-[#4f37d8] shadow-sm">
            <SLogo size={20} />
          </span>
        </div>

        {os === "win" && (
          <div className={`flex items-center gap-4 ${dark ? "text-white/60" : "text-black/50"}`}>
            <Minus className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
            <Square className="h-[14px] w-[14px] cursor-pointer transition-opacity hover:opacity-100" />
            <X className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
          </div>
        )}
      </div>

      {/* Desktop / wallpaper */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 transition-all duration-500" style={{ background: activeWallpaper }} />

        {/* Desktop widgets (top-left) */}
        {widgets.length > 0 && (
          <div className="absolute left-5 top-5 z-10 flex flex-col gap-3">
            {widgets.includes("clock") && (
              <div className="w-40 rounded-2xl bg-black/35 p-4 backdrop-blur-md">
                <p className="text-3xl font-semibold tabular-nums text-white">{time}</p>
                <p className="text-xs text-white/60">Сегодня</p>
              </div>
            )}
            {widgets.includes("weather") && (
              <div className="flex w-40 items-center gap-3 rounded-2xl bg-black/35 p-4 backdrop-blur-md">
                <Cloud className="h-8 w-8 text-white/80" />
                <div>
                  <p className="text-2xl font-semibold text-white">21°</p>
                  <p className="text-xs text-white/60">Облачно</p>
                </div>
              </div>
            )}
            {widgets.includes("calendar") && (
              <div className="w-40 rounded-2xl bg-black/35 p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-wide text-[#e779f5]">Сегодня</p>
                <p className="text-2xl font-semibold text-white">
                  {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </p>
              </div>
            )}
            {widgets.includes("music") && (
              <div className="flex w-40 items-center gap-3 rounded-2xl bg-black/35 p-4 backdrop-blur-md">
                <Music className="h-8 w-8 text-white/80" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">Now Playing</p>
                  <p className="truncate text-xs text-white/60">S Elite Radio</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control pill (top-right) — collapsible */}
        <div className="absolute right-5 top-5 z-20 flex flex-col items-end gap-2">
          <div className="flex items-center gap-4 rounded-full bg-black/45 px-5 py-2.5 backdrop-blur-md">
            {controlsOpen && (
              <>
                <Settings className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
                <Keyboard className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
                <Volume2 className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
                <EyeOff className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
              </>
            )}
            <button
              onClick={() => setControlsOpen((v) => !v)}
              aria-label={controlsOpen ? "Свернуть панель" : "Развернуть панель"}
              className="flex items-center justify-center text-white/90 transition-transform hover:scale-110"
            >
              {controlsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* Expanded quick settings panel (example) */}
          {controlsOpen && (
            <div className="w-64 rounded-2xl bg-black/55 p-4 backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Быстрые настройки</p>
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-white/80">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Громкость</span>
                    <span className="ml-auto text-xs tabular-nums text-white/50">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#a112d6]"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-white/80">
                    <Sun className="h-4 w-4" />
                    <span className="text-xs font-medium">Яркость</span>
                    <span className="ml-auto text-xs tabular-nums text-white/50">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#a112d6]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App grid (centered) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-start gap-6">
            {apps.map((app) => (
              <button key={app.name} className="group flex w-20 flex-col items-center gap-2 outline-none">
                <span className="relative h-[60px] w-[60px] overflow-hidden rounded-[14px] shadow-lg transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                  <Image src={app.icon || "/placeholder.svg"} alt={app.name} fill className="object-cover" />
                </span>
                <span className="text-center text-xs font-medium text-white drop-shadow">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-6 pb-6">
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

          {/* Dock capsule — sized to content */}
          <div className="flex h-14 items-center gap-2 rounded-full bg-black/35 px-3 backdrop-blur-md">
            <div className="flex items-center gap-1">
              {dockItems.map((item) => (
                <DockItem key={item.label} {...item} />
              ))}
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

        {/* ===== Modals ===== */}
        {modal === "configs" && (
          <Modal title="Конфиги игроков" onClose={() => setModal(null)} width="max-w-lg">
            <div className="space-y-2">
              {playerConfigs.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-4 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a112d6] to-[#4f37d8] text-sm font-semibold text-white">
                    {p.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[#e779f5]">
                        {p.tag}
                      </span>
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
          </Modal>
        )}

        {modal === "wallpaper" && (
          <Modal title="Смена обоев" onClose={() => setModal(null)} width="max-w-lg">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {wallpapers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setCustomWallpaper(w.value)
                    setModal(null)
                  }}
                  className="group flex flex-col gap-2 outline-none"
                >
                  <span
                    className="h-24 w-full rounded-xl ring-1 ring-white/10 transition-transform group-hover:scale-105"
                    style={{ background: w.value }}
                  />
                  <span className="text-center text-xs font-medium text-white/80">{w.label}</span>
                </button>
              ))}
              {/* Add own */}
              <button
                onClick={() => fileRef.current?.click()}
                className="group flex flex-col gap-2 outline-none"
              >
                <span className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-white/25 text-white/60 transition-colors group-hover:border-white/50 group-hover:text-white">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="text-center text-xs font-medium text-white/80">Свои обои</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </Modal>
        )}

        {modal === "link" && (
          <Modal title="Присоединиться по ссылке" onClose={() => setModal(null)}>
            <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <Image src="/icons/standoff2.png" alt="Standoff 2" fill className="object-cover" />
              </span>
              <p className="text-xs leading-relaxed text-white/70">
                Вставьте ссылку-приглашение. Мы откроем приложение{" "}
                <span className="font-semibold text-white">Standoff 2</span> и перейдём по этой ссылке внутри игры.
              </p>
            </div>
            <input
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="https://link.standoff2.com/..."
              className="mt-4 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-colors placeholder:text-white/30 focus:ring-[#a112d6]"
            />
            <button
              disabled={!linkValue.trim()}
              onClick={() => setModal(null)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 py-3 text-sm font-semibold text-black transition-colors enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Открыть в Standoff 2
            </button>
          </Modal>
        )}

        {modal === "widget" && (
          <Modal title="Добавить виджет" onClose={() => setModal(null)} width="max-w-md">
            <p className="mb-4 text-xs text-white/60">Выберите виджеты, которые появятся на рабочем столе.</p>
            <div className="grid grid-cols-2 gap-3">
              {widgetCatalog.map((w) => {
                const active = widgets.includes(w.id)
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWidget(w.id)}
                    className={`relative flex items-center gap-3 rounded-xl p-3 text-left outline-none ring-1 transition-colors ${
                      active ? "bg-[#a112d6]/20 ring-[#a112d6]" : "bg-white/5 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
                      <w.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-white">{w.label}</span>
                    {active && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#a112d6] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
