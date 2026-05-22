import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/zeetop-logo.png";

export default function BrandLoader({ show, label }: { show: boolean; label?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white"
        >
          <motion.img
            src={logo}
            alt="ZEETOP"
            className="h-24 w-24 object-contain"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [0.85, 1.05, 1], opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-primary"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </motion.div>
          {label && <div className="mt-4 text-xs text-gray-500">{label}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
