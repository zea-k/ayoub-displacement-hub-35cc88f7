import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { Copy, ExternalLink, Upload, Plus, Trash2, Megaphone, MapPin } from "lucide-react";
import { toast } from "sonner";
import LocationPickerMap from "@/components/map/LocationPickerMap";

interface Banner {
  id?: string;
  title: string;
  subtitle: string;
  bg_color: string;
  image_url: string | null;
  is_active: boolean;
  position: number;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface PublicSettings {
  id?: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  theme: string;
  theme_color: string;
  is_public_enabled: boolean;
  is_listed: boolean;
  category: string;
  category_id: string | null;
  is_featured: boolean;
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

const defaultSettings: PublicSettings = {
  business_name: "",
  slug: "",
  logo_url: null,
  theme: "minimal",
  theme_color: "#e87b35",
  is_public_enabled: false,
  is_listed: true,
  category: "",
  category_id: null,
  is_featured: false,
  whatsapp_number: "",
  contact_email: "",
  contact_phone: "",
  description: "",
  latitude: null,
  longitude: null,
};

export default function StoreSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const fetchBanners = async (ownerId: string) => {
    const { data } = await supabase
      .from("promotional_banners")
      .select("id, title, subtitle, bg_color, image_url, is_active, position")
      .eq("owner_id", ownerId)
      .order("position");
    setBanners((data as Banner[]) || []);
  };

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const [categoryRes, settingsRes] = await Promise.all([
        supabase.from("categories").select("id, name, slug").order("name"),
        supabase.from("public_settings").select("*").eq("owner_id", user.id).maybeSingle(),
      ]);

      if (categoryRes.data) {
        setCategories(categoryRes.data as CategoryOption[]);
      }

      if (settingsRes.data) {
        const data = settingsRes.data as any;
        let categoryId = data.category_id ?? null;

        if (!categoryId && data.category && categoryRes.data) {
          const matched = (categoryRes.data as CategoryOption[]).find((category) => category.name === data.category);
          categoryId = matched?.id ?? null;
        }

        setSettings({
          id: data.id,
          business_name: data.business_name,
          slug: data.slug,
          logo_url: data.logo_url,
          theme: data.theme,
          theme_color: data.theme_color,
          is_public_enabled: data.is_public_enabled,
          is_listed: (data as any).is_listed ?? false,
          category: data.category || "",
          category_id: categoryId,
          is_featured: (data as any).is_featured ?? false,
          whatsapp_number: data.whatsapp_number || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          description: data.description || "",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        });
        setHasRecord(true);
      }
    };

