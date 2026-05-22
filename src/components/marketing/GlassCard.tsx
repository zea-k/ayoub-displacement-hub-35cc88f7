import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function GlassCard({ children, className = "", delay = 0 }: Props) {
  void delay;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-gray-50 backdrop-blur-md p-6 lg:p-8 hover:border-emerald-500/30 hover:bg-gray-100 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
