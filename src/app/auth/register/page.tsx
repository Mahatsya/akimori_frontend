// src/app/auth/register/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

import RegisterPageClient from "./RegisterPageClient";

export default function RegisterPage() {
  return <RegisterPageClient />;
}
