// ==========================================
// TRASA: Odzyskiwanie hasła
// ==========================================

import { AuthLayout } from "@/components/layout/AuthLayout";
import { ForgotPassword } from "@/features/auth/views/ForgotPassword";

export const metadata = { title: "Zresetuj hasło" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  );
}
