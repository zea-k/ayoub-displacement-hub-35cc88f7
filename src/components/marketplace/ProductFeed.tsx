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
      className="group relative rounded-[28px] overflow-hidden shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.35)] hover:shadow-[0_40px_100px_-25px_hsl(var(--primary)/0.55)] transition-all duration-500"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-[28px] p-[1.5px] bg-gradient-to-br from-primary/40 via-border to-accent/30 pointer-events-none" />
      
      <div className="relative rounded-[27px] overflow-hidden bg-card/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              whileHover={{ scale: 1.08 }}
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
            </motion.div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                {product.shop_name || "ZEETOP Shop"}
                <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              </p>
              <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">
                {product.category || "Trending"}
              </p>
            </div>
          </div>
          <Link
            to={`/market/shop/${product.shop_slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground bg-gradient-to-r from-primary via-primary to-primary/80 shadow-md hover:shadow-lg hover:scale-[1.05] active:scale-95 transition-all shrink-0 whitespace-nowrap"
          >
            {t("market.visit")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Image with enhanced overlays */}
        <div
          className="relative block bg-gradient-to-br from-muted to-muted/50 cursor-pointer select-none overflow-hidden"
          onClick={handleImageTap}
        >
          {product.image_url ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="overflow-hidden"
            >
              <CloudinaryImage
                src={product.image_url}
                alt={product.name}
                width={1080}
                sizes="(max-width: 768px) 100vw, 640px"
                aspect="aspect-[4/5]"
                className="max-h-[560px] transition-transform duration-[1200ms] ease-out"
              />
            </motion.div>
          ) : (
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
              <Store className="h-12 w-12 opacity-50" />
            </div>
          )}

          {/* Premium gradient overlays */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Top-left premium price chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/95 to-primary/85 backdrop-blur-md px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg ring-1 ring-white/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>TZS {product.selling_price.toLocaleString()}</span>
          </motion.div>

          {/* Bottom title and description overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h3 className="text-white text-lg sm:text-xl font-bold drop-shadow-lg line-clamp-2 leading-tight mb-1.5">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-white/80 text-xs sm:text-sm drop-shadow-md line-clamp-1 opacity-90">
                {product.description}
              </p>
            )}
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

        {/* Enhanced Reaction Bar */}
        <div className="flex items-center gap-4 px-5 sm:px-6 py-4 border-t border-border/40 bg-card/50 backdrop-blur-sm">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerLike}
            className="flex items-center gap-2 text-foreground/70 hover:text-rose-500 transition active:scale-90 group"
          >
            <div className="p-2 rounded-lg group-hover:bg-rose-500/10 transition">
              <Heart className={`h-5 w-5 transition-all ${liked ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
            </div>
            <span className="text-xs font-semibold tabular-nums">{counts.likes.toLocaleString()}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition active:scale-90 group"
          >
            <div className="p-2 rounded-lg group-hover:bg-foreground/10 transition">
              <MessageCircle className="h-5 w-5 transition-all" />
            </div>
            <span className="text-xs font-semibold tabular-nums">{counts.comments.toLocaleString()}</span>
          </motion.button>

          <Link
            to={`/market/shop/${product.shop_slug}`}
            className="flex items-center gap-2 text-foreground/70 hover:text-primary transition active:scale-90 group"
          >
            <div className="p-2 rounded-lg group-hover:bg-primary/10 transition">
              <ShoppingCart className="h-5 w-5 transition-all" />
            </div>
          </Link>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSave}
            className="ml-auto text-foreground/70 hover:text-accent transition active:scale-90 group"
          >
            <div className="p-2 rounded-lg group-hover:bg-accent/10 transition">
              <Bookmark className={`h-5 w-5 transition-all ${saved ? "fill-accent text-accent scale-110" : ""}`} />
            </div>
          </motion.button>
        </div>

        {/* Body with enhanced description */}
        {product.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="px-5 sm:px-6 py-3 border-b border-border/40"
          >
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </motion.div>
        )}

        {/* Comments Section */}
        <div className="px-5 sm:px-6 py-4">
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
