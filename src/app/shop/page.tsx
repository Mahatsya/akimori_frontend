// src/app/shop/page.tsx
import { getOffers } from "@/lib/shopApi";
import ShopGrid from "@/components/shop/ShopGrid";
import ShopFilters from "@/components/shop/ShopFilters";

export const revalidate = 30;

export default async function ShopPage() {
  // Забираем все активные офферы; фильтруем на клиенте по URL
  const offers = await getOffers(true);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Магазин</h1>
        <ShopFilters />
      </div>

      {offers.length === 0 ? (
        <div className="text-white/70">Пока пусто.</div>
      ) : (
        <ShopGrid offers={offers} />
      )}
    </main>
  );
}
