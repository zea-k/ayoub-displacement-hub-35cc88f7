import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, User, Phone, Sparkles, Package, ImageOff } from "lucide-react";
import type { StoreSettings, PublicProduct } from "@/pages/PublicStorePage";
import type { CartItem } from "./PublicStoreCart";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  store: StoreSettings;
  isDark: boolean;
  form: { customer_name: string; phone: string };
  setForm: React.Dispatch<React.SetStateAction<{ customer_name: string; phone: string }>>;
  onSubmit: () => void;
  submitting: boolean;
}

export function PublicStoreCheckoutDialog({ open, onOpenChange, items, store, isDark, form, setForm, onSubmit, submitting }: Props) {
  const total = items.reduce((s, i) => s + i.product.selling_price * i.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-lg rounded-2xl border-0 shadow-2xl overflow-hidden ${isDark ? "bg-[#12121a] text-gray-100" : "bg-white"}`}>
        <div
          className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% -20%, ${store.theme_color}, transparent 70%)` }}
        />

        <DialogHeader className="relative pb-2">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${store.theme_color}, ${store.theme_color}cc)` }}
            >
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="font-heading text-lg">Checkout</DialogTitle>
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative space-y-4 pt-2">
          {/* Order summary */}
          <div className={`rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-100"}`}>
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                      <ImageOff className="h-4 w-4 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>× {item.quantity}</p>
                </div>
                <p className="text-sm font-bold shrink-0">
                  TZS {(item.product.selling_price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Your Name
              </Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                placeholder="Full name"
                className={`rounded-xl h-11 ${isDark ? "bg-white/5 border-white/10" : ""}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+255..."
                className={`rounded-xl h-11 ${isDark ? "bg-white/5 border-white/10" : ""}`}
              />
            </div>
          </div>

          {/* Total */}
          <div className={`rounded-xl p-4 text-center ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-100"}`}>
            <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? "text-gray-500" : "text-gray-600"}`}>Total Amount</p>
            <p className="font-heading text-3xl font-extrabold mt-1" style={{ color: store.theme_color }}>
              TZS {total.toLocaleString()}
            </p>
          </div>

          <Button
            className="w-full h-12 rounded-xl font-bold text-base shadow-lg text-white border-0 transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: store.theme_color,
              boxShadow: `0 8px 30px -6px ${store.theme_color}55`,
            }}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Order...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Place Order
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
