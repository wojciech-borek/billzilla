# UI Design for AI Chat Assistant

**Data:** 2025-12-22  
**Status:** ✅ Zaimplementowane  
**Typ:** UI/UX Design Specification

---

## 🎯 Cel dokumentu

Szczegółowa specyfikacja interfejsu użytkownika dla AI Chat Assistant w Billzilla. Definiuje:
- Sposób wyświetlania potwierdzeń wykonania funkcji (interactive cards)
- Obsługę stanów ładowania podczas komunikacji z API
- Wizualizację danych finansowych wewnątrz czatu (wykresy, listy, karty)
- Architekturę "Smart UI" reagującego na dane z funkcji LLM

Dokument bazuje na [ai-chat-planning-session.md](./ai-chat-planning-session.md) oraz [llm-tools-schema.md](../../architecture/ai-services/llm-tools-schema.md).

---

## 🎨 Filozofia projektowa: Smart UI

### Czym jest Smart UI?

**Smart UI** to interfejs czatu, który:
- **Nie jest tylko tekstem** - wyświetla bogate, interaktywne komponenty
- **Reaguje na type odpowiedzi** - różne typy danych = różne komponenty
- **Umożliwia akcje inline** - użytkownik może kliknąć, rozwinąć, filtrować bez opuszczania czatu
- **Pokazuje proces myślenia AI** - loading states pokazują, co AI aktualnie robi (np. "Analizuję wydatki...")

### Przykład kontrastu:

**❌ Zwykły czat (tylko tekst):**
```
User: Ile wydaliśmy w grudniu?
AI: W grudniu wydaliście łącznie 3450 PLN.
```

**✅ Smart UI:**
```
User: Ile wydaliśmy w grudniu?
AI: [LOADING_CARD: "Analizuję wydatki z grudnia..."]
AI: [SUMMARY_CARD z wykresem, breakdown per członek, przycisk "Zobacz szczegóły"]
```

---

## 📐 Architektura komponentów czatu

### Struktura wiadomości

Każda wiadomość w czacie ma typ (`MessageType`) determinujący jej renderowanie:

```typescript
type MessageType = 
  | 'user_text'           // Zwykły tekst użytkownika
  | 'ai_text'             // Tekst odpowiedzi AI
  | 'ai_function_call'    // AI wywołuje funkcję → pokazujemy co robi
  | 'ai_function_result'  // Rezultat funkcji → renderujemy SmartCard
  | 'ai_error'            // Błąd AI lub API
  | 'system_info';        // Informacje systemowe (np. limity)

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string | object; // string dla text, object dla function results
  timestamp: Date;
  metadata?: {
    functionName?: string;  // nazwa wywołanej funkcji (dla debugowania)
    isLoading?: boolean;    // czy trwa ładowanie
    error?: string;         // komunikat błędu
  };
}
```

---

## 🔄 1. Potwierdzenia wykonania funkcji (Function Call Cards)

### Cel

Gdy AI wywołuje tool (np. `get_member_balances`), użytkownik powinien:
1. **Zobaczyć, że AI coś robi** (loading state)
2. **Otrzymać odpowiedź tekstową** sformatowaną w czytelny sposób (Markdown)

---

### 1.1. Loading State - "AI myśli"

**Kiedy:** AI wywołał funkcję, czekamy na odpowiedź z backendu

**Komponent:** `FunctionCallLoadingCard` (z `ChatMessage`)

**Design:**
Prosty kontener pokazujący, że system przetwarza zapytanie.

```tsx
// Przykładowy wygląd
<div className="bg-primary/5 border-l-4 border-primary rounded-2xl p-4 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
    <p className="font-semibold text-foreground text-sm">
      Sprawdzam dane...
    </p>
  </div>
</div>
```

---

### 1.2. Function Result - Prezentacja wyników

**Zmiana architektury:** Zrezygnowano ze skomplikowanych komponentów "Smart Cards" (wykresów, interaktywnych tabel) na rzecz **prostych, czytelnych odpowiedzi tekstowych** formatowanych Markdownem.

**Zalety:**
- Lżejszy interfejs (brak ciężkich bibliotek wykresów)
- Większa elastyczność (AI decyduje jak najlepiej przedstawić dane)
- Mniej błędów (brak sztywnych mapowań typów)

**Formatowanie:**
AI używa Markdown do strukturyzowania danych:
- **Pogrubienie** dla kwot i nazwisk
- **Listy** dla zestawień transakcji
- **Tabele Markdown** dla prostych zestawień danych

