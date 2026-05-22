import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X, Eye, Truck, XCircle } from "lucide-react";
import DashboardPageHeader from "@/components/DashboardPageHeader";

interface PublicOrder {
  id: string;
  customer_name: string;
  phone: string;
  quantity: number;
  status: string;
  notes: string | null;
  created_at: string;
  products: { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  delivered: "bg-green-500/20 text-green-600 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-600 border-red-500/30",
};

const statusEmojis: Record<string, string> = {
  pending: "🟡",
  confirmed: "🔵",
  delivered: "🟢",
  cancelled: "🔴",
};

export default function PublicOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("public_orders")
      .select("id, customer_name, phone, quantity, status, notes, created_at, products(name)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setOrders((data as unknown as PublicOrder[]) || []);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("public_orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status updated");
    fetchOrders();
  };

  const groupOrdersByDate = (orders: PublicOrder[]) => {
    const groups: Record<string, PublicOrder[]> = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return groups;
  };

  const groupedOrders = groupOrdersByDate(orders);

  const handleOrderClick = (id: string) => setExpandedOrderId(id);
  const handleClosePanel = () => setExpandedOrderId(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff < -50 && panelRef.current) { // Swipe up threshold
      handleClosePanel();
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const expandedOrder = orders.find(o => o.id === expandedOrderId);

  return (
    <div className="space-y-6 pb-20">
      <DashboardPageHeader
        title="Public Orders"
        subtitle="Track store orders, update statuses, and manage fulfillment all in one place."
      />

      {Object.entries(groupedOrders).map(([date, dateOrders]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/40"></div>
            <h2 className="text-sm font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border border-border/40">
              {date}
            </h2>
            <div className="h-px flex-1 bg-border/40"></div>
          </div>
          <div className="space-y-3">
            {dateOrders.map(order => (
              <Card
                key={order.id}
                className="cursor-pointer border border-border/60 bg-gradient-to-r from-card to-card/80 hover:from-card hover:to-card hover:shadow-lg hover:border-border transition-all duration-300 group"
                onClick={() => handleOrderClick(order.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <span className="text-sm font-semibold text-primary">{order.customer_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-snug">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                          {order.products?.name}
                        </span>
                        <span className="text-sm text-muted-foreground">×{order.quantity}</span>
                      </div>
                      {order.notes && (
                        <p className="text-sm text-muted-foreground italic">"{order.notes}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${statusColors[order.status]} text-xs px-2.5 py-1 font-medium`}>
                        {statusEmojis[order.status]} {order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <X className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground mt-1">Orders from your public store will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Order Panel */}
      {expandedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-4"
          onClick={handleClosePanel}
        >
          <div
            ref={panelRef}
            className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 animate-in slide-in-from-top-full duration-300"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Order Details</h3>
              <Button variant="ghost" size="icon" onClick={handleClosePanel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                <p className="font-medium">{expandedOrder.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p>{expandedOrder.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product</label>
                <p>{expandedOrder.products?.name} (x{expandedOrder.quantity})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <p>{new Date(expandedOrder.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Select value={expandedOrder.status} onValueChange={(v) => updateStatus(expandedOrder.id, v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {expandedOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p>{expandedOrder.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" className="flex-1">
                  <Truck className="h-4 w-4 mr-2" />
                  Deliver
                </Button>
                <Button variant="outline" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
