import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock OpenRouterService before importing the service
const mockPerformCodeAnalysis = vi.fn();
vi.mock("../../lib/services/openRouterService", () => ({
  OpenRouterService: class MockOpenRouterService {
    performCodeAnalysis = mockPerformCodeAnalysis;
  },
}));

import { AiReviewService } from "../../lib/services/aiReviewService";
import { OpenRouterService } from "../../lib/services/openRouterService";

describe("AiReviewService", () => {
  let service: AiReviewService;
  let mockOpenRouterService: OpenRouterService;
  const mockProjectRoot = "/test/project";

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenRouterService = new OpenRouterService();
    service = new AiReviewService(mockOpenRouterService, mockProjectRoot);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkTechStack", () => {
    it("should pass for correct tech stack versions", async () => {
      const mockPackageJson = {
        dependencies: {
          astro: "^5.1.0",
          typescript: "^5.0.0",
          react: "^19.0.0",
          tailwindcss: "^4.0.0",
          "@radix-ui/react-dialog": "^1.0.0",
          "@supabase/supabase-js": "^2.0.0",
        },
        devDependencies: {
          vitest: "^4.0.0",
          "@playwright/test": "^1.0.0",
        },
      };

      const results = await service["checkTechStack"](mockPackageJson);

      const astroCheck = results.find((r) => r.criterion === "Astro 5.x");
      const tsCheck = results.find((r) => r.criterion === "TypeScript 5.x");
      const reactCheck = results.find((r) => r.criterion === "React 19.x");

      expect(astroCheck?.status).toBe("PASS");
      expect(tsCheck?.status).toBe("PASS");
      expect(reactCheck?.status).toBe("PASS");
    });

    it("should fail for incorrect tech stack versions", async () => {
      const mockPackageJson = {
        dependencies: {
          astro: "^4.0.0", // Wrong version
          typescript: "^4.0.0", // Wrong version
        },
      };

      const results = await service["checkTechStack"](mockPackageJson);

      const astroCheck = results.find((r) => r.criterion === "Astro 5.x");
      const tsCheck = results.find((r) => r.criterion === "TypeScript 5.x");

      expect(astroCheck?.status).toBe("FAIL");
      expect(tsCheck?.status).toBe("FAIL");
    });
  });

  describe("checkProjectStructure", () => {
    it("should pass for correct project structure", async () => {
      const mockFiles = [
        { path: "src/layouts/Layout.astro", content: "", size: 100, extension: ".astro" },
        { path: "src/pages/index.astro", content: "", size: 100, extension: ".astro" },
        { path: "src/components/Button.tsx", content: "", size: 100, extension: ".tsx" },
        { path: "src/lib/services/test.ts", content: "", size: 100, extension: ".ts" },
        { path: "src/db/client.ts", content: "", size: 100, extension: ".ts" },
        { path: "src/middleware/index.ts", content: "", size: 100, extension: ".ts" },
      ];

      const results = await service["checkProjectStructure"](mockFiles);

      const structureCheck = results.find((r) => r.criterion === "Source Directory Structure");
      expect(structureCheck?.status).toBe("PASS");
    });

    it("should fail for missing required directories", async () => {
      const mockFiles = [
        { path: "src/components/Button.tsx", content: "", size: 100, extension: ".tsx" },
        // Missing layouts, pages, lib, db, middleware
      ];

      const results = await service["checkProjectStructure"](mockFiles);

      const structureCheck = results.find((r) => r.criterion === "Source Directory Structure");
      expect(structureCheck?.status).toBe("FAIL");
    });
  });

  describe("checkCodeQuality", () => {
    it("should analyze code quality patterns using AI", async () => {
      // Mock the AI analysis response
      mockPerformCodeAnalysis.mockResolvedValue({
        errorHandling: 33, // 33% of functions have error handling
        earlyReturns: 66, // 66% of functions use early returns
        guardClauses: 100, // 100% of functions use guard clauses
        typeSafety: true,
        issues: [{ type: "warning", message: "Consider adding error handling", line: 5 }],
      });

      const mockFiles = [
        {
          path: "src/lib/services/test.ts",
          content: `
            export function goodFunction() {
              try {
                return 'success';
              } catch (error) {
                throw error;
              }
            }

            export function earlyReturnFunction() {
              if (!condition) return;
              return doSomething();
            }

            export function guardClauseFunction(param) {
              if (!param) return;
              console.log(param);
            }
          `,
          size: 200,
          extension: ".ts",
        },
      ];

      const results = await service["checkCodeQuality"](mockFiles);

      // Verify AI analysis was called
      expect(mockPerformCodeAnalysis).toHaveBeenCalledWith({
        code: expect.any(String),
        context: expect.stringContaining("Billzilla project"),
        schema: expect.any(Object),
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.1,
        maxTokens: 2048,
      });

      const errorHandlingCheck = results.find((r) => r.criterion === "Error Handling");
      const earlyReturnsCheck = results.find((r) => r.criterion === "Early Returns Pattern");

      // With AI analysis: 1 out of 3 functions has error handling (33%) -> FAIL (below 80%)
      expect(errorHandlingCheck?.status).toBe("FAIL");
      // 2 out of 3 functions have early returns (66%) -> WARN (below 70%)
      expect(earlyReturnsCheck?.status).toBe("WARN");

      const guardClausesCheck = results.find((r) => r.criterion === "Guard Clauses");
      // 3 out of 3 functions have guard clauses (100%) -> PASS (above 70%)
      expect(guardClausesCheck?.status).toBe("PASS");
    });

    it("should handle empty file list", async () => {
      const results = await service["checkCodeQuality"]([]);

      expect(results).toHaveLength(4); // Should return results for all code quality checks
    });
  });

  describe("checkTestingSetup", () => {
    it("should pass for complete testing setup", async () => {
      const mockPackageJson = {
        scripts: {
          "test:unit:coverage": "vitest run --coverage",
        },
        devDependencies: {
          vitest: "^4.0.0",
          "@playwright/test": "^1.0.0",
        },
      };

      const mockFiles = [
        { path: "src/__tests__/test.spec.ts", content: "", size: 100, extension: ".ts" },
        { path: "e2e/test.spec.ts", content: "", size: 100, extension: ".ts" },
      ];

      const results = await service["checkTestingSetup"](mockPackageJson, mockFiles);

      const unitTestsCheck = results.find((r) => r.criterion === "Unit Tests Present");
      const e2eTestsCheck = results.find((r) => r.criterion === "E2E Tests Present");
      const coverageCheck = results.find((r) => r.criterion === "Test Coverage Setup");

      expect(unitTestsCheck?.status).toBe("PASS");
      expect(e2eTestsCheck?.status).toBe("PASS");
      expect(coverageCheck?.status).toBe("PASS");
    });
  });

  describe("checkAiImplementation", () => {
    it("should check AI implementation components", async () => {
      const mockFiles = [
        { path: "src/lib/services/openRouterService.ts", content: "", size: 100, extension: ".ts" },
        { path: "src/lib/services/whisperService.ts", content: "", size: 100, extension: ".ts" },
        { path: "src/components/VoiceExpenseForm.tsx", content: "voice transcription", size: 100, extension: ".tsx" },
      ];

      const results = await service["checkAiImplementation"](mockFiles);

      const openRouterCheck = results.find((r) => r.criterion === "OpenRouter Service");
      const openAiWhisperCheck = results.find((r) => r.criterion === "OpenAI Whisper Service");
      const voiceFlowCheck = results.find((r) => r.criterion === "Voice Expense Flow");

      expect(openRouterCheck?.status).toBe("PASS");
      expect(openAiWhisperCheck?.status).toBe("PASS");
      expect(voiceFlowCheck?.status).toBe("PASS");
    });
  });
});
