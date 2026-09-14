// ==========================================
// STORE: Globalny stan sesji użytkownika
// ==========================================
// Plik zarządza stanem zalogowanego użytkownika w pamięci podręcznej klienta
// przy użyciu biblioteki Zustand, eliminując potrzebę ciągłego odpytywania backendu.

import { create } from "zustand";
import type { AuthSession } from "@/features/auth/types";

type SessionStoreState = Readonly<{
  session: AuthSession | null;
  isHydrated: boolean;
}>;

type SessionStoreActions = Readonly<{
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  markHydrated: (session: AuthSession | null) => void;
}>;

// * Tworzy store Zustand do zarządzania sesją użytkownika
export const useSessionStore = create<SessionStoreState & SessionStoreActions>(
  (set) => ({
    session: null,
    isHydrated: false,
    setSession: (session) => set({ session, isHydrated: true }),
    clearSession: () => set({ session: null, isHydrated: true }),
    markHydrated: (session) => set({ session, isHydrated: true }),
  }),
);
