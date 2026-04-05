import React from "react";

type BadgeStatus = "open" | "disputed" | "resolved" | "defaulted" | "neutral";

interface StatusBadgeProps {
  status: BadgeStatus;
  children?: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  className = "",
}) => {
  const statusColors: Record<BadgeStatus, { border: string; text: string; bg: string }> = {
    open: {
      border: "border-[#C9A84C]",
      text: "text-[#C9A84C]",
      bg: "bg-[#C9A84C]/5",
    },
    disputed: {
      border: "border-[#ffcc00]",
      text: "text-[#ffcc00]",
      bg: "bg-[#ffcc00]/5",
    },
    resolved: {
      border: "border-[#8899AA]",
      text: "text-[#8899AA]",
      bg: "bg-[#8899AA]/5",
    },
    defaulted: {
      border: "border-[#ff3366]",
      text: "text-[#ff3366]",
      bg: "bg-[#ff3366]/5",
    },
    neutral: {
      border: "border-[#4A5568]",
      text: "text-[#4A5568]",
      bg: "bg-[#4A5568]/5",
    },
  };

  const colors = statusColors[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-mono uppercase border rounded-none ${colors.border} ${colors.text} ${colors.bg} ${className}`}
    >
      {children || status}
    </span>
  );
};
