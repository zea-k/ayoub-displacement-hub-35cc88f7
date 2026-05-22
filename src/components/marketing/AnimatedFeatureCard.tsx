import React from 'react';

interface AnimatedFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  features?: string[];
  reverse?: boolean;
  delay?: number;
}

export function AnimatedFeatureCard({
  icon: Icon,
  title,
  description,
  features = [],
  reverse = false,
}: AnimatedFeatureCardProps) {
  return (
    <section className="w-full py-8 md:py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className={`order-2 flex justify-center ${reverse ? 'md:order-2' : 'md:order-1'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-2xl opacity-20" />
              <div className="relative bg-gray-50 border border-gray-200 rounded-2xl p-8 md:p-12 backdrop-blur">
                <Icon className="w-32 md:w-48 h-32 md:h-48 text-gray-900/20" />
              </div>
            </div>
          </div>

          <div className={`order-1 ${reverse ? 'md:order-1' : 'md:order-2'}`}>
            <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{title}</h3>
            <p className="text-gray-500 text-sm md:text-base mb-6 leading-relaxed">{description}</p>
            {features.length > 0 && (
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gray-900 text-xs font-bold">✓</span>
                    </div>
                    <span className="text-sm md:text-base text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnimatedFeatureCard;
