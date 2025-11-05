# Konfiguracja Billzilla - Funkcja Nagrywania i Transkrypcji

## Przegląd

Projekt Billzilla wykorzystuje dwie usługi AI do przetwarzania nagrań głosowych:

1. **OpenAI Whisper** - Transkrypcja audio do tekstu
2. **OpenRouter (Claude)** - Ekstrakcja danych wydatków z tekstu

Oba klucze API muszą być skonfigurowane, aby funkcja nagrywania głosu działała prawidłowo zarówno lokalnie jak i na Cloudflare.

---

## 1. Konfiguracja Lokalna

### Krok 1: Utwórz plik `.env.local`

W głównym katalogu projektu utwórz plik `.env.local` (NIE `.env`):

```bash
# .env.local (NIGDY nie commituj tego pliku!)

# OpenAI API Key for Whisper
OPENAI_API_KEY=sk-...

# OpenRouter API Key for LLM
OPENROUTER_API_KEY=sk-or-...

# Supabase (opcjonalnie, jeśli testujesz lokalnie)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Krok 2: Uzyskaj klucze API

#### OpenAI (Whisper)
1. Przejdź na https://platform.openai.com/api-keys
2. Kliknij "Create new secret key"
3. Skopiuj klucz (zaczyna się od `sk-`)
4. Wklej go do `OPENAI_API_KEY=sk-...`

**Uwaga:** Upewnij się, że masz saldo lub aktywną subskrypcję w OpenAI.

#### OpenRouter (Claude)
1. Przejdź na https://openrouter.ai/settings/keys
2. Kliknij "Create Key"
3. Skopiuj klucz (zaczyna się od `sk-or-`)
4. Wklej go do `OPENROUTER_API_KEY=sk-or-...`

### Krok 3: Uruchom projekt lokalnie

```bash
npm run dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`

Funkcja nagrywania głosu powinna teraz działać. Zmienne środowiskowe z `.env.local` będą automatycznie wczytane.

---

## 2. Konfiguracja Cloudflare

### Krok 1: Ustaw zmienne w Cloudflare Pages Dashboard

1. Przejdź do https://dash.cloudflare.com
2. Wybierz Projekt → Pages → Twoja Aplikacja
3. Przejdź do: **Settings → Environment Variables**

### Krok 2: Dodaj zmienne dla Production

Kliknij "Add Variable" i dodaj następujące zmienne:

| Name | Value | Type |
|------|-------|------|
| `OPENAI_API_KEY` | `sk-...` | Secret |
| `OPENROUTER_API_KEY` | `sk-or-...` | Secret |

**WAŻNE:** Zaznacz "Secret" jako typ, aby ukryć wartości w UI!

### Krok 3: Edytuj wrangler.toml (jeśli testujesz lokalnie z Cloudflare)

```toml
# wrangler.toml

name = "billzilla"
compatibility_date = "2024-01-01"

# Jeśli chcesz testować lokalne zmienne z wrangler dev:
[env.development]
vars = { }

[env.development.vars]
# Nie dodawaj tajnych kluczy tutaj! Użyj .env.local zamiast tego
```

### Krok 4: Deploy do Cloudflare

```bash
npm run build
```

Cloudflare automatycznie pobierze zmienne z dashboard podczas deployu.

---

## 3. Jak Działa Rozwiązanie

Projekt używa **`astro:env`** - bezpiecznego sposobu dostępu do zmiennych środowiskowych w Astro 5, który automatycznie obsługuje zarówno local development jak i Cloudflare edge runtime.

### Flow na Localhost

```
.env.local (process.env)
           ↓
    astro:env (astro.config.mjs schema)
           ↓
    import.meta.env.OPENAI_API_KEY
    import.meta.env.OPENROUTER_API_KEY
           ↓
    API Endpoint (transcribe/index.ts, runtime)
           ↓
    TranscriptionTaskService
           ↓
    WhisperService / OpenRouterService
           ↓
    ✅ Działa lokalnie
