import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User as UserIcon, Package, Phone, Mail, LogOut, ArrowRight, Search, Store, Clock, CheckCircle2, XCircle, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import MarketShell from "@/components/marketplace/MarketShell";

interface OrderRow {
  id: string;
  customer_name: string;
  phone: string;
  quantity: number;
  status: string;
  created_at: string;
  owner_id: string;
  product_id: string;
  product?: { name: string; selling_price: number; image_url: string | null };
  shop?: { slug: string; business_name: string; theme_color: string };
}

const statusMeta: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-accent bg-accent border-accent" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-primary bg-primary border-primary" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-100 border-emerald-300" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-700 bg-red-100 border-red-300" },
};

export default function AccountPage() {
  const { user, signOut, userProfile } = useAuth();
  const isBuyer = userProfile?.user_type === "buyer";
  const { openLogin, openRegister } = useAuthModal();

  const [profile, setProfile] = useState<{ name: string; email: string; phone: string | null; whatsapp: string | null } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [guestPhone, setGuestPhone] = useState("");
  const [guestSearched, setGuestSearched] = useState("");
  const [guestOrders, setGuestOrders] = useState<OrderRow[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);

  // Profile load
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setOrders([]);
      return;
    }
    const load = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("name, email, phone, whatsapp")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data ?? { name: user.user_metadata?.name || "", email: user.email || "", phone: null, whatsapp: null });
      setProfileLoading(false);
    };
    load();
  }, [user]);

  // Orders for logged-in user (lookup by their phone or whatsapp)
  useEffect(() => {
    if (!user || !profile) return;
    const phones = [profile.phone, profile.whatsapp].filter(Boolean) as string[];
    if (phones.length === 0) return;
    loadOrdersByPhones(phones);
  }, [user, profile]);

  const loadOrdersByPhones = async (phones: string[]) => {
    setOrdersLoading(true);
    const cleaned = phones.map((p) => p.replace(/[^0-9]/g, ""));
    // Use ilike with multiple OR clauses for partial phone match
    const filter = cleaned.flatMap((p) => [`phone.ilike.%${p}%`]).join(",");

    const { data: ordersData } = await supabase
      .from("public_orders")
      .select("id, customer_name, phone, quantity, status, created_at, owner_id, product_id")
      .or(filter)
      .order("created_at", { ascending: false });

    await enrichOrders(ordersData || [], setOrders);
    setOrdersLoading(false);
  };

  const enrichOrders = async (rows: OrderRow[], setter: (r: OrderRow[]) => void) => {
    if (rows.length === 0) {
      setter([]);
      return;
    }
    const productIds = [...new Set(rows.map((r) => r.product_id))];
    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];

    const [prodRes, shopRes] = await Promise.all([
      supabase.from("products").select("id, name, selling_price, image_url").in("id", productIds),
      supabase.from("public_settings").select("owner_id, slug, business_name, theme_color").in("owner_id", ownerIds),
    ]);

    const prodMap = new Map((prodRes.data || []).map((p) => [p.id, p]));
    const shopMap = new Map((shopRes.data || []).map((s) => [s.owner_id, s]));

    setter(
      rows.map((r) => ({
        ...r,
        product: prodMap.get(r.product_id) as any,
        shop: shopMap.get(r.owner_id) as any,
      }))
    );
  };

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = guestPhone.replace(/[^0-9]/g, "");
    if (cleaned.length < 6) {
      toast.error("Enter a valid phone number");
      return;
    }
    setGuestSearched(guestPhone);
    setGuestLoading(true);
    const { data } = await supabase
      .from("public_orders")
      .select("id, customer_name, phone, quantity, status, created_at, owner_id, product_id")
      .ilike("phone", `%${cleaned}%`)
      .order("created_at", { ascending: false });
    await enrichOrders(data || [], setGuestOrders);
    setGuestLoading(false);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ name: profile.name, phone: profile.phone, whatsapp: profile.whatsapp })
      .eq("user_id", user.id);
    if (error) toast.error("Failed to save");
    else {
      toast.success("Profile updated");
      // Re-load orders with the new phone numbers
      const phones = [profile.phone, profile.whatsapp].filter(Boolean) as string[];
      if (phones.length > 0) loadOrdersByPhones(phones);
    }
  };

  return (
    <MarketShell active="account">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-8 relative">
        {/* Premium Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90 -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-24" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,107,107,0.05),transparent_50%)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4 backdrop-blur-sm">
            <UserIcon className="h-4 w-4" />
            Account
          </div>
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-3">
            My Account
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
            {user ? "Manage your profile and track your orders" : "Track an order or sign in to access your full profile"}
          </p>
        </motion.div>

        {!user ? (
          <>
            {/* Sign-in CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-2xl p-8 mb-10 text-center shadow-[0_25px_80px_-20px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 opacity-50" />
              <div className="relative">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
                  Sign in to ZEETOP
                </h2>
                <p className="text-muted-foreground text-base mb-7 max-w-lg mx-auto">
                  Save your orders, follow shops, and get personalized recommendations.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    onClick={openLogin}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-2xl px-7 py-3 font-semibold transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={openRegister}
                    className="border border-border/50 bg-card/80 hover:bg-card backdrop-blur-sm text-foreground hover:text-primary rounded-2xl px-7 py-3 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Guest order tracker */}
            <GuestTracker
              guestPhone={guestPhone}
              setGuestPhone={setGuestPhone}
              onLookup={handleGuestLookup}
              loading={guestLoading}
              orders={guestOrders}
              searched={guestSearched}
            />
          </>
        ) : (
          <Tabs defaultValue="orders">
            <TabsList className="bg-gradient-to-r from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-xl mb-8">
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl text-muted-foreground data-[state=active]:text-white font-semibold transition-all duration-300 px-6 py-3"
              >
                <Package className="h-4 w-4 mr-2" /> My Orders
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl text-muted-foreground data-[state=active]:text-white font-semibold transition-all duration-300 px-6 py-3"
              >
                <UserIcon className="h-4 w-4 mr-2" /> Profile
              </TabsTrigger>
              <TabsTrigger
                value="track"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl text-muted-foreground data-[state=active]:text-white font-semibold transition-all duration-300 px-6 py-3"
              >
                <Search className="h-4 w-4 mr-2" /> Track by Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-8">
              {ordersLoading ? (
                <OrderSkeleton />
              ) : orders.length === 0 ? (
                <EmptyOrders message={profile?.phone || profile?.whatsapp ? "No orders found for your phone numbers" : "Add a phone number to your profile to see your orders"} />
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => <OrderCard key={o.id} order={o} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="mt-8">
              {profileLoading || !profile ? (
                <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-2xl p-8 space-y-6 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.2)]"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 opacity-50" />
                  <div className="relative">
                    <div>
                      <Label className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        Name
                      </Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="bg-card/80 border-border/50 focus:border-primary text-foreground rounded-xl placeholder-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email
                      </Label>
                      <Input
                        value={profile.email}
                        disabled
                        className="bg-muted/50 border-border/50 text-muted-foreground rounded-xl backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Phone (used to find your orders)
                      </Label>
                      <Input
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+255 712 345 678"
                        className="bg-card/80 border-border/50 focus:border-primary text-foreground rounded-xl placeholder-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-primary" />
                        WhatsApp (optional)
                      </Label>
                      <Input
                        value={profile.whatsapp || ""}
                        onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                        placeholder="+255 712 345 678"
                        className="bg-card/80 border-border/50 focus:border-primary text-foreground rounded-xl placeholder-muted-foreground backdrop-blur-sm"
                      />
                    </div>
                    <div className="flex gap-3 pt-6 border-t border-border/50">
                      <Button
                        onClick={saveProfile}
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-semibold px-6 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
                      >
                        Save Changes
                      </Button>
                      {!isBuyer && (
                        <Link to="/dashboard">
                          <Button className="border border-border/50 bg-card/80 hover:bg-card backdrop-blur-sm text-foreground hover:text-primary rounded-xl font-semibold px-6 transition-all duration-300 shadow-lg hover:shadow-xl">
                            Go to Dashboard
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={signOut}
                        className="text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-xl font-semibold px-6 ml-auto transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <ChangePasswordCard />
            </TabsContent>

            <TabsContent value="track" className="mt-8">
              <GuestTracker
                guestPhone={guestPhone}
                setGuestPhone={setGuestPhone}
                onLookup={handleGuestLookup}
                loading={guestLoading}
                orders={guestOrders}
                searched={guestSearched}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MarketShell>
  );
}

function GuestTracker({
  guestPhone, setGuestPhone, onLookup, loading, orders, searched,
}: {
  guestPhone: string;
  setGuestPhone: (s: string) => void;
  onLookup: (e: React.FormEvent) => void;
  loading: boolean;
  orders: OrderRow[];
  searched: string;
}) {
  return (
    <div>
      <div className="rounded-3xl border border-gray-200 bg-white p-6 mb-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-lg"><Search className="h-5 w-5 text-primary" /> Track by phone</h3>
        <p className="text-gray-600 text-sm mb-5">Enter the phone number you used when placing the order.</p>
        <form onSubmit={onLookup} className="flex gap-3">
          <Input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="e.g. +255 712 345 678"
            className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg flex-1"
          />
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary text-white rounded-lg font-semibold px-6 border-0 shadow-md transition-all duration-200">
            {loading ? "..." : "Track"}
          </Button>
        </form>
      </div>

      {loading ? (
        <OrderSkeleton />
      ) : searched && orders.length === 0 ? (
        <EmptyOrders message={`No orders found for "${searched}"`} />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const meta = statusMeta[order.status] || statusMeta.pending;
  const Icon = meta.icon;
  const total = (order.product?.selling_price || 0) * order.quantity;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={order.shop ? `/market/shop/${order.shop.slug}` : "/market"}
        className="block rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
            {order.product?.image_url ? (
              <img src={order.product.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 truncate text-base">{order.product?.name || "Product"}</h4>
                {order.shop && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" /> {order.shop.business_name}
                  </p>
                )}
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 shrink-0 ${meta.color}`}>
                <Icon className="h-3.5 w-3.5" /> {meta.label}
              </span>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Qty {order.quantity} · {new Date(order.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-3">
                {total > 0 && (
                  <span className="text-primary font-bold text-base">TZS {total.toLocaleString()}</span>
                )}
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  );
}

function EmptyOrders({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-12 text-center">
      <div className="bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-6 w-6 text-gray-600" />
      </div>
      <p className="text-gray-700 font-medium">{message}</p>
      <Link to="/market" className="inline-flex items-center gap-2 text-primary font-semibold text-sm mt-4 hover:gap-3 transition-all">
        Browse marketplace <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!next || next !== confirm) {
      toast.error("Password mpya hazifanani");
      return;
    }
    if (!user?.email) {
      toast.error("Hauja-ingia");
      return;
    }
    setLoading(true);
    try {
      // Re-authenticate with current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) {
        toast.error("Password ya sasa si sahihi");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password imebadilishwa");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      toast.error(err?.message || "Imeshindikana kubadilisha password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-2xl p-8 space-y-5 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.2)] mt-6"
    >
      <div className="flex items-center gap-3 pb-2 border-b border-border/40">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Badilisha Password</h3>
          <p className="text-xs text-muted-foreground">Sasisha password yako kwa usalama</p>
        </div>
      </div>

      <PasswordField
        label="Password ya Sasa"
        value={current}
        onChange={setCurrent}
        show={showCurrent}
        onToggle={() => setShowCurrent((s) => !s)}
      />
      <PasswordField
        label="Password Mpya"
        value={next}
        onChange={setNext}
        show={showNext}
        onToggle={() => setShowNext((s) => !s)}
      />
      <PasswordField
        label="Thibitisha Password Mpya"
        value={confirm}
        onChange={setConfirm}
        show={showNext}
        onToggle={() => setShowNext((s) => !s)}
      />

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/30"
      >
        {loading ? "Inabadilisha..." : "Badilisha Password"}
      </Button>
    </motion.form>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle,
}: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <Label className="text-foreground font-semibold text-sm mb-2 block">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="bg-card/80 border-border/50 focus:border-primary text-foreground rounded-xl pr-12"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={show ? "Ficha" : "Onyesha"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