    loadSettings();
    fetchBanners(user.id);
  }, [user]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async () => {
    if (!user) return;
    if (!settings.business_name.trim()) {
      toast.error("Business name is required");
      return;
    }

    const slug = settings.slug || generateSlug(settings.business_name);
    const categoryName = (categories.find((category) => category.id === settings.category_id)?.name ?? settings.category) || null;

    setSaving(true);
    const payload = {
      owner_id: user.id,
      business_name: settings.business_name.trim(),
      slug,
      logo_url: settings.logo_url,
      theme: settings.theme,
      theme_color: settings.theme_color,
      is_public_enabled: settings.is_public_enabled,
      is_listed: settings.is_listed,
      category: categoryName,
      category_id: settings.category_id || null,
      is_featured: settings.is_featured,
      whatsapp_number: settings.whatsapp_number || null,
      contact_email: settings.contact_email || null,
      contact_phone: settings.contact_phone || null,
      description: settings.description || null,
      latitude: settings.latitude,
      longitude: settings.longitude,
    };

    let error;
    if (hasRecord) {
      ({ error } = await supabase.from("public_settings").update(payload).eq("owner_id", user.id));
    } else {
      ({ error } = await supabase.from("public_settings").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    setSettings((s) => ({ ...s, slug, category: categoryName || "", category_id: settings.category_id || null }));
    setHasRecord(true);
    toast.success("Settings saved!");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const res = await uploadToCloudinary(file, "profile-images");
      setSettings((s) => ({ ...s, logo_url: res.secure_url }));
      toast.success("Logo uploaded!");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addBanner = async () => {
    if (!user) return;
    const newBanner = { owner_id: user.id, title: "New Banner", subtitle: "", bg_color: settings.theme_color, position: banners.length };
    const { error } = await supabase.from("promotional_banners").insert(newBanner);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Banner added");
    fetchBanners(user.id);
  };

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    const { error } = await supabase.from("promotional_banners").update(updates).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    fetchBanners(user!.id);
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from("promotional_banners").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Banner deleted");
    fetchBanners(user!.id);
  };

  const storeUrl = settings.slug ? `${window.location.origin}/store/${settings.slug}` : "";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Public Store Settings"
        subtitle="Manage your storefront, brand presence and promotional banners."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Business Info</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">Core details about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Business Name</Label>
              <Input
                value={settings.business_name}
                onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value, slug: generateSlug(e.target.value) }))}
                className="h-10 border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
                placeholder="Your business name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Store URL Slug</Label>
              <Input 
                value={settings.slug} 
                onChange={(e) => setSettings((s) => ({ ...s, slug: e.target.value }))} 
                placeholder="my-business"
                className="h-10 border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea 
                value={settings.description} 
                onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))} 
                rows={3}
                className="border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors resize-none"
                placeholder="Tell customers about your business"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Logo</Label>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/40 hover:border-border/60 transition-colors">
                {settings.logo_url && (
                  <img src={settings.logo_url} alt="Logo" className="h-14 w-14 rounded-lg object-cover border border-border/60 shadow-md" />
                )}
                <label className="cursor-pointer flex-1">
                  <Button variant="outline" size="sm" asChild disabled={uploading} className="border-border/60 hover:bg-primary/10">
                    <span><Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : "Upload Logo"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Contact Info</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">Customer communication channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">WhatsApp Number</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))}
                placeholder="+255712345678"
                className="h-10 border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input 
                type="email" 
                value={settings.contact_email} 
                onChange={(e) => setSettings((s) => ({ ...s, contact_email: e.target.value }))}
                className="h-10 border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <Input 
                value={settings.contact_phone} 
                onChange={(e) => setSettings((s) => ({ ...s, contact_phone: e.target.value }))}
                className="h-10 border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
                placeholder="+255712345678"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Appearance</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">Customize your store's look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Layout Theme</Label>
              <Select value={settings.theme} onValueChange={(v) => setSettings((s) => ({ ...s, theme: v }))}>
                <SelectTrigger className="h-10 border-border/60 bg-background/80 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal — Clean white, grid layout</SelectItem>
                  <SelectItem value="dark">Dark — Card-based, highlighted CTA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/40">
                <input
                  type="color"
                  value={settings.theme_color}
                  onChange={(e) => setSettings((s) => ({ ...s, theme_color: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border/60 shadow-sm"
                />
                <Input
                  value={settings.theme_color}
                  onChange={(e) => setSettings((s) => ({ ...s, theme_color: e.target.value }))}
                  className="flex-1 h-10 font-mono text-sm border-border/60 bg-background/80 focus:bg-background focus:border-primary transition-colors"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Visibility</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">Marketplace and store settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40 hover:border-border/60 transition-colors">
              <div>
                <p className="font-medium text-sm">Enable Public Store</p>
                <p className="text-xs text-muted-foreground mt-0.5">Allow customers to see your products</p>
              </div>
              <Switch checked={settings.is_public_enabled} onCheckedChange={(v) => setSettings((s) => ({ ...s, is_public_enabled: v }))} />
            </div>

            {settings.is_public_enabled && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40 hover:border-border/60 transition-colors">
                  <div>
                    <p className="font-medium text-sm">List in Marketplace</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Show your shop in the ZEETOP marketplace</p>
                  </div>
                  <Switch checked={settings.is_listed} onCheckedChange={(v) => setSettings((s) => ({ ...s, is_listed: v }))} />
                </div>

                {settings.is_listed && (
                  <div className="space-y-4 pt-3 border-t border-border/40">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Shop Category</Label>
                      <Select value={settings.category_id ?? ""} onValueChange={(v) => setSettings((s) => ({ ...s, category_id: v || null }))}>
                        <SelectTrigger className="h-10 border-border/60 bg-background/80 focus:border-primary">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div>
                        <p className="font-medium text-sm">Featured shop</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Mark your shop for the marketplace featured row</p>
                      </div>
                      <Switch checked={settings.is_featured} onCheckedChange={(v) => setSettings((s) => ({ ...s, is_featured: v }))} />
                    </div>
                  </div>
                )}
              </>
            )}

            {settings.is_public_enabled && storeUrl && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Your public store link:</p>
                <div className="flex items-center gap-2 bg-background rounded-lg p-3 border border-border/40">
                  <code className="text-sm font-mono break-all flex-1 text-foreground">{storeUrl}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 hover:bg-primary/10"
                    onClick={() => {
                      navigator.clipboard.writeText(storeUrl);
                      toast.success("Link copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-primary/10" asChild>
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            Shop Location
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-1">
            Weka eneo la duka ili wateja waweze kuona ramani na njia ya kufika.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationPickerMap
            latitude={settings.latitude}
            longitude={settings.longitude}
            onChange={(lat, lng) => setSettings((s) => ({ ...s, latitude: lat, longitude: lng }))}
          />
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                Promotional Banners
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">Create engaging banners for your public store</CardDescription>
            </div>
            <Button size="sm" onClick={addBanner} className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80">
              <Plus className="mr-2 h-4 w-4" /> Add Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {banners.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border/40 p-12 text-center space-y-3">
              <Megaphone className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm text-muted-foreground font-medium">No banners yet</p>
              <p className="text-xs text-muted-foreground">Add a banner to highlight sales, promotions, or new arrivals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <BannerEditor
                  key={banner.id}
                  banner={banner}
                  onChange={(updates) => updateBanner(banner.id!, updates)}
                  onDelete={() => deleteBanner(banner.id!)}
                  userId={user!.id}
                />
              ))}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Inline banner editor ----------
interface BannerEditorProps {
  banner: Banner;
  onChange: (updates: Partial<Banner>) => void;
  onDelete: () => void;
  userId: string;
}

function BannerEditor({ banner, onChange, onDelete, userId }: BannerEditorProps) {
  const [title, setTitle] = useState(banner.title);
  const [subtitle, setSubtitle] = useState(banner.subtitle);
  const [bgColor, setBgColor] = useState(banner.bg_color);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setBgColor(banner.bg_color);
  }, [banner.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setUploading(true);
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const res = await uploadToCloudinary(file, "banners");
      onChange({ image_url: res.secure_url });
      toast.success("Banner image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-border/60 bg-gradient-to-br from-background to-background/80 p-5 transition-all duration-300 hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: bgColor }}
    >
      {/* Preview */}
      <div
        className="relative overflow-hidden rounded-xl p-5 mb-4 min-h-[100px] flex items-center"
        style={{ backgroundColor: bgColor }}
      >
        {banner.image_url && (
          <img src={banner.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative z-10">
          <p className="text-white font-bold text-lg leading-tight drop-shadow">{title || "Banner title"}</p>
          {subtitle && <p className="text-white/90 text-sm mt-1 drop-shadow">{subtitle}</p>}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== banner.title && onChange({ title })}
            placeholder="e.g. Weekend Sale 20% Off"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Subtitle / Description</Label>
          <Input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={() => subtitle !== banner.subtitle && onChange({ subtitle })}
            placeholder="Short description shown under the title"
            className="h-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                onBlur={() => bgColor !== banner.bg_color && onChange({ bg_color: bgColor })}
                className="h-10 w-12 cursor-pointer rounded-lg border border-border/60"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                onBlur={() => bgColor !== banner.bg_color && onChange({ bg_color: bgColor })}
                className="h-10 flex-1 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Background Image</Label>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild disabled={uploading} className="h-10 w-full">
                <span>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : banner.image_url ? "Replace" : "Upload"}
                </span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {banner.image_url && (
          <div className="flex items-center gap-2 text-xs">
            <img src={banner.image_url} alt="" className="h-10 w-10 rounded object-cover border border-border/60" />
            <button
              onClick={() => onChange({ image_url: null })}
              className="text-destructive hover:underline"
            >
              Remove image
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ is_active: !banner.is_active })}
            className={`border-border/60 ${banner.is_active ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
          >
            {banner.is_active ? "Active — shown in store" : "Inactive"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

