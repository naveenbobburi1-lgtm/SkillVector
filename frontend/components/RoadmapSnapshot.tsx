"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LearningPathStage, MetaData } from "../app/(main)/learning-path/types";

interface Props {
  stages: LearningPathStage[];
  meta: MetaData;
}

// ─── Layout tokens ─────────────────────────────────────────────────────────────
const CARD_W = 300;
const CARD_H = 330;
const STAGE_SPACING = 380;
const TRACK_Y = 460;
const NODE_R = 26;
const CARD_GAP = 24;

// ─── Phase accent colours (vivid but work on light bg) ────────────────────────
const PHASE_ACCENTS = [
  { primary: "#7c3aed", light: "#ede9fe", mid: "#8b5cf6", text: "#5b21b6" }, // violet
  { primary: "#0891b2", light: "#e0f2fe", mid: "#0ea5e9", text: "#0369a1" }, // cyan
  { primary: "#d97706", light: "#fef3c7", mid: "#f59e0b", text: "#b45309" }, // amber
  { primary: "#059669", light: "#d1fae5", mid: "#10b981", text: "#047857" }, // emerald
  { primary: "#db2777", light: "#fce7f3", mid: "#ec4899", text: "#be185d" }, // pink
  { primary: "#dc2626", light: "#fee2e2", mid: "#ef4444", text: "#b91c1c" }, // red
];

const phaseAccent = (i: number) => PHASE_ACCENTS[i % PHASE_ACCENTS.length];

// ─── Thin top-border progress indicator per card ─────────────────────────────
const PHASE_GRADIENTS = [
  "linear-gradient(90deg, #7c3aed, #a78bfa)",
  "linear-gradient(90deg, #0891b2, #38bdf8)",
  "linear-gradient(90deg, #d97706, #fbbf24)",
  "linear-gradient(90deg, #059669, #34d399)",
  "linear-gradient(90deg, #db2777, #f472b6)",
  "linear-gradient(90deg, #dc2626, #f87171)",
];
const phaseGrad = (i: number) => PHASE_GRADIENTS[i % PHASE_GRADIENTS.length];

// ─── SVG Rail ─────────────────────────────────────────────────────────────────
function TrackRail({ totalWidth, stages }: { totalWidth: number; stages: LearningPathStage[] }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={totalWidth}
      height={TRACK_Y * 2 + 60}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="rail-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0" />
          <stop offset="10%" stopColor="#e5e7eb" />
          <stop offset="90%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rail-active" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
          <stop offset="15%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="85%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Shadow rail */}
      <rect x={80} y={TRACK_Y + 1} width={totalWidth - 160} height={2} fill="#e5e7eb" rx={1} opacity={0.6} />
      {/* Main rail */}
      <rect x={80} y={TRACK_Y - 1} width={totalWidth - 160} height={2} fill="url(#rail-line)" rx={1} />
      {/* Primary glow rail */}
      <rect x={80} y={TRACK_Y - 1} width={totalWidth - 160} height={2} fill="url(#rail-active)" rx={1} />

      {/* Animated tick marks */}
      <motion.line
        x1={80} y1={TRACK_Y}
        x2={totalWidth - 80} y2={TRACK_Y}
        stroke="#7c3aed"
        strokeWidth={1}
        strokeOpacity={0.12}
        strokeDasharray="1 32"
        animate={{ strokeDashoffset: [0, -33] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />

      {/* Vertical stem: node ↔ card */}
      {stages.map((_, i) => {
        const x = STAGE_SPACING * (i + 1);
        const isTop = i % 2 === 0;
        const stemTop = isTop
          ? TRACK_Y - NODE_R - CARD_GAP - CARD_H
          : TRACK_Y + NODE_R;
        const stemH = CARD_GAP + CARD_H;
        const ac = phaseAccent(i);
        return (
          <motion.line
            key={i}
            x1={x} y1={isTop ? stemTop : TRACK_Y + NODE_R}
            x2={x} y2={isTop ? TRACK_Y - NODE_R : TRACK_Y + NODE_R + stemH}
            stroke={ac.primary}
            strokeWidth={1}
            strokeOpacity={0.15}
            strokeDasharray="3 5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 + 0.4 }}
          />
        );
      })}
    </svg>
  );
}

