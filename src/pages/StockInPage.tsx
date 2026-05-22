import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import DashboardPageHeader from "@/components/DashboardPageHeader";

interface Product { id: string; name: string; buying_price: number; selling_price: number; }
interface StockInRecord {
  id: string;
  quantity: number;
  buying_price: number;
  selling_price: number | null;
  total_cost: number;
  notes: string | null;
  created_at: string;
  products: { name: string } | null;
}

export default function StockInPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<StockInRecord[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyingPrice, setBuyingPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  const fetchData = async () => {
    if (!user) return;
    const [prodRes, recRes] = await Promise.all([
      supabase.from("products").select("id, name, buying_price, selling_price").eq("owner_id", user.id).order("name"),
      supabase.from("stock_in").select("id, quantity, buying_price, selling_price, total_cost, notes, created_at, products(name)").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setRecords((recRes.data as unknown as StockInRecord[]) || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Auto-fill prices when product changes
  useEffect(() => {
    if (selectedProduct) {
      setBuyingPrice(Number(selectedProduct.buying_price) || 0);
      setSellingPrice(Number(selectedProduct.selling_price) || 0);
    }
  }, [selectedProduct]);

  const resetForm = () => {
    setProductId("");
    setQuantity(1);
    setBuyingPrice(0);
    setSellingPrice(0);
    setNotes("");
  };

  const handleAdd = async () => {
    if (!user || !productId) { toast.error("Select a product"); return; }
    if (quantity <= 0) { toast.error("Quantity must be greater than 0"); return; }
    setSaving(true);
    const { error } = await supabase.from("stock_in").insert({
      product_id: productId,
      quantity,
      buying_price: buyingPrice,
      selling_price: sellingPrice,
      owner_id: user.id,
      notes: notes || null,
    });
    if (error) { setSaving(false); toast.error(error.message); return; }

    const { data: prod, error: prodErr } = await supabase.from("products").select("stock").eq("id", productId).single();
    if (prodErr) { setSaving(false); toast.error("Product not found"); return; }
    if (prod) {
      await supabase.from("products")
        .update({ stock: prod.stock + quantity, buying_price: buyingPrice, selling_price: sellingPrice })
        .eq("id", productId);
    }
    setSaving(false);
    toast.success("Stock added");
    setOpen(false);
    resetForm();
    fetchData();
  };

  const totalCost = quantity * buyingPrice;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Stock In"
        subtitle="Add new stock batches. Prices auto-fill from each product but can be edited per batch."
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 transition-all shadow-lg shadow-primary/25">
                <Plus className="mr-2 h-4 w-4" /> Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Stock In</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No products yet. Add one first.</div>
                      )}
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      Defaults — Buy: TZS {Number(selectedProduct.buying_price).toLocaleString()} · Sell: TZS {Number(selectedProduct.selling_price).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} value={quantity} onChange={e => setQuantity(+e.target.value)} className="h-11" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Buying Price <span className="text-xs text-muted-foreground">(per unit)</span></Label>
                    <Input type="number" min={0} value={buyingPrice} onChange={e => setBuyingPrice(+e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price <span className="text-xs text-muted-foreground">(per unit)</span></Label>
                    <Input type="number" min={0} value={sellingPrice} onChange={e => setSellingPrice(+e.target.value)} className="h-11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Batch reference, supplier note…" className="h-11" />
                </div>

                <div className="rounded-xl bg-muted/50 border border-border/60 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total batch cost</span>
                  <span className="font-mono font-semibold text-foreground">TZS {totalCost.toLocaleString()}</span>
                </div>

                <Button className="w-full h-11" onClick={handleAdd} disabled={saving || !productId}>
                  {saving ? "Saving…" : "Save Stock In"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2">Recent Stock Movements</h2>
            <p className="text-sm text-muted-foreground">Last 50 stock in records</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/40 bg-background/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-background/80">
                  <TableHead className="font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Product</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Qty</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Buy Price</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Sell Price</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Total Cost</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id} className="border-border/40 hover:bg-background/60 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {r.products?.name || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-foreground">{r.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">TZS {Number(r.buying_price).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">TZS {Number(r.selling_price ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-foreground">TZS {Number(r.total_cost).toLocaleString()}</TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{r.notes || "—"}</span></TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">No stock in records yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Add your first stock batch above</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
