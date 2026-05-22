import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Instagram, Sparkles, Copy, Download, RefreshCw, ExternalLink,
  Hash, Type, Image as ImageIcon, History, Check, Loader2
} from "lucide-react";
import { toast } from "sonner";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { generateInstagramImage } from "@/lib/instagram-image";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  category: string | null;
  description: string | null;
  stock: number;
}

interface HistoryItem {
  id: string;
  product_id: string;
  caption: string;
  hashtags: string;
  style_type: string;
  generated_image_url: string | null;
  created_at: string;
  product_name?: string;
}

const STYLES = [
  { value: "promotional", label: "🔥 Promotional", desc: "Eye-catching promo post" },
  { value: "premium", label: "💎 Premium / Luxury", desc: "High-end elegant style" },
  { value: "discount", label: "🏷️ Discount / Offer", desc: "Sale & deal focused" },
  { value: "new_arrival", label: "🆕 New Arrival", desc: "Fresh product launch" },
  { value: "urgency", label: "⚡ Limited Stock", desc: "Urgency-driven post" },
];

export default function InstagramGeneratorPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [style, setStyle] = useState("promotional");
  const [generating, setGenerating] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState("generate");

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("products")
      .select("id, name, selling_price, category, description, stock")
      .eq("owner_id", user.id)
      .order("name");
    setProducts((data as Product[]) || []);
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("instagram_content_history")
      .select("id, product_id, caption, hashtags, style_type, generated_image_url, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      const enriched = (data as HistoryItem[]).map(h => ({
        ...h,
        product_name: products.find(p => p.id === h.product_id)?.name || "Unknown"
      }));
      setHistory(enriched);
    }
  }, [user, products]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { if (products.length > 0) fetchHistory(); }, [products, fetchHistory]);

  const handleGenerate = async () => {
    if (!selectedProduct || !user) return;
    setGenerating(true);
    setCaption("");
    setHashtags("");
    setImageUrl("");

    try {
      // Generate caption & hashtags via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke("generate-instagram-content", {
        body: { product: selectedProduct, style },
      });

      if (fnError) throw new Error(fnError.message);

      const generatedCaption = fnData?.caption || "";
      const generatedHashtags = fnData?.hashtags || "";

      setCaption(generatedCaption);
      setHashtags(generatedHashtags);

      // Generate image locally via canvas
      const imgDataUrl = await generateInstagramImage(selectedProduct);
      setImageUrl(imgDataUrl);

      // Save to history
      await supabase.from("instagram_content_history").insert({
        owner_id: user.id,
        product_id: selectedProduct.id,
        caption: generatedCaption,
        hashtags: generatedHashtags,
        style_type: style,
        generated_image_url: imgDataUrl.substring(0, 500), // Store reference only
      });

      fetchHistory();
      toast.success("Content generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `instagram-${selectedProduct?.name?.replace(/\s+/g, "-").toLowerCase() || "post"}.png`;
    a.click();
    toast.success("Image downloaded!");
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCaption(item.caption);
    setHashtags(item.hashtags);
    setStyle(item.style_type);
    setSelectedProductId(item.product_id);
    // Regenerate image for the product
    const prod = products.find(p => p.id === item.product_id);
    if (prod) {
      generateInstagramImage(prod).then(setImageUrl);
    }
    setTab("generate");
    toast.success("Loaded from history");
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Instagram Content Generator"
        subtitle="Create professional Instagram posts from your inventory with smart captions and visuals."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="generate"><Sparkles className="mr-1.5 h-4 w-4" /> Generate</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Select Product</label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger><SelectValue placeholder="Choose a product..." /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — TZS {p.selling_price.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Caption Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    onClick={handleGenerate}
                    disabled={!selectedProductId || generating}
                  >
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {generating ? "Generating..." : "Generate Content"}
                  </Button>
                </div>
              </div>

              {selectedProduct && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">{selectedProduct.category || "No category"}</Badge>
                  <Badge variant="outline">Stock: {selectedProduct.stock}</Badge>
                  <Badge variant="outline">TZS {selectedProduct.selling_price.toLocaleString()}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {(caption || imageUrl) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Instagram Preview */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Instagram className="h-4 w-4" /> Instagram Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Mock Instagram post */}
                  <div className="rounded-lg border bg-card overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 p-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                      <span className="text-sm font-semibold">your_business</span>
                    </div>
                    {/* Image */}
                    {imageUrl && (
                      <img src={imageUrl} alt="Generated post" className="w-full aspect-square object-cover" />
                    )}
                    {/* Caption */}
                    <div className="p-3 space-y-2">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{caption}</p>
                      {hashtags && (
                        <p className="text-sm text-primary/70">{hashtags}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions & Content */}
              <div className="space-y-4">
                {/* Caption */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2"><Type className="h-4 w-4" /> Caption</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(caption, "Caption")}>
                        {copiedField === "Caption" ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                        {copiedField === "Caption" ? "Copied" : "Copy"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed rounded-md bg-muted p-3">{caption}</p>
                  </CardContent>
                </Card>

                {/* Hashtags */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Hashtags</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(hashtags, "Hashtags")}>
                        {copiedField === "Hashtags" ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                        {copiedField === "Hashtags" ? "Copied" : "Copy"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-primary/80 rounded-md bg-muted p-3">{hashtags}</p>
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={downloadImage} disabled={!imageUrl}>
                    <Download className="mr-2 h-4 w-4" /> Download Image
                  </Button>
                  <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                  </Button>
                  <Button variant="outline" onClick={() => copyToClipboard(caption + "\n\n" + hashtags, "All content")}>
                    <Copy className="mr-2 h-4 w-4" /> Copy All
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Open Instagram
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No generated content yet. Start by generating your first post!</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {history.map(item => (
                      <div key={item.id} className="rounded-lg border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{item.product_name}</Badge>
                            <Badge variant="outline">{STYLES.find(s => s.value === item.style_type)?.label || item.style_type}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{item.caption}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => loadFromHistory(item)}>
                            <RefreshCw className="mr-1 h-3 w-3" /> Load
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.caption + "\n\n" + item.hashtags, "Content")}>
                            <Copy className="mr-1 h-3 w-3" /> Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
