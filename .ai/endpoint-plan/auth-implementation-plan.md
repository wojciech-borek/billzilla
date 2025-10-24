# Auth System Implementation Plan

## 1. Przegląd systemu autentykacji

System autentykacji Billzilla opiera się na Supabase Auth z dodatkowymi mechanizmami bezpieczeństwa i walidacji. Implementuje pełny cykl życia użytkownika od rejestracji przez zarządzanie sesją po resetowanie hasła.

Kluczowe komponenty:
- **Middleware Astro** - ochrona tras i zarządzanie sesją
- **Supabase Auth** - backend autentykacji z RLS
- **OAuth Google** - alternatywna metoda logowania
- **Email verification** - potwierdzanie kont przez e-mail
- **Password reset** - bezpieczne resetowanie hasła

## 2. Middleware Astro

### Konfiguracja klienta Supabase SSR

```typescript
// /src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

const PUBLIC_ROUTES = ["/login", "/signup", "/reset-password", "/about", "/auth/callback", "/auth/confirm"];

function isValidRedirectUrl(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("://")) return false;
  return true;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) { return context.cookies.get(key)?.value; },
        set(key, value, options) { context.cookies.set(key, value, options); },
        remove(key, options) { context.cookies.delete(key, options); },
      },
    }
  );

  context.locals.supabase = supabase;

  const session = await supabase.auth.getSession();
  if (session.data.session?.user) {
    context.locals.user = {
      id: session.data.session.user.id,
      email: session.data.session.user.email!,
    };
  } else {
    context.locals.user = null;
  }

  const pathname = context.url.pathname;
  if (isPublicRoute(pathname)) {
    return next();
  }

  if (!session) {
    const redirectPath = pathname + context.url.search;
    if (isValidRedirectUrl(redirectPath)) {
      return context.redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
    return context.redirect("/login");
  }

  return next();
});
```

### Typy dla context.locals

```typescript
// /src/env.d.ts
declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient<import("./db/database.types").Database>;
    user: {
      id: string;
      email: string;
    } | null;
  }
}
```

## 3. Endpointy API

### POST /auth/callback (OAuth callback)

**Cel:** Obsługa callback z Google OAuth i wymiana code za session.

```typescript
// /src/pages/auth/callback.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (errorParam) {
    const encodedError = encodeURIComponent(errorDescription || errorParam);
    return redirect(`/login?error=${encodedError}`);
  }

  if (code) {
    const supabase = locals.supabase;
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    return redirect(next);
  }

  return redirect("/login?error=missing_code");
};

export const prerender = false;
```

### GET /auth/confirm (Email confirmation)

**Cel:** Weryfikacja tokenu potwierdzającego e-mail.

```typescript
// /src/pages/auth/confirm.astro
const tokenHash = Astro.url.searchParams.get("token_hash");
const type = Astro.url.searchParams.get("type");
const next = Astro.url.searchParams.get("next");

if (tokenHash && type === "email") {
  const { error } = await Astro.locals.supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (error) {
    // Handle error
  } else {
    // Success - redirect to dashboard
    return Astro.redirect("/");
  }
}
```

## 4. Schemy walidacji (Zod)

### Schemat logowania

```typescript
// /src/lib/schemas/authSchemas.ts
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format adresu e-mail")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

### Schemat rejestracji

```typescript
export const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "To pole jest wymagane")
      .min(2, "Nazwa musi mieć minimum 2 znaki")
      .max(50, "Nazwa może mieć maksymalnie 50 znaków")
      .trim(),
    email: z
      .string()
      .min(1, "Adres e-mail jest wymagany")
      .email("Nieprawidłowy format adresu e-mail")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, "Hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę"),
    confirm_password: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Hasła muszą być identyczne",
    path: ["confirm_password"],
  });
```

### Schemat resetowania hasła

```typescript
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format adresu e-mail")
    .toLowerCase()
    .trim(),
});

export const setNewPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "Nowe hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać przynajmniej jedną literę"),
    confirm_password: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Hasła muszą być identyczne",
    path: ["confirm_password"],
  });
```

## 5. Typy TypeScript

```typescript
// /src/types.ts

// Authentication DTOs
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface SetNewPassword {
  new_password: string;
  confirm_password: string;
}

export interface AuthUserWithProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}
```

## 6. Hooki React

### useSupabaseAuth

```typescript
// /src/lib/hooks/useSupabaseAuth.ts
import { createClient } from "@/db/supabase.client";
import { useMemo } from "react";

export function useSupabaseAuth() {
  const supabase = useMemo(() => createClient(), []);

  return {
    supabase,
    signIn: supabase.auth.signInWithPassword,
    signUp: supabase.auth.signUp,
    signOut: supabase.auth.signOut,
    signInWithOAuth: supabase.auth.signInWithOAuth,
    resetPassword: supabase.auth.resetPasswordForEmail,
    updateUser: supabase.auth.updateUser,
  };
}
```

### useAuthForm

```typescript
// /src/lib/hooks/useAuthForm.ts
import { useState } from "react";
import type { ZodSchema } from "zod";

