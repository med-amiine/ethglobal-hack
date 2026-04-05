"use client";

import React, { useEffect, useState } from "react";

interface ScoreRadarProps {
  score?: number; // 0-100 or 0-1000
  maxScore?: number;
  className?: string;
  animated?: boolean;
}

export const ScoreRadar: React.FC<ScoreRadarProps> = ({
  score = 500,
  maxScore = 1000,
  className = "",
  animated = true,
}) => {
  const [strokeDashoffset, setStrokeDashoffset] = useState(
    animated ? 314 : 0
  );

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        const progress = Math.min(score / maxScore, 1);
        setStrokeDashoffset(314 * (1 - progress));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [score, maxScore, animated]);

  const normalizedScore = Math.min(score / maxScore, 1);
  const percentage = Math.round(normalizedScore * 100);

  // Pentagon axes: Performance, Risk, Stability, Sentiment, Provision
  const axes = [
    "Performance",
    "Risk",
    "Stability",
    "Sentiment",
    "Provision",
  ];
  const angle = (Math.PI * 2) / axes.length;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        className="drop-shadow-lg"
      >
        {/* Pentagon outline */}
        <polygon
          points="90,20 150,60 130,130 50,130 30,60"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Grid circles */}
        {[40, 60, 80].map((r) => (
          <circle
            key={r}
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="#C9A84C"
            strokeWidth="0.5"
            opacity="0.1"
          />
        ))}

        {/* Score fill pentagon */}
        <polygon
          points="90,20 150,60 130,130 50,130 30,60"
          fill="#C9A84C"
          fillOpacity={normalizedScore * 0.25}
          stroke="#C9A84C"
          strokeWidth="1.5"
        />

        {/* Labels */}
        {axes.map((axis, i) => {
          const x = 90 + 65 * Math.cos(i * angle - Math.PI / 2);
          const y = 90 + 65 * Math.sin(i * angle - Math.PI / 2);
          return (
            <text
              key={axis}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="10"
              fill="#C9A84C"
              className="font-mono"
              opacity="0.6"
            >
              {axis.slice(0, 3)}
            </text>
          );
        })}
      </svg>

      <div className="text-center">
        <div className="text-3xl font-mono font-bold text-[#C9A84C]">
          {score}
        </div>
        <div className="text-xs text-[#8899AA] font-mono uppercase">
          Score / {maxScore}
        </div>
        <div className="text-sm text-[#C9A84C] font-semibold mt-2">
          {percentage}%
        </div>
      </div>
    </div>
  );
};