**Przykład:**
```
User: Ile wydaliśmy w grudniu?
AI: W grudniu 2024 łączna suma wydatków to **3 450,00 PLN**.

Oto podział na osoby:
- **Ania**: 1 200,00 PLN
- **Tomek**: 1 450,00 PLN
- **Kasia**: 800,00 PLN
```

---

### 1.3. (Sekcja usunięta - Smart Cards deprecated)

Zrezygnowano z komponentów:
- `BalancesCard`
- `ExpenseSummaryCard`
- `TrendAnalysisCard`
- `ChartCard`

Wszystkie te dane są teraz prezentowane w formie tekstu przez model AI.

#### A. `BalancesCard` - Komu ile wisi?

**Use case:** User pyta: *"Ile mi wisi Ania?"*

**Design:**

```tsx
<div className="bg-card border border-gray-100 rounded-2xl p-5 shadow-sm shadow-gray-100/50">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-foreground text-lg">Salda członków</h3>
    <span className="text-xs text-gray-500">Waluta: PLN</span>
  </div>

  {/* Balance list */}
  <div className="space-y-3">
    {/* Pojedynczy wiersz */}
    <div className="flex items-center justify-between p-3 bg-background rounded-xl hover:bg-gray-50 transition-all">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
          A
        </div>
        <div>
          <p className="font-semibold text-foreground">Ania</p>
          <p className="text-xs text-gray-500">Wisi Tobie</p>
        </div>
      </div>
      
      {/* Amount - RED dla długu */}
      <span className="font-bold text-red-600 text-lg">
        -120,50 PLN
      </span>
    </div>

    {/* Kolejny członek - GREEN dla kredytu */}
    <div className="flex items-center justify-between p-3 bg-background rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-semibold text-secondary">
          T
        </div>
        <div>
          <p className="font-semibold text-foreground">Tomek</p>
          <p className="text-xs text-gray-500">Ty mu wisisz</p>
        </div>
      </div>
      
      <span className="font-bold text-green-600 text-lg">
        +85,00 PLN
      </span>
    </div>
  </div>

  {/* Footer - action button */}
  <button className="mt-4 w-full py-2 text-sm text-primary font-semibold hover:bg-primary/5 rounded-lg transition-all">
    Zobacz szczegóły rozliczeń →
  </button>
</div>
```

**Zasady kolorystyki:**
- ❌ **Czerwony** (`text-red-600`) - użytkownik jest dłużnikiem
- ✅ **Zielony** (`text-green-600`) - użytkownik jest wierzycielem
- ⚪ **Szary** (`text-gray-500`) - saldo = 0

---

#### B. `ExpenseSummaryCard` - Suma wydatków + wykres

**Use case:** User pyta: *"Ile wydaliśmy w grudniu?"*

**Design:**

```tsx
<div className="bg-card border border-gray-100 rounded-2xl p-5 shadow-sm shadow-gray-100/50">
  {/* Header */}
  <div className="mb-4">
    <h3 className="font-bold text-foreground text-lg mb-1">Podsumowanie wydatków</h3>
    <p className="text-sm text-gray-500">1-31 grudnia 2025</p>
  </div>

  {/* Total amount - BIG */}
  <div className="mb-6">
    <p className="text-sm text-gray-500 mb-1">Łączna kwota</p>
    <p className="text-4xl font-bold text-primary">3.450,00 PLN</p>
  </div>

  {/* Mini chart - opcjonalnie */}
  <div className="mb-4 h-32 bg-background rounded-xl p-3">
    {/* Tu będzie mini wykres (chart.js / recharts) */}
    <MiniBarChart data={weeklyBreakdown} />
  </div>

  {/* Breakdown per członek */}
  <div className="border-t border-gray-100 pt-4">
    <p className="text-xs text-gray-500 mb-2 font-semibold">Podział na członków:</p>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">Ania</span>
        <span className="font-semibold">1.200,00 PLN</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">Tomek</span>
        <span className="font-semibold">1.450,00 PLN</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">Kasia</span>
        <span className="font-semibold">800,00 PLN</span>
      </div>
    </div>
  </div>

  {/* Action button */}
  <button className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
    Zobacz wszystkie transakcje
  </button>
</div>
```

---

#### C. `ExpenseListCard` - Lista transakcji

**Use case:** User pyta: *"Pokaż wszystkie wydatki zawierające 'pizza'"*

