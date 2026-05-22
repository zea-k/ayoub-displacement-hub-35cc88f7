/**
 * Mobile Responsive Utilities and Best Practices
 * Zeetop UI - Mobile First Approach
 */

/**
 * Breakpoint Guide:
 * - sm: 640px  - Small phones
 * - md: 768px  - Tablets/Large phones
 * - lg: 1024px - Laptops
 * - xl: 1280px - Desktops
 */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Mobile-First Typography Scale
 * Use these classes for responsive text sizing
 */
export const RESPONSIVE_TEXT = {
  h1: 'text-2xl md:text-4xl lg:text-5xl',
  h2: 'text-xl md:text-3xl lg:text-4xl',
  h3: 'text-lg md:text-2xl lg:text-3xl',
  h4: 'text-base md:text-xl lg:text-2xl',
  body: 'text-sm md:text-base lg:text-lg',
  small: 'text-xs md:text-sm lg:text-base',
};

/**
 * Common Mobile-Responsive Spacing
 */
export const RESPONSIVE_SPACING = {
  container: 'px-4 sm:px-6 lg:px-8',
  section: 'py-8 md:py-16 lg:py-24',
  gap: 'gap-4 md:gap-6 lg:gap-8',
};

/**
 * Mobile Touch Target Sizes (minimum 44x44px for accessibility)
 */
export const TOUCH_TARGET = {
  button: 'h-11 w-11 md:h-12 md:w-12',
  icon: 'w-5 h-5 md:w-6 md:h-6',
};

/**
 * Grid Responsive Helpers
 */
export const RESPONSIVE_GRID = {
  twoCol: 'grid-cols-1 md:grid-cols-2',
  threeCol: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  fourCol: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

/**
 * Card/Container Responsive Padding
 */
export const RESPONSIVE_PADDING = {
  card: 'p-4 md:p-6 lg:p-8',
  section: 'px-4 sm:px-6 lg:px-8 py-6 md:py-8',
};

/**
 * Image Responsiveness
 */
export const RESPONSIVE_IMAGE = {
  thumbnail: 'w-16 h-16 md:w-20 md:h-20',
  small: 'w-32 h-32 md:w-48 md:h-48',
  large: 'w-full h-64 md:h-96 lg:h-[500px]',
};

/**
 * Mobile-Safe Component Sizing
 * Ensures components work well on all screen sizes
 */
export function getMobileResponsiveClasses(component: string): string {
  const classes: Record<string, string> = {
    button: 'py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm',
    input: 'py-2 md:py-3 px-3 md:px-4 text-sm',
    card: 'p-4 md:p-6 rounded-lg md:rounded-xl',
    modal: 'mx-4 md:mx-0 w-full md:w-2/3 lg:w-1/2',
  };
  return classes[component] || '';
}

/**
 * Mobile-Friendly Layout Helpers
 */
export const LAYOUTS = {
  // Full-width section with max-width constraint
  container: 'max-w-6xl mx-auto',
  
  // Two-column layout that stacks on mobile
  twoColumnStack: 'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8',
  
  // Three-column layout with mobile fallback
  threeColumnStack: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
  
  // Flex center for mobile, spread on desktop
  flexCenterMobile: 'flex flex-col md:flex-row items-center md:justify-between gap-4 md:gap-0',
};

// CSS Tips for Mobile Optimization:
// 1. Use overflow-hidden on containers to prevent horizontal scroll
// 2. Use max-w-full on images to prevent overflow
// 3. Use word-break classes for long text
// 4. Use flex-wrap for responsive layouts
// 5. Always test touch interactions (44x44px minimum)
// 6. Use media queries for critical adjustments
// 7. Optimize images for mobile (use picture tags or srcset)
// 8. Consider viewport meta tags and safe areas
