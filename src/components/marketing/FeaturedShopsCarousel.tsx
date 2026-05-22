import { useState } from 'react';
import { Star, MapPin, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedShop {
  id: number;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  monthlyRevenue: string;
  growth: number;
  image: string;
  description: string;
  products: number;
}

const FEATURED_SHOPS: FeaturedShop[] = [
  { id: 1, name: 'Fashion Hub', category: 'Clothing & Fashion', location: 'Dar es Salaam', rating: 4.8, reviews: 234, monthlyRevenue: 'TZS 45M', growth: 28, image: 'https://images.unsplash.com/photo-1441984904556-0ac8ce9feafd?w=500&q=80', description: 'Trending fashion items with excellent customer service', products: 156 },
  { id: 2, name: 'Tech Store', category: 'Electronics', location: 'Mwanza', rating: 4.9, reviews: 189, monthlyRevenue: 'TZS 62M', growth: 35, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', description: 'Quality electronics and gadgets at competitive prices', products: 203 },
  { id: 3, name: 'Spice Market', category: 'Food & Beverages', location: 'Arusha', rating: 4.7, reviews: 156, monthlyRevenue: 'TZS 38M', growth: 22, image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&q=80', description: 'Premium spices and local delicacies', products: 89 },
  { id: 4, name: 'Home Essentials', category: 'Home & Living', location: 'Dodoma', rating: 4.6, reviews: 142, monthlyRevenue: 'TZS 41M', growth: 18, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80', description: 'Quality home products and decorations', products: 124 },
];

export default function FeaturedShopsCarousel() {
  const [selectedId, setSelectedId] = useState<number>(FEATURED_SHOPS[0].id);
  const selectedShop = FEATURED_SHOPS.find((s) => s.id === selectedId) || FEATURED_SHOPS[0];

  return (
    <section className="w-full py-8 md:py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent text-xs md:text-sm font-medium mb-4">
            Marketplace
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">Featured Shops</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
            Discover thriving businesses using ZEETOP. See their success stories.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {FEATURED_SHOPS.map((shop) => (
              <button
                key={shop.id}
                onClick={() => setSelectedId(shop.id)}
                className={`p-4 md:p-6 rounded-lg md:rounded-xl border-2 transition-colors text-left overflow-hidden group relative h-full ${
                  selectedId === shop.id
                    ? 'bg-gray-100 border-primary shadow-lg shadow-primary/20'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="absolute inset-0 overflow-hidden rounded-lg md:rounded-xl">
                  <img src={shop.image} alt={shop.name} loading="lazy" className="w-full h-full object-cover opacity-20" />
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-bold text-gray-900 truncate">{shop.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{shop.category}</p>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 bg-accent/20 rounded text-accent text-xs font-semibold">
                      +{shop.growth}%
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs md:text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-900">{shop.rating}</span>
                    <span className="text-gray-500">({shop.reviews})</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {shop.location}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs md:text-sm text-gray-700">{shop.monthlyRevenue}/month</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-200 backdrop-blur flex flex-col">
            <div className="w-full h-40 md:h-56 rounded-lg md:rounded-xl overflow-hidden mb-4 md:mb-6">
              <img src={selectedShop.image} alt={selectedShop.name} className="w-full h-full object-cover" />
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedShop.name}</h3>
            <p className="text-sm md:text-base text-gray-500 mb-4">{selectedShop.category}</p>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Monthly Revenue</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{selectedShop.monthlyRevenue}</p>
              </div>
              <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Growth</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  {selectedShop.growth}%
                </p>
              </div>
              <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Products</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{selectedShop.products}</p>
              </div>
              <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <div className="flex items-end gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg md:text-xl font-bold text-gray-900">{selectedShop.rating}</span>
                </div>
              </div>
            </div>

            <p className="text-sm md:text-base text-gray-700 mb-6 md:mb-8 flex-grow">{selectedShop.description}</p>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Button variant="outline" className="w-full text-xs md:text-sm">View Shop</Button>
              <Button className="w-full text-xs md:text-sm bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-16 p-6 md:p-8 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-200 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Ready to Grow Your Business?</h3>
          <p className="text-gray-500 max-w-2xl mx-auto mb-6 text-sm md:text-base">
            Join thousands of successful business owners using ZEETOP to track sales, stock, and profit.
          </p>
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-gray-900 text-sm md:text-base py-2 md:py-3 px-6 md:px-8">
            Start Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
}
