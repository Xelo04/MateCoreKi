This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: node_modules/**, .next/**, package-lock.json, public/**, *.png, *.jpg, *.svg, *.ico
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
src/
  app/
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  features/
    auth/
      hooks/
        use-auth.ts
      service.ts
      types.ts
  lib/
    api/
      api-client.ts
      api-errors.ts
    auth/
      token-storage.ts
  store/
    use-session-store.ts
.gitignore
eslint.config.mjs
next.config.ts
package.json
postcss.config.mjs
README.md
tsconfig.json
````

# Files

## File: src/features/auth/hooks/use-auth.ts
````typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authService } from "@/features/auth/service";
import { useSessionStore } from "@/store/use-session-store";
import type {
  LoginCredentials,
  RegisterCredentials,
} from "@/features/auth/types";
import { toast } from "sonner";

const DEFAULT_AUTHENTICATED_REDIRECT = "/dashboard";

// * Hook pomocniczy do obsługi logiki uwierzytelniania w widokach formularzy
export function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const session = useSessionStore((state) => state.session);
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const markHydrated = useSessionStore((state) => state.markHydrated);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated) return;
    let cancelled = false;
    void authService.getSession().then((next) => {
      if (cancelled) return;
      markHydrated(next);
    });
    return () => {
      cancelled = true;
    };
  }, [isHydrated, markHydrated]);

  const resolveRedirect = useCallback(
    (override?: string): string => {
      if (override) return override;
      const fromQuery = searchParams.get("redirect");
      if (fromQuery && fromQuery.startsWith("/") && !fromQuery.startsWith("//"))
        return fromQuery;
      return DEFAULT_AUTHENTICATED_REDIRECT;
    },
    [searchParams],
  );

  const login = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const next = await authService.login(credentials);
        setSession(next);
        toast.success("Zalogowano pomyślnie", {
          description: `Witaj z powrotem, ${next.user.displayName || next.user.firstName}.`,
        });
        router.push(resolveRedirect(redirectTo));
        return next;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Nie udało się zalogować.";
        setError(message);
        toast.error("Logowanie nieudane", { description: message });
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setSession, resolveRedirect],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials, redirectTo?: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const next = await authService.register(credentials);
        setSession(next);
        toast.success("Konto utworzone", {
          description: `Witaj w systemie, ${next.user.firstName}.`,
        });
        router.push(resolveRedirect(redirectTo));
        return next;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Nie udało się utworzyć konta.";
        setError(message);
        toast.error("Rejestracja nieudana", { description: message });
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setSession, resolveRedirect],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
    toast.info("Wylogowano pomyślnie");
    router.push("/login");
  }, [clearSession, router]);

  return {
    session,
    isAuthenticated: session !== null,
    isHydrated,
    isSubmitting,
    error,
    login,
    register,
    logout,
  };
}
````

## File: src/features/auth/service.ts
````typescript
import { apiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-errors";
import { tokenStorage } from "@/lib/auth/token-storage";
import type {
  AuthSession,
  LoginCredentials,
  LoginResponseDTO,
  MeResponseDTO,
  RegisterCredentials,
  RegisterResponseDTO,
  User,
} from "./types";

function composeDisplayName(firstName: string, lastName: string): string {
  const parts = [firstName.trim(), lastName.trim()].filter((s) => s.length > 0);
  return parts.join(" ");
}

function mapTutorResponseToUser(dto: MeResponseDTO): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    displayName: composeDisplayName(dto.first_name, dto.last_name),
    createdAt: dto.created_at,
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const form = new URLSearchParams();
    form.set("username", credentials.email);
    form.set("password", credentials.password);

    // TODO: dodać form.set("remember_me", ...) gdy backend to wdroży
    const response = await apiClient.post<LoginResponseDTO>("/tutors/login", {
      body: form,
    });

    tokenStorage.set(response.access_token);
    return { user: mapTutorResponseToUser(response.user) };
  },

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const body = {
      email: credentials.email,
      first_name: credentials.firstName,
      last_name: credentials.lastName,
      password: credentials.password,
      password_confirm: credentials.password,
    };

    await apiClient.post<RegisterResponseDTO>("/tutors/register", { body });

    return await authService.login({
      email: credentials.email,
      password: credentials.password,
    });
  },

  async logout(): Promise<void> {
    // TODO: dodać apiClient.post("/tutors/logout", { auth: true }) gdy backend obsłuży rewokację tokena
    tokenStorage.clear();
  },

  async getSession(): Promise<AuthSession | null> {
    const token = tokenStorage.get();
    if (!token) return null;

    try {
      const meResponse = await apiClient.get<MeResponseDTO>("/tutors/me", {
        auth: true,
      });
      return { user: mapTutorResponseToUser(meResponse) };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStorage.clear();
        return null;
      }
      return null;
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    // TODO: podmienić na realny endpoint apiClient.post("/tutors/forgot-password", { body: { email } })
    void email;
    await new Promise((resolve) => setTimeout(resolve, 400));
  },
};
````

## File: src/features/auth/types.ts
````typescript
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
}

export interface MeResponseDTO {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface RegisterResponseDTO {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface LoginResponseDTO {
  access_token: string;
  token_type: string;
  user: MeResponseDTO;
}
````

## File: src/lib/api/api-client.ts
````typescript
import { tokenStorage } from "@/lib/auth/token-storage";
import { ApiError, defaultMessageForStatus } from "@/lib/api/api-errors";

interface RequestOptions {
  auth?: boolean;
  body?: Record<string, unknown> | URLSearchParams;
  headers?: Record<string, string>;
}

// * Główny klient HTTP komunikujący się z backendem Python FastAPI.
async function request<TResponse>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${baseUrl}${path}`;
  const headers = new Headers(options.headers);

  if (options.auth) {
    const token = tokenStorage.get();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let body: BodyInit | undefined;
  if (options.body instanceof URLSearchParams) {
    body = options.body;
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    }
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch (networkError) {
    throw new ApiError(defaultMessageForStatus(0), 0, networkError);
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ?? defaultMessageForStatus(response.status);
    throw new ApiError(message, response.status, payload);
  }

  return payload as TResponse;
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const detail = record["detail"];

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Record<string, unknown> | undefined;
    const msg = first?.["msg"];
    if (typeof msg === "string") return msg;
  }
  return null;
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "body">): Promise<T> {
    return request<T>("GET", path, options);
  },
  post<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, options);
  },
  put<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, options);
  },
  patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, options);
  },
};
````

## File: src/lib/api/api-errors.ts
````typescript
// * Domenowe błędy warstwy API dla całej aplikacji.
export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// * Mapowanie kodów HTTP na komunikaty użytkownika (język polski).
export function defaultMessageForStatus(status: number): string {
  if (status === 0) return "Brak połączenia z serwerem. Sprawdź internet.";
  if (status === 400) return "Nieprawidłowe dane w żądaniu.";
  if (status === 401) return "Nieprawidłowy email lub hasło.";
  if (status === 403) return "Brak uprawnień do tej operacji.";
  if (status === 404) return "Nie znaleziono zasobu.";
  if (status === 409) return "Konflikt - zasób już istnieje.";
  if (status === 422) return "Nieprawidłowe dane w formularzu.";
  if (status === 429) return "Zbyt wiele prób. Spróbuj za chwilę.";
  if (status >= 500) return "Błąd serwera. Spróbuj ponownie za chwilę.";
  return "Nieoczekiwany błąd.";
}
````

## File: src/lib/auth/token-storage.ts
````typescript
// * Bezpieczne zarządzanie tokenem JWT w localStorage z ochroną przed SSR.
const TOKEN_STORAGE_KEY = "matcoreki:auth:token";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ! Ignoruje błędy np. w trybie prywatnym przeglądarki
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ! Ignoruje błędy usuwania
    }
  },
};
````

## File: src/store/use-session-store.ts
````typescript
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

// * Globalny store stanu sesji użytkownika oparty o Zustand
export const useSessionStore = create<SessionStoreState & SessionStoreActions>(
  (set) => ({
    session: null,
    isHydrated: false,
    setSession: (session) => set({ session, isHydrated: true }),
    clearSession: () => set({ session: null, isHydrated: true }),
    markHydrated: (session) => set({ session, isHydrated: true }),
  }),
);
````

## File: src/app/globals.css
````css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-radius: var(--radius);
}

:root {
  /* Baza (Zinc + Professional Blue) - Wyłącznie jasny motyw */
  --background: #ffffff;
  --foreground: #09090b; /* Zinc 950 */

  --card: #ffffff;
  --card-foreground: #09090b;

  --popover: #ffffff;
  --popover-foreground: #09090b;

  /* Główny niebieski akcent (przycisków, linków, aktywnych elementów) */
  --primary: #2563eb; /* Blue 600 - wyrazisty, świetny kontrast */
  --primary-foreground: #ffffff;

  --secondary: #f4f4f5; /* Zinc 100 */
  --secondary-foreground: #18181b; /* Zinc 900 */

  --muted: #f4f4f5;
  --muted-foreground: #71717a; /* Zinc 500 */

  --accent: #f4f4f5;
  --accent-foreground: #18181b;

  --destructive: #ef4444; /* Red 500 */
  --destructive-foreground: #ffffff;

  --border: #e4e4e7; /* Zinc 200 */
  --input: #e4e4e7;
  --ring: #2563eb; /* Dopasowany ring do głównego niebieskiego */

  --radius: 0.5rem;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}
````

## File: src/app/layout.tsx
````typescript
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matcoreki - Platforma dla Korepetytorów",
  description:
    "Nowoczesna platforma do zarządzania korepetycjami i interaktywnymi zajęciami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
````

## File: src/app/page.tsx
````typescript
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
````

## File: .gitignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
````

## File: eslint.config.mjs
````javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
````

## File: next.config.ts
````typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
````

## File: package.json
````json
{
  "name": "matcoreki",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@excalidraw/excalidraw": "^0.18.1",
    "lucide-react": "^1.45.0",
    "next": "16.3.5",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "react-hook-form": "^7.88.0",
    "sonner": "^2.0.8",
    "zod": "^4.6.4",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "babel-plugin-react-compiler": "1.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.3.5",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
````

## File: postcss.config.mjs
````javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
````

## File: README.md
````markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
````
