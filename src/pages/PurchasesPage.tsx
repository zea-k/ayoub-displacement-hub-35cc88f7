import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity-log";

interface Purchase {
  id: string;
  product_id: string;
  supplier_id: string | null;
  quantity: number;
  buying_price: number;
  total_cost: number;
  date: string;
  notes: string | null;
  products?: { name: string };
  suppliers?: { name: string } | null;
}

interface Product { id: string; name: string; stock: number; buying_price: number; }
interface Supplier { id: string; name: string; }

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ product_id: "", supplier_id: "", quantity: 0, buying_price: 0, date: new Date().toISOString().split("T")[0], notes: "" });
  const [open, setOpen] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    const [purchRes, prodRes, suppRes] = await Promise.all([
      supabase.from("purchases").select("*, products(name), suppliers(name)").eq("owner_id", user.id).order("date", { ascending: false }).limit(100),
      supabase.from("products").select("id, name, stock, buying_price").eq("owner_id", user.id).order("name"),
      supabase.from("suppliers").select("id, name").eq("owner_id", user.id).order("name"),
    ]);
    setPurchases((purchRes.data as Purchase[]) || []);
    setProducts((prodRes.data as Product[]) || []);
    setSuppliers((suppRes.data as Supplier[]) || []);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const totalCost = form.quantity * form.buying_price;

  const handleAdd = async () => {
    if (!user || !form.product_id) { toast.error("Select a product"); return; }
    if (form.quantity <= 0) { toast.error("Quantity must be > 0"); return; }

    const { error } = await supabase.from("purchases").insert({
      product_id: form.product_id,
      supplier_id: form.supplier_id || null,
      quantity: form.quantity,
      buying_price: form.buying_price,
      total_cost: totalCost,
      date: form.date,
      notes: form.notes || null,
      owner_id: user.id,
    });
    if (error) { toast.error(error.message); return; }

    // Increase stock and optionally update buying price
    const prod = products.find(p => p.id === form.product_id);
    if (prod) {
      await supabase.from("products").update({
        stock: prod.stock + form.quantity,
        buying_price: form.buying_price,
      }).eq("id", form.product_id);
    }

    const prodName = prod?.name || form.product_id;
    logActivity("purchase_added", `Purchased ${form.quantity}x ${prodName}`, form.product_id);
    toast.success("Purchase recorded & stock updated");
    setOpen(false);
    setForm({ product_id: "", supplier_id: "", quantity: 0, buying_price: 0, date: new Date().toISOString().split("T")[0], notes: "" });
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this purchase record?")) return;
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Purchase deleted");
    fetchAll();
  };

  // When product is selected, pre-fill buying price
  const handleProductChange = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    setForm(f => ({ ...f, product_id: productId, buying_price: prod?.buying_price || 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Purchases</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Record Purchase</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Product *</Label>
                <Select value={form.product_id} onValueChange={handleProductChange}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Supplier</Label>
                <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select supplier (optional)" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity</Label><Input type="number" min={1} value={form.quantity || ""} onChange={e => setForm({ ...form, quantity: +e.target.value })} /></div>
                <div><Label>Buying Price (TZS)</Label><Input type="number" min={0} value={form.buying_price || ""} onChange={e => setForm({ ...form, buying_price: +e.target.value })} /></div>
              </div>
              <div className="rounded-md bg-muted p-3 text-sm">
                <span className="text-muted-foreground">Total Cost: </span>
                <span className="font-bold">TZS {totalCost.toLocaleString()}</span>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleAdd}>Record Purchase</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{new Date(p.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{(p as any).products?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{(p as any).suppliers?.name || "—"}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">TZS {Number(p.buying_price).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">TZS {Number(p.total_cost).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No purchases recorded</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
