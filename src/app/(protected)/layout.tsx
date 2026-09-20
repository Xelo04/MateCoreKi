// ==========================================
// LAYOUT: Layout dla chronionych stron (wymagających logowania)
// ==========================================

export default function ProtectedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
