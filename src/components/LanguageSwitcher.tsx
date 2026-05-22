import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
  compact?: boolean;
}

export default function LanguageSwitcher({ variant = "light", compact = false }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith("sw") ? "sw" : "en";

  const change = (lng: "en" | "sw") => {
    try {
      localStorage.setItem("zeetop_lang", lng);
      sessionStorage.setItem("zeetop_show_splash", "1");
    } catch {}
    // Hard reload so every page re-renders with new language + branded splash
    window.location.reload();
  };
  void i18n;

  const labelClasses =
    variant === "dark"
      ? "text-white/80 hover:text-white hover:bg-white/10"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${labelClasses}`}
        aria-label={t("nav.language")}
      >
        <Languages className="h-4 w-4" />
        {!compact && <span className="uppercase tracking-wide">{current}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => change("en")} className={current === "en" ? "font-semibold" : ""}>
          🇬🇧 {t("common.english")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("sw")} className={current === "sw" ? "font-semibold" : ""}>
          🇹🇿 {t("common.swahili")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
