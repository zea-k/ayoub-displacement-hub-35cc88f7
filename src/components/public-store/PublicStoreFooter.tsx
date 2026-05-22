import type { StoreSettings } from "@/pages/PublicStorePage";

interface Props {
  store: StoreSettings;
  isDark: boolean;
}

export function PublicStoreFooter({ store, isDark: _isDark }: Props) {
  return (
    <footer className="relative border-t border-gray-200 py-8 text-center bg-white/60">
      <div className="container mx-auto px-4">
        <p className="text-xs font-medium text-gray-600">
          &copy; {new Date().getFullYear()} {store.business_name}
        </p>
        <p className="text-[10px] mt-1 text-gray-400">
          Powered by <span className="font-semibold" style={{ color: store.theme_color }}>ZEETOP</span>
        </p>
      </div>
    </footer>
  );
}
