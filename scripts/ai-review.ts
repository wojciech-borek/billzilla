#!/usr/bin/env node

// For now, let's create a simple version that just logs
/* eslint-disable no-console */
import { writeFileSync } from "fs";
import { join } from "path";
import type { AiReviewReport } from "../src/lib/schemas/aiReview";

// Simple type definitions for AI Review
interface _ReviewResult {
  category: string;
  criterion: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  details?: string;
  recommendation?: string;
}

async function getChangedFiles(): Promise<string[]> {
  // Najpierw sprawdź czy mamy zmienną środowiskową z listą plików z GitHub API
  if (process.env.CHANGED_FILES) {
    try {
      const changedFiles = JSON.parse(process.env.CHANGED_FILES);
      console.log(`📁 Otrzymano ${changedFiles.length} zmienionych plików z GitHub API:`);
      changedFiles.forEach((file: string) => console.log(`  - ${file}`));
      return changedFiles;
    } catch (error) {
      console.warn("⚠️  Nie można sparsować CHANGED_FILES jako JSON, próbuję podzielić przez \\n:", error);
      // Fallback dla starszych wersji workflow
      const changedFiles = process.env.CHANGED_FILES.split("\\n").filter((file) => file.trim().length > 0);
      console.log(`📁 Otrzymano ${changedFiles.length} zmienionych plików z GitHub API (fallback):`);
      changedFiles.forEach((file) => console.log(`  - ${file}`));
      return changedFiles;
    }
  }

  const { execSync } = await import("child_process");

  try {
    let diffCommand: string;

    if (process.env.GITHUB_BASE_REF) {
      // Dla PR w CI - porównaj z bazowym branch'em
      const baseRef = process.env.GITHUB_BASE_REF;
      try {
        // Najpierw sprawdź czy gałąź istnieje
        execSync(`git show-ref --verify --quiet refs/remotes/origin/${baseRef}`, { stdio: "ignore" });
        diffCommand = `git diff --name-only origin/${baseRef}`;
      } catch {
        // Fallback jeśli gałąź nie istnieje - porównaj z SHA bazy
        if (process.env.GITHUB_EVENT_PATH) {
          const fs = await import("fs");
          const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
          if (eventData.pull_request?.base?.sha) {
            diffCommand = `git diff --name-only ${eventData.pull_request.base.sha}`;
          } else {
            diffCommand = "git diff --name-only HEAD~1";
          }
        } else {
          diffCommand = "git diff --name-only HEAD~1";
        }
      }
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

    console.log(`📁 Znaleziono ${changedFiles.length} zmienionych plików przez git diff:`);
    changedFiles.forEach((file) => console.log(`  - ${file}`));

    return changedFiles;
  } catch (error) {
    console.warn("⚠️  Nie można określić zmienionych plików, wykonuję pełną analizę:", error);
    return [];
  }
}

async function loadProjectRules(): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");

  const ruleFiles = [
    // .cursor/rules files - coding standards
    ".cursor/rules/frontend.mdc",
    ".cursor/rules/backend.mdc",
    ".cursor/rules/shared.mdc",
    ".cursor/rules/react.mdc",
    ".cursor/rules/astro.mdc",
    ".cursor/rules/vitest-unit-testing.mdc",
    ".cursor/rules/playwright-e2e-testing.mdc",
    ".cursor/rules/api-supabase-astro-init.mdc",
    ".cursor/rules/bllzilla-ui-guidelines.md",
    ".cursor/rules/db-supabase-migrations.mdc",
    ".cursor/rules/github-action.mdc",
    ".cursor/rules/ui-shadcn-helper.mdc",
    // .ai files - project documentation
    ".ai/tech-stack.md",
    ".ai/prd.md",
    ".ai/api-plan.md",
    ".ai/auth-spec.md",
    ".ai/db-plan.md",
    ".ai/test-plan.md",
    ".ai/ui-plan.md",
    ".ai/ui-plan.md",
    "README.md",
    "CONTRIBUTING.md",
  ];

  let rules = "";

  for (const filePath of ruleFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        rules += `\n\n=== ${filePath.toUpperCase()} ===\n${content}`;
      }
    } catch (error) {
      console.warn(`⚠️  Nie można wczytać pliku zasad ${filePath}:`, error);
    }
  }

  return rules;
}