export function useAuthForm<T>(schema: ZodSchema<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleChange = (field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const reset = () => {
    setFormData({});
    setErrors({});
    setApiError(null);
  };

  return {
    formData,
    errors,
    isLoading,
    apiError,
    setIsLoading,
    setApiError,
    handleChange,
    validate,
    reset,
  };
}
```

## 7. Utility Functions

### Mapowanie błędów Supabase

```typescript
// /src/lib/utils/authErrors.ts
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Nieprawidłowy adres e-mail lub hasło",
  email_not_confirmed: "Potwierdź swój adres e-mail przed zalogowaniem",
  user_not_found: "Nie znaleziono użytkownika o podanym adresie e-mail",
  user_already_exists: "Użytkownik o tym adresie e-mail już istnieje",
  email_exists: "Ten adres e-mail jest już zarejestrowany",
  weak_password: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków, w tym cyfry i litery",
  same_password: "Nowe hasło musi być inne niż poprzednie",
  invalid_token: "Link resetujący hasło wygasł lub jest nieprawidłowy",
  oauth_provider_error: "Wystąpił błąd podczas logowania przez Google",
  oauth_callback_error: "Nie udało się zakończyć logowania przez Google",
  network_error: "Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie",
  server_error: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę",
  unknown_error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie",
};

export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || error?.error_code || error?.message;
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES["unknown_error"];
}
```

### Walidacja redirect URL

```typescript
// /src/lib/utils/redirectValidation.ts
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("://")) return false;
  return true;
}
```

## 8. Konfiguracja Supabase

### Zmienne środowiskowe

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL for OAuth callbacks
PUBLIC_SITE_URL=http://localhost:3000
```

### Konfiguracja w Supabase Dashboard

1. **Authentication Settings:**
   - Enable Email provider
   - Enable Google OAuth provider
   - Set Site URL: `http://localhost:3000` (dev) / `https://your-domain.com` (prod)
   - Set Redirect URLs:
     - `http://localhost:3000/auth/callback` (dev)
     - `https://your-domain.com/auth/callback` (prod)

2. **Email Templates:**
   - **Confirm signup:** `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - **Reset password:** `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

3. **Google OAuth Configuration:**
   - Client ID i Client Secret z Google Cloud Console
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

## 9. Flow autentykacji

### Rejestracja e-mail/hasło

1. Użytkownik wypełnia formularz w `/signup`
2. `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
3. Supabase wysyła e-mail weryfikacyjny
4. Użytkownik klika link → `/auth/confirm?token_hash=...`
5. `verifyOtp()` weryfikuje token i ustawia sesję
6. Trigger `handle_new_user` tworzy profil w bazie

### Logowanie e-mail/hasło

1. Użytkownik wypełnia formularz w `/login`
2. `supabase.auth.signInWithPassword({ email, password })`
3. Supabase weryfikuje dane i tworzy sesję
4. Middleware ustawia cookie sesji
5. Przekierowanie na dashboard lub `redirect` URL

### Google OAuth

1. Użytkownik klika "Continue with Google"
2. `signInWithOAuth({ provider: 'google' })`
3. Przekierowanie na Google OAuth
4. Google callback → `/auth/callback`
5. `exchangeCodeForSession(code)` wymienia code za session
6. Trigger tworzy profil jeśli nowy użytkownik

### Resetowanie hasła

1. Użytkownik podaje e-mail w `/reset-password`
2. `resetPasswordForEmail(email)` wysyła link
3. Użytkownik klika link → `/reset-password?type=recovery&access_token=...`
4. `updateUser({ password: newPassword })` ustawia nowe hasło

## 10. Bezpieczeństwo

### Ochrona przed atakami

- **CSRF Protection:** SameSite cookies
- **XSS Protection:** React escapuje dane wejściowe
- **SQL Injection:** Supabase używa prepared statements
- **Open Redirect Protection:** Walidacja wszystkich redirect URL
- **Brute Force Protection:** Rate limiting przez Supabase

### Session Management

- **Cookie-based sessions:** HTTP-only, Secure, SameSite=Lax
- **Session refresh:** Automatyczne przez middleware
- **Token lifetime:** JWT 1h, refresh tokens w cookies
- **Logout:** `signOut()` czyści cookies i sesję

### Row Level Security

Polityki RLS już zabezpieczają dane:

```sql
-- Użytkownik może odczytać swój profil
create policy "allow_read_own_profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Użytkownik może zaktualizować swój profil
create policy "allow_update_own_profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()));
```

### Trigger tworzenia profilu

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer set search_path = '';
```

## 11. Etapy implementacji

1. **Konfiguracja infrastruktury:**
   - Instalacja `@supabase/ssr`, `@supabase/supabase-js`
   - Konfiguracja zmiennych środowiskowych
   - Aktualizacja `env.d.ts`

2. **Middleware i routing:**
   - Implementacja middleware z ochroną tras
   - Endpoint `/auth/callback` dla OAuth
   - Endpoint `/auth/confirm` dla weryfikacji e-mail

3. **Komponenty i strony:**
   - Schemy walidacji Zod
   - Hooki `useSupabaseAuth`, `useAuthForm`
   - Utility functions dla błędów i walidacji
   - Komponenty React: `LoginForm`, `SignupForm`, `ResetPasswordForm`
   - Strony Astro: `/login`, `/signup`, `/reset-password`

4. **Integracja z layoutem:**
   - Komponent `UserMenu` i `LogoutButton`
   - Aktualizacja `Layout.astro` z danymi użytkownika
   - Aktualizacja chronionych stron

5. **Testowanie i optymalizacja:**
   - Testy wszystkich flow autentykacji
   - Testy bezpieczeństwa (Open Redirect, RLS)
   - Testy responsywności i accessibility
   - Performance optimization
