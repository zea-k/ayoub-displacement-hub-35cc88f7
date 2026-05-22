import { useEffect } from "react";
import { motion, useTransform, useMotionValue } from "framer-motion";

interface ParallaxBrandProps {
  variant?: "dark" | "light";
}

export default function ParallaxBrand({ variant = "light" }: ParallaxBrandProps) {
  const scrollY = useMotionValue(0);

  useEffect(() => {
    const handleScroll = () => scrollY.set(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollY]);

  const y1 = useTransform(scrollY, [0, 1000], [0, -120]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -60]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -180]);

  const color = variant === "dark"
    ? "text-white/[0.03]"
    : "text-foreground/[0.02]";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none" aria-hidden>
      <motion.div
        style={{ y: y1 }}
        className={`absolute -left-20 top-[10%] text-[12rem] md:text-[18rem] font-black tracking-tighter ${color} whitespace-nowrap`}
      >
        ZEETOP
      </motion.div>
      <motion.div
        style={{ y: y2 }}
        className={`absolute -right-10 top-[45%] text-[8rem] md:text-[14rem] font-black tracking-tighter ${color} whitespace-nowrap rotate-[-8deg]`}
      >
        ZEETOP
      </motion.div>
      <motion.div
        style={{ y: y3 }}
        className={`absolute left-[15%] top-[75%] text-[6rem] md:text-[10rem] font-black tracking-tighter ${color} whitespace-nowrap rotate-[4deg]`}
      >
        ZEETOP
      </motion.div>
    </div>
  );
}
