# Sesja Planistyczna: AI Chat Assistant dla Billzilla

**Data:** 2025-12-22  
**Status:** ✅ Zaimplementowane  
**Typ:** Feature Planning Session

---

## 🎯 Cel główny

Dodać **AI Chat Assistant** do Billzilla, który działa jako **"Financial Analyst"** - pomaga użytkownikom odkrywać insighty i trendy w wydatkach grupowych poprzez naturalną konwersację.

---

## 🤔 Proces decyzyjny

### Pytanie 1: Jakie problemy użytkowników ma rozwiązywać AI chat?

**Rozważane opcje:**

**A. Smart Assistant** - Naturalny interfejs do podstawowych operacji
- Fokus: Dodawanie wydatków i sprawdzanie sald naturalnym językiem
- ➕ Najłatwiejsze do wdrożenia, bezpośrednia wartość
- ➖ Może być "nice to have", nie game-changer

**B. Financial Analyst** - Analiza i insighty ✅ **WYBRANE**
- Fokus: Pomaganie w zrozumieniu wzorców wydatków
- ➕ Przynosi nową wartość, zwiększa engagement
- ➖ Wymaga zaawansowanych query i agregacji

**C. Debt Resolver** - Automatyzacja rozliczeń
- Fokus: Inteligentne zarządzanie długami
- ➕ Rozwiązuje realną frustrację, możliwość monetyzacji
- ➖ Wymaga dostępu do krytycznych operacji, wyższe ryzyko

**Decyzja:** Opcja B - aplikacja ma już dodawanie wydatków głosem, więc AI chat skupi się na analizie i insightach.

---

### Pytanie 2: Jakie dane o grupie AI musi widzieć?

**Rozważane opcje:**

**A. Podstawowy kontekst** - Minimum viable data
- Dane: Lista członków, podstawowe statystyki, salda
- ➕ Minimalny dostęp = większa prywatność
- ➖ Bardzo ograniczone możliwości analizy

**B. Pełna historia z agregacjami** - Rich context ✅ **WYBRANE**
- Dane: Historia transakcji (sumy, daty, opisy), kategorie, zakresy czasowe, waluty
- ➕ Umożliwia zaawansowane analizy, balans prywatność vs funkcjonalność
- ➖ Większa złożoność backendu

**C. Full transparency** - Wszystkie dane
- Dane: Wszystko + pełne opisy, załączniki, historia edycji
- ➕ Maksymalna "inteligencja" AI
- ➖ Duże obawy o prywatność, większe koszty

**Decyzja:** Opcja B - opisy transakcji nie zawierają danych poufnych, więc AI może je widzieć.

**Uwaga:** Billzilla **nie ma jeszcze systemu kategorii** - to może być przyszłe rozszerzenie.

---

### Pytanie 3: Jakie akcje "krytyczne" AI powinno móc wykonywać?

**Rozważane opcje:**

**A. Read-Only Analyst** - Tylko odczyt ✅ **WYBRANE**
- Uprawnienia: Tylko odpowiedzi na pytania, sugestie (bez wykonywania)
- ➕ Zerowe ryzyko, pełne zaufanie użytkowników
- ➖ Mniejsza wartość - użytkownik musi ręcznie wykonać akcje

**B. Assisted Actions** - Operacje z potwierdzeniem
- Uprawnienia: Proponowanie akcji + zatwierdzanie przez usera
- ➕ Best of both worlds - wygoda + kontrola
- ➖ Wymaga UX dla approval flow

**C. Autonomous Agent** - Pełne uprawnienia
- Uprawnienia: Automatyczne modyfikacje metadanych (bez usuwania/zmian kwot)
- ➕ Prawdziwa "magia", oszczędność czasu
- ➖ Duże ryzyko zaufania, wymaga audit log

**Decyzja:** Opcja A na start - tylko rozmowa i podsumowania bez ingerencji w system.

