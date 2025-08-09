"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/LanguageContext"
import type { ChildProfile } from "./child-types"

// Shared draw function for preview and download [^2].
export function drawNimiGlory(canvas: HTMLCanvasElement, child: ChildProfile, badge: string) {
  const ctx = canvas.getContext("2d")!
  const size = 720
  canvas.width = size
  canvas.height = size

  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, "#FDE68A")
  grad.addColorStop(1, "#A78BFA")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  ctx.beginPath()
  ctx.arc(cx, cy, r + 16, 0, Math.PI * 2)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = "#F5F3FF"
  ctx.fill()

  ctx.lineWidth = 10
  ctx.strokeStyle = "#7C3AED"
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  const drawStar = (x: number, y: number, s: number, color: string) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-Math.PI / 10)
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(0, 0 - s)
      ctx.translate(0, 0 - s)
      ctx.rotate((Math.PI * 2) / 10)
      ctx.lineTo(0, 0 - s / 2.5)
      ctx.translate(0, 0 - s / 2.5)
      ctx.rotate((Math.PI * 2) / 10)
    }
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }
  drawStar(cx - r * 0.8, cy - r * 0.6, 18, "#F59E0B")
  drawStar(cx + r * 0.7, cy - r * 0.7, 14, "#F59E0B")
  drawStar(cx - r * 0.7, cy + r * 0.6, 12, "#F59E0B")

  const initial = (child.name?.[0] || "?").toUpperCase()
  ctx.fillStyle = "#7C3AED"
  ctx.font = `${r * 0.9}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.globalAlpha = 0.08
  ctx.fillText(initial, cx, cy)
  ctx.globalAlpha = 1

  ctx.fillStyle = "#111827"
  ctx.font = `bold ${Math.floor(r * 0.22)}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
  ctx.fillText("Nimi Glory", cx, cy - r * 0.15)

  ctx.fillStyle = "#6D28D9"
  ctx.font = `bold ${Math.floor(r * 0.18)}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
  ctx.fillText(badge, cx, cy + r * 0.1)

  ctx.fillStyle = "#374151"
  ctx.font = `${Math.floor(r * 0.1)}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
  ctx.fillText(`${child.name}`, cx, cy + r * 0.38)
}

export function MiniGloryStickerButton({
  child,
  badge,
  language,
}: {
  child: ChildProfile
  badge: string
  language: "en" | "sw" | "fr" | "es" | "rw"
}) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const generatePng = async () => {
    const canvas = canvasRef.current!
    drawNimiGlory(canvas, child, badge)
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `${child.name}-Nimi-Glory-Week.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div>
      <Button variant="outline" onClick={generatePng}>
        {t("downloadSticker")}
      </Button>
      <canvas ref={canvasRef} width={720} height={720} className="hidden" />
    </div>
  )
}