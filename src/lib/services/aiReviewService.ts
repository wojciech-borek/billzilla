/* eslint-disable no-console */
import { z } from "zod";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, relative } from "path";
import { OpenRouterService } from "./openRouterService";
import type { ReviewCriteria, ReviewResult, AiReviewReport } from "../schemas/aiReview";
import { AiReviewReportSchema } from "../schemas/aiReview";

// Schema for AI-powered code analysis results
const CodeAnalysisResultSchema = z.object({
  errorHandling: z.number().min(0).max(100).describe("Percentage of functions with proper error handling (0-100)"),
  earlyReturns: z.number().min(0).max(100).describe("Percentage of functions using early returns pattern (0-100)"),
  guardClauses: z.number().min(0).max(100).describe("Percentage of functions using guard clauses (0-100)"),
  typeSafety: z.boolean().describe("Whether the code uses proper TypeScript typing"),
  issues: z
    .array(
      z.object({
        type: z.enum(["error", "warning", "info"]),
        message: z.string(),
        line: z.number().optional(),
        suggestion: z.string().optional(),
      })
    )
    .describe("List of specific issues found in the code"),
});

// Schema for structured AI analysis response
const _StructuredAnalysisResultSchema = z.object({
  summary: z.string(),
  severity: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
    info: z.number(),
  }),
  issues: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
      message: z.string(),
      line: z.number().optional(),
      fix: z.string(),
      ruleSuggestion: z.string().optional(),
    })
  ),
  ruleSuggestions: z.array(z.string()).optional(),
});

type StructuredAnalysisIssue = z.infer<typeof _StructuredAnalysisResultSchema>["issues"][0];

interface FileInfo {
  path: string;
  content: string;
  size: number;
  extension: string;
}

export class AiReviewService {
  private openRouterService: OpenRouterService;
  private projectRoot: string;

  constructor(openRouterService: OpenRouterService, projectRoot: string = process.cwd()) {
    this.openRouterService = openRouterService;
    this.projectRoot = projectRoot;
  }

  async performComprehensiveReview(projectRules: string): Promise<AiReviewReport> {
    const timestamp = new Date().toISOString();

    // Analyze project structure and files
    const packageJson = this.readPackageJson();
    const projectFiles = this.scanProjectFiles();

    // Perform individual checks
    const results: ReviewResult[] = [];

    results.push(...(await this.checkTechStack(packageJson)));
    results.push(...(await this.checkProjectStructure(projectFiles)));
    results.push(...(await this.checkTestingSetup(packageJson, projectFiles)));
    results.push(...(await this.checkAiImplementation(projectFiles)));

    // Perform AI-powered code analysis for all code files
    const codeFiles = projectFiles.filter((f) => [".ts", ".tsx", ".astro", ".js", ".jsx"].includes(f.extension));

    console.log(`🤖 Performing comprehensive AI analysis of ${codeFiles.length} code files...`);

    for (const file of codeFiles.slice(0, 10)) {
      // Limit to first 10 files for performance
      try {
        const fileResults = await this.analyzeSingleFile(file, "", projectRules);
        results.push(...fileResults);
      } catch (error) {
        console.warn(`⚠️  Could not analyze file ${file.path}:`, error);
      }
    }

    // Calculate overall score
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const warnings = results.filter((r) => r.status === "WARN").length;
    const totalChecks = results.length;
    const overallScore = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

    const criteria = this.extractCriteriaFromResults(results);

    return AiReviewReportSchema.parse({
      projectName: "billzilla",
      timestamp,
      overallScore,
      criteria,
      results,
      summary: {
        totalChecks,
        passed,
        failed,
        warnings,
      },
    });
  }

