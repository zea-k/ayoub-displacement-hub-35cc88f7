import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Sparkles, Store, PackageSearch } from "lucide-react";
import BackButton from "@/components/marketplace/BackButton";
import type { StoreSettings } from "@/pages/PublicStorePage";

interface Props {
  store: StoreSettings;
  isDark: boolean;
  productCount: number;
  onTrackOrder?: () => void;
}

export function PublicStoreHeader({ store, isDark, productCount, onTrackOrder }: Props) {
  return (
    <header className="relative overflow-hidden">
      <BackButton to="/market" />
      {/* Top gradient bar — violet→amber landing identity */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary to-accent" />

      {/* Hero Section */}
      <div className="relative backdrop-blur-xl border-b border-gray-200 bg-white">
        {/* Hero glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 right-0 w-[400px] h-[400px] rounded-full bg-primary/40 blur-[120px]" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-accent/40 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 pt-16 pb-8 sm:py-12 md:py-16 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Logo */}
            {store.logo_url ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative group"
              >
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ backgroundColor: store.theme_color }}
                />
                <img
                  src={store.logo_url}
                  alt={store.business_name}
                  className="relative h-20 w-20 md:h-24 md:w-24 rounded-2xl object-cover ring-2 ring-gray-200 shadow-xl"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative h-20 w-20 md:h-24 md:w-24 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${store.theme_color}, ${store.theme_color}cc)` }}
              >
                <Store className="h-10 w-10 text-white" />
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                  style={{ backgroundColor: store.theme_color }}
                />
              </motion.div>
            )}

            {/* Text */}
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900"
              >
                {store.business_name}
              </motion.h1>
              {store.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-sm md:text-base max-w-xl text-gray-700 leading-relaxed"
                >
                  {store.description}
                </motion.p>
              )}

              {/* Stats badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: `${store.theme_color}cc` }}
                >
                  <Sparkles className="h-3 w-3" /> {productCount} Products
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Now
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Contact bar */}
        {(store.whatsapp_number || store.contact_phone || store.contact_email) && (
          <div className="border-t border-gray-200 bg-gray-50/60 px-4 py-3">
            <div className="container mx-auto flex flex-wrap items-center gap-5 text-sm">
              {store.whatsapp_number && (
                <a
                  href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium transition-all hover:scale-105"
                  style={{ color: store.theme_color }}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {store.contact_phone && (
                <a href={`tel:${store.contact_phone}`} className="flex items-center gap-1.5 transition-colors text-gray-800 hover:text-gray-900">
                  <Phone className="h-4 w-4" /> {store.contact_phone}
                </a>
              )}
              {store.contact_email && (
                <a href={`mailto:${store.contact_email}`} className="flex items-center gap-1.5 transition-colors text-gray-800 hover:text-gray-900">
                  <Mail className="h-4 w-4" /> {store.contact_email}
                </a>
              )}
              {onTrackOrder && (
                <button
                  onClick={onTrackOrder}
                  className="flex items-center gap-1.5 font-medium transition-all hover:scale-105 ml-auto"
                  style={{ color: store.theme_color }}
                >
                  <PackageSearch className="h-4 w-4" /> Track Order
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
