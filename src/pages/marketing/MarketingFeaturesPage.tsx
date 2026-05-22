import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  "Sales Tracking (real-time updates)",
  "Inventory Management (stock control & alerts)",
  "Expense Tracking (daily business costs)",
  "Online Orders (customers can buy directly from store)",
  "Profit Reports (business insights dashboard)",
  "Multi-device Sync (mobile & desktop access)",
  "Fast Checkout System (optimized sales speed)"
];

export default function MarketingFeaturesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const divider = dividerRef.current;

    if (!container || !left || !right) return;

    let state = { index: 0 };

    // Initial content
    left.innerHTML = `<h2 class="text-2xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight text-slate-900 text-center max-w-xl">${features[0]}</h2>`;
    right.innerHTML = `<h2 class="text-2xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight text-slate-900/75 text-center max-w-xl">${features[0]}</h2>`;

    const updateFeature = (i: number) => {
      gsap.to(left, {
        opacity: 0,
        y: -26,
        filter: "blur(10px)",
        duration: 0.38,
        ease: "power2.in",
        onComplete: () => {
          left.innerHTML = `<h2 class="text-2xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight text-slate-900 text-center max-w-xl">${features[i]}</h2>`;
          gsap.to(left, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power3.out"
          });
        }
      });

      gsap.to(right, {
        opacity: 0,
        y: 26,
        filter: "blur(11px)",
        duration: 0.38,
        ease: "power2.in",
        onComplete: () => {
          right.innerHTML = `<h2 class="text-2xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight text-slate-900/75 text-center max-w-xl">${features[i]}</h2>`;
          gsap.to(right, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power3.out"
          });
        }
      });
    };

    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${features.length * 120}%`,
      pin: true,
      scrub: true,

      onUpdate: (self) => {
        const newIndex = Math.min(
          features.length - 1,
          Math.floor(self.progress * features.length)
        );

        if (newIndex !== state.index) {
          state.index = newIndex;
          updateFeature(newIndex);
        }

        // Mirror parallax effect
        gsap.set(left, {
          y: -self.progress * 90,
          scale: 1 + self.progress * 0.01
        });
        gsap.set(right, {
          y: self.progress * 90,
          scale: 1 - self.progress * 0.01
        });

        // Divider glow effect
        if (divider) {
          gsap.to(divider, {
            opacity: 0.18 + self.progress * 0.38,
            duration: 0.2,
            ease: "power1.out"
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">

      {/* FEATURES SECTION */}
      <div
        ref={containerRef}
        className="relative h-screen overflow-hidden shadow-[inset_0_0_130px_rgba(15,23,42,0.05)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.95), transparent 26%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.72), transparent 16%)"
        }}
      >

        {/* LEFT SIDE */}
        <div
          ref={leftRef}
          className="absolute left-0 top-0 w-full h-1/2 md:w-1/2 md:h-full flex items-center justify-center px-8 bg-gradient-to-br from-slate-50 via-white to-white/90 border-b border-white/40 md:border-b-0 md:border-r shadow-[inset_0_0_110px_rgba(255,255,255,0.55)] backdrop-blur-sm"
        />

        {/* RIGHT SIDE */}
        <div
          ref={rightRef}
          className="absolute left-0 bottom-0 w-full h-1/2 md:right-0 md:left-auto md:top-0 md:w-1/2 md:h-full flex items-center justify-center px-8 bg-white/15 backdrop-blur-xl border-t border-white/35 md:border-t-0 md:border-l shadow-[inset_0_0_90px_rgba(255,255,255,0.3),0_0_60px_rgba(15,23,42,0.06)]"
        />

        {/* DIAGONAL MIRROR LINE */}
        <div
          ref={dividerRef}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/2 left-0 w-full h-[1px] rotate-45 origin-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-30 blur-sm" />
          </div>
          <div className="absolute top-1/2 left-0 w-full h-[2px] rotate-45 origin-center">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/35 to-transparent opacity-25" />
          </div>
        </div>

      </div>
    </div>
  );
}