  async performPullRequestReview(
    changedFiles: string[],
    projectContext: string,
    projectRules: string
  ): Promise<AiReviewReport> {
    const timestamp = new Date().toISOString();

    // Filter only relevant files (TypeScript, TypeScript React, Astro, etc.)
    const relevantFiles = changedFiles.filter(
      (file) =>
        file.endsWith(".ts") ||
        file.endsWith(".tsx") ||
        file.endsWith(".astro") ||
        file.endsWith(".js") ||
        file.endsWith(".jsx")
    );

    console.log(`🔍 Analyzing ${relevantFiles.length} relevant code files from PR`);

    const results: ReviewResult[] = [];

    if (relevantFiles.length > 0) {
      // Analyze each changed file individually
      for (const filePath of relevantFiles) {
        const fullPath = join(this.projectRoot, filePath);
        try {
          const content = readFileSync(fullPath, "utf-8");
          const fileInfo: FileInfo = {
            path: filePath,
            content,
            size: statSync(fullPath).size,
            extension: extname(filePath),
          };

          const fileResults = await this.analyzeSingleFile(fileInfo, projectContext, projectRules);
          results.push(...fileResults);
        } catch (error) {
          console.warn(`⚠️  Could not analyze file ${filePath}:`, error);
          results.push({
            category: "Code Quality",
            criterion: `File: ${filePath}`,
            status: "WARN",
            message: "Could not analyze file",
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }
    } else {
      results.push({
        category: "Review",
        criterion: "Code Changes",
        status: "PASS",
        message: "No code files changed in this PR",
      });
    }

    // Calculate overall score
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const warnings = results.filter((r) => r.status === "WARN").length;
    const totalChecks = results.length;
    const overallScore = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

    return AiReviewReportSchema.parse({
      projectName: "billzilla",
      timestamp,
      overallScore,
      criteria: {
        techStack: {
          astroVersion: "5.x",
          typescriptVersion: "5.x",
          reactVersion: "19.x",
          tailwindVersion: "4.x",
          shadcnUi: true,
          supabase: true,
          vitest: true,
          playwright: true,
        },
        projectStructure: {
          hasLayouts: true,
          hasPages: true,
          hasComponents: true,
          hasLib: true,
          hasDb: true,
          hasMiddleware: true,
          properDirectoryStructure: true,
        },
        codeQuality: {
          errorHandling: true,
          earlyReturns: true,
          guardClauses: true,
          typeSafety: true,
          properImports: true,
        },
        testing: { unitTestCoverage: 80, e2eTests: true, testOrganization: true },
        aiImplementation: { openRouterService: true, openAiWhisperService: true, voiceExpenseFlow: true },
      },
      results,
      summary: {
        totalChecks,
        passed,
        failed,
        warnings,
      },
    });
  }

  private readPackageJson(): Record<string, unknown> {
    const packageJsonPath = join(this.projectRoot, "package.json");
    if (!existsSync(packageJsonPath)) {
      throw new Error("package.json not found");
    }
    return JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  }

  private scanProjectFiles(): FileInfo[] {
    const files: FileInfo[] = [];
    const scanDirectory = (dir: string) => {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && this.shouldIncludeFile(item)) {
          files.push({
            path: relative(this.projectRoot, fullPath),
            content: this.readFileContent(fullPath),
            size: stat.size,
            extension: extname(item),
          });
        }
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ["node_modules", ".git", "dist", "coverage", "test-results", "playwright-report", ".astro"];
    return skipDirs.includes(dirName) || dirName.startsWith(".");
  }

  private shouldIncludeFile(fileName: string): boolean {
    const includeExtensions = [".ts", ".tsx", ".astro", ".js", ".jsx", ".json", ".md"];
    const extension = extname(fileName);
    return includeExtensions.includes(extension) || fileName === "package.json" || fileName === "tsconfig.json";
  }

  private readFileContent(filePath: string): string {
    try {
      return readFileSync(filePath, "utf-8");
    } catch {
      return "";
    }
  }

  private readAiSpecifications(): FileInfo[] {
    const aiDir = join(this.projectRoot, ".ai");
    if (!existsSync(aiDir)) {
      return [];
    }

    const specs: FileInfo[] = [];
    const scanAiDir = (dir: string) => {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanAiDir(fullPath);
        } else if (stat.isFile()) {
          specs.push({
            path: relative(this.projectRoot, fullPath),
            content: this.readFileContent(fullPath),
            size: stat.size,
            extension: extname(item),
          });
        }
      }
    };

    scanAiDir(aiDir);
    return specs;
  }

  private async checkTechStack(packageJson: Record<string, unknown>): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    // Check Astro version
    const astroVersion = packageJson.dependencies?.astro;
    results.push({
      category: "Tech Stack",
      criterion: "Astro 5.x",
      status: astroVersion?.startsWith("^5.") || astroVersion?.startsWith("5.") ? "PASS" : "FAIL",
      message: `Astro version: ${astroVersion || "not found"}`,
      details: "Project must use Astro 5.x as specified in tech-stack.md",
      recommendation: "Update to Astro 5.x if not already using it",
    });

    // Check TypeScript version
    const tsVersion = packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript;
    results.push({
      category: "Tech Stack",
      criterion: "TypeScript 5.x",
      status: tsVersion?.startsWith("^5.") || tsVersion?.startsWith("5.") ? "PASS" : "FAIL",
      message: `TypeScript version: ${tsVersion || "not found"}`,
      details: "Project must use TypeScript 5.x for type safety",
      recommendation: "Update to TypeScript 5.x",
    });

    // Check React version
    const reactVersion = packageJson.dependencies?.react;
    results.push({
      category: "Tech Stack",
      criterion: "React 19.x",
      status: reactVersion?.startsWith("^19.") || reactVersion?.startsWith("19.") ? "PASS" : "FAIL",
      message: `React version: ${reactVersion || "not found"}`,
      details: "Project must use React 19.x for modern React features",
      recommendation: "Update to React 19.x",
    });

    // Check Tailwind version
    const tailwindVersion = packageJson.dependencies?.tailwindcss;
    results.push({
      category: "Tech Stack",
      criterion: "Tailwind 4.x",
      status: tailwindVersion?.startsWith("^4.") || tailwindVersion?.startsWith("4.") ? "PASS" : "FAIL",
      message: `Tailwind version: ${tailwindVersion || "not found"}`,
      details: "Project must use Tailwind 4.x for utility-first CSS",
      recommendation: "Update to Tailwind 4.x",
    });

    // Check Shadcn/ui presence
    const hasShadcn =
      packageJson.dependencies?.["@radix-ui/react-dialog"] &&
      packageJson.dependencies?.["lucide-react"] &&
      packageJson.dependencies?.["class-variance-authority"];
    results.push({
      category: "Tech Stack",
      criterion: "Shadcn/ui Components",
      status: hasShadcn ? "PASS" : "FAIL",
      message: hasShadcn ? "Shadcn/ui components detected" : "Shadcn/ui components not found",
      details: "Project should use Shadcn/ui for accessible UI components",
      recommendation: "Install and use Shadcn/ui components",
    });

    // Check Supabase
    const hasSupabase =
      packageJson.dependencies?.["@supabase/supabase-js"] || packageJson.devDependencies?.["@supabase/supabase-js"];
    results.push({
      category: "Tech Stack",
      criterion: "Supabase Integration",
      status: hasSupabase ? "PASS" : "FAIL",
      message: hasSupabase ? "Supabase client detected" : "Supabase client not found",
      details: "Project must use Supabase for backend and authentication",
      recommendation: "Install @supabase/supabase-js",
    });

    // Check testing frameworks
    const hasVitest = packageJson.devDependencies?.vitest;
    const hasPlaywright = packageJson.devDependencies?.["@playwright/test"];
    results.push({
      category: "Tech Stack",
      criterion: "Vitest Testing",
      status: hasVitest ? "PASS" : "FAIL",
      message: hasVitest ? "Vitest detected" : "Vitest not found",
      details: "Project must use Vitest for unit testing",
      recommendation: "Install and configure Vitest",
    });

    results.push({
      category: "Tech Stack",
      criterion: "Playwright E2E Testing",
      status: hasPlaywright ? "PASS" : "FAIL",
      message: hasPlaywright ? "Playwright detected" : "Playwright not found",
      details: "Project must use Playwright for E2E testing",
      recommendation: "Install and configure Playwright",
    });

    return results;
  }

