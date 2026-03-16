"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { LearningPathStage, MetaData } from "../app/learning-path/types";

interface Props {
stages: LearningPathStage[];
meta: MetaData;
}

const WIDTH = 1600;
const HEIGHT = 600;

export default function RoadmapSnapshot({ stages, meta }: Props) {
const containerRef = useRef<HTMLDivElement>(null);
const pathRef = useRef<SVGPathElement>(null);

const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

const { scrollYProgress } = useScroll({
target: containerRef,
offset: ["start end", "end start"],
});

const generatePath = () => {
return `       M 80 ${HEIGHT / 2}
      C 300 80, 500 ${HEIGHT}, 700 ${HEIGHT / 2}
      S 1100 80, 1400 ${HEIGHT / 2}
    `;
};

useEffect(() => {
if (!pathRef.current) return;

const path = pathRef.current;
const length = path.getTotalLength();

const pts = stages.map((_, i) => {
  const point = path.getPointAtLength(
    (length / (stages.length + 1)) * (i + 1)
  );

  return { x: point.x, y: point.y };
});

setPoints(pts);

}, [stages]);

return ( <div ref={containerRef} className="relative py-24">

  {/* HEADER */}
  <div className="text-center max-w-3xl mx-auto mb-24">
    <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
      Your Path to{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
        {meta.goal}
      </span>
    </h2>

    <p className="text-lg text-text-muted">
      A {meta.duration_months}-month journey to master the skills required
      to become a {meta.goal}.
    </p>
  </div>

  {/* ROADMAP CANVAS */}
  <div className="overflow-x-auto pb-16">
    <div
      className="relative mx-auto min-w-[1400px]"
      style={{ height: HEIGHT }}
    >

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >

        {/* BASE ROAD */}
        <path
          d={generatePath()}
          fill="none"
          stroke="#111"
          strokeWidth="60"
          strokeLinecap="round"
        />

        {/* PROGRESS ROAD */}
        <motion.path
          ref={pathRef}
          d={generatePath()}
          fill="none"
          stroke="url(#roadgrad)"
          strokeWidth="60"
          strokeLinecap="round"
          style={{ pathLength: scrollYProgress as any }}
        />

        {/* DASHED CENTER */}
        <motion.path
          d={generatePath()}
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeDasharray="14 18"
          animate={{ strokeDashoffset: [0, -32] }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "linear",
          }}
        />

        <defs>
          <linearGradient id="roadgrad">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

      </svg>

      {/* MILESTONES */}
      {points.map((p, i) => {
        const stage = stages[i];
        const top = i % 2 === 0;

        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: p.x, top: p.y }}
          >

            {/* NODE */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.15, type: "spring" }}
              className="relative z-20 flex items-center justify-center"
            >
              <div className="absolute w-20 h-20 bg-primary/20 blur-xl rounded-full"></div>

              <div className="w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-xl font-bold z-10">
                {i + 1}
              </div>
            </motion.div>

            {/* CARD */}
            <motion.div
              initial={{ opacity: 0, y: top ? -40 : 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`absolute w-72 ${
                top ? "bottom-40 text-center" : "top-40 text-center"
              } -translate-x-1/2 left-1/2`}
            >
              <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-md hover:shadow-xl transition">

                <div className="text-xs font-bold uppercase text-primary mb-2">
                  {stage.duration_months} months
                </div>

                <h3 className="font-black text-lg mb-2">
                  {stage.stage}
                </h3>

                <p className="text-sm text-text-muted leading-relaxed">
                  {stage.why_this_module ||
                    stage.topics?.slice(0, 3).join(" • ") ||
                    "Core skill development"}
                </p>

              </div>
            </motion.div>

          </div>
        );
      })}

    </div>
  </div>
</div>

);
}