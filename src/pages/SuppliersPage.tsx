import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity-log";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("suppliers").select("*").eq("owner_id", user.id).order("name");
    if (error) { 
      console.error("Failed to fetch suppliers:", error);
      toast.error("Failed to load suppliers");
      return; 
    }
    setSuppliers((data as Supplier[]) || []);
  };

  useEffect(() => { fetchSuppliers(); }, [user]);

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) { toast.error("Supplier name is required"); return; }

    if (editId) {
      const { error } = await supabase.from("suppliers").update({
        name: form.name, phone: form.phone || null, email: form.email || null,
        address: form.address || null, notes: form.notes || null,
      }).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Supplier updated");
      logActivity("supplier_updated", `Updated supplier: ${form.name}`, editId);
    } else {
      const { error } = await supabase.from("suppliers").insert({
        name: form.name, phone: form.phone || null, email: form.email || null,
        address: form.address || null, notes: form.notes || null, owner_id: user.id,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Supplier added");
      logActivity("supplier_added", `Added supplier: ${form.name}`);
    }

    setOpen(false);
    resetForm();
    fetchSuppliers();
  };

  const handleEdit = (s: Supplier) => {
    setForm({ name: s.name, phone: s.phone || "", email: s.email || "", address: s.address || "", notes: s.notes || "" });
    setEditId(s.id);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supplier deleted");
    logActivity("supplier_deleted", `Deleted supplier: ${name}`, id);
    fetchSuppliers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Suppliers</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Supplier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleSave}>{editId ? "Update" : "Add"} Supplier</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {s.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</div>}
                      {s.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.address || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {suppliers.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No suppliers yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