  private async checkProjectStructure(files: FileInfo[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    // Check directory structure
    const directories = new Set(files.map((f) => f.path.split("/")[0]));
    const requiredDirs = ["src", "public", "e2e"];
    const hasRequiredDirs = requiredDirs.every((dir) => directories.has(dir));

    results.push({
      category: "Project Structure",
      criterion: "Required Directories",
      status: hasRequiredDirs ? "PASS" : "FAIL",
      message: hasRequiredDirs ? "All required directories present" : "Missing required directories",
      details: `Required: ${requiredDirs.join(", ")}`,
      recommendation: "Ensure all required directories exist",
    });

    // Check src subdirectories
    const srcFiles = files.filter((f) => f.path.startsWith("src/"));
    const srcDirs = new Set(srcFiles.map((f) => f.path.split("/")[1]).filter(Boolean));
    const requiredSrcDirs = ["layouts", "pages", "components", "lib", "db", "middleware"];
    const hasRequiredSrcDirs = requiredSrcDirs.every((dir) => srcDirs.has(dir));

    results.push({
      category: "Project Structure",
      criterion: "Source Directory Structure",
      status: hasRequiredSrcDirs ? "PASS" : "FAIL",
      message: hasRequiredSrcDirs ? "All required src directories present" : "Missing required src directories",
      details: `Required src dirs: ${requiredSrcDirs.join(", ")}`,
      recommendation: "Create missing src subdirectories",
    });

    // Check lib subdirectories
    const libFiles = files.filter((f) => f.path.startsWith("src/lib/"));
    const libDirs = new Set(libFiles.map((f) => f.path.split("/")[2]).filter(Boolean));
    const requiredLibDirs = ["services", "schemas", "hooks", "utils"];
    const hasRequiredLibDirs = requiredLibDirs.every((dir) => libDirs.has(dir));

    results.push({
      category: "Project Structure",
      criterion: "Lib Directory Structure",
      status: hasRequiredLibDirs ? "PASS" : "FAIL",
      message: hasRequiredLibDirs ? "All required lib directories present" : "Missing required lib directories",
      details: `Required lib dirs: ${requiredLibDirs.join(", ")}`,
      recommendation: "Create missing lib subdirectories",
    });

    return results;
  }

  private async checkCodeQuality(files: FileInfo[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    // Analyze TypeScript files for code quality patterns
    const tsFiles = files.filter((f) => [".ts", ".tsx"].includes(f.extension));
    let totalFunctions = 0;
    let functionsWithErrorHandling = 0;
    let functionsWithEarlyReturns = 0;
    let functionsWithGuardClauses = 0;

    for (const file of tsFiles) {
      const analysis = await this.analyzeFileCodeQuality(file);
      totalFunctions += analysis.totalFunctions;
      functionsWithErrorHandling += analysis.errorHandling;
      functionsWithEarlyReturns += analysis.earlyReturns;
      functionsWithGuardClauses += analysis.guardClauses;
    }

    // Error handling check
    const errorHandlingScore = totalFunctions > 0 ? (functionsWithErrorHandling / totalFunctions) * 100 : 0;
    results.push({
      category: "Code Quality",
      criterion: "Error Handling",
      status: errorHandlingScore >= 80 ? "PASS" : errorHandlingScore >= 50 ? "WARN" : "FAIL",
      message: `${functionsWithErrorHandling}/${totalFunctions} functions have error handling (${Math.round(errorHandlingScore)}%)`,
      details: "Functions should handle errors appropriately",
      recommendation: "Add proper error handling to functions",
    });

    // Early returns check
    const earlyReturnsScore = totalFunctions > 0 ? (functionsWithEarlyReturns / totalFunctions) * 100 : 0;
    results.push({
      category: "Code Quality",
      criterion: "Early Returns Pattern",
      status: earlyReturnsScore >= 70 ? "PASS" : earlyReturnsScore >= 40 ? "WARN" : "FAIL",
      message: `${functionsWithEarlyReturns}/${totalFunctions} functions use early returns (${Math.round(earlyReturnsScore)}%)`,
      details: "Use early returns for error conditions",
      recommendation: "Refactor functions to use early returns pattern",
    });

    // Guard clauses check
    const guardClausesScore = totalFunctions > 0 ? (functionsWithGuardClauses / totalFunctions) * 100 : 0;
    results.push({
      category: "Code Quality",
      criterion: "Guard Clauses",
      status: guardClausesScore >= 70 ? "PASS" : guardClausesScore >= 40 ? "WARN" : "FAIL",
      message: `${functionsWithGuardClauses}/${totalFunctions} functions use guard clauses (${Math.round(guardClausesScore)}%)`,
      details: "Use guard clauses for precondition checks",
      recommendation: "Add guard clauses to validate inputs early",
    });

    // Type safety check
    const hasTypeScriptFiles = tsFiles.length > 0;
    const hasStrictTypes = files.some((f) => f.path === "tsconfig.json" && f.content.includes('"strict": true'));
    results.push({
      category: "Code Quality",
      criterion: "Type Safety",
      status: hasTypeScriptFiles && hasStrictTypes ? "PASS" : hasTypeScriptFiles ? "WARN" : "FAIL",
      message: hasStrictTypes ? "TypeScript strict mode enabled" : "TypeScript strict mode not detected",
      details: "Project should use strict TypeScript configuration",
      recommendation: "Enable strict mode in tsconfig.json",
    });

    return results;
  }

  private async analyzeFileCodeQuality(file: FileInfo): Promise<{
    totalFunctions: number;
    errorHandling: number;
    earlyReturns: number;
    guardClauses: number;
    typeSafety: boolean;
    issues: { type: "error" | "warning" | "info"; message: string; line?: number; suggestion?: string }[];
  }> {
    try {
      // Use OpenRouter for advanced code analysis
      const context = `This is a ${file.extension} file from the Billzilla project. Please analyze the code for quality patterns, best practices, and compliance with clean code principles. Focus on error handling, early returns, guard clauses, and TypeScript usage.`;

      const analysisResult = await this.openRouterService.performCodeAnalysis({
        code: file.content,
        context,
        schema: CodeAnalysisResultSchema,
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.1,
        maxTokens: 2048,
      });

      // Extract basic metrics from AI analysis
      const totalFunctions = this.countFunctions(file.content);
      const errorHandling = Math.round((analysisResult.errorHandling / 100) * totalFunctions);
      const earlyReturns = Math.round((analysisResult.earlyReturns / 100) * totalFunctions);
      const guardClauses = Math.round((analysisResult.guardClauses / 100) * totalFunctions);

      return {
        totalFunctions,
        errorHandling,
        earlyReturns,
        guardClauses,
        typeSafety: analysisResult.typeSafety,
        issues: analysisResult.issues,
      };
    } catch (error) {
      console.warn(`AI analysis failed for ${file.path}, falling back to static analysis:`, error);

      // Fallback to static analysis if AI fails
      return this.fallbackStaticAnalysis(file);
    }
  }

  private countFunctions(content: string): number {
    const lines = content.split("\n");
    let count = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.match(/(function|const|let)\s+\w+\s*=\s*(async\s+)?\(/) ||
        trimmed.match(/(export\s+)?(async\s+)?function\s+\w+\s*\(/) ||
        trimmed.match(/^\s*(public|private|protected)?\s*(async\s+)?\w+\s*\(/)
      ) {
        count++;
      }
    }

    return count;
  }

  private fallbackStaticAnalysis(file: FileInfo): {
    totalFunctions: number;
    errorHandling: number;
    earlyReturns: number;
    guardClauses: number;
    typeSafety: boolean;
    issues: { type: "error" | "warning" | "info"; message: string; line?: number; suggestion?: string }[];
  } {
    let totalFunctions = 0;
    let errorHandling = 0;
    let earlyReturns = 0;
    let guardClauses = 0;
    const issues: { type: "error" | "warning" | "info"; message: string; line?: number; suggestion?: string }[] = [];

    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Count function declarations
      if (
        line.match(/(function|const|let)\s+\w+\s*=\s*(async\s+)?\(/) ||
        line.match(/(export\s+)?(async\s+)?function\s+\w+\s*\(/) ||
        line.match(/^\s*(public|private|protected)?\s*(async\s+)?\w+\s*\(/)
      ) {
        totalFunctions++;

        // Analyze function for patterns
        const functionEnd = this.findFunctionEnd(lines, i);
        const functionLines = lines.slice(i, functionEnd + 1);

        // Check for error handling
        if (functionLines.some((l) => l.includes("try") || l.includes("catch") || l.includes("throw"))) {
          errorHandling++;
        }

        // Check for early returns
        const returnStatements = functionLines.filter((l) => l.trim().startsWith("return"));
        if (returnStatements.length > 1) {
          earlyReturns++;
        }

        // Check for guard clauses (early returns for validation)
        const hasValidation = functionLines.some(
          (l) => l.includes("if") && l.includes("return") && !l.includes("else")
        );
        if (hasValidation) {
          guardClauses++;
        }
      }
    }

    // Basic type safety check for TypeScript files
    const isTypeScript = file.extension === ".ts" || file.extension === ".tsx";
    const typeSafety =
      isTypeScript &&
      (file.content.includes(": ") || file.content.includes("interface") || file.content.includes("type "));

    return {
      totalFunctions,
      errorHandling,
      earlyReturns,
      guardClauses,
      typeSafety,
      issues,
    };
  }

  private findFunctionEnd(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let inFunction = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === "{") {
          braceCount++;
          inFunction = true;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0 && inFunction) {
            return i;
          }
        }
      }
    }

    return lines.length - 1;
  }

  private async checkTestingSetup(packageJson: Record<string, unknown>, files: FileInfo[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    // Check test files existence
    const testFiles = files.filter((f) => f.path.includes(".test.") || f.path.includes(".spec."));
    const hasUnitTests = testFiles.length > 0;

    results.push({
      category: "Testing",
      criterion: "Unit Tests Present",
      status: hasUnitTests ? "PASS" : "FAIL",
      message: hasUnitTests ? `${testFiles.length} test files found` : "No test files detected",
      details: "Project should have comprehensive unit tests",
      recommendation: "Create unit tests for services, hooks, and components",
    });

    // Check E2E tests
    const e2eFiles = files.filter((f) => f.path.startsWith("e2e/"));
    const hasE2eTests = e2eFiles.length > 0;

    results.push({
      category: "Testing",
      criterion: "E2E Tests Present",
      status: hasE2eTests ? "PASS" : "FAIL",
      message: hasE2eTests ? `${e2eFiles.length} E2E test files found` : "No E2E test files detected",
      details: "Project should have Playwright E2E tests",
      recommendation: "Create E2E tests for critical user flows",
    });

    // Check test coverage configuration
    const hasCoverageConfig = packageJson.scripts?.["test:unit:coverage"];
    results.push({
      category: "Testing",
      criterion: "Test Coverage Setup",
      status: hasCoverageConfig ? "PASS" : "FAIL",
      message: hasCoverageConfig ? "Coverage script configured" : "Coverage script not found",
      details: "Project should track test coverage (>80% target)",
      recommendation: "Configure test coverage reporting",
    });

    return results;
  }

  private async checkAiImplementation(files: FileInfo[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    // Check OpenRouter service
    const openRouterFiles = files.filter(
      (f) => f.path.toLowerCase().includes("openrouter") || f.path.toLowerCase().includes("open_router")
    );
    const hasOpenRouterService = openRouterFiles.length > 0;

    results.push({
      category: "AI Implementation",
      criterion: "OpenRouter Service",
      status: hasOpenRouterService ? "PASS" : "FAIL",
      message: hasOpenRouterService ? "OpenRouter service detected" : "OpenRouter service not found",
      details: "Project should integrate with OpenRouter.ai for AI services",
      recommendation: "Implement OpenRouter service for AI text processing",
    });

    // Check OpenAI Whisper service
    const openAiWhisperFiles = files.filter(
      (f) => f.path.toLowerCase().includes("whisperservice") || f.path.toLowerCase().includes("whisper_service")
    );
    const hasOpenAiWhisperService = openAiWhisperFiles.length > 0;

    results.push({
      category: "AI Implementation",
      criterion: "OpenAI Whisper Service",
      status: hasOpenAiWhisperService ? "PASS" : "FAIL",
      message: hasOpenAiWhisperService ? "OpenAI Whisper service detected" : "OpenAI Whisper service not found",
      details: "Project should use OpenAI Whisper API for speech-to-text conversion",
      recommendation: "Implement WhisperService for audio transcription using OpenAI API",
    });

    // Check voice expense flow
    const voiceExpenseFiles = files.filter(
      (f) => f.content.includes("voice") || f.content.includes("audio") || f.content.includes("transcription")
    );
    const hasVoiceExpenseFlow = voiceExpenseFiles.length > 0;

    results.push({
      category: "AI Implementation",
      criterion: "Voice Expense Flow",
      status: hasVoiceExpenseFlow ? "PASS" : "FAIL",
      message: hasVoiceExpenseFlow ? "Voice expense flow detected" : "Voice expense flow not found",
      details: "Project should support voice-based expense addition",
      recommendation: "Implement voice expense creation workflow",
    });

    return results;
  }

  private extractCriteriaFromResults(results: ReviewResult[]): ReviewCriteria {
    // This is a simplified extraction - in a real implementation,
    // you'd parse the actual package.json and analyze files more deeply
    return {
      techStack: {
        astroVersion: "5.x",
        typescriptVersion: "5.x",
        reactVersion: "19.x",
        tailwindVersion: "4.x",
        shadcnUi: results.some((r) => r.criterion === "Shadcn/ui Components" && r.status === "PASS"),
        supabase: results.some((r) => r.criterion === "Supabase Integration" && r.status === "PASS"),
        vitest: results.some((r) => r.criterion === "Vitest Testing" && r.status === "PASS"),
        playwright: results.some((r) => r.criterion === "Playwright E2E Testing" && r.status === "PASS"),
      },
      projectStructure: {
        hasLayouts: true, // Simplified
        hasPages: true,
        hasComponents: true,
        hasLib: true,
        hasDb: true,
        hasMiddleware: true,
        properDirectoryStructure: results.some(
          (r) => r.criterion === "Source Directory Structure" && r.status === "PASS"
        ),
      },
      codeQuality: {
        errorHandling: results.some((r) => r.criterion === "Error Handling" && r.status === "PASS"),
        earlyReturns: results.some((r) => r.criterion === "Early Returns Pattern" && r.status === "PASS"),
        guardClauses: results.some((r) => r.criterion === "Guard Clauses" && r.status === "PASS"),
        typeSafety: results.some((r) => r.criterion === "Type Safety" && r.status === "PASS"),
        properImports: true, // Simplified
      },
      testing: {
        unitTestCoverage: 85, // Placeholder - would need actual coverage calculation
        e2eTests: results.some((r) => r.criterion === "E2E Tests Present" && r.status === "PASS"),
        testOrganization: results.some((r) => r.criterion === "Unit Tests Present" && r.status === "PASS"),
      },
      aiImplementation: {
        openRouterService: results.some((r) => r.criterion === "OpenRouter Service" && r.status === "PASS"),
        openAiWhisperService: results.some((r) => r.criterion === "OpenAI Whisper Service" && r.status === "PASS"),
        voiceExpenseFlow: results.some((r) => r.criterion === "Voice Expense Flow" && r.status === "PASS"),
      },
    };
  }

  private async analyzeSingleFile(
    file: FileInfo,
    projectContext: string,
    projectRules: string
  ): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    try {
      console.log(`🤖 Analyzing ${file.path}...`);

      const prompt = `
Jesteś ekspertem w analizie kodu i recenzji programistycznej dla projektu Billzilla. Twoim zadaniem jest sprawdzić zgodność zmienionego kodu ze standardami projektu oraz dodać własną ocenę jakości kodu.

## STANDARDY PROJEKTU (.ai i .cursor/rules):
${projectRules}

## KONTEKST PROJEKTU:
${projectContext}

## ZMIENIONY KOD (${file.path}):
${file.content}

### INSTRUKCJE OCENY:

1. **Najpierw oceń zgodność ze standardami** z plików .ai i .cursor/rules
2. **Dodaj własną ocenę** jeśli standardy nie pokrywają tematu:
   - Dobre praktyki programowania
   - Błędy i problemy techniczne
   - Zagadnienia bezpieczeństwa
   - Sugestie refaktoryzacji

### STRUKTURA ODPOWIEDZI:

Podaj **krótki podsumowanie**, następnie **listę problemów z poziomami severity** (CRITICAL, HIGH, MEDIUM, LOW, INFO), oraz **konkretne propozycje poprawek**.

Jeśli brakuje reguły, która byłaby przydatna - zaproponuj jej dodanie do odpowiedniego pliku .cursor/rules.

Zwróć wynik w formacie JSON:
{
  "summary": "Krótkie podsumowanie zmian w pliku",
  "severity": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "issues": [
    {
      "category": "Zgodność ze standardami | Dobre praktyki | Błędy | Bezpieczeństwo | Refaktoryzacja",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFO",
      "message": "Dokładny opis problemu",
      "line": 123,
      "fix": "Konkretna propozycja naprawy",
      "ruleSuggestion": "Jeśli brakuje reguły - zaproponuj dodanie do .cursor/rules/[plik].mdc"
    }
  ],
  "ruleSuggestions": ["Lista propozycji nowych reguł do dodania"]
}
`.trim();

      const analysisResult = await this.openRouterService.performStructuredAnalysis({
        prompt,
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.1,
        maxTokens: 4096,
      });

      // Parse the structured response
      const response = JSON.parse(analysisResult);

      // Add summary result
      results.push({
        category: "Code Review Summary",
        criterion: `File: ${file.path}`,
        status:
          response.severity.critical > 0
            ? "FAIL"
            : response.severity.high > 0
              ? "FAIL"
              : response.severity.medium > 0
                ? "WARN"
                : "PASS",
        message: response.summary,
        details: `Severity: ${response.severity.critical} critical, ${response.severity.high} high, ${response.severity.medium} medium, ${response.severity.low} low, ${response.severity.info} info`,
      });

      // Add individual issue results
      response.issues.forEach((issue: StructuredAnalysisIssue) => {
        results.push({
          category: issue.category,
          criterion: `${file.path}${issue.line ? `:${issue.line}` : ""} (${issue.severity})`,
          status:
            issue.severity === "CRITICAL" || issue.severity === "HIGH"
              ? "FAIL"
              : issue.severity === "MEDIUM"
                ? "WARN"
                : "PASS",
          message: issue.message,
          details: issue.fix,
          recommendation: issue.ruleSuggestion,
        });
      });

      // Add rule suggestions as separate results
      if (response.ruleSuggestions && response.ruleSuggestions.length > 0) {
        response.ruleSuggestions.forEach((suggestion: string) => {
          results.push({
            category: "Rule Suggestions",
            criterion: "New Rule Proposal",
            status: "WARN",
            message: "Consider adding new coding rule",
            details: suggestion,
            recommendation: "Add this rule to appropriate .cursor/rules file",
          });
        });
      }
    } catch (error) {
      console.warn(`⚠️  AI analysis failed for ${file.path}:`, error);
      results.push({
        category: "Code Quality",
        criterion: `File: ${file.path}`,
        status: "WARN",
        message: "Could not perform AI analysis",
        details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return results;
  }
}