**Uwaga:** Billzilla **nie ma audit logu** - gdybyśmy chcieli w przyszłości dać AI uprawnienia do zapisu, trzeba najpierw to zaimplementować.

---

## ✨ User Stories - MVP

### Epic 1: Podstawowe zapytania o wydatki

#### US-1.1: Sprawdzanie sald między członkami
> **Jako** użytkownik grupy  
> **Chcę** zapytać AI "Ile mi wisi Ania?" lub "Kto komu ile jest winien?"  
> **Aby** szybko poznać bieżący stan rozliczeń bez przeglądania całej listy

**Kryteria akceptacji:**
- [ ] AI rozpoznaje imiona członków grupy
- [ ] Odpowiedź zawiera kwotę i walutę
- [ ] Obsługa pytań o konkretną osobę lub całą grupę

---

#### US-1.2: Podsumowanie wydatków w czasie
> **Jako** użytkownik grupy  
> **Chcę** zapytać "Ile wydaliśmy w grudniu?" lub "Pokaż wydatki z ostatniego tygodnia"  
> **Aby** zobaczyć łączne wydatki w wybranym okresie

**Kryteria akceptacji:**
- [ ] AI rozpoznaje zakresy czasowe (dzień, tydzień, miesiąc, rok, niestandardowy zakres)
- [ ] Odpowiedź zawiera sumę w głównej walucie grupy
- [ ] Opcjonalnie: breakdown per osoba

---

#### US-1.3: Wyszukiwanie konkretnych transakcji
> **Jako** użytkownik grupy  
> **Chcę** zapytać "Pokaż wszystkie wydatki zawierające 'pizza'" lub "Co kupiliśmy wczoraj?"  
> **Aby** szybko znaleźć konkretne transakcje

**Kryteria akceptacji:**
- [ ] AI przeszukuje opisy transakcji
- [ ] Wynik zawiera: datę, kwotę, opis, kto zapłacił
- [ ] Obsługa filtrowania po słowach kluczowych

---

### Epic 2: Analizy i insighty

#### US-2.1: Analiza trendów wydatków
> **Jako** użytkownik grupy  
> **Chcę** zapytać "Czy wydajemy więcej niż w zeszłym miesiącu?" lub "Jaki jest trend naszych wydatków?"  
> **Aby** zrozumieć, czy nasza grupa wydaje rozsądnie

**Kryteria akceptacji:**
- [ ] AI porównuje okresy (obecny vs poprzedni miesiąc/tydzień)
- [ ] Odpowiedź zawiera procentową zmianę
- [ ] Opcjonalnie: sugestie (np. "Wydajecie 20% więcej niż zwykle")

---

#### US-2.2: Top wydatków i statystyki
> **Jako** użytkownik grupy  
> **Chcę** zapytać "Na co wydaliśmy najwięcej?" lub "Jaka była największa transakcja?"  
> **Aby** zobaczyć, gdzie idą nasze pieniądze

**Kryteria akceptacji:**
- [ ] AI zwraca top N wydatków (domyślnie 5)
- [ ] Możliwość filtrowania po okresie
- [ ] Format: ranking z kwotami i opisami

---

#### US-2.3: Analiza zachowań członków
> **Jako** użytkownik grupy  
> **Chcę** zapytać "Kto płaci najczęściej?" lub "Ile wydał Tomek w tym miesiącu?"  
> **Aby** sprawdzić równowagę wkładu w grupie

**Kryteria akceptacji:**
- [ ] AI agreguje dane per osoba
- [ ] Odpowiedź zawiera statystyki: liczba transakcji, suma wydana
- [ ] Możliwość porównania członków

---

#### US-2.4: Podsumowania i raporty
> **Jako** użytkownik grupy  
> **Chcę** zapytać "Podsumuj nasz grudzień" lub "Zrób raport z wakacji"  
> **Aby** otrzymać kompleksowy przegląd wydatków

