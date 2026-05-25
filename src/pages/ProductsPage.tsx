import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Globe, ImagePlus, X, Loader2, Crown, Package } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  buying_price: number;
  selling_price: number;
  stock: number;
  low_stock_alert: number;
  public_visible: boolean;
  description: string | null;
  image_url: string | null;
  featured: boolean;
}

const emptyForm = { name: "", category: "", buying_price: 0, selling_price: 0, description: "" };

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("products").select("id, name, category, buying_price, selling_price, stock, low_stock_alert, public_visible, description, image_url, featured").eq("owner_id", user.id).order("created_at", { ascending: false });
    if (error) { 
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
      return; 
    }
    setProducts((data as Product[]) || []);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const uploadImage = async (_productId: string): Promise<string | null> => {
    if (!imageFile || !user) return existingImageUrl;
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const res = await uploadToCloudinary(imageFile, "store-products");
      return res.secure_url;
    } catch (e: any) {
      toast.error(e?.message || "Image upload failed");
      return existingImageUrl;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name) { toast.error("Product name is required"); return; }
    setUploading(true);
    const payload = { name: form.name, category: form.category, buying_price: form.buying_price, selling_price: form.selling_price, description: form.description || null };

    if (editId) {
      const imageUrl = await uploadImage(editId);
      const { error } = await supabase.from("products").update({ ...payload, image_url: imageUrl }).eq("id", editId);
      setUploading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated");
    } else {
      const { data: inserted, error } = await supabase.from("products").insert({ ...payload, owner_id: user.id }).select("id").single();
      if (error) { setUploading(false); toast.error(error.message); return; }
      if (!inserted) { setUploading(false); toast.error("Insert failed"); return; }
      if (imageFile) {
        const imageUrl = await uploadImage(inserted.id);
        await supabase.from("products").update({ image_url: imageUrl }).eq("id", inserted.id);
      }
      setUploading(false);
      toast.success("Product added");
    }
    resetForm();
    setOpen(false);
    fetchProducts();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, buying_price: p.buying_price, selling_price: p.selling_price, description: p.description || "" });
    setEditId(p.id);
    setExistingImageUrl(p.image_url);
    setImagePreview(p.image_url);
    setImageFile(null);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    fetchProducts();
  };

  const togglePublicVisible = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ public_visible: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchProducts();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ featured: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(current ? "Removed from featured" : "Added to featured");
    fetchProducts();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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
            <Sparkles className="h-3 w-3 text-primary" /> Product Management
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Manage Your{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
                Add, edit and track all your inventory items in real time.
              </p>
            </div>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 transition-all shadow-lg shadow-primary/25">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {/* Image Upload */}
                  <div>
                    <Label>Product Image</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {imagePreview ? (
                      <div className="relative mt-2 inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 rounded-xl object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-md"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 flex h-32 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <ImagePlus className="h-8 w-8 mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description for public store" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Buying Price</Label>
                      <Input type="number" value={form.buying_price} onChange={e => setForm({ ...form, buying_price: +e.target.value })} />
                    </div>
                    <div>
                      <Label>Selling Price</Label>
                      <Input type="number" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: +e.target.value })} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground">
                    Stock quantity is managed automatically through <span className="font-medium text-foreground">Stock In</span> and <span className="font-medium text-foreground">Sales</span>. Add this product first, then add stock from the Stock In page.
                  </div>

                  <Button className="w-full" onClick={handleSave} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>{editId ? "Update" : "Add"} Product</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.section>

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">All Products</h2>
              <p className="text-sm text-muted-foreground mt-1">{filtered.length} products total</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input 
                  placeholder="Search products..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-9 h-10 w-64 border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/40 bg-background/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-background/80">
                  <TableHead className="w-12 font-medium text-muted-foreground">Image</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Product</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Category</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Cost</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Price</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Stock</TableHead>
                  <TableHead className="text-center font-medium text-muted-foreground">Public</TableHead>
                  <TableHead className="text-center font-medium text-muted-foreground">Featured</TableHead>
                  <TableHead className="text-right font-medium text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="border-border/40 hover:bg-background/60 transition-colors">
                    <TableCell>
                      {p.image_url ? (
                        <div className="relative">
                          <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-border/60 shadow-sm" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center">
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground leading-snug">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm text-muted-foreground">TZS {p.buying_price.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm font-medium text-foreground">TZS {p.selling_price.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.stock <= p.low_stock_alert ? (
                          <Badge variant="destructive" className="text-xs px-2 py-0.5">
                            {p.stock} Low
                          </Badge>
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">{p.stock}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={p.public_visible} 
                        onCheckedChange={() => togglePublicVisible(p.id, p.public_visible)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => toggleFeatured(p.id, p.featured)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          p.featured 
                            ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20" 
                            : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                        }`}
                        title={p.featured ? "Remove from featured" : "Mark as featured"}
                      >
                        <Crown className={`h-4 w-4 ${p.featured ? "fill-amber-500 stroke-amber-500" : ""}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(p)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(p.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">No products found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {search ? `No products match "${search}"` : "Start by adding your first product"}
                          </p>
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