// ─── Node ─────────────────────────────────────────────────────────────────────
function StageNode({
  index, stage, x, isActive, onClick,
}: {
  index: number; stage: LearningPathStage; x: number; isActive: boolean; onClick: () => void;
}) {
  const ac = phaseAccent(index);

  return (
    <motion.div
      className="absolute -translate-x-1/2 cursor-pointer z-20"
      style={{ left: x, top: TRACK_Y - NODE_R }}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 220, damping: 20 }}
      onClick={onClick}
    >
      {/* Ripple when active */}
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: -12, background: ac.light, border: `1.5px solid ${ac.primary}30` }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: -22, border: `1px solid ${ac.primary}20` }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Node body */}
      <motion.div
        className="relative flex items-center justify-center rounded-full select-none"
        style={{
          width: NODE_R * 2,
          height: NODE_R * 2,
          background: isActive
            ? `linear-gradient(135deg, ${ac.primary}, ${ac.mid})`
            : "white",
          border: `2px solid ${isActive ? "transparent" : ac.primary + "40"}`,
          boxShadow: isActive
            ? `0 0 0 3px ${ac.light}, 0 8px 24px ${ac.primary}30`
            : `0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px ${ac.primary}15`,
        }}
        whileHover={{ scale: 1.08, boxShadow: `0 0 0 4px ${ac.light}, 0 8px 24px ${ac.primary}25` }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 340, damping: 22 }}
      >
        {/* Arc ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${NODE_R * 2} ${NODE_R * 2}`}>
          <circle cx={NODE_R} cy={NODE_R} r={NODE_R - 3} fill="none"
            stroke={isActive ? "rgba(255,255,255,0.3)" : ac.primary + "20"}
            strokeWidth={2}
          />
          <circle cx={NODE_R} cy={NODE_R} r={NODE_R - 3} fill="none"
            stroke={isActive ? "rgba(255,255,255,0.8)" : ac.primary}
            strokeWidth={2}
            strokeOpacity={isActive ? 0.8 : 0.5}
            strokeDasharray={`${Math.min(stage.duration_months / 6, 1) * 2 * Math.PI * (NODE_R - 3)} 999`}
            strokeLinecap="round"
          />
        </svg>

        <span
          className="font-black text-[12px] z-10"
          style={{
            color: isActive ? "white" : ac.primary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </motion.div>

      {/* Duration pill */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
        style={{ top: NODE_R * 2 + 8 }}
        initial={{ opacity: 0, y: 4 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.06 + 0.25 }}
      >
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.16em]"
          style={{
            background: ac.light,
            color: ac.text,
            border: `1px solid ${ac.primary}25`,
          }}
        >
          {stage.duration_months}mo
        </span>
      </motion.div>
    </motion.div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function StageCard({
  index, stage, x, isActive, onClick,
}: {
  index: number; stage: LearningPathStage; x: number; isActive: boolean; onClick: () => void;
}) {
  const isTop = index % 2 === 0;
  const ac = phaseAccent(index);
  const grad = phaseGrad(index);

  const cardTop = isTop
    ? TRACK_Y - NODE_R - CARD_GAP - CARD_H
    : TRACK_Y + NODE_R + CARD_GAP;

  const resourceTypes: string[] = Array.from(
    new Set((stage.resources || []).map((r: any) => r.type as string))
  );
  const projectCount = stage.projects?.length ?? 0;

  return (
    <motion.div
      className="absolute z-10 cursor-pointer"
      style={{ left: x - CARD_W / 2, top: cardTop, width: CARD_W }}
      initial={{ opacity: 0, y: isTop ? 16 : -16, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 + 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden bg-white"
        style={{
          border: `1.5px solid ${isActive ? ac.primary + "60" : "#e5e7eb"}`,
          boxShadow: isActive
            ? `0 0 0 3px ${ac.light}, 0 20px 48px -8px ${ac.primary}20, 0 4px 16px rgba(0,0,0,0.06)`
            : "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        }}
        whileHover={{
          borderColor: ac.primary + "50",
          boxShadow: `0 0 0 3px ${ac.light}, 0 16px 40px -8px ${ac.primary}18, 0 4px 16px rgba(0,0,0,0.08)`,
          y: isTop ? -3 : 3,
        }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
      >
        {/* Phase colour bar */}
        <div className="h-[3px] w-full" style={{ background: grad }} />

        {/* Subtle tinted header bg */}
        <div
          className="px-4 pt-3.5 pb-3"
          style={{ background: `linear-gradient(180deg, ${ac.light}60 0%, white 100%)` }}
        >
          {/* Phase badge + duration */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.14em]"
              style={{ background: ac.light, color: ac.text, border: `1px solid ${ac.primary}20` }}
            >
              Phase {index + 1}
            </span>
            <span className="text-[9.5px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
              {stage.duration_months} {stage.duration_months === 1 ? "mo" : "mos"}
            </span>
          </div>

          {/* Stage name */}
          <h3
            className="font-black leading-[1.2] tracking-[-0.02em]"
            style={{ fontSize: 15.5, color: "#111827" }}
          >
            {stage.stage}
          </h3>

          {/* Focus tags */}
          {stage.focus && stage.focus.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {stage.focus.slice(0, 2).map((f: string, fi: number) => (
                <span
                  key={fi}
                  className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.11em]"
                  style={{ color: ac.primary }}
                >
                  <span
                    style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: ac.primary, display: "inline-block", flexShrink: 0,
                    }}
                  />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-4 pb-4 pt-0">
          {/* Why italic quote */}
          {stage.why_this_module && (
            <p
              className="text-[11px] leading-[1.65] mb-3 italic"
              style={{
                color: "#6b7280",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              "{stage.why_this_module}"
            </p>
          )}

          {/* Divider */}
          <div className="mb-3" style={{ height: 1, background: "#f3f4f6" }} />

          {/* Topics */}
          {stage.topics && stage.topics.length > 0 && (
            <div className="mb-3">
              <p
                className="text-[8.5px] font-black uppercase tracking-[0.16em] mb-1.5"
                style={{ color: "#9ca3af" }}
              >
                Key Topics
              </p>
              <ul className="space-y-1">
                {stage.topics.slice(0, 4).map((topic: string, ti: number) => (
                  <li key={ti} className="flex items-start gap-1.5">
                    <svg width="8" height="8" viewBox="0 0 8 8" className="mt-[3.5px] flex-shrink-0">
                      <circle cx="4" cy="4" r="2.5" fill={ac.primary} opacity="0.6" />
                    </svg>
                    <span className="text-[11px] leading-[1.4]" style={{ color: "#374151" }}>
                      {topic}
                    </span>
                  </li>
                ))}
                {stage.topics.length > 4 && (
                  <li style={{ paddingLeft: 14 }}>
                    <span className="text-[10px] font-semibold" style={{ color: ac.primary + "99" }}>
                      +{stage.topics.length - 4} more
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Skills */}
          {stage.skills && stage.skills.length > 0 && (
            <div className="mb-3">
              <p
                className="text-[8.5px] font-black uppercase tracking-[0.16em] mb-1.5"
                style={{ color: "#9ca3af" }}
              >
                Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {stage.skills.slice(0, 5).map((skill: string, si: number) => (
                  <span
                    key={si}
                    className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold"
                    style={{
                      background: "#f9fafb",
                      color: "#4b5563",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {skill}
                  </span>
                ))}
                {stage.skills.length > 5 && (
                  <span className="text-[9.5px] font-semibold self-center" style={{ color: "#9ca3af" }}>
                    +{stage.skills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer stats */}
          <div
            className="flex items-center gap-3 pt-2.5"
            style={{ borderTop: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ac.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="text-[9.5px] font-semibold" style={{ color: "#6b7280" }}>
                {stage.topics?.length ?? 0} topics
              </span>
            </div>

            {projectCount > 0 && (
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ac.mid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                <span className="text-[9.5px] font-semibold" style={{ color: "#6b7280" }}>
                  {projectCount} {projectCount === 1 ? "project" : "projects"}
                </span>
              </div>
            )}

            {resourceTypes.length > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                {resourceTypes.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                    style={{
                      background: ac.light,
                      color: ac.text,
                      border: `1px solid ${ac.primary}20`,
                    }}
                  >
                    {type === "Course" ? "crs"
                      : type === "Article" ? "art"
                      : type === "Video" ? "vid"
                      : type === "Book" ? "bk"
                      : (type as string).slice(0, 3).toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function RoadmapSnapshot({ stages, meta }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  const TOTAL_W = (stages.length + 1) * STAGE_SPACING;
  const CANVAS_H = TRACK_Y * 2 + 80;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartX.current = containerRef.current?.scrollLeft ?? 0;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      containerRef.current.scrollLeft = scrollStartX.current + (dragStartX.current - e.clientX);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = STAGE_SPACING * 0.3;
    }
  }, []);

  const totalTopics = stages.reduce((s, st) => s + (st.topics?.length ?? 0), 0);
  const totalProjects = stages.reduce((s, st) => s + (st.projects?.length ?? 0), 0);
  const totalResources = stages.reduce((s, st) => s + (st.resources?.length ?? 0), 0);

  return (
    <section
      className="relative w-full overflow-hidden rounded-[28px]"
      style={{
        background: "linear-gradient(160deg, #fafafa 0%, #f5f3ff 40%, #faf5ff 60%, #f8fafc 100%)",
        border: "1.5px solid #e5e7eb",
        boxShadow: "0 4px 32px rgba(124, 58, 237, 0.06), 0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Subtle grid texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#7c3aed08 1px, transparent 1px), linear-gradient(90deg, #7c3aed08 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />

      {/* ── Per-phase ambient tints (very subtle) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stages.map((_, i) => {
          const ac = phaseAccent(i);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 500,
                height: 500,
                left: `${(i / Math.max(stages.length - 1, 1)) * 85}%`,
                top: i % 2 === 0 ? "-30%" : "50%",
                background: `radial-gradient(circle, ${ac.primary}06 0%, transparent 65%)`,
                transform: "translateX(-50%)",
              }}
            />
          );
        })}
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 pt-10 pb-6 px-10 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 mb-4"
        >
          <div
            className="h-px w-8"
            style={{ background: "linear-gradient(90deg, transparent, #7c3aed40)" }}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#7c3aed99" }}>
            {stages.length} phases · {meta.duration_months} months · {meta.weekly_time_hours}h/week
          </span>
          <div
            className="h-px w-8"
            style={{ background: "linear-gradient(90deg, #7c3aed40, transparent)" }}
          />
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.07 }}
          className="font-black tracking-[-0.035em] leading-[0.95] mb-3"
          style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", color: "#111827" }}
        >
          Your path to{" "}
          <span
            style={{
              background: "linear-gradient(95deg, #7c3aed 0%, #0891b2 50%, #059669 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {meta.goal}
          </span>
        </motion.h2>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="inline-flex items-center gap-1 mt-1 rounded-xl overflow-hidden"
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {[
            { label: "Topics", value: totalTopics, color: "#7c3aed" },
            { label: "Projects", value: totalProjects, color: "#0891b2" },
            { label: "Resources", value: totalResources, color: "#059669" },
          ].map(({ label, value, color }, idx, arr) => (
            <div
              key={label}
              className="flex items-baseline gap-1.5 px-5 py-2.5"
              style={{
                borderRight: idx < arr.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <span className="text-[19px] font-black" style={{ color }}>{value}</span>
              <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Scrollable canvas ── */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-visible select-none"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onMouseDown={onMouseDown}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        <div className="relative" style={{ width: TOTAL_W, height: CANVAS_H }}>
          <TrackRail totalWidth={TOTAL_W} stages={stages} />

          {stages.map((stage, i) => (
            <StageCard
              key={i}
              index={i}
              stage={stage}
              x={STAGE_SPACING * (i + 1)}
              isActive={activeIndex === i}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            />
          ))}

          {stages.map((stage, i) => (
            <StageNode
              key={i}
              index={i}
              stage={stage}
              x={STAGE_SPACING * (i + 1)}
              isActive={activeIndex === i}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            />
          ))}

          {/* Start cap */}
          <div
            className="absolute flex flex-col items-center -translate-y-1/2"
            style={{ left: 68, top: TRACK_Y }}
          >
            <div
              className="w-3 h-3 rounded-full border-2"
              style={{ background: "#f9fafb", borderColor: "#d1d5db" }}
            />
            <span
              className="mt-1.5 text-[8px] font-black uppercase tracking-[0.2em]"
              style={{ color: "#d1d5db" }}
            >
              Start
            </span>
          </div>

          {/* Goal cap */}
          <div
            className="absolute flex flex-col items-center -translate-y-1/2"
            style={{ left: TOTAL_W - 84, top: TRACK_Y }}
          >
            <motion.div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #059669, #0891b2)",
                boxShadow: "0 0 0 4px #d1fae5, 0 4px 16px rgba(5,150,105,0.25)",
              }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <span
              className="mt-1.5 text-[8px] font-black uppercase tracking-[0.2em]"
              style={{ color: "#9ca3af" }}
            >
              Goal
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 flex items-center justify-between px-10 py-4">
        {/* Phase nav dots */}
        <div className="flex items-center gap-2">
          {stages.map((_, i) => {
            const ac = phaseAccent(i);
            const isAct = activeIndex === i;
            return (
              <button
                key={i}
                title={stages[i].stage}
                onClick={() => {
                  setActiveIndex(isAct ? null : i);
                  if (containerRef.current) {
                    containerRef.current.scrollTo({
                      left: STAGE_SPACING * (i + 1) - containerRef.current.clientWidth / 2,
                      behavior: "smooth",
                    });
                  }
                }}
                style={{
                  width: isAct ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: isAct ? ac.primary : "#d1d5db",
                  transition: "all 0.22s ease",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>

        {/* Drag hint */}
        <motion.div
          className="flex items-center gap-1.5"
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        >
          <span
            className="text-[9px] font-black uppercase tracking-[0.18em]"
            style={{ color: "#d1d5db" }}
          >
            Drag to explore
          </span>
          <svg width="14" height="9" viewBox="0 0 16 10" fill="none">
            <path
              d="M1 5h13M9 1l5 4-5 4"
              stroke="#d1d5db"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}