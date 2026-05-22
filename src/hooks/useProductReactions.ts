import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { toast } from "sonner";

interface Counts {
  likes: number;
  comments: number;
  saves: number;
}

export interface ProductComment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

/**
 * Reads/writes likes, saves and comments for a product. All counts are real
 * (sourced from `products` and the dedicated relational tables).
 */
export function useProductReactions(productId: string | null, initialCounts?: Counts) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const [counts, setCounts] = useState<Counts>(initialCounts ?? { likes: 0, comments: 0, saves: 0 });
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [busy, setBusy] = useState(false);

  // Fetch latest counts + my reactions + comments
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const load = async () => {
      const [productRes, commentsRes, likeRes, saveRes] = await Promise.all([
        supabase.from("products").select("likes_count, comments_count, saves_count").eq("id", productId).maybeSingle(),
        supabase.from("product_comments").select("id, comment_text, created_at, user_id").eq("product_id", productId).order("created_at", { ascending: false }).limit(20),
        user ? supabase.from("product_likes").select("id").eq("product_id", productId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        user ? supabase.from("product_saves").select("id").eq("product_id", productId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;
      if (productRes.data) {
        setCounts({
          likes: productRes.data.likes_count ?? 0,
          comments: productRes.data.comments_count ?? 0,
          saves: productRes.data.saves_count ?? 0,
        });
      }
      if (commentsRes.data) {
        // Best-effort: enrich with user names
        const userIds = [...new Set(commentsRes.data.map((c) => c.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
        const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));
        setComments(commentsRes.data.map((c) => ({ ...c, user_name: nameMap.get(c.user_id) || "Anonymous" })));
      }
      setLiked(!!(likeRes as any)?.data);
      setSaved(!!(saveRes as any)?.data);
    };
    load();
    return () => { cancelled = true; };
  }, [productId, user]);

  const requireAuth = () => {
    if (!user) {
      toast.info("Please sign in to react");
      openLogin();
      return false;
    }
    return true;
  };

  const toggleLike = useCallback(async () => {
    if (!productId || !requireAuth() || busy) return;
    setBusy(true);
    if (liked) {
      await supabase.from("product_likes").delete().eq("product_id", productId).eq("user_id", user!.id);
      setLiked(false);
      setCounts((c) => ({ ...c, likes: Math.max(0, c.likes - 1) }));
    } else {
      const { error } = await supabase.from("product_likes").insert({ product_id: productId, user_id: user!.id });
      if (!error) {
        setLiked(true);
        setCounts((c) => ({ ...c, likes: c.likes + 1 }));
      }
    }
    setBusy(false);
  }, [productId, liked, user, busy]);

  const toggleSave = useCallback(async () => {
    if (!productId || !requireAuth() || busy) return;
    setBusy(true);
    if (saved) {
      await supabase.from("product_saves").delete().eq("product_id", productId).eq("user_id", user!.id);
      setSaved(false);
      setCounts((c) => ({ ...c, saves: Math.max(0, c.saves - 1) }));
    } else {
      const { error } = await supabase.from("product_saves").insert({ product_id: productId, user_id: user!.id });
      if (!error) {
        setSaved(true);
        setCounts((c) => ({ ...c, saves: c.saves + 1 }));
      }
    }
    setBusy(false);
  }, [productId, saved, user, busy]);

  const postComment = useCallback(async (text: string) => {
    if (!productId || !requireAuth() || !text.trim()) return;
    const { data, error } = await supabase
      .from("product_comments")
      .insert({ product_id: productId, user_id: user!.id, comment_text: text.trim() })
      .select("id, comment_text, created_at, user_id")
      .single();
    if (error) {
      toast.error("Could not post comment");
      return;
    }
    setComments((prev) => [{ ...data!, user_name: "You" }, ...prev]);
    setCounts((c) => ({ ...c, comments: c.comments + 1 }));
  }, [productId, user]);

  return { counts, liked, saved, comments, toggleLike, toggleSave, postComment };
}
