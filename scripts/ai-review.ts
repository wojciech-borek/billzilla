#!/usr/bin/env node

// For now, let's create a simple version that just logs
/* eslint-disable no-console */
import { writeFileSync } from "fs";
import { join } from "path";

// Simple type definitions for AI Review
interface ReviewResult {
  category: string;
  criterion: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  details?: string;
  recommendation?: string;
}

interface AiReviewReport {
  projectName: string;
  timestamp: string;
  overallScore: number;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: ReviewResult[];
}

async function getChangedFiles(): Promise<string[]> {
  const { execSync } = await import("child_process");

  try {
    let diffCommand: string;

    if (process.env.GITHUB_BASE_REF) {
      // Dla PR w CI - porównaj z bazowym branch'em
      diffCommand = `git diff --name-only origin/${process.env.GITHUB_BASE_REF}`;
    } else if (process.env.GITHUB_EVENT_PATH) {
      // Alternatywnie, można sparsować event JSON
      const fs = await import("fs");
      const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));

      if (eventData.pull_request) {
        const baseSha = eventData.pull_request.base.sha;
        diffCommand = `git diff --name-only ${baseSha}`;
      } else {
        diffCommand = "git diff --name-only HEAD~1";
      }
    } else {
      // Dla lokalnego developmentu - sprawdź niezatwierdzone zmiany
      try {
        execSync("git diff --quiet", { stdio: "ignore" });
        // Jeśli nie ma niezapisanych zmian, sprawdź ostatni commit
        diffCommand = "git diff --name-only HEAD~1";
      } catch {
        // Są niezapisane zmiany - sprawdź working directory
        diffCommand = "git diff --name-only";
      }
    }

    const changedFiles = execSync(diffCommand, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter((file) => file.length > 0);

    console.log(`📁 Znaleziono ${changedFiles.length} zmienionych plików:`);
    changedFiles.forEach((file) => console.log(`  - ${file}`));

    return changedFiles;
  } catch (error) {
    console.warn("⚠️  Nie można określić zmienionych plików, wykonuję pełną analizę:", error);
    return [];
  }
}

async function loadProjectStandards(): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");

  const standardsFiles = [
    ".cursor/rules/frontend.mdc",
    ".cursor/rules/backend.mdc",
    ".cursor/rules/shared.mdc",
    ".cursor/rules/react.mdc",
    ".cursor/rules/astro.mdc",
    ".cursor/rules/vitest-unit-testing.mdc",
    ".cursor/rules/playwright-e2e-testing.mdc",
    ".ai/tech-stack.md",
    ".ai/prd.md",
    "README.md",
    "CONTRIBUTING.md",
  ];

  let standards = "";

  for (const filePath of standardsFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        standards += `\n\n=== STANDARDY: ${filePath} ===\n${content}`;
      }
    } catch (error) {
      console.warn(`⚠️  Nie można wczytać pliku standardów ${filePath}:`, error);
    }
  }

  return standards;
}

