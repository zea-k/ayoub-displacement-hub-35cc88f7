import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthModal } from "@/contexts/AuthModalContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import zeetopLogo from "@/assets/zeetop-logo.png";

export default function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { openLogin, openRegister } = useAuthModal();
  const { t } = useTranslation();

  const links = [
    { to: "/welcome", label: t("nav.home") },
    { to: "/market", label: t("nav.marketplace") },
    { to: "/features", label: t("nav.features") },
    { to: "/how-it-works", label: t("nav.howItWorks") },
    { to: "/plans", label: t("nav.pricing") },
    { to: "/contact", label: t("nav.contact") },
    { to: "/account", label: t("nav.myAccount") },
  ];

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isActive = (to: string) =>
    location.pathname === to || (to === "/welcome" && location.pathname === "/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/welcome" className="flex items-center gap-3 group">
            <img src={zeetopLogo} alt="ZEETOP" className="h-9 w-auto group-hover:scale-105 transition-transform duration-200" />
            <span className="text-lg font-semibold text-gray-900 tracking-tight hidden sm:inline">
              ZEETOP
            </span>
          </Link>

          <div className="hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(l.to)
                    ? "text-primary bg-primary"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden">
            <button
              onClick={openLogin}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-200 hover:bg-gray-50"
            >
              {t("nav.login")}
            </button>
            <button
              onClick={openRegister}
              className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {t("nav.startTrial")}
            </button>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <button
              className="p-2 text-gray-500 hover:text-gray-900"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
          <div className="px-4 pb-4">
            <div className="mx-auto w-full max-w-[calc(100%-2.5rem)] rounded-[2rem] border border-gray-200/75 bg-white/95 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="p-4 space-y-2">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                      isActive(l.to)
                        ? "text-primary bg-primary"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col gap-3 border-t border-gray-200/60">
                  <button
                    onClick={openLogin}
                    className="px-4 py-3 text-center text-sm font-medium text-slate-700 hover:text-slate-900 rounded-2xl border border-gray-200 transition-all duration-200"
                  >
                    {t("nav.login")}
                  </button>
                  <button
                    onClick={openRegister}
                    className="px-4 py-3 text-center text-sm font-semibold rounded-2xl bg-primary text-white hover:bg-primary transition-all duration-200"
                  >
                    {t("nav.startTrial")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </nav>
  );
}
