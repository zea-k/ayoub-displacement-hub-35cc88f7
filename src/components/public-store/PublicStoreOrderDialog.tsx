import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, User, Phone, Hash, Sparkles } from "lucide-react";
import type { StoreSettings, PublicProduct } from "@/pages/PublicStorePage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: PublicProduct | null;
  store: StoreSettings | null;
  isDark: boolean;
  form: { customer_name: string; phone: string; quantity: number };
  setForm: React.Dispatch<React.SetStateAction<{ customer_name: string; phone: string; quantity: number }>>;
  onSubmit: () => void;
  submitting: boolean;
}

export function PublicStoreOrderDialog({ open, onOpenChange, product, store, isDark, form, setForm, onSubmit, submitting }: Props) {
  if (!product || !store) return null;

  const total = product.selling_price * form.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md rounded-2xl border-0 shadow-2xl overflow-hidden ${isDark ? "bg-[#12121a] text-gray-100" : "bg-white"}`}>
        {/* Glow header */}
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
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="font-heading text-lg">{product.name}</DialogTitle>
              <p className="text-sm font-bold mt-0.5" style={{ color: store.theme_color }}>
                TZS {product.selling_price.toLocaleString()} per unit
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Your Name
            </Label>
            <Input
              value={form.customer_name}
              onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="Full name"
              className={`rounded-xl h-11 ${isDark ? "bg-white/5 border-white/10 focus:border-white/20" : ""}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone Number
            </Label>
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+255..."
              className={`rounded-xl h-11 ${isDark ? "bg-white/5 border-white/10 focus:border-white/20" : ""}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" /> Quantity
            </Label>
            <Input
              type="number"
              min={1}
              max={product.stock || 99}
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
              className={`rounded-xl h-11 ${isDark ? "bg-white/5 border-white/10 focus:border-white/20" : ""}`}
            />
          </div>

          {/* Total with glow */}
          <div
            className={`rounded-xl p-4 text-center ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-100"}`}
          >
            <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? "text-gray-500" : "text-gray-600"}`}>Total Amount</p>
            <p className="font-heading text-3xl font-extrabold mt-1" style={{ color: store.theme_color }}>
              TZS {total.toLocaleString()}
            </p>
          </div>

          <Button
            className="w-full h-12 rounded-xl font-bold text-base shadow-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-xl text-white border-0"
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
