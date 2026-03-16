"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LearningPathStage, MetaData } from "../app/learning-path/types";

interface Props {
  stages: LearningPathStage[];
  meta: MetaData;
}

// ─── Layout tokens ─────────────────────────────────────────────────────────────
const CARD_W = 360;
const CARD_H = 320;
const STAGE_SPACING = 440;
const TRACK_Y = 430;
const NODE_R = 30;
const CARD_GAP = 28;

// ─── Palette ──────────────────────────────────────────────────────────────────
const ACCENT_STOPS = [
  { from: "#a78bfa", to: "#818cf8" },
  { from: "#38bdf8", to: "#34d399" },
  { from: "#fb923c", to: "#f472b6" },
  { from: "#facc15", to: "#4ade80" },
  { from: "#c084fc", to: "#60a5fa" },
  { from: "#f87171", to: "#fbbf24" },
];

const accent = (i: number) => ACCENT_STOPS[i % ACCENT_STOPS.length];

// ─── TrackRail ─────────────────────────────────────────────────────────────────
function TrackRail({ totalWidth, stages }: { totalWidth: number; stages: LearningPathStage[] }) {
  const canvasH = TRACK_Y * 2 + 60;
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={totalWidth}
      height={canvasH}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="20%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="80%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Base rail */}
      <rect x={80} y={TRACK_Y - 1} width={totalWidth - 160} height={2} fill="url(#rail-grad)" rx={1} />

      {/* Shimmer */}
      <motion.line
        x1={80} y1={TRACK_Y} x2={totalWidth - 80} y2={TRACK_Y}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
        strokeDasharray="6 28"
        animate={{ strokeDashoffset: [0, -34] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />

      {/* Node → card connectors */}
      {stages.map((_, i) => {
        const x = STAGE_SPACING * (i + 1);
        const isTop = i % 2 === 0;
        const nodeEdge = isTop ? TRACK_Y - NODE_R : TRACK_Y + NODE_R;
        const cardEdge = isTop
          ? TRACK_Y - NODE_R - CARD_GAP - CARD_H
          : TRACK_Y + NODE_R + CARD_GAP + CARD_H;
        const { from } = accent(i);
        return (
          <motion.line
            key={i}
            x1={x} y1={nodeEdge} x2={x} y2={cardEdge}
            stroke={from} strokeWidth={1} strokeOpacity={0.18} strokeDasharray="3 7"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
          />
        );
      })}
    </svg>
  );
}

