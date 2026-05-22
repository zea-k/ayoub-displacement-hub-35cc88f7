import { useParams } from "react-router-dom";
import { usePageViewTracker } from "@/hooks/useActivityTracker";
import PublicStorePage from "./PublicStorePage";

export default function MarketplaceShopPage() {
  const { slug } = useParams();
  // Track shop view + time spent automatically
  usePageViewTracker("view_shop", slug);

  return <PublicStorePage />;
}
