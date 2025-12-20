/**
 * Security Guard Service
 *
 * Provides security validation for AI chat interactions:
 * - Prompt injection detection
 * - Function call whitelist validation
 * - Argument sanitization
 */

import type { FunctionName, ChatMessage } from "@/lib/ai/chatTypes";
import type { Tool } from "@/lib/services/openRouterService";

/**
 * Homoglyph mapping for normalization
 */
const HOMOGLYPH_MAP: Record<string, string> = {
  // Latin variants
  ạ: "a",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  ẹ: "e",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ị: "i",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ọ: "o",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ụ: "u",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
  ñ: "n",
  ç: "c",

  // Enclosed characters
  "ⓐ": "a",
  "ⓑ": "b",
  "ⓒ": "c",
  "ⓓ": "d",
  "ⓔ": "e",
  "ⓕ": "f",
  "ⓖ": "g",
  "ⓗ": "h",
  "ⓘ": "i",
  "ⓙ": "j",
  "ⓚ": "k",
  "ⓛ": "l",
  "ⓜ": "m",
  "ⓝ": "n",
  "ⓞ": "o",
  "ⓟ": "p",
  "ⓠ": "q",
  "ⓡ": "r",
  "ⓢ": "s",
  "ⓣ": "t",
  "ⓤ": "u",
  "ⓥ": "v",
  "ⓦ": "w",
  "ⓧ": "x",
  "ⓨ": "y",
  "ⓩ": "z",

  // Mathematical alphanumeric symbols
  "𝐚": "a",
  "𝐛": "b",
  "𝐜": "c",
  "𝐝": "d",
  "𝐞": "e",
  "𝐟": "f",
  "𝐠": "g",
  "𝐡": "h",
  "𝐢": "i",
  "𝐣": "j",
  "𝐤": "k",
  "𝐥": "l",
  "𝐦": "m",
  "𝐧": "n",
  "𝐨": "o",
  "𝐩": "p",
  "𝐪": "q",
  "𝐫": "r",
  "𝐬": "s",
  "𝐭": "t",
  "𝐮": "u",
  "𝐯": "v",
  "𝐰": "w",
  "𝐱": "x",
  "𝐲": "y",
  "𝐳": "z",
};

/**
 * Suspicious patterns that may indicate prompt injection attempts
 */
const SUSPICIOUS_PATTERNS = [
  // System prompt override attempts (English)
  // System prompt override attempts (English)
  // Pattern 1: Ignore previous/above instructions
  /ignore[\s_]+(previous|above)[\s_]+(instructions|prompts|directives)/gi,
  // Pattern 2: Ignore all previous/above instructions
  /ignore[\s_]+all[\s_]+(previous|above)[\s_]+(instructions|prompts|directives)/gi,
  // Pattern 3: Ignore all instructions (without previous/above)
  /ignore[\s_]+all[\s_]+(instructions|prompts|directives)/gi,

  /you[\s_]+are[\s_]+now[\s_]+(a|an|the)/gi,
  /forget[\s_]+(everything|all|previous)/gi,
  /system[\s_]*:[\s_]*/gi,

  // System prompt override attempts (Polish - Multilingual expansion)
  /zapomnij[\s_]+(wszystko|poprzednie)/gi,
  /ignoruj[\s_]+(wszystkie[\s_]+)?(poprzednie|powyższe)[\s_]+(instrukcje|polecenia)/gi,
  /od[\s_]+teraz[\s_]+jesteś/gi,

  // System prompt override attempts (Spanish - Multilingual expansion)
  /olvida[\s_]+(todo|anterior)/gi,
  /ignora[\s_]+(todas[\s_]+las[\s_]+)?(instrucciones|órdenes)[\s_]+(previas|anteriores)/gi,

  // Function call manipulation
  /call[\s_]+function[\s_]+(delete|remove|drop)/gi,
  /execute[\s_]+(delete_all|drop_table|truncate)/gi,

  // SQL Injection patterns
  /;\s*DROP\s+TABLE/gi,
  /UNION\s+SELECT/gi,
  /--\s*$/gm,

  // Role hijacking
  /act\s+as\s+(admin|root|system|developer)/gi,
  /you\s+have\s+permission\s+to/gi,

  // Prompt leaking
  /show\s+(me\s+)?(your|the)\s+(prompt|instructions|system\s+message)/gi,
  /what\s+(are|is)\s+your\s+(instructions|system\s+prompt)/gi,

  // Encoded payload indicators
  /base64[:=]/gi,
  /0x[0-9a-f]{8,}/gi, // Long hex blocks
  /[a-z0-9+/]{40,}/gi, // Long base64-like blocks
];

/**
 * Suspicious patterns to check against input with all whitespace removed
 * This catches obfuscation attempts like "I G N O R E  A L L"
 */
