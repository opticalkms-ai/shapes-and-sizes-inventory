import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export function Logo({ size = "md", dark = false }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-sm" },
    md: { icon: 36, text: "text-base" },
    lg: { icon: 44, text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div
        style={{ width: s.icon, height: s.icon, borderRadius: 8, background: "#C2185B" }}
        className="flex items-center justify-center flex-shrink-0"
      >
        <svg width={s.icon * 0.65} height={s.icon * 0.65} viewBox="0 0 24 24" fill="none">
          <polygon points="12,3 20,15 4,15" fill="white" opacity="0.95" />
          <rect x="3" y="16" width="8" height="6" rx="1.5" fill="white" opacity="0.8" />
          <circle cx="18" cy="19" r="3.5" fill="white" opacity="0.95" />
        </svg>
      </div>
      <span
        className={`${s.text} font-semibold ${dark ? "text-white" : "text-[#C2185B]"}`}
        style={{ lineHeight: 1.2 }}
      >
        Shapes and Sizes
      </span>
    </div>
  );
}
