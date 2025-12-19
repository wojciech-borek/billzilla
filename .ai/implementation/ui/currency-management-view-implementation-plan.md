# Plan implementacji widoku Zarządzania Walutami Grupy

## 1. Przegląd

Widok zarządzania walutami grupy umożliwia twórcy grupy dodawanie, edytowanie i usuwanie dodatkowych walut wraz z ich kursami wymiany względem waluty bazowej grupy. Każda grupa posiada jedną walutę bazową (zdefiniowaną przy tworzeniu grupy) oraz może mieć wiele dodatkowych walut z niestandardowymi kursami wymiany przechowywanymi w tabeli `group_currencies`. Funkcjonalność ta jest kluczowa, ponieważ użytkownicy mogą tworzyć wydatki w różnych walutach, a system automatycznie przelicza je na walutę bazową według zdefiniowanych kursów.

## 2. Routing widoku

Widok będzie dostępny jako modal/dialog otwierany z poziomu ustawień grupy. Nie wymaga osobnej ścieżki routingu - będzie to komponent modalny zintegrowany z `GroupSettingsCards.tsx`.

**Lokalizacja w kodzie:**
- Plik: `src/components/group/GroupSettingsCards.tsx` (linie 22-24)
- Trigger: Przycisk "Zarządzaj walutami" w sekcji ustawień grupy

## 3. Struktura komponentów

```
AddCurrencyDialog (modal z formularzem dodawania)
└── AddCurrencyForm (formularz dodawania waluty)
    ├── CurrencySearchCombobox (wyszukiwarka walut)
    └── ExchangeRateInput (pole kursu wymiany)

CurrencyListCard (karta w GroupSettingsCards - już istniejąca)
└── CurrencyListItem (pojedynczy element listy)
    ├── CurrencyInfo (informacje o walucie)
    ├── EditRateDialog (dialog edycji kursu)
    └── RemoveCurrencyDialog (dialog potwierdzenia usunięcia)
```

**Uwaga:** Lista walut (`CurrencyListCard`) jest już wyświetlana w `GroupSettingsCards`, więc modal zawiera **tylko formularz dodawania** nowej waluty.

## 4. Szczegóły komponentów

### AddCurrencyDialog

**Opis komponentu:**
Modal z formularzem dodawania nowej waluty do grupy. Prosty dialog zawierający tylko formularz - lista walut jest już widoczna w `GroupSettingsCards`, więc nie ma potrzeby jej duplikowania w modalu.

**Główne elementy:**
- `Dialog` (z shadcn/ui) - kontener modalny
- `DialogHeader` z tytułem "Dodaj walutę"
- `DialogDescription` z wyjaśnieniem funkcjonalności
- `AddCurrencyForm` - formularz dodawania
- `DialogFooter` z przyciskami akcji

**Obsługiwane interakcje:**
- Otwieranie/zamykanie modalu
- Automatyczne zamknięcie po dodaniu waluty

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik jest twórcą grupy (tylko twórca może dodawać waluty)

**Typy:**
- `AddCurrencyDialogProps`
- `GroupCurrencyDTO` (z types.ts)
- `CurrencyDTO` (z types.ts)

**Propsy:**
```typescript
interface AddCurrencyDialogProps {
  groupId: string;
  baseCurrencyCode: string;
  existingCurrencies: string[]; // kody już dodanych walut
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
}
```

### CurrencySearchCombobox

**Opis komponentu:**
Komponent wyszukiwarki walut z funkcją autocomplete. Wyświetla listę dostępnych walut z globalnej tabeli `currencies`, filtrując te, które już zostały dodane do grupy. Popularne waluty (USD, EUR, GBP, CHF) są wyświetlane na górze listy.

**Główne elementy:**
- `Combobox` (z shadcn/ui)
- `Command` do obsługi wyszukiwania
- `CommandInput` - pole wyszukiwania
- `CommandList` - lista wyników
- `CommandGroup` dla popularnych walut
- `CommandGroup` dla pozostałych walut

**Obsługiwane interakcje:**
- Wpisywanie tekstu do wyszukiwania (filtrowanie po kodzie i nazwie waluty)
- Wybór waluty z listy
- Nawigacja klawiaturą (strzałki, Enter)

**Obsługiwana walidacja:**
- Filtrowanie walut już dodanych do grupy
- Filtrowanie waluty bazowej (nie można jej dodać ponownie)

**Typy:**
- `CurrencySearchComboboxProps`
- `CurrencyDTO[]` (lista dostępnych walut)

**Propsy:**
```typescript
interface CurrencySearchComboboxProps {
  availableCurrencies: CurrencyDTO[];
  selectedCurrency: string | null;
  onSelectCurrency: (currencyCode: string) => void;
  excludeCurrencies: string[]; // kody walut do wykluczenia
}
```

### ExchangeRateInput

**Opis komponentu:**
Pole numeryczne do wprowadzania kursu wymiany waluty. Wyświetla pomocniczą informację o jednostce kursu (np. "1 EUR = X PLN").

