// ==========================================
// LAYOUT: Chroniony panel korepetytora
// ==========================================
// Sprawdza sesję również na serwerze i przekazuje dane użytkownika do powłoki.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { getTutorSession, SESSION_COOKIE, toUser } from "@/features/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const session = await getTutorSession(token);
  if (session.kind === "error") throw new Error("Nie udało się sprawdzić sesji.");
  if (session.kind === "unauthorized") redirect("/login");
  if (session.user.must_change_password) redirect("/change-password");

  return <ProtectedShell initialSession={{ user: toUser(session.user) }}>{children}</ProtectedShell>;
}
