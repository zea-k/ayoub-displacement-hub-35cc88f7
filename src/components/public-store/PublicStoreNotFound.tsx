import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export function PublicStoreNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-gray-300" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-gray-800">Store not found</h1>
        <p className="text-gray-400 text-sm">This store doesn't exist or is not public.</p>
      </motion.div>
    </div>
  );
}
