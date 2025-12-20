# Dokumentacja Techniczna Billzilla

Folder `.ai` zawiera dokumentację techniczną, plany implementacyjne i specyfikacje dla projektu Billzilla.

## Struktura folderów

### 📁 `architecture/`
Dokumenty opisujące architekturę systemu:
- `ai-services/` - plany implementacji usług AI
  - `llm-tools-schema.md` - schemat narzędzi (tools) dla LLM w standardzie OpenAI/OpenRouter
  - `backend-function-calling-architecture.md` - architektura backendu dla Function Calling (OpenRouter), zabezpieczenia, baza danych
- `api/` - specyfikacja API REST
- `database/` - plany bazy danych
- `frontend/` - wybór technologii frontend

### 📁 `deprecated/`
Zarchiwizowane dokumenty:
- `archived/` - zakończone projekty implementacyjne
- `old-plans/` - stare plany i specyfikacje, które zostały zaimplementowane

### 📁 `diagrams/`
Diagramy i schematy przepływów:
- `architecture/` - diagramy architektury
- `auth/` - przepływy autentyfikacji
- `user-flow.md` - główny przepływ użytkownika
- `voice-expense-flow.md` - przepływ dodawania wydatków głosowych

### 📁 `implementation/`
Aktywne plany implementacyjne:
- `api/` - plany implementacji endpointów API
- `ui/` - plany implementacji interfejsów użytkownika

### 📁 `planning/`
Dokumenty planistyczne:
- `features/` - plany niezaimplementowanych funkcji i szablony GitHub Issues
- `product/prd.md` - Product Requirements Document
- `product/refactor-plan.md` - plan refaktoryzacji
- `product/pending-features.md` - szczegółowe specyfikacje funkcji do implementacji
- `product/ai-chat-planning-session.md` - sesja planistyczna dla AI Chat Assistant
- `product/ai-chat-ui-design.md` - szczegółowa specyfikacja UI/UX dla czatu AI (Smart UI)

### 📁 `security/`
Dokumenty bezpieczeństwa:
- `auth/auth-spec.md` - specyfikacja systemu autentyfikacji

### 📁 `testing/`
Dokumenty testowania:
- `plans/test-plan.md` - ogólny plan testowania
- `unit/` - specyfikacje testów jednostkowych (tylko dla niezaimplementowanych jeszcze funkcji)

## Zasady zarządzania dokumentacją

1. **Status dokumentów**: Dokumenty implementacyjne powinny zawierać status (np. "Status: Zaimplementowane ✅")
2. **Archiwizacja**: Zakończone projekty przenosić do `deprecated/archived/`
3. **Czyszczenie**: Zaimplementowane specyfikacje testów przenosić do `deprecated/old-plans/`
4. **Regularne przeglądy**: Co 1-2 miesiące sprawdzać status dokumentów

## Aktualny status

- ✅ Zarchiwizowane: projekt poprawy prywatności zaproszeń
- ✅ Przeniesione: zaimplementowane specyfikacje testów jednostkowych
- 🔄 Aktywne: plany refaktoryzacji, nowe funkcje
