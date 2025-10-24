/**
 * WhisperService - OpenAI Whisper API Integration
 *
 * Provides audio-to-text transcription using OpenAI's Whisper model.
 * This service handles the first step of the expense transcription pipeline.
 */

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Thrown when the service is not properly configured (e.g., missing API key)
 */
export class WhisperConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhisperConfigurationError";
  }
}

/**
 * Thrown when OpenAI API returns an error status
 */
export class WhisperApiError extends Error {
  public readonly status: number;
  public readonly apiMessage: string;

  constructor(status: number, apiMessage: string) {
    super(`OpenAI Whisper API Error (${status}): ${apiMessage}`);
    this.name = "WhisperApiError";
    this.status = status;
    this.apiMessage = apiMessage;
  }
}

/**
 * Thrown when there are network connectivity issues
 */
export class WhisperNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhisperNetworkError";
  }
}

/**
 * Thrown when the audio file is invalid or unsupported
 */
export class InvalidAudioFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAudioFileError";
  }
}

/**
 * Thrown when the transcription result is empty or invalid
 */
export class InvalidTranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTranscriptionError";
  }
}

// ============================================================================
// Service Configuration & Parameters
// ============================================================================

export interface WhisperServiceConfig {
  apiKey?: string;
}

export interface TranscribeAudioParams {
  audioBlob: Blob;
  language?: string; // ISO 639-1 language code (e.g., 'pl', 'en')
  prompt?: string; // Optional context to guide transcription
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

// ============================================================================
// WhisperService Implementation
// ============================================================================

export class WhisperService {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://api.openai.com/v1";
  private readonly maxFileSize: number = 25 * 1024 * 1024; // 25MB limit
  private readonly supportedFormats = [
    "audio/flac",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
  ];

  constructor(config: WhisperServiceConfig = {}) {
    // Try to get API key from config or environment
    this.apiKey = config.apiKey || import.meta.env.OPENAI_API_KEY;

    // Guard clause: ensure API key is available
    if (!this.apiKey) {
      throw new WhisperConfigurationError("OPENAI_API_KEY is not set in environment variables.");
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Transcribes audio to text using OpenAI Whisper API
   *
   * @param params - Audio blob and optional language/prompt
   * @returns Promise resolving to transcription result with text
   * @throws {InvalidAudioFileError} When audio file is invalid or too large
   * @throws {WhisperApiError} When API returns an error status
   * @throws {WhisperNetworkError} When network connectivity fails
   * @throws {InvalidTranscriptionError} When transcription result is empty
   */
  public async transcribeAudio(params: TranscribeAudioParams): Promise<TranscriptionResult> {
    try {
      // Step 1: Validate audio file
      this.validateAudioFile(params.audioBlob);

      // Step 2: Prepare form data
      const formData = this.prepareFormData(params);

      // Step 3: Make API request
      const apiResponse = await this.makeApiRequest(formData);

      // Step 4: Parse and validate response
      const result = this.parseTranscriptionResponse(apiResponse);

      return result;
    } catch (error) {
      // Log the error for debugging purposes

      // Re-throw custom errors as-is
      if (
        error instanceof InvalidAudioFileError ||
        error instanceof WhisperApiError ||
        error instanceof WhisperNetworkError ||
        error instanceof InvalidTranscriptionError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(`Unexpected error in WhisperService: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Validates the audio file format and size
   */
  private validateAudioFile(audioBlob: Blob): void {
    // Guard clause: check file size
    if (audioBlob.size > this.maxFileSize) {
      throw new InvalidAudioFileError(
        `Audio file too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB, received: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // Guard clause: check MIME type
    if (audioBlob.type && !this.isSupportedFormat(audioBlob.type)) {
      throw new InvalidAudioFileError(
        `Unsupported audio format: ${audioBlob.type}. Supported formats: ${this.supportedFormats.join(", ")}`
      );
    }
  }

  /**
   * Checks if the audio format is supported
   */
  private isSupportedFormat(mimeType: string): boolean {
    return this.supportedFormats.some((format) => mimeType.startsWith(format) || mimeType.includes(format));
  }

  /**
   * Prepares FormData for the API request
   */
  private prepareFormData(params: TranscribeAudioParams): FormData {
    const formData = new FormData();

    // Add audio file with appropriate extension
    const extension = this.getFileExtension(params.audioBlob.type);
    formData.append("file", params.audioBlob, `audio.${extension}`);

    // Add model (whisper-1 is the only available model currently)
    formData.append("model", "whisper-1");

    // Add optional language
    if (params.language) {
      formData.append("language", params.language);
    }

    // Add optional prompt for context
    if (params.prompt) {
      formData.append("prompt", params.prompt);
    }

    // Request plain text response format
    formData.append("response_format", "json");

    return formData;
  }

  /**
   * Determines file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensionMap: Record<string, string> = {
      "audio/flac": "flac",
      "audio/mp3": "mp3",
      "audio/mpeg": "mp3",
      "audio/mp4": "mp4",
      "audio/m4a": "m4a",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
      "audio/webm": "webm",
    };

    return extensionMap[mimeType] || "webm"; // Default to webm
  }

  /**
   * Makes the HTTP request to OpenAI Whisper API
   */
  private async makeApiRequest(formData: FormData): Promise<any> {
    const url = `${this.baseUrl}/audio/transcriptions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // Note: Do NOT set Content-Type for FormData - browser sets it automatically with boundary
        },
        body: formData,
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

        throw new WhisperApiError(response.status, errorMessage);
      }

      // Parse and return the successful response
      return await response.json();
    } catch (error) {
      // Handle fetch-level errors (network issues, etc.)
      if (error instanceof WhisperApiError) {
        throw error;
      }

      // Network or other fetch errors
      throw new WhisperNetworkError(
        `Failed to connect to OpenAI Whisper API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parses and validates the transcription response
   */
  private parseTranscriptionResponse(apiResponse: any): TranscriptionResult {
    // Guard clause: check if text exists
    if (!apiResponse?.text || typeof apiResponse.text !== "string") {
      throw new InvalidTranscriptionError("Invalid API response: missing or invalid text field");
    }

    // Guard clause: check if transcription is not empty
    const trimmedText = apiResponse.text.trim();
    if (trimmedText.length === 0) {
      throw new InvalidTranscriptionError("Transcription resulted in empty text");
    }

    return {
      text: trimmedText,
      language: apiResponse.language,
      duration: apiResponse.duration,
    };
  }
}
