// ==========================================
// TRASA: Logowanie
// ==========================================

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Login } from "@/features/auth/views/Login";

export const metadata = { title: "Zaloguj się" };

export default function LoginPage() {
  return (
    <AuthLayout>
      <Login />
    </AuthLayout>
  );
}
