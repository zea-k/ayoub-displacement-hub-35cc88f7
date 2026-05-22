import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DashboardPageHeader from "@/components/DashboardPageHeader";

interface LogEntry {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
}

const actionColors: Record<string, string> = {
  purchase_added: "bg-accent text-accent-foreground",
  supplier_added: "bg-primary text-primary-foreground",
  supplier_updated: "bg-secondary text-secondary-foreground",
  supplier_deleted: "bg-destructive text-destructive-foreground",
  expense_added: "bg-warning text-warning-foreground",
  refund_processed: "bg-destructive text-destructive-foreground",
  product_edited: "bg-secondary text-secondary-foreground",
  sale_completed: "bg-accent text-accent-foreground",
};

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("id, action_type, description, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs((data as LogEntry[]) || []);
    };
    fetchLogs();
  }, [user]);

  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Activity Log"
        subtitle="Review your latest business actions and system events with clarity."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={actionColors[l.action_type] || ""}>
                      {l.action_type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{l.description}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No activity recorded yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
