import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import BrandLoader from "./BrandLoader";

/**
 * Global splash that:
 * - shows briefly after a language switch reload
 * - shows briefly on top-level route changes for a unified feel
 */
export default function GlobalSplash() {
  const { pathname } = useLocation();
  const [show, show_] = useState(false);
  const isFirstNav = useRef(true);

  // Post-reload (e.g. after language change)
  useEffect(() => {
    let pending = false;
    try {
      pending = sessionStorage.getItem("zeetop_show_splash") === "1";
      if (pending) sessionStorage.removeItem("zeetop_show_splash");
    } catch {}
    if (pending) {
      show_(true);
      const t = setTimeout(() => show_(false), 1100);
      return () => clearTimeout(t);
    }
  }, []);

  // Route-change splash (very short, after first paint)
  useEffect(() => {
    if (isFirstNav.current) {
      isFirstNav.current = false;
      return;
    }
    show_(true);
    const t = setTimeout(() => show_(false), 550);
    return () => clearTimeout(t);
  }, [pathname]);

  return <BrandLoader show={show} />;
}
