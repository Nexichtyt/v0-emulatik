"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  Settings,
  Keyboard,
  Volume2,
  Volume1,
  VolumeX,
  EyeOff,
  Eye,
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
  Magnet,
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

/* full calendar grid for the current month (leading days padded to Monday start) */
function getMonthGrid() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7 // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return { cells, todayDate: today.getDate() }
}

const initialApps: Omit<IconItem, "x" | "y">[] = [
  { id: "play", name: "Google Play", icon: "/icons/google-play.png" },
  { id: "standoff", name: "Standoff 2", icon: "/icons/standoff2.png" },
  { id: "settings", name: "Настройки", icon: "/icons/settings.png" },
  { id: "files", name: "Файлы", icon: "/icons/files.png" },
]

const playerConfigs = [
  { name: "Aiman", tag: "PRO", resolution: "2400 x 1080", aspect: "16:9", sens: "0.85", crosshairShape: "dot" as const, crosshairColor: "#34d399" },
  { name: "Nesko", tag: "FaZe", resolution: "1280 x 960", aspect: "4:3", sens: "1.20", crosshairShape: "cross" as const, crosshairColor: "#facc15" },
  { name: "Solovey", tag: "TOP-1", resolution: "2340 x 1080", aspect: "16:9", sens: "0.65", crosshairShape: "dot" as const, crosshairColor: "#38bdf8" },
  { name: "Murkesh", tag: "MVP", resolution: "1440 x 1080", aspect: "4:3", sens: "0.95", crosshairShape: "cross" as const, crosshairColor: "#f87171" },
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
  weather: { w: 200, h: 120 },
  calendar: { w: 240, h: 160 },
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
const DOCK_RESERVE = 96
const GAP = 12

/* grid-aligned pixel box for a widget spanning cellsW x cellsH cells, leaving a
   consistent gap on every side so neighbouring widgets never touch */
function gridBox(col: number, row: number, cellsW: number, cellsH: number, cellW: number, cellH: number) {
  return {
    x: PAD + col * cellW + GAP / 2,
    y: PAD + row * cellH + GAP / 2,
    w: cellsW * cellW - GAP,
    h: cellsH * cellH - GAP,
  }
}

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
) {
  const { cellW, cellH } = gridInfo(rect.width, rect.height)
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
  const [menu, setMenu] = useState<null | "wallpaper" | "link" | "widget" | "os" | "snap">(null)
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null)
  const [linkValue, setLinkValue] = useState("")
  const [icons, setIcons] = useState<IconItem[]>(
    initialApps.map((a, i) => ({ ...a, x: 360 + i * 100, y: 250 })),
  )
  const [widgets, setWidgets] = useState<WidgetItem[]>([])
  const [dropZone, setDropZone] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [volume, setVolume] = useState(70)
  const [showVolume, setShowVolume] = useState(false)
  const [brightness, setBrightness] = useState(0)
  const [showBrightness, setShowBrightness] = useState(false)
  const [crop, setCropState] = useState<{ src: string; editId?: string } | null>(null)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [showTabs, setShowTabs] = useState(false)
  const [openTabs, setOpenTabs] = useState<{ id: string; name: string; icon: string }[]>([
    { id: "play-1", name: "Google Play", icon: "/icons/google-play.png" },
    { id: "play-2", name: "Google Play", icon: "/icons/google-play.png" },
    { id: "play-3", name: "Google Play", icon: "/icons/google-play.png" },
  ])
  const [activeTab, setActiveTab] = useState("play-2")
  const fileRef = useRef<HTMLInputElement>(null)
  const deskRef = useRef<HTMLDivElement>(null)
  const time = useClock()

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
      if (!snapEnabled) {
        setDropZone(null)
        return
      }
      const s = snapToGrid(rect, nx, ny, w, h)
      const occ = occupiedCells(rect, icons, widgets, id)
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
      const box = cellToBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH, w, h)
      setDropZone({ x: box.cellLeft, y: box.cellTop, w: box.cellW, h: box.cellH })
    }
    const up = (ev: PointerEvent) => {
      const nx = clamp(ox + ev.clientX - sx, 0, rect.width - w)
      const ny = clamp(oy + ev.clientY - sy, 0, rect.height - h)
      if (snapEnabled) {
        const s = snapToGrid(rect, nx, ny, w, h)
        const occ = occupiedCells(rect, icons, widgets, id)
        const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ)
        const target = free ?? { col: s.col, row: s.row }
        const box = cellToBox(target.col, target.row, s.cellsW, s.cellsH, s.cellW, s.cellH, w, h)
        setIcons((prev) => prev.map((it) => (it.id === id ? { ...it, x: box.x, y: box.y } : it)))
      }
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
      if (!snapEnabled) {
        setDropZone(null)
        return
      }
      const s = snapToGrid(rect, nx, ny, item.w, item.h)
      const occ = occupiedCells(rect, icons, widgets, id)
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
      const box = cellToBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH, item.w, item.h)
      setDropZone({ x: box.cellLeft, y: box.cellTop, w: box.cellW, h: box.cellH })
    }
    const up = (ev: PointerEvent) => {
      const nx = clamp(ox + ev.clientX - sx, 0, rect.width - item.w)
      const ny = clamp(oy + ev.clientY - sy, 0, rect.height - item.h)
      if (snapEnabled) {
        const s = snapToGrid(rect, nx, ny, item.w, item.h)
        const occ = occupiedCells(rect, icons, widgets, id)
        const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ)
        const target = free ?? { col: s.col, row: s.row }
        const box = gridBox(target.col, target.row, s.cellsW, s.cellsH, s.cellW, s.cellH)
        setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, x: box.x, y: box.y, w: box.w, h: box.h } : it)))
      }
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
    const rect = deskRef.current?.getBoundingClientRect()
    const item = widgets.find((i) => i.id === id)
    if (!item || !rect) return
    const sx = e.clientX
    const sy = e.clientY
    const ow = item.w
    const oh = item.h
    const { cellW, cellH } = gridInfo(rect.width, rect.height)
    const move = (ev: PointerEvent) => {
      const nw = clamp(ow + ev.clientX - sx, GRID, GRID * 4)
      const nh = clamp(oh + ev.clientY - sy, GRID, GRID * 4)
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, w: nw, h: nh } : it)))
      if (snapEnabled) {
        const cellsW = clamp(Math.round(nw / cellW), 1, 4)
        const cellsH = clamp(Math.round(nh / cellH), 1, 4)
        const col = Math.round((item.x - PAD) / cellW)
        const row = Math.round((item.y - PAD) / cellH)
        const box = gridBox(col, row, cellsW, cellsH, cellW, cellH)
        setDropZone({ x: PAD + col * cellW, y: PAD + row * cellH, w: cellsW * cellW, h: cellsH * cellH })
      }
    }
    const up = (ev: PointerEvent) => {
      const nw = clamp(ow + ev.clientX - sx, GRID, GRID * 4)
      const nh = clamp(oh + ev.clientY - sy, GRID, GRID * 4)
      if (snapEnabled) {
        const cellsW = clamp(Math.round(nw / cellW), 1, 4)
        const cellsH = clamp(Math.round(nh / cellH), 1, 4)
        const col = Math.round((item.x - PAD) / cellW)
        const row = Math.round((item.y - PAD) / cellH)
        const box = gridBox(col, row, cellsW, cellsH, cellW, cellH)
        setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, x: box.x, y: box.y, w: box.w, h: box.h } : it)))
      } else {
        setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, w: nw, h: nh } : it)))
      }
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
      const occ = occupiedCells(rect, icons, widgets, id)
      const free = findFreeCell(s.col, s.row, s.cellsW, s.cellsH, s.cols, s.rows, occ) ?? { col: s.col, row: s.row }
      const box = gridBox(free.col, free.row, s.cellsW, s.cellsH, s.cellW, s.cellH)
      setWidgets((prev) => [
        ...prev,
        { id, type, x: box.x, y: box.y, w: box.w, h: box.h, text: type === "notes" ? "" : undefined },
      ])
      if (type === "photoPng") setTimeout(() => pickFile("image/png", (url) => updatePhoto(id, url)), 50)
      return
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

  function applyCrop(sel: Crop, cellsW: number, cellsH: number) {
    const rect = deskRef.current?.getBoundingClientRect()
    const { cellW, cellH } = rect ? gridInfo(rect.width, rect.height) : { cellW: GRID, cellH: GRID }
    const w = Math.round(cellsW * cellW - GAP)
    const h = Math.round(cellsH * cellH - GAP)
    if (crop?.editId) {
      const id = crop.editId
      setWidgets((prev) => prev.map((it) => (it.id === id ? { ...it, photo: crop.src, crop: sel, w, h } : it)))
    } else {
      const id = `photo-${Date.now()}`
      let pos = { x: snap(40), y: snap(40) }
      if (rect) {
        const occ = occupiedCells(rect, icons, widgets, id)
        const cols = gridInfo(rect.width, rect.height).cols
        const rows = gridInfo(rect.width, rect.height).rows
        const free = findFreeCell(0, 0, cellsW, cellsH, cols, rows, occ) ?? { col: 0, row: 0 }
        const box = gridBox(free.col, free.row, cellsW, cellsH, cellW, cellH)
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
            onClick={() => setShowTabs((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              showTabs
                ? "bg-[#FE7F00] text-white"
                : dark
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-black/60 hover:bg-black/10 hover:text-black"
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

        {/* Window / tab switcher overlay */}
        {showTabs && (
          <div
            className="absolute inset-0 z-[45] flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={() => setShowTabs(false)}
          >
            <div
              className="flex flex-wrap items-center justify-center gap-7 px-10"
              onClick={(e) => e.stopPropagation()}
            >
              {openTabs.map((tab) => (
                <TabPreview
                  key={tab.id}
                  tab={tab}
                  active={tab.id === activeTab}
                  onSelect={() => {
                    setActiveTab(tab.id)
                    setShowTabs(false)
                  }}
                  onClose={() =>
                    setOpenTabs((prev) => {
                      const next = prev.filter((t) => t.id !== tab.id)
                      if (tab.id === activeTab && next.length) setActiveTab(next[0].id)
                      if (!next.length) setShowTabs(false)
                      return next
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

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
            <span className="pointer-events-none w-full truncate text-center text-xs font-medium text-white drop-shadow">
              {app.name}
            </span>
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
              <div className="flex h-full flex-col justify-between p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-semibold leading-none text-white">21°</p>
                    <p className="mt-1 text-xs text-white/60">Облачно</p>
                  </div>
                  <Cloud className="h-7 w-7 shrink-0 text-white/80" />
                </div>
                <div className="flex items-center justify-end text-[10px] text-white/50">
                  <span className="tabular-nums">H:24° L:16°</span>
                </div>
              </div>
            )}
            {w.type === "calendar" &&
              (w.h < 140 ? (
                <div className="flex h-full flex-col justify-center p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FE7F00]">
                    {new Date().toLocaleDateString("ru-RU", { weekday: "long" })}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold leading-none text-white">{new Date().getDate()}</span>
                    <span className="text-sm font-medium capitalize text-white/70">
                      {new Date().toLocaleDateString("ru-RU", { month: "long" })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col p-3">
                  <div className="flex items-baseline justify-between px-0.5">
                    <span className="text-sm font-semibold capitalize text-white">
                      {new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FE7F00]">
                      {new Date().toLocaleDateString("ru-RU", { weekday: "short" })}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-y-0.5">
                    {["П", "В", "С", "Ч", "П", "С", "В"].map((d, i) => (
                      <span key={i} className="text-center text-[8px] font-medium uppercase text-white/35">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 grid flex-1 grid-cols-7 gap-y-0.5">
                    {getMonthGrid().cells.map((day, i) => {
                      const isToday = day === getMonthGrid().todayDate
                      return (
                        <div key={i} className="flex items-center justify-center">
                          {day && (
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ${
                                isToday ? "bg-[#FE7F00] text-white" : "text-white/75"
                              }`}
                            >
                              {day}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            {w.type === "notes" && (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 pb-2 pt-3 text-white/85">
                  <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-[#FE7F00]/90">
                    <StickyNote className="h-2.5 w-2.5 text-white" />
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide">Заметка</span>
                </div>
                <textarea
                  defaultValue={w.text}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setWidgets((prev) => prev.map((it) => (it.id === w.id ? { ...it, text: e.target.value } : it)))
                  }
                  placeholder="Записать..."
                  className="flex-1 resize-none bg-transparent px-3.5 py-2.5 text-xs leading-relaxed text-white/90 outline-none placeholder:text-white/35"
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
              className="absolute bottom-0 right-0 z-10 flex h-6 w-6 cursor-nwse-resize items-end justify-end opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span className="h-5 w-5 rounded-tl-full bg-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.4)]" />
            </span>
          </div>
        ))}

        {/* Control pill (static, top-right) */}
        <div className="absolute right-5 top-3 z-20 flex items-center gap-5 rounded-full bg-black/50 px-5 py-2.5 backdrop-blur-md">
          <Settings className="h-[18px] w-[18px] cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <Keyboard className="h-[18px] w-[18px] cursor-pointer text-white/90 transition-transform hover:scale-110" />
          <div className="relative">
            <button
              onClick={() => setShowVolume((v) => !v)}
              aria-label="Громкость"
              className="flex cursor-pointer items-center text-white/90 transition-transform hover:scale-110"
            >
              {volume === 0 ? (
                <VolumeX className="h-[18px] w-[18px]" />
              ) : volume < 50 ? (
                <Volume1 className="h-[18px] w-[18px]" />
              ) : (
                <Volume2 className="h-[18px] w-[18px]" />
              )}
            </button>
            {showVolume && (
              <>
                <button
                  aria-label="Закрыть громкость"
                  onClick={() => setShowVolume(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-1/2 top-9 z-50 flex translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-black/70 px-3 py-3.5 backdrop-blur-md">
                  <span className="text-[11px] font-medium tabular-nums text-white/90">{volume}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="volume-slider h-28 w-1.5 cursor-pointer appearance-none rounded-full"
                    style={{
                      writingMode: "vertical-lr",
                      direction: "rtl",
                      background: `linear-gradient(to top, #FE7F00 ${volume}%, rgba(255,255,255,0.2) ${volume}%)`,
                    }}
                  />
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-white/70" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-white/70" />
                  )}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowBrightness((v) => !v)}
              aria-label="Видимость"
              className="flex cursor-pointer items-center text-white/90 transition-transform hover:scale-110"
            >
              {brightness === 0 ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
            {showBrightness && (
              <>
                <button
                  aria-label="Закрыть видимость"
                  onClick={() => setShowBrightness(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-1/2 top-9 z-50 flex translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-black/70 px-3 py-3.5 backdrop-blur-md">
                  <span className="text-[11px] font-medium tabular-nums text-white/90">{brightness}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="volume-slider h-28 w-1.5 cursor-pointer appearance-none rounded-full"
                    style={{
                      writingMode: "vertical-lr",
                      direction: "rtl",
                      background: `linear-gradient(to top, #FE7F00 ${brightness}%, rgba(255,255,255,0.2) ${brightness}%)`,
                    }}
                  />
                  {brightness === 0 ? (
                    <EyeOff className="h-4 w-4 text-white/70" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/70" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Click-away layer for popovers (no blur) */}
        {menu && <button aria-label="Закрыть меню" onClick={() => setMenu(null)} className="absolute inset-0 z-30" />}

        {/* Bottom bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-4 px-6 pb-6">
          {/* Theme switch */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/35 p-1.5 backdrop-blur-md">
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
            className="pointer-events-auto absolute bottom-6 left-1/2 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-3 backdrop-blur-md"
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
                      className="mt-2.5 w-full rounded-lg bg-white/5 px-3 py-2 text-xs text-white outline-none ring-1 ring-white/10 transition-colors placeholder:text-white/30 focus:ring-[#FE7F00]"
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
                icon={Magnet}
                label="Привязка к сетке"
                active={menu === "snap"}
                onClick={() => setMenu((m) => (m === "snap" ? null : "snap"))}
              >
                {menu === "snap" && (
                  <Popover title="Привязка к сетке" width={260}>
                    <div className="grid grid-cols-2 gap-2.5">
                      <SnapCard
                        on
                        active={snapEnabled}
                        onClick={() => {
                          setSnapEnabled(true)
                          setMenu(null)
                        }}
                      />
                      <SnapCard
                        on={false}
                        active={!snapEnabled}
                        onClick={() => {
                          setSnapEnabled(false)
                          setMenu(null)
                        }}
                      />
                    </div>
                  </Popover>
                )}
              </DockButton>

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
              <SLogo size={40} />
            </span>
          </div>

          {/* Clock */}
          <div className="pointer-events-auto rounded-full bg-black/35 px-5 py-2.5 text-2xl font-medium text-white backdrop-blur-md">
            <span className="font-sf tabular-nums">{time}</span>
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
                      {p.name.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                        <span className="rounded-full bg-[#FE7F00]/15 px-2 py-0.5 text-[10px] font-medium text-[#FE7F00]">{p.tag}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3.5 w-3.5" /> {p.resolution}
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">{p.aspect}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer2 className="h-3.5 w-3.5" /> Сенса {p.sens}
                        </span>
                      </div>
                    </div>
                    <CrosshairPreview shape={p.crosshairShape} color={p.crosshairColor} />
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
        {crop && (
          <CropModal
            src={crop.src}
            cellAspect={(() => {
              const rect = deskRef.current?.getBoundingClientRect()
              if (!rect) return 1
              const { cellW, cellH } = gridInfo(rect.width, rect.height)
              return cellW / cellH
            })()}
            onCancel={() => setCropState(null)}
            onApply={applyCrop}
          />
        )}
      </div>
    </div>
  )
}

function TabPreview({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: { id: string; name: string; icon: string }
  active: boolean
  onSelect: () => void
  onClose: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative flex w-60 flex-col overflow-hidden rounded-xl bg-[#16161e] text-left outline-none ring-2 transition-all duration-200 hover:scale-[1.03] ${
        active ? "ring-[#FE7F00] shadow-[0_0_22px_rgba(254,127,0,0.55)]" : "ring-white/10 hover:ring-white/30"
      }`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-[4px]">
          <Image src={tab.icon || "/placeholder.svg"} alt="" fill className="object-cover" />
        </span>
        <span className="truncate text-sm font-medium text-white">{tab.name}</span>
        <span
          role="button"
          tabIndex={0}
          aria-label="Закрыть вкладку"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded-md text-white/50 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </span>
      </div>
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        <Image src="/previews/google-play.png" alt={`${tab.name} preview`} fill className="object-cover" />
      </div>
    </button>
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
        active ? "bg-[#FE7F00]/20 ring-[#FE7F00]" : "bg-white/5 ring-white/10 hover:bg-white/10"
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

function SnapCard({ on, active, onClick }: { on: boolean; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-xl p-2.5 outline-none ring-1 transition-colors ${
        active ? "bg-[#FE7F00]/20 ring-[#FE7F00]" : "bg-white/5 ring-white/10 hover:bg-white/10"
      }`}
    >
      <span className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-[#222]">
        {on ? (
          <span
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          />
        ) : null}
        <span
          className={`relative h-4 w-4 rounded bg-white/85 ${on ? "" : "rotate-[14deg] translate-x-1.5 -translate-y-0.5"}`}
        />
      </span>
      <span className="text-xs font-medium text-white">{on ? "Включена" : "Выключена"}</span>
    </button>
  )
}

/* Lets the user pick the visible region of a photo. The chosen zone defines the
   widget's aspect ratio (and thus its size); afterwards it can be freely moved/resized. */
function CrosshairPreview({ shape, color }: { shape: "dot" | "cross"; color: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/40 ring-1 ring-white/10">
      <svg width="22" height="22" viewBox="0 0 22 22">
        {shape === "dot" ? (
          <circle cx="11" cy="11" r="2.5" fill={color} />
        ) : (
          <g stroke={color} strokeWidth="2" strokeLinecap="round">
            <line x1="11" y1="3" x2="11" y2="8" />
            <line x1="11" y1="14" x2="11" y2="19" />
            <line x1="3" y1="11" x2="8" y2="11" />
            <line x1="14" y1="11" x2="19" y2="11" />
          </g>
        )}
      </svg>
    </span>
  )
}

function CropModal({
  src,
  cellAspect,
  onCancel,
  onApply,
}: {
  src: string
  cellAspect: number
  onCancel: () => void
  onApply: (sel: Crop, cellsW: number, cellsH: number) => void
}) {
  const [sel, setSel] = useState<Crop>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [blocks, setBlocks] = useState({ w: 2, h: 2 })
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

  // choose a block span (cellsW x cellsH); the crop selection adopts the matching
  // pixel aspect ratio so the photo fills exactly that many desktop blocks
  function preset(cw: number, ch: number) {
    setBlocks({ w: cw, h: ch })
    const targetAspect = (cw * cellAspect) / ch // selW/selH in pixels = (cw*cellW)/(ch*cellH)
    const r = (targetAspect * nat.current.h) / nat.current.w // selW/selH in fractions
    let h = 0.8
    let w = h * r
    if (w > 1) {
      w = 1
      h = w / r
    }
    setSel({ x: (1 - w) / 2, y: (1 - h) / 2, w, h })
  }

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
              className="absolute cursor-move overflow-hidden ring-2 ring-[#FE7F00]"
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

          <div className="mt-4">
            <span className="text-[11px] text-white/50">Размер (блоки):</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { w: 1, h: 1 },
                { w: 2, h: 1 },
                { w: 2, h: 2 },
                { w: 3, h: 2 },
                { w: 2, h: 3 },
                { w: 4, h: 2 },
              ].map((b) => {
                const active = blocks.w === b.w && blocks.h === b.h
                return (
                  <button
                    key={`${b.w}x${b.h}`}
                    onClick={() => preset(b.w, b.h)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                      active
                        ? "bg-[#FE7F00] text-white ring-[#FE7F00]"
                        : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {b.w}×{b.h}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="rounded-lg bg-white/5 px-4 py-2 text-xs font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10">
              Отмена
            </button>
            <button
              onClick={() => onApply(sel, blocks.w, blocks.h)}
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
