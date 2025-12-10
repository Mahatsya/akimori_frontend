import { fetchPublicProfile } from "@/lib/profile";
import { notFound } from "next/navigation";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  // /user/settings — не грузим публичный профиль и не рисуем шапку
  if (/^settings$/i.test(handle)) {
    return <>{children}</>;
  }

  try {
    await fetchPublicProfile(handle);
    return <>{children}</>;
  } catch (e: any) {
    if (e?.message === "NOT_FOUND") notFound();
    throw e;
  }
}