**Design:**

```tsx
<div className="bg-card border border-gray-100 rounded-2xl p-5 shadow-sm shadow-gray-100/50">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-foreground text-lg">Wyniki wyszukiwania</h3>
    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
      Znaleziono: 4
    </span>
  </div>

  {/* Search keyword badge */}
  <div className="mb-4">
    <span className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1.5 rounded-lg text-sm font-semibold">
      <svg className="w-4 h-4" /* ikona search */ />
      "pizza"
    </span>
  </div>

  {/* Expense list */}
  <div className="space-y-3 max-h-96 overflow-y-auto">
    {/* Single expense */}
    <div className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-foreground">Pizza domowa</p>
        <span className="font-bold text-primary">89,90 PLN</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>📅 15 gru 2025</span>
        <span>👤 Zapłacił: Ania</span>
      </div>
    </div>

    {/* More expenses... */}
  </div>

  {/* Pagination if needed */}
  <div className="mt-4 flex justify-center gap-2">
    <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
      Wczytaj więcej
    </button>
  </div>
</div>
```

---

#### D. `TrendAnalysisCard` - Porównanie okresów

**Use case:** User pyta: *"Czy wydajemy więcej niż w zeszłym miesiącu?"*

**Design:**

```tsx
<div className="bg-card border border-gray-100 rounded-2xl p-5 shadow-sm shadow-gray-100/50">
  {/* Header */}
  <h3 className="font-bold text-foreground text-lg mb-4">Analiza trendów</h3>

  {/* Comparison periods */}
  <div className="grid grid-cols-2 gap-4 mb-6">
    {/* Poprzedni okres */}
    <div className="bg-background rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Listopad 2025</p>
      <p className="text-2xl font-bold text-gray-700">2.890,00 PLN</p>
    </div>

    {/* Obecny okres */}
    <div className="bg-primary/5 border-2 border-primary rounded-xl p-4">
      <p className="text-xs text-primary font-semibold mb-1">Grudzień 2025</p>
      <p className="text-2xl font-bold text-primary">3.450,00 PLN</p>
    </div>
  </div>

  {/* Trend indicator - BIG & VISUAL */}
  <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-4">
    <div className="flex items-center gap-3">
      {/* Arrow icon UP */}
      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" /* arrow up icon */ />
      </div>
      
      <div>
        <p className="text-sm text-gray-600">Wzrost wydatków</p>
        <p className="text-3xl font-bold text-red-600">+19,4%</p>
      </div>
    </div>
  </div>

  {/* AI Insight - natural language */}
  <div className="bg-accent/10 rounded-xl p-4 border border-accent/30">
    <p className="text-sm text-gray-700 leading-relaxed">
      💡 <span className="font-semibold">Insight:</span> Wydajecie o <strong>560 PLN więcej</strong> niż w poprzednim miesiącu. 
      To wzrost o <strong>19,4%</strong>. Największy wpływ miały wydatki na restauracje (+340 PLN).
    </p>
  </div>

  {/* Line chart - optional */}
  <div className="mt-4 h-48 bg-background rounded-xl p-3">
    <MiniLineChart data={monthlyTrend} />
  </div>
</div>
```

**Zasady kolorystyki dla trendów:**
- 📈 **Wzrost** = czerwony background (`bg-red-50`, `border-red-500`)
- 📉 **Spadek** = zielony background (`bg-green-50`, `border-green-500`)
- ➡️ **Bez zmian** = szary (`bg-gray-50`, `border-gray-400`)

---

## ⏳ 2. Obsługa stanów ładowania

### Cel

Użytkownik musi wiedzieć:
1. **Czy AI dostało jego wiadomość** (optimistic update)
2. **Co AI aktualnie robi** (loading states)
3. **Kiedy coś poszło nie tak** (error states)

---

### 2.1. Stan: Wysyłanie wiadomości użytkownika

**Kiedy:** User kliknął "Wyślij" lub Enter

**Komponent:** Wiadomość użytkownika z opacity 0.6 + spinner

```tsx
<div className="flex justify-end mb-4">
  <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-md shadow-sm opacity-60">
    <p className="text-sm">Ile wydaliśmy w grudniu?</p>
    {/* Mini spinner w rogu */}
    <div className="flex justify-end mt-1">
      <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
    </div>
  </div>
</div>
```

**Po potwierdzeniu przez API:** Opacity wraca do 1.0, spinner znika.

---

