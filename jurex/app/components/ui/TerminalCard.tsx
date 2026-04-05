import React from "react";

interface TerminalCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TerminalCard: React.FC<TerminalCardProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div
      className={`border border-[#C9A84C] bg-[#0B0F18]/80 backdrop-blur-sm p-6 rounded-none ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 pb-4 border-b border-[#C9A84C]/30 mb-4">
          <div className="w-2 h-2 bg-[#C9A84C]" />
          <h3 className="text-sm font-mono font-semibold text-[#C9A84C] uppercase">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};
