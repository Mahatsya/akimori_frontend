// src/app/wallet/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

import WalletPageClient from "./WalletPageClient";

export default function WalletPage() {
  return <WalletPageClient />;
}
