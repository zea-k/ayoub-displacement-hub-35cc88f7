import { useAuthModal } from "@/contexts/AuthModalContext";
import { motion } from "framer-motion";

interface SignUpButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function SignUpButton({ className, children }: SignUpButtonProps) {
  const { openRegister } = useAuthModal();

  return (
    <motion.button
      onClick={openRegister}
      className={`group relative overflow-hidden transition-all duration-300 ${className || 'px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-primary to-accent text-white hover:shadow-2xl'}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
      </div>

      {/* Content */}
      <span className="relative block">
        {children || "Start Free Trial →"}
      </span>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-lg"
        style={{
          boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.3)",
        }}
      />
    </motion.button>
  );
}
