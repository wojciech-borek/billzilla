/**
 * TranscriptionTaskService - Orchestrates audio transcription and expense data extraction
 *
 * This service manages the complete workflow:
 * 1. Create transcription task in database
 * 2. Transcribe audio to text (WhisperService)
 * 3. Extract expense data from text (OpenRouterService)
 * 4. Update task with results or errors
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { Profile, ExpenseTranscriptionResult } from "../../types";
import { WhisperService } from "./whisperService";
import { OpenRouterService, type ExtractDataParams } from "./openRouterService";
import { expenseTranscriptionSchema } from "../schemas/expenseSchemas";

// ============================================================================
// Type Definitions
// ============================================================================

type TranscriptionTaskRow = Database["public"]["Tables"]["transcription_tasks"]["Row"];
type TranscriptionTaskInsert = Database["public"]["Tables"]["transcription_tasks"]["Insert"];
type TranscriptionTaskStatus = Database["public"]["Enums"]["transcription_task_status"];

export interface GroupContext {
  groupId: string;
  groupName: string;
  baseCurrency: string;
  members: {
    id: string;
    name: string;
    email: string;
  }[];
  currencies: {
    code: string;
    rate: number;
  }[];
}

export interface CreateTaskParams {
  groupId: string;
  userId: string;
  audioBlob?: Blob; // Optional - can store URL instead
  audioUrl?: string;
}

export interface ProcessTaskParams {
  taskId: string;
  audioBlob: Blob;
  groupContext: GroupContext;
  userId: string;
}

// ============================================================================
// Custom Error Classes
// ============================================================================

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Transcription task not found: ${taskId}`);
    this.name = "TaskNotFoundError";
  }
}

export class TaskAccessDeniedError extends Error {
  constructor(taskId: string) {
    super(`Access denied to transcription task: ${taskId}`);
    this.name = "TaskAccessDeniedError";
  }
}

export class TaskProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "TaskProcessingError";
  }
}

export class GroupContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroupContextError";
  }
}

// ============================================================================
// TranscriptionTaskService Implementation
// ============================================================================

export class TranscriptionTaskService {
  private whisperService: WhisperService;
  private openRouterService: OpenRouterService;

  constructor() {
    this.whisperService = new WhisperService();
    this.openRouterService = new OpenRouterService();
  }

  // ==========================================================================
  // Public Methods - Task Management
  // ==========================================================================

  /**
   * Creates a new transcription task in the database
   */
  async createTask(supabase: SupabaseClient<Database>, params: CreateTaskParams): Promise<TranscriptionTaskRow> {
    const taskData: TranscriptionTaskInsert = {
      group_id: params.groupId,
      user_id: params.userId,
      status: "processing",
      audio_url: params.audioUrl || null,
    };

    const { data, error } = await supabase.from("transcription_tasks").insert(taskData).select().single();

    if (error || !data) {
      throw new Error("Failed to create transcription task");
    }

    return data;
  }

  /**
   * Gets a transcription task by ID
   */
  async getTask(supabase: SupabaseClient<Database>, taskId: string, userId: string): Promise<TranscriptionTaskRow> {
    const { data, error } = await supabase
      .from("transcription_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId) // RLS ensures user can only see their own tasks
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new TaskNotFoundError(taskId);
      }
      throw new Error("Failed to fetch transcription task");
    }

    if (!data) {
      throw new TaskNotFoundError(taskId);
    }

    return data;
  }

  /**
   * Updates task status to completed with results
   */
  async completeTask(
    supabase: SupabaseClient<Database>,
    taskId: string,
    transcriptionText: string,
    resultData: ExpenseTranscriptionResult
  ): Promise<void> {
    const { error } = await supabase
      .from("transcription_tasks")
      .update({
        status: "completed" as TranscriptionTaskStatus,
        transcription_text: transcriptionText,
        result_data: JSON.parse(JSON.stringify(resultData)),
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      throw new Error("Failed to update task status");
    }
  }

  /**
   * Updates task status to failed with error details
   */
  async failTask(
    supabase: SupabaseClient<Database>,
    taskId: string,
    errorCode: string,
    errorMessage: string
  ): Promise<void> {
    const { error } = await supabase
      .from("transcription_tasks")
      .update({
        status: "failed" as TranscriptionTaskStatus,
        error_code: errorCode,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      throw new Error("Failed to update task status");
    }
  }

  // ==========================================================================
  // Public Methods - Processing Pipeline
  // ==========================================================================

  /**
   * Processes a transcription task through the complete pipeline:
   * 1. Transcribe audio to text (Whisper)
   * 2. Extract expense data from text (OpenRouter LLM)
   * 3. Update task with results
   */
  async processTask(supabase: SupabaseClient<Database>, params: ProcessTaskParams): Promise<void> {
    try {
      // Step 1: Transcribe audio to text
      const transcriptionResult = await this.whisperService.transcribeAudio({
        audioBlob: params.audioBlob,
        language: "pl", // Polish - can be made dynamic based on group settings
        prompt: this.buildWhisperPrompt(params.groupContext),
      });

      // Step 2: Build context for LLM
      const context = this.buildLLMContext(params.groupContext, params.userId);

      // Step 3: Extract expense data from transcription
      const extractParams: ExtractDataParams<typeof expenseTranscriptionSchema> = {
        transcription: transcriptionResult.text,
        context,
        schema: expenseTranscriptionSchema,
        model: "google/gemini-2.0-flash-exp:free",
        temperature: 0.1,
        maxTokens: 1024,
      };

      const expenseData = await this.openRouterService.extractExpenseData(extractParams);

      // Step 4: Calculate final confidence score
      // Use LLM's confidence if provided, otherwise fall back to heuristic calculation
      const finalConfidence =
        expenseData.extraction_confidence !== undefined && expenseData.extraction_confidence !== null
          ? expenseData.extraction_confidence
          : this.calculateHeuristicConfidence(expenseData);

      // Combine LLM confidence with heuristic if both available (weighted average)
      // 70% LLM assessment, 30% heuristic validation
      const confidenceScore =
        expenseData.extraction_confidence !== undefined && expenseData.extraction_confidence !== null
          ? 0.7 * expenseData.extraction_confidence + 0.3 * this.calculateHeuristicConfidence(expenseData)
          : finalConfidence;

      // Update the expense data with the final confidence score
      const expenseDataWithConfidence = {
        ...expenseData,
        extraction_confidence: confidenceScore,
      };

      // Step 5: Update task as completed
      await this.completeTask(supabase, params.taskId, transcriptionResult.text, expenseDataWithConfidence);
    } catch (error) {
      // Determine error code and message
      let errorCode = "UNKNOWN_ERROR";
      let errorMessage = "An unexpected error occurred";

      if (error instanceof Error) {
        errorCode = error.name;
        errorMessage = error.message;
      }

      // Update task as failed
      await this.failTask(supabase, params.taskId, errorCode, errorMessage);

      // Re-throw the error for caller to handle
      throw new TaskProcessingError(errorMessage, errorCode);
    }
  }

  // ==========================================================================
  // Public Methods - Group Context
  // ==========================================================================

  /**
   * Fetches group context needed for expense extraction
   * Includes: group name, members, currencies
   */
  async getGroupContext(supabase: SupabaseClient<Database>, groupId: string, userId: string): Promise<GroupContext> {
    // Step 1: Verify user is a member of the group and get group details
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select(
        `
        id,
        name,
        base_currency_code,
        group_members!inner(profile_id, status)
      `
      )
      .eq("id", groupId)
      .eq("group_members.profile_id", userId)
      .eq("group_members.status", "active")
      .single();

    if (groupError || !groupData) {
      throw new GroupContextError(`User is not an active member of group ${groupId}`);
    }

    // Step 2: Fetch all active group members
    const { data: membersData, error: membersError } = await supabase
      .from("group_members")
      .select(
        `
        profile_id,
        profiles:profile_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("group_id", groupId)
      .eq("status", "active");

    if (membersError || !membersData) {
      throw new GroupContextError("Failed to fetch group members");
    }

    // Step 3: Fetch group currencies
    const { data: currenciesData, error: currenciesError } = await supabase
      .from("group_currencies")
      .select("currency_code, exchange_rate")
      .eq("group_id", groupId);

    if (currenciesError) {
      throw new GroupContextError("Failed to fetch group currencies");
    }

    // Step 4: Build context object
    const members = membersData
      .map((m) => {
        const profile = m.profiles as Profile | null;
        return {
          id: m.profile_id,
          name: profile?.full_name || profile?.email || "Unknown",
          email: profile?.email || "",
        };
      })
      .filter((m) => m.email); // Filter out invalid entries

    const currencies = (currenciesData || []).map((c) => ({
      code: c.currency_code,
      rate: c.exchange_rate,
    }));

    return {
      groupId: groupData.id,
      groupName: groupData.name,
      baseCurrency: groupData.base_currency_code,
      members,
      currencies,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Builds a prompt for Whisper to improve transcription accuracy
   */
  private buildWhisperPrompt(context: GroupContext): string {
    const memberNames = context.members.map((m) => m.name).join(", ");
    return `Grupa: ${context.groupName}. Członkowie: ${memberNames}. Wydatek w złotych lub euro.`;
  }

  /**
   * Builds context string for LLM to extract expense data
   */
  private buildLLMContext(context: GroupContext, currentUserId: string): string {
    const currentUser = context.members.find((m) => m.id === currentUserId);
    const currentUserName = currentUser?.name || "Unknown User";

    const membersList = context.members
      .map((m, idx) => {
        const isCurrent = m.id === currentUserId;
        return `${idx + 1}. ${m.name} (ID: ${m.id})${isCurrent ? " ⭐ CURRENT USER (speaking)" : ""}`;
      })
      .join("\n");

    const currenciesList = context.currencies.map((c) => `${c.code}: ${c.rate}`).join(", ");

    const today = new Date().toISOString().split("T")[0];

    return `Group: "${context.groupName}"
Group ID: ${context.groupId}
Base Currency: ${context.baseCurrency}
Today's Date: ${today}

CURRENT USER (person speaking): ${currentUserName} (ID: ${currentUserId})

Available Group Members:
${membersList}

Available Currencies with Exchange Rates:
${currenciesList}

EXTRACTION INSTRUCTIONS:

1. DESCRIPTION & AMOUNT (required):
   - Extract what was purchased/paid for and the amount
   - Example: "obiad w restauracji za 300 złotych" → description: "Obiad w restauracji", amount: 300

2. CURRENCY (optional):
   - If currency mentioned (złotych/złoty/zł/PLN, euro/EUR, dolar/USD, etc.), extract it
   - If not mentioned, default to ${context.baseCurrency}
   - Normalize to 3-letter ISO code (PLN, EUR, USD)

3. PAYER (who paid) - IMPORTANT:
   - Look for phrases like: "zapłaciłem", "ja zapłaciłem", "płacił [name]", "[name] zapłacił", "to [name] płacił"
   - Match the person to the member list above using their ID
   - If "ja"/"mnie"/"zapłaciłem" → this means CURRENT USER (${currentUserId})
   - If a specific name is mentioned → match to member list and use their ID
   - If no payer mentioned at all → leave payer_id as null (system will default to current user)

4. DATE (when the expense occurred) - IMPORTANT:
   - Look for temporal references:
     * "dzisiaj" / "dziś" → today (${today})
     * "wczoraj" → yesterday (1 day ago)
     * "przedwczoraj" → 2 days ago
     * "X dni temu" → X days ago
     * "w poniedziałek", "we wtorek", etc. → calculate the most recent occurrence
     * "3 maja", "15 grudnia" → this year if no year mentioned
     * "3.05", "15/12", "2024-05-03" → parse the date
     * Specific date like "2024-05-03" or "3 maja 2024"
   - Return in format: YYYY-MM-DDTHH:MM (use 12:00 for time if not specified)
   - If no date mentioned → leave expense_date as null (system will use current date/time)

5. PARTICIPANTS & SPLITS (required):
   - Look for who should pay/split the cost:
     * "wszyscy" / "cała grupa" / "po równo" → all members, equal split
     * "ja i [name]" / "z [name]" / "dzieliliśmy się z [name]" → CURRENT USER (${currentUserId}) and the named person
     * "[name1], [name2], [name3]" → specific people listed
     * "ja" / "dla mnie" (alone) → only CURRENT USER (${currentUserId})
   - IMPORTANT: When "ja"/"mnie" is mentioned, always include CURRENT USER (${currentUserId}) in splits
   - Match all names to the member list using their IDs
   - Calculate split amounts:
     * Equal split: divide amount by number of participants
     * If specific amounts mentioned ("ja 100, on 200"), use those amounts
     * Last participant should absorb any rounding differences
   - Return as array of {profile_id: "uuid", amount: number}
   - If no participants mentioned → include all members with equal split

6. OUTPUT FORMAT:
   - Return participant IDs (profile_id), NOT names
   - Ensure split amounts sum exactly to total amount (±0.01 tolerance)
   - Use proper UUIDs from the member list above

EXAMPLES:

Example 1: "Zapłaciłem wczoraj 50 euro za benzynę, dzieliliśmy się z Anną"
→ {
  description: "Benzynę",
  amount: 50,
  currency_code: "EUR",
  expense_date: "[yesterday's date]T12:00",
  payer_id: null,  // "zapłaciłem" without name context
  splits: [{profile_id: "...", amount: 25}, {profile_id: "[Anna's ID]", amount: 25}]
}

Example 2: "Marek kupił pizzę 3 dni temu za 80 złotych, rozliczamy się wszyscy"
→ {
  description: "Pizza",
  amount: 80,
  currency_code: "PLN",
  expense_date: "[3 days ago]T12:00",
  payer_id: "[Marek's ID]",  // specific name mentioned
  splits: [{profile_id: "[all members with equal split]"}]
}

Example 3: "Obiad 120zł"
→ {
  description: "Obiad",
  amount: 120,
  currency_code: "PLN",
  expense_date: null,  // no date mentioned
  payer_id: null,  // no payer mentioned
  splits: [{profile_id: "[all members with equal split]"}]
}`;
  }

  /**
   * Calculates a heuristic confidence score based on data completeness
   * This serves as a fallback when LLM doesn't provide extraction_confidence
   *
   * @param data - The extracted expense data
   * @returns Confidence score between 0.0 and 1.0
   */
  private calculateHeuristicConfidence(data: ExpenseTranscriptionResult): number {
    let score = 0.5; // Base score for having any data

    // Required fields bonus (these should always be present)
    if (data.description && data.description.trim().length > 0 && data.amount > 0) {
      score += 0.2;
    }

    // Optional fields bonuses
    if (data.currency_code) {
      score += 0.05;
    }

    if (data.expense_date) {
      score += 0.05;
    }

    if (data.payer_id) {
      score += 0.05;
    }

    // Splits validation
    if (data.splits && data.splits.length > 0) {
      score += 0.1;

      // Check if splits sum matches amount (high confidence indicator)
      const splitsSum = data.splits.reduce((sum, split) => sum + split.amount, 0);
      const difference = Math.abs(splitsSum - data.amount);

      if (difference <= 0.01) {
        score += 0.1; // Bonus for mathematically correct splits
      } else if (difference > data.amount * 0.1) {
        // Penalty if splits are significantly off
        score -= 0.15;
      }
    }

    // Cap score between 0.0 and 1.0
    return Math.max(0.0, Math.min(score, 1.0));
  }
}