// ─── StageNode ─────────────────────────────────────────────────────────────────
function StageNode({
  index, stage, x, isActive, onClick,
}: {
  index: number; stage: LearningPathStage; x: number; isActive: boolean; onClick: () => void;
}) {
  const { from, to } = accent(index);
  return (
    <motion.div
      className="absolute -translate-x-1/2 cursor-pointer z-20"
      style={{ left: x, top: TRACK_Y - NODE_R }}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 200, damping: 20 }}
      onClick={onClick}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ inset: -18, background: `radial-gradient(circle, ${from}18, transparent 70%)` }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative flex items-center justify-center rounded-full select-none"
        style={{
          width: NODE_R * 2, height: NODE_R * 2,
          background: isActive ? `linear-gradient(135deg, ${from}, ${to})` : "rgba(255,255,255,0.04)",
          border: `1.5px solid ${isActive ? "transparent" : "rgba(255,255,255,0.1)"}`,
          boxShadow: isActive ? `0 0 32px ${from}55, 0 0 72px ${from}1a` : "none",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <span
          className="font-black text-[13px]"
          style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${NODE_R * 2} ${NODE_R * 2}`}>
          <circle
            cx={NODE_R} cy={NODE_R} r={NODE_R - 4}
            fill="none" stroke={from} strokeWidth={2}
            strokeOpacity={isActive ? 0.7 : 0.2}
            strokeDasharray={`${Math.min(stage.duration_months / 6, 1) * 2 * Math.PI * (NODE_R - 4)} 999`}
          />
        </svg>
      </motion.div>

      <div className="absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap" style={{ top: NODE_R * 2 }}>
        <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: from, opacity: 0.65 }}>
          {stage.duration_months}mo
        </span>
      </div>
    </motion.div>
  );
}

// ─── StageCard ─────────────────────────────────────────────────────────────────
function StageCard({
  index, stage, x, isActive, onClick,
}: {
  index: number; stage: LearningPathStage; x: number; isActive: boolean; onClick: () => void;
}) {
  const isTop = index % 2 === 0;
  const { from, to } = accent(index);

  const cardTop = isTop
    ? TRACK_Y - NODE_R - CARD_GAP - CARD_H
    : TRACK_Y + NODE_R + CARD_GAP;

  const resourceTypes: string[] = Array.from(new Set((stage.resources || []).map((r) => r.type as string)));
  const projectCount = (stage.projects || []).length;

  return (
    <motion.div
      className="absolute cursor-pointer z-10"
      style={{ left: x - CARD_W / 2, top: cardTop, width: CARD_W }}
      initial={{ opacity: 0, y: isTop ? 20 : -20, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 + 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
    >
      <motion.div
        className="relative rounded-[22px] overflow-hidden"
        style={{
          background: "rgba(10, 10, 16, 0.85)",
          backdropFilter: "blur(28px)",
          border: `1px solid ${isActive ? from + "55" : "rgba(255,255,255,0.07)"}`,
          boxShadow: isActive
            ? `0 28px 72px -12px ${from}28, inset 0 0 0 1px ${from}18`
            : "0 10px 40px -10px rgba(0,0,0,0.5)",
        }}
        whileHover={{
          borderColor: `${from}40`,
          boxShadow: `0 24px 60px -12px ${from}22`,
          scale: 1.012,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        {/* Top hairline */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${from}99 40%, ${to}99 60%, transparent)`, opacity: isActive ? 1 : 0.35 }}
        />

        {/* Corner glow */}
        <div
          className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${from}0c, transparent 65%)` }}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <span
              className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-[0.15em]"
              style={{ background: `${from}18`, color: from, border: `1px solid ${from}28` }}
            >
              Phase {index + 1}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest pt-0.5"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              {stage.duration_months} {stage.duration_months === 1 ? "month" : "months"}
            </span>
          </div>

          {/* Stage name — the most important line */}
          <h3
            className="font-black leading-[1.15] tracking-[-0.025em] mb-2"
            style={{ fontSize: 17, color: "#f4f4f6" }}
          >
            {stage.stage}
          </h3>

          {/* Focus tags */}
          {stage.focus && stage.focus.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {stage.focus.slice(0, 3).map((f, fi) => (
                <span key={fi} className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: to, opacity: 0.8 }}>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: to, display: "inline-block" }} />
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Why quote */}
          {stage.why_this_module && (
            <p
              className="text-[11.5px] leading-[1.6] mb-3 italic"
              style={{
                color: "rgba(255,255,255,0.33)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {stage.why_this_module}
            </p>
          )}

          {/* Divider */}
          <div className="mb-3" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Topics */}
          {stage.topics && stage.topics.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                Key Topics
              </p>
              <ul className="space-y-1.5">
                {stage.topics.slice(0, 4).map((topic, ti) => (
                  <li key={ti} className="flex items-start gap-2">
                    <svg width="9" height="9" viewBox="0 0 9 9" className="mt-[3px] flex-shrink-0">
                      <circle cx="4.5" cy="4.5" r="2" fill={from} opacity="0.65" />
                    </svg>
                    <span className="text-[11px] leading-[1.4]" style={{ color: "rgba(255,255,255,0.52)" }}>
                      {topic}
                    </span>
                  </li>
                ))}
                {stage.topics.length > 4 && (
                  <li className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.18)", paddingLeft: 17 }}>
                    +{stage.topics.length - 4} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Skills chips */}
          {stage.skills && stage.skills.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stage.skills.slice(0, 5).map((skill, si) => (
                  <span
                    key={si}
                    className="px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-tight"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {skill}
                  </span>
                ))}
                {stage.skills.length > 5 && (
                  <span className="text-[9.5px] font-bold self-center" style={{ color: "rgba(255,255,255,0.16)" }}>
                    +{stage.skills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats footer */}
          <div
            className="flex items-center gap-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Topics count */}
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={from} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="text-[9.5px] font-bold" style={{ color: "rgba(255,255,255,0.28)" }}>
                {stage.topics?.length ?? 0} topics
              </span>
            </div>

            {/* Projects */}
            {projectCount > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={to} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                <span className="text-[9.5px] font-bold" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {projectCount} {projectCount === 1 ? "project" : "projects"}
                </span>
              </div>
            )}

            {/* Resource type badges */}
            {resourceTypes.length > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                {resourceTypes.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase"
                    style={{ background: `${from}10`, color: from, border: `1px solid ${from}1e`, opacity: 0.7 }}
                  >
                    {type === "Course" ? "crs" : type === "Article" ? "art" : type === "Video" ? "vid" : type === "Book" ? "bk" : type.slice(0, 3).toLowerCase()}
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
    if (containerRef.current) containerRef.current.scrollLeft = STAGE_SPACING * 0.35;
  }, []);

  const totalTopics = stages.reduce((s, st) => s + (st.topics?.length ?? 0), 0);
  const totalProjects = stages.reduce((s, st) => s + (st.projects?.length ?? 0), 0);
  const totalResources = stages.reduce((s, st) => s + (st.resources?.length ?? 0), 0);

  return (
    <section
      className="relative w-full overflow-hidden rounded-[32px]"
      style={{
        background: "linear-gradient(150deg, #09090f 0%, #0d0d1a 50%, #09090f 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stages.map((_, i) => {
          const { from } = accent(i);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 700, height: 700,
                left: `${(i / Math.max(stages.length - 1, 1)) * 90}%`,
                top: i % 2 === 0 ? "-25%" : "35%",
                background: `radial-gradient(circle, ${from}07 0%, transparent 60%)`,
                transform: "translateX(-50%)",
              }}
            />
          );
        })}
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 pt-12 pb-8 px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="inline-flex items-center gap-3 mb-5"
        >
          <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15))" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.28)" }}>
            {stages.length} phases · {meta.duration_months} months · {meta.weekly_time_hours}h/week
          </span>
          <div className="h-px w-10" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.15), transparent)" }} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.07 }}
          className="font-black tracking-[-0.04em] leading-[0.92] mb-4"
          style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", color: "#f4f4f6" }}
        >
          Your path to{" "}
          <span style={{ background: "linear-gradient(95deg, #a78bfa, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {meta.goal}
          </span>
        </motion.h2>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="inline-flex items-center gap-8 mt-1"
        >
          {[
            { label: "Topics", value: totalTopics },
            { label: "Projects", value: totalProjects },
            { label: "Resources", value: totalResources },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-black" style={{ color: "rgba(255,255,255,0.65)" }}>{value}</span>
              <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.22)" }}>{label}</span>
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
              key={i} index={i} stage={stage}
              x={STAGE_SPACING * (i + 1)}
              isActive={activeIndex === i}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            />
          ))}

          {stages.map((stage, i) => (
            <StageNode
              key={i} index={i} stage={stage}
              x={STAGE_SPACING * (i + 1)}
              isActive={activeIndex === i}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            />
          ))}

          {/* Start cap */}
          <div className="absolute flex flex-col items-center -translate-y-1/2" style={{ left: 72, top: TRACK_Y }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.14)", boxShadow: "0 0 8px rgba(255,255,255,0.08)" }} />
            <span className="mt-2 text-[8.5px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.12)" }}>Start</span>
          </div>

          {/* Goal cap */}
          <div className="absolute flex flex-col items-center -translate-y-1/2" style={{ left: TOTAL_W - 88, top: TRACK_Y }}>
            <motion.div
              className="flex items-center justify-center rounded-full"
              style={{ width: 38, height: 38, background: "linear-gradient(135deg, #34d399, #60a5fa)", boxShadow: "0 0 28px #34d39940" }}
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <span className="mt-2 text-[8.5px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.18)" }}>Goal</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-2">
          {stages.map((_, i) => {
            const { from } = accent(i);
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
                  width: isAct ? 22 : 7, height: 7, borderRadius: 99,
                  background: isAct ? from : "rgba(255,255,255,0.1)",
                  transition: "all 0.25s ease",
                  border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                }}
              />
            );
          })}
        </div>

        <motion.div
          className="flex items-center gap-2"
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <span className="text-[9.5px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.15)" }}>
            Drag to explore
          </span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 5h13M9 1l5 4-5 4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}