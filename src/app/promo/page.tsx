// src/app/promo/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import PromoPageClient from "./PromoPageClient";

export default function PromoPage() {
  return <PromoPageClient />;
}
