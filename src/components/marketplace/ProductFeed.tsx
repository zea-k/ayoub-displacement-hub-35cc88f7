import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heart, ShoppingCart, MessageCircle, Store, ArrowRight, Bookmark, Send, BadgeCheck, Sparkles } from "lucide-react";
import { useProductReactions } from "@/hooks/useProductReactions";
import { Input } from "@/components/ui/input";
import { CloudinaryImage } from "@/components/ui/CloudinaryImage";

export interface DiscoverProduct {
  id: string;
  name: string;
  selling_price: number;
  image_url: string | null;
  category: string | null;
  description: string | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  owner_id: string;
  shop_slug?: string;
  shop_name?: string;
  shop_color?: string;
  created_at: string;
}

interface ProductFeedProps {
  products: DiscoverProduct[];
  loading: boolean;
}

export default function ProductFeed({ products, loading }: ProductFeedProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(6);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setVisibleCount(6), [products]);

  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < products.length) {
          setVisibleCount((prev) => Math.min(prev + 6, products.length));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, products.length, visibleCount]);

  const feed = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  return (
    <section className="px-0 pb-28">
      <div className="max-w-2xl mx-auto space-y-8 px-3 sm:px-4">
        {loading && (
          <div className="space-y-8">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-[520px] rounded-[28px] bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && feed.length === 0 && (
          <div className="apple-card p-10 text-center">
            <Store className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{t("market.noPostsYet")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("market.noPostsHint")}</p>
          </div>
        )}

        {feed.map((product, index) => (
          <FeedCard key={product.id} product={product} index={index} />
        ))}

        {!loading && visibleCount < products.length && <div ref={sentinelRef} className="h-8" />}
      </div>
    </section>
  );
}

function FeedCard({ product, index }: { product: DiscoverProduct; index: number }) {
  const { t } = useTranslation();
  const { counts, liked, saved, comments, toggleLike, toggleSave, postComment } = useProductReactions(product.id, {
    likes: product.likes_count,
    comments: product.comments_count,
    saves: product.saves_count,
  });
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [burst, setBurst] = useState(false);
  const lastTapRef = useRef(0);

  const onSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    postComment(draft);
    setDraft("");
  };

  const triggerLike = () => {
    if (!liked) toggleLike();
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
  };

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      triggerLike();
    }
    lastTapRef.current = now;
  };

  const accent = product.shop_color || "hsl(var(--primary))";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.24) }}
      className="group relative rounded-[28px] p-[1.5px] bg-gradient-to-br from-primary/30 via-border to-accent/25 shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.45)] hover:shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.65)] transition-shadow duration-500"
    >
      <div className="relative rounded-[26px] overflow-hidden bg-card/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="relative h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-background shadow-md"
              style={{
                background: `linear-gradient(135deg, ${accent}33, ${accent}11)`,
                color: accent,
              }}
            >
              {product.shop_name?.charAt(0).toUpperCase() || "S"}
              <span
                className="absolute inset-0 rounded-2xl ring-1"
                style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                {product.shop_name || "ZEETOP Shop"}
                <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              </p>
              <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider">
                {product.category || "Trending"}
              </p>
            </div>
          </div>
          <Link
            to={`/market/shop/${product.shop_slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-primary-foreground bg-gradient-to-r from-primary to-primary/80 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition shrink-0"
          >
            {t("market.visit")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Image */}
        <div
          className="relative block bg-muted cursor-pointer select-none"
          onClick={handleImageTap}
        >
          {product.image_url ? (
            <CloudinaryImage
              src={product.image_url}
              alt={product.name}
              width={1080}
              sizes="(max-width: 768px) 100vw, 640px"
              aspect="aspect-[4/5]"
              className="max-h-[560px] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-muted text-muted-foreground">
              <Store className="h-10 w-10" />
            </div>
          )}

          {/* Gradient overlays */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

          {/* Top-left price chip */}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-3 py-1.5 text-xs font-bold text-foreground shadow-lg ring-1 ring-border">
            <Sparkles className="h-3 w-3 text-primary" />
            TZS {product.selling_price.toLocaleString()}
          </div>

          {/* Bottom title overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-white text-lg font-bold drop-shadow-md line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </div>

          {/* Heart burst on double-tap */}
          <AnimatePresence>
            {burst && (
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <Heart className="h-24 w-24 fill-rose-500 text-rose-500 drop-shadow-[0_8px_24px_rgba(244,63,94,0.7)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reaction bar */}
        <div className="flex items-center gap-5 px-4 pt-3.5">
          <button
            onClick={triggerLike}
            className="flex items-center gap-1.5 text-foreground/70 hover:text-rose-500 transition active:scale-90"
          >
            <Heart className={`h-6 w-6 transition ${liked ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
            <span className="text-xs font-semibold tabular-nums">{counts.likes.toLocaleString()}</span>
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition active:scale-90"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-semibold tabular-nums">{counts.comments.toLocaleString()}</span>
          </button>
          <Link
            to={`/market/shop/${product.shop_slug}`}
            className="flex items-center gap-1.5 text-foreground/70 hover:text-primary transition active:scale-90"
          >
            <ShoppingCart className="h-6 w-6" />
          </Link>
          <button
            onClick={toggleSave}
            className="ml-auto text-foreground/70 hover:text-accent transition active:scale-90"
          >
            <Bookmark className={`h-6 w-6 transition ${saved ? "fill-accent text-accent scale-110" : ""}`} />
          </button>
        </div>

        {/* Body */}
        {product.description && (
          <div className="px-4 pt-2">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Comments */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={() => setShowComments((s) => !s)}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {showComments
              ? t("market.hideCommentsCount", { count: counts.comments })
              : t("market.viewCommentsCount", { count: counts.comments })}
          </button>

          <AnimatePresence initial={false}>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">{t("market.beFirstComment")}</p>
                  ) : (
                    comments.slice(0, 5).map((c) => (
                      <div key={c.id} className="text-sm text-foreground/80">
                        <span className="font-semibold text-foreground mr-2">{c.user_name}</span>
                        {c.comment_text}
                      </div>
                    ))
                  )}
                  <form onSubmit={onSubmitComment} className="flex items-center gap-2 pt-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t("market.addComment")}
                      className="bg-background border-border text-foreground text-sm h-9 rounded-full px-4"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-primary text-primary-foreground p-2 hover:scale-105 active:scale-95 transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
