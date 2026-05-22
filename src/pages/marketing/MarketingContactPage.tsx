import { MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

export default function MarketingContactPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Create animated floating elements in background
    const elements = floatingElementsRef.current;
    
    elements.forEach((element, index) => {
      gsap.to(element, {
        duration: 20 + index * 5,
        y: -100,
        opacity: 0.1,
        repeat: -1,
        ease: "none",
        yoyo: true,
      });
    });

    // Parallax effect on scroll
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.02;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.02;
      
      gsap.to(containerRef.current, {
        x: x,
        y: y,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden relative bg-white">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-emerald-400/5 to-cyan-400/5 rounded-full blur-3xl" />
      </div>

      {/* Animated Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) floatingElementsRef.current[i] = el;
            }}
            className={`absolute rounded-full blur-2xl opacity-0 pointer-events-none ${
              i % 2 === 0
                ? "bg-gradient-to-r from-primary to-primary"
                : "bg-gradient-to-r from-emerald-300 to-cyan-300"
            }`}
            style={{
              width: `${200 + i * 50}px`,
              height: `${200 + i * 50}px`,
              left: `${20 + i * 15}%`,
              top: `${-50 + i * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        ref={containerRef}
        className="max-w-3xl w-full text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Premium Heading with Letter Spacing */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-tight tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            letterSpacing: "-0.02em",
            fontWeight: 900,
            background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Stop Guessing
        </motion.h1>

        {/* Subtle Subtext */}
        <motion.p
          className="text-lg md:text-xl text-gray-600 mb-12 font-light tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Get in touch with us
        </motion.p>

        {/* Premium WhatsApp Button with Apple-style interactions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <a
            href="https://wa.me/255752519974"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 md:px-14 py-5 md:py-6 rounded-2xl md:rounded-3xl relative group overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #1FAC56 100%)",
            }}
          >
            {/* Glass effect on hover */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
            
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent" />
            </div>

            {/* Content */}
            <div className="relative flex items-center gap-3">
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </motion.div>
              <span className="font-semibold text-white text-lg md:text-xl tracking-wide">
                Contact via WhatsApp
              </span>
            </div>

            {/* Shadow glow */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                boxShadow: "0 0 40px rgba(37, 211, 102, 0.3)",
              }}
            />
          </a>
        </motion.div>

        {/* Bottom decorative line */}
        <motion.div
          className="mt-24 flex justify-center"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
}
