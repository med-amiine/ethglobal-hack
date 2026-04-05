import React from "react";

interface GoldButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "solid" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const GoldButton: React.FC<GoldButtonProps> = ({
  variant = "outline",
  size = "md",
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-mono font-semibold transition-all duration-300 rounded-none uppercase";

  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variantClasses = {
    outline:
      "border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black",
    solid:
      "bg-[#C9A84C] text-black border border-[#C9A84C] hover:opacity-90",
    ghost:
      "text-[#C9A84C] hover:border border-[#C9A84C] hover:bg-[#C9A84C]/5",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};
