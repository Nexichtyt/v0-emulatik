"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Settings,
  Keyboard,
  Volume2,
  EyeOff,
  ChevronDown,
  Minus,
  Square,
  X,
  Sun,
  Moon,
  Users,
  ImageIcon,
  Link2,
  LayoutGrid,
  Send,
  MonitorSmartphone,
} from "lucide-react"

const apps = [
  { name: "Google Play", icon: "/icons/google-play.png" },
  { name: "Standoff 2", icon: "/icons/standoff2.png" },
  { name: "Настройки", icon: "/icons/settings.png" },
  { name: "Файлы", icon: "/icons/files.png" },
]

function Clock() {
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

  return <span className="font-mono tabular-nums">{time}</span>
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
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
      <Icon className="h-[22px] w-[22px] text-white/85 transition-colors group-hover:text-white" />
    </button>
  )
}

export function EmulatorWindow() {
  const [dark, setDark] = useState(true)
  const [os, setOs] = useState<"win" | "mac">("win")

  const dockItems: DockItemProps[] = [
    { icon: Users, label: "Конфиги игроков" },
    { icon: ImageIcon, label: "Смена обоев", onClick: () => setDark((d) => !d) },
    { icon: Link2, label: "Присоединиться по ссылке" },
    { icon: LayoutGrid, label: "Добавить виджет" },
    { icon: Send, label: "Чат в Telegram", onClick: () => window.open("https://t.me/", "_blank") },
    {
      icon: MonitorSmartphone,
      label: os === "win" ? "Интерфейс: Windows" : "Интерфейс: macOS",
      onClick: () => setOs((o) => (o === "win" ? "mac" : "win")),
      active: os === "mac",
    },
  ]

  return (
    <div
      className={`relative flex h-[640px] w-full max-w-[1024px] flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 transition-colors duration-500 ${
        dark ? "ring-white/10" : "ring-black/10"
      }`}
    >
      {/* Title bar */}
      <div
        className={`relative z-20 flex h-9 items-center justify-between px-3 transition-colors duration-500 ${
          dark ? "bg-[#1a1a1c]" : "bg-[#f4f4f6]"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* macOS traffic lights */}
          {os === "mac" && (
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
          )}
          {/* Brand logo in filled circle */}
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-br from-[#a112d6] to-[#4f37d8] shadow-sm">
            <Image
              src="/logo-s-elite.png"
              alt="S Elite"
              width={16}
              height={16}
              className="h-[15px] w-[15px] object-contain"
            />
          </span>
        </div>

        {/* Windows controls (right) */}
        {os === "win" && (
          <div className={`flex items-center gap-4 ${dark ? "text-white/60" : "text-black/50"}`}>
            <ChevronDown className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
            <Minus className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
            <Square className="h-[14px] w-[14px] cursor-pointer transition-opacity hover:opacity-100" />
            <X className="h-4 w-4 cursor-pointer transition-opacity hover:opacity-100" />
          </div>
        )}
      </div>

      {/* Desktop / wallpaper */}
      <div className="relative flex-1 overflow-hidden">
        {/* Dark wallpaper */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${dark ? "opacity-100" : "opacity-0"}`}
          style={{
            background:
              "radial-gradient(120% 90% at 75% 60%, #a112d6 0%, #6312c4 28%, #2a1a8a 52%, #0a0a1f 100%)",
          }}
        />
        {/* Light wallpaper */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${dark ? "opacity-0" : "opacity-100"}`}
          style={{
            background:
              "radial-gradient(120% 100% at 30% 0%, #ffffff 0%, #f6c9f0 18%, #e779f5 42%, #b13cf0 62%, #4f37d8 100%)",
          }}
        />

        {/* Control pill (top-right) */}
        <div className="absolute right-5 top-5 z-10 flex items-center gap-5 rounded-full bg-black/45 px-5 py-2.5 backdrop-blur-md">
          <Settings className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <Keyboard className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <Volume2 className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <EyeOff className="h-5 w-5 cursor-pointer text-white/90 transition-transform hover:scale-110" />
        </div>

        {/* App grid (centered) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-start gap-6">
            {apps.map((app) => (
              <button
                key={app.name}
                className="group flex w-20 flex-col items-center gap-2 outline-none"
              >
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
              onClick={() => setDark(false)}
              aria-label="Светлая тема"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                !dark ? "bg-white/90 text-black" : "text-white/80"
              }`}
            >
              <Sun className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDark(true)}
              aria-label="Тёмная тема"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                dark ? "bg-white/90 text-black" : "text-white/80"
              }`}
            >
              <Moon className="h-5 w-5" />
            </button>
          </div>

          {/* Dock capsule */}
          <div className="flex h-14 flex-1 items-center justify-between rounded-full bg-black/35 px-3 backdrop-blur-md">
            <div className="flex items-center gap-1">
              {dockItems.map((item) => (
                <DockItem key={item.label} {...item} />
              ))}
            </div>
            <div className="flex items-center gap-3 pr-1">
              {/* Divider */}
              <span className="h-7 w-px bg-white/20" />
              {/* Brand logo */}
              <Image
                src="/logo-s-elite.png"
                alt="S Elite"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>

          {/* Clock */}
          <div className="rounded-2xl bg-black/35 px-5 py-2.5 text-2xl font-medium text-white backdrop-blur-md">
            <Clock />
          </div>
        </div>
      </div>
    </div>
  )
}
