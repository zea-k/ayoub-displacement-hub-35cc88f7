import { motion } from "framer-motion";

export function PublicStoreLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 animate-pulse" />
          <div className="absolute inset-0 h-12 w-12 rounded-2xl border-2 border-primary/40 border-t-primary animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-400 animate-pulse">Loading store...</p>
      </motion.div>
    </div>
  );
}
