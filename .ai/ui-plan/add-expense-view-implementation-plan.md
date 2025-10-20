# Plan implementacji widoku dodawania wydatku

## 1. Przegląd
Widok dodawania wydatku to modalny formularz umożliwiający użytkownikom tworzenie nowych wydatków w grupie dwoma sposobami: ręcznym wypełnieniem formularza lub za pomocą polecenia głosowego. Formularz obsługuje dwa tryby podziału kosztów: równy podział na wszystkich uczestników oraz indywidualne przypisanie kwot. Widok integruje się z systemem walut grupy, zapewniając wybór spośród dostępnych walut oraz automatyczne przeliczenia na walutę bazową. 

Kluczowa funkcjonalność głosowa wykorzystuje dwuetapowe przetwarzanie AI: transkrypcję mowy na tekst (Whisper) oraz ekstrakcję strukturalnych danych wydatku (LLM), które automatycznie wypełniają formularz z możliwością weryfikacji i edycji przez użytkownika przed zatwierdzeniem. Celem jest zapewnienie intuicyjnego i bezpiecznego procesu dodawania wydatków z pełną walidacją po stronie klienta i serwera.

## 2. Routing widoku
Widok jest dostępny pod dedykowaną ścieżką `/groups/[groupId]/expenses/new`. Jest otwierany poprzez nawigację z poziomu widoku grupy lub przycisk FAB (Floating Action Button) na pulpicie nawigacyjnym.

## 3. Struktura komponentów
```
src/pages/groups/[groupId]/expenses/
├── new.astro (strona główna)
src/components/group/expenses/
├── AddExpenseModal.tsx (modal wrapper dla formularza)
├── VoiceInputButton.tsx (przycisk aktywujący nagrywanie głosowe)
├── VoiceRecordingIndicator.tsx (wskaźnik aktywnego nagrywania)
├── VoiceTranscriptionStatus.tsx (status przetwarzania transkrypcji)
├── forms/
│   ├── ExpenseForm.tsx (główny komponent formularza - orchestruje podkomponenty)
│   ├── ExpenseBasicInfo.tsx (informacje podstawowe: opis, kwota, waluta, data, płatnik)
│   ├── ExpenseSplitSection.tsx (sekcja podziału kosztów)
│   ├── SimpleSplitInput.tsx (wprowadzanie kwot dla uczestników)
│   └── CurrencySelector.tsx (wybór waluty)
```

## 4. Szczegóły komponentów

### AddExpenseModal
- **Opis komponentu:** Modal wrapper dla formularza dodawania wydatku. Zarządza stanem ładowania, błędami oraz komunikacją między komponentami. Zawiera VoiceInputButton umożliwiający dodawanie wydatków głosem.
- **Główne elementy:** Dialog z ExpenseForm, VoiceInputButton, przyciski zamykania, obsługa stanów ładowania i błędów.
- **Obsługiwane interakcje:** onExpenseCreated (po pomyślnym utworzeniu wydatku), onClose (zamknięcie modala), onVoiceInput (rozpoczęcie nagrywania głosowego).
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji - deleguje do ExpenseForm.
- **Typy:** ExpenseDTO (response), ErrorResponseDTO (błędy), TranscriptionResultDTO (wynik transkrypcji).
- **Propsy:**
  ```typescript
  interface AddExpenseModalProps {
    groupId: string;
    groupMembers: GroupMemberSummaryDTO[];
    groupCurrencies: GroupCurrencyDTO[];
    currentUserId: string;
    isOpen: boolean;
    onClose: () => void;
    onExpenseCreated?: (expense: ExpenseDTO) => void;
    isLoading?: boolean;
    error?: string | null;
  }
  ```

### VoiceInputButton
- **Opis komponentu:** Przycisk w formie ikony mikrofonu, który aktywuje nagrywanie polecenia głosowego. Po kliknięciu przechodzi w tryb nagrywania z wizualnym wskaźnikiem, a po zakończeniu wysyła audio do API transkrypcji.
- **Główne elementy:** Button z ikoną mikrofonu (Mic/MicOff z Lucide React), VoiceRecordingIndicator (podczas nagrywania), VoiceTranscriptionStatus (podczas przetwarzania).
- **Obsługiwane interakcje:** onClick (rozpoczęcie/zakończenie nagrywania), onTranscriptionComplete (wypełnienie formularza danymi).
- **Obsługiwana walidacja:** Sprawdzenie uprawnień do mikrofonu, walidacja rozmiaru pliku audio (max 25MB), walidacja formatu audio.
- **Typy:** TranscriptionResultDTO (wynik), TranscriptionErrorDTO (błędy transkrypcji).
- **Propsy:**
  ```typescript
  interface VoiceInputButtonProps {
    groupId: string;
    onTranscriptionComplete: (result: TranscriptionResultDTO) => void;
    onTranscriptionError: (error: TranscriptionErrorDTO) => void;
    disabled?: boolean;
    isRecording?: boolean;
    isProcessing?: boolean;
  }
  ```

### VoiceRecordingIndicator
- **Opis komponentu:** Komponent wyświetlany podczas aktywnego nagrywania. Pokazuje animowaną ikonę mikrofonu, czas nagrywania oraz przycisk anulowania nagrywania.
- **Główne elementy:** Animowana ikona mikrofonu, timer nagrywania, przycisk "Anuluj" lub "Zatrzymaj nagrywanie".
- **Obsługiwane interakcje:** onStop (zakończenie nagrywania), onCancel (anulowanie bez wysyłania).
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji.
- **Typy:** Brak specyficznych DTO.
- **Propsy:**
  ```typescript
  interface VoiceRecordingIndicatorProps {
    recordingDuration: number; // w sekundach
    onStop: () => void;
    onCancel: () => void;
    maxDuration?: number; // maksymalny czas nagrania (np. 60s)
  }
  ```