### 2.2. Stan: AI generuje odpowiedź (bez function calling)

**Kiedy:** AI pisze tekstową odpowiedź (np. wyjaśnienie)

**Komponent:** "AI pisze..." indicator

```tsx
<div className="flex items-start gap-3 mb-4">
  {/* Avatar AI */}
  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
    <span className="text-white font-bold text-sm">AI</span>
  </div>

  {/* Typing indicator */}
  <div className="bg-background border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
</div>
```

---

### 2.3. Stan: AI wywołuje funkcję (function calling)

**Już opisane w sekcji 1.1** - `FunctionCallLoadingCard`

**UX Flow:**

1. User wyśle pytanie ✅
2. AI pokazuje "Rozumiem, sprawdzę to..." (krótki tekst)
3. Pojawia się `FunctionCallLoadingCard` z nazwą funkcji
4. Po otrzymaniu wyniku → card zamienia się w SmartCard (np. `BalancesCard`)

---

### 2.4. Stan: Błąd API lub AI

**Kiedy:** 
- API endpoint zwrócił błąd (404, 500)
- AI nie rozpoznał pytania
- Przekroczony rate limit

**Komponent:** `ErrorCard`

```tsx
<div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
  <div className="flex items-start gap-3">
    {/* Error icon */}
    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-white" /* error icon X */ />
    </div>

    <div className="flex-1">
      <p className="font-semibold text-red-800 mb-1">Nie udało się przetworzyć zapytania</p>
      <p className="text-sm text-red-700">
        Nie znaleziono grupy o podanym ID. Sprawdź, czy masz dostęp do tej grupy.
      </p>

      {/* Retry button */}
      <button className="mt-3 text-sm text-red-600 font-semibold hover:underline">
        Spróbuj ponownie
      </button>
    </div>
  </div>
</div>
```

**Typy błędów i komunikaty:**

| Kod błędu | Komunikat użytkownikowi |
|-----------|-------------------------|
| **400** | "Nie rozumiem tego zapytania. Spróbuj przeformułować pytanie." |
| **401** | "Sesja wygasła. Zaloguj się ponownie." |
| **403** | "Nie masz dostępu do tej grupy." |
| **404** | "Nie znaleziono danych. Sprawdź parametry zapytania." |
| **429** | "Przekroczono limit zapytań (100/dzień). Spróbuj jutro." |
| **500** | "Coś poszło nie tak. Spróbuj ponownie za chwilę." |

---

### 2.5. Stan: Streaming odpowiedzi (opcjonalne, przyszłościowe)

**Jeśli AI używa streaming:**

Odpowiedź pojawia się słowo po słowie (jak ChatGPT).

**Komponent:** Ten sam co normalna wiadomość AI, ale z `opacity transition` + animacja cursor.

```tsx
<div className="bg-background border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
  <p className="text-sm text-foreground">
    {streamedText}<span className="animate-pulse">|</span>
  </p>
</div>
```

---

## 📊 3. Wizualizacja danych finansowych w czacie

### Cel

Dane finansowe są **wizualne** - wykresy, tabele, rankingi są bardziej czytelne niż tekst.

---

### 3.1. Wykresy (`<charts>`)

#### Biblioteka: **Recharts** (recommended dla React + Tailwind)

**Dlaczego Recharts?**
- ✅ Kompatybilny z React + TypeScript
- ✅ Łatwy w customizacji (pasuje do Tailwind)
- ✅ Responsywny out-of-the-box
- ✅ Nieduża biblioteka (~50kb gzipped)

#### Typy wykresów w czacie:

| Typ danych | Wykres | Use case |
|------------|--------|----------|
| **Suma wydatków w czasie** | Line Chart | Trendy miesięczne/tygodniowe |
| **Breakdown per członek** | Bar Chart (horizontal) | "Kto ile wydał?" |
| **Podział wydatków** | Pie Chart | "Na co wydaliśmy?" (gdy będą kategorie) |
| **Top wydatki** | Bar Chart (vertical) | "Największe transakcje" |

---

#### A. `MiniLineChart` - Trend w czasie

**Przykład:** Wydatki ostatnich 7 dni

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: '14.12', amount: 120 },
  { date: '15.12', amount: 89 },
  { date: '16.12', amount: 0 },
  { date: '17.12', amount: 240 },
  { date: '18.12', amount: 65 },
  { date: '19.12', amount: 180 },
  { date: '20.12', amount: 95 },
];

