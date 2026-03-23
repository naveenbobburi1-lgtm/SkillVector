"use client"
import { useEffect, useRef } from "react"

interface Star {
  x: number; y: number; r: number
  a: number; speed: number; phase: number
}

export function Starfield({ isDark = true }: { isDark?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext("2d")!
    let raf: number
    let stars: Star[] = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      stars = Array.from({ length: 160 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.2 + 0.1,
        a:     Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.01 + 0.003,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach((s) => {
        s.phase += s.speed
        const alpha = s.a * (0.35 + 0.65 * Math.abs(Math.sin(s.phase)))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        // light theme: use dark dots; dark theme: use white dots
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha})`
          : `rgba(0,0,0,${alpha * 0.25})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [isDark])

  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}
