import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  bg_color: string;
}

interface Props {
  banners: Banner[];
  isDark: boolean;
  themeColor: string;
}

export function PublicStoreBanner({ banners, isDark, themeColor }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={banners[current].id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
            className="relative flex items-center min-h-[140px] sm:min-h-[180px] md:min-h-[220px] overflow-hidden"
            style={{ backgroundColor: banners[current].bg_color }}
          >
            {/* Background image */}
            {banners[current].image_url && (
              <img
                src={banners[current].image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${banners[current].bg_color}ee 0%, ${banners[current].bg_color}88 50%, transparent 100%)`,
              }}
            />

            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl bg-white" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15 blur-2xl bg-white" />

            {/* Content */}
            <div className="relative z-10 p-5 sm:p-8 md:p-12 max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 mb-2"
              >
                <Sparkles className="h-4 w-4 text-white/80" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70">
                  Special Offer
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight"
              >
                {banners[current].title}
              </motion.h2>
              {banners[current].subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-xs sm:text-sm text-white/80 max-w-md"
                >
                  {banners[current].subtitle}
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