<div className="h-32 w-full">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#fff', 
          border: '1px solid #E5E7EB', 
          borderRadius: '12px',
          fontSize: '12px'
        }} 
      />
      <Line 
        type="monotone" 
        dataKey="amount" 
        stroke="#49A067" // primary color
        strokeWidth={2}
        dot={{ fill: '#49A067', r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

---

#### B. `HorizontalBarChart` - Ranking członków

**Przykład:** Kto ile wydał?

```tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Ania', amount: 1200 },
  { name: 'Tomek', amount: 1450 },
  { name: 'Kasia', amount: 800 },
];

<div className="h-48 w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="horizontal">
      <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#0C2231', fontWeight: 600 }} />
      <Bar dataKey="amount" fill="#49A067" radius={[0, 8, 8, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

### 3.2. Listy i tabele

#### A. `DebtorsList` - Lista dłużników

**Przykład:** "Kto komu ile wisi?"

**Design:** Już opisany w `BalancesCard` (sekcja 1.3.A)

---

#### B. `TopExpensesTable` - Ranking wydatków

```tsx
<div className="overflow-hidden rounded-xl border border-gray-100">
  <table className="w-full">
    <thead className="bg-background">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Opis</th>
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Kwota</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Data</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-500">1</td>
        <td className="px-4 py-3 text-sm font-semibold text-foreground">Hotel - noclegi</td>
        <td className="px-4 py-3 text-sm font-bold text-primary text-right">1.240,00 PLN</td>
        <td className="px-4 py-3 text-sm text-gray-500">12 gru 2025</td>
      </tr>
      {/* More rows... */}
    </tbody>
  </table>
</div>
```

---

### 3.3. Badges i wskaźniki

#### A. `PercentageBadge` - Zmiana procentowa

```tsx
// Wzrost (red)
<span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-sm font-bold">
  <svg className="w-4 h-4" /* arrow up */ />
  +19,4%
</span>

// Spadek (green)
<span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-sm font-bold">
  <svg className="w-4 h-4" /* arrow down */ />
  -12,8%
</span>
```

---

#### B. `CurrencyBadge` - Waluta

```tsx
<span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
  PLN
</span>
```

---

## 🏗️ 4. Architektura Smart UI - Component Mapping System

### Cel

Automatyczne mapowanie **function result → odpowiedni SmartCard component**

---

### 4.1. Config-driven approach

**Plik:** `src/lib/ai/chatComponentMapping.ts`

```typescript
import { BalancesCard } from '@/components/chat/cards/BalancesCard';
import { ExpenseSummaryCard } from '@/components/chat/cards/ExpenseSummaryCard';
import { ExpenseListCard } from '@/components/chat/cards/ExpenseListCard';
// ... other imports

type FunctionName = 
  | 'get_member_balances'
  | 'get_expenses_summary'
  | 'search_expenses'
  | 'analyze_spending_trends'
  | 'get_top_expenses'
  | 'get_member_statistics'
  | 'generate_group_report';

interface ComponentMapping {
  component: React.ComponentType<any>;
  loadingText: string;
  errorFallback?: string;
}

export const CHAT_COMPONENT_MAP: Record<FunctionName, ComponentMapping> = {
  get_member_balances: {
    component: BalancesCard,
    loadingText: 'Sprawdzam salda członków...',
    errorFallback: 'Nie mogę pobrać sald. Spróbuj ponownie.',
  },
  get_expenses_summary: {
    component: ExpenseSummaryCard,
    loadingText: 'Analizuję wydatki z wybranego okresu...',
  },
  search_expenses: {
    component: ExpenseListCard,
    loadingText: 'Szukam transakcji...',
  },
  analyze_spending_trends: {
    component: TrendAnalysisCard,
    loadingText: 'Porównuję okresy i identyfikuję trendy...',
  },
  get_top_expenses: {
    component: TopExpensesCard,
    loadingText: 'Sortuję największe wydatki...',
  },
  get_member_statistics: {
    component: MemberStatsCard,
    loadingText: 'Obliczam statystyki członków...',
  },
  generate_group_report: {
    component: ReportCard,
    loadingText: 'Generuję raport finansowy...',
  },
};
```

---

### 4.2. Renderer komponentu w ChatMessage

**Plik:** `src/components/chat/ChatMessage.tsx`

```tsx
import { CHAT_COMPONENT_MAP } from '@/lib/ai/chatComponentMapping';

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // User message - normal text bubble
  if (message.type === 'user_text') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
          <p className="text-sm">{message.content as string}</p>
        </div>
      </div>
    );
  }

  // AI function call - loading state
  if (message.type === 'ai_function_call' && message.metadata?.isLoading) {
    const functionName = message.metadata.functionName as FunctionName;
    const loadingText = CHAT_COMPONENT_MAP[functionName]?.loadingText || 'Przetwarzam...';

    return (
      <div className="mb-4">
        <FunctionCallLoadingCard functionName={functionName} loadingText={loadingText} />
      </div>
    );
  }

  // AI function result - render SmartCard
  if (message.type === 'ai_function_result') {
    const functionName = message.metadata?.functionName as FunctionName;
    const mapping = CHAT_COMPONENT_MAP[functionName];

    if (!mapping) {
      // Fallback - render JSON
      return (
        <div className="mb-4 bg-gray-50 p-4 rounded-xl">
          <pre className="text-xs overflow-x-auto">{JSON.stringify(message.content, null, 2)}</pre>
        </div>
      );
    }

    const SmartCardComponent = mapping.component;
    return (
      <div className="mb-4">
        <SmartCardComponent data={message.content} />
      </div>
    );
  }

  // AI text response
  if (message.type === 'ai_text') {
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <div className="bg-background border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
          <p className="text-sm text-foreground leading-relaxed">{message.content as string}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (message.type === 'ai_error') {
    return <ErrorCard error={message.metadata?.error || 'Nieznany błąd'} />;
  }

  return null;
}
```

---

## 🎭 5. Przykładowy przepływ UX (User Flow)

### Scenariusz: User pyta "Ile wydaliśmy w grudniu?"

**Krok po kroku:**

1. **User wpisuje pytanie** i klika Enter
   - Wiadomość użytkownika pojawia się z opacity 0.6 + spinner

2. **Backend wysyła do AI** (GPT-4 / Claude)
   - Wiadomość użytkownika zmienia się na opacity 1.0 (potwierdzenie)

3. **AI rozpoznaje intent** → "User chce podsumowanie wydatków"
   - AI wywołuje tool: `get_expenses_summary` z parametrami:
     ```json
     {
       "group_id": "550e8400-...",
       "start_date": "2025-12-01",
       "end_date": "2025-12-31",
       "include_member_breakdown": true
     }
     ```

4. **Frontend dostaje event:** `function_call`
   - Pojawia się `FunctionCallLoadingCard`:
     > 🔄 "Analizuję wydatki z wybranego okresu..."
     > Funkcja: `get_expenses_summary`

5. **Backend wywołuje API endpoint:** `POST /api/groups/[groupId]/expenses/summary`
   - Status: loading (3-5 sekund typowo)

6. **API zwraca dane:**
   ```json
   {
     "total_amount": 3450.00,
     "currency": "PLN",
     "period": { "start": "2025-12-01", "end": "2025-12-31" },
     "member_breakdown": [
       { "name": "Ania", "amount": 1200.00 },
       { "name": "Tomek", "amount": 1450.00 },
       { "name": "Kasia", "amount": 800.00 }
     ]
   }
   ```

7. **Frontend dostaje event:** `function_result`
   - `FunctionCallLoadingCard` znika
   - Pojawia się `ExpenseSummaryCard` z danymi (patrz sekcja 1.3.B)

8. **AI generuje naturalną odpowiedź** (opcjonalnie):
   > "W grudniu wydaliście łącznie **3.450 PLN**. Najwięcej zapłacił Tomek (1.450 PLN). 
   > Szczegóły widzisz w karcie powyżej. 📊"

9. **User może interagować:**
   - Kliknąć "Zobacz wszystkie transakcje" → navigacja do listy
   - Zadać follow-up: "A kto komu ile wisi?"

---

## 🛠️ 6. Stack technologiczny - Rekomendacje

### Frontend Components

```typescript
// Core chat infrastructure
- React 18+ (już używane w Billzilla)
- TypeScript (strict mode)
- Tailwind CSS v4 (już skonfigurowane)

