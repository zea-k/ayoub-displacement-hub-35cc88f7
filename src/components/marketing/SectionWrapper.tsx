import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function SectionWrapper({ children, className = "", id }: Props) {
  return (
    <section
      id={id}
      className={`py-20 lg:py-28 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