**Kryteria akceptacji:**
- [ ] AI generuje strukturalny raport (tekst lub JSON dla wizualizacji)
- [ ] Zawiera: suma wydatków, top wydatki, salda, liczba transakcji
- [ ] Możliwość eksportu/share raportu

---

### Epic 3: Konwersacyjny UX

#### US-3.1: Interfejs chatu w aplikacji
> **Jako** użytkownik grupy  
> **Chcę** mieć dostęp do chatu AI z poziomu widoku grupy  
> **Aby** móc zadawać pytania bez opuszczania kontekstu

**Kryteria akceptacji:**
- [ ] Chat widget dostępny na stronie grupy
- [ ] Historia konwersacji zachowana w sesji
- [ ] Responsywny design (mobile + desktop)

---

#### US-3.2: Inteligentne sugestie pytań
> **Jako** użytkownik grupy  
> **Chcę** zobaczyć przykładowe pytania, które mogę zadać AI  
> **Aby** szybko rozpocząć rozmowę bez zastanawiania się

**Kryteria akceptacji:**
- [ ] UI pokazuje 3-5 sugerowanych pytań przy otwieraniu chatu
- [ ] Sugestie dynamiczne (zależą od stanu grupy)
- [ ] Kliknięcie sugestii = wysłanie pytania

---

#### US-3.3: Wielojęzyczność (PL/EN)
> **Jako** użytkownik grupy  
> **Chcę** móc zadawać pytania po polsku i angielsku  
> **Aby** wygodnie korzystać w międzynarodowej grupie

**Kryteria akceptacji:**
- [ ] AI wykrywa język pytania
- [ ] Odpowiada w tym samym języku
- [ ] Obsługa mieszanych formatów (np. kwoty zawsze z walutą)

---

## 📊 Zakres danych (AI Context)

AI będzie miał dostęp do:

- ✅ **Członkowie grupy** (imiona/ID)
- ✅ **Historia transakcji** (kwoty, daty, opisy, waluty)
- ✅ **Salda i długi** (kto komu ile wisi)
- ✅ **Zakresy czasowe** (filtrowanie po datach)
- ✅ **Waluty i kursy wymiany** (dla grup multi-currency)
- ❌ **Kategorie** - brak w systemie (może być przyszłe rozszerzenie)

---

## 🔮 Potencjalne przyszłe rozszerzenia (poza MVP)

### 1. Auto-kategoryzacja wydatków
**Warunki wstępne:** Wprowadzenie systemu kategorii + AI write access (opcja B z pytania 3)

- AI analizuje opisy i przypisuje kategorie automatycznie
- User zatwierdza sugestie przed zapisem
- Benefits: Uporządkowane dane, lepsze analizy

### 2. Predykcje budżetowe
- "Ile wydamy do końca miesiąca przy obecnym tempie?"
- "Czy starczy nam na wyjazd budżet 5000 zł?"
- Wymaga: historyczne dane + ML model predykcyjny

### 3. Smart notifications
- AI proaktywnie informuje: "Ej, ten miesiąc jest droższy o 40%"
- Przypomnienia o niespłaconych długach
- Wymaga: system notyfikacji + scheduler

### 4. Eksport danych i wizualizacje
- Generowanie wykresów (pie chart kategorii, timeline wydatków)
- PDF raporty na końcu miesiąca
- Wymaga: biblioteka do wizualizacji danych

### 5. Integracja z płatnościami
**Warunki wstępne:** Audit log + opcja C z pytania 3 (autonomous agent)

- "Rozlicz wszystkie długi przez BLIK/PayPal"
- Wymaga: integracja z systemami płatności

---

## 🛠️ Wymagania techniczne

### Backend
- **Endpoint:** `POST /api/chat`
- **Model:** `anthropic/claude-3-haiku` (OpenRouter)
- **Koszt:** $0.25/1M input, $1.25/1M output tokens
- **Temperatura:** 0.7
- **Function calling:** 9 funkcji (podstawowe operacje odczytu)
- **Rate limiting:** Do zaimplementowania (planowane: 100 zapytań/grupa/dzień)