async function performStandardsReview(
  changedFiles: string[],
  projectRules: string,
  apiKey: string
): Promise<AiReviewReport> {
  // Użyj AiReviewService zamiast własnej implementacji
  const { AiReviewService } = await import("../src/lib/services/aiReviewService.ts");
  const { OpenRouterService } = await import("../src/lib/services/openRouterService.ts");

  const openRouterService = new OpenRouterService({ apiKey });
  const reviewService = new AiReviewService(openRouterService);

  try {
    console.log("🔍 Wykonuję analizę PR używając AiReviewService...");
    return await reviewService.performPullRequestReview(changedFiles, "", projectRules);
  } catch (error) {
    console.error("❌ Błąd podczas analizy AI:", error);

    // Zwróć podstawowy raport w przypadku błędu
    return {
      projectName: "billzilla",
      timestamp: new Date().toISOString(),
      overallScore: 50,
      criteria: {
        techStack: {
          astroVersion: "unknown",
          typescriptVersion: "unknown",
          reactVersion: "unknown",
          tailwindVersion: "unknown",
          shadcnUi: false,
          supabase: false,
          vitest: false,
          playwright: false,
        },
        projectStructure: {
          hasLayouts: false,
          hasPages: false,
          hasComponents: false,
          hasLib: false,
          hasDb: false,
          hasMiddleware: false,
          properDirectoryStructure: false,
        },
        codeQuality: {
          errorHandling: false,
          earlyReturns: false,
          guardClauses: false,
          typeSafety: false,
          properImports: false,
        },
        testing: {
          unitTestCoverage: 0,
          e2eTests: false,
          testOrganization: false,
        },
        aiImplementation: {
          openRouterService: false,
          openAiWhisperService: false,
          voiceExpenseFlow: false,
        },
      },
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

      // Pobierz zmienione pliki, kontekst projektu i zasady
      const changedFiles = await getChangedFiles();
      const projectContext = await loadProjectContext();
      const projectRules = await loadProjectRules();

      console.log(`📄 Załadowano ${projectContext.length} znaków kontekstu projektu`);
      console.log(`📚 Załadowano ${projectRules.length} znaków zasad projektu`);

      // Dynamic import to load TypeScript modules
      const { AiReviewService } = await import("../src/lib/services/aiReviewService.ts");
      const { OpenRouterService } = await import("../src/lib/services/openRouterService.ts");

      const openRouterService = new OpenRouterService({ apiKey: openRouterApiKey });
      const reviewService = new AiReviewService(openRouterService);

      if (changedFiles.length > 0) {
        // Analizuj tylko zmienione pliki z PR
        console.log("🔍 Analizuję tylko zmienione pliki z PR...");
        report = await reviewService.performPullRequestReview(changedFiles, projectContext, projectRules);
      } else {
        // Fallback do kompleksowej analizy jeśli nie można określić zmienionych plików
        console.log("⚠️  Nie można określić zmienionych plików, wykonuję pełną analizę...");
        report = await reviewService.performComprehensiveReview(projectRules);
      }
    } else {
      // W lokalnym rozwoju, sprawdź zgodność zmienionego kodu ze standardami
      console.log("🔍 Sprawdzam zgodność zmienionego kodu ze standardami dokumentacji...");

      const changedFiles = await getChangedFiles();
      const projectRules = await loadProjectRules();

      console.log(`📚 Załadowano ${projectRules.length} znaków zasad projektu`);

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
        report = await performStandardsReview(changedFiles, projectRules, openRouterApiKey);
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
