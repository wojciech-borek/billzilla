# Nagrywanie i Transkrypcja Głosu - Instrukcja Konfiguracji

## 🎯 Cel

Skonfigurować funkcję nagrywania i transkrypcji wydatków głosem tak, aby działała zarówno lokalnie jak i na Cloudflare.

---

## 📋 Co Się Zmieniło

Projekt został zaktualizowany do używania **`astro:env`** - bezpiecznego i zalecanego sposobu obsługi zmiennych środowiskowych w Astro 5.

### Główne Zmiany

1. **WhisperService** - Teraz wymaga przekazania klucza OpenAI w konstruktorze (zamiast czytania z `import.meta.env`)
2. **OpenRouterService** - Teraz wymaga przekazania klucza OpenRouter w konstruktorze
3. **API Endpoints** - Czytają zmienne z `import.meta.env` w runtime i przesyłają do serwisów
4. **Middleware** - Uproszczony, zmienne dostępne bezpośrednio w API endpoints
5. **Usunięty** - Plik `src/lib/utils/env.ts` (nie jest już potrzebny)

---

## ⚙️ Konfiguracja

### Lokalnie

#### 1. Utwórz `.env.local` w głównym katalogu projektu

```bash
# .env.local (NIGDY nie commituj!)

OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

#### 2. Uruchom projekt

```bash
npm run dev
```

Zmienne z `.env.local` będą automatycznie załadowane.

### Na Cloudflare

#### 1. Dodaj zmienne w Cloudflare Dashboard

1. Przejdź do **Cloudflare Dashboard** → **Pages** → Twoja Aplikacja
2. **Settings** → **Environment Variables**
3. Kliknij **Add Variable**
4. Dodaj (jako **Secret**):
   - `OPENAI_API_KEY` = `sk-...`
   - `OPENROUTER_API_KEY` = `sk-or-...`

#### 2. Deploy

```bash
npm run build
# Deploy - zmienne będą dostępne automatycznie
```

---

## 🧪 Testowanie

### Lokalnie

```bash
npm run dev
# Przejdź do http://localhost:3000
# Spróbuj nagrać i transkrybować wydatek
```

### Na Cloudflare

1. Deploy aplikacji
2. Przejdź do twojej aplikacji na Cloudflare
3. Spróbuj nagrać i transkrybować wydatek
4. Jeśli błąd: sprawdź zmienne w **Settings** → **Environment Variables**

---

## 🐛 Troubleshooting

### Błąd: "API keys not configured on server"

**Przyczyna:** Zmienne nie są dostępne w API endpoint.

**Rozwiązanie:**
- **Lokalnie**: Sprawdź czy `.env.local` istnieje i zawiera `OPENAI_API_KEY` i `OPENROUTER_API_KEY`
- **Cloudflare**: Sprawdź czy zmienne są ustawione w **Settings** → **Environment Variables** jako **Secret**
- **Cloudflare**: Zrebuilduj i redeploy aplikacji

### Błąd: "OPENAI_API_KEY not set"

**Przyczyna:** Klucz OpenAI nie został znaleziony.

**Rozwiązanie:**
- Sprawdź format klucza (powinien zaczynać się od `sk-`)
- Upewnij się że ma spacje/białe znaki na początku/końcu
- Sprawdź czy klucz ma saldo/aktywną subskrypcję

### Transkrypcja zawiesza się

**Przyczyna:** Mogą być problemy z siecią lub ze zużyciem API.

**Rozwiązanie:**
- Sprawdź logi w Cloudflare Dashboard → **Logs**
- Sprawdź balans na OpenAI: https://platform.openai.com/account/billing/overview
- Sprawdź balans na OpenRouter: https://openrouter.ai/account

---

## 📚 Dokumentacja

Pełna dokumentacja jest w `CONFIGURATION.md`.

---

## 🔒 Bezpieczeństwo

⚠️ **NIGDY nie commituj `.env.local`** - plik jest w `.gitignore`

✅ **ZAWSZE używaj "Secret"** w Cloudflare - zmienne będą zaszyfrowane

✅ **ROTATE klucze** - jeśli były kiedyś widoczne publicznie

---

## 🚀 Gotowe!

Funkcja nagrywania i transkrypcji powinna teraz działać zarówno lokalnie jak i na Cloudflare.

Jeśli masz problemy, sprawdź:
1. ✅ `.env.local` lokalnie
2. ✅ Environment Variables na Cloudflare
3. ✅ Logi w Cloudflare Dashboard
4. ✅ Balans na OpenAI i OpenRouter

