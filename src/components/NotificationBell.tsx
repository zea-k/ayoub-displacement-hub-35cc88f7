import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  customer_name: string;
  phone: string;
  quantity: number;
  created_at: string;
  product_name: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Fetch recent orders on mount
  const fetchRecent = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("public_orders")
      .select("id, customer_name, phone, quantity, created_at, products(name)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(
        (data as any[]).map((o) => ({
          id: o.id,
          customer_name: o.customer_name,
          phone: o.phone,
          quantity: o.quantity,
          created_at: o.created_at,
          product_name: o.products?.name || "Product",
        }))
      );
    }
  }, [user]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Listen for realtime inserts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("new-public-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "public_orders",
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          const newOrder = payload.new as any;
          // Fetch product name
          const { data: prod } = await supabase
            .from("products")
            .select("name")
            .eq("id", newOrder.product_id)
            .maybeSingle();

          const notification: Notification = {
            id: newOrder.id,
            customer_name: newOrder.customer_name,
            phone: newOrder.phone,
            quantity: newOrder.quantity,
            created_at: newOrder.created_at,
            product_name: prod?.name || "Product",
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) setUnreadCount(0);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-heading font-semibold text-sm">Notifications</h4>
          {notifications.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0"
              onClick={() => { setOpen(false); navigate("/public-orders"); }}
            >
              View All
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => { setOpen(false); navigate("/public-orders"); }}
                >
                  <p className="text-sm font-medium leading-tight">
                    <span className="font-semibold">{n.customer_name}</span>{" "}
                    ordered {n.quantity}x {n.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {n.phone} · {timeAgo(n.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
