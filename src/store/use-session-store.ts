// Globalny stan sesji użytkownika przechowywany za pomocą Zustand.

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

// Utworzenie magazynu sesji użytkownika.
export const useSessionStore = create<SessionStoreState & SessionStoreActions>(
  (set) => ({
    session: null,
    isHydrated: false,
    setSession: (session) => set({ session, isHydrated: true }),
    clearSession: () => set({ session: null, isHydrated: true }),
    markHydrated: (session) => set({ session, isHydrated: true }),
  }),
);
