# AI Chat - Aktualna Architektura

**Data:** 2025-12-22  
**Status:** ✅ Wdrożone

## Uproszczona architektura

### Model
- **Claude-3-Haiku** via OpenRouter
- Szybki, tani, wystarczający do analizy tekstu

### UI
- **Text-only** - brak wizualnych komponentów (MetricCard, ChartCard, DataTableCard)
- AI formatuje dane używając Markdown
- Loading states pokazują status przetwarzania

### Typy wiadomości
```typescript
type MessageType = 
  | 'user_text'          // Wiadomość użytkownika
  | 'ai_text'            // Odpowiedź AI (sformatowana tekstem)
  | 'ai_function_call'   // Loading state podczas wykonywania funkcji
  | 'ai_error'           // Błędy
  | 'system_info';       // Info systemowe
```

**Usunięto:** `ai_function_result` - wyniki funkcji NIE są zapisywane do bazy, tylko wysyłane do LLM.

### Komponenty
```
src/components/chat/
  ├── ChatButton.tsx              # FAB przycisk
  ├── ChatContainer.tsx           # Główny kontener
  ├── ChatInput.tsx               # Input użytkownika  
  ├── ChatMessage.tsx             # Renderer wiadomości
  ├── loading/
  │   ├── FunctionCallLoadingCard.tsx  # "Szukam danych..."
  │   └── TypingIndicator.tsx          # "AI pisze..."
  └── errors/
      └── ErrorCard.tsx           # Wyświetlanie błędów
```

### Kluczowe pliki
```
src/lib/ai/
  ├── chatComponentMapping.ts  # Mapowanie funkcji → teksty ładowania
  ├── chatTexts.ts            # Teksty UI
  ├── chatTypes.ts            # TypeScript types
  └── chatUtils.ts            # Utility functions

src/lib/services/ai/
  ├── ChatService.ts          # Orchestrator chatu
  └── FunctionExecutor.ts     # Wykonywanie funkcji LLM

src/lib/services/security/
  └── SecurityGuard.ts        # Ochrona przed prompt injection
```

### Flow
1. User → wiadomość
2. Security check (prompt injection)
3. LLM wywołuje funkcję → pokazujemy loading
4. Wykonujemy funkcję → wynik do LLM
5. LLM formatuje wynik jako tekst → zwracamy user

## Kluczowe zasady
- ✅ AI **tylko czyta** dane (nie modyfikuje)
- ✅ Wszystkie wyniki jako **tekst** (brak JSON cards)
- ✅ Wyniki funkcji **nie zapisywane** do bazy
- ✅ Maksymalna **prostota** kodu
