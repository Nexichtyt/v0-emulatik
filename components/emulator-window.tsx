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
  Cloud,
  Calendar,
  ImagePlus,
  Sparkles,
  Layers,
  StickyNote,
  Check,
  Trash2,
} from "lucide-react"

type IconItem = { id: string; name: string; icon: string; x: number; y: number }
type WidgetType = "weather" | "calendar" | "notes" | "photo" | "photoPng"
type Crop = { x: number; y: number; w: number; h: number }
type WidgetItem = {
  id: string
  type: WidgetType
  x: number
  y: number
  w: number
  h: number
  photo?: string
  crop?: Crop
  text?: string
}

const GRID = 84

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
  { type: "weather", label: "Погода", icon: Cloud },
  { type: "calendar", label: "Календарь", icon: Calendar },
  { type: "notes", label: "Заметки", icon: StickyNote },
  { type: "photo", label: "Фото", icon: ImageIcon },
  { type: "photoPng", label: "Фото PNG", icon: ImagePlus },
]

const widgetDefaults: Record<WidgetType, { w: number; h: number }> = {
  weather: { w: 200, h: 100 },
  calendar: { w: 200, h: 100 },
  notes: { w: 200, h: 200 },
  photo: { w: 200, h: 200 },
  photoPng: { w: 100, h: 100 },
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

/* Crowned "S" brand mark */
function SLogo({ size }: { size: number }) {
  return (
    <img
      src="/logo-s-crown.png"
      alt="S Elite"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  )
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const snap = (v: number) => Math.round(v / GRID) * GRID

/* iOS-style grid: fixed ~25px padding on every edge, cell size flexes so the
   columns/rows fill the desktop evenly. The dock area at the bottom is reserved. */
const PAD = 25
const DOCK_RESERVE = 12

function gridInfo(width: number, height: number) {
  const innerW = width - PAD * 2
  const innerH = height - PAD * 2 - DOCK_RESERVE
  // force an even number of columns so the screen center falls on a cell
  // boundary -> the gap between the 2nd and 3rd app can sit dead center
  let cols = Math.max(2, Math.round(innerW / GRID))
  if (cols % 2 !== 0) cols += 1
  const rows = Math.max(1, Math.round(innerH / GRID))
  const cellW = innerW / cols
  const cellH = innerH / rows
  return { cols, rows, cellW, cellH }
}

function snapToGrid(rect: { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const { cols, rows, cellW, cellH } = gridInfo(rect.width, rect.height)
  const cellsW = Math.max(1, Math.round(w / cellW))
  const cellsH = Math.max(1, Math.round(h / cellH))
  const cx = x + w / 2
  const cy = y + h / 2
  // top-left cell index the element should occupy, keeping it fully on-grid
  let col = Math.round((cx - PAD - (cellsW * cellW) / 2) / cellW)
  let row = Math.round((cy - PAD - (cellsH * cellH) / 2) / cellH)
  col = clamp(col, 0, cols - cellsW)
  row = clamp(row, 0, rows - cellsH)
  return { col, row, cellsW, cellsH, cellW, cellH, cols, rows }
}

/* pixel position + highlight rect for a given cell range */
function cellToBox(col: number, row: number, cellsW: number, cellsH: number, cellW: number, cellH: number, w: number, h: number) {
  const cellLeft = PAD + col * cellW
  const cellTop = PAD + row * cellH
  const blockW = cellsW * cellW
  const blockH = cellsH * cellH
  return {
    x: cellLeft + (blockW - w) / 2,
    y: cellTop + (blockH - h) / 2,
    cellLeft,
    cellTop,
    cellW: blockW,
    cellH: blockH,
  }
}

/* set of occupied "col,row" cells for every item except the one being moved */
function occupiedCells(
  rect: { width: number; height: number },
  icons: IconItem[],
  widgets: WidgetItem[],
  excludeId: string,
  dock?: { left: number; top: number; right: number; bottom: number } | null,
) {
  const { cols, rows, cellW, cellH } = gridInfo(rect.width, rect.height)
  const set = new Set<string>()
  const add = (x: number, y: number, w: number, h: number) => {
    const col = Math.round((x + w / 2 - PAD - (Math.max(1, Math.round(w / cellW)) * cellW) / 2) / cellW)
    const row = Math.round((y + h / 2 - PAD - (Math.max(1, Math.round(h / cellH)) * cellH) / 2) / cellH)
    const cw = Math.max(1, Math.round(w / cellW))
    const ch = Math.max(1, Math.round(h / cellH))
    for (let c = col; c < col + cw; c++) for (let r = row; r < row + ch; r++) set.add(`${c},${r}`)
  }
  icons.forEach((i) => i.id !== excludeId && add(i.x, i.y, 80, 88))
  widgets.forEach((w) => w.id !== excludeId && add(w.x, w.y, w.w, w.h))
  // block only the cells that actually overlap the dock capsule
  if (dock) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cl = PAD + c * cellW
        const ct = PAD + r * cellH
        const overlap =
          cl < dock.right && cl + cellW > dock.left && ct < dock.bottom && ct + cellH > dock.top
        if (overlap) set.add(`${c},${r}`)
      }
    }
  }
  return set
}