const SUSPICIOUS_PATTERNS_SPACELESS = [
  // Pattern 1: Ignore previous/above instructions
  /ignore(previous|above)(instructions|prompts|directives)/gi,
  // Pattern 2: Ignore all previous/above instructions
  /ignoreall(previous|above)(instructions|prompts|directives)/gi,
  // Pattern 3: Ignore all instructions (without previous/above)
  /ignoreall(instructions|prompts|directives)/gi,

  /youarenow(a|an|the)/gi,
  /forget(everything|all|previous)/gi,
  /system[:]?/gi,

  // Multilingual
  /zapomnij(wszystko|poprzednie)/gi,
  /ignoruj(wszystkie)?(poprzednie|powyższe)(instrukcje|polecenia)/gi,
  /odterazjesteś/gi,
  /olvida(todo|anterior)/gi,
  /ignora(todaslas)?(instrucciones|órdenes)(previas|anteriores)/gi,

  // Role hijacking
  /actas(admin|root|system|developer)/gi,
  /youhavepermissionto/gi,
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

    // NORMALIZATION: Pre-process input
    const normalized = this.normalizeInput(message);

    // Check for suspicious patterns on normalized input
    const matches: string[] = [];
    for (const pattern of SUSPICIOUS_PATTERNS) {
      const found = normalized.match(pattern);
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

    // AGGRESSIVE NORMALIZATION: Check spaceless version
    // This catches "I G N O R E  A L L" type attacks
    const spaceless = normalized.replace(/\s+/g, "");

    for (const pattern of SUSPICIOUS_PATTERNS_SPACELESS) {
      const found = spaceless.match(pattern);
      if (found) {
        return {
          isSuspicious: true,
          reason: "Contains suspicious obfuscated patterns (possible prompt injection)",
          matches: found,
        };
      }
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
   * Analyzes the last N turns of the conversation for multi-turn jailbreak attempts
   */
  analyzeConversation(messages: ChatMessage[], windowSize = 8): PromptAnalysisResult {
    // Focus on user messages specifically for multi-turn injection detection
    const userMessages = messages.filter((m) => m.type === "user_text").slice(-windowSize);

    if (userMessages.length === 0) {
      return { isSuspicious: false };
    }

    // Aggregate content (focusing on user instructions that might be split)
    const aggregatedContent = userMessages.map((m) => (typeof m.content === "string" ? m.content : "")).join(" ");

    return this.analyzeUserMessage(aggregatedContent);
  }

  /**
   * Scans tool metadata for potential poisoning
   */
  analyzeToolMetadata(tools: Tool[]): PromptAnalysisResult {
    for (const tool of tools) {
      // Check function name
      const nameAnalysis = this.analyzeUserMessage(tool.function.name);
      if (nameAnalysis.isSuspicious) {
        return {
          isSuspicious: true,
          reason: `Suspicious tool name detected: ${tool.function.name}`,
          matches: nameAnalysis.matches,
        };
      }

      // Check description
      if (tool.function.description) {
        const descAnalysis = this.analyzeUserMessage(tool.function.description);
        if (descAnalysis.isSuspicious) {
          return {
            isSuspicious: true,
            reason: `Suspicious tool description detected for ${tool.function.name}`,
            matches: descAnalysis.matches,
          };
        }
      }

      // Check parameters (values/descriptions if available)
      const paramsString = JSON.stringify(tool.function.parameters);
      const paramsAnalysis = this.analyzeUserMessage(paramsString);
      if (paramsAnalysis.isSuspicious) {
        return {
          isSuspicious: true,
          reason: `Suspicious patterns in parameters for tool ${tool.function.name}`,
          matches: paramsAnalysis.matches,
        };
      }
    }

    return { isSuspicious: false };
  }

  /**
   * Normalizes input by decoding Base64/Hex and stripping homoglyphs
   */
  private normalizeInput(input: string): string {
    let normalized = input; // Keep original case for decoding

    // 1. Decrypt Hex payloads (0x...)
    normalized = normalized.replace(/0x([0-9a-f]{2,})/gi, (match, hex) => {
      try {
        if (hex.length % 2 === 0) {
          const decoded = Buffer.from(hex, "hex").toString("utf-8");
          // Only return decoded if it seems like printable text
          return /[\x20-\x7E]/.test(decoded) ? decoded : match;
        }
      } catch {
        // ignore
      }
      return match;
    });

    // 2. Decode Base64 payloads
    // More precise base64 regex to avoid matching everything
    normalized = normalized.replace(/[a-zA-Z0-9+/]{8,}(?:={0,2})?/g, (match) => {
      try {
        // Avoid decoding small words or non-base64 strings
        if (match.length % 4 !== 0) return match;

        const decoded = Buffer.from(match, "base64").toString("utf-8");
        // Check if decoded content looks like common English/Polish words or contains injection patterns
        if (/[\x20-\x7E]{4,}/.test(decoded)) {
          return decoded;
        }
      } catch {
        // ignore
      }
      return match;
    });

    // 3. To Lower Case (after decoding)
    normalized = normalized.toLowerCase();

    // 4. Strip Homoglyphs
    let homoglyphCleaned = "";
    for (const char of normalized) {
      homoglyphCleaned += HOMOGLYPH_MAP[char] || char;
    }
    normalized = homoglyphCleaned;

    // 5. Standardize whitespace
    normalized = normalized.replace(/[\s_]+/g, " ");

    return normalized;
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
