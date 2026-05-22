export interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto scroll-smooth pb-3 scrollbar-hide">
      <div className="inline-flex items-center gap-2 px-4">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeCategoryId === "all"
              ? "bg-primary text-white shadow-lg shadow-primary/25"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategoryId === category.id
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
