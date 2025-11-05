# 🚀 Checklist Setup'u - Nagrywanie Głosu

## ✅ Co Zostało Zrobione

- [x] Naprawiona konfiguracja zmiennych środowiskowych
- [x] Zmieniono na `astro:env` (bezpieczny system Astro 5)
- [x] Zniesiono linting errors
- [x] Dodana pełna dokumentacja
- [x] Kod jest teraz type-safe

## 📝 Co Musisz Zrobić

### Krok 1: Lokalnie (Development)

- [ ] Utwórz plik `.env.local` w głównym katalogu projektu
- [ ] Dodaj do `.env.local`:
  ```
  OPENAI_API_KEY=sk-... (z https://platform.openai.com/api-keys)
  OPENROUTER_API_KEY=sk-or-... (z https://openrouter.ai/settings/keys)
  PUBLIC_SUPABASE_URL=... (z twojego Supabase)
  PUBLIC_SUPABASE_ANON_KEY=... (z twojego Supabase)
  ```
- [ ] Uruchom `npm run dev`
- [ ] Przetestuj funkcję nagrywania głosu

### Krok 2: Cloudflare (Production)

- [ ] Otwórz Cloudflare Dashboard
- [ ] Przejdź do **Pages** → Twoja Aplikacja
- [ ] Przejdź do **Settings** → **Environment Variables**
- [ ] Kliknij **Add Variable** i dodaj (jako **Secret**):
  - [ ] `OPENAI_API_KEY=sk-...`
  - [ ] `OPENROUTER_API_KEY=sk-or-...`
- [ ] Upewnij się że są typu **Secret** (nie Public!)
- [ ] Uruchom `npm run build` na lokalnym komputerze
- [ ] Deploy do Cloudflare
- [ ] Przetestuj funkcję nagrywania głosu na Cloudflare

---

## 🧪 Testy

### Po Setup'ie Lokalnym

Uruchom:
```bash
npm run dev
```

Przejdź do aplikacji i:
1. Zaloguj się
2. Wejdź do grupy
3. Kliknij przycisk mikrofonu
4. Powiedz coś jak "Pizza 50 złotych dla siebie"
5. Sprawdź czy transkrypcja i wydatek został dodany

**Oczekiwany wynik:** ✅ Wydatek dodany z transkrypcją

### Po Deploy'u na Cloudflare

Przejdź do URL Cloudflare i:
1. Zaloguj się
2. Wejdź do grupy
3. Kliknij przycisk mikrofonu
4. Powiedz coś jak "Pizza 50 złotych dla siebie"
5. Sprawdź czy transkrypcja i wydatek został dodany

**Oczekiwany wynik:** ✅ Wydatek dodany z transkrypcją

---

## 🐛 Jeśli Coś Nie Działa

### Lokalnie

- [ ] Sprawdzić czy `.env.local` istnieje
- [ ] Sprawdzić czy `.env.local` zawiera wszystkie wymagane zmienne
- [ ] Sprawdzić czy dev server został uruchomiony (`npm run dev`)
- [ ] Sprawdzić czy klucze API są poprawne (bez spacji)
- [ ] Sprawdzić czy masz saldo na OpenAI i OpenRouter
- [ ] Sprawdzić konsolę przeglądarki pod kątem błędów

### Na Cloudflare

- [ ] Sprawdzić czy zmienne są w **Settings** → **Environment Variables**
- [ ] Sprawdzić czy zmienne są typu **Secret** (nie Public)
- [ ] Sprawdzić czy aplikacja została redeploy'na po dodaniu zmiennych
- [ ] Sprawdzić Cloudflare Logs w dashboard
- [ ] Sprawdzić czy klucze API są poprawne
- [ ] Sprawdzić czy masz saldo na OpenAI i OpenRouter

---

## 📚 Dokumentacja

- **CONFIGURATION.md** - Szczegółowa dokumentacja
- **VOICE_TRANSCRIPTION_SETUP.md** - Instrukcja setup'u
- **IMPLEMENTATION_SUMMARY.md** - Techniczne szczegóły zmian
- **SETUP_CHECKLIST.md** - Ten plik

---

## 📞 Wsparcie

Jeśli masz problemy:
1. Przeczytaj CONFIGURATION.md - sekcja Troubleshooting
2. Sprawdzić logi Cloudflare (jeśli błąd na Cloudflare)
3. Sprawdzić konsolę przeglądarki (F12)

---

## ✨ Gotowe!

Po przejściu przez ten checklist, funkcja nagrywania głosu powinna działać poprawnie zarówno lokalnie jak i na Cloudflare.

**Powodzenia!** 🎉