### Frontend
- **Chat UI:** React component (prosty interfejs tekstowy)
- **State management:** Historia konwersacji w bazie danych
- **Responsive:** Mobile-first design
- **Streaming:** Nie zaimplementowane (odpowiedzi pełne)

### AI/LLM
- **Provider:** OpenRouter
- **Model:** `anthropic/claude-3-haiku`
- **System prompt:** Prosty asystent finansowy - tylko tekstowe odpowiedzi
- **Function calling:** Strukturalne odpowiedzi (JSON) dla podstawowych danych
- **Wizualizacje:** Brak - tylko tekst

### Bezpieczeństwo
- ✅ **Autoryzacja:** Tylko członkowie grupy mogą chatować o tej grupie
- ✅ **Privacy:** Opt-out z treningu modelu (OpenRouter/Anthropic)
- ✅ **Sanityzacja:** SecurityGuard waliduje wszystkie zapytania
- ✅ **Prompt injection protection:** Wykrywanie prób manipulacji
- ✅ **Function whitelist:** Tylko dozwolone funkcje

---

## ❓ Pytania otwarte do rozważenia

### 1. Monetyzacja
**Pytanie:** Czy chat AI będzie w darmowym planie, czy premium?

**Uwagi:**
- Koszty API LLM mogą być znaczące (zwłaszcza dla dużych grup)
- Możliwe modele:
  - Darmowy plan: 50 zapytań/miesiąc
  - Premium: unlimited
  - Pay-per-use: $0.01 per zapytanie

### 2. Limity użycia
**Pytanie:** Ile zapytań/miesięcznie per grupa?

**Uwagi:**
- Zapobiega nadużyciom i kontroluje koszty
- Sugerowane limity:
  - Free tier: 50/miesiąc
  - Pro tier: 500/miesiąc
  - Enterprise: unlimited

### 3. Privacy Policy
**Pytanie:** Czy poinformować użytkowników, że dane trafiają do zewnętrznego LLM?

**Uwagi:**
- Transparentność buduje zaufanie
- GDPR wymaga zgody na przetwarzanie danych przez third-party
- Możliwe rozwiązanie: Checkbox "Zgadzam się na wysłanie danych do AI" przy pierwszym użyciu

### 4. Fallback strategy
**Pytanie:** Co się dzieje, gdy API LLM jest niedostępne?

**Uwagi:**
- Backup provider (np. Claude jeśli GPT-4 nie działa)
- Graceful degradation: "AI chwilowo niedostępny, spróbuj później"
- Queue system dla zapytań

---

## 📅 Następne kroki

1. **Prototyp system prompt** - Przygotować przykładowy prompt z kontekstem grupy
2. **POC** - Proof of concept z prostym endpointem i testem manualnym
3. **UI mockup** - Zaprojektować interfejs chatu (Figma)
4. **Cost estimation** - Obliczyć koszty API na podstawie założeń użycia
5. **Privacy review** - Konsultacja z prawnikiem nt. GDPR compliance
6. **Technical spec** - Szczegółowa specyfikacja techniczna implementacji

---

## 📝 Notatki z sesji

- Aplikacja ma już **dodawanie wydatków głosem** - dlatego AI skupia się na analizie, nie inputach
- **Brak systemu kategorii** - może być dodane w przyszłości, AI może pomóc w auto-kategoryzacji
- **Brak audit log** - konieczne przed daniem AI uprawnień do zapisu
- Start z **read-only** podejściem minimalizuje ryzyko i buduje zaufanie
- Opisy transakcji **nie zawierają danych poufnych** - bezpieczne dla AI

---

**Dokument przygotowany:** 2025-12-20  
**Następna aktualizacja:** Po fazie prototypowania
