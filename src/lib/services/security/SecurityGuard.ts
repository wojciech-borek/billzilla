/**
 * Security Guard Service
 *
 * Provides security validation for AI chat interactions:
 * - Prompt injection detection
 * - Function call whitelist validation
 * - Argument sanitization
 */

import type { FunctionName } from "@/lib/ai/chatTypes";

/**
 * Suspicious patterns that may indicate prompt injection attempts
 */
const SUSPICIOUS_PATTERNS = [
  // System prompt override attempts
  /ignore\s+(all\s+)?(previous|above)\s+(instructions|prompts|directives)/gi,
  /you\s+are\s+now\s+(a|an|the)/gi,
  /forget\s+(everything|all|previous)/gi,
  /system\s*:\s*/gi,

  // Function call manipulation
  /call\s+function\s+(delete|remove|drop)/gi,
  /execute\s+(delete_all|drop_table|truncate)/gi,

  // SQL Injection patterns
  /;\s*DROP\s+TABLE/gi,
  /UNION\s+SELECT/gi,
  /--\s*$/gm, // SQL comment

  // Role hijacking
  /act\s+as\s+(admin|root|system)/gi,
  /you\s+have\s+permission\s+to/gi,

  // Prompt leaking
  /show\s+(me\s+)?(your|the)\s+(prompt|instructions|system\s+message)/gi,
  /what\s+(are|is)\s+your\s+(instructions|system\s+prompt)/gi,
];

/**
 * Allowed function names (whitelist)
 */
const ALLOWED_FUNCTIONS: readonly FunctionName[] = [
  // Generic tools
  "get_expenses",
  "get_members",
  "get_group_metadata",
  "list_user_groups",

  // Specialized tools
  "get_member_balances",
  "get_expenses_summary",
  "search_expenses",
  "analyze_spending_trends",
  "get_top_expenses",
  "get_member_statistics",
  "generate_group_report",

  // Utility
  "get_group_context",
  "get_currency_exchange_rates",
] as const;

/**
 * Result of prompt analysis
 */
export interface PromptAnalysisResult {
  isSuspicious: boolean;
  reason?: string;
  matches?: string[];
}

/**
 * Result of function call validation
 */
export interface FunctionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Security Guard Service
 */
export class SecurityGuard {
  /**
   * Analyzes user message for suspicious patterns
   */
  analyzeUserMessage(message: string): PromptAnalysisResult {
    // Check message length
    if (message.length > 2000) {
      return {
        isSuspicious: true,
        reason: "Message exceeds maximum length (possible prompt stuffing)",
      };
    }

    // Check for excessive special characters
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
    if (specialCharRatio > 0.3) {
      return {
        isSuspicious: true,
        reason: "Too many special characters (possible injection attempt)",
      };
    }

    // Check for hidden Unicode characters
    if (/[\u200B-\u200D\uFEFF]/g.test(message)) {
      return {
        isSuspicious: true,
        reason: "Contains hidden Unicode characters (possible obfuscation)",
      };
    }

    // Check for suspicious patterns
    const matches: string[] = [];
    for (const pattern of SUSPICIOUS_PATTERNS) {
      const found = message.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }

    if (matches.length > 0) {
      return {
        isSuspicious: true,
        reason: "Contains suspicious patterns (possible prompt injection)",
        matches,
      };
    }

    return {
      isSuspicious: false,
    };
  }

  /**
   * Validates function call against whitelist
   */
  validateFunctionCall(params: {
    userId: string;
    groupId: string | null;
    functionName: string;
    functionArgs: Record<string, unknown>;
  }): FunctionValidationResult {
    const { functionName, functionArgs } = params;

    // Check if function is in whitelist
    if (!ALLOWED_FUNCTIONS.includes(functionName as FunctionName)) {
      return {
        allowed: false,
        reason: `Function '${functionName}' is not in the allowed list`,
      };
    }

    // Validate that group_id in args matches the conversation's group
    // If params.groupId is null, it's a global conversation, so any group_id is allowed (will be checked by policies)
    if (params.groupId && functionArgs.group_id && functionArgs.group_id !== params.groupId) {
      return {
        allowed: false,
        reason: "Function arguments contain mismatched group_id for this group-locked conversation",
      };
    }

    // Additional validation: check for suspicious argument values
    const argsString = JSON.stringify(functionArgs);
    if (argsString.length > 5000) {
      return {
        allowed: false,
        reason: "Function arguments are too large (possible attack)",
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Sanitizes function arguments
   */
  sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      // Skip null/undefined
      if (value === null || value === undefined) {
        continue;
      }

      // Sanitize strings
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      }
      // Pass through numbers, booleans
      else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[key] = value;
      }
      // Recursively sanitize objects
      else if (typeof value === "object" && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeArgs(value as Record<string, unknown>);
      }
      // Sanitize arrays
      else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => {
          if (typeof item === "string") {
            return this.sanitizeString(item);
          }
          return item;
        });
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes a single string value
   */
  private sanitizeString(value: string): string {
    // Trim whitespace
    let sanitized = value.trim();

    // Remove potential SQL injection characters
    sanitized = sanitized.replace(/[;'"\\]/g, "");

    // Limit length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500);
    }

    return sanitized;
  }

  /**
   * Checks if a function is allowed
   */
  isFunctionAllowed(functionName: string): boolean {
    return ALLOWED_FUNCTIONS.includes(functionName as FunctionName);
  }

  /**
   * Gets list of allowed functions
   */
  getAllowedFunctions(): readonly FunctionName[] {
    return ALLOWED_FUNCTIONS;
  }
}
