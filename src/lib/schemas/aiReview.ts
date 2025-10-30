import { z } from "zod";

export const ReviewCriteriaSchema = z.object({
  techStack: z.object({
    astroVersion: z.string().regex(/^5\./),
    typescriptVersion: z.string().regex(/^5\./),
    reactVersion: z.string().regex(/^19\./),
    tailwindVersion: z.string().regex(/^4\./),
    shadcnUi: z.boolean(),
    supabase: z.boolean(),
    vitest: z.boolean(),
    playwright: z.boolean(),
  }),
  projectStructure: z.object({
    hasLayouts: z.boolean(),
    hasPages: z.boolean(),
    hasComponents: z.boolean(),
    hasLib: z.boolean(),
    hasDb: z.boolean(),
    hasMiddleware: z.boolean(),
    properDirectoryStructure: z.boolean(),
  }),
  codeQuality: z.object({
    errorHandling: z.boolean(),
    earlyReturns: z.boolean(),
    guardClauses: z.boolean(),
    typeSafety: z.boolean(),
    properImports: z.boolean(),
  }),
  testing: z.object({
    unitTestCoverage: z.number().min(0).max(100),
    e2eTests: z.boolean(),
    testOrganization: z.boolean(),
  }),
  aiImplementation: z.object({
    openRouterService: z.boolean(),
    openAiWhisperService: z.boolean(),
    voiceExpenseFlow: z.boolean(),
  }),
});

export const ReviewResultSchema = z.object({
  category: z.string(),
  criterion: z.string(),
  status: z.enum(["PASS", "FAIL", "WARN"]),
  message: z.string(),
  details: z.string().optional(),
  recommendation: z.string().optional(),
});

export const AiReviewReportSchema = z.object({
  projectName: z.string(),
  timestamp: z.string(),
  overallScore: z.number().min(0).max(100),
  criteria: ReviewCriteriaSchema,
  results: z.array(ReviewResultSchema),
  summary: z.object({
    totalChecks: z.number(),
    passed: z.number(),
    failed: z.number(),
    warnings: z.number(),
  }),
});

export type ReviewCriteria = z.infer<typeof ReviewCriteriaSchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type AiReviewReport = z.infer<typeof AiReviewReportSchema>;
