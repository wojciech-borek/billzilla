import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { OpenRouterApiResponse } from "../../types";

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Thrown when the service is not properly configured (e.g., missing API key)
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Thrown when OpenRouter API returns an error status
 */
export class OpenRouterApiError extends Error {
  public readonly status: number;
  public readonly apiMessage: string;

  constructor(status: number, apiMessage: string) {
    super(`OpenRouter API Error (${status}): ${apiMessage}`);
    this.name = "OpenRouterApiError";
    this.status = status;
    this.apiMessage = apiMessage;
  }
}

/**
 * Thrown when there are network connectivity issues
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Thrown when the API response is not valid JSON
 */
export class InvalidJsonResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJsonResponseError";
  }
}

/**
 * Thrown when the response JSON doesn't match the expected Zod schema
 */
export class ValidationError extends Error {
  public readonly validationErrors: z.ZodError;

  constructor(validationErrors: z.ZodError) {
    super(`Validation failed: ${validationErrors.message}`);
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
  }
}

// ============================================================================
// Service Configuration & Parameters
// ============================================================================

export interface OpenRouterServiceConfig {
  apiKey?: string;
}

export interface ExtractDataParams<T extends z.ZodTypeAny> {
  transcription: string;
  context: string;
  schema: T;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CodeAnalysisParams<T extends z.ZodTypeAny> {
  code: string;
  context: string;
  schema: T;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CodeAnalysisWithContextParams<T extends z.ZodTypeAny> {
  code: string;
  context: string;
  projectContext: string;
  schema: T;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// OpenRouter Service Implementation
// ============================================================================

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://openrouter.ai/api/v1";

  constructor(config: OpenRouterServiceConfig = {}) {
    // Use import.meta.env which works in all environments (dev, test, production)
    // astro:env schema in astro.config.mjs provides type safety and validation
    this.apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY;

    // Guard clause: ensure API key is available
    if (!this.apiKey) {
      throw new ConfigurationError("OPENROUTER_API_KEY is not set in environment variables.");
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Extracts structured data from transcription text using OpenRouter LLM
   *
   * @param params - Parameters including transcription, context, schema, and model settings
   * @returns Promise resolving to validated data matching the provided schema
   * @throws {OpenRouterApiError} When API returns an error status
   * @throws {NetworkError} When network connectivity fails
   * @throws {InvalidJsonResponseError} When response is not valid JSON
   * @throws {ValidationError} When response doesn't match the schema
   */
  public async extractExpenseData<T extends z.ZodTypeAny>(params: ExtractDataParams<T>): Promise<z.infer<T>> {
    try {
      const payload = this.createApiPayload(params);
      const apiResponse = await this.makeApiRequest(payload);
      const validatedData = this.parseAndValidateResponse(apiResponse, params.schema);
      return validatedData;
    } catch (error) {
      // Log the error for debugging purposes

      // Re-throw custom errors as-is
      if (
        error instanceof OpenRouterApiError ||
        error instanceof NetworkError ||
        error instanceof InvalidJsonResponseError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(
        `Unexpected error in OpenRouterService: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Performs code analysis using OpenRouter LLM
   *
   * @param params - Parameters including code, context, schema, and model settings
   * @returns Promise resolving to validated analysis results matching the provided schema
   * @throws {OpenRouterApiError} When API returns an error status
   * @throws {NetworkError} When network connectivity fails
   * @throws {InvalidJsonResponseError} When response is not valid JSON
   * @throws {ValidationError} When response doesn't match the schema
   */
  public async performCodeAnalysis<T extends z.ZodTypeAny>(params: CodeAnalysisParams<T>): Promise<z.infer<T>> {
    try {
      const payload = this.createCodeAnalysisPayload(params);
      const apiResponse = await this.makeApiRequest(payload);
      const validatedData = this.parseAndValidateResponse(apiResponse, params.schema);
      return validatedData;
    } catch (error) {
      // Re-throw custom errors as-is
      if (
        error instanceof OpenRouterApiError ||
        error instanceof NetworkError ||
        error instanceof InvalidJsonResponseError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(
        `Unexpected error in OpenRouterService during code analysis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Performs comprehensive code analysis with project context using OpenRouter LLM
   *
   * @param params - Parameters including code, context, project context, schema, and model settings
   * @returns Promise resolving to validated analysis results matching the provided schema
   * @throws {OpenRouterApiError} When API returns an error status
   * @throws {NetworkError} When network connectivity fails
   * @throws {InvalidJsonResponseError} When response is not valid JSON
   * @throws {ValidationError} When response doesn't match the schema
   */
  public async performCodeAnalysisWithContext<T extends z.ZodTypeAny>(
    params: CodeAnalysisWithContextParams<T>
  ): Promise<z.infer<T>> {
    try {
      const payload = this.createCodeAnalysisWithContextPayload(params);
      const apiResponse = await this.makeApiRequest(payload);
      const validatedData = this.parseAndValidateResponse(apiResponse, params.schema);
      return validatedData;
    } catch (error) {
      // Re-throw custom errors as-is
      if (
        error instanceof OpenRouterApiError ||
        error instanceof NetworkError ||
        error instanceof InvalidJsonResponseError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(
        `Unexpected error in OpenRouterService during comprehensive code analysis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async performStructuredAnalysis(params: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const payload = {
        model: params.model || "anthropic/claude-3-haiku",
        messages: [
          {
            role: "user",
            content: params.prompt,
          },
        ],
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature || 0.1,
      };

      const apiResponse = await this.makeApiRequest(payload);
      const responseContent = apiResponse.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error("No response content from OpenRouter API");
      }

      return responseContent;
    } catch (error) {
      // Re-throw custom errors as-is
      if (
        error instanceof OpenRouterApiError ||
        error instanceof NetworkError ||
        error instanceof InvalidJsonResponseError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(
        `Unexpected error in OpenRouterService during structured analysis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Builds the system prompt that instructs the LLM about its role
   */
  private buildSystemPrompt(): string {
    return `You are an expert financial assistant specializing in expense tracking and management.

Your task is to analyze transcribed text from voice input and extract structured expense information.

Guidelines:
- Parse the expense amount, description, currency, and participants from the transcription
- Use the provided context (group members, default currency) to resolve ambiguities
- If split type is not specified, assume "equal" split among all mentioned participants
- If no participants are mentioned, assume all group members are involved
- Extract dates in ISO format when mentioned, or use null if not specified
- Be intelligent about interpreting natural language (e.g., "lunch for me and Alice" means 2 participants)

CONFIDENCE ASSESSMENT:
After extracting the data, assess your confidence in the extraction accuracy using the extraction_confidence field (0.0 to 1.0):
- 1.0 = All information is clear, explicit, and certain. No ambiguity.
- 0.8-0.9 = Most information is clear with minor assumptions (e.g., default currency used, "today" for date)
- 0.6-0.7 = Some ambiguity exists (e.g., unclear participant names, assumed equal split)
- 0.4-0.5 = Significant ambiguity or missing information (e.g., amount not clearly stated, multiple interpretations possible)
- 0.0-0.3 = Very uncertain, many assumptions made, or transcription quality is poor

You must respond ONLY using the provided function/tool format. Do not include any additional text or explanations.`;
  }

  /**
   * Builds the user prompt combining transcription and context
   */
  private buildUserPrompt(transcription: string, context: string): string {
    return `Transcribed text: "${transcription}"

Context: ${context}

Please extract the expense details from the transcribed text using the provided context.`;
  }

  /**
   * Builds the system prompt that instructs the LLM about code analysis role
   */
  private buildCodeAnalysisSystemPrompt(): string {
    return `You are an expert senior software engineer and code quality specialist. Your task is to analyze source code and evaluate it against project standards and best practices.

Your analysis should focus on:
- Code quality patterns and anti-patterns
- Error handling and edge case management
- Clean code principles (early returns, guard clauses, proper naming)
- TypeScript/JavaScript best practices
- Project-specific conventions and standards
- Potential bugs, security issues, or performance problems

ANALYSIS CRITERIA:
- PASS: Code meets all standards and best practices
- WARN: Code is acceptable but has minor issues that should be addressed
- FAIL: Code has significant issues that require immediate attention

Be thorough but practical. Focus on actionable insights that improve code quality and maintainability.

You must respond ONLY using the provided function/tool format. Do not include any additional text or explanations.`;
  }

  /**
   * Builds the system prompt with project context for comprehensive code analysis
   */
  private buildCodeAnalysisSystemPromptWithContext(projectContext: string): string {
    return `You are an expert senior software engineer and code quality specialist specializing in the Billzilla project. Your task is to analyze source code changes in Pull Requests and evaluate them against project standards, architecture, and best practices.

## PROJECT CONTEXT
${projectContext}

## ANALYSIS FOCUS
Your analysis should focus on:
- **Code Quality**: Clean code principles, error handling, early returns, guard clauses
- **Architecture Compliance**: Adherence to Astro Islands, React patterns, Supabase integration
- **TypeScript Best Practices**: Proper typing, interface usage, generic constraints
- **Project Conventions**: Naming standards, file organization, import patterns
- **Security & Performance**: Potential vulnerabilities, performance bottlenecks
- **Testing Standards**: Alignment with Vitest and Playwright testing guidelines

## BILLZILLA-SPECIFIC STANDARDS
- **Astro 5.x + React 19.x**: Proper component separation and hydration strategies
- **Supabase Integration**: Correct RLS policies, real-time subscriptions, proper error handling
- **AI Services**: OpenRouter for text processing, Whisper for speech-to-text
- **UI/UX**: Shadcn/ui components, Tailwind CSS utility-first approach
- **Testing**: Unit tests with Vitest + RTL, E2E with Playwright
- **Type Safety**: Strict TypeScript configuration, no 'any' types

## ANALYSIS CRITERIA
- **PASS**: Code meets all project standards and best practices
- **WARN**: Code is acceptable but has minor issues that should be addressed
- **FAIL**: Code has significant issues requiring immediate attention

## PULL REQUEST CONTEXT
This is a code review for a Pull Request. Focus on:
- Changes introduced in this PR
- Impact on existing functionality
- Consistency with project architecture
- Potential breaking changes
- Code maintainability and readability

Be thorough but practical. Provide actionable feedback that helps improve code quality while respecting the project's established patterns and conventions.

You must respond ONLY using the provided function/tool format. Do not include any additional text or explanations.`;
  }

  /**
   * Builds the user prompt for code analysis
   */
  private buildCodeAnalysisUserPrompt(code: string, context: string): string {
    return `Code to analyze:

\`\`\`
${code}
\`\`\`

Context: ${context}

Please analyze this code for quality, patterns, and compliance with project standards. Provide detailed feedback on any issues found.`;
  }

  /**
   * Creates the complete API payload for OpenRouter
   */
  private createApiPayload<T extends z.ZodTypeAny>(params: ExtractDataParams<T>): object {
    const { transcription, context, schema, model, temperature, maxTokens } = params;

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(transcription, context);

    // Convert Zod schema to JSON Schema
    const jsonSchemaResult = zodToJsonSchema(schema, "extracted_data_schema");

    // Extract the actual schema definition
    const schemaDefinition =
      "definitions" in jsonSchemaResult && jsonSchemaResult.definitions?.extracted_data_schema
        ? jsonSchemaResult.definitions.extracted_data_schema
        : jsonSchemaResult;

    return {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_expense_details",
            description: "Extracts structured expense data from the user's transcribed text.",
            parameters: schemaDefinition,
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_expense_details" },
      },
      temperature: temperature ?? 0.1,
      max_tokens: maxTokens ?? 1024,
    };
  }

  /**
   * Creates the complete API payload for code analysis
   */
  private createCodeAnalysisPayload<T extends z.ZodTypeAny>(params: CodeAnalysisParams<T>): object {
    const { code, context, schema, model, temperature, maxTokens } = params;

    const systemPrompt = this.buildCodeAnalysisSystemPrompt();
    const userPrompt = this.buildCodeAnalysisUserPrompt(code, context);

    // Convert Zod schema to JSON Schema
    const jsonSchemaResult = zodToJsonSchema(schema, "analysis_results_schema");

    // Extract the actual schema definition
    const schemaDefinition =
      "definitions" in jsonSchemaResult && jsonSchemaResult.definitions?.analysis_results_schema
        ? jsonSchemaResult.definitions.analysis_results_schema
        : jsonSchemaResult;

    return {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_code_quality",
            description: "Analyzes code quality, patterns, and compliance with project standards.",
            parameters: schemaDefinition,
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "analyze_code_quality" },
      },
      temperature: temperature ?? 0.1,
      max_tokens: maxTokens ?? 2048,
    };
  }

  /**
   * Creates the complete API payload for comprehensive code analysis with context
   */
  private createCodeAnalysisWithContextPayload<T extends z.ZodTypeAny>(
    params: CodeAnalysisWithContextParams<T>
  ): object {
    const { code, context, projectContext, schema, model, temperature, maxTokens } = params;

    const systemPrompt = this.buildCodeAnalysisSystemPromptWithContext(projectContext);
    const userPrompt = this.buildCodeAnalysisUserPrompt(code, context);

    // Convert Zod schema to JSON Schema
    const jsonSchemaResult = zodToJsonSchema(schema, "analysis_results_schema");

    // Extract the actual schema definition
    const schemaDefinition =
      "definitions" in jsonSchemaResult && jsonSchemaResult.definitions?.analysis_results_schema
        ? jsonSchemaResult.definitions.analysis_results_schema
        : jsonSchemaResult;

    return {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_code_quality",
            description: "Analyzes code quality, patterns, and compliance with Billzilla project standards.",
            parameters: schemaDefinition,
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "analyze_code_quality" },
      },
      temperature: temperature ?? 0.1,
      max_tokens: maxTokens ?? 4096, // Większy limit dla analizy z kontekstem
    };
  }

  /**
   * Makes the HTTP request to OpenRouter API
   */
  private async makeApiRequest(payload: object): Promise<OpenRouterApiResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://billzilla.app", // Optional: for OpenRouter analytics
          "X-Title": "Billzilla", // Optional: for OpenRouter analytics
        },
        body: JSON.stringify(payload),
      });

      // Handle non-2xx responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If parsing error response fails, use the default message
        }

        throw new OpenRouterApiError(response.status, errorMessage);
      }

      // Parse and return the successful response
      return await response.json();
    } catch (error) {
      // Handle fetch-level errors (network issues, etc.)
      if (error instanceof OpenRouterApiError) {
        throw error;
      }

      // Network or other fetch errors
      throw new NetworkError(
        `Failed to connect to OpenRouter API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parses and validates the API response against the provided Zod schema
   */
  private parseAndValidateResponse<T extends z.ZodTypeAny>(apiResponse: OpenRouterApiResponse, schema: T): z.infer<T> {
    // Guard clause: check response structure
    if (!apiResponse?.choices?.[0]?.message?.tool_calls?.[0]?.function) {
      throw new InvalidJsonResponseError("Invalid API response structure: missing tool_calls");
    }

    const functionCall = apiResponse.choices[0].message.tool_calls[0].function;
    const argumentsString = functionCall.arguments;

    // Guard clause: ensure arguments exist
    if (!argumentsString) {
      throw new InvalidJsonResponseError("Invalid API response: missing function arguments");
    }

    // Parse JSON string to object
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(argumentsString);
    } catch (error) {
      throw new InvalidJsonResponseError(
        `Failed to parse function arguments as JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Validate against Zod schema
    const validationResult = schema.safeParse(parsedData);

    // Guard clause: handle validation failure
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error);
    }

    // Return validated data
    return validationResult.data;
  }
}
