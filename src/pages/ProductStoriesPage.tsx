import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { Trash2, Edit2, Plus, Share2, Image as ImageIcon, Eye } from "lucide-react";

interface ProductStory {
  id: string;
  product_id: string;
  product_name: string;
  title: string;
  story: string;
  imageUrl?: string;
  status: "draft" | "published";
  publishedPlatforms: string[];
  created_at: string;
  updated_at: string;
}

export default function ProductStoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<ProductStory[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<ProductStory | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    title: "",
    story: "",
    imageFile: null as File | null,
    platforms: [] as string[],
  });

  // Fetch products & stories
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [prodRes, storiesRes] = await Promise.all([
        supabase.from("products").select("id, name").eq("owner_id", user.id).order("name"),
        supabase.from("product_stories").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProducts((prodRes.data as any[]) || []);
      setStories((storiesRes.data as any[]) || []);
    };
    load();
  }, [user]);

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      productName: product?.name || "",
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSaveStory = async () => {
    if (!user || !formData.productId || !formData.title || !formData.story) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let imageUrl = editingStory?.imageUrl;

      // Upload image if new (to Cloudinary)
      if (formData.imageFile) {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const res = await uploadToCloudinary(formData.imageFile, "product-stories");
        imageUrl = res.secure_url;
      }

      if (editingStory) {
        // Update
        const { error } = await supabase.from("product_stories").update({
          title: formData.title,
          story: formData.story,
          image_url: imageUrl,
          published_platforms: formData.platforms,
          status: formData.platforms.length > 0 ? "published" : "draft",
        }).eq("id", editingStory.id);
        if (error) throw error;
        toast.success("Story updated!");
      } else {
        // Create
        const { error } = await supabase.from("product_stories").insert({
          owner_id: user.id,
          product_id: formData.productId,
          product_name: formData.productName,
          title: formData.title,
          story: formData.story,
          image_url: imageUrl,
          published_platforms: formData.platforms,
          status: formData.platforms.length > 0 ? "published" : "draft",
        });
        if (error) throw error;
        toast.success("Story created!");
      }

      resetForm();
      setShowDialog(false);
      // Refresh stories
      const { data } = await supabase.from("product_stories").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
      setStories((data as any[]) || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Delete this story?")) return;
    try {
      const { error } = await supabase.from("product_stories").delete().eq("id", storyId);
      if (error) throw error;
      toast.success("Story deleted");
      setStories(stories.filter(s => s.id !== storyId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditStory = (story: ProductStory) => {
    setEditingStory(story);
    setFormData({
      productId: story.product_id,
      productName: story.product_name,
      title: story.title,
      story: story.story,
      imageFile: null,
      platforms: story.publishedPlatforms || [],
    });
    setPreviewImage(story.imageUrl || null);
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingStory(null);
    setFormData({
      productId: "",
      productName: "",
      title: "",
      story: "",
      imageFile: null,
      platforms: [],
    });
    setPreviewImage(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <DashboardPageHeader
        title="Product Stories"
        subtitle="Create and publish compelling product narratives for your shop."
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-violet-500 to-amber-500 hover:from-violet-400 hover:to-amber-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Story
          </Button>
        }
      />

      {/* Stories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No stories yet. Create your first product story!</p>
            </CardContent>
          </Card>
        ) : (
          stories.map(story => (
            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {story.imageUrl && (
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-violet-500/10 to-amber-500/10">
                  <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2">{story.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{story.product_name}</p>
                  </div>
                  <Badge variant="outline" className={story.status === "published" ? "bg-green-500/20 text-green-600 border-green-500/30" : "bg-gray-500/20 text-gray-600 border-gray-500/30"}>
                    {story.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{story.story}</p>
                {story.publishedPlatforms && story.publishedPlatforms.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {story.publishedPlatforms.map(platform => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="flex gap-2 p-3 border-t bg-muted/30">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditStory(story)}>
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteStory(story.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStory ? "Edit Story" : "Create Story"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product Select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-violet-300">Product</Label>
              <Select value={formData.productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-violet-300">Story Title</Label>
              <Input
                placeholder="e.g., How to use this product"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-violet-400/50"
              />
            </div>

            {/* Story Text */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-violet-300">Story Content</Label>
              <Textarea
                placeholder="Write your product story..."
                value={formData.story}
                onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                rows={6}
                className="bg-white/5 border-white/10 focus:border-violet-400/50 resize-none"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-violet-300">Product Image</Label>
              <div className="border-2 border-dashed border-violet-500/30 rounded-lg p-4 hover:border-violet-400/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="block cursor-pointer text-center py-4">
                  {previewImage ? (
                    <div className="space-y-2">
                      <img src={previewImage} alt="Preview" className="max-h-40 mx-auto rounded" />
                      <p className="text-xs text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Social Media Platforms */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-violet-300">Publish To</Label>
              <div className="flex flex-wrap gap-2">
                {["Instagram", "Facebook", "Twitter"].map(platform => (
                  <Button
                    key={platform}
                    variant={formData.platforms.includes(platform) ? "default" : "outline"}
                    size="sm"
                    className={formData.platforms.includes(platform) ? "bg-gradient-to-r from-violet-500 to-amber-500" : ""}
                    onClick={() => handleTogglePlatform(platform)}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    {platform}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSaveStory}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-violet-500 to-amber-500 hover:from-violet-400 hover:to-amber-400"
              >
                {loading ? "Saving..." : "Save Story"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