async function performStandardsReview(
  changedFiles: string[],
  standards: string,
  apiKey: string
): Promise<AiReviewReport> {
  const fs = await import("fs");
  const path = await import("path");

  // Przeczytaj zawartość zmienionych plików
  let codeContent = "";
  for (const file of changedFiles) {
    try {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        codeContent += `\n\n=== PLIK: ${file} ===\n${content}`;
      }
    } catch (error) {
      console.warn(`⚠️  Nie można przeczytać pliku ${file}:`, error);
    }
  }

  // Przygotuj prompt dla AI
  const prompt = `
Jesteś ekspertem w analizie kodu i recenzji programistycznej. Twoim zadaniem jest sprawdzić zgodność zmienionego kodu ze standardami projektu.

STANDARDY PROJEKTU:
${standards}

ZMIENIONY KOD:
${codeContent}

Przeanalizuj każdy zmieniony plik i sprawdź jego zgodność ze standardami projektu. Zwróć uwagę na:

1. **Architektura i struktura kodu** - czy kod jest zorganizowany zgodnie z zasadami projektu?
2. **Konwencje nazewnictwa** - czy nazwy zmiennych, funkcji, klas są zgodne ze standardami?
3. **Obsługa błędów** - czy błędy są prawidłowo obsługiwane?
4. **Dokumentacja** - czy kod jest odpowiednio udokumentowany?
5. **Zgodność z frameworkami** - czy kod używa właściwych wzorców dla React/Astro/TypeScript?
6. **Testowanie** - czy kod zawiera odpowiednie testy?
7. **Bezpieczeństwo** - czy kod jest bezpieczny?

Dla każdej znalezionej niezgodności lub problemu podaj:
- Kategorię problemu
- Dokładny opis problemu
- Rekomendację jak to naprawić

Zwróć wynik w formacie JSON z następującymi polami:
{
  "projectName": "billzilla",
  "timestamp": "${new Date().toISOString()}",
  "overallScore": <liczba 0-100>,
  "results": [
    {
      "category": "<kategoria problemu>",
      "criterion": "<dokładny opis problemu>",
      "status": "PASS|FAIL|WARN",
      "message": "<krótki opis>",
      "details": "<szczegółowy opis problemu>",
      "recommendation": "<jak naprawić>"
    }
  ]
}

Jeśli nie znajdziesz poważnych problemów, ustaw overallScore na 80-100. Jeśli znajdziesz poważne problemy, obniż score odpowiednio.
`.trim();

  try {
    // Wywołaj OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Spróbuj parsować JSON z odpowiedzi AI
    let report: AiReviewReport;
    try {
      // Znajdź JSON w odpowiedzi (AI może dodać tekst przed/po)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      } else {
        report = JSON.parse(aiResponse);
      }
    } catch (_parseError) {
      // Jeśli parsowanie się nie powiedzie, stwórz podstawowy raport
      console.warn("⚠️  Nie można sparsować odpowiedzi AI, tworzę podstawowy raport");
      report = {
        projectName: "billzilla",
        timestamp: new Date().toISOString(),
        overallScore: 75,
        summary: {
          totalChecks: 1,
          passed: 0,
          failed: 1,
          warnings: 0,
        },
        results: [
          {
            category: "AI Analysis",
            criterion: "Response parsing",
            status: "FAIL",
            message: "Nie można sparsować odpowiedzi AI",
            details: `Odpowiedź AI: ${aiResponse.substring(0, 500)}...`,
            recommendation: "Sprawdź połączenie z OpenRouter API",
          },
        ],
      };
    }

    // Uzupełnij summary jeśli nie zostało ustawione
    if (!report.summary) {
      const passed = report.results.filter((r) => r.status === "PASS").length;
      const failed = report.results.filter((r) => r.status === "FAIL").length;
      const warnings = report.results.filter((r) => r.status === "WARN").length;

      report.summary = {
        totalChecks: report.results.length,
        passed,
        failed,
        warnings,
      };
    }

    return report;
  } catch (error) {
    console.error("❌ Błąd podczas analizy AI:", error);
    // Zwróć podstawowy raport w przypadku błędu
    return {
      projectName: "billzilla",
      timestamp: new Date().toISOString(),
      overallScore: 50,
      summary: {
        totalChecks: 1,
        passed: 0,
        failed: 1,
        warnings: 0,
      },
      results: [
        {
          category: "AI Analysis",
          criterion: "API Connection",
          status: "FAIL",
          message: "Błąd połączenia z AI",
          details: error instanceof Error ? error.message : "Nieznany błąd",
          recommendation: "Sprawdź połączenie internetowe i klucz API OpenRouter",
        },
      ],
    };
  }
}

async function loadProjectContext(): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");

  const contextFiles = [
    ".ai/tech-stack.md",
    ".ai/prd.md",
    ".cursor/rules/frontend.mdc",
    ".cursor/rules/backend.mdc",
    ".cursor/rules/shared.mdc",
  ];

  let context = "";

  for (const filePath of contextFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        context += `\n\n=== ${filePath} ===\n${content}`;
      }
    } catch (error) {
      console.warn(`⚠️  Could not load context file ${filePath}:`, error);
    }
  }

  return context;
}