### VoiceTranscriptionStatus
- **Opis komponentu:** Komponent wyświetlający status przetwarzania transkrypcji. Pokazuje wskaźnik ładowania, komunikaty o postępie oraz wyświetla błędy w przypadku niepowodzenia. Odpytuje endpoint statusu zadania transkrypcji.
- **Główne elementy:** Spinner/Progress indicator, komunikaty tekstowe o statusie ("Transkrybuję nagranie...", "Analizuję dane wydatku..."), komunikaty błędów.
- **Obsługiwane interakcje:** onComplete (transkrypcja zakończona), onError (błąd transkrypcji), onRetry (ponowna próba).
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji.
- **Typy:** TranscribeTaskStatusDTO, TranscriptionResultDTO, TranscriptionErrorDTO.
- **Propsy:**
  ```typescript
  interface VoiceTranscriptionStatusProps {
    taskId: string;
    onComplete: (result: TranscriptionResultDTO) => void;
    onError: (error: TranscriptionErrorDTO) => void;
    pollingInterval?: number; // interwał odpytywania w ms (domyślnie 1000)
  }
  ```

### ExpenseForm
- **Opis komponentu:** Główny komponent formularza - orchestruje podkomponenty i zarządza komunikacją między nimi. Umożliwia wypełnienie formularza danymi z transkrypcji głosowej lub ręczne wprowadzenie danych.
- **Główne elementy:** ExpenseBasicInfo, ExpenseSplitSection, obsługa błędów i przycisk submit.
- **Obsługiwane interakcje:** onSubmit (wysyłanie formularza do API), populateFromTranscription (wypełnienie formularza z transkrypcji).
- **Obsługiwana walidacja:** Deleguje walidację do podkomponentów i useExpenseForm hook. Waliduje dane z transkrypcji przed wypełnieniem formularza.
- **Typy:** CreateExpenseCommand (dane formularza), ExpenseDTO (response), TranscriptionResultDTO (dane z transkrypcji).
- **Propsy:**
  ```typescript
  interface ExpenseFormProps {
    groupId: string;
    groupMembers: GroupMemberSummaryDTO[];
    groupCurrencies: GroupCurrencyDTO[];
    currentUserId: string;
    onSubmit: (expense: ExpenseDTO) => Promise<void>;
    initialData?: CreateExpenseCommand; // dane początkowe z transkrypcji
    isFromVoice?: boolean; // flaga informująca, że dane pochodzą z transkrypcji
  }
  ```

### ExpenseBasicInfo
- **Opis komponentu:** Sekcja formularza zawierająca podstawowe informacje o wydatku.
- **Główne elementy:** Pola tekstowe dla opisu, kwoty, waluty, daty i płatnika.
- **Obsługiwana walidacja:** Walidacja formatów i wymaganych pól.
- **Propsy:**
  ```typescript
  interface ExpenseBasicInfoProps {
    form: UseFormReturn<CreateExpenseFormValues>;
    groupMembers: GroupMemberSummaryDTO[];
    groupCurrencies: GroupCurrencyDTO[];
    currentUserId: string;
  }
  ```

### ExpenseSplitSection
- **Opis komponentu:** Sekcja formularza odpowiedzialna za podział kosztów między uczestników.
- **Główne elementy:** SimpleSplitInput z przyciskiem "podziel po równo".
- **Obsługiwana walidacja:** Walidacja sumy podziałów.
- **Propsy:**
  ```typescript
  interface ExpenseSplitSectionProps {
    form: UseFormReturn<CreateExpenseFormValues>;
    groupMembers: GroupMemberSummaryDTO[];
  }
  ```

### SimpleSplitInput
- **Opis komponentu:** Komponent do wprowadzania kwot podziału dla każdego uczestnika grupy.
- **Główne elementy:** Lista członków grupy z polami input dla kwot, przycisk "podziel po równo".
- **Obsługiwana walidacja:** Suma kwot = całkowita kwota (±0.01 tolerancja).
- **Propsy:**
  ```typescript
  interface SimpleSplitInputProps {
    members: GroupMemberSummaryDTO[];
    totalAmount: number;
    currencyCode: string;
    splits: ExpenseSplitCommand[];
    onSplitsChange: (splits: ExpenseSplitCommand[]) => void;
  }
  ```

### CurrencySelector
- **Opis komponentu:** Selektor waluty spośród dostępnych w grupie.
- **Główne elementy:** Select component z Shadcn/ui.
- **Obsługiwane interakcje:** onValueChange (zmiana wybranej waluty).
- **Obsługiwana walidacja:** Wybrana waluta musi istnieć w group_currencies.
- **Typy:** GroupCurrencyDTO[] (dostępne waluty).
- **Propsy:**
  ```typescript
  interface CurrencySelectorProps {
    currencies: GroupCurrencyDTO[];
    value: string;
    onChange: (currencyCode: string) => void;
    error?: string;
    disabled?: boolean;
  }
  ```

## 5. Typy
Wymagane typy obejmują istniejące DTO z `types.ts` oraz typy używane w hookach:

