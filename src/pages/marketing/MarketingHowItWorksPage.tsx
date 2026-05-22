'use client';

import { useState } from 'react';
import SignUpButton from '@/components/marketing/SignUpButton';

const steps = [
  {
    id: 1,
    title: 'Create your business account',
    cta: 'Start Free Trial',
  },
  {
    id: 2,
    title: 'Add products and stock',
  },
  {
    id: 3,
    title: 'Start selling and tracking sales',
  },
];

export default function MarketingHowItWorksPage() {
  const [active, setActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const next = () => {
    if (active >= steps.length - 1) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActive((prev) => prev + 1);
      setIsTransitioning(false);
    }, 250);
  };

  const back = () => {
    if (active <= 0) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActive((prev) => prev - 1);
      setIsTransitioning(false);
    }, 250);
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-white">

      {/* STEP CONTAINER */}
      <div className="relative h-full flex items-center justify-center">

        <div
          className="text-center max-w-2xl transition-all duration-500 ease-in-out"
          style={{
            transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            opacity: isTransitioning ? 0.4 : 1,
            filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
          }}
        >

          {/* TITLE */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-10 transition-all duration-500">
            {steps[active].title}
          </h2>

          {/* CTA ON ALL STEPS */}
          <SignUpButton className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition">
            Start Free Trial
          </SignUpButton>

        </div>
      </div>

      {/* NAV BUTTONS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6">

        {/* BACK */}
        <button
          onClick={back}
          disabled={active === 0}
          className={`px-5 py-2 rounded-lg border transition ${
            active === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-100'
          }`}
        >
          Back
        </button>

        {/* DOTS */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* NEXT */}
        <button
          onClick={next}
          disabled={active === steps.length - 1}
          className={`px-5 py-2 rounded-lg border transition ${
            active === steps.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-100'
          }`}
        >
          Next →
        </button>

      </div>

    </section>
  );
}