async function main() {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const isCI = process.env.CI === "true";

  console.log("🤖 Rozpoczynam przegląd zgodności AI...");
  console.log("Środowisko:", isCI ? "CI" : "Lokalny rozwój");

  if (!openRouterApiKey) {
    console.error("❌ Wymagana jest zmienna środowiskowa OPENROUTER_API_KEY");
    process.exit(1);
  }

  try {
    let report;

    if (isCI) {
      // W środowisku CI, użyj pełnej implementacji
      console.log("Używam pełnej implementacji przeglądu AI...");

      // Pobierz zmienione pliki i kontekst projektu
      const changedFiles = await getChangedFiles();
      const projectContext = await loadProjectContext();

      console.log(`📄 Załadowano ${projectContext.length} znaków kontekstu projektu`);

      // Dynamic import to load TypeScript modules
      const { AiReviewService } = await import("../src/lib/services/aiReviewService.ts");
      const { OpenRouterService } = await import("../src/lib/services/openRouterService.ts");

      const openRouterService = new OpenRouterService({ apiKey: openRouterApiKey });
      const reviewService = new AiReviewService(openRouterService);

      if (changedFiles.length > 0) {
        // Analizuj tylko zmienione pliki z PR
        console.log("🔍 Analizuję tylko zmienione pliki z PR...");
        report = await reviewService.performPullRequestReview(changedFiles, projectContext);
      } else {
        // Fallback do kompleksowej analizy jeśli nie można określić zmienionych plików
        console.log("⚠️  Nie można określić zmienionych plików, wykonuję pełną analizę...");
        report = await reviewService.performComprehensiveReview();
      }
    } else {
      // W lokalnym rozwoju, sprawdź zgodność zmienionego kodu ze standardami
      console.log("🔍 Sprawdzam zgodność zmienionego kodu ze standardami dokumentacji...");

      const changedFiles = await getChangedFiles();
      const standards = await loadProjectStandards();

      console.log(`📚 Załadowano ${standards.length} znaków standardów dokumentacji`);

      if (changedFiles.length === 0) {
        console.log("⚠️  Brak zmienionych plików do sprawdzenia.");
        report = {
          projectName: "billzilla",
          timestamp: new Date().toISOString(),
          overallScore: 100,
          summary: { totalChecks: 0, passed: 0, failed: 0, warnings: 0 },
          results: [],
        };
      } else {
        // Przeprowadź analizę zgodności kodu ze standardami używając AI
        console.log("🧠 AI sprawdza zgodność kodu ze standardami...");
        report = await performStandardsReview(changedFiles, standards, openRouterApiKey);
      }
    }

    // Zapisz raport do pliku
    const reportPath = join(process.cwd(), "ai-review-report.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Przegląd AI zakończony. Ogólny wynik: ${report.overallScore}%`);
    console.log(`📄 Raport zapisany do: ${reportPath}`);

    // Wydrukuj podsumowanie
    console.log("\n📋 Podsumowanie:");
    console.log(`   ✅ Przeszedł: ${report.summary.passed}`);
    console.log(`   ⚠️  Ostrzeżenia: ${report.summary.warnings}`);
    console.log(`   ❌ Nie przeszedł: ${report.summary.failed}`);

    // Wydrukuj nieudane sprawdzenia
    const failedChecks = report.results.filter((r) => r.status === "FAIL");
    if (failedChecks.length > 0) {
      console.log("\n❌ Nieudane sprawdzenia:");
      failedChecks.forEach((check) => {
        console.log(`   - ${check.category}: ${check.criterion}`);
        console.log(`     ${check.message}`);
      });
    }

    // Wyjdź z błędem jeśli wynik jest zbyt niski
    if (report.overallScore < 70) {
      console.error(`\n🚨 Zbyt niski wynik zgodności: ${report.overallScore}%. Proszę rozwiązać powyższe problemy.`);
      process.exit(1);
    }

    console.log("\n🎉 Projekt jest zgodny z wymaganiami przeglądu AI!");
  } catch (error) {
    console.error("❌ Przegląd AI nie powiódł się:", error instanceof Error ? error.message : String(error));

    if (!isCI) {
      console.log(
        "\n💡 Wskazówka: Dla pełnej funkcjonalności przeglądu AI, uruchom to w środowisku CI lub najpierw zbuduj projekt."
      );
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Nieoczekiwany błąd:", error);
  process.exit(1);
});