// UI Components
- Shadcn/UI (już używane) - dla Button, Card, Dialog etc.
- Recharts / Chart.js - dla wykresów
- date-fns - parsowanie dat (już jest w projekcie?)

// State management
- Zustand lub Context API - dla chat state
- React Query - dla API calls (już używane w projekcie?)

// Real-time
- Server-Sent Events (SSE) - dla streaming odpowiedzi AI
  ALBO
- WebSocket - jeśli potrzeba bi-directional communication
```

### Backend Requirements

```typescript
// API Endpoints (Next.js API Routes)
- POST /api/groups/[groupId]/chat
  Body: { message: string, conversationId?: string }
  Response: { reply: string, functionCalls?: [...] }

- GET /api/groups/[groupId]/chat/[conversationId]
  Response: { messages: ChatMessage[] }

// LLM Integration
- OpenRouter client (już zaplanowane w arch docs)
- Function calling handler
- Context builder (agregacja danych grupy do system prompt)

// Rate limiting
- Redis cache dla limitów per grupa
- Middleware dla Next.js API routes
```

---

## 📏 7. Standardy UI/UX - Do's and Don'ts

### ✅ DO's

- **Zawsze pokazuj loading state** - użytkownik musi wiedzieć, że coś się dzieje
- **Używaj kolorów semantycznych:**
  - Czerwony = długi, wzrost wydatków (zły)
  - Zielony = kredyt, spadek wydatków (dobry)
  - Primary (#49A067) = akcje, główne kwoty
- **Karty zamiast tekstu** - dla structured data używaj SmartCard
- **Responsywność** - wszystkie komponenty działają na mobile (min-width: 320px)
- **Mikroanimacje** - transitions na hover, loading spinners
- **Accessibility:**
  - ARIA labels dla ikon
  - Keyboard navigation w czacie (Tab, Enter, Escape)
  - Screen reader friendly (semantic HTML)

---

### ❌ DON'Ts

- **Nie pokazuj surowego JSON** użytkownikowi (tylko w dev mode)
- **Nie używaj generycznych loading**ów - zawsze kontekstowy tekst ("Sprawdzam salda...")
- **Nie przeciążaj kart** - maksymalnie 3-4 elementy danych w single card view
- **Nie mieszaj metryk** - jeśli screen pokazuje PLN, wszystko w PLN
- **Nie ukrywaj błędów** - jasny komunikat + sugestia co zrobić

---

## 🎨 8. Przykładowy layout czatu (Mobile + Desktop)

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────┐
│ Header: "AI Financial Analyst - Wakacje Grecja"    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [USER BUBBLE]                    "Ile wydaliśmy?" │
│                                                     │
│  AI   [LOADING CARD]                                │
│      "Analizuję wydatki..."                        │
│                                                     │
│  AI   [SMART CARD: ExpenseSummaryCard]             │
│      ┌────────────────────────────────┐            │
│      │  Podsumowanie wydatków         │            │
│      │  3.450,00 PLN                  │            │
│      │  [mini chart]                  │            │
│      │  Breakdown: Ania 1200, ...     │            │
│      └────────────────────────────────┘            │
│                                                     │
│  [USER BUBBLE]                "A kto mi wisi?"      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Input field: "Zadaj pytanie..."]        [SEND]   │
└─────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌───────────────────────┐
│ ☰  AI Chat      ✕     │
├───────────────────────┤
│                       │
│      "Ile wydaliśmy?" │
│  [USER BUBBLE]        │
│                       │
│  AI [LOADING...]      │
│                       │
│  AI [CARD - stacked]  │
│  ┌─────────────────┐  │
│  │ Summary         │  │
│  │ 3.450 PLN       │  │
│  │ [chart]         │  │
│  └─────────────────┘  │
│                       │
│      "Kto mi wisi?"   │
│  [USER BUBBLE]        │
│                       │
├───────────────────────┤
│ [Input]        [SEND] │
└───────────────────────┘
```