**Główne elementy:**
- `Label` z opisem pola
- `Input` typu number
- Tekst pomocniczy z jednostką kursu
- Przykład użycia

**Obsługiwane interakcje:**
- Wprowadzanie wartości numerycznej
- Walidacja w czasie rzeczywistym

**Obsługiwana walidacja:**
- Wartość musi być > 0
- Maksymalnie 4 miejsca po przecinku
- Format: 0.0001 - 9999.9999

**Typy:**
- `ExchangeRateInputProps`

**Propsy:**
```typescript
interface ExchangeRateInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedCurrency: string | null;
  baseCurrency: string;
  error?: string;
}
```

### AddCurrencyForm

**Opis komponentu:**
Formularz dodawania nowej waluty do grupy. Zawiera wyszukiwarkę walut i pole kursu wymiany. Po wypełnieniu obu pól aktywuje się przycisk dodawania.

**Główne elementy:**
- `Form` (z react-hook-form)
- `CurrencySearchCombobox`
- `ExchangeRateInput`
- Przycisk "Dodaj walutę"
- Alert z błędem (jeśli wystąpi)

**Obsługiwane interakcje:**
- Wybór waluty z combobox
- Wprowadzenie kursu wymiany
- Kliknięcie przycisku dodawania
- Resetowanie formularza po dodaniu

**Obsługiwana walidacja:**
- Waluta musi być wybrana
- Kurs wymiany musi być > 0 i mieć max 4 miejsca po przecinku
- Waluta nie może być już dodana do grupy
- Waluta nie może być walutą bazową

**Typy:**
- `AddCurrencyFormProps`
- `AddCurrencyFormData`
- `AddCurrencyCommand` (z types.ts)

**Propsy:**
```typescript
interface AddCurrencyFormProps {
  groupId: string;
  baseCurrency: string;
  existingCurrencies: string[]; // kody już dodanych walut
  onSuccess: () => void;
}

interface AddCurrencyFormData {
  currency_code: string;
  exchange_rate: number;
}
```

### CurrencyListCard (w GroupSettingsCards)

**Opis komponentu:**
Karta wyświetlająca listę wszystkich walut dodanych do grupy, w tym waluty bazowej. Każda waluta wyświetla kod, nazwę, kurs wymiany oraz akcje (edycja/usunięcie). Waluta bazowa ma kurs 1.0 i jest oznaczona jako "Bazowa".

**Lokalizacja:** Komponent będzie częścią `GroupSettingsCards.tsx`, nie modalu.

**Główne elementy:**
- Nagłówek karty z tytułem "Waluty" i przyciskiem "Dodaj walutę"
- Kontener listy (scrollable)
- Iteracja po `currencies` renderująca `CurrencyListItem`
- Stan pusty gdy brak dodatkowych walut

**Obsługiwane interakcje:**
- Wyświetlanie listy walut
- Kliknięcie przycisku "Dodaj walutę" otwiera `AddCurrencyDialog`
- Przekazywanie akcji edycji/usunięcia do elementów listy

**Obsługiwana walidacja:**
- Brak (walidacja odbywa się w elementach potomnych)

**Typy:**
- `CurrencyListCardProps`
- `GroupCurrencyDTO[]`

**Propsy:**
```typescript
interface CurrencyListCardProps {
  groupId: string;
  currencies: GroupCurrencyDTO[];
  baseCurrency: string;
  onEditRate: (currencyCode: string, newRate: number) => void;
  onRemove: (currencyCode: string) => void;
  isCreator: boolean;
  isLoading?: boolean;
}
```

### CurrencyListItem (w GroupSettingsCards)

**Opis komponentu:**
Pojedynczy element listy walut. Wyświetla informacje o walucie (kod, nazwa, kurs) oraz przyciski akcji (edycja kursu, usunięcie). Dla waluty bazowej przyciski akcji są ukryte.

**Główne elementy:**
- Kontener elementu listy (Card lub div z border)
- Sekcja z informacjami o walucie (kod, nazwa)
- Wyświetlanie kursu: "1 [CURRENCY] = X [BASE_CURRENCY]"
- `Badge` "Bazowa" dla waluty bazowej
- Przyciski akcji (edycja, usunięcie)

**Obsługiwane interakcje:**
- Kliknięcie przycisku edycji - otwiera `EditRateDialog`
- Kliknięcie przycisku usunięcia - otwiera `RemoveCurrencyDialog`

**Obsługiwana walidacja:**
- Ukrycie przycisków akcji dla waluty bazowej
- Walidacja czy waluta jest używana w wydatkach (przed usunięciem)

**Typy:**
- `CurrencyListItemProps`
- `GroupCurrencyDTO`

**Propsy:**
```typescript
interface CurrencyListItemProps {
  currency: GroupCurrencyDTO;
  isBaseCurrency: boolean;
  baseCurrencyCode: string;
  onEditRate: (currencyCode: string, newRate: number) => void;
  onRemove: (currencyCode: string) => void;
}
```


