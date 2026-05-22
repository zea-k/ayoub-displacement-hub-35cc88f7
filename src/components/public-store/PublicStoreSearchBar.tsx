import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StoreSettings } from "@/pages/PublicStorePage";

interface Props {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  store: StoreSettings;
  isDark: boolean;
  totalProducts: number;
}

export function PublicStoreSearchBar({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  store,
  isDark,
  totalProducts,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-2"
    >
      {/* Search Row */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 transition-colors ${
              focused ? "opacity-100" : "opacity-40"
            }`}
            style={focused ? { color: store.theme_color } : undefined}
          />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search products..."
            className={`pl-10 pr-10 h-12 rounded-2xl text-sm transition-all duration-300 border-2 ${
              isDark
                ? "bg-white/5 border-white/10 focus:border-white/25 placeholder:text-gray-600"
                : "bg-white border-gray-200 focus:border-gray-300 placeholder:text-gray-400 shadow-sm"
            } ${focused ? "ring-2 ring-opacity-20" : ""}`}
            style={focused ? { borderColor: `${store.theme_color}66`, boxShadow: `0 0 0 3px ${store.theme_color}15` } : undefined}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
              }`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className={`hidden md:flex items-center rounded-xl p-1 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "text-white shadow-md"
                : isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={viewMode === "grid" ? { backgroundColor: store.theme_color } : undefined}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "text-white shadow-md"
                : isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={viewMode === "list" ? { backgroundColor: store.theme_color } : undefined}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onCategoryChange("")}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            selectedCategory === ""
              ? "text-white shadow-lg"
              : isDark
              ? "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
          }`}
          style={
            selectedCategory === ""
              ? { backgroundColor: store.theme_color, boxShadow: `0 4px 15px -3px ${store.theme_color}55` }
              : undefined
          }
        >
          All ({totalProducts})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              selectedCategory === cat
                ? "text-white shadow-lg"
                : isDark
                ? "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
            style={
              selectedCategory === cat
                ? { backgroundColor: store.theme_color, boxShadow: `0 4px 15px -3px ${store.theme_color}55` }
                : undefined
            }
          >
            {cat}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