---

## 📦 9. Struktura plików (sugestia)

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx          # Main chat wrapper
│   │   ├── ChatMessage.tsx            # Renderer for single message
│   │   ├── ChatInput.tsx              # Input field + send button
│   │   ├── ChatHeader.tsx             # Header z nazwą grupy
│   │   ├── cards/                     # SmartCard components
│   │   │   ├── BalancesCard.tsx
│   │   │   ├── ExpenseSummaryCard.tsx
│   │   │   ├── ExpenseListCard.tsx
│   │   │   ├── TrendAnalysisCard.tsx
│   │   │   ├── TopExpensesCard.tsx
│   │   │   ├── MemberStatsCard.tsx
│   │   │   └── ReportCard.tsx
│   │   ├── loading/
│   │   │   ├── FunctionCallLoadingCard.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── MessageSkeleton.tsx
│   │   ├── errors/
│   │   │   ├── ErrorCard.tsx
│   │   │   └── RateLimitWarning.tsx
│   │   └── charts/
│   │       ├── MiniLineChart.tsx
│   │       ├── HorizontalBarChart.tsx
│   │       └── MiniBarChart.tsx
│   │
├── lib/
│   ├── ai/
│   │   ├── chatComponentMapping.ts    # Function → Component mapping
│   │   ├── chatTypes.ts               # TypeScript types for chat
│   │   └── chatUtils.ts               # Helper functions
│   │
└── pages/
    └── api/
        └── groups/
            └── [groupId]/
                └── chat.ts            # Chat API endpoint
