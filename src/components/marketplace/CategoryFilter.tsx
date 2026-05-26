export interface CategoryOption {
  id: string;
  name: string;
  count?: number;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto scroll-smooth pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            activeCategoryId === "all"
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-card/50 text-muted-foreground hover:bg-card border border-border/40 hover:border-border hover:text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategoryId === category.id
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card/50 text-muted-foreground hover:bg-card border border-border/40 hover:border-border hover:text-foreground"
            }`}
          >
            {category.name}
            {category.count && <span className="ml-2 text-xs opacity-70">({category.count})</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
