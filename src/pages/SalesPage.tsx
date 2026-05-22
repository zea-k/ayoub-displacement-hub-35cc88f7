import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, RotateCcw, History, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import POSProductGrid from "@/components/pos/POSProductGrid";
import POSCart from "@/components/pos/POSCart";
import POSReceipt from "@/components/pos/POSReceipt";
import POSDailySummary from "@/components/pos/POSDailySummary";
import { useCart } from "@/components/pos/useCart";
import { useIsMobile } from "@/hooks/use-mobile";
import type { POSProduct, ReceiptData, DailySummary } from "@/components/pos/types";
export default function SalesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const cart = useCart();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(!isMobile);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState(0);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [businessName, setBusinessName] = useState("My Business");
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    totalSales: 0, totalProfit: 0, totalTransactions: 0, totalDiscounts: 0,
    cashTotal: 0, mobileMoneyTotal: 0, bankTotal: 0,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showCloseDay, setShowCloseDay] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundSaleId, setRefundSaleId] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSale, setRefundSale] = useState<any>(null);
  const [refundItems, setRefundItems] = useState<Record<string, number>>({});

  // Fetch products & business name
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [prodRes, settingsRes] = await Promise.all([
        supabase.from("products").select("id, name, category, selling_price, buying_price, stock, description").eq("owner_id", user.id).order("name"),
        supabase.from("public_settings").select("business_name").eq("owner_id", user.id).limit(1).maybeSingle(),
      ]);
      setProducts((prodRes.data as POSProduct[]) || []);
      if (settingsRes.data?.business_name) setBusinessName(settingsRes.data.business_name);
    };
    load();
  }, [user]);

  // Fetch daily summary
  const fetchDailySummary = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("pos_sales")
      .select("final_total, total_profit, payment_method, total_item_discount, sale_discount_amount")
      .eq("owner_id", user.id)
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59");
    if (error) { 
      console.error("Failed to fetch daily summary:", error);
      toast.error("Failed to load daily summary"); 
      return; 
    }
    if (!data || data.length === 0) {
      setDailySummary({ totalSales: 0, totalProfit: 0, totalTransactions: 0, totalDiscounts: 0, cashTotal: 0, mobileMoneyTotal: 0, bankTotal: 0 });
      return;
    }
    const summary: DailySummary = {
      totalSales: data.reduce((s, r) => s + Number(r.final_total), 0),
      totalProfit: data.reduce((s, r) => s + Number(r.total_profit), 0),
      totalTransactions: data.length,
      totalDiscounts: data.reduce((s, r) => s + Number(r.total_item_discount) + Number(r.sale_discount_amount), 0),
      cashTotal: data.filter(r => r.payment_method === 'cash').reduce((s, r) => s + Number(r.final_total), 0),
      mobileMoneyTotal: data.filter(r => r.payment_method === 'mobile_money').reduce((s, r) => s + Number(r.final_total), 0),
      bankTotal: data.filter(r => r.payment_method === 'bank').reduce((s, r) => s + Number(r.final_total), 0),
    };
    setDailySummary(summary);
  }, [user]);

  useEffect(() => { fetchDailySummary(); }, [fetchDailySummary]);

  const cartProductIds = useMemo(() => new Set(cart.items.map(i => i.productId)), [cart.items]);

  // Complete Sale
  const handleCompleteSale = async () => {
    if (!user || cart.items.length === 0) return;

    // Validate stock
    for (const item of cart.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod || prod.stock < item.quantity) {
        toast.error(`Not enough stock for ${item.name}`);
        return;
      }
    }

    if (cart.totals.discountWarning) {
      if (!confirm("Total discount exceeds 30%. Are you sure?")) return;
    }

    setLoading(true);
    try {
      // Generate receipt number
      const { data: receiptNum } = await supabase.rpc("generate_receipt_number", { _owner_id: user.id });
      const receipt = receiptNum || `RCP-${Date.now()}`;

      const received = paymentMethod === 'cash' ? amountReceived : cart.totals.finalTotal;
      const balance = paymentMethod === 'cash' ? received - cart.totals.finalTotal : 0;

      // Insert sale header
      const { data: saleData, error: saleErr } = await supabase.from("pos_sales").insert({
        receipt_number: receipt,
        subtotal: cart.totals.subtotal,
        total_item_discount: cart.totals.totalItemDiscount,
        sale_discount_type: cart.saleDiscount.type,
        sale_discount_value: cart.saleDiscount.value,
        sale_discount_amount: cart.totals.saleDiscountAmount,
        final_total: cart.totals.finalTotal,
        total_profit: cart.totals.totalProfit,
        payment_method: paymentMethod,
        amount_received: received,
        balance_returned: balance,
        owner_id: user.id,
      }).select("id").single();

      if (saleErr) throw saleErr;

      // Insert sale items
      const saleItems = cart.items.map(i => ({
        sale_id: saleData.id,
        product_id: i.productId,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        buying_price: i.buyingPrice,
        discount_type: i.discountType,
        discount_value: i.discountValue,
        discount_amount: i.discountAmount,
        item_subtotal: i.subtotal,
        profit: i.profit,
      }));
      const { error: itemsErr } = await supabase.from("sale_items").insert(saleItems);
      if (itemsErr) throw itemsErr;

      // Update stock for each product
      for (const item of cart.items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) {
          console.error(`Product ${item.productId} not found in cart processing`);
          continue;
        }
        await supabase.from("products").update({ stock: prod.stock - item.quantity }).eq("id", item.productId);
      }

      // Show receipt
      setReceiptData({
        receiptNumber: receipt,
        businessName,
        date: new Date().toLocaleString(),
        items: cart.items,
        subtotal: cart.totals.subtotal,
        totalItemDiscount: cart.totals.totalItemDiscount,
        saleDiscount: cart.totals.saleDiscountAmount,
        finalTotal: cart.totals.finalTotal,
        paymentMethod,
        amountReceived: received,
        balanceReturned: balance,
      });
      setReceiptOpen(true);

      // Reset
      cart.clearCart();
      setPaymentMethod("cash");
      setAmountReceived(0);

      // Refresh
      const { data: freshProducts } = await supabase.from("products")
        .select("id, name, category, selling_price, buying_price, stock, description")
        .eq("owner_id", user.id).order("name");
      setProducts((freshProducts as POSProduct[]) || []);
      fetchDailySummary();

      toast.success("Sale completed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete sale");
    } finally {
      setLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pos_sales")
      .select("id, receipt_number, final_total, payment_method, created_at, total_profit")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory(data || []);
    setShowHistory(true);
  };

  const [todayExpenses, setTodayExpenses] = useState(0);
  const [dayAlreadyClosed, setDayAlreadyClosed] = useState(false);

  // Fetch today's expenses when close day dialog opens
  const openCloseDay = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const [expRes, closedRes] = await Promise.all([
      supabase.from("expenses").select("amount").eq("owner_id", user.id).eq("date", today),
      supabase.from("day_closings").select("id").eq("owner_id", user.id).eq("date", today).maybeSingle(),
    ]);
    const totalExp = (expRes.data || []).reduce((s, e) => s + Number(e.amount), 0);
    setTodayExpenses(totalExp);
    setDayAlreadyClosed(!!closedRes.data);
    setShowCloseDay(true);
  };

  // Close Day
  const handleCloseDay = async () => {
    if (!user) return;
    if (dayAlreadyClosed) { toast.error("Siku hii imeshafungwa"); setShowCloseDay(false); return; }
    const netProfit = dailySummary.totalProfit - todayExpenses;
    const { error } = await supabase.from("day_closings").insert({
      total_sales: dailySummary.totalSales,
      total_profit: dailySummary.totalProfit,
      total_transactions: dailySummary.totalTransactions,
      total_discounts: dailySummary.totalDiscounts,
      cash_total: dailySummary.cashTotal,
      mobile_money_total: dailySummary.mobileMoneyTotal,
      bank_total: dailySummary.bankTotal,
      total_expenses: todayExpenses,
      net_profit: netProfit,
      owner_id: user.id,
    });
    if (error) {
      if (error.message.includes('duplicate')) toast.error("Siku hii imeshafungwa");
      else toast.error(error.message);
    } else {
      toast.success("Mauzo ya leo yamefungwa!");
      // Reset daily summary to 0
      setDailySummary({
        totalSales: 0, totalProfit: 0, totalTransactions: 0, totalDiscounts: 0,
        cashTotal: 0, mobileMoneyTotal: 0, bankTotal: 0,
      });
    }
    setShowCloseDay(false);
  };

  // Refund
  const lookupRefundSale = async () => {
    if (!user || !refundSaleId.trim()) return;
    const { data } = await supabase
      .from("pos_sales")
      .select("id, receipt_number, final_total, sale_items(id, product_id, product_name, quantity, unit_price, item_subtotal)")
      .eq("owner_id", user.id)
      .eq("receipt_number", refundSaleId.trim())
      .maybeSingle();
    if (!data) { toast.error("Sale not found"); return; }
    setRefundSale(data);
    setRefundItems({});
  };

  const handleRefund = async () => {
    if (!user || !refundSale) return;
    const selectedItems = refundSale.sale_items.filter((i: any) => (refundItems[i.id] || 0) > 0);
    if (selectedItems.length === 0) { toast.error("Select items to refund"); return; }

    const refundAmount = selectedItems.reduce((s: number, i: any) => s + (refundItems[i.id] / i.quantity) * Number(i.item_subtotal), 0);

    const { error } = await supabase.from("refunds").insert({
      sale_id: refundSale.id,
      refund_amount: refundAmount,
      reason: refundReason || null,
      items: selectedItems.map((i: any) => ({ product_id: i.product_id, product_name: i.product_name, quantity: refundItems[i.id], unit_price: i.unit_price })),
      owner_id: user.id,
    });
    if (error) { toast.error(error.message); return; }

    // Restock
    for (const item of selectedItems) {
      const qty = refundItems[item.id];
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        await supabase.from("products").update({ stock: prod.stock + qty }).eq("id", item.product_id);
      }
    }

    toast.success(`Refunded TZS ${refundAmount.toLocaleString()}`);
    setShowRefund(false);
    setRefundSale(null);
    setRefundSaleId("");
    setRefundReason("");
    setRefundItems({});

    // Refresh products
    const { data: freshProducts } = await supabase.from("products")
      .select("id, name, category, selling_price, buying_price, stock, description")
      .eq("owner_id", user.id).order("name");
    setProducts((freshProducts as POSProduct[]) || []);
    fetchDailySummary();
  };

  return (
    <div className="space-y-6 pb-6">
      <DashboardPageHeader
        title="Point of Sale"
        subtitle="Complete sales quickly with a single elegant checkout workflow."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isMobile && (
              <Button variant="outline" size="sm" onClick={() => setShowSummary(v => !v)} className="text-xs px-2">
                {showSummary ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span className="ml-1 hidden xs:inline">Summary</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowRefund(true)} className="text-xs px-2 md:px-3">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="ml-1 hidden md:inline">Refund</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchHistory} className="text-xs px-2 md:px-3">
              <History className="h-3.5 w-3.5" />
              <span className="ml-1 hidden md:inline">History</span>
            </Button>
            <Button variant="outline" size="sm" onClick={openCloseDay} className="text-xs px-2 md:px-3">
              <Lock className="h-3.5 w-3.5" />
              <span className="ml-1 hidden md:inline">Close Day</span>
            </Button>
          </div>
        }
      />
      {(!isMobile || showSummary) && <POSDailySummary summary={dailySummary} />}
      <div className="flex flex-col min-h-[calc(100vh-7rem)] overflow-hidden">

      {/* POS Layout */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Products - always visible */}
        <div className="flex-1 min-w-0">
          <POSProductGrid
            products={products}
            onAddToCart={(p) => { cart.addItem(p); if (isMobile) setMobileCartOpen(true); }}
            cartProductIds={cartProductIds}
          />
        </div>

        {/* Cart - desktop sidebar */}
        {!isMobile && (
          <div className="w-80 lg:w-96 flex-shrink-0 bg-card border border-border rounded-lg p-3 overflow-hidden">
            <POSCart
              items={cart.items}
              saleDiscount={cart.saleDiscount}
              totals={cart.totals}
              paymentMethod={paymentMethod}
              amountReceived={amountReceived}
              onUpdateQuantity={cart.updateQuantity}
              onRemoveItem={cart.removeItem}
              onSetItemDiscount={cart.setItemDiscount}
              onUpdateSaleDiscount={cart.updateSaleDiscount}
              onPaymentMethodChange={setPaymentMethod}
              onAmountReceivedChange={setAmountReceived}
              onCompleteSale={handleCompleteSale}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Mobile Cart FAB */}
      {isMobile && (
        <button
          onClick={() => setMobileCartOpen(true)}
className="fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-amber-500 text-primary-foreground shadow-2xl shadow-black/20 flex items-center justify-center active:scale-95 transition-transform hover:scale-105 hover:shadow-2xl hover:shadow-primary/25"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.items.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {cart.items.length}
            </Badge>
          )}
        </button>
      )}

      {/* Mobile Cart Sheet */}
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-4 overflow-y-auto">
          <SheetHeader className="mb-3">
            <SheetTitle>Cart ({cart.items.length} items)</SheetTitle>
          </SheetHeader>
          <POSCart
            items={cart.items}
            saleDiscount={cart.saleDiscount}
            totals={cart.totals}
            paymentMethod={paymentMethod}
            amountReceived={amountReceived}
            onUpdateQuantity={cart.updateQuantity}
            onRemoveItem={cart.removeItem}
            onSetItemDiscount={cart.setItemDiscount}
            onUpdateSaleDiscount={cart.updateSaleDiscount}
            onPaymentMethodChange={setPaymentMethod}
            onAmountReceivedChange={setAmountReceived}
            onCompleteSale={() => { handleCompleteSale(); setMobileCartOpen(false); }}
            loading={loading}
          />
        </SheetContent>
      </Sheet>

      {/* Receipt Dialog */}
      <POSReceipt data={receiptData} open={receiptOpen} onClose={() => setReceiptOpen(false)} />

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sales History</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-xs">{h.receipt_number}</TableCell>
                  <TableCell className="text-xs">{new Date(h.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">TZS {Number(h.final_total).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{h.payment_method?.replace('_', ' ')}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No sales yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Close Day Dialog */}
      <Dialog open={showCloseDay} onOpenChange={setShowCloseDay}>
        <DialogContent>
          <DialogHeader><DialogTitle>Funga Mauzo ya Leo</DialogTitle></DialogHeader>
          {dayAlreadyClosed ? (
            <div className="text-center py-4">
              <p className="text-warning font-medium">⚠️ Siku hii imeshafungwa tayari</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Mauzo:</span><span className="font-bold">TZS {dailySummary.totalSales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Faida (Gross):</span><span className="font-bold text-accent">TZS {dailySummary.totalProfit.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Matumizi:</span><span className="font-bold text-destructive">TZS {todayExpenses.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-bold">Faida Halisi (Net):</span>
                  <span className={`font-bold ${(dailySummary.totalProfit - todayExpenses) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    TZS {(dailySummary.totalProfit - todayExpenses).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between"><span>Transactions:</span><span className="font-bold">{dailySummary.totalTransactions}</span></div>
                <div className="flex justify-between"><span>Discounts:</span><span className="font-bold">TZS {dailySummary.totalDiscounts.toLocaleString()}</span></div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between"><span>Cash:</span><span>TZS {dailySummary.cashTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Mobile Money:</span><span>TZS {dailySummary.mobileMoneyTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Bank:</span><span>TZS {dailySummary.bankTotal.toLocaleString()}</span></div>
                </div>
              </div>
              <Button className="w-full" onClick={handleCloseDay}>Thibitisha Kufunga</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefund} onOpenChange={v => { setShowRefund(v); if (!v) { setRefundSale(null); setRefundSaleId(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Receipt number (e.g. RCP-20260302-0001)"
                value={refundSaleId}
                onChange={e => setRefundSaleId(e.target.value)}
              />
              <Button onClick={lookupRefundSale}>Find</Button>
            </div>
            {refundSale && (
              <>
                <p className="text-sm text-muted-foreground">Total: TZS {Number(refundSale.final_total).toLocaleString()}</p>
                <div className="space-y-2">
                  {refundSale.sale_items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 bg-secondary/50 rounded p-2">
                      <div>
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Sold: {item.quantity} × TZS {Number(item.unit_price).toLocaleString()}</p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={refundItems[item.id] || 0}
                        onChange={e => setRefundItems(prev => ({ ...prev, [item.id]: Math.min(+e.target.value, item.quantity) }))}
                        className="w-16 h-8 text-xs"
                        placeholder="Qty"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Reason</Label>
                  <Input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Reason for refund..." />
                </div>
                <Button className="w-full" onClick={handleRefund}>Process Refund</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
}