## 5. Typy

### Nowe typy ViewModelu

```typescript
// src/components/group/currencies/types.ts

/**
 * Props dla dialogu dodawania waluty
 */
export interface AddCurrencyDialogProps {
  groupId: string;
  baseCurrencyCode: string;
  existingCurrencies: string[];
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
}

/**
 * Props dla wyszukiwarki walut
 */
export interface CurrencySearchComboboxProps {
  availableCurrencies: CurrencyDTO[];
  selectedCurrency: string | null;
  onSelectCurrency: (currencyCode: string) => void;
  excludeCurrencies: string[];
}

/**
 * Props dla pola kursu wymiany
 */
export interface ExchangeRateInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedCurrency: string | null;
  baseCurrency: string;
  error?: string;
}

/**
 * Props dla karty listy walut (w GroupSettingsCards)
 */
export interface CurrencyListCardProps {
  groupId: string;
  currencies: GroupCurrencyDTO[];
  baseCurrency: string;
  onEditRate: (currencyCode: string, newRate: number) => void;
  onRemove: (currencyCode: string) => void;
  isCreator: boolean;
  isLoading?: boolean;
}

/**
 * Props dla elementu listy walut
 */
export interface CurrencyListItemProps {
  currency: GroupCurrencyDTO;
  isBaseCurrency: boolean;
  baseCurrencyCode: string;
  onEditRate: (currencyCode: string, newRate: number) => void;
  onRemove: (currencyCode: string) => void;
}

/**
 * Props dla formularza dodawania waluty
 */
export interface AddCurrencyFormProps {
  groupId: string;
  baseCurrency: string;
  existingCurrencies: string[];
  onSuccess: () => void;
}

/**
 * Dane formularza dodawania waluty
 */
export interface AddCurrencyFormData {
  currency_code: string;
  exchange_rate: number;
}

/**
 * Dane formularza edycji kursu
 */
export interface EditRateFormData {
  exchange_rate: number;
}
```

### Istniejące typy z types.ts

Wykorzystywane typy już zdefiniowane w `src/types.ts`:

```typescript
// DTO waluty z grupy (zawiera kurs wymiany)
export type GroupCurrencyDTO = Currency & {
  exchange_rate: number;
};

// Odpowiedź API z listą walut grupy
export interface GroupCurrenciesDTO {
  base_currency: GroupCurrencyDTO;
  additional_currencies: GroupCurrencyDTO[];
}

// Komenda dodania waluty
export type AddCurrencyCommand = Pick<TablesInsert<"group_currencies">, "exchange_rate"> & {
  currency_code: string;
};

// Komenda aktualizacji kursu
export interface UpdateCurrencyCommand {
  exchange_rate: number;
}

// Podstawowy typ waluty
export type CurrencyDTO = Currency;
```

## 6. Zarządzanie stanem

### Custom Hook: `useGroupCurrencies`

Hook do zarządzania walutami grupy, wykorzystujący React Query do cache'owania i synchronizacji danych.

