import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Trash2, Percent, ChevronDown, ChevronUp } from "lucide-react";
import type { CartItem, SaleDiscount } from "./types";

interface Props {
  items: CartItem[];
  saleDiscount: SaleDiscount;
  totals: {
    subtotal: number;
    totalItemDiscount: number;
    saleDiscountAmount: number;
    finalTotal: number;
    totalProfit: number;
    discountWarning: boolean;
  };
  paymentMethod: string;
  amountReceived: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onSetItemDiscount: (id: string, type: 'none' | 'percentage' | 'fixed', value: number) => void;
  onUpdateSaleDiscount: (type: 'none' | 'percentage' | 'fixed', value: number) => void;
  onPaymentMethodChange: (method: string) => void;
  onAmountReceivedChange: (amount: number) => void;
  onCompleteSale: () => void;
  loading: boolean;
}

export default function POSCart({
  items, saleDiscount, totals, paymentMethod, amountReceived,
  onUpdateQuantity, onRemoveItem, onSetItemDiscount, onUpdateSaleDiscount,
  onPaymentMethodChange, onAmountReceivedChange, onCompleteSale, loading,
}: Props) {
  const [expandedDiscount, setExpandedDiscount] = useState<string | null>(null);
  const [showSaleDiscount, setShowSaleDiscount] = useState(false);

  const balance = amountReceived - totals.finalTotal;

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-heading text-lg font-bold mb-2">Cart</h2>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {items.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Tap products to add to cart
          </div>
        )}
        {items.map(item => (
          <div key={item.productId} className="bg-card border border-border rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
              <button onClick={() => onRemoveItem(item.productId)} className="text-destructive hover:text-destructive/80 p-0.5">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                  className="h-6 w-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                  className="h-6 w-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                  disabled={item.quantity >= item.stock}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="text-right">
                {item.discountAmount > 0 && (
                  <div className="text-[10px] text-muted-foreground line-through">
                    TZS {(item.unitPrice * item.quantity).toLocaleString()}
                  </div>
                )}
                <div className="text-sm font-bold">TZS {item.subtotal.toLocaleString()}</div>
              </div>
            </div>

            {/* Item Discount Toggle */}
            <button
              onClick={() => setExpandedDiscount(expandedDiscount === item.productId ? null : item.productId)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <Percent className="h-3 w-3" />
              {item.discountAmount > 0 ? `Discount: -TZS ${item.discountAmount.toLocaleString()}` : 'Add discount'}
              {expandedDiscount === item.productId ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {expandedDiscount === item.productId && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={item.discountType}
                    onValueChange={(v: 'none' | 'percentage' | 'fixed') => onSetItemDiscount(item.productId, v, item.discountValue)}
                  >
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {item.discountType !== 'none' && (
                  <Input
                    type="number"
                    min={0}
                    value={item.discountValue}
                    onChange={e => onSetItemDiscount(item.productId, item.discountType, +e.target.value)}
                    className="h-7 w-20 text-xs"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals & Payment */}
      {items.length > 0 && (
        <div className="border-t border-border pt-3 mt-2 space-y-2 flex-shrink-0">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>TZS {totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.totalItemDiscount > 0 && (
            <div className="flex justify-between text-xs text-destructive">
              <span>Item discounts</span>
              <span>-TZS {totals.totalItemDiscount.toLocaleString()}</span>
            </div>
          )}

          {/* Sale Discount */}
          <button
            onClick={() => setShowSaleDiscount(!showSaleDiscount)}
            className="text-xs text-primary hover:underline"
          >
            {showSaleDiscount ? 'Hide' : 'Add'} sale discount
          </button>
          {showSaleDiscount && (
            <div className="flex gap-2 items-end">
              <Select
                value={saleDiscount.type}
                onValueChange={(v: 'none' | 'percentage' | 'fixed') => onUpdateSaleDiscount(v, saleDiscount.value)}
              >
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
              {saleDiscount.type !== 'none' && (
                <Input
                  type="number"
                  min={0}
                  value={saleDiscount.value}
                  onChange={e => onUpdateSaleDiscount(saleDiscount.type, +e.target.value)}
                  className="h-7 w-24 text-xs"
                />
              )}
            </div>
          )}
          {totals.saleDiscountAmount > 0 && (
            <div className="flex justify-between text-xs text-destructive">
              <span>Sale discount</span>
              <span>-TZS {totals.saleDiscountAmount.toLocaleString()}</span>
            </div>
          )}

          {totals.discountWarning && (
            <div className="text-[10px] bg-destructive/10 text-destructive rounded p-1.5 text-center font-medium">
              ⚠️ Total discount exceeds 30%
            </div>
          )}

          {/* Final Total */}
          <div className="flex justify-between text-lg font-bold font-heading border-t border-border pt-2">
            <span>Total</span>
            <span className="text-primary">TZS {totals.finalTotal.toLocaleString()}</span>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-xs">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'cash' && (
            <div>
              <Label className="text-xs">Amount Received</Label>
              <Input
                type="number"
                min={0}
                value={amountReceived || ''}
                onChange={e => onAmountReceivedChange(+e.target.value)}
                className="h-9"
                placeholder="Enter amount..."
              />
              {amountReceived > 0 && (
                <div className={`text-sm font-bold mt-1 ${balance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  Balance: TZS {balance.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Complete Button */}
          <Button
            className="w-full h-12 text-base font-bold"
            onClick={onCompleteSale}
            disabled={loading || items.length === 0 || (paymentMethod === 'cash' && amountReceived < totals.finalTotal)}
          >
            {loading ? 'Processing...' : `Complete Sale — TZS ${totals.finalTotal.toLocaleString()}`}
          </Button>
        </div>
      )}
    </div>
  );
}
