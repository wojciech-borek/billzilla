# Architektura Dodawania Wydatków Głosowo

## Diagram Komponentów UI

```mermaid
flowchart TD
    A["ExpenseForm.tsx<br/>Główny formularz wydatku"] --> B["VoiceInputButton.tsx<br/>Przycisk nagrywania"]

    subgraph "Komponenty Nagrywania"
        C1["VoiceRecordingIndicator.tsx<br/>Wskaźnik nagrywania"]
        C2["VoiceTranscriptionStatus.tsx<br/>Status przetwarzania"]
    end

    subgraph "Serwisy Backend"
        D1["expenseTranscriptionService.ts<br/>API transkrypcji"]
        D2["transcriptionTaskService.ts<br/>Zarządzanie zadaniami"]
        D3["openRouterService.ts<br/>AI/LLM ekstrakcja"]
        D4["whisperService.ts<br/>Transkrypcja audio"]
    end

    subgraph "Schematy Walidacji"
        E1["expenseTranscriptionSchema<br/>Schemat danych z AI"]
        E2["createExpenseFormSchema<br/>Schemat formularza"]
    end

    subgraph "Hooki React"
        F1["useExpenseTranscription<br/>Hook głosowy"]
        F2["useExpenseForm<br/>Hook formularza"]
    end

    B --> C1
    B --> C2

    B --> F1
    F1 --> D1
    F1 --> F2

    D1 --> D2
    D2 --> D3
    D2 --> D4

    F2 --> E2
    D3 --> E1

    classDef ui fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef services fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef validation fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef hooks fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class A,B,C1,C2 ui
    class D1,D2,D3,D4 services
    class E1,E2 validation
    class F1,F2 hooks
```

## Diagram Przepływu Dodawania Wydatku Głosowo

```mermaid
flowchart TD
    START(["Użytkownik chce dodać wydatek głosowo"])

    START --> A["Kliknij przycisk głosowy"]
    A --> B["Rozpocznij nagrywanie audio"]
    B --> C["Wyświetl wskaźnik nagrywania"]
    C --> D["Nagrywaj głos użytkownika"]

    D --> E["Zatrzymaj nagrywanie"]
    E --> F["Wyślij audio do API"]
    F --> G["/api/expenses/transcribe"]
    G --> H["Utwórz zadanie transkrypcji"]

    H --> I["Przetwarzanie audio przez Whisper"]
    I --> J["Transkrypcja tekstowa"]
    J --> K["Wyślij do OpenRouter (AI)"]
    K --> L["Ekstrakcja danych wydatku"]
    L --> M["Walidacja danych AI"]

    M --> N{"Dane prawidłowe?"}
    N -->|"Tak"| O["Wypełnij formularz automatycznie"]
    N -->|"Nie"| P["Błąd ekstrakcji danych"]

    O --> Q["Wyświetl formularz z danymi"]
    Q --> R["Pozwól użytkownikowi edytować"]
    R --> S["Walidacja formularza"]
    S --> T{"Wszystko poprawne?"}
    T -->|"Tak"| U["Zapisz wydatek"]
    T -->|"Nie"| V["Wyświetl błędy"]
    V --> R

    U --> W["Aktualizuj salda grupy"]
    W --> END(["Wydatek dodany głosowo"])

    P --> X["Wyświetl błąd AI"]
    X --> Y["Przejdź do formularza ręcznego"]

    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef action fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px

    class START,A,B,C,D,E,F,G,H,I,J,K,L,M,O,Q,R,S,U,W,END process
    class N,T decision
    class U action
    class END success
    class P,X,Y error
```

## Szczegółowy Diagram Przetwarzania AI

```mermaid
sequenceDiagram
    autonumber

    participant U as Użytkownik
    participant F as ExpenseForm
    participant T as TranscriptionService
    participant W as WhisperService
    participant O as OpenRouterService
    participant V as Walidacja
    participant DB as Baza danych

    U->>F: Kliknij przycisk głosowy
    F->>F: Rozpocznij nagrywanie
    U->>F: Nagraj wiadomość głosową
    F->>F: Zatrzymaj nagrywanie
    F->>T: uploadAudioForTranscription(audioBlob, groupId)
    T->>T: POST /api/expenses/transcribe
    T->>W: Przetwórz audio przez Whisper
    W->>W: Transkrypcja na tekst
    W-->>T: Tekst transkrypcji

    T->>O: Wyślij tekst do AI (OpenRouter)
    O->>O: Ekstrakcja danych wydatku
    O->>O: Analiza kontekstu grupy
    O->>O: Walidacja danych
    O-->>T: Strukturyzowane dane wydatku

    T->>V: Walidacja danych AI
    V->>V: Sprawdź schemat expenseTranscriptionSchema
    V-->>T: Dane zwalidowane

    T-->>F: Wypełnij formularz danymi AI
    F->>U: Wyświetl formularz z propozycjami
    U->>F: Edytuj dane jeśli potrzebne
    F->>F: Zapisz wydatek
    F->>DB: INSERT expense + splits
    DB-->>F: Potwierdzenie
    F->>U: Wyświetl sukces
```

## Diagram Stanów Zadania Transkrypcji

```mermaid
stateDiagram-v2
    [*] --> pending: Rozpoczęcie zadania

    pending --> processing: Rozpoczęcie przetwarzania
    processing --> completed: Sukces - dane wyciągnięte
    processing --> failed: Błąd przetwarzania

    completed --> [*]: Dane wykorzystane
    failed --> [*]: Błąd obsłużony

    note right of pending
        Status: Oczekujące
        Komunikat: "Przetwarzam..."
    end note

    note right of processing
        Status: Przetwarzanie
        Komunikat: "Analizuję nagranie..."
    end note

    note right of completed
        Status: Ukończone
        Komunikat: "Dane zostały wyciągnięte"
        Dane: opis, kwota, uczestnicy...
    end note

    note right of failed
        Status: Błąd
        Komunikat: "Nie udało się przetworzyć"
        Przyczyna: audio nieczytelne, błąd API...
    end note
```
