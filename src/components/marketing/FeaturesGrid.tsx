import {
  Package,
  DollarSign,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface Feature {
  image: string;
  title: string;
  description: string;
  color: string;
  lightColor: string;
}

const FEATURES: Feature[] = [
  {
    image: '/111.png',
    title: 'Inventory Management',
    description: 'Never run out of stock with smart tracking',
    color: 'from-green-500 to-emerald-500',
    lightColor: 'bg-green-500/10',
  },
  {
    image: '/222.png',
    title: 'Sales & Expenses',
    description: 'Track every sale and expense - know your true profit',
    color: 'from-accent to-orange-500',
    lightColor: 'bg-accent/10',
  },
  {
    image: '/333.png',
    title: 'Business Dashboard',
    description: 'Real-time overview of sales, stock and profit',
    color: 'from-blue-500 to-indigo-500',
    lightColor: 'bg-blue-500/10',
  },
  {
    image: '/111.png',
    title: 'Reports & Downloads',
    description: 'Generate PDF reports for sales, profit, inventory',
    color: 'from-primary to-primary',
    lightColor: 'bg-primary/10',
  },
  {
    image: '/222.png',
    title: 'Multi-Business / Branches',
    description: 'Manage unlimited branches from one dashboard',
    color: 'from-orange-500 to-accent',
    lightColor: 'bg-orange-500/10',
  },
  {
    image: '/333.png',
    title: 'Mobile-Friendly Access',
    description: 'Full access on phone, tablet or desktop - works offline',
    color: 'from-primary to-pink-500',
    lightColor: 'bg-primary/10',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="w-full py-8 md:py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-xs md:text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Everything You Need
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
            Powerful tools to help you manage and grow your business
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={`p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 hover:border-gray-300 ${feature.lightColor} backdrop-blur transition-colors duration-200 group`}
            >
              <div className={`w-12 md:w-14 h-12 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4`}>
                <div className="w-full h-full rounded-lg md:rounded-[10px] bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={feature.image} alt={feature.title} loading="lazy" className="w-12 md:w-14 h-12 md:h-14 object-cover rounded-md" />
                </div>
              </div>

              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-4 flex items-center text-xs md:text-sm text-gray-500 group-hover:text-gray-900 transition-colors">
                Learn more
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Active Users', value: '10K+', icon: Users },
            { label: 'Business Tracked', value: '5K+', icon: Package },
            { label: 'Revenue Managed', value: 'TZS 500B+', icon: DollarSign },
            { label: 'Uptime', value: '99.9%', icon: Zap },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={i}
                className="p-4 md:p-6 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 text-center hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <StatIcon className="w-5 md:w-6 h-5 md:h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
