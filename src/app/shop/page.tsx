import { getOffers } from "@/lib/shopApi";
import ShopGrid from "@/components/shop/ShopGrid";
import ShopToolbar from "@/components/shop/ShopToolbar";

export const revalidate = 30;

export default async function ShopPage() {
  const offers = await getOffers(true);

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Магазин</h1>
      </div>

      <div className="mb-5">
        <ShopToolbar />
      </div>

      <ShopGrid offers={offers} />
    </main>
  );
}