```

### Flow na Cloudflare

```
Cloudflare Dashboard (Environment Variables)
           ↓
    astro:env (astro.config.mjs schema - env context: "server")
           ↓
    import.meta.env.OPENAI_API_KEY
    import.meta.env.OPENROUTER_API_KEY
           ↓
    API Endpoint (transcribe/index.ts, runtime)
           ↓
    TranscriptionTaskService
           ↓
    WhisperService / OpenRouterService
           ↓
    ✅ Działa na Cloudflare
```

### Ważne Szczegóły

- ✅ **astro:env** automatycznie obsługuje różne environmenty
- ✅ Zmienne są czytane w **runtime** (API endpoints), nie w build-time
- ✅ **Bezpieczeństwo**: Sekretne zmienne (`access: "secret"`) nigdy nie trafiają do klienta
- ✅ **Type-safe**: TypeScript waliduje dostęp do zmiennych

---

## 4. Troubleshooting

### ❌ Błąd: "OPENAI_API_KEY not set"

**Przyczyna:** Klucz API nie jest znaleziony w żadnym źródle.

**Rozwiązanie:**
- Lokalnie: Sprawdź, czy plik `.env.local` istnieje i zawiera `OPENAI_API_KEY=sk-...`
- Cloudflare: Sprawdź, czy zmienna jest ustawiona w Settings → Environment Variables
- Upewnij się, że restartowałeś dev server (`npm run dev`)

### ❌ Błąd: "OPENROUTER_API_KEY not set"

**Przyczyna:** Klucz OpenRouter nie jest znaleziony.

**Rozwiązanie:**
- Sprawdź poprawność klucza OpenRouter (powinien zaczynać się od `sk-or-`)
- Upewnij się, że ma prawidłowe uprawnienia (może być ograniczony do konkretnych modeli)

### ❌ Transkrypcja zawiesza się na Cloudflare

**Przyczyna:** Zmienne mogą nie być dostępne w Cloudflare Functions.

**Rozwiązanie:**
- Sprawdź, czy zmienne są ustawione jako "Secret" w dashboard
- Sprawdź logi w Cloudflare Dashboard → Logs

### ❌ Działa lokalnie, ale nie na Cloudflare

**Przyczyna:** Zmienne są w `.env.local`, ale nie w Cloudflare dashboard.

**Rozwiązanie:**
- `.env.local` jest tylko dla developmentu
- Musisz dodać zmienne w Cloudflare dashboard → Settings → Environment Variables
- Deploy ponownie po dodaniu zmiennych

---

## 5. Bezpieczeństwo

⚠️ **NIGDY nie commituj `.env.local`** - jest w `.gitignore`

✅ **ZAWSZE używaj "Secret" w Cloudflare** - zmienne będą zaszyfrowane

✅ **ROTATE klucze regularnie** - jeśli klucz był kiedyś widoczny publicznie

✅ **Monitoruj zużycie** - OpenAI i OpenRouter mogą generować koszty

---

## 6. Zmienne Środowiskowe - Jak astro:env Działa

**astro:env** (zdefiniowany w `astro.config.mjs`) automatycznie:

1. **Lokalnie** - Czyta z `.env.local` (lub `.env`) przy pomocy `dotenv`
2. **Na Cloudflare** - Czyta z Environment Variables ustawionego w dashboard
3. **W API endpoints** - Udostępnia zmienne poprzez `import.meta.env` w runtime
4. **Type-safe** - TypeScript wymusza dostęp tylko do zdefiniowanych zmiennych
5. **Sekretne** - Zmienne z `access: "secret"` nigdy nie trafiają do JS bundle klienta

Nie trzeba nic więcej robić - `astro:env` zajmuje się całą magią!

---

## 7. Testowanie

Aby przetestować, czy zmienne są prawidłowo załadowane:

```bash
# Lokalnie - sprawdź, czy .env.local jest czytany
npm run dev
# Spróbuj nagrać i transkrybować

# Na Cloudflare - sprawdź logi
# Cloudflare Dashboard → Logs
```

---

## Potrzebujesz Pomocy?

- 📖 OpenAI API Docs: https://platform.openai.com/docs/api-reference
- 📖 OpenRouter Docs: https://openrouter.ai/docs
- 🐛 Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- 💬 Kontakt: Zobacz CONTRIBUTING.md

