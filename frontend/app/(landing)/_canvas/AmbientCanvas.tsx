"use client"
import { useEffect, useRef } from "react"

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number; a: number
  color: string; phase: number; speed: number
}

const COLORS = [
  "rgba(79,63,240,",    // accent indigo
  "rgba(46,196,160,",   // sage
  "rgba(255,92,92,",    // coral
]

export function AmbientCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx    = canvas.getContext("2d")!
    let particles: Particle[] = []
    let raf: number

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      particles = Array.from({ length: 55 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 0.18,
        vy:    (Math.random() - 0.5) * 0.18,
        r:     Math.random() * 2.5 + 0.5,
        a:     Math.random() * 0.35 + 0.05,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.002,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.phase += p.speed
        if (p.x < -10) p.x = canvas.width  + 10
        if (p.x > canvas.width  + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        const alpha = p.a * (0.5 + 0.5 * Math.sin(p.phase))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + alpha + ")"
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none opacity-60"
    />
  )
}