```

---

## 🚀 10. Priorytety implementacji (MVP)

### Phase 1: Core Chat Infrastructure (MVP)
- [ ] `ChatContainer` + `ChatMessage` + `ChatInput`
- [ ] Basic message types: `user_text`, `ai_text`
- [ ] Loading states: `TypingIndicator`, basic spinner
- [ ] Error handling: `ErrorCard`
- [ ] API endpoint: `POST /api/groups/[groupId]/chat`

### Phase 2: Function Calling + Loading States
- [ ] `FunctionCallLoadingCard` z dynamic text
- [ ] Component mapping system (`chatComponentMapping.ts`)
- [ ] Function result handling

### Phase 3: SmartCards (High Priority)
- [ ] `BalancesCard` (US-1.1)
- [ ] `ExpenseSummaryCard` (US-1.2)
- [ ] `ExpenseListCard` (US-1.3)

### Phase 4: SmartCards (Analytics)
- [ ] `TrendAnalysisCard` (US-2.1)
- [ ] `TopExpensesCard` (US-2.2)
- [ ] `MemberStatsCard` (US-2.3)

### Phase 5: Advanced Features
- [ ] Charts integration (Recharts)
- [ ] `ReportCard` z downloadable PDF
- [ ] Streaming responses (SSE)
- [ ] Chat history persistence

---

## 📝 Dodatkowe uwagi

### Multi-język (PL/EN)

**Podejście:** Ponieważ aplikacja nie ma systemu tłumaczeń (i18n), wielojęzyczność realizujemy przez:

1. **AI automatycznie wykrywa język** użytkownika (już zaplanowane w US-3.3)
2. **Komponenty UI pozostają w domyślnym języku** (polski)
3. **Opcjonalnie:** Proste translations object dla najważniejszych tekstów UI

```typescript
// src/lib/ai/chatTexts.ts
// Prosty obiekt z tekstami - bez zależności od i18n
export const CHAT_TEXTS = {
  loadingStates: {
    get_member_balances: 'Sprawdzam salda członków...',
    get_expenses_summary: 'Analizuję wydatki z wybranego okresu...',
    search_expenses: 'Szukam transakcji...',
    analyze_spending_trends: 'Porównuję okresy i identyfikuję trendy...',
    get_top_expenses: 'Sortuję największe wydatki...',
    get_member_statistics: 'Obliczam statystyki członków...',
    generate_group_report: 'Generuję raport finansowy...',
  },
  errors: {
    400: 'Nie rozumiem tego zapytania. Spróbuj przeformułować pytanie.',
    401: 'Sesja wygasła. Zaloguj się ponownie.',
    403: 'Nie masz dostępu do tej grupy.',
    404: 'Nie znaleziono danych. Sprawdź parametry zapytania.',
    429: 'Przekroczono limit zapytań (100/dzień). Spróbuj jutro.',
    500: 'Coś poszło nie tak. Spróbuj ponownie za chwilę.',
  },
};
```

### Performance

- **Lazy load SmartCards** - używać React.lazy() dla cards
- **Virtualized chat** - dla długich konwersacji (react-window)
- **Debounce input** - nie wysyłać na każdym keystroke
- **Cache function results** - jeśli user pyta 2x o to samo

---

## 🔗 Powiązane dokumenty

- [AI Chat Planning Session](./ai-chat-planning-session.md) - Product requirements
- [LLM Tools Schema](../../architecture/ai-services/llm-tools-schema.md) - Backend function definitions
- [Billzilla UI Guidelines](../../../.cursor/rules/bllzilla-ui-guidelines.md) - Design system

---

**Dokument przygotowany:** 2025-12-20  
**Autor:** UI/UX Design Team  
**Status:** Draft - gotowe do review  
**Następne kroki:** Review z zespołem → Implementation plan → Prototypowanie
