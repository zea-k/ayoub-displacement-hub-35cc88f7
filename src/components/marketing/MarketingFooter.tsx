import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import zeetopLogo from "@/assets/zeetop-logo.png";

export default function MarketingFooter() {
  const { t } = useTranslation();

  const footerLinks = {
    [t("marketing.footer.product")]: [
      
      { label: t("nav.pricing"), to: "/plans" },
      { label: t("nav.howItWorks"), to: "/how-it-works" },
    ],
    [t("marketing.footer.company")]: [
      { label: t("nav.contact"), to: "/contact" },
    ],
  };

  return (
    <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/welcome" className="flex items-center gap-3 mb-6 group">
              <img src={zeetopLogo} alt="ZEETOP" className="h-8 w-auto group-hover:scale-105 transition-transform duration-200" />
              <span className="text-lg font-semibold text-gray-900 tracking-tight">ZEETOP</span>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              {t("marketing.footer.tagline")}
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title} className="col-span-1">
              <h4 className="text-gray-900 font-semibold text-sm mb-5 tracking-tight">{title}</h4>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-gray-600 hover:text-primary text-sm transition-all duration-200 font-medium"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-gray-200/50">
          <p className="text-gray-500 text-xs text-center tracking-wide">
            &copy; {new Date().getFullYear()} ZEETOP. {t("marketing.footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