/* nearest free top-left cell for a span, searching outward in rings */
function findFreeCell(
  startCol: number,
  startRow: number,
  cellsW: number,
  cellsH: number,
  cols: number,
  rows: number,
  occupied: Set<string>,
) {
  const fits = (col: number, row: number) => {
    if (col < 0 || row < 0 || col + cellsW > cols || row + cellsH > rows) return false
    for (let c = col; c < col + cellsW; c++) for (let r = row; r < row + cellsH; r++) if (occupied.has(`${c},${r}`)) return false
    return true
  }
  if (fits(startCol, startRow)) return { col: startCol, row: startRow }
  const maxRing = cols + rows
  for (let ring = 1; ring <= maxRing; ring++) {
    for (let dc = -ring; dc <= ring; dc++) {
      for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue
        if (fits(startCol + dc, startRow + dr)) return { col: startCol + dc, row: startRow + dr }
      }
    }
  }
  return null
}

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
  const [dropZone, setDropZone] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [crop, setCropState] = useState<{ src: string; editId?: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const deskRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const time = useClock()

  /* dock capsule bounds relative to the desktop, used to block overlapping cells */
  const getDockRect = () => {
    const desk = deskRef.current?.getBoundingClientRect()
    const dock = dockRef.current?.getBoundingClientRect()
    if (!desk || !dock) return null
    return {
      left: dock.left - desk.left,
      top: dock.top - desk.top,
      right: dock.right - desk.left,
      bottom: dock.bottom - desk.top,
    }
  }

  const activeWallpaper = customWallpaper ?? (dark ? wallpapers[0].value : wallpapers[1].value)

  /* Align the initial app icons to the centered grid once the desktop is measured */
  useEffect(() => {
    const rect = deskRef.current?.getBoundingClientRect()
    if (!rect) return
    const { cols, rows, cellW, cellH } = gridInfo(rect.width, rect.height)
    const iconW = 80
    const iconH = 88
    const n = initialApps.length
    const startCol = Math.max(0, Math.round((cols - n) / 2))
    const row = Math.max(0, Math.round(rows / 2) - 1)
    setIcons((prev) =>
      prev.map((it, i) => ({
        ...it,
        x: PAD + (startCol + i) * cellW + (cellW - iconW) / 2,
        y: PAD + row * cellH + (cellH - iconH) / 2,
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- drag & resize (with snap on drop) ---- */
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
      const s = snapToGrid(rect, nx, ny, w, h)
      const occ = occupiedCells(rect, icons, widgets, id, getDockRect())
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
      const box = cellToBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH, w, h)
      setDropZone({ x: box.cellLeft, y: box.cellTop, w: box.cellW, h: box.cellH })
    }
    const up = (ev: PointerEvent) => {
      const nx = clamp(ox + ev.clientX - sx, 0, rect.width - w)
      const ny = clamp(oy + ev.clientY - sy, 0, rect.height - h)
      const s = snapToGrid(rect, nx, ny, w, h)
      const occ = occupiedCells(rect, icons, widgets, id, getDockRect())
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ)
      const target = free ?? { col: s.col, row: s.row }
      const box = cellToBox(target.col, target.row, s.cellsW, s.cellsH, s.cellW, s.cellH, w, h)
      setIcons((prev) => prev.map((it) => (it.id === id ? { ...it, x: box.x, y: box.y } : it)))
      setDropZone(null)
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
      const s = snapToGrid(rect, nx, ny, item.w, item.h)
      const occ = occupiedCells(rect, icons, widgets, id, getDockRect())
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
      const box = cellToBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH, item.w, item.h)
      setDropZone({ x: box.cellLeft, y: box.cellTop, w: box.cellW, h: box.cellH })
    }
    const up = (ev: PointerEvent) => {
      const nx = clamp(ox + ev.clientX - sx, 0, rect.width - item.w)
      const ny = clamp(oy + ev.clientY - sy, 0, rect.height - item.h)
      const s = snapToGrid(rect, nx, ny, item.w, item.h)
      const occ = occupiedCells(rect, icons, widgets, id, getDockRect())
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ)
      const target = free ?? { col: s.col, row: s.row }
      const box = cellToBox(target.col, target.row, s.cellsW, s.cellsH, s.cellW, s.cellH, item.w, item.h)
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, x: box.x, y: box.y } : it)))
      setDropZone(null)
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
      const nw = clamp(ow + ev.clientX - sx, GRID, GRID * 4)
      const nh = clamp(oh + ev.clientY - sy, GRID, GRID * 4)
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, w: nw, h: nh } : it)))
      const cw = clamp(snap(nw), GRID, GRID * 4)
      const ch = clamp(snap(nh), GRID, GRID * 4)
      setDropZone({ x: item.x, y: item.y, w: cw, h: ch })
    }
    const up = (ev: PointerEvent) => {
      const nw = clamp(snap(ow + ev.clientX - sx), GRID, GRID * 4)
      const nh = clamp(snap(oh + ev.clientY - sy), GRID, GRID * 4)
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, w: nw, h: nh } : it)))
      setDropZone(null)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function addWidget(type: WidgetType) {
    setMenu(null)
    if (type === "photo") {
      pickFile("image/*", (url) => setCropState({ src: url }))
      return
    }
    const def = widgetDefaults[type]
    const id = `${type}-${Date.now()}`
    const rect = deskRef.current?.getBoundingClientRect()
    let pos = { x: 40 + widgets.length * GRID, y: 40 + widgets.length * GRID }
    if (rect) {
      const s = snapToGrid(rect, pos.x, pos.y, def.w, def.h)
      const occ = occupiedCells(rect, icons, widgets, id, getDockRect())
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
      const box = cellToBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH, def.w, def.h)
      pos = { x: box.x, y: box.y }
    }
    setWidgets((prev) => [
      ...prev,
      { id, type, x: pos.x, y: pos.y, w: def.w, h: def.h, text: type === "notes" ? "" : undefined },
    ])
    if (type === "photoPng") setTimeout(() => pickFile("image/png", (url) => updatePhoto(id, url)), 50)
  }

  function removeWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }

  function pickFile(accept: string, cb: (url: string) => void) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = () => {
      const f = input.files?.[0]
      if (f) cb(URL.createObjectURL(f))
    }
    input.click()
  }

  function updatePhoto(id: string, url: string) {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, photo: url } : w)))
  }

  function applyCrop(sel: Crop, aspect: number) {
    let w = 200
    let h = Math.round(w / aspect)
    if (h > 280) {
      h = 280
      w = Math.round(h * aspect)
    }
    if (h < 90) {
      h = 90
      w = Math.round(h * aspect)
    }
    w = clamp(w, 120, 380)
    if (crop?.editId) {
      const id = crop.editId
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, photo: crop.src, crop: sel, w, h } : it)))
    } else {
      const id = `photo-${Date.now()}`
      const rect = deskRef.current?.getBoundingClientRect()
      let pos = { x: snap(40), y: snap(40) }
      if (rect) {
        const s = snapToGrid(rect, pos.x, pos.y, w, h)
        const occ = occupiedCells(rect, icons, widgets, id, getDockRect())
        const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
        const box = cellToBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH, w, h)
        pos = { x: box.x, y: box.y }
      }
      setWidgets((prev) => [...prev, { id, type: "photo", x: pos.x, y: pos.y, w, h, photo: crop!.src, crop: sel }])
    }
    setCropState(null)
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
          <button
            aria-label="Приложения"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-black/60 hover:bg-black/10 hover:text-black"
            }`}
          >
            <Layers className="h-[18px] w-[18px]" />
          </button>
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

        {/* Drop zone highlight (only the cell where the item will land) */}
        {dropZone && (
          <div
            className="pointer-events-none absolute z-[1] rounded-2xl border-2 border-white/60 bg-white/10 backdrop-blur-[1px]"
            style={{
              left: dropZone.x,
              top: dropZone.y,
              width: dropZone.w,
              height: dropZone.h,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.15), inset 0 0 20px rgba(255,255,255,0.15)",
            }}
          />
        )}

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
            className={`group absolute cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing ${
              w.type === "photoPng" ? "" : "bg-black/35 backdrop-blur-md ring-1 ring-white/10"
            }`}
          >
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
            {w.type === "notes" && (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-1.5 px-3 pt-2.5 text-[#e779f5]">
                  <StickyNote className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold">Заметка</span>
                </div>
                <textarea
                  defaultValue={w.text}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setWidgets((prev) => prev.map((it) => (it.id === w.id ? { ...it, text: e.target.value } : it)))
                  }
                  placeholder="Записать..."
                  className="flex-1 resize-none bg-transparent px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/40"
                />
              </div>
            )}
            {w.type === "photo" && (
              <div className="relative h-full w-full">
                {w.photo ? (
                  w.crop ? (
                    <img
                      src={w.photo || "/placeholder.svg"}
                      alt="Виджет фото"
                      className="pointer-events-none"
                      style={{
                        position: "absolute",
                        maxWidth: "none",
                        width: `${100 / w.crop.w}%`,
                        height: `${100 / w.crop.h}%`,
                        left: `${(-w.crop.x * 100) / w.crop.w}%`,
                        top: `${(-w.crop.y * 100) / w.crop.h}%`,
                      }}
                    />
                  ) : (
                    <img src={w.photo || "/placeholder.svg"} alt="Виджет фото" className="pointer-events-none h-full w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
                    <ImageIcon className="h-7 w-7" />
                    <span className="text-xs">Фото</span>
                  </div>
                )}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => pickFile("image/*", (url) => setCropState({ src: url, editId: w.id }))}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/75 group-hover:opacity-100"
                  aria-label="Сменить фото"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {w.type === "photoPng" && (
              <div className="relative h-full w-full">
                {w.photo ? (
                  <img src={w.photo || "/placeholder.svg"} alt="Виджет PNG" className="pointer-events-none h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-black/25 text-white/60 ring-1 ring-dashed ring-white/20">
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs">PNG</span>
                  </div>
                )}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => pickFile("image/png", (url) => updatePhoto(w.id, url))}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/75 group-hover:opacity-100"
                  aria-label="Сменить PNG"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
              </div>
            )}
            {/* delete button */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeWidget(w.id)}
              className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-red-500/80 group-hover:opacity-100"
              aria-label="Удалить виджет"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {/* resize handle */}
            <span
              onPointerDown={(e) => startResize(e, w.id)}
              className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-nwse-resize opacity-0 transition-opacity group-hover:opacity-100"
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

          {/* Dock capsule - absolutely centered on screen */}
          <div
            ref={dockRef}
            className="absolute bottom-6 left-1/2 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-3 backdrop-blur-md"
          >
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
                label="Пр��соединиться по ссылке"
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

        {/* Photo crop / zone selector */}
        {crop && <CropModal src={crop.src} onCancel={() => setCropState(null)} onApply={applyCrop} />}
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

/* Lets the user pick the visible region of a photo. The chosen zone defines the
   widget's aspect ratio (and thus its size); afterwards it can be freely moved/resized. */
function CropModal({ src, onCancel, onApply }: { src: string; onCancel: () => void; onApply: (sel: Crop, aspect: number) => void }) {
  const [sel, setSel] = useState<Crop>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const nat = useRef({ w: 1, h: 1 })
  const boxRef = useRef<HTMLDivElement>(null)

  function startMove(e: React.PointerEvent) {
    e.preventDefault()
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX
    const sy = e.clientY
    const o = { ...sel }
    const move = (ev: PointerEvent) => {
      const nx = clamp(o.x + (ev.clientX - sx) / rect.width, 0, 1 - o.w)
      const ny = clamp(o.y + (ev.clientY - sy) / rect.height, 0, 1 - o.h)
      setSel((s) => ({ ...s, x: nx, y: ny }))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX
    const sy = e.clientY
    const o = { ...sel }
    const move = (ev: PointerEvent) => {
      const nw = clamp(o.w + (ev.clientX - sx) / rect.width, 0.15, 1 - o.x)
      const nh = clamp(o.h + (ev.clientY - sy) / rect.height, 0.15, 1 - o.y)
      setSel((s) => ({ ...s, w: nw, h: nh }))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function preset(aspect: number) {
    // aspect = w/h in pixels; convert to fraction box centered in the image
    const r = (aspect * nat.current.h) / nat.current.w // selW/selH in fractions
    let h = 0.8
    let w = h * r
    if (w > 1) {
      w = 1
      h = w / r
    }
    setSel({ x: (1 - w) / 2, y: (1 - h) / 2, w, h })
  }

  const aspect = (sel.w * nat.current.w) / (sel.h * nat.current.h)

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
      <button aria-label="Отмена" onClick={onCancel} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#16161e]/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-white">Выберите зону</h2>
          <button
            onClick={onCancel}
            aria-label="Закрыть"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div ref={boxRef} className="relative mx-auto w-fit select-none overflow-hidden rounded-lg">
            <img
              src={src || "/placeholder.svg"}
              alt="Кадрирование"
              onLoad={(e) => {
                nat.current = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight }
              }}
              className="pointer-events-none max-h-[280px] w-auto max-w-full"
            />
            {/* dimmed mask */}
            <div className="pointer-events-none absolute inset-0 bg-black/50" />
            {/* selection window */}
            <div
              onPointerDown={startMove}
              style={{
                left: `${sel.x * 100}%`,
                top: `${sel.y * 100}%`,
                width: `${sel.w * 100}%`,
                height: `${sel.h * 100}%`,
              }}
              className="absolute cursor-move overflow-hidden ring-2 ring-white"
            >
              <img
                src={src || "/placeholder.svg"}
                alt=""
                className="pointer-events-none absolute"
                style={{
                  maxWidth: "none",
                  width: `${100 / sel.w}%`,
                  height: `${100 / sel.h}%`,
                  left: `${(-sel.x * 100) / sel.w}%`,
                  top: `${(-sel.y * 100) / sel.h}%`,
                }}
              />
              <span
                onPointerDown={startResize}
                className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize bg-white"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[11px] text-white/50">Формат:</span>
            <button onClick={() => preset(1)} className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/80 ring-1 ring-white/10 hover:bg-white/10">1:1</button>
            <button onClick={() => preset(4 / 3)} className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/80 ring-1 ring-white/10 hover:bg-white/10">4:3</button>
            <button onClick={() => preset(16 / 9)} className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/80 ring-1 ring-white/10 hover:bg-white/10">16:9</button>
            <button onClick={() => preset(9 / 16)} className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/80 ring-1 ring-white/10 hover:bg-white/10">9:16</button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="rounded-lg bg-white/5 px-4 py-2 text-xs font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10">
              Отмена
            </button>
            <button
              onClick={() => onApply(sel, aspect)}
              className="flex items-center gap-1.5 rounded-lg bg-white/90 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white"
            >
              <Check className="h-3.5 w-3.5" />
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