```typescript
// Istniejące DTO (z types.ts)
- CreateExpenseCommand
- ExpenseDTO
- ExpenseSplitCommand
- ExpenseSplitDTO
- GroupMemberSummaryDTO
- GroupCurrencyDTO
- ErrorResponseDTO
- CreateExpenseFormValues (z expenseSchemas.ts)

// Nowe DTO dla funkcjonalności głosowej (już w types.ts)
- TranscriptionResultDTO: {
    transcription: string;          // surowy tekst transkrypcji
    expense_data: CreateExpenseCommand; // wyekstrahowane dane wydatku
    confidence: number;              // poziom pewności AI (0-1)
  }

- TranscriptionErrorDTO: {
    code: string;                    // kod błędu (np. "TRANSCRIPTION_FAILED", "INVALID_AUDIO")
    message: string;                 // komunikat błędu
  }

- TranscribeTaskStatusDTO: {
    task_id: string;                 // UUID zadania
    status: "processing" | "completed" | "failed";
    created_at: string;              // ISO 8601
    completed_at?: string;           // ISO 8601 (jeśli zakończone)
    result?: TranscriptionResultDTO; // wynik (jeśli status = completed)
    error?: TranscriptionErrorDTO;   // błąd (jeśli status = failed)
  }

- TranscribeTaskResponseDTO: {
    task_id: string;
    status: "processing";
    created_at: string;
  }

// Typy hooków - useExpenseForm
type ExpenseFormState = {
  isSubmitting: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string> | null;
};

type UseExpenseFormResult = ExpenseFormState & {
  form: ReturnType<typeof useForm<CreateExpenseFormValues>>;
  splitValidation: {
    totalAmount: number;
    currentSum: number;
    remaining: number;
    isValid: boolean;
  };
  handleSubmit: (groupId: string) => Promise<ExpenseDTO>;
  populateFromTranscription: (data: CreateExpenseCommand) => void;
  reset: () => void;
};

// Typy hooków - useVoiceTranscription
type VoiceTranscriptionState = {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  taskId: string | null;
  error: TranscriptionErrorDTO | null;
};

type UseVoiceTranscriptionResult = VoiceTranscriptionState & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  uploadAudio: (audioBlob: Blob, groupId: string) => Promise<TranscribeTaskResponseDTO>;
  pollTaskStatus: (taskId: string) => Promise<TranscribeTaskStatusDTO>;
  reset: () => void;
};

// Typy hooków - useAudioRecorder
type AudioRecorderState = {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
};

type UseAudioRecorderResult = AudioRecorderState & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  reset: () => void;
};
```

## 6. Zarządzanie stanem
Stan widoku jest zarządzany przez trzy custom hooki: `useExpenseForm`, `useVoiceTranscription` i `useAudioRecorder`.

### useExpenseForm
Hook zarządza stanem formularza, integra React Hook Form z logiką biznesową walidacji podziałów oraz umożliwia wypełnienie formularza danymi z transkrypcji:

```typescript
function useExpenseForm(
  groupMembers: GroupMemberSummaryDTO[],
  groupCurrencies: GroupCurrencyDTO[],
  defaultPayerId?: string,
  initialData?: CreateExpenseCommand
): UseExpenseFormResult {
  const [state, setState] = useState<ExpenseFormState>({
    isSubmitting: false,
    submitError: null,
    fieldErrors: null,
  });

  // Formularz z React Hook Form
  const form = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(createExpenseFormSchema),
    mode: 'onChange',
    defaultValues: initialData || {
      description: undefined,
      amount: undefined,
      currency_code: groupCurrencies[0]?.currency_code || 'PLN',
      expense_date: new Date().toISOString().slice(0, 16),
      payer_id: defaultPayerId || undefined,
      splits: [],
    },
  });

  // Obliczenia walidacji podziałów
  const splitValidation = useMemo(() => {
    const totalAmount = form.watch('amount') || 0;
    const currentSum = form.watch('splits').reduce((sum, split) => sum + split.amount, 0);
    const remaining = Math.round((totalAmount - currentSum) * 100) / 100;
    const isValid = Math.abs(remaining) <= 0.01;

    return { totalAmount, currentSum, remaining, isValid };
  }, [form.watch('amount'), form.watch('splits')]);

  const handleSubmit = useCallback(async (groupId: string): Promise<ExpenseDTO> => {
    // Walidacja i wysłanie formularza do API
    // Obsługa błędów i transformacja danych
  }, [form]);

  // Wypełnienie formularza danymi z transkrypcji
  const populateFromTranscription = useCallback((data: CreateExpenseCommand) => {
    form.setValue('description', data.description);
    form.setValue('amount', data.amount);
    form.setValue('currency_code', data.currency_code);
    form.setValue('expense_date', data.expense_date);
    form.setValue('payer_id', data.payer_id);
    form.setValue('splits', data.splits);
  }, [form]);

  const reset = useCallback(() => {
    form.reset();
    setState({
      isSubmitting: false,
      submitError: null,
      fieldErrors: null,
    });
  }, [form]);

  return {
    ...state,
    form,
    splitValidation,
    handleSubmit,
    populateFromTranscription,
    reset,
  };
}
```

### useVoiceTranscription
Hook zarządza całym procesem transkrypcji głosowej: nagrywaniem audio, uploadem do API oraz pollowaniem statusu zadania:

