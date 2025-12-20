/**
 * Chat Texts Configuration
 *
 * All static text strings used in chat UI components
 * Centralized for easy maintenance and potential i18n in future
 */

export const CHAT_TEXTS = {
  /**
   * Loading text for each function call
   * Displayed while AI is processing the request
   */
  loadingStates: {
    get_member_balances: "Sprawdzam salda uczestników...",
    get_expenses_summary: "Analizuję wydatki z wybranego okresu...",
    search_expenses: "Szukam transakcji...",
    analyze_spending_trends: "Porównuję okresy i identyfikuję trendy...",
    get_top_expenses: "Sortuję największe wydatki...",
    get_member_statistics: "Obliczam statystyki uczestników...",
    generate_group_report: "Generuję raport finansowy...",
  },

  /**
   * Error messages for different HTTP status codes
   */
  errors: {
    400: "Nie rozumiem tego zapytania. Spróbuj przeformułować pytanie.",
    401: "Sesja wygasła. Zaloguj się ponownie.",
    403: "Nie masz dostępu do tej grupy.",
    404: "Nie znaleziono danych. Sprawdź parametry zapytania.",
    429: "Przekroczono limit zapytań (100/dzień). Spróbuj jutro.",
    500: "Coś poszło nie tak. Spróbuj ponownie za chwilę.",
    default: "Wystąpił nieznany błąd. Spróbuj ponownie.",
  },

  /**
   * Common UI labels
   */
  labels: {
    currency: "Waluta",
    balance: "Saldo",
    total: "Łącznie",
    date: "Data",
    member: "Uczestnik",
    amount: "Kwota",
    description: "Opis",
    paidBy: "Zapłacił",
    seeDetails: "Zobacz szczegóły",
    seeAllTransactions: "Zobacz wszystkie transakcje",
    loadMore: "Wczytaj więcej",
    retry: "Spróbuj ponownie",
    found: "Znaleziono",
  },

  /**
   * Balance card specific texts
   */
  balances: {
    title: "Salda uczestników",
    owesYou: "Jest Ci winien/winna",
    youOwe: "Jesteś winien/winna",
    settled: "Rozliczony",
    viewSettlements: "Zobacz szczegóły rozliczeń →",
  },

  /**
   * Expense summary card specific texts
   */
  summary: {
    title: "Podsumowanie wydatków",
    totalAmount: "Łączna kwota",
    memberBreakdown: "Podział na uczestników:",
    viewAll: "Zobacz wszystkie transakcje",
  },

  /**
   * Expense list card specific texts
   */
  expenseList: {
    title: "Wyniki wyszukiwania",
  },

  /**
   * Trend analysis card specific texts
   */
  trends: {
    title: "Analiza trendów",
    increase: "Wzrost wydatków",
    decrease: "Spadek wydatków",
    noChange: "Bez zmian",
    insight: "Insight:",
  },
} as const;
