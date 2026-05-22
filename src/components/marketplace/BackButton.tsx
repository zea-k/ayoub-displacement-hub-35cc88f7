import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  className?: string;
  variant?: "floating" | "inline";
}

/**
 * Icon-only back arrow (top-left). No text by design — feels like a native app.
 * - "floating" = absolutely positioned, glassy pill (good on hero images)
 * - "inline"   = sits in normal flow, lighter style
 */
export default function BackButton({ to, className = "", variant = "floating" }: BackButtonProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (to) navigate(to);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/market");
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        aria-label="Go back"
        onClick={handleClick}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition ${className}`}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={handleClick}
      className={`fixed top-4 left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white shadow-lg shadow-black/40 hover:bg-black/60 hover:scale-105 active:scale-95 transition-all sm:absolute sm:top-6 sm:left-6 ${className}`}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