```typescript
function useVoiceTranscription(): UseVoiceTranscriptionResult {
  const [state, setState] = useState<VoiceTranscriptionState>({
    isRecording: false,
    isProcessing: false,
    recordingDuration: 0,
    taskId: null,
    error: null,
  });

  const audioRecorder = useAudioRecorder();

  const startRecording = useCallback(async () => {
    try {
      await audioRecorder.startRecording();
      setState(prev => ({ ...prev, isRecording: true, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'MICROPHONE_ERROR',
          message: 'Nie udało się uzyskać dostępu do mikrofonu',
        },
      }));
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    const audioBlob = await audioRecorder.stopRecording();
    setState(prev => ({ ...prev, isRecording: false }));
    return audioBlob;
  }, [audioRecorder]);

  const cancelRecording = useCallback(() => {
    audioRecorder.cancelRecording();
    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      error: null,
    }));
  }, [audioRecorder]);

  const uploadAudio = useCallback(async (
    audioBlob: Blob,
    groupId: string
  ): Promise<TranscribeTaskResponseDTO> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('group_id', groupId);

      const response = await fetch('/api/expenses/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: TranscribeTaskResponseDTO = await response.json();
      setState(prev => ({ ...prev, taskId: data.task_id }));
      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Nie udało się wysłać nagrania',
        },
      }));
      throw error;
    }
  }, []);

  const pollTaskStatus = useCallback(async (
    taskId: string
  ): Promise<TranscribeTaskStatusDTO> => {
    const response = await fetch(`/api/expenses/transcribe/${taskId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch task status');
    }
    return response.json();
  }, []);

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      recordingDuration: 0,
      taskId: null,
      error: null,
    });
    audioRecorder.reset();
  }, [audioRecorder]);

  return {
    ...state,
    recordingDuration: audioRecorder.duration,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    pollTaskStatus,
    reset,
  };
}
```

### useAudioRecorder
Hook zarządza niskopoziomową funkcjonalnością nagrywania audio przy użyciu Web Audio API (MediaRecorder):

```typescript
function useAudioRecorder(): UseAudioRecorderResult {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setState(prev => ({ ...prev, isRecording: true, duration: 0, error: null }));

      // Timer dla duration
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Nie udało się uzyskać dostępu do mikrofonu',
      }));
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, isRecording: false, audioBlob }));
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    chunksRef.current = [];
    setState({
      isRecording: false,
      duration: 0,
      audioBlob: null,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
```

Hooki zapewniają separację odpowiedzialności, walidację w czasie rzeczywistym, obsługę błędów oraz integrację z API.

## 7. Integracja API
Widok integruje się z trzema endpointami: tworzenie wydatku, upload audio oraz sprawdzanie statusu transkrypcji.

### 7.1. Tworzenie wydatku (POST /api/groups/:groupId/expenses)
Endpoint wykorzystywany zarówno dla ręcznego dodawania wydatków, jak i zatwierdzania wydatków z transkrypcji głosowej.

**Żądanie (Request):**
```typescript
POST /api/groups/:groupId/expenses
Content-Type: application/json
Authorization: Bearer <token>

Body: CreateExpenseCommand {
  description: string;        // 1-500 znaków
  amount: number;             // > 0, max 2 miejsca po przecinku
  currency_code: string;      // ISO 4217, 3 wielkie litery
  expense_date: string;       // ISO 8601
  payer_id: string;           // UUID, musi = current user
  splits: ExpenseSplitCommand[]; // profile_id + amount, suma = total
}
```

**Odpowiedź (Response):**
```typescript
201 Created
Content-Type: application/json

Body: ExpenseDTO {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency_code: string;
  expense_date: string;
  created_at: string;
  amount_in_base_currency: number;  // obliczone przez API
  created_by: UserInfoDTO;          // {id, full_name, avatar_url}
  splits: ExpenseSplitDTO[];        // z nazwami uczestników
}
```

**Obsługa błędów:**
- 400: Validation/Semantic Error (np. zła suma, uczestnik poza grupą)
- 401: Unauthorized
- 403: Forbidden (użytkownik nie należy do grupy)
- 404: Group/Wallet not found
- 500: Internal Server Error

### 7.2. Upload audio dla transkrypcji (POST /api/expenses/transcribe)
Endpoint do wysyłania pliku audio i inicjowania procesu transkrypcji asynchronicznej.

**Żądanie (Request):**
```typescript
POST /api/expenses/transcribe
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
  - audio: File (audio/*, max 25MB)
  - group_id: string (UUID)
```

**Odpowiedź (Response):**
```typescript
201 Created
Content-Type: application/json

Body: TranscribeTaskResponseDTO {
  task_id: string;           // UUID zadania
  status: "processing";
  created_at: string;        // ISO 8601
}
```

**Obsługa błędów:**
- 400: Bad Request (nieprawidłowy format pliku, brak parametrów)
- 401: Unauthorized
- 403: Forbidden (użytkownik nie należy do grupy)
- 404: Not Found (grupa nie istnieje)
- 413: Payload Too Large (plik > 25MB)
- 500: Internal Server Error
- 503: Service Unavailable (usługa AI niedostępna)

### 7.3. Status zadania transkrypcji (GET /api/expenses/transcribe/:taskId)
Endpoint do sprawdzania statusu przetwarzania transkrypcji i pobierania wyników.

**Żądanie (Request):**
```typescript
GET /api/expenses/transcribe/:taskId
Authorization: Bearer <token>
```

**Odpowiedź (Response):**
```typescript
200 OK
Content-Type: application/json

Body: TranscribeTaskStatusDTO {
  task_id: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
  completed_at?: string;     // jeśli status = completed lub failed
  result?: TranscriptionResultDTO;  // jeśli status = completed
  error?: TranscriptionErrorDTO;    // jeśli status = failed
}

// Gdy status = "completed":
result: {
  transcription: string;     // surowy tekst transkrypcji
  expense_data: CreateExpenseCommand;  // wyekstrahowane dane
  confidence: number;        // 0-1, poziom pewności AI
}

// Gdy status = "failed":
error: {
  code: string;              // "TRANSCRIPTION_FAILED", "INVALID_AUDIO", "AI_ERROR"
  message: string;           // komunikat błędu
}
```

**Obsługa błędów:**
- 401: Unauthorized
- 404: Not Found (zadanie nie istnieje lub nie należy do użytkownika)
- 500: Internal Server Error

### 7.4. Przepływ integracji dla dodawania głosem

1. **Nagrywanie:** Użytkownik klika VoiceInputButton → useAudioRecorder.startRecording()
2. **Zakończenie nagrywania:** Użytkownik klika stop → useAudioRecorder.stopRecording() → zwraca audioBlob
3. **Upload:** useVoiceTranscription.uploadAudio(audioBlob, groupId) → POST /api/expenses/transcribe → otrzymuje task_id
4. **Polling:** VoiceTranscriptionStatus co 1s wywołuje GET /api/expenses/transcribe/:taskId
5. **Sukces:** Gdy status = "completed" → VoiceTranscriptionStatus.onComplete(result) → ExpenseForm.populateFromTranscription(result.expense_data)
6. **Weryfikacja:** Użytkownik edytuje wypełniony formularz (opcjonalnie)
7. **Zatwierdzenie:** Użytkownik klika "Dodaj wydatek" → POST /api/groups/:groupId/expenses z danymi z formularza

## 8. Interakcje użytkownika

### 8.1. Przepływ ręcznego dodawania wydatku
1. **Otwarcie modala:** Załadowanie danych grupy (członkowie, waluty) przez API call
2. **Wypełnienie pól podstawowych:** Walidacja formatów w czasie rzeczywistym przez React Hook Form + Zod
3. **Wybór waluty:** Dostępne waluty z grupy, domyślnie pierwsza dostępna
4. **Wybór płatnika:** Lista aktywnych członków grupy, domyślnie aktualny użytkownik
5. **Wprowadzanie kwot podziału:** Dla każdego członka grupy można wprowadzić kwotę (uczestnicy to osoby z kwotą > 0)
6. **Podziel po równo:** Przycisk automatycznie dzieli kwotę równo między wszystkich członków grupy
7. **Wprowadzanie kwot własnych:** Real-time walidacja sumy podziałów
8. **Wysyłanie formularza:** Końcowa walidacja, API call, toast success/error, zamknięcie modala

### 8.2. Przepływ dodawania wydatku głosem
1. **Rozpoczęcie nagrywania:**
   - Użytkownik klika ikonę mikrofonu w VoiceInputButton
   - System prosi o uprawnienia do mikrofonu (jeśli nie nadane wcześniej)
   - Po udzieleniu uprawnień rozpoczyna się nagrywanie
   - Widoczny jest VoiceRecordingIndicator z timerem

2. **Podczas nagrywania:**
   - Użytkownik mówi polecenie, np. "Ja zapłaciłem 100 złotych za zakupy dla mnie i Ani"
   - Timer pokazuje czas nagrywania (max 60 sekund)
   - Użytkownik może anulować nagrywanie przyciskiem "Anuluj"
   - Użytkownik może zakończyć nagrywanie przyciskiem "Zatrzymaj" lub po 60 sekundach

3. **Upload i przetwarzanie:**
   - Po zakończeniu nagrywania, audioBlob jest automatycznie wysyłany do API
   - Wyświetla się VoiceTranscriptionStatus ze wskaźnikiem ładowania
   - Komunikat: "Transkrybuję nagranie..." (faza 1: Whisper)
   - Komunikat: "Analizuję dane wydatku..." (faza 2: LLM)

4. **Polling statusu:**
   - Co 1 sekundę komponent VoiceTranscriptionStatus odpytuje endpoint GET /api/expenses/transcribe/:taskId
   - Użytkownik widzi wskaźnik postępu

5. **Sukces transkrypcji:**
   - Gdy status = "completed", formularz jest automatycznie wypełniany danymi z result.expense_data
   - Pola formularza: opis, kwota, waluta, data, płatnik, podział - wszystkie wypełnione
   - Użytkownik widzi toast "Wydatek wypełniony automatycznie. Sprawdź i zatwierdź."
   - VoiceTranscriptionStatus znika, pokazuje się wypełniony formularz

6. **Weryfikacja i edycja:**
   - Użytkownik może edytować wszystkie pola wypełnione przez AI
   - Szczególnie może skorygować podział kosztów między uczestników
   - Real-time walidacja działa jak przy ręcznym dodawaniu

7. **Zatwierdzenie:**
   - Użytkownik klika "Dodaj wydatek"
   - Standardowy przepływ wysyłania formularza (POST /api/groups/:groupId/expenses)
   - Toast success, zamknięcie modala

### 8.3. Obsługa błędów głosowych
1. **Brak uprawnień do mikrofonu:**
   - Toast error: "Brak dostępu do mikrofonu. Sprawdź ustawienia przeglądarki."
   - VoiceInputButton pozostaje dostępny do ponownej próby

2. **Błąd nagrywania:**
   - Toast error: "Błąd nagrywania. Spróbuj ponownie."
   - Możliwość ponownego kliknięcia VoiceInputButton

3. **Błąd uploadu (plik za duży, błąd sieci):**
   - Toast error: "Nie udało się wysłać nagrania. Spróbuj ponownie."
   - VoiceTranscriptionStatus znika, VoiceInputButton dostępny

4. **Błąd transkrypcji (AI nie rozpoznało, zły format audio):**
   - VoiceTranscriptionStatus pokazuje błąd: "Nie udało się przetworzyć nagrania"
   - Szczegóły błędu z API (jeśli dostępne)
   - Przycisk "Spróbuj ponownie" lub "Dodaj ręcznie"

5. **Timeout (transkrypcja trwa > 60s):**
   - VoiceTranscriptionStatus pokazuje: "Przetwarzanie trwa zbyt długo"
   - Opcja "Dodaj ręcznie" lub "Anuluj"

### 8.4. Dodatkowe interakcje
- **Przełączanie między metodami:** Użytkownik może w każdej chwili przełączyć się z głosu na ręczne dodawanie (anulowanie nagrywania/transkrypcji)
- **Zamknięcie modala:** Podczas nagrywania/transkrypcji pojawia się dialog potwierdzenia "Czy na pewno chcesz anulować?"
- **Walidacja confidence:** Jeśli confidence < 0.5, toast warning: "Wyniki mogą być niedokładne. Sprawdź wszystkie pola."

## 9. Warunki i walidacja
Warunki weryfikowane przez komponenty wpływają na stan UI poprzez disabled/enabled przyciski oraz wyświetlanie błędów:

### 9.1. Walidacja formularza (ręczna i po transkrypcji)
- **ExpenseForm:** 
  - Walidacja wszystkich pól + suma podziałów
  - Submit button disabled gdy: błędy walidacji lub isSubmitting = true lub splitValidation.isValid = false
  - Jeśli isFromVoice = true: wyświetlany badge "Wypełnione głosem"

- **ExpenseBasicInfo:** 
  - Walidacja opisu: 1-500 znaków, wymagany
  - Walidacja kwoty: > 0, max 2 miejsca po przecinku, wymagana
  - Walidacja daty: format ISO 8601, wymagana
  - Walidacja płatnika: UUID z listy członków grupy, wymagany
  - Pola z błędami podświetlone na czerwono

- **ExpenseSplitSection:** 
  - Deleguje walidację do SimpleSplitInput
  - Wyświetla wizualne podsumowanie: "Suma: X / Y" gdzie X = suma splits, Y = amount

- **SimpleSplitInput:** 
  - Suma kwot = całkowita kwota (±0.01 tolerancja)
  - Wizualne wskazanie pozostałej kwoty do rozdzielenia
  - Podświetlenie na zielono gdy suma zgadza się
  - Podświetlenie na czerwono gdy suma nie zgadza się
  - Walidacja pojedynczych kwot: >= 0, max 2 miejsca po przecinku

- **CurrencySelector:** 
  - Waluta dostępna w grupie (z group_currencies)
  - Select pokazuje tylko dostępne waluty
  - Disabled gdy brak walut w grupie

### 9.2. Walidacja głosowa
- **VoiceInputButton:**
  - Disabled gdy: isRecording = true lub isProcessing = true lub isSubmitting = true
  - Sprawdzenie uprawnień do mikrofonu przed rozpoczęciem nagrywania
  - Walidacja rozmiaru audioBlob: max 25MB (jeśli większy, toast error i blokada uploadu)

- **VoiceRecordingIndicator:**
  - Automatyczne zatrzymanie nagrywania po maxDuration (60s)
  - Blokada przycisku "Stop" przez pierwsze 0.5s nagrywania (zapobieganie przypadkowemu kliknięciu)

- **VoiceTranscriptionStatus:**
  - Timeout pollingu: max 60 sekund (jeśli status wciąż "processing", pokazuje błąd timeout)
  - Walidacja odpowiedzi API: sprawdzenie poprawności struktury TranscribeTaskStatusDTO
  - Walidacja confidence: jeśli < 0.5, wyświetlenie ostrzeżenia o niskiej pewności

- **ExpenseForm.populateFromTranscription:**
  - Walidacja expense_data przed wypełnieniem formularza
  - Sprawdzenie, czy wszystkie wymagane pola są wypełnione
  - Sprawdzenie, czy payer_id i profile_id w splits należą do członków grupy
  - Sprawdzenie, czy currency_code jest dostępny w grupie
  - Jeśli walidacja nie przechodzi, toast error i pozostawienie pustego formularza

### 9.3. Warunki API
Wszystkie warunki są walidowane zarówno po stronie klienta (UX) jak i serwera (bezpieczeństwo):

- **Tworzenie wydatku:**
  - Suma splits = amount (±0.01)
  - Wszystkie profile_id w splits należą do członków grupy
  - payer_id należy do członków grupy
  - currency_code dostępny w group_currencies
  - amount > 0, max 2 miejsca po przecinku
  - description: 1-500 znaków

- **Upload audio:**
  - Rozmiar pliku <= 25MB
  - Format MIME: audio/*
  - group_id istnieje i użytkownik należy do grupy

- **Status transkrypcji:**
  - task_id istnieje i należy do użytkownika
  - Wynik dostępny tylko gdy status = "completed"

## 10. Obsługa błędów

### 10.1. Błędy formularza (ręczne i po transkrypcji)
- **Błędy walidacji formularza:** Wyświetlanie pod polami przez React Hook Form
- **Błędy API tworzenia wydatku:** Toast notifications przez Sonner z Shadcn/ui
- **Błędy sieci:** Retry logic + fallback messages
- **Błędy biznesowe:** Specyficzne komunikaty (np. "Uczestnik nie należy do grupy")
- **Edge cases:** Brak członków grupy (modal informacyjny), brak walut (disabled selector)

### 10.2. Błędy funkcjonalności głosowej

#### Błędy uprawnień i sprzętu
- **Brak uprawnień do mikrofonu:**
  - Komunikat: "Brak dostępu do mikrofonu. Sprawdź ustawienia przeglądarki."
  - Toast error z instrukcją jak nadać uprawnienia
  - VoiceInputButton pozostaje aktywny do ponownej próby

- **Mikrofon niedostępny (sprzętowo):**
  - Komunikat: "Nie znaleziono mikrofonu. Sprawdź podłączenie urządzenia."
  - Toast error
  - VoiceInputButton disabled (póki nie wykryje mikrofonu)

#### Błędy nagrywania
- **Błąd podczas nagrywania (MediaRecorder error):**
  - Komunikat: "Błąd nagrywania. Spróbuj ponownie."
  - Toast error
  - Automatyczne zatrzymanie nagrywania i reset stanu
  - VoiceInputButton dostępny do ponownej próby

- **Nagranie za krótkie (< 1s):**
  - Komunikat: "Nagranie zbyt krótkie. Powiedz więcej szczegółów."
  - Toast warning
  - Brak wysyłania do API, reset stanu

#### Błędy uploadu
- **Plik za duży (> 25MB):**
  - Komunikat: "Nagranie zbyt długie. Spróbuj krótszego opisu."
  - Toast error
  - Blokada uploadu przed wysłaniem
  - Opcja "Dodaj ręcznie"

- **Błąd sieci podczas uploadu:**
  - Komunikat: "Nie udało się wysłać nagrania. Sprawdź połączenie."
  - Toast error z przyciskiem "Spróbuj ponownie"
  - Retry logic (max 3 próby)
  - Po 3 próbach: opcja "Dodaj ręcznie"

- **Błąd 400 (nieprawidłowy format):**
  - Komunikat: "Nieprawidłowy format nagrania. Spróbuj ponownie."
  - Toast error
  - Reset stanu, możliwość nowego nagrania

- **Błąd 403 (brak dostępu do grupy):**
  - Komunikat: "Nie masz dostępu do tej grupy."
  - Toast error
  - Zamknięcie modala (użytkownik nie powinien być w tym widoku)

- **Błąd 413 (plik za duży - weryfikacja serwerowa):**
  - Komunikat: "Nagranie zbyt duże. Maksymalny rozmiar: 25MB."
  - Toast error
  - Reset stanu, opcja "Dodaj ręcznie"

- **Błąd 503 (usługa AI niedostępna):**
  - Komunikat: "Usługa transkrypcji jest tymczasowo niedostępna. Spróbuj później lub dodaj wydatek ręcznie."
  - Toast error z przyciskami "Spróbuj później" i "Dodaj ręcznie"
  - VoiceInputButton disabled przez 5 minut

#### Błędy transkrypcji
- **Błąd przetwarzania (status = "failed"):**
  - Wyświetlenie komunikatu z error.message z API
  - Kody błędów i komunikaty:
    - `TRANSCRIPTION_FAILED`: "Nie udało się przetworzyć nagrania. Spróbuj ponownie."
    - `INVALID_AUDIO`: "Nieprawidłowe nagranie audio. Sprawdź mikrofon."
    - `AI_ERROR`: "Błąd przetwarzania AI. Spróbuj ponownie."
    - `LANGUAGE_NOT_SUPPORTED`: "Wykryto nieobsługiwany język. Użyj języka polskiego."
  - Przyciski: "Spróbuj ponownie" lub "Dodaj ręcznie"

- **Timeout pollingu (> 60s):**
  - Komunikat: "Przetwarzanie trwa zbyt długo. Spróbuj ponownie lub dodaj wydatek ręcznie."
  - Toast error
  - Zatrzymanie pollingu
  - Opcje: "Sprawdź status później" lub "Dodaj ręcznie"

- **Błąd 404 podczas pollingu (zadanie nie istnieje):**
  - Komunikat: "Nie znaleziono zadania transkrypcji."
  - Toast error
  - Reset stanu, możliwość nowego nagrania

#### Błędy walidacji wyników
- **Niepełne dane z AI:**
  - Komunikat: "AI nie rozpoznało wszystkich informacji. Uzupełnij brakujące pola."
  - Toast warning
  - Wypełnienie tylko rozpoznanych pól, pozostałe puste
  - Podświetlenie brakujących pól na żółto

- **Niska pewność (confidence < 0.5):**
  - Komunikat: "Wyniki mogą być niedokładne. Sprawdź wszystkie pola."
  - Toast warning (nie blokuje)
  - Badge "Niska pewność" przy formularzu
  - Wypełnienie formularza z opcją edycji

- **Nierozpoznani uczestnicy:**
  - Komunikat: "Nie rozpoznano uczestnika 'Ania'. Wybierz z listy."
  - Toast warning
  - Wypełnienie pola splits z profile_id = null dla nierozpoznanych
  - Podświetlenie do wyboru z listy

- **Nierozpoznana waluta:**
  - Komunikat: "Nie rozpoznano waluty. Sprawdź pole waluty."
  - Toast warning
  - Ustawienie waluty bazowej grupy jako domyślnej
  - Podświetlenie pola do edycji

### 10.3. Handling strategy
- **Graceful degradation:** Przy błędach transkrypcji, użytkownik zawsze może przejść do ręcznego dodawania
- **User feedback:** Wszystkie błędy komunikowane przez toast z jasnym opisem problemu i sugerowanym rozwiązaniem
- **Error logging:** Wszystkie błędy API i transkrypcji logowane po stronie serwera dla debugowania
- **Retry logic:** Automatyczne retry (max 3 próby) dla błędów sieciowych uploadu
- **Fallback UI:** W przypadku błędów krytycznych, zawsze dostępna opcja "Dodaj ręcznie"

## 11. Kroki implementacji

### Faza 1: Fundament (już zrealizowane)
1. ✅ Utworzyć schematy Zod w `src/lib/schemas/expenseSchemas.ts` dla walidacji formularza
2. ✅ Zaimplementować hook `useExpenseForm` w `src/lib/hooks/useExpenseForm.ts`
3. ✅ Stworzyć komponenty podrzędne (ExpenseBasicInfo, ExpenseSplitSection, SimpleSplitInput, CurrencySelector)
4. ✅ Zaimplementować główny `ExpenseForm` z integracją React Hook Form
5. ✅ Utworzyć `AddExpenseModal` jako wrapper z Dialog
6. ✅ Dodać wywołania API w serwisie `src/lib/services/expenseService.ts`
7. ✅ Zintegrować modal z istniejącym widokiem grupy

### Faza 2: Backend dla transkrypcji (prerequisite)
8. Zaimplementować endpoint `POST /api/expenses/transcribe` (upload audio)
9. Zaimplementować endpoint `GET /api/expenses/transcribe/:taskId` (status zadania)
10. Skonfigurować Edge Function w Supabase dla przetwarzania AI
11. Zintegrować z Openrouter.ai (Whisper + LLM)
12. Zaimplementować cache/storage dla wyników transkrypcji
13. Przetestować backend endpoints z przykładowymi plikami audio

### Faza 3: Hooki audio i transkrypcji
14. Zaimplementować `useAudioRecorder` w `src/lib/hooks/useAudioRecorder.ts`:
    - Integracja z MediaRecorder API
    - Zarządzanie stanem nagrywania
    - Timer i limity czasowe
    - Obsługa uprawnień do mikrofonu
15. Zaimplementować `useVoiceTranscription` w `src/lib/hooks/useVoiceTranscription.ts`:
    - Upload audio do API
    - Polling statusu zadania
    - Zarządzanie błędami i retry logic
16. Dodać funkcje API w `src/lib/services/expenseTranscriptionService.ts`:
    - `uploadAudioForTranscription(audioBlob, groupId)`
    - `getTranscriptionTaskStatus(taskId)`
    - Obsługa FormData i multipart/form-data

### Faza 4: Komponenty głosowe
17. Stworzyć `VoiceInputButton.tsx`:
    - Przycisk z ikoną mikrofonu
    - Stany: idle, recording, processing
    - Integracja z useVoiceTranscription
18. Stworzyć `VoiceRecordingIndicator.tsx`:
    - Animowana ikona mikrofonu podczas nagrywania
    - Timer nagrywania
    - Przyciski Stop i Anuluj
19. Stworzyć `VoiceTranscriptionStatus.tsx`:
    - Wskaźnik postępu przetwarzania
    - Polling statusu zadania co 1s
    - Komunikaty o fazach transkrypcji
    - Obsługa błędów i timeoutów

### Faza 5: Integracja głosu z formularzem
20. Zaktualizować `useExpenseForm`:
    - Dodać metodę `populateFromTranscription(data: CreateExpenseCommand)`
    - Obsługa `initialData` prop
    - Walidacja danych z transkrypcji przed wypełnieniem
21. Zaktualizować `ExpenseForm`:
    - Dodać props `initialData` i `isFromVoice`
    - Wyświetlanie badge "Wypełnione głosem"
    - Obsługa callback'a z VoiceTranscriptionStatus
22. Zaktualizować `AddExpenseModal`:
    - Dodać VoiceInputButton w nagłówku modala
    - Orchestracja między nagrywaniem a formularzem
    - Obsługa stanu: recording → processing → form populated
    - Walidacja confidence i ostrzeżenia

### Faza 6: Walidacja i obsługa błędów
23. Dodać walidacje dla funkcjonalności głosowej:
    - Sprawdzenie rozmiaru pliku audio (max 25MB)
    - Walidacja uprawnień do mikrofonu
    - Walidacja minimalnego czasu nagrania (1s)
24. Zaimplementować obsługę błędów:
    - Toast notifications dla wszystkich błędów
    - Komunikaty specyficzne dla kodów błędów API
    - Retry logic dla błędów sieciowych
    - Fallback do ręcznego dodawania
25. Dodać testy walidacji confidence:
    - Warning toast gdy confidence < 0.5
    - Badge "Niska pewność" w formularzu
    - Podświetlenie pól wymagających weryfikacji

### Faza 7: UX i optymalizacje
26. Dodać animacje i transitions:
    - Pulsująca ikona mikrofonu podczas nagrywania
    - Smooth transition między stanami
    - Progress bar dla pollingu
27. Zoptymalizować polling:
    - Exponential backoff (1s → 2s → 5s)
    - Maksymalny czas pollingu 60s
28. Dodać feedback wizualny:
    - Loading states dla wszystkich asynchronicznych operacji
    - Disable przyciski podczas przetwarzania
    - Indykatory postępu

### Faza 8: Testowanie
29. Testy jednostkowe:
    - `useAudioRecorder.test.ts` (mock MediaRecorder)
    - `useVoiceTranscription.test.ts` (mock fetch)
    - `VoiceInputButton.test.tsx`
    - `VoiceTranscriptionStatus.test.tsx`
30. Testy integracyjne:
    - Pełny przepływ: nagrywanie → upload → polling → wypełnienie
    - Różne scenariusze błędów
    - Edge cases (uprawnienia, timeout, niepełne dane)
31. Testy end-to-end:
    - Realne nagrania audio z różnymi poleceniami
    - Walidacja wypełnienia formularza
    - Test zatwierdzania wydatku po transkrypcji
32. Testy UX:
    - Testy z użytkownikami
    - Weryfikacja komunikatów błędów
    - Optymalizacja czasu przetwarzania

### Faza 9: Dokumentacja i deployment
33. Dokumentacja:
    - Aktualizacja tego planu implementacji
    - Dokumentacja API dla endpointów transkrypcji
    - Przykłady użycia hooków
34. Code review i refactoring
35. Deployment i monitoring:
    - Monitoring błędów transkrypcji
    - Analityka użycia funkcji głosowej
    - Metryki sukcesu (MS-002, MS-003, MS-004)