```typescript
// src/components/group/currencies/hooks/useGroupCurrencies.ts

export const useGroupCurrencies = (groupId: string) => {
  const queryClient = useQueryClient();

  // Pobieranie walut grupy
  const { data, isLoading, error } = useQuery({
    queryKey: ['group-currencies', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/currencies`);
      if (!response.ok) throw new Error('Failed to fetch currencies');
      return response.json() as Promise<GroupCurrenciesDTO>;
    },
  });

  // Dodawanie waluty
  const addCurrency = useMutation({
    mutationFn: async (command: AddCurrencyCommand) => {
      const response = await fetch(`/api/groups/${groupId}/currencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add currency');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-currencies', groupId] });
    },
  });

  // Aktualizacja kursu
  const updateRate = useMutation({
    mutationFn: async ({ code, rate }: { code: string; rate: number }) => {
      const response = await fetch(`/api/groups/${groupId}/currencies/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange_rate: rate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-currencies', groupId] });
    },
  });

  // Usuwanie waluty
  const removeCurrency = useMutation({
    mutationFn: async (currencyCode: string) => {
      const response = await fetch(`/api/groups/${groupId}/currencies/${currencyCode}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to remove currency');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-currencies', groupId] });
    },
  });

  return {
    currencies: data,
    isLoading,
    error,
    addCurrency,
    updateRate,
    removeCurrency,
  };
};
```

### Custom Hook: `useAllCurrencies`

Hook do pobierania globalnej listy walut z tabeli `currencies`.

```typescript
// src/components/group/currencies/hooks/useAllCurrencies.ts

export const useAllCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const response = await fetch('/api/currencies');
      if (!response.ok) throw new Error('Failed to fetch currencies');
      return response.json() as Promise<CurrencyDTO[]>;
    },
    staleTime: 1000 * 60 * 60, // 1 godzina (waluty rzadko się zmieniają)
  });
};
```

### Stan lokalny komponentów

- `AddCurrencyDialog`: brak stanu lokalnego (tylko przekazuje propsy do formularza)
- `AddCurrencyForm`: stan formularza (wybrana waluta, kurs wymiany) zarządzany przez react-hook-form
- `CurrencySearchCombobox`: stan wyszukiwania (tekst wyszukiwania, otwarte/zamknięte)
- `CurrencyListCard`: stan dialogu dodawania (`isAddDialogOpen`)


## 7. Integracja API

### Endpointy wykorzystywane przez widok

#### GET /api/currencies
**Typ żądania:** Brak (GET)  
**Typ odpowiedzi:** `CurrencyDTO[]`

Pobiera globalną listę wszystkich dostępnych walut z tabeli `currencies`. Wykorzystywane przez `CurrencySearchCombobox` do wyświetlenia listy walut do wyboru.

#### GET /api/groups/:groupId/currencies
**Typ żądania:** Brak (GET)  
**Typ odpowiedzi:** `GroupCurrenciesDTO`

```typescript
interface GroupCurrenciesDTO {
  base_currency: GroupCurrencyDTO;
  additional_currencies: GroupCurrencyDTO[];
}
```

Pobiera listę walut dostępnych w grupie wraz z kursami wymiany. Zwraca walutę bazową oraz wszystkie dodatkowe waluty.

#### POST /api/groups/:groupId/currencies
**Typ żądania:** `AddCurrencyCommand`

```typescript
interface AddCurrencyCommand {
  currency_code: string;
  exchange_rate: number;
}
```

**Typ odpowiedzi:** `GroupCurrencyDTO`

Dodaje nową walutę do grupy z określonym kursem wymiany. Waliduje czy waluta istnieje w systemie, czy nie jest już dodana i czy nie jest walutą bazową.

#### PATCH /api/groups/:groupId/currencies/:code
**Typ żądania:** `UpdateCurrencyCommand`

```typescript
interface UpdateCurrencyCommand {
  exchange_rate: number;
}
```

**Typ odpowiedzi:** `GroupCurrencyDTO`

Aktualizuje kurs wymiany istniejącej waluty w grupie. Nie można aktualizować waluty bazowej.

#### DELETE /api/groups/:groupId/currencies/:code
**Typ żądania:** Brak (DELETE)  
**Typ odpowiedzi:** `MessageResponseDTO`

```typescript
interface MessageResponseDTO {
  message: string;
  currency_code: string;
}
```

Usuwa walutę z grupy. Nie można usunąć waluty bazowej ani waluty używanej w istniejących wydatkach (zwraca błąd 409 Conflict).

## 8. Interakcje użytkownika

### Przeglądanie listy walut

1. Użytkownik przegląda ustawienia grupy w `GroupSettingsCards`
2. Widzi kartę "Waluty" z listą wszystkich walut
3. Waluta bazowa jest oznaczona badge'em "Bazowa" z kursem 1.0
4. Poniżej wyświetlane są wszystkie dodatkowe waluty z ich kursami
5. Każda waluta pokazuje: kod, nazwę, kurs wymiany w formacie "1 [CURRENCY] = X [BASE_CURRENCY]"
6. Dla każdej dodatkowej waluty widoczne są przyciski "Edytuj kurs" i "Usuń"

### Dodawanie nowej waluty

1. Użytkownik klika przycisk "Dodaj walutę" w karcie walut (w `GroupSettingsCards`)
2. System sprawdza czy użytkownik jest twórcą grupy
3. Jeśli tak, otwiera się dialog `AddCurrencyDialog`
4. Jeśli nie, wyświetla się komunikat błędu (tylko twórca może dodawać waluty)
5. W dialogu użytkownik widzi formularz z dwoma polami:
   - Combobox wyszukiwarki walut
   - Pole kursu wymiany
6. Użytkownik otwiera combobox i wpisuje tekst lub przewija listę (popularne waluty na górze)
7. Wybiera walutę z listy
8. Wprowadza kurs wymiany w polu numerycznym
9. System waliduje w czasie rzeczywistym:
   - Czy waluta została wybrana
   - Czy kurs > 0
   - Czy kurs ma max 4 miejsca po przecinku
10. Przycisk "Dodaj walutę" staje się aktywny po spełnieniu warunków
11. Użytkownik klika "Dodaj walutę"
12. System wysyła żądanie POST do API
13. Po sukcesie:
    - Wyświetla toast z komunikatem sukcesu
    - Zamyka dialog
    - Lista walut w `GroupSettingsCards` odświeża się automatycznie (React Query invalidation)
14. W przypadku błędu:
    - Wyświetla alert z komunikatem błędu w formularzu
    - Możliwe błędy: waluta już dodana (409), nieprawidłowy kurs (422), brak uprawnień (403)

### Edycja kursu wymiany

1. Użytkownik klika przycisk "Edytuj kurs" przy wybranej walucie
2. Otwiera się dialog edycji z:
   - Nazwą i kodem waluty (tylko do odczytu)
   - Aktualnym kursem jako wartość domyślna
   - Polem do wprowadzenia nowego kursu
3. Użytkownik wprowadza nowy kurs
4. System waliduje w czasie rzeczywistym (kurs > 0, max 4 miejsca po przecinku)
5. Użytkownik klika "Zapisz"
6. System wysyła żądanie PATCH do API
7. Po sukcesie:
   - Wyświetla toast "Kurs zaktualizowany"
   - Zamyka dialog edycji
   - Lista walut odświeża się automatycznie
8. W przypadku błędu:
   - Wyświetla komunikat błędu w dialogu

### Usuwanie waluty

1. Użytkownik klika przycisk "Usuń" przy wybranej walucie
2. Otwiera się dialog potwierdzenia:
   - Tytuł: "Usuń walutę"
   - Treść: "Czy na pewno chcesz usunąć walutę [CODE] - [NAME]? Ta operacja jest nieodwracalna."
   - Przyciski: "Anuluj" i "Usuń" (wariant destructive)
3. Użytkownik klika "Usuń"
4. System wysyła żądanie DELETE do API
5. Po sukcesie:
   - Wyświetla toast "Waluta usunięta"
   - Zamyka dialog potwierdzenia
   - Lista walut odświeża się automatycznie
6. W przypadku błędu:
   - Jeśli waluta jest używana w wydatkach (409 Conflict):
     - Wyświetla alert: "Nie można usunąć waluty, która jest używana w istniejących wydatkach"
   - Jeśli próba usunięcia waluty bazowej (403 Forbidden):
     - Wyświetla alert: "Nie można usunąć waluty bazowej grupy"
   - Inne błędy: wyświetla ogólny komunikat błędu

### Zamykanie dialogu

1. Użytkownik klika przycisk "Zamknij" lub klika poza dialogiem
2. Dialog zamyka się
3. Wszystkie niezapisane zmiany w formularzu dodawania są resetowane

## 9. Warunki i walidacja

### Warunki dostępu (poziom UI)

**Komponent:** `CurrencyListCard` (w `GroupSettingsCards`)

- **Warunek:** Tylko twórca grupy może widzieć przycisk "Dodaj walutę" i dodawać waluty
- **Weryfikacja:** Prop `isCreator` przekazywany z komponentu rodzica
- **Wpływ na UI:** Jeśli `isCreator === false`, przycisk "Dodaj walutę" jest ukryty

### Walidacja formularza dodawania waluty

**Komponent:** `AddCurrencyForm`

#### Warunek 1: Wybór waluty
- **Pole:** `currency_code`
- **Warunek:** Waluta musi być wybrana z listy
- **Weryfikacja:** `currency_code !== null && currency_code !== ""`
- **Komunikat błędu:** "Wybierz walutę z listy"
- **Wpływ na UI:** Przycisk "Dodaj walutę" nieaktywny

#### Warunek 2: Waluta nie może być już dodana
- **Pole:** `currency_code`
- **Warunek:** Wybrana waluta nie może znajdować się na liście `existingCurrencies`
- **Weryfikacja:** `!existingCurrencies.includes(currency_code)`
- **Komunikat błędu:** "Ta waluta jest już dodana do grupy"
- **Wpływ na UI:** Waluta jest filtrowana z listy wyboru (nie pojawia się w combobox)

#### Warunek 3: Waluta nie może być walutą bazową
- **Pole:** `currency_code`
- **Warunek:** Wybrana waluta nie może być walutą bazową grupy
- **Weryfikacja:** `currency_code !== baseCurrency`
- **Komunikat błędu:** "Nie można dodać waluty bazowej"
- **Wpływ na UI:** Waluta bazowa jest filtrowana z listy wyboru

#### Warunek 4: Kurs wymiany musi być większy od 0
- **Pole:** `exchange_rate`
- **Warunek:** Kurs musi być liczbą dodatnią
- **Weryfikacja:** `exchange_rate > 0`
- **Komunikat błędu:** "Kurs wymiany musi być większy od 0"
- **Wpływ na UI:** Czerwona ramka pola, komunikat pod polem, przycisk "Dodaj walutę" nieaktywny

#### Warunek 5: Kurs wymiany - maksymalnie 4 miejsca po przecinku
- **Pole:** `exchange_rate`
- **Warunek:** Kurs może mieć maksymalnie 4 cyfry po przecinku
- **Weryfikacja:** `/^\d+(\.\d{1,4})?$/.test(exchange_rate.toString())`
- **Komunikat błędu:** "Kurs może mieć maksymalnie 4 miejsca po przecinku"
- **Wpływ na UI:** Czerwona ramka pola, komunikat pod polem, przycisk "Dodaj walutę" nieaktywny

#### Warunek 6: Kurs wymiany - zakres wartości
- **Pole:** `exchange_rate`
- **Warunek:** Kurs musi być w zakresie 0.0001 - 9999.9999
- **Weryfikacja:** `exchange_rate >= 0.0001 && exchange_rate <= 9999.9999`
- **Komunikat błędu:** "Kurs musi być w zakresie 0.0001 - 9999.9999"
- **Wpływ na UI:** Czerwona ramka pola, komunikat pod polem, przycisk "Dodaj walutę" nieaktywny

### Walidacja formularza edycji kursu

**Komponent:** Dialog edycji kursu (w `CurrencyListItem`)

#### Warunek 1: Kurs wymiany musi być większy od 0
- Identyczny jak w formularzu dodawania (Warunek 4)

#### Warunek 2: Kurs wymiany - maksymalnie 4 miejsca po przecinku
- Identyczny jak w formularzu dodawania (Warunek 5)

#### Warunek 3: Kurs wymiany - zakres wartości
- Identyczny jak w formularzu dodawania (Warunek 6)

### Walidacja usuwania waluty

**Komponent:** `CurrencyListItem`

#### Warunek 1: Nie można usunąć waluty bazowej
- **Warunek:** Waluta nie może być walutą bazową grupy
- **Weryfikacja:** `currency.code !== baseCurrency`
- **Komunikat błędu:** "Nie można usunąć waluty bazowej grupy"
- **Wpływ na UI:** Przycisk "Usuń" jest ukryty dla waluty bazowej

#### Warunek 2: Nie można usunąć waluty używanej w wydatkach
- **Warunek:** Waluta nie może być używana w żadnym istniejącym wydatku
- **Weryfikacja:** Wykonywana przez API (backend sprawdza w tabeli `expenses`)
- **Komunikat błędu:** "Nie można usunąć waluty, która jest używana w istniejących wydatkach"
- **Wpływ na UI:** Alert wyświetlany po próbie usunięcia (błąd 409 z API)

### Warunki weryfikowane przez API (backend)

Poniższe warunki są weryfikowane przez backend i zwracają odpowiednie kody błędów:

1. **Użytkownik musi być członkiem grupy** (wszystkie endpointy)
   - Kod błędu: 403 Forbidden
   - Komunikat: "Użytkownik nie jest członkiem grupy"

2. **Kod waluty musi istnieć w tabeli `currencies`** (POST)
   - Kod błędu: 404 Not Found
   - Komunikat: "Kod waluty nie istnieje w systemie"

3. **Waluta nie może być już dodana do grupy** (POST)
   - Kod błędu: 409 Conflict
   - Komunikat: "Waluta już istnieje w grupie"

4. **Waluta nie może być walutą bazową** (POST)
   - Kod błędu: 422 Unprocessable Entity
   - Komunikat: "Nie można dodać waluty bazowej"

5. **Nie można edytować waluty bazowej** (PATCH)
   - Kod błędu: 403 Forbidden
   - Komunikat: "Nie można edytować waluty bazowej"

6. **Nie można usunąć waluty bazowej** (DELETE)
   - Kod błędu: 403 Forbidden
   - Komunikat: "Nie można usunąć waluty bazowej"

7. **Nie można usunąć waluty używanej w wydatkach** (DELETE)
   - Kod błędu: 409 Conflict
   - Komunikat: "Waluta jest używana w istniejących wydatkach"

## 10. Obsługa błędów

### Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa:**
- React Query automatycznie retry 3 razy
- Po niepowodzeniu wyświetla toast z komunikatem: "Błąd połączenia. Sprawdź połączenie z internetem i spróbuj ponownie."
- Przycisk akcji pozostaje aktywny, umożliwiając ponowną próbę

### Błędy walidacji (400, 422)

**Scenariusz:** Nieprawidłowe dane wejściowe (np. kurs < 0, nieprawidłowy format)

**Obsługa:**
- Wyświetlenie komunikatu błędu pod odpowiednim polem formularza
- Czerwona ramka wokół pola z błędem
- Przycisk akcji nieaktywny do czasu poprawienia błędu
- Komunikat błędu pochodzi z odpowiedzi API (`error.message`)

### Błędy uprawnień (403)

**Scenariusz:** Użytkownik nie ma uprawnień do wykonania operacji

**Obsługa:**
- Wyświetlenie toasta z komunikatem: "Nie masz uprawnień do wykonania tej operacji"
- Automatyczne zamknięcie dialogu
- Możliwe przyczyny:
  - Użytkownik nie jest twórcą grupy
  - Próba edycji/usunięcia waluty bazowej

### Błędy konfliktu (409)

**Scenariusz 1:** Próba dodania waluty już istniejącej w grupie

**Obsługa:**
- Wyświetlenie alertu w formularzu: "Ta waluta jest już dodana do grupy"
- Formularz pozostaje otwarty, użytkownik może wybrać inną walutę

**Scenariusz 2:** Próba usunięcia waluty używanej w wydatkach

**Obsługa:**
- Wyświetlenie alertu w dialogu potwierdzenia: "Nie można usunąć waluty, która jest używana w istniejących wydatkach. Najpierw usuń lub zmień walutę w powiązanych wydatkach."
- Dialog potwierdzenia pozostaje otwarty
- Przycisk "Usuń" staje się nieaktywny

### Błędy "nie znaleziono" (404)

**Scenariusz:** Grupa lub waluta nie istnieje

**Obsługa:**
- Wyświetlenie toasta: "Nie znaleziono zasobu"
- Automatyczne zamknięcie dialogu
- Odświeżenie danych grupy (może grupa została usunięta)

### Błędy serwera (500)

**Scenariusz:** Wewnętrzny błąd serwera

**Obsługa:**
- Wyświetlenie toasta: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przycisk akcji pozostaje aktywny
- Możliwość ponownej próby

### Błędy React Query

**Scenariusz:** Błąd podczas pobierania danych (useQuery)

**Obsługa:**
- Wyświetlenie stanu błędu w komponencie:
  ```tsx
  {error && (
    <Alert variant="destructive">
      <AlertDescription>
        Nie udało się załadować walut. <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
      </AlertDescription>
    </Alert>
  )}
  ```
- Przycisk "Spróbuj ponownie" wywołuje `refetch()`

### Obsługa błędów w hookach

```typescript
// Przykład obsługi błędów w useGroupCurrencies

const addCurrency = useMutation({
  mutationFn: async (command: AddCurrencyCommand) => {
    const response = await fetch(`/api/groups/${groupId}/currencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add currency');
    }
    
    return response.json();
  },
  onSuccess: () => {
    toast.success('Waluta dodana pomyślnie');
    queryClient.invalidateQueries({ queryKey: ['group-currencies', groupId] });
  },
  onError: (error: Error) => {
    toast.error(error.message || 'Nie udało się dodać waluty');
  },
});
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików i typów

1. Utworzyć katalog `src/components/group/currencies/`
2. Utworzyć plik typów: `src/components/group/currencies/types.ts`
3. Zdefiniować wszystkie interfejsy props dla komponentów
4. Utworzyć katalog `src/components/group/currencies/hooks/`

**Pliki do utworzenia:**
- `src/components/group/currencies/types.ts`
- `src/components/group/currencies/hooks/useGroupCurrencies.ts`
- `src/components/group/currencies/hooks/useAllCurrencies.ts`

### Krok 2: Implementacja custom hooków

1. Zaimplementować `useAllCurrencies` do pobierania globalnej listy walut
2. Zaimplementować `useGroupCurrencies` z metodami:
   - Pobieranie walut grupy (useQuery)
   - Dodawanie waluty (useMutation)
   - Aktualizacja kursu (useMutation)
   - Usuwanie waluty (useMutation)
3. Dodać obsługę błędów i toastów w hookach

**Pliki do edycji:**
- `src/components/group/currencies/hooks/useAllCurrencies.ts`
- `src/components/group/currencies/hooks/useGroupCurrencies.ts`

### Krok 3: Implementacja komponentu CurrencySearchCombobox

1. Utworzyć komponent `CurrencySearchCombobox.tsx`
2. Zaimplementować wyszukiwanie i filtrowanie walut
3. Dodać grupowanie na popularne i pozostałe waluty
4. Zaimplementować obsługę wyboru waluty
5. Dodać stylowanie z Tailwind i shadcn/ui

**Pliki do utworzenia:**
- `src/components/group/currencies/CurrencySearchCombobox.tsx`

### Krok 4: Implementacja komponentu ExchangeRateInput

1. Utworzyć komponent `ExchangeRateInput.tsx`
2. Zaimplementować pole numeryczne z walidacją
3. Dodać wyświetlanie jednostki kursu
4. Dodać komunikaty pomocnicze i przykłady
5. Zintegrować z react-hook-form

**Pliki do utworzenia:**
- `src/components/group/currencies/ExchangeRateInput.tsx`

### Krok 5: Implementacja komponentu AddCurrencyForm

1. Utworzyć komponent `AddCurrencyForm.tsx`
2. Zintegrować `CurrencySearchCombobox` i `ExchangeRateInput`
3. Dodać walidację formularza z react-hook-form
4. Zaimplementować obsługę submit (wywołanie `addCurrency` z hooka)
5. Dodać obsługę błędów i komunikatów sukcesu
6. Zaimplementować resetowanie formularza po dodaniu

**Pliki do utworzenia:**
- `src/components/group/currencies/AddCurrencyForm.tsx`

### Krok 6: Implementacja głównego komponentu AddCurrencyDialog

1. Utworzyć komponent `AddCurrencyDialog.tsx`
2. Zaimplementować prostą strukturę dialogu (bez zakładek)
3. Zintegrować `AddCurrencyForm` w dialogu
4. Dodać obsługę zamknięcia dialogu po dodaniu waluty
5. Przekazać wymagane propsy do formularza

**Pliki do utworzenia:**
- `src/components/group/currencies/AddCurrencyDialog.tsx`

### Krok 7: Implementacja komponentu CurrencyListItem

1. Utworzyć komponent `CurrencyListItem.tsx`
2. Zaimplementować wyświetlanie informacji o walucie
3. Dodać badge "Bazowa" dla waluty bazowej
4. Zaimplementować przycisk edycji kursu z dialogiem (`EditRateDialog`)
5. Zaimplementować przycisk usunięcia z dialogiem potwierdzenia (`RemoveCurrencyDialog`)
6. Dodać warunkowe ukrywanie przycisków dla waluty bazowej

**Pliki do utworzenia:**
- `src/components/group/currencies/CurrencyListItem.tsx`
- `src/components/group/currencies/EditRateDialog.tsx`
- `src/components/group/currencies/RemoveCurrencyDialog.tsx`

### Krok 8: Implementacja komponentu CurrencyListCard

1. Utworzyć komponent `CurrencyListCard.tsx`
2. Zaimplementować nagłówek karty z przyciskiem "Dodaj walutę"
3. Zaimplementować iterację po walutach i renderowanie `CurrencyListItem`
4. Dodać stan ładowania (skeleton loader)
5. Dodać stan pusty (brak dodatkowych walut)
6. Zaimplementować przekazywanie akcji do elementów listy
7. Zintegrować hook `useGroupCurrencies`
8. Dodać stan dialogu dodawania (`isAddDialogOpen`)

**Pliki do utworzenia:**
- `src/components/group/currencies/CurrencyListCard.tsx`

### Krok 9: Integracja z GroupSettingsCards

1. Otworzyć plik `src/components/group/GroupSettingsCards.tsx`
2. Zaimportować `CurrencyListCard`
3. Dodać `CurrencyListCard` do listy kart ustawień (linie 22-24)
4. Przekazać wymagane propsy: `groupId`, `currencies`, `baseCurrency`, `isCreator`
5. Dodać warunkowe renderowanie karty (tylko dla członków grupy)

**Pliki do edycji:**
- `src/components/group/GroupSettingsCards.tsx`

### Krok 10: Utworzenie endpointu GET /api/currencies

1. Utworzyć plik `src/pages/api/currencies/index.ts`
2. Zaimplementować endpoint pobierający wszystkie waluty z tabeli `currencies`
3. Dodać cache headers (waluty rzadko się zmieniają)
4. Dodać obsługę błędów

**Pliki do utworzenia:**
- `src/pages/api/currencies/index.ts`

### Krok 11: Testowanie i debugowanie

1. Przetestować dodawanie waluty:
   - Poprawne dodanie
   - Walidacja formularza
   - Obsługa błędów (duplikat, waluta bazowa)
2. Przetestować edycję kursu:
   - Poprawna edycja
   - Walidacja kursu
   - Obsługa błędów
3. Przetestować usuwanie waluty:
   - Poprawne usunięcie
   - Próba usunięcia waluty bazowej (powinno być zablokowane)
   - Próba usunięcia waluty używanej w wydatkach (błąd 409)
4. Przetestować wyszukiwarkę walut:
   - Filtrowanie po kodzie
   - Filtrowanie po nazwie
   - Grupowanie popularnych walut
5. Przetestować responsywność na urządzeniach mobilnych
6. Przetestować dostępność (keyboard navigation, screen readers)

### Krok 12: Optymalizacja i refaktoryzacja

1. Sprawdzić performance komponentów (React DevTools Profiler)
2. Dodać memoizację gdzie potrzeba (useMemo, useCallback)
3. Zoptymalizować zapytania React Query (staleTime, cacheTime)
4. Dodać lazy loading dla dialogu (React.lazy)
5. Sprawdzić bundle size i zoptymalizować importy

### Krok 13: Dokumentacja i code review

1. Dodać komentarze JSDoc do wszystkich komponentów i hooków
2. Zaktualizować dokumentację w `pending-features.md`
3. Utworzyć pull request
4. Code review przez zespół
5. Poprawki po review

### Krok 14: Testy jednostkowe i E2E

1. Napisać testy jednostkowe dla hooków:
   - `useGroupCurrencies.test.ts`
   - `useAllCurrencies.test.ts`
2. Napisać testy komponentów:
   - `CurrencySearchCombobox.test.tsx`
   - `ExchangeRateInput.test.tsx`
   - `AddCurrencyForm.test.tsx`
   - `CurrencyListItem.test.tsx`
3. Napisać testy E2E (Playwright):
   - Scenariusz dodawania waluty
   - Scenariusz edycji kursu
   - Scenariusz usuwania waluty
   - Scenariusz walidacji błędów

### Krok 15: Deployment i monitoring

1. Merge do głównej gałęzi
2. Deploy na środowisko staging
3. Testy manualne na staging
4. Deploy na produkcję
5. Monitoring błędów (Sentry)
6. Zbieranie feedbacku od użytkowników
