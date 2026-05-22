import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Expense { id: string; name: string; category: string; amount: number; date: string; notes: string | null; }

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({ name: "", category: "", amount: 0, date: new Date().toISOString().split("T")[0], notes: "" });
  const [open, setOpen] = useState(false);

  const fetchExpenses = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("expenses").select("*").eq("owner_id", user.id).order("date", { ascending: false }).limit(50);
    if (error) { 
      console.error("Failed to fetch expenses:", error);
      toast.error("Failed to load expenses");
      return; 
    }
    setExpenses((data as Expense[]) || []);
  };

  useEffect(() => { fetchExpenses(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.name) { toast.error("Expense name is required"); return; }
    const { error } = await supabase.from("expenses").insert({ name: form.name, category: form.category, amount: form.amount, date: form.date, owner_id: user.id, notes: form.notes || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Expense added");
    setOpen(false);
    setForm({ name: "", category: "", amount: 0, date: new Date().toISOString().split("T")[0], notes: "" });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Expense deleted");
    fetchExpenses();
  };

  return (
    <div className="relative space-y-6">
      {/* Hero — landing page identity (theme-based card) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 border border-border/60 text-foreground text-xs font-medium mb-4 backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" /> Expense Management
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Track Your{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Expenses
                </span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
                Record and monitor all business expenses in real time.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 transition-all shadow-lg shadow-primary/25">
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Rent, Transport, Supplies" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Amount (TZS)</Label>
                      <Input type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <Button className="w-full" onClick={handleAdd}>
                    Add Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.section>

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2">Expense Records</h2>
            <p className="text-sm text-muted-foreground">Track and manage all business expenses</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/40 bg-background/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-background/80">
                  <TableHead className="font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Expense</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Category</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(e => (
                  <TableRow key={e.id} className="border-border/40 hover:bg-background/60 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{new Date(e.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground leading-snug">{e.name}</p>
                        {e.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{e.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                        {e.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm font-medium text-foreground">TZS {Number(e.amount).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(e.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Receipt className="h-8 w-8 text-muted-foreground/50" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">No expenses recorded</p>
                          <p className="text-xs text-muted-foreground mt-1">Add your first expense above</p>
